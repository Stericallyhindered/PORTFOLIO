import 'vpd_calculator.dart';

/// VPD (kPa) matching published canopy charts where **leaf temperature is Δ°C below air**.
///
/// Definition: `ea = (RH/100) × es(T_air)` (vapor pressure of the bulk air) and
/// `es_leaf = es(T_air − Δ)`. Then **VPD = es_leaf − ea**.
///
/// This matches the common “leaf −2 °C vs air” reference grids (e.g. Purolyt-style tables)
/// at checked boundary points such as **20 °C / 85 % RH → ~0.07 kPa**.
double vpdLeafBelowAirKpa(
  double airTempC,
  double rhPercent, {
  double leafDeltaC = 2.0,
}) {
  final esLeaf = saturationVaporPressureKpa(airTempC - leafDeltaC);
  final ea = actualVaporPressureKpa(airTempC, rhPercent);
  return (esLeaf - ea).clamp(0.0, 20.0);
}

/// RH (%) needed at air temp [airTempC] to hit [targetVpdKpa] using the same leaf-offset model.
double relativeHumidityForTargetLeafBelowAirVpd(
  double airTempC,
  double targetVpdKpa, {
  double leafDeltaC = 2.0,
}) {
  final esLeaf = saturationVaporPressureKpa(airTempC - leafDeltaC);
  final esAir = saturationVaporPressureKpa(airTempC);
  if (esAir <= 1e-9) return 100;
  final ea = esLeaf - targetVpdKpa;
  final rh = (ea / esAir) * 100;
  return rh.clamp(5.0, 100.0);
}
