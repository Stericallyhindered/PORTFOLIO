import 'package:awd_tuner/domain/default_profile.dart';
import 'package:awd_tuner/domain/preset_mode_id.dart';
import 'package:awd_tuner/domain/pwm_engine.dart';
import 'package:awd_tuner/domain/selected_mode.dart';
import 'package:awd_tuner/domain/telemetry_snapshot.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('driftRwd forces zero with valid inputs', () {
    final profile = createDefaultProfile();
    final eng = PwmEngine();
    final st = PwmEngineState();
    const snap = TelemetrySnapshot(
      engineTorqueNm: 200,
      vFl: 10,
      vFr: 10,
      vRl: 12,
      vRr: 12,
      gear: 3,
    );
    final r = eng.compute(
      snap: snap,
      profile: profile,
      mode: const SelectedPreset(PresetModeId.driftRwd),
      state: st,
    );
    expect(r.pwm, 0);
    expect(r.inputsValid, true);
  });

  test('autoAwd needs torque and slip', () {
    final profile = createDefaultProfile();
    final eng = PwmEngine();
    final st = PwmEngineState(previousPwm: 5);
    final r = eng.compute(
      snap: const TelemetrySnapshot(),
      profile: profile,
      mode: const SelectedPreset(PresetModeId.autoAwd),
      state: st,
    );
    expect(r.inputsValid, false);
    expect(r.pwm, 5);
  });

  test('autoAwd clamps inside global span with bilinear + layered math', () {
    final profile = createDefaultProfile();
    final eng = PwmEngine();
    final st = PwmEngineState(previousPwm: 0);
    final snap = TelemetrySnapshot(
      engineTorqueNm: 300,
      vFl: 50,
      vFr: 49,
      vRl: 51,
      vRr: 50,
      gear: 4,
      steeringAngleDeg: 30,
      tpsPercent: 40,
      engineRpm: 3200,
      yawDegPerSec: 8,
      lateralAccelG: 0.35,
      vehicleSpeedKmh: 80,
    );
    final r = eng.compute(
      snap: snap,
      profile: profile,
      mode: const SelectedPreset(PresetModeId.autoAwd),
      state: st,
    );
    expect(r.inputsValid, true);
    expect(r.pwm, greaterThanOrEqualTo(0));
    expect(r.pwm, lessThanOrEqualTo(profile.globalMaxPwm));
    expect(r.pwmMap, isNotNull);
    expect(r.pwmPred, isNotNull);
  });
}
