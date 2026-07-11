import 'dart:async';

import 'package:growcontrol/domain/models/grow_device.dart';
import 'package:growcontrol/services/device_gateway.dart';

/// Minimal [DeviceGateway] for widget tests only — not used in production code.
class FakeDeviceGateway implements DeviceGateway {
  FakeDeviceGateway() {
    _controller.add(const []);
  }

  final _controller = StreamController<List<GrowDevice>>.broadcast();

  @override
  Stream<List<GrowDevice>> watchDevices() => _controller.stream;

  @override
  Future<void> refreshDevices() async {}

  @override
  Future<void> renameDevice(String deviceId, String name) async {}

  @override
  Future<void> setOutlet(String deviceId, bool on) async {}

  @override
  Future<void> setDeviceRole(String deviceId, GrowDeviceRole role) async {}

  void dispose() => _controller.close();
}
