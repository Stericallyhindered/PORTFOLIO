import 'package:flutter/foundation.dart';

@immutable
class SensorSample {
  const SensorSample({
    required this.timestamp,
    required this.tempC,
    required this.rhPercent,
    required this.vpdKpa,
    this.sourceDeviceId,
  });

  final DateTime timestamp;
  final double tempC;
  final double rhPercent;
  final double vpdKpa;
  final String? sourceDeviceId;

  Map<String, dynamic> toJson() => {
        't': timestamp.toIso8601String(),
        'tempC': tempC,
        'rh': rhPercent,
        'vpd': vpdKpa,
        if (sourceDeviceId != null) 'src': sourceDeviceId,
      };

  factory SensorSample.fromJson(Map<String, dynamic> j) {
    return SensorSample(
      timestamp: DateTime.parse(j['t'] as String),
      tempC: (j['tempC'] as num).toDouble(),
      rhPercent: (j['rh'] as num).toDouble(),
      vpdKpa: (j['vpd'] as num).toDouble(),
      sourceDeviceId: j['src'] as String?,
    );
  }
}
