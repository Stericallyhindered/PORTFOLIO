import 'pdf_rules.dart';

/// Optional OEM-pattern behavioral modifiers (PDF pages 11, 13–14).
/// All gains are tunable per mode bundle.
class PdfDriveRules {
  const PdfDriveRules({
    this.enabled = true,
    this.applySpeedDeactivate = true,
    this.speedDeactivateKmh = pdfDeactivateSpeedKmh,
    this.applyTightCornerLowTorqueRelax = true,
    this.tightCornerSteeringAbsDeg = 115,
    this.tightCornerEngineTorqueBelowNm = 120,
    this.tightCornerRelaxFactor = 0.35,
    this.applyDynamicsOversteerBoost = true,
    this.yawOversteerBoostGain = 0.22,
    this.applyDynamicsUndersteerCut = true,
    this.understeerLateralGThreshold = 0.55,
    this.understeerYawQuietDegPerSec = 12,
    this.understeerCutGain = 0.55,
    this.applyTireToleranceScaling = true,
    this.tireTolerancePwmMultiplier = 0.92,
    this.highSpeedPwmRetainFactor = 0.22,
    this.yawOversteerSignPositiveIsRearOut = true,
  });

  /// Master enable for PDF-shaped overlays (does not disable base math).
  final bool enabled;

  /// Page 11: speed > ~180 km/h — training module lists full AWD deactivation context.
  final bool applySpeedDeactivate;
  final double speedDeactivateKmh;

  /// Page 11: very tight cornering **with low engine torque** — reduce front coupling.
  final bool applyTightCornerLowTorqueRelax;
  final double tightCornerSteeringAbsDeg;
  final double tightCornerEngineTorqueBelowNm;
  /// Multiply blended PWM by `1 - relax*(1-factor)` style via factor in engine.
  final double tightCornerRelaxFactor;

  /// Page 13: oversteer tendency — pull front (boost PWM toward max).
  final bool applyDynamicsOversteerBoost;
  final double yawOversteerBoostGain;

  /// Page 13: understeer tendency — open clutch (cut PWM).
  final bool applyDynamicsUndersteerCut;
  final double understeerLateralGThreshold;
  final double understeerYawQuietDegPerSec;
  final double understeerCutGain;

  /// Page 14: tire tolerance — allow slip in clutch path → reduce locking vs pure map.
  final bool applyTireToleranceScaling;
  final double tireTolerancePwmMultiplier;

  /// When \(\|v\| >\) [speedDeactivateKmh]: scale PWM toward RWD-ish retain (training text: full deactivation context).
  final double highSpeedPwmRetainFactor;

  /// Interpret positive yaw-rate as rear-out (oversteer) for yaw boost heuristic.
  final bool yawOversteerSignPositiveIsRearOut;

