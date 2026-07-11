import 'dart:async';
import 'dart:convert';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../ble/protocol.dart';
import '../ble/uuids.dart';
import '../domain/models.dart';

class BleDeviceClient {
  BleDeviceClient(this._device);

  final BluetoothDevice _device;
  BluetoothCharacteristic? _liveStatus;
  BluetoothCharacteristic? _configControl;
  BluetoothCharacteristic? _configData;
  BluetoothCharacteristic? _activePreset;
  BluetoothCharacteristic? _otaControl;
  BluetoothCharacteristic? _otaData;
  StreamSubscription<List<int>>? _statusSub;

  final _statusController = StreamController<LiveDeviceStatus>.broadcast();

  Stream<LiveDeviceStatus> get statusStream => _statusController.stream;

  Future<void> discover() async {
    final services = await _device.discoverServices();
    for (final s in services) {
      if (s.uuid.str.toLowerCase() != kServiceUuid.toLowerCase()) continue;
      for (final c in s.characteristics) {
        final id = c.uuid.str.toLowerCase();
        if (id == kLiveStatusUuid.toLowerCase()) _liveStatus = c;
        if (id == kConfigControlUuid.toLowerCase()) _configControl = c;
        if (id == kConfigDataUuid.toLowerCase()) _configData = c;
        if (id == kActivePresetUuid.toLowerCase()) _activePreset = c;
        if (id == kOtaControlUuid.toLowerCase()) _otaControl = c;
        if (id == kOtaDataUuid.toLowerCase()) _otaData = c;
      }
    }
    if (_liveStatus == null) {
      throw StateError('Grannas-T56 service not found on device');
    }
  }

  Future<DeviceInfo> readDeviceInfo() async {
    final services = await _device.discoverServices();
    for (final s in services) {
      for (final c in s.characteristics) {
        if (c.uuid.str.toLowerCase() == kDeviceInfoUuid.toLowerCase()) {
          final raw = await c.read();
          final json = jsonDecode(utf8.decode(raw)) as Map<String, dynamic>;
          return DeviceInfo.fromJson(json);
        }
      }
    }
    throw StateError('deviceInfo characteristic not found');
  }

  Future<void> startLiveNotifications() async {
    if (_liveStatus == null) await discover();
    await _statusSub?.cancel();
    await _liveStatus!.setNotifyValue(true);
    _statusSub = _liveStatus!.onValueReceived.listen((data) {
      _statusController.add(parseLiveStatus(data));
    });
    final initial = await _liveStatus!.read();
    _statusController.add(parseLiveStatus(initial));
  }

  Future<void> stopLiveNotifications() async {
    await _statusSub?.cancel();
    _statusSub = null;
    if (_liveStatus != null) {
      await _liveStatus!.setNotifyValue(false);
    }
  }

  Future<void> writeActivePresetId(String presetId) async {
    if (_activePreset == null) await discover();
    await _activePreset!.write(utf8.encode(presetId), withoutResponse: false);
  }

  Future<void> pushPreset(GearMappingPreset preset) async {
    if (_configControl == null || _configData == null) await discover();
    final json = presetToJson(preset);
    final bytes = utf8.encode(json);

    await _configControl!.write(
      buildConfigStartWrite(bytes.length),
      withoutResponse: false,
    );

    var offset = 0;
    var chunkIndex = 0;
    while (offset < bytes.length) {
      final end = (offset + kConfigChunkPayload < bytes.length)
          ? offset + kConfigChunkPayload
          : bytes.length;
      final chunk = bytes.sublist(offset, end);
      await _configData!.write(
        buildConfigChunk(chunkIndex, chunk),
        withoutResponse: false,
      );
      offset = end;
      chunkIndex++;
    }

    await _configControl!.write(buildConfigCommit(), withoutResponse: false);
    final resp = await _configData!.read();
    if (resp.isEmpty || resp[0] != 0) {
      throw StateError('Config commit failed (code ${resp.isEmpty ? '?' : resp[0]})');
    }
    await writeActivePresetId(preset.id);
  }

  Future<void> resetDeviceDefault() async {
    if (_configControl == null || _configData == null) await discover();
    await _configControl!.write(buildConfigResetDefault(), withoutResponse: false);
    final resp = await _configData!.read();
    if (resp.isEmpty || resp[0] != 0) {
      throw StateError('Reset failed');
    }
  }

  Future<void> performOta(
    List<int> firmwareBytes,
    List<int> sha256, {
    void Function(double progress)? onProgress,
  }) async {
    if (_otaControl == null || _otaData == null || _configData == null) {
      await discover();
    }

    await _otaControl!.write(
      buildOtaBegin(firmwareBytes.length, sha256),
      withoutResponse: false,
    );
    final beginResp = await _configData!.read();
    if (beginResp.isEmpty || beginResp[0] != 0) {
      throw StateError('OTA begin rejected');
    }

    var sent = 0;
    while (sent < firmwareBytes.length) {
      final end = (sent + kOtaChunkPayload < firmwareBytes.length)
          ? sent + kOtaChunkPayload
          : firmwareBytes.length;
      await _otaData!.write(
        firmwareBytes.sublist(sent, end),
        withoutResponse: true,
      );
      sent = end;
      onProgress?.call(sent / firmwareBytes.length);
    }

    await _otaControl!.write(buildOtaFinalize(), withoutResponse: false);
  }

  Future<void> dispose() async {
    await stopLiveNotifications();
    await _statusController.close();
  }
}
