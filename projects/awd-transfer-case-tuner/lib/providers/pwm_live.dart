import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/pwm_engine.dart';
import '../domain/telemetry_snapshot.dart';
import 'app_providers.dart';

final pwmLiveProvider =
    StateNotifierProvider<PwmLiveNotifier, PwmComputeResult?>((ref) {
  return PwmLiveNotifier(ref);
});

class PwmLiveNotifier extends StateNotifier<PwmComputeResult?> {
  PwmLiveNotifier(this.ref) : super(null);

  final Ref ref;
  final PwmEngine _engine = PwmEngine();
  final PwmEngineState _state = PwmEngineState();

  void onTelemetry(TelemetrySnapshot snap) {
    final profile = ref.read(profileProvider);
    final mode = ref.read(selectedModeProvider);
    state = _engine.compute(
      snap: snap,
      profile: profile,
      mode: mode,
      state: _state,
    );
  }

  void resetSlew() {
    _state.previousPwm = 0;
    state = null;
  }
}
