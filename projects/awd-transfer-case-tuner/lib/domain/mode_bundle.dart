import 'axis_definition.dart';
import 'bias_map_2d.dart';
import 'pdf_drive_rules.dart';
import 'slip_input_mode.dart';

/// Tunables for one drivable map (preset or custom slot).
///
/// Signal chain (matches project math contract):
/// 1. Map lookup \(PWM_{\mathrm{slip}}\) using bilinear interp over **torque X × slip Y**.
/// 2. \(PWM_{\mathrm{mix}}=\alpha\cdot PWM_{\mathrm{slip}}+(1-\alpha)\cdot PWM_{\mathrm{pred}}\).
/// 3. Dynamics + tire layers (PDF-shaped), then \( \times \) gear, \( \times \) steer attenuation.
/// 4. Clamp \([P_{\min},P_{\max}]\).
/// 5. PDF hard gates (speed / tight corner / dynamics cuts).
/// 6. Drag slip gate (optional).
/// 7. Slew limiter.
class ModeBundle {
  ModeBundle({
    required this.xAxis,
    required this.yAxis,
    required this.map,
    required this.alpha,
    required this.minPwm,
    required this.maxPwm,
    required this.kSteer,
    required this.deltaMaxPwm,
    required this.slipThresholdDrag,
    required this.dragSlipGateEnabled,
    required Map<int, double> gearFactors,
    this.useTorqueEstimate = false,
    this.maxTorqueEstimateNm = 600,
    this.slipInputMode = SlipInputMode.kmhRearMinusFront,
    /// PDF ~40% front torque baseline encoded into PWM domain (tunable clutch calibration).
    this.preControlBaselinePwm = 14,
    this.rpmBreakpoints = const [800, 2000, 4000, 5600, 7200],
    this.rpmFactors = const [0.42, 0.62, 0.88, 1.0, 1.04],
    /// If > 0 and profile telemetryHz > 0, effective slew uses \(\Delta_{max}\) from ramp law unless overridden.
    this.rampTimeSec = 0.12,
    this.pdfRules = const PdfDriveRules(),
  }) : gearFactors = Map<int, double>.from(gearFactors);

  final AxisDefinition xAxis;
  final AxisDefinition yAxis;
  final BiasMap2D map;

  /// \(\alpha\): weight on **reactive map** vs **predictive pre-control** \(PWM_{\mathrm{pred}}\).
  final double alpha;
  final double minPwm;
  final double maxPwm;

  /// Steering attenuation \(1-k\cdot|\delta|/\delta_{\max}\) applied **once** after dynamics (step 3).
  final double kSteer;

  /// Direct \(\Delta PWM\) per telemetry tick (percent points). Used when ramp law inactive.
  final double deltaMaxPwm;

  /// Drag gate: if slip \(\le\) threshold → PWM clamp pre-slew (training-module drag logic).
  final double slipThresholdDrag;
  final bool dragSlipGateEnabled;

  /// Gear \( \rightarrow \) multiplier after mix+dynamics (PDF lists gear in pre-control inputs).
  final Map<int, double> gearFactors;

  /// \( \hat{T}=\mathrm{TPS}\cdot T_{\max}\cdot f(\mathrm{RPM}) \) instead of CAN torque.
  final bool useTorqueEstimate;
  final double maxTorqueEstimateNm;

  /// How **Y** slip scalar is derived from wheel speeds (must match axis labeling).
  final SlipInputMode slipInputMode;

  /// Interpreted as PWM corresponding to OEM-style steady ~40/60 F/R **intent** (PDF p.11 narrative).
  final double preControlBaselinePwm;

  /// Sorted RPM breakpoints for \(f(\mathrm{RPM})\); same length as [rpmFactors].
  final List<double> rpmBreakpoints;
  final List<double> rpmFactors;

  /// Used with [Profile.telemetryHz] to derive \(\Delta_{max}\) when positive.
  final double rampTimeSec;

  final PdfDriveRules pdfRules;

