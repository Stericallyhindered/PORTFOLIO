import 'package:flutter/foundation.dart';

import 'grow_device.dart';

@immutable
class OutletEvent {
  const OutletEvent({
    required this.id,
    required this.deviceId,
    required this.role,
    required this.on,
    required this.at,
    required this.reason,
  });

  final String id;
  final String deviceId;
  final GrowDeviceRole role;
  final bool on;
  final DateTime at;
  final String reason;

  Map<String, dynamic> toJson() => {
        'id': id,
        'deviceId': deviceId,
        'role': role.name,
        'on': on,
        'at': at.toIso8601String(),
        'reason': reason,
      };

  factory OutletEvent.fromJson(Map<String, dynamic> j) {
    return OutletEvent(
      id: j['id'] as String,
      deviceId: j['deviceId'] as String,
      role: GrowDeviceRole.values.byName(j['role'] as String),
      on: j['on'] as bool,
      at: DateTime.parse(j['at'] as String),
      reason: j['reason'] as String,
    );
  }
}
