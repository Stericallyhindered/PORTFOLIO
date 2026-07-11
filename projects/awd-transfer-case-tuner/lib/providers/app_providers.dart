import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../adapters/ble/ble_pwm_command_sink.dart';
import '../adapters/ble/ble_telemetry_source.dart';
import '../domain/default_profile.dart';
import '../domain/mode_bundle.dart';
import '../domain/preset_mode_id.dart';
import '../domain/profile.dart';
import '../domain/selected_mode.dart';
import '../domain/telemetry_snapshot.dart';
import '../services/ble_connection_service.dart';
import '../services/profile_storage.dart';

final bleServiceProvider = Provider<BleConnectionService>((ref) {
  final s = BleConnectionService();
  ref.onDispose(s.disconnect);
  return s;
});

final bleTelemetrySourceProvider = Provider<BleTelemetrySource>((ref) {
  final source = BleTelemetrySource();
  ref.onDispose(source.dispose);
  return source;
});

final blePwmSinkProvider = Provider<BlePwmCommandSink>((ref) {
  final sink = BlePwmCommandSink();
  return sink;
});

final profileStorageProvider = Provider<ProfileStorage>((ref) => ProfileStorage());

final profileProvider = NotifierProvider<ProfileController, Profile>(ProfileController.new);

class ProfileController extends Notifier<Profile> {
  @override
  Profile build() {
    return createDefaultProfile();
  }

  Future<void> load() async {
    final storage = ref.read(profileStorageProvider);
    final p = await storage.load();
    if (p != null) {
      state = p;
    }
  }

  Future<void> save() async {
    await ref.read(profileStorageProvider).save(state);
  }

  void replace(Profile p) {
    state = p;
  }

  void setBundleForPreset(PresetModeId id, ModeBundle bundle) {
    state = state.copyWith(
      presets: {...state.presets, id: bundle},
    );
  }

  void updateCustom(int slotId, {String? name, ModeBundle? bundle}) {
    final list = state.customSlots.map((s) {
      if (s.slotId != slotId) return s;
      return s.copyWith(
        displayName: name ?? s.displayName,
        bundle: bundle ?? s.bundle,
      );
    }).toList();
    state = state.copyWith(customSlots: list);
  }
}

final selectedModeProvider = NotifierProvider<SelectedModeController, SelectedMode>(SelectedModeController.new);

class SelectedModeController extends Notifier<SelectedMode> {
  @override
  SelectedMode build() => const SelectedPreset(PresetModeId.autoAwd);

  void set(SelectedMode m) {
    state = m;
  }
}

/// Last frames from BLE; yields `null` when disconnected or before first frame (never fabricated).
final telemetryProvider = StreamProvider.autoDispose<TelemetrySnapshot?>((ref) async* {
  final src = ref.watch(bleTelemetrySourceProvider);
  final stream = src.stream;
  if (stream == null) {
    yield null;
    return;
  }
  yield null;
  await for (final e in stream) {
    yield e;
  }
});

void syncBleTransports(WidgetRef ref) {
  final d = ref.read(bleServiceProvider).device;
  ref.read(bleTelemetrySourceProvider).attachDevice(d);
  ref.read(blePwmSinkProvider).attachDevice(d);
}
