import 'dart:math' as math;

/// Air VPD (kPa) from canopy air temperature and relative humidity.
///
/// Uses the Magnus formula for saturation vapor pressure over water (common in
/// horticulture calculators). See [Magnus–Tetens].
double saturationVaporPressureKpa(double tempC) {
  // es in kPa (campbell scientific style / greenhouse calculators)
  return 0.61078 *
      math.exp((17.2694 * tempC) / (tempC + 237.3));
}

/// Actual vapor pressure (kPa) from RH and saturation pressure.
double actualVaporPressureKpa(double tempC, double rhPercent) {
  final es = saturationVaporPressureKpa(tempC);
  return es * (rhPercent.clamp(0.0, 100.0) / 100.0);
}

/// Vapor pressure deficit of the air (kPa): difference between saturation and actual.
double vpdAirKpa(double tempC, double rhPercent) {
  final es = saturationVaporPressureKpa(tempC);
  final ea = actualVaporPressureKpa(tempC, rhPercent);
  return (es - ea).clamp(0.0, double.infinity);
}

/// Optional leaf-level VPD using a leaf temperature offset below air temp (°C).
double vpdLeafKpa({
  required double airTempC,
  required double rhPercent,
  double leafOffsetC = 1.5,
}) {
  final leafT = airTempC - leafOffsetC;
  return vpdAirKpa(leafT, rhPercent);
}

/// Given air temperature and a target VPD (kPa), returns RH (%) that achieves it.
///
/// Solves: VPD = es(T) - ea, ea = es * RH/100  =>  RH = (es - VPD) / es * 100
double relativeHumidityForTargetVpd(double tempC, double targetVpdKpa) {
  final es = saturationVaporPressureKpa(tempC);
  if (es <= 1e-6) return 100;
  final rh = ((es - targetVpdKpa) / es) * 100;
  return rh.clamp(5.0, 100.0);
}