  PdfDriveRules copyWith({
    bool? enabled,
    bool? applySpeedDeactivate,
    double? speedDeactivateKmh,
    bool? applyTightCornerLowTorqueRelax,
    double? tightCornerSteeringAbsDeg,
    double? tightCornerEngineTorqueBelowNm,
    double? tightCornerRelaxFactor,
    bool? applyDynamicsOversteerBoost,
    double? yawOversteerBoostGain,
    bool? applyDynamicsUndersteerCut,
    double? understeerLateralGThreshold,
    double? understeerYawQuietDegPerSec,
    double? understeerCutGain,
    bool? applyTireToleranceScaling,
    double? tireTolerancePwmMultiplier,
    double? highSpeedPwmRetainFactor,
    bool? yawOversteerSignPositiveIsRearOut,
  }) {
    return PdfDriveRules(
      enabled: enabled ?? this.enabled,
      applySpeedDeactivate: applySpeedDeactivate ?? this.applySpeedDeactivate,
      speedDeactivateKmh: speedDeactivateKmh ?? this.speedDeactivateKmh,
      applyTightCornerLowTorqueRelax:
          applyTightCornerLowTorqueRelax ?? this.applyTightCornerLowTorqueRelax,
      tightCornerSteeringAbsDeg:
          tightCornerSteeringAbsDeg ?? this.tightCornerSteeringAbsDeg,
      tightCornerEngineTorqueBelowNm:
          tightCornerEngineTorqueBelowNm ?? this.tightCornerEngineTorqueBelowNm,
      tightCornerRelaxFactor: tightCornerRelaxFactor ?? this.tightCornerRelaxFactor,
      applyDynamicsOversteerBoost:
          applyDynamicsOversteerBoost ?? this.applyDynamicsOversteerBoost,
      yawOversteerBoostGain: yawOversteerBoostGain ?? this.yawOversteerBoostGain,
      applyDynamicsUndersteerCut:
          applyDynamicsUndersteerCut ?? this.applyDynamicsUndersteerCut,
      understeerLateralGThreshold:
          understeerLateralGThreshold ?? this.understeerLateralGThreshold,
      understeerYawQuietDegPerSec:
          understeerYawQuietDegPerSec ?? this.understeerYawQuietDegPerSec,
      understeerCutGain: understeerCutGain ?? this.understeerCutGain,
      applyTireToleranceScaling:
          applyTireToleranceScaling ?? this.applyTireToleranceScaling,
      tireTolerancePwmMultiplier:
          tireTolerancePwmMultiplier ?? this.tireTolerancePwmMultiplier,
      highSpeedPwmRetainFactor:
          highSpeedPwmRetainFactor ?? this.highSpeedPwmRetainFactor,
      yawOversteerSignPositiveIsRearOut:
          yawOversteerSignPositiveIsRearOut ??
              this.yawOversteerSignPositiveIsRearOut,
    );
  }

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'applySpeedDeactivate': applySpeedDeactivate,
        'speedDeactivateKmh': speedDeactivateKmh,
        'applyTightCornerLowTorqueRelax': applyTightCornerLowTorqueRelax,
        'tightCornerSteeringAbsDeg': tightCornerSteeringAbsDeg,
        'tightCornerEngineTorqueBelowNm': tightCornerEngineTorqueBelowNm,
        'tightCornerRelaxFactor': tightCornerRelaxFactor,
        'applyDynamicsOversteerBoost': applyDynamicsOversteerBoost,
        'yawOversteerBoostGain': yawOversteerBoostGain,
        'applyDynamicsUndersteerCut': applyDynamicsUndersteerCut,
        'understeerLateralGThreshold': understeerLateralGThreshold,
        'understeerYawQuietDegPerSec': understeerYawQuietDegPerSec,
        'understeerCutGain': understeerCutGain,
        'applyTireToleranceScaling': applyTireToleranceScaling,
        'tireTolerancePwmMultiplier': tireTolerancePwmMultiplier,
        'highSpeedPwmRetainFactor': highSpeedPwmRetainFactor,
        'yawOversteerSignPositiveIsRearOut': yawOversteerSignPositiveIsRearOut,
      };

  factory PdfDriveRules.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PdfDriveRules();
    return PdfDriveRules(
      enabled: json['enabled'] as bool? ?? true,
      applySpeedDeactivate: json['applySpeedDeactivate'] as bool? ?? true,
      speedDeactivateKmh: (json['speedDeactivateKmh'] as num?)?.toDouble() ??
          pdfDeactivateSpeedKmh,
      applyTightCornerLowTorqueRelax:
          json['applyTightCornerLowTorqueRelax'] as bool? ?? true,
      tightCornerSteeringAbsDeg:
          (json['tightCornerSteeringAbsDeg'] as num?)?.toDouble() ?? 115,
      tightCornerEngineTorqueBelowNm:
          (json['tightCornerEngineTorqueBelowNm'] as num?)?.toDouble() ?? 120,
      tightCornerRelaxFactor:
          (json['tightCornerRelaxFactor'] as num?)?.toDouble() ?? 0.35,
      applyDynamicsOversteerBoost:
          json['applyDynamicsOversteerBoost'] as bool? ?? true,
      yawOversteerBoostGain:
          (json['yawOversteerBoostGain'] as num?)?.toDouble() ?? 0.22,
      applyDynamicsUndersteerCut:
          json['applyDynamicsUndersteerCut'] as bool? ?? true,
      understeerLateralGThreshold:
          (json['understeerLateralGThreshold'] as num?)?.toDouble() ?? 0.55,
      understeerYawQuietDegPerSec:
          (json['understeerYawQuietDegPerSec'] as num?)?.toDouble() ?? 12,
      understeerCutGain: (json['understeerCutGain'] as num?)?.toDouble() ?? 0.55,
      applyTireToleranceScaling:
          json['applyTireToleranceScaling'] as bool? ?? true,
      tireTolerancePwmMultiplier:
          (json['tireTolerancePwmMultiplier'] as num?)?.toDouble() ?? 0.92,
      highSpeedPwmRetainFactor:
          (json['highSpeedPwmRetainFactor'] as num?)?.toDouble() ?? 0.22,
      yawOversteerSignPositiveIsRearOut:
          json['yawOversteerSignPositiveIsRearOut'] as bool? ?? true,
    );
  }
}
