import '../domain/models/dehu_learning_record.dart';
import '../domain/models/humidifier_ramp_record.dart';
import '../domain/models/grow_device.dart';
import '../domain/models/outlet_event.dart';
import '../domain/models/sensor_sample.dart';
import '../domain/vpd/vpd_leaf_air_chart.dart';
import '../domain/vpd/vpd_stage_zones.dart';
import '../domain/vpd/vpd_tables.dart';
import 'climate_calibration_store.dart';
import 'grow_log_repository.dart';

/// Humidity + VPD policy with hysteresis and optional learned rates (calibration store).
class ClimateControlDecision {
  const ClimateControlDecision({
    required this.humidifierOn,
    required this.dehumidifierOn,
    required this.targetRhPercent,
    required this.targetVpdMidKpa,
    required this.liveVpdKpa,
    required this.zoneLabel,
    required this.notes,
  });

  final bool humidifierOn;
  final bool dehumidifierOn;
  final double targetRhPercent;
  final double targetVpdMidKpa;
  final double liveVpdKpa;
  final String zoneLabel;
  final List<String> notes;
}

class ClimateControlService {
  ClimateControlService({
    required GrowLogRepository log,
    ClimateCalibrationStore? calibration,
    this.dehumidifierPriorityOverHumidifier = true,
  })  : _log = log,
        _calibration = calibration;

  final GrowLogRepository _log;
  final ClimateCalibrationStore? _calibration;

  final bool dehumidifierPriorityOverHumidifier;

  DateTime? _dehuSegmentStart;
  double? _dehuRhStart;
  double? _dehuTempSum;
  int _dehuTempSamples = 0;

  DateTime? _humSegmentStart;
  double? _humRhStart;
  double? _humTempSum;
  int _humTempSamples = 0;

  /// Leaf-air chart model (matches published ΔT_leaf−air = 2 °C grids).
  static const double leafDeltaC = 2.0;

  ClimateControlDecision evaluate({
    required double tempC,
    required double rhPercent,
    required GrowthStage stage,
    required PhotoperiodPhase photoperiod,
    required bool humidifierWasOn,
    required bool dehumidifierWasOn,
    required String canopySensorId,
    required String? humidifierDeviceId,
    required String? dehumidifierDeviceId,
    required double tickMinutes,
    double? rhPrev,
  }) {
    final band = VpdReferenceTable.bandFor(stage, photoperiod);
    final targetVpd =
        VpdZoneClassifier.suggestedMidVpd(stage, photoperiod).clamp(
          band.minKpa,
          band.maxKpa,
        );

    final targetRh = relativeHumidityForTargetLeafBelowAirVpd(
      tempC,
      targetVpd,
      leafDeltaC: leafDeltaC,
    );

    final half =
        _calibration?.rhHalfWidth ?? 3.0;

    final innerStickyHum =
        (1.0 + (half * 0.18)).clamp(0.6, 2.8);
    final innerStickyDehu =
        (1.0 + (half * 0.18)).clamp(0.6, 2.8);

    final low = targetRh - half;
    final high = targetRh + half;

    final liveVpd =
        vpdLeafBelowAirKpa(tempC, rhPercent, leafDeltaC: leafDeltaC);
    final zone = VpdZoneClassifier.zoneFor(liveVpd);

    final notes = <String>[
      '${VpdReferenceTable.stageLabel(stage)} · '
          '${photoperiod == PhotoperiodPhase.lightsOn ? "DAY" : "NIGHT"}',
      'Target VPD ${band.minKpa.toStringAsFixed(2)}–${band.maxKpa.toStringAsFixed(2)} kPa '
          '(mid ${targetVpd.toStringAsFixed(2)})',
      VpdZoneClassifier.zoneLabel(zone),
    ];

    bool humOn = false;
    bool dehuOn = false;

    if (rhPercent > high && dehumidifierDeviceId != null) {
      dehuOn = true;
      notes.add('RH above band → extract moisture');
    } else if (rhPercent < low && humidifierDeviceId != null) {
      humOn = true;
      notes.add('RH below band → add moisture');
    } else {
      notes.add('RH within deadband → idle');
    }

    // Sticky hysteresis — reduce relay chatter near the setpoint ribbon.
    if (humidifierWasOn &&
        humidifierDeviceId != null &&
        rhPercent < targetRh + innerStickyHum) {
      humOn = true;
      notes.add('Humidifier hold (hysteresis)');
    }
    if (dehumidifierWasOn &&
        dehumidifierDeviceId != null &&
        rhPercent > targetRh - innerStickyDehu) {
      dehuOn = true;
      notes.add('Dehumidifier hold (hysteresis)');
    }

    // Learned anticipation — skip humidify if a short projection overshoots high bound.
    final cal = _calibration;
    if (humOn && cal != null) {
      final projected =
          cal.predictRhHumidifying(rhPercent, 2.3);
      if (projected > high + 1.1) {
        humOn = false;
        notes.add('Skip humidify — learned overshoot risk');
      }
    }
    if (dehuOn && cal != null) {
      final projected =
          cal.predictRhDrying(rhPercent, 2.3);
      if (projected < low - 1.4) {
        dehuOn = false;
        notes.add('Skip dehu — learned over-dry risk');
      }
    }

    if (humOn && dehuOn && dehumidifierPriorityOverHumidifier) {
      humOn = false;
      notes.add('Conflict → prioritize dehumidifier');
    }

    _log.addSample(
      SensorSample(
        timestamp: DateTime.now(),
        tempC: tempC,
        rhPercent: rhPercent,
        vpdKpa: liveVpd,
        sourceDeviceId: canopySensorId,
      ),
    );

    if (rhPrev != null &&
        tickMinutes > 0 &&
        cal != null) {
      cal.observeRates(
        humidifierOn: humidifierWasOn,
        dehumidifierOn: dehumidifierWasOn,
        rhNow: rhPercent,
        rhPrev: rhPrev,
        dtMinutes: tickMinutes,
      );
    }

    return ClimateControlDecision(
      humidifierOn: humOn,
      dehumidifierOn: dehuOn,
      targetRhPercent: targetRh,
      targetVpdMidKpa: targetVpd,
      liveVpdKpa: liveVpd,
      zoneLabel: VpdZoneClassifier.zoneLabel(zone),
      notes: notes,
    );
  }

