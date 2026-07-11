import 'package:flutter/foundation.dart';

import 'vpd_tables.dart';

/// Colour-band semantics from standard VPD reference charts (low / healthy / high / danger).
enum VpdChartZone {
  dangerLow,
  lowTranspiration,
  healthy,
  highTranspiration,
  dangerHigh,
}

@immutable
class VpdZoneClassifier {
  const VpdZoneClassifier._();

  /// Conventional colour zones (kPa) — tune in one place for UI + warnings.
  static const double dangerLowMax = 0.4;
  static const double vegetativeMax = 0.8;
  static const double healthyMax = 1.2;
  static const double floweringMax = 1.6;

  static VpdChartZone zoneFor(double vpdKpa) {
    if (vpdKpa < dangerLowMax) return VpdChartZone.dangerLow;
    if (vpdKpa < vegetativeMax) return VpdChartZone.lowTranspiration;
    if (vpdKpa < healthyMax) return VpdChartZone.healthy;
    if (vpdKpa < floweringMax) return VpdChartZone.highTranspiration;
    return VpdChartZone.dangerHigh;
  }

  static String zoneLabel(VpdChartZone z) {
    switch (z) {
      case VpdChartZone.dangerLow:
        return 'Danger — under-transpiration';
      case VpdChartZone.lowTranspiration:
        return 'Low transpiration (propagation / early veg)';
      case VpdChartZone.healthy:
        return 'Healthy (late veg / early flower)';
      case VpdChartZone.highTranspiration:
        return 'High transpiration (mid–late flower)';
      case VpdChartZone.dangerHigh:
        return 'Danger — over-transpiration';
    }
  }

  /// Target band centre within the stage’s strategic band (still clamped to safe chart region).
  static double suggestedMidVpd(GrowthStage stage, PhotoperiodPhase phase) {
    final b = VpdReferenceTable.bandFor(stage, phase);
    return b.midpointKpa.clamp(dangerLowMax + 0.02, floweringMax - 0.02);
  }
}
