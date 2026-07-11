import '../models/sensor_sample.dart';

/// Fast RH / temp excursions for log review (sort spikes first).
class TelemetrySpike {
  const TelemetrySpike({
    required this.at,
    required this.kind,
    required this.deltaPerMinute,
    required this.valueBefore,
    required this.valueAfter,
  });

  final DateTime at;
  final SpikeKind kind;
  final double deltaPerMinute;
  final double valueBefore;
  final double valueAfter;
}

enum SpikeKind { rhUp, rhDown, tempUp, tempDown }

class SpikeDetector {
  SpikeDetector({
    this.rhSlopeThresholdPerMin = 2.5,
    this.tempSlopeThresholdPerMin = 0.35,
  });

  final double rhSlopeThresholdPerMin;
  final double tempSlopeThresholdPerMin;

  List<TelemetrySpike> findSpikes(List<SensorSample> sorted) {
    if (sorted.length < 3) return [];
    final out = <TelemetrySpike>[];
    for (var i = 1; i < sorted.length; i++) {
      final prev = sorted[i - 1];
      final cur = sorted[i];
      final dtMin =
          cur.timestamp.difference(prev.timestamp).inSeconds / 60.0;
      if (dtMin < 1e-3) continue;
      final dRh = (cur.rhPercent - prev.rhPercent) / dtMin;
      final dT = (cur.tempC - prev.tempC) / dtMin;
      if (dRh.abs() >= rhSlopeThresholdPerMin) {
        out.add(
          TelemetrySpike(
            at: cur.timestamp,
            kind: dRh > 0 ? SpikeKind.rhUp : SpikeKind.rhDown,
            deltaPerMinute: dRh,
            valueBefore: prev.rhPercent,
            valueAfter: cur.rhPercent,
          ),
        );
      }
      if (dT.abs() >= tempSlopeThresholdPerMin) {
        out.add(
          TelemetrySpike(
            at: cur.timestamp,
            kind: dT > 0 ? SpikeKind.tempUp : SpikeKind.tempDown,
            deltaPerMinute: dT,
            valueBefore: prev.tempC,
            valueAfter: cur.tempC,
          ),
        );
      }
    }
    out.sort((a, b) => b.deltaPerMinute.abs().compareTo(a.deltaPerMinute.abs()));
    return out.take(24).toList();
  }
}
