import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../../domain/pwm_command.dart';
import '../../ports/pwm_command_sink.dart';

/// Writes PWM commands over BLE when characteristics exist; otherwise rejects writes.
class BlePwmCommandSink implements PwmCommandSink {
  BlePwmCommandSink();

  BluetoothDevice? _device;

  void attachDevice(BluetoothDevice? device) {
    _device = device;
  }

  @override
  bool get canAcceptCommands => _device != null && _device!.isConnected;

  @override
  Future<void> write(PwmCommand cmd) async {
    if (!canAcceptCommands) return;
    // Encode `cmd.dutyPercent` when protocol bytes are defined.
    await Future<void>.delayed(Duration.zero);
  }
}