  void _trackDehuLearning({
    required bool dehumidifierWasOn,
    required bool dehumidifierNowOn,
    required double rh,
    required double tempC,
  }) {
    if (!dehumidifierWasOn && dehumidifierNowOn) {
      _dehuSegmentStart = DateTime.now();
      _dehuRhStart = rh;
      _dehuTempSum = tempC;
      _dehuTempSamples = 1;
    } else if (dehumidifierWasOn && dehumidifierNowOn) {
      _dehuTempSum = (_dehuTempSum ?? 0) + tempC;
      _dehuTempSamples += 1;
    } else if (dehumidifierWasOn && !dehumidifierNowOn) {
      if (_dehuSegmentStart != null && _dehuRhStart != null) {
        final avgTemp = _dehuTempSamples > 0
            ? (_dehuTempSum ?? tempC) / _dehuTempSamples
            : tempC;
        final rec = DehumidifierPullDownRecord(
          startedAt: _dehuSegmentStart!,
          endedAt: DateTime.now(),
          rhStart: _dehuRhStart!,
          rhEnd: rh,
          tempCAvg: avgTemp,
        );
        _log.addDehuSegment(rec);
      }
      _dehuSegmentStart = null;
      _dehuRhStart = null;
      _dehuTempSum = null;
      _dehuTempSamples = 0;
    }
  }

  void _trackHumLearning({
    required bool humidifierWasOn,
    required bool humidifierNowOn,
    required double rh,
    required double tempC,
  }) {
    if (!humidifierWasOn && humidifierNowOn) {
      _humSegmentStart = DateTime.now();
      _humRhStart = rh;
      _humTempSum = tempC;
      _humTempSamples = 1;
    } else if (humidifierWasOn && humidifierNowOn) {
      _humTempSum = (_humTempSum ?? 0) + tempC;
      _humTempSamples += 1;
    } else if (humidifierWasOn && !humidifierNowOn) {
      if (_humSegmentStart != null && _humRhStart != null) {
        final avgTemp = _humTempSamples > 0
            ? (_humTempSum ?? tempC) / _humTempSamples
            : tempC;
        final rec = HumidifierRampRecord(
          startedAt: _humSegmentStart!,
          endedAt: DateTime.now(),
          rhStart: _humRhStart!,
          rhEnd: rh,
          tempCAvg: avgTemp,
        );
        _log.addHumSegment(rec);
      }
      _humSegmentStart = null;
      _humRhStart = null;
      _humTempSum = null;
      _humTempSamples = 0;
    }
  }

  /// Call once per tick with **actual** commanded outlet states (after scene rules).
  void recordHumidityLoadSegments({
    required bool humidifierWasOn,
    required bool humidifierNowOn,
    required bool dehumidifierWasOn,
    required bool dehumidifierNowOn,
    required double rh,
    required double tempC,
  }) {
    _trackDehuLearning(
      dehumidifierWasOn: dehumidifierWasOn,
      dehumidifierNowOn: dehumidifierNowOn,
      rh: rh,
      tempC: tempC,
    );
    _trackHumLearning(
      humidifierWasOn: humidifierWasOn,
      humidifierNowOn: humidifierNowOn,
      rh: rh,
      tempC: tempC,
    );
  }

  void emitOutletIfChanged({
    required bool previous,
    required bool next,
    required String deviceId,
    required GrowDeviceRole role,
    required String reason,
  }) {
    if (previous == next) return;
    _log.addOutletEvent(
      OutletEvent(
        id: _log.nextId(),
        deviceId: deviceId,
        role: role,
        on: next,
        at: DateTime.now(),
        reason: reason,
      ),
    );
  }
}
