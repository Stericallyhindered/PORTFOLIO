import 'package:flutter/foundation.dart';

/// Canonical growth stages — pick one to select **target VPD strategy** (automation uses [VpdReferenceTable]).
enum GrowthStage {
  /// Propagation / early veg — low transpiration band.
  seedlingClone,

  /// Vegetative — mostly 0.4–0.8 kPa region.
  earlyVeg,

  /// Late veg — transition toward flowering band.
  lateVeg,

  /// Flip to 12/12 — overlap band.
  transition,

  /// Early flower — healthy transpiration band.
  earlyFlower,

  /// Mid flower — higher transpiration acceptable.
  midFlower,

  /// Late flower — peak transpiration band before ripening.
  lateFlower,

  /// Ripening / flush — target upper-mid band; often paired with lower temps manually.
  ripening,
}

/// Lights schedule still shifts targets slightly (night stomatal closure).
enum PhotoperiodPhase {
  lightsOn,
  lightsOff,
}

@immutable
class VpdBand {
  const VpdBand({
    required this.minKpa,
    required this.maxKpa,
  });

  final double minKpa;
  final double maxKpa;

  double get midpointKpa => (minKpa + maxKpa) / 2;

  bool contains(double vpdKpa) => vpdKpa >= minKpa && vpdKpa <= maxKpa;
}

/// Reference targets aligned with conventional colour-band charts:
/// **0.4–0.8** veg / propagation, **0.8–1.2** healthy mid-cycle, **1.2–1.6** late flower,
/// danger outside **<0.4** or **>1.6** (see [VpdZoneClassifier]).
class VpdReferenceTable {
  VpdReferenceTable._();

  static const Map<GrowthStage, Map<PhotoperiodPhase, VpdBand>> _table = {
    GrowthStage.seedlingClone: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 0.40, maxKpa: 0.80),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 0.40, maxKpa: 0.75),
    },
    GrowthStage.earlyVeg: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 0.45, maxKpa: 0.80),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 0.40, maxKpa: 0.75),
    },
    GrowthStage.lateVeg: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 0.80, maxKpa: 1.20),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 0.75, maxKpa: 1.10),
    },
    GrowthStage.transition: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 0.80, maxKpa: 1.20),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 0.75, maxKpa: 1.10),
    },
    GrowthStage.earlyFlower: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 0.80, maxKpa: 1.20),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 0.75, maxKpa: 1.10),
    },
    GrowthStage.midFlower: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 1.20, maxKpa: 1.60),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 1.10, maxKpa: 1.50),
    },
    GrowthStage.lateFlower: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 1.20, maxKpa: 1.60),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 1.10, maxKpa: 1.50),
    },
    GrowthStage.ripening: {
      PhotoperiodPhase.lightsOn: VpdBand(minKpa: 1.20, maxKpa: 1.60),
      PhotoperiodPhase.lightsOff: VpdBand(minKpa: 1.10, maxKpa: 1.45),
    },
  };

  static VpdBand bandFor(GrowthStage stage, PhotoperiodPhase phase) {
    return _table[stage]![phase]!;
  }

  static String stageLabel(GrowthStage s) {
    switch (s) {
      case GrowthStage.seedlingClone:
        return 'Propagation / seedling';
      case GrowthStage.earlyVeg:
        return 'Vegetative (early)';
      case GrowthStage.lateVeg:
        return 'Vegetative (late)';
      case GrowthStage.transition:
        return 'Transition (flip)';
      case GrowthStage.earlyFlower:
        return 'Flower (early)';
      case GrowthStage.midFlower:
        return 'Flower (mid)';
      case GrowthStage.lateFlower:
        return 'Flower (late)';
      case GrowthStage.ripening:
        return 'Ripening / flush';
    }
  }
}
