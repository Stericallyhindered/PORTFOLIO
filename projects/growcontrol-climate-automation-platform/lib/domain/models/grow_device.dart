import 'package:flutter/foundation.dart';

/// Physical capability under Tuya (sensor vs switched outlet).
enum GrowHardwareKind {
  tempHumiditySensor,
  smartOutlet,
}

/// Logical role you assign after pairing (drives automation rules).
enum GrowDeviceRole {
  unassigned,
  canopySensor,
  humidifier,
  dehumidifier,
  exhaustFan,
  intakeFan,
  circulationFan,
  waterPump,
  lightOutlet,
  heater,
  genericOutlet,
}

@immutable
class GrowDevice {
  const GrowDevice({
    required this.id,
    required this.tuyaDeviceId,
    required this.name,
    required this.kind,
    this.role = GrowDeviceRole.unassigned,
    this.roomLabel,
  });

  final String id;
  final String tuyaDeviceId;
  final String name;
  final GrowHardwareKind kind;
  final GrowDeviceRole role;
  final String? roomLabel;

  GrowDevice copyWith({
    String? name,
    GrowDeviceRole? role,
    String? roomLabel,
  }) {
    return GrowDevice(
      id: id,
      tuyaDeviceId: tuyaDeviceId,
      name: name ?? this.name,
      kind: kind,
      role: role ?? this.role,
      roomLabel: roomLabel ?? this.roomLabel,
    );
  }
}
