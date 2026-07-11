/// How [TelemetrySnapshot] wheel speeds are turned into the **Y-axis slip scalar**
/// fed to bilinear interpolation (must match axis breakpoint semantics).
enum SlipInputMode {
  /// Rear average − front average [km/h] (physical slip-speed delta).
  kmhRearMinusFront,

  /// \((v_{rear}-v_{front}) / \max(|v_{rear}|,\epsilon)\).
  normalizedByRear,

  /// \((v_{rear}-v_{front}) / \max(|v_{vehicle}|,\epsilon)\).
  normalizedByVehicleSpeed,
}

SlipInputMode parseSlipInputMode(String? s) {
  if (s == null) return SlipInputMode.kmhRearMinusFront;
  for (final e in SlipInputMode.values) {
    if (e.name == s) return e;
  }
  return SlipInputMode.kmhRearMinusFront;
}
