import 'interpolation.dart';
import 'mode_bundle.dart';
import 'predictive_layer.dart';
import 'preset_mode_id.dart';
import 'profile.dart';
import 'selected_mode.dart';
import 'slip_resolve.dart';
import 'telemetry_snapshot.dart';
import 'torque_estimate.dart';

class PwmEngineState {
  PwmEngineState({this.previousPwm = 0});

  double previousPwm;
}

class PwmComputeResult {
  PwmComputeResult({
    required this.pwm,
    required this.effectiveLockPercent,
    required this.inputsValid,
    this.torqueInNm,
    this.slipScalar,
    this.pwmMap,
    this.pwmPred,
    this.pwmAfterAlpha,
    this.pwmAfterDynamics,
    this.pwmAfterGearSteerClamp,
    this.pwmAfterDragGate,
    this.pwmAfterPdfGates,
  });

  final double pwm;

  /// Actuator \(\%\) \(\rightarrow\) coupling display \(\%\): \(PWM/40\cdot 100\) when globalMax=40.
  final double effectiveLockPercent;
  final bool inputsValid;

  final double? torqueInNm;
  final double? slipScalar;
  final double? pwmMap;
  final double? pwmPred;
  final double? pwmAfterAlpha;
  final double? pwmAfterDynamics;
  final double? pwmAfterGearSteerClamp;
  final double? pwmAfterDragGate;
  final double? pwmAfterPdfGates;
}

class PwmEngine {
  PwmComputeResult compute({
    required TelemetrySnapshot snap,
    required Profile profile,
    required SelectedMode mode,
    required PwmEngineState state,
  }) {
    final gMax = profile.globalMaxPwm;
    final bundle = _bundleFor(mode, profile);

    if (mode is SelectedPreset && mode.preset == PresetModeId.driftRwd) {
      final dmax = _effectiveDeltaMax(profile, bundle);
      final ramped = _slew(
        previous: state.previousPwm,
        target: 0,
        deltaMax: dmax,
        outputMax: gMax,
      );
      state.previousPwm = ramped;
      return PwmComputeResult(
        pwm: ramped,
        effectiveLockPercent: ramped / gMax * 100,
        inputsValid: true,
        pwmAfterPdfGates: 0,
      );
    }

    final torqueNm = _resolveTorqueNm(snap, bundle);
    final slipY = resolveSlipScalar(snap, bundle.slipInputMode);
    final slipDragRaw = slipRawKmhForDragGate(snap);

    if (torqueNm == null || slipY == null || slipDragRaw == null) {
      return PwmComputeResult(
        pwm: state.previousPwm,
        effectiveLockPercent: state.previousPwm / gMax * 100,
        inputsValid: false,
      );
    }

    final pwmMap = bilinearInterp(
      torqueIn: torqueNm,
      slipIn: slipY,
      torqueAxis: bundle.xAxis,
      slipAxis: bundle.yAxis,
      map: bundle.map,
    );

    final pwmPred = preControlPredictivePwm(
      snap: snap,
      bundle: bundle,
      resolvedTorqueNm: torqueNm,
      profileMaxSteerDeg: profile.maxSteerAngleDeg,
    );

    final pwmMix = bundle.alpha * pwmMap + (1.0 - bundle.alpha) * pwmPred;

    final pwmDyn =
        applyPdfDynamicsAndTire(pwm: pwmMix, snap: snap, bundle: bundle);

    final gear = snap.gear ?? 1;
    final gearFactor = bundle.gearFactors[gear] ?? 1.0;

    final steer = snap.steeringAngleDeg ?? 0.0;
    final steerFactor = 1.0 -
        bundle.kSteer *
            (steer.abs() / profile.maxSteerAngleDeg).clamp(0.0, 1.0);

    var pwmScaled = pwmDyn * gearFactor * steerFactor.clamp(0.0, 1.0);
    pwmScaled = clampDouble(pwmScaled, bundle.minPwm, bundle.maxPwm);

    final applyDragGate = switch (mode) {
      SelectedPreset(:final preset) =>
        preset == PresetModeId.drag || bundle.dragSlipGateEnabled,
      SelectedCustom() => bundle.dragSlipGateEnabled,
    };
    final pwmAfterDrag = (applyDragGate &&
            slipDragRaw <= bundle.slipThresholdDrag)
        ? 0.0
        : pwmScaled;

    final pwmAfterPdf = applyPdfHardBehaviorGates(
      pwm: pwmAfterDrag,
      snap: snap,
      bundle: bundle,
      resolvedTorqueNm: torqueNm,
    );

    final dmax = _effectiveDeltaMax(profile, bundle);
    final ramped = _slew(
      previous: state.previousPwm,
      target: pwmAfterPdf,
      deltaMax: dmax,
      outputMax: gMax,
    );
    state.previousPwm = ramped;

    return PwmComputeResult(
      pwm: ramped,
      effectiveLockPercent: ramped / gMax * 100,
      inputsValid: true,
      torqueInNm: torqueNm,
      slipScalar: slipY,
      pwmMap: pwmMap,
      pwmPred: pwmPred,
      pwmAfterAlpha: pwmMix,
      pwmAfterDynamics: pwmDyn,
      pwmAfterGearSteerClamp: pwmScaled,
      pwmAfterDragGate: pwmAfterDrag,
      pwmAfterPdfGates: pwmAfterPdf,
    );
  }

  ModeBundle _bundleFor(SelectedMode mode, Profile profile) {
    return switch (mode) {
      SelectedPreset(:final preset) => profile.bundleForPreset(preset),
      SelectedCustom(:final slotId) => profile.bundleForCustom(slotId),
    };
  }

  double? _resolveTorqueNm(TelemetrySnapshot snap, ModeBundle bundle) {
    if (bundle.useTorqueEstimate) {
      final tps = snap.tpsPercent;
      final rpm = snap.engineRpm;
      if (tps == null) return null;
      return torqueEstimateTpsMaxRpm(
        tpsPercent: tps,
        maxTorqueNm: bundle.maxTorqueEstimateNm,
        rpmBreakpoints: bundle.rpmBreakpoints,
        rpmFactors: bundle.rpmFactors,
        rpm: rpm ?? 0,
      );
    }
    return snap.engineTorqueNm;
  }

  double _effectiveDeltaMax(Profile profile, ModeBundle bundle) {
    final hz = profile.telemetryHz;
    if (bundle.rampTimeSec > 1e-6 && hz > 1e-6) {
      final fromRamp = deltaMaxFromRamp(
        minPwm: bundle.minPwm,
        maxPwm: bundle.maxPwm,
        rampTimeSec: bundle.rampTimeSec.clamp(0.02, 2.5),
        telemetryHz: hz,
      );
      if (fromRamp > 1e-6) return fromRamp;
    }
    return bundle.deltaMaxPwm;
  }

  double _slew({
    required double previous,
    required double target,
    required double deltaMax,
    required double outputMax,
  }) {
    final delta = target - previous;
    final clamped = clampDouble(delta, -deltaMax, deltaMax);
    return clampDouble(previous + clamped, 0, outputMax);
  }
}

double? slipRawKmhForDragGate(TelemetrySnapshot s) {
  if (!s.hasWheelSpeeds) return null;
  final front = (s.vFl! + s.vFr!) / 2.0;
  final rear = (s.vRl! + s.vRr!) / 2.0;
  return rear - front;
}
