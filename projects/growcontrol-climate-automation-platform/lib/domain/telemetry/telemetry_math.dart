import '../models/sensor_sample.dart';

/// Buckets samples for dense charts (max ~500 points).
List<SensorSample> downsampleSeries(
  List<SensorSample> sorted,
  int maxPoints,
) {
  if (sorted.length <= maxPoints) return sorted;
  final step = sorted.length / maxPoints;
  final out = <SensorSample>[];
  for (var i = 0; i < maxPoints; i++) {
    final start = (i * step).floor();
    final end = ((i + 1) * step).floor().clamp(start + 1, sorted.length);
    final slice = sorted.sublist(start, end);
    final avgT =
        slice.map((s) => s.tempC).reduce((a, b) => a + b) / slice.length;
    final avgRh =
        slice.map((s) => s.rhPercent).reduce((a, b) => a + b) / slice.length;
    final avgVpd =
        slice.map((s) => s.vpdKpa).reduce((a, b) => a + b) / slice.length;
    final mid = slice[slice.length ~/ 2];
    out.add(
      SensorSample(
        timestamp: mid.timestamp,
        tempC: avgT,
        rhPercent: avgRh,
        vpdKpa: avgVpd,
        sourceDeviceId: mid.sourceDeviceId,
      ),
    );
  }
  return out;
}

/// One sample per calendar day (local) — for year view.
List<SensorSample> aggregateDaily(List<SensorSample> sorted) {
  if (sorted.isEmpty) return [];
  final buckets = <String, List<SensorSample>>{};
  for (final s in sorted) {
    final k =
        '${s.timestamp.year}-${s.timestamp.month}-${s.timestamp.day}';
    buckets.putIfAbsent(k, () => []).add(s);
  }
  final out = <SensorSample>[];
  for (final e in buckets.entries) {
    final slice = e.value;
    final avgT =
        slice.map((s) => s.tempC).reduce((a, b) => a + b) / slice.length;
    final avgRh =
        slice.map((s) => s.rhPercent).reduce((a, b) => a + b) / slice.length;
    final avgVpd =
        slice.map((s) => s.vpdKpa).reduce((a, b) => a + b) / slice.length;
    final t0 = slice.map((s) => s.timestamp).reduce(
          (a, b) => a.isBefore(b) ? a : b,
        );
    out.add(
      SensorSample(
        timestamp: DateTime(t0.year, t0.month, t0.day, 12),
        tempC: avgT,
        rhPercent: avgRh,
        vpdKpa: avgVpd,
        sourceDeviceId: slice.first.sourceDeviceId,
      ),
    );
  }
  out.sort((a, b) => a.timestamp.compareTo(b.timestamp));
  return out;
}
