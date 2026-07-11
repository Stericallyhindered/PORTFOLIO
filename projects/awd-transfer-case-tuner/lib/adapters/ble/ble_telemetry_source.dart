import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../../domain/telemetry_snapshot.dart';
import '../../ports/telemetry_source.dart';

/// Live BLE telemetry: emits **only** decoded frames from the device — never synthetic samples.
class BleTelemetrySource implements TelemetrySource {
  BleTelemetrySource();

  BluetoothDevice? _device;
  StreamController<TelemetrySnapshot>? _controller;

  void attachDevice(BluetoothDevice? device) {
    _controller?.close();
    _controller = null;
    _device = device;
    if (device == null) return;
    _controller = StreamController<TelemetrySnapshot>.broadcast();
    // Codec hooks: subscribe to notify characteristic here when UUIDs are known.
    // Until then, stream stays open with zero emissions while connected.
  }

  @override
  bool get isLive => _device != null && _device!.isConnected;

  @override
  Stream<TelemetrySnapshot>? get stream => _controller?.stream;

  @override
  void dispose() {
    _controller?.close();
    _controller = null;
    _device = null;
  }
}
