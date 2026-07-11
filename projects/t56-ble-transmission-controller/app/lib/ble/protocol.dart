import 'dart:convert';
import 'dart:typed_data';

import '../ble/uuids.dart';
import '../domain/models.dart';

LiveDeviceStatus parseLiveStatus(List<int> data) {
  if (data.length < 22) return LiveDeviceStatus.empty;

  final gearIndex = data[0];
  final flags = data[1];
  double readU16(int offset) => (data[offset] | (data[offset + 1] << 8)) / 100.0;

  final inputs = <LiveChannelReading>[];
  var off = 2;
  for (var i = 0; i < 3; i++) {
    inputs.add(LiveChannelReading(
      dutyPct: readU16(off),
      periodMs: readU16(off + 2),
    ));
    off += 4;
  }
  final outputs = <LiveChannelReading>[];
  for (var i = 0; i < 2; i++) {
    outputs.add(LiveChannelReading(
      dutyPct: readU16(off),
      periodMs: readU16(off + 2),
    ));
    off += 4;
  }

  return LiveDeviceStatus(
    gearIndex: gearIndex,
    outputsDisabled: (flags & 0x01) != 0,
    configDirty: (flags & 0x02) != 0,
    inputs: inputs,
    outputs: outputs,
  );
}

Uint8List buildConfigStartWrite(int totalLen) {
  final buf = ByteData(5);
  buf.setUint8(0, kConfigOpcodeStartWrite);
  buf.setUint32(1, totalLen, Endian.little);
  return buf.buffer.asUint8List();
}

Uint8List buildConfigChunk(int index, List<int> payload) {
  final buf = BytesBuilder();
  buf.addByte(index & 0xFF);
  buf.addByte((index >> 8) & 0xFF);
  buf.add(payload);
  return buf.toBytes();
}

Uint8List buildConfigCommit() => Uint8List.fromList([kConfigOpcodeCommit]);

Uint8List buildConfigResetDefault() =>
    Uint8List.fromList([kConfigOpcodeResetDefault]);

String presetToJson(GearMappingPreset preset) =>
    jsonEncode(preset.toJson());

List<int> chunkPresetJson(String json) {
  final bytes = utf8.encode(json);
  final chunks = <List<int>>[];
  for (var i = 0; i < bytes.length; i += kConfigChunkPayload) {
    final end = (i + kConfigChunkPayload < bytes.length)
        ? i + kConfigChunkPayload
        : bytes.length;
    chunks.add(bytes.sublist(i, end));
  }
  if (chunks.isEmpty) chunks.add([]);
  return bytes;
}

Uint8List buildOtaBegin(int size, List<int> sha256) {
  final buf = BytesBuilder();
  buf.addByte(kOtaOpcodeBegin);
  final len = ByteData(4)..setUint32(0, size, Endian.little);
  buf.add(len.buffer.asUint8List());
  buf.add(sha256);
  return buf.toBytes();
}

Uint8List buildOtaFinalize() => Uint8List.fromList([kOtaOpcodeFinalize]);

Uint8List buildOtaAbort() => Uint8List.fromList([kOtaOpcodeAbort]);
