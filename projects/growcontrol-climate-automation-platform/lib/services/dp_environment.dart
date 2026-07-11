/// Maps Tuya DP payloads to °C / %RH.
///
/// The ESP32 hub is the only thing on the LAN that talks the Tuya protocol;
/// the phone only ever sees the parsed `sensor_samples` rows it streams down
/// from Supabase. This helper stays because the dev tools tab still likes to
/// render the raw DP map for debugging.
///
/// Common Wi-Fi temp/humidity heuristics: many devices use `2`=temp,
/// `3`=humidity. Some firmware ×10s the temperature (so `255` means 25.5 °C);
/// we accept both raw and scaled forms.
(double tempC, double rhPct)? tryParseDpTempHumidity(Map<String, dynamic> raw) {
  final dps = <String, dynamic>{};
  for (final e in raw.entries) {
    dps[e.key.toString()] = e.value;
  }

  final p23 = _pair(dps['2'], dps['3']);
  if (p23 != null) return p23;

  final p12 = _pair(dps['1'], dps['2']);
  if (p12 != null) return p12;

  final p14 = _pair(dps['1'], dps['4']);
  if (p14 != null) return p14;

  return null;
}

(double, double)? _pair(dynamic tempRaw, dynamic rhRaw) {
  final t = _interpretTemp(tempRaw);
  final h = _interpretRh(rhRaw);
  if (t != null && h != null && t >= -15 && t <= 65 && h >= 0 && h <= 100) {
    return (t, h);
  }
  return null;
}

double? _interpretTemp(dynamic v) {
  if (v == null) return null;
  if (v is num) {
    final x = v.toDouble();
    if (x >= -30 && x <= 70) return x;
    if (x > 80 && x < 1500) return x / 10.0;
    return null;
  }
  if (v is String) {
    final x = double.tryParse(v);
    if (x == null) return null;
    return _interpretTemp(x);
  }
  return null;
}

double? _interpretRh(dynamic v) {
  if (v == null) return null;
  if (v is num) {
    final x = v.toDouble();
    if (x >= 0 && x <= 100) return x;
    if (x > 100 && x <= 1000) return (x / 10).clamp(0.0, 100.0);
    return null;
  }
  if (v is String) {
    final x = double.tryParse(v);
    if (x == null) return null;
    return _interpretRh(x);
  }
  return null;
}
