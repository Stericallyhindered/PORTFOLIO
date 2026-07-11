import 'axis_definition.dart';
import 'bias_map_2d.dart';
import 'custom_map_slot.dart';
import 'interpolation.dart';
import 'mode_bundle.dart';
import 'pdf_drive_rules.dart';
import 'pdf_rules.dart';
import 'preset_mode_id.dart';
import 'profile.dart';
import 'slip_input_mode.dart';

Profile createDefaultProfile() {
  const gMax = Profile.defaultGlobalMaxPwm;
  final baselinePwm =
      clampDouble(gMax * pdfPrecontrolFrontTorqueFraction, 0, gMax);

  /// \(5\) breakpoints ⇒ \(4\) map cells each axis — keeps UI grids compact.
  final xAxisKm = AxisDefinition(
    label: 'Engine torque (demand)',
    unit: 'Nm',
    breakpoints: const [0, 175, 350, 525, 700],
  );

  AxisDefinition slipAxis(SlipInputMode m) => AxisDefinition(
        label: m == SlipInputMode.kmhRearMinusFront
            ? 'Δ wheel speed (rear−front)'
            : 'Normalized slip (${m.name})',
        unit: m.name,
        breakpoints: m == SlipInputMode.kmhRearMinusFront
            ? const [0, 4, 10, 18, 30]
            : const [0, 0.02, 0.05, 0.09, 0.18],
      );

  final gearFactors = <int, double>{
    for (var g = 1; g <= 8; g++) g: clampDouble(1.0 - (g - 1) * 0.025, 0.75, 1.0),
  };

  ModeBundle mb({
    required BiasMap2D map,
    required double alpha,
    required double minPwm,
    required double maxPwm,
    required double kSteer,
    required double slipTh,
    required bool dragGate,
    required PdfDriveRules pdf,
    SlipInputMode slip = SlipInputMode.kmhRearMinusFront,
    double rampSec = pdfXdriveResponseApproxSec,
    double dFallback = 5,
    double? preBase,
  }) {
    final ctlBase = clampDouble(preBase ?? baselinePwm, 0, gMax);
    return ModeBundle(
      xAxis: xAxisKm,
      yAxis: slipAxis(slip),
      map: map,
      alpha: alpha,
      minPwm: minPwm,
      maxPwm: maxPwm,
      kSteer: kSteer,
      deltaMaxPwm: dFallback,
      slipThresholdDrag: slipTh,
      dragSlipGateEnabled: dragGate,
      gearFactors: gearFactors,
      preControlBaselinePwm: ctlBase,
      rampTimeSec: rampSec,
      pdfRules: pdf,
      slipInputMode: slip,
    );
  }

  PdfDriveRules autoPdf() => PdfDriveRules(
        yawOversteerBoostGain: 0.26,
        understeerCutGain: 0.52,
        tireTolerancePwmMultiplier: 0.96,
        highSpeedPwmRetainFactor: 0.24,
      );

  final rainPdf = PdfDriveRules(
    tireTolerancePwmMultiplier: 0.99,
    tightCornerRelaxFactor: 0.28,
    yawOversteerBoostGain: 0.31,
    understeerCutGain: 0.42,
  );
  final snowPdf = PdfDriveRules(
    tireTolerancePwmMultiplier: 0.97,
    tightCornerRelaxFactor: 0.22,
    yawOversteerBoostGain: 0.34,
    understeerCutGain: 0.38,
  );

  /// **Auto AWD** — centred on PDF nominal **front ~40 %** axle share (steady state PWM intent).
  final autoCells = [
    [
      clampDouble(baselinePwm * 0.74, 0, gMax),
      clampDouble(baselinePwm * 0.86, 0, gMax),
      clampDouble(baselinePwm * 0.95, 0, gMax),
      clampDouble(baselinePwm * 1.02, 0, gMax),
    ],
    [
      clampDouble(baselinePwm * 0.86, 0, gMax),
      baselinePwm,
      clampDouble(baselinePwm * 1.08, 0, gMax),
      clampDouble(baselinePwm * 1.18, 0, gMax),
    ],
    [
      clampDouble(baselinePwm * 0.95, 0, gMax),
      clampDouble(baselinePwm * 1.05, 0, gMax),
      clampDouble(baselinePwm * 1.2, 0, gMax),
      clampDouble(baselinePwm * 1.32, 0, gMax),
    ],
    [
      clampDouble(baselinePwm * 1.05, 0, gMax),
      clampDouble(baselinePwm * 1.18, 0, gMax),
      clampDouble(baselinePwm * 1.35, 0, gMax),
      gMax * 0.98,
    ],
  ];

  final presets = <PresetModeId, ModeBundle>{
    PresetModeId.rain: mb(
      map: BiasMap2D(cells: [
        [26, 28, 30, 32],
        [28, 30, 34, gMax],
        [30, 34, gMax - 2, gMax],
        [32, 36, gMax, gMax],
      ]),
      alpha: 1,
      minPwm: 24,
      maxPwm: gMax,
      kSteer: 0.34,
      slipTh: 0,
      dragGate: false,
      pdf: rainPdf,
    ),
    PresetModeId.snow: mb(
      map: BiasMap2D(cells: [
        [30, 32, 34, 36],
        [32, 34, 36, gMax - 2],
        [34, 36, gMax - 1, gMax],
        [35, gMax - 1, gMax, gMax],
      ]),
      alpha: 1,
      minPwm: 29,
      maxPwm: gMax,
      kSteer: 0.29,
      slipTh: 0,
      dragGate: false,
      pdf: snowPdf,
    ),
    PresetModeId.autoAwd: mb(
      map: BiasMap2D(cells: autoCells),
      /// \(\alpha\) weights **reactive** map vs **pre-control predictor** (\(PWM_{pred}\)).
      alpha: 0.68,
      minPwm: 9,
      maxPwm: gMax,
      kSteer: 0.41,
      slipTh: 0,
      dragGate: false,
      pdf: autoPdf(),
    ),
    PresetModeId.sportAwd: mb(
      map: BiasMap2D(cells: [
        [8.0, baselinePwm * 0.8, baselinePwm * 0.92, baselinePwm],
        [10.0, baselinePwm * 0.9, baselinePwm, baselinePwm * 1.1],
        [12.0, baselinePwm * 1.05, baselinePwm * 1.15, baselinePwm * 1.25],
        [14.0, baselinePwm * 1.08, baselinePwm * 1.22, gMax],
      ]),
      alpha: 0.58,
      minPwm: 5,
      maxPwm: gMax,
      kSteer: 0.55,
      slipTh: 0,
      dragGate: false,
      pdf: PdfDriveRules(
        yawOversteerBoostGain: 0.2,
        understeerCutGain: 0.58,
        tireTolerancePwmMultiplier: 0.99,
        highSpeedPwmRetainFactor: 0.29,
      ),
    ),
    PresetModeId.drag: mb(
      map: BiasMap2D(cells: [
        [0, 5, baselinePwm * 0.5, baselinePwm * 0.75],
        [0, 8, 18, baselinePwm],
        [2, baselinePwm, gMax - 10, gMax],
        [4, 18, gMax - 4, gMax],
      ]),
      alpha: 1,
      minPwm: 0,
      maxPwm: gMax,
      kSteer: 0.18,
      slipTh: 4,
      dragGate: true,
      pdf: PdfDriveRules(
        tireTolerancePwmMultiplier: 1,
        yawOversteerBoostGain: 0.18,
        understeerCutGain: 0.42,
      ),
      rampSec: pdfXdriveResponseApproxSec + 0.02,
      dFallback: 8,
    ),
    PresetModeId.driftRwd: mb(
      map: BiasMap2D(
        cells: List.generate(4, (_) => List<double>.filled(4, 0)),
      ),
      alpha: 1,
      minPwm: 0,
      maxPwm: 0,
      kSteer: 0,
      slipTh: 0,
      dragGate: false,
      pdf: const PdfDriveRules(enabled: false),
    ),
  };

  ModeBundle cust(BiasMap2D m, SlipInputMode s, PdfDriveRules p) => mb(
        map: m,
        alpha: 0.7,
        minPwm: 7,
        maxPwm: gMax,
        kSteer: 0.4,
        slipTh: 3,
        dragGate: false,
        pdf: p,
        slip: s,
      );

  final custom = [
    CustomMapSlot(
      slotId: 1,
      displayName: 'Track A',
      bundle: cust(
        BiasMap2D(cells: [
          [12, baselinePwm, baselinePwm * 1.1, baselinePwm * 1.2],
          [14, baselinePwm * 1.06, baselinePwm * 1.15, baselinePwm * 1.3],
          [16, baselinePwm * 1.14, baselinePwm * 1.26, gMax],
          [18, baselinePwm * 1.22, baselinePwm * 1.32, gMax],
        ]),
        SlipInputMode.normalizedByVehicleSpeed,
        PdfDriveRules(tireTolerancePwmMultiplier: 0.985),
      ),
    ),
    CustomMapSlot(
      slotId: 2,
      displayName: 'Street',
      bundle: cust(
        BiasMap2D(cells: [
          [10, 14, baselinePwm * 0.98, baselinePwm],
          [
            baselinePwm * 0.9,
            baselinePwm,
            baselinePwm * 1.1,
            baselinePwm * 1.2,
          ],
          [
            baselinePwm,
            baselinePwm * 1.1,
            baselinePwm * 1.26,
            gMax - 6,
          ],
          [
            baselinePwm * 1.06,
            baselinePwm * 1.22,
            gMax - 4,
            gMax,
          ],
        ]),
        SlipInputMode.normalizedByRear,
        PdfDriveRules(tireTolerancePwmMultiplier: 0.98),
      ),
    ),
    CustomMapSlot(
      slotId: 3,
      displayName: 'Ice test',
      bundle: cust(
        presets[PresetModeId.snow]!.map,
        SlipInputMode.kmhRearMinusFront,
        PdfDriveRules(
          tireTolerancePwmMultiplier: 0.95,
          understeerCutGain: 0.35,
        ),
      ),
    ),
  ];

  return Profile(
    version: 3,
    presets: presets,
    customSlots: custom,
    maxSteerAngleDeg: 540,
    telemetryHz: 50,
    globalMaxPwm: gMax,
  );
}