  ModeBundle copyWith({
    AxisDefinition? xAxis,
    AxisDefinition? yAxis,
    BiasMap2D? map,
    double? alpha,
    double? minPwm,
    double? maxPwm,
    double? kSteer,
    double? deltaMaxPwm,
    double? slipThresholdDrag,
    bool? dragSlipGateEnabled,
    Map<int, double>? gearFactors,
    bool? useTorqueEstimate,
    double? maxTorqueEstimateNm,
    SlipInputMode? slipInputMode,
    double? preControlBaselinePwm,
    List<double>? rpmBreakpoints,
    List<double>? rpmFactors,
    double? rampTimeSec,
    PdfDriveRules? pdfRules,
  }) {
    return ModeBundle(
      xAxis: xAxis ?? this.xAxis,
      yAxis: yAxis ?? this.yAxis,
      map: map ?? this.map,
      alpha: alpha ?? this.alpha,
      minPwm: minPwm ?? this.minPwm,
      maxPwm: maxPwm ?? this.maxPwm,
      kSteer: kSteer ?? this.kSteer,
      deltaMaxPwm: deltaMaxPwm ?? this.deltaMaxPwm,
      slipThresholdDrag: slipThresholdDrag ?? this.slipThresholdDrag,
      dragSlipGateEnabled: dragSlipGateEnabled ?? this.dragSlipGateEnabled,
      gearFactors: gearFactors ?? Map<int, double>.from(this.gearFactors),
      useTorqueEstimate: useTorqueEstimate ?? this.useTorqueEstimate,
      maxTorqueEstimateNm: maxTorqueEstimateNm ?? this.maxTorqueEstimateNm,
      slipInputMode: slipInputMode ?? this.slipInputMode,
      preControlBaselinePwm: preControlBaselinePwm ?? this.preControlBaselinePwm,
      rpmBreakpoints: rpmBreakpoints ?? List<double>.from(this.rpmBreakpoints),
      rpmFactors: rpmFactors ?? List<double>.from(this.rpmFactors),
      rampTimeSec: rampTimeSec ?? this.rampTimeSec,
      pdfRules: pdfRules ?? this.pdfRules,
    );
  }

  Map<String, dynamic> toJson() => {
        'xAxis': xAxis.toJson(),
        'yAxis': yAxis.toJson(),
        'map': map.toJson(),
        'alpha': alpha,
        'minPwm': minPwm,
        'maxPwm': maxPwm,
        'kSteer': kSteer,
        'deltaMaxPwm': deltaMaxPwm,
        'slipThresholdDrag': slipThresholdDrag,
        'dragSlipGateEnabled': dragSlipGateEnabled,
        'gearFactors': gearFactors.map((k, v) => MapEntry(k.toString(), v)),
        'useTorqueEstimate': useTorqueEstimate,
        'maxTorqueEstimateNm': maxTorqueEstimateNm,
        'slipInputMode': slipInputMode.name,
        'preControlBaselinePwm': preControlBaselinePwm,
        'rpmBreakpoints': rpmBreakpoints,
        'rpmFactors': rpmFactors,
        'rampTimeSec': rampTimeSec,
        'pdfRules': pdfRules.toJson(),
      };

  factory ModeBundle.fromJson(Map<String, dynamic> json) {
    final gf = <int, double>{};
    final rawGf = json['gearFactors'] as Map<String, dynamic>? ?? {};
    for (final e in rawGf.entries) {
      gf[int.parse(e.key)] = (e.value as num).toDouble();
    }
    final rb = (json['rpmBreakpoints'] as List<dynamic>?)
            ?.map((e) => (e as num).toDouble())
            .toList() ??
        const [800.0, 2000.0, 4000.0, 5600.0, 7200.0];
    final rf = (json['rpmFactors'] as List<dynamic>?)
            ?.map((e) => (e as num).toDouble())
            .toList() ??
        const [0.42, 0.62, 0.88, 1.0, 1.04];
    return ModeBundle(
      xAxis: AxisDefinition.fromJson(Map<String, dynamic>.from(json['xAxis'] as Map)),
      yAxis: AxisDefinition.fromJson(Map<String, dynamic>.from(json['yAxis'] as Map)),
      map: BiasMap2D.fromJson(Map<String, dynamic>.from(json['map'] as Map)),
      alpha: (json['alpha'] as num?)?.toDouble() ?? 1,
      minPwm: (json['minPwm'] as num?)?.toDouble() ?? 0,
      maxPwm: (json['maxPwm'] as num?)?.toDouble() ?? 40,
      kSteer: (json['kSteer'] as num?)?.toDouble() ?? 0,
      deltaMaxPwm: (json['deltaMaxPwm'] as num?)?.toDouble() ?? 4,
      slipThresholdDrag: (json['slipThresholdDrag'] as num?)?.toDouble() ?? 3,
      dragSlipGateEnabled: json['dragSlipGateEnabled'] as bool? ?? false,
      gearFactors: gf,
      useTorqueEstimate: json['useTorqueEstimate'] as bool? ?? false,
      maxTorqueEstimateNm: (json['maxTorqueEstimateNm'] as num?)?.toDouble() ?? 600,
      slipInputMode: parseSlipInputMode(json['slipInputMode'] as String?),
      preControlBaselinePwm:
          (json['preControlBaselinePwm'] as num?)?.toDouble() ?? 14,
      rpmBreakpoints: rb,
      rpmFactors: rf,
      rampTimeSec: (json['rampTimeSec'] as num?)?.toDouble() ?? 0.12,
      pdfRules: PdfDriveRules.fromJson(
        json['pdfRules'] as Map<String, dynamic>?,
      ),
    );
  }
}
