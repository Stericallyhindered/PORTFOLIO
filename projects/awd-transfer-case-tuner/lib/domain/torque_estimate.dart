import 'interpolation.dart';

/// \( \hat{T} = \mathrm{TPS\%} \cdot T_{max} \cdot f(\mathrm{RPM}) \) — piecewise-linear \(f\) on calibrated breakpoints.
double torqueEstimateTpsMaxRpm({
  required double tpsPercent,
  required double maxTorqueNm,
  required List<double> rpmBreakpoints,
  required List<double> rpmFactors,
  required double rpm,
}) {
  final f = interpolatePiecewise(rpmBreakpoints, rpmFactors, rpm);
  return (tpsPercent * 0.01) * maxTorqueNm * f;
}

/// \(\Delta_{max} = \dfrac{PWM_{span}}{T_{ramp}\cdot f_{telemetry}}\) when ramp timing is used.
double deltaMaxFromRamp({
  required double minPwm,
  required double maxPwm,
  required double rampTimeSec,
  required double telemetryHz,
}) {
  if (rampTimeSec <= 0 || telemetryHz <= 0) return -1;
  final span = (maxPwm - minPwm).abs();
  return span / (rampTimeSec * telemetryHz);
}
