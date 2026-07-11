import 'package:flutter/foundation.dart';

/// One humidifier “pull up” between on/off (RH climbing while load runs).
@immutable
class HumidifierRampRecord {
  const HumidifierRampRecord({
    required this.startedAt,
    required this.endedAt,
    required this.rhStart,
    required this.rhEnd,
    required this.tempCAvg,
  });

  final DateTime startedAt;
  final DateTime endedAt;
  final double rhStart;
  final double rhEnd;
  final double tempCAvg;

  Duration get duration => endedAt.difference(startedAt);

  double get rhPerMinute =>
      (rhEnd - rhStart) / (duration.inSeconds / 60).clamp(0.25, double.infinity);

  Map<String, dynamic> toJson() => {
        'startedAt': startedAt.toIso8601String(),
        'endedAt': endedAt.toIso8601String(),
        'rhStart': rhStart,
        'rhEnd': rhEnd,
        'tempCAvg': tempCAvg,
      };

  factory HumidifierRampRecord.fromJson(Map<String, dynamic> j) {
    return HumidifierRampRecord(
      startedAt: DateTime.parse(j['startedAt'] as String),
      endedAt: DateTime.parse(j['endedAt'] as String),
      rhStart: (j['rhStart'] as num).toDouble(),
      rhEnd: (j['rhEnd'] as num).toDouble(),
      tempCAvg: (j['tempCAvg'] as num).toDouble(),
    );
  }
}
