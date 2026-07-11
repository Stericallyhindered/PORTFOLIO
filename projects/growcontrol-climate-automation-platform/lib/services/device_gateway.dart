import '../domain/models/grow_device.dart';

/// Contract for Tuya (or test doubles): discovery, naming, and outlet switching.
abstract class DeviceGateway {
  Stream<List<GrowDevice>> watchDevices();

  Future<void> refreshDevices();

  Future<void> renameDevice(String deviceId, String name);

  Future<void> setOutlet(String deviceId, bool on);

  /// Persist logical automation role (stored locally until Tuya UI mirrors it).
  Future<void> setDeviceRole(String deviceId, GrowDeviceRole role);
}
