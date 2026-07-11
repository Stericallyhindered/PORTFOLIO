import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/models.dart';
import '../services/ble_connection_service.dart';
import '../services/ble_device_client.dart';
import '../services/local_preset_store.dart';

final bleConnectionProvider = Provider((ref) => BleConnectionService());

final localPresetStoreProvider = Provider((ref) => LocalPresetStore());

final bundledPresetsProvider = FutureProvider((ref) async {
  return ref.read(localPresetStoreProvider).loadBundledPresets();
});

class ActivePresetNotifier extends StateNotifier<AsyncValue<GearMappingPreset?>> {
  ActivePresetNotifier(this._store) : super(const AsyncValue.loading()) {
    load();
  }

  final LocalPresetStore _store;

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final active = await _store.loadActivePreset();
      if (active != null) {
        state = AsyncValue.data(active);
        return;
      }
      final bundled = await _store.loadBundledPresets();
      state = AsyncValue.data(bundled.first);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> setPreset(GearMappingPreset preset) async {
    await _store.saveActivePreset(preset);
    state = AsyncValue.data(preset);
  }

  Future<void> updatePreset(GearMappingPreset preset) async {
    await _store.saveActivePreset(preset);
    state = AsyncValue.data(preset);
  }
}

final activePresetProvider =
    StateNotifierProvider<ActivePresetNotifier, AsyncValue<GearMappingPreset?>>(
  (ref) => ActivePresetNotifier(ref.read(localPresetStoreProvider)),
);

final bleDeviceClientProvider = StateProvider<BleDeviceClient?>((ref) => null);

final liveStatusProvider = StreamProvider<LiveDeviceStatus>((ref) {
  final client = ref.watch(bleDeviceClientProvider);
  if (client == null) {
    return Stream.value(LiveDeviceStatus.empty);
  }
  return client.statusStream;
});

final deviceInfoProvider = FutureProvider<DeviceInfo?>((ref) async {
  final client = ref.watch(bleDeviceClientProvider);
  if (client == null) return null;
  return client.readDeviceInfo();
});

final isConnectedProvider = Provider<bool>((ref) {
  return ref.watch(bleConnectionProvider).isConnected;
});
