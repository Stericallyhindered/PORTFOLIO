import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

/// Wraps FlutterBluePlus scan/connect without inventing telemetry.
class BleConnectionService {
  BluetoothDevice? _device;

  BluetoothDevice? get device => _device;

  Stream<BluetoothAdapterState> get adapterState => FlutterBluePlus.adapterState;

  Future<void> startScan({Duration timeout = const Duration(seconds: 8)}) {
    return FlutterBluePlus.startScan(timeout: timeout);
  }

  Future<void> stopScan() => FlutterBluePlus.stopScan();

  Future<void> connect(BluetoothDevice d) async {
    await d.connect(timeout: const Duration(seconds: 15));
    _device = d;
  }

  Future<void> disconnect() async {
    final d = _device;
    if (d != null) {
      await d.disconnect();
    }
    _device = null;
  }

  void attachForTransport(BluetoothDevice? d) {
    _device = d;
  }
}
