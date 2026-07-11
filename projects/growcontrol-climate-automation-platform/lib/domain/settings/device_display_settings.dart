import 'package:flutter/foundation.dart';

@immutable
class DeviceDisplaySettings {
  const DeviceDisplaySettings({
    required this.deviceId,
    required this.displayName,
    this.notes,
  });

  final String deviceId;
  final String displayName;
  final String? notes;

  DeviceDisplaySettings copyWith({
    String? displayName,
    String? notes,
    bool clearNotes = false,
  }) {
    return DeviceDisplaySettings(
      deviceId: deviceId,
      displayName: displayName ?? this.displayName,
      notes: clearNotes ? null : (notes ?? this.notes),
    );
  }

  Map<String, dynamic> toJson() => {
        'deviceId': deviceId,
        'displayName': displayName,
        if (notes != null) 'notes': notes,
      };

  factory DeviceDisplaySettings.fromJson(Map<String, dynamic> j) {
    return DeviceDisplaySettings(
      deviceId: j['deviceId'] as String,
      displayName: j['displayName'] as String,
      notes: j['notes'] as String?,
    );
  }
}
