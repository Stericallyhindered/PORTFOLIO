import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:grannas_t56/ble/protocol.dart';
import 'package:grannas_t56/domain/models.dart';

void main() {
  test('parseLiveStatus decodes gear and channels', () {
    final data = Uint8List(22);
    data[0] = 3; // 3rd gear
    data[1] = 0x01; // outputs disabled
    // Input 0: 40.5% duty, 4.04ms period
    data[2] = 0xD2;
    data[3] = 0x0F;
    data[4] = 0x94;
    data[5] = 0x01;

    final status = parseLiveStatus(data);
    expect(status.gearIndex, 3);
    expect(status.outputsDisabled, isTrue);
    expect(status.inputs[0].dutyPct, closeTo(40.5, 0.01));
    expect(status.inputs[0].periodMs, closeTo(4.04, 0.01));
  });

  test('GearMappingPreset round-trip json', () {
    const preset = GearMappingPreset(
      id: 'test',
      name: 'Test',
      description: 'd',
      inputCount: 3,
      outputCount: 2,
      matchTolerancePct: 2,
      gears: [
        GearRow(
          gear: 'Neutral',
          inputs: [PwmChannelValues.zero, PwmChannelValues.zero, PwmChannelValues.zero],
          outputs: [PwmChannelValues.zero, PwmChannelValues.zero],
        ),
      ],
    );
    final restored = GearMappingPreset.fromJson(preset.toJson());
    expect(restored.id, 'test');
    expect(restored.gears.first.gear, 'Neutral');
  });

  test('buildConfigStartWrite encodes length', () {
    final buf = buildConfigStartWrite(1234);
    expect(buf[0], 0x01);
    expect(buf[1] | (buf[2] << 8) | (buf[3] << 16) | (buf[4] << 24), 1234);
  });
}
