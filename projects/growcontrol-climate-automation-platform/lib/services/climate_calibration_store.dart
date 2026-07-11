import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Rolling calibration for RH/VPD control — learns typical humidify / dry rates from telemetry.
class ClimateCalibrationStore extends ChangeNotifier {
  ClimateCalibrationStore();

  static const _key = 'climate_calibration_v1';

  /// Exponential moving averages (%RH per minute) while loads are active.
  double humRhPerMinuteEma = 0.35;
  double dehuRhPerMinuteEma = -0.45;

  /// Adaptive hysteresis half-width (%RH) around target RH band.
  double rhHalfWidth = 3.0;

  /// Samples used for EMA confidence (more → tighter anticipation).
  int _learningTicks = 0;
  Timer? _persistDebounce;

  int get learningConfidenceTicks => _learningTicks;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      final j = jsonDecode(raw) as Map<String, dynamic>;
      humRhPerMinuteEma = (j['humRhPerMin'] as num?)?.toDouble() ?? humRhPerMinuteEma;
      dehuRhPerMinuteEma =
          (j['dehuRhPerMin'] as num?)?.toDouble() ?? dehuRhPerMinuteEma;
      rhHalfWidth = (j['rhHalfWidth'] as num?)?.toDouble() ?? rhHalfWidth;
      _learningTicks = (j['ticks'] as num?)?.toInt() ?? 0;
    } catch (e, st) {
      debugPrint('ClimateCalibrationStore load $e $st');
    }
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode({
        'humRhPerMin': humRhPerMinuteEma,
        'dehuRhPerMin': dehuRhPerMinuteEma,
        'rhHalfWidth': rhHalfWidth,
        'ticks': _learningTicks,
      }),
    );
    notifyListeners();
  }

  /// Observe one control tick ([dtMinutes] wall time between ticks).
  void observeRates({
    required bool humidifierOn,
    required bool dehumidifierOn,
    required double rhNow,
    required double rhPrev,
    required double dtMinutes,
  }) {
    if (dtMinutes <= 0) return;
    final slope = (rhNow - rhPrev) / dtMinutes;
    const alpha = 0.12;
    if (humidifierOn && !dehumidifierOn) {
      humRhPerMinuteEma += alpha * (slope - humRhPerMinuteEma);
      _learningTicks++;
    }
    if (dehumidifierOn && !humidifierOn) {
      dehuRhPerMinuteEma += alpha * (slope - dehuRhPerMinuteEma);
      _learningTicks++;
    }

    _schedulePersist();
  }

  void _schedulePersist() {
    _persistDebounce?.cancel();
    _persistDebounce = Timer(const Duration(seconds: 4), () {
      unawaited(_persist());
    });
  }

  /// Predict RH after [minutesAhead] if humidifier stays on (linear extrapolation).
  double predictRhHumidifying(double rhNow, double minutesAhead) {
    final rate = humRhPerMinuteEma.clamp(0.05, 8.0);
    return (rhNow + rate * minutesAhead).clamp(0.0, 100.0);
  }

  /// Predict RH after [minutesAhead] if dehumidifier stays on.
  double predictRhDrying(double rhNow, double minutesAhead) {
    final rate = dehuRhPerMinuteEma.clamp(-12.0, -0.05);
    return (rhNow + rate * minutesAhead).clamp(0.0, 100.0);
  }

  Future<void> resetLearning() async {
    humRhPerMinuteEma = 0.35;
    dehuRhPerMinuteEma = -0.45;
    rhHalfWidth = 3.0;
    _learningTicks = 0;
    await _persist();
  }

  /// Replace EMA with explicit observed rates (e.g. median from logged load segments).
  Future<void> seedRates({
    required double humidifyRhPerMinute,
    required double dryRhPerMinute,
  }) async {
    humRhPerMinuteEma = humidifyRhPerMinute.clamp(0.05, 8.0);
    dehuRhPerMinuteEma = dryRhPerMinute.clamp(-12.0, -0.05);
    await _persist();
  }

  Future<void> seedRatesOptional({
    double? humidifyRhPerMinute,
    double? dryRhPerMinute,
  }) async {
    if (humidifyRhPerMinute != null) {
      humRhPerMinuteEma = humidifyRhPerMinute.clamp(0.05, 8.0);
    }
    if (dryRhPerMinute != null) {
      dehuRhPerMinuteEma = dryRhPerMinute.clamp(-12.0, -0.05);
    }
    await _persist();
  }
}
