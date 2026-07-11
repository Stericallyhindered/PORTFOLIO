import 'dart:math' as math;

import 'interpolation.dart';
import 'mode_bundle.dart';
import 'telemetry_snapshot.dart';

/// PDF **pre-control** proxy in PWM domain (accel, RPM, steer, yaw/ay context).
///
/// Training text ties pre-control inputs to accelerator pedal, engine torque/RPM,
/// vehicle speed, gear, steering (page 11) and cites **~40% front / ~60% rear**
/// axle torque in normal cruising — reflected via [ModeBundle.preControlBaselinePwm]
/// (typically ~40% of the 0–globalMax PWM actuator span when linearly interpreted).
double preControlPredictivePwm({
  required TelemetrySnapshot snap,
  required ModeBundle bundle,
  required double resolvedTorqueNm,
  required double profileMaxSteerDeg,
}) {
  final rpm = snap.engineRpm ?? 0;
  final tps = snap.tpsPercent;

  /// Piecewise-linear \(f(\mathrm{RPM})\) from tunable breakpoints.
  final rpmF =
      interpolatePiecewise(bundle.rpmBreakpoints, bundle.rpmFactors, rpm);

  final tCap = math.max(bundle.maxTorqueEstimateNm, 120);
  /// Longitudinal driver demand \(\in [0,1]\) from resolved torque lane.
  var demand = clampDouble(resolvedTorqueNm / tCap, 0, 1.15);
  if (tps != null) {
    /// Blend pedal when present (PDF: accelerator pedal value).
    final pedal = clampDouble(tps * 0.01, 0, 1.15);
    demand = clampDouble(math.max(demand, pedal * 0.92), 0, 1.25);
  }

  final steer = snap.steeringAngleDeg ?? 0;
  final steerFrac =
      clampDouble((steer.abs() / math.max(profileMaxSteerDeg, 1)), 0, 1);

  /// Tight-corner / maneuver relaxer (consistent with § parking-corner text).
  final steerRelax = 1.0 - 0.24 * steerFrac;

  double? accel;
  if (snap.lateralAccelG != null) {
    accel = snap.lateralAccelG!.abs();
  }
  final latBlend = accel == null
      ? 0.0
      : clampDouble(accel / 1.08, 0, 1) * 0.28;

  final shaped = demand * rpmF * steerRelax + latBlend;

  final baseline = bundle.preControlBaselinePwm;

  return clampDouble(
    baseline * (0.45 + 0.78 * clampDouble(shaped, 0, 2.2)),
    0,
    bundle.maxPwm,
  );
}

/// PDF **traction / dynamics** + **tire tolerance** overlays (wheel speeds interpreted via yaw/lat).
double applyPdfDynamicsAndTire({
  required double pwm,
  required TelemetrySnapshot snap,
  required ModeBundle bundle,
}) {
  final rules = bundle.pdfRules;
  if (!rules.enabled) return pwm;

  var out = pwm;

  if (rules.applyDynamicsOversteerBoost && snap.yawDegPerSec != null) {
    final yaw = snap.yawDegPerSec!;
    final oversteerMag = rules.yawOversteerSignPositiveIsRearOut
        ? yaw.clamp(0.0, 180.0)
        : (-yaw).clamp(0.0, 180.0);
    if (oversteerMag > 2.8) {
      final mag = (oversteerMag / 85.0).clamp(0.0, 1.0);
      out *= 1.0 + rules.yawOversteerBoostGain * mag;
    }
  }

  if (rules.applyDynamicsUndersteerCut &&
      snap.yawDegPerSec != null &&
      snap.lateralAccelG != null) {
    final ay = snap.lateralAccelG!.abs();
    final yawAbs = snap.yawDegPerSec!.abs();
    if (ay > rules.understeerLateralGThreshold &&
        yawAbs < rules.understeerYawQuietDegPerSec) {
      final depth = clampDouble(
        (ay - rules.understeerLateralGThreshold) /
            math.max(0.08, (1.0 - rules.understeerLateralGThreshold)),
        0,
        3,
      );
      out *= 1.0 - rules.understeerCutGain * depth.clamp(0, 0.85);
    }
  }

  if (rules.applyTireToleranceScaling) {
    /// Page 14: lower locking authority when circumference mismatch / tire slip budget is prioritized.
    out *= rules.tireTolerancePwmMultiplier;
  }

  return clampDouble(out, 0, bundle.maxPwm);
}

/// Hard behaviour gates referenced in training text — speed cap / tight-corner + low torque.
double applyPdfHardBehaviorGates({
  required double pwm,
  required TelemetrySnapshot snap,
  required ModeBundle bundle,
  required double resolvedTorqueNm,
}) {
  var out = pwm;
  final rules = bundle.pdfRules;
  if (!rules.enabled) return out;

  if (rules.applySpeedDeactivate && snap.vehicleSpeedKmh != null) {
    final v = snap.vehicleSpeedKmh!.abs();
    if (v >= rules.speedDeactivateKmh - 1e-6) {
      out *= rules.highSpeedPwmRetainFactor.clamp(0.0, 1.05);
    }
  }

  if (rules.applyTightCornerLowTorqueRelax &&
      snap.steeringAngleDeg != null &&
      resolvedTorqueNm <= rules.tightCornerEngineTorqueBelowNm &&
      snap.steeringAngleDeg!.abs() >= rules.tightCornerSteeringAbsDeg - 1e-6) {
    out *= 1.0 - rules.tightCornerRelaxFactor;
  }

  return clampDouble(out, bundle.minPwm, bundle.maxPwm);
}
