import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BleConnectionService {
  BluetoothDevice? _device;

  BluetoothDevice? get device => _device;
  bool get isConnected => _device != null && _device!.isConnected;

  Stream<BluetoothAdapterState> get adapterState => FlutterBluePlus.adapterState;

  Stream<List<ScanResult>> get scanResults => FlutterBluePlus.scanResults;

  Future<void> startScan({Duration timeout = const Duration(seconds: 10)}) {
    return FlutterBluePlus.startScan(timeout: timeout);
  }

  Future<void> stopScan() => FlutterBluePlus.stopScan();

  Future<void> connect(BluetoothDevice d) async {
    await FlutterBluePlus.stopScan();
    await d.connect(timeout: const Duration(seconds: 15));
    await d.requestMtu(517);
    _device = d;
  }

  Future<void> disconnect() async {
    final d = _device;
    if (d != null) {
      await d.disconnect();
    }
    _device = null;
  }
}
