import 'package:flutter/material.dart';

import '../../../domain/mode_bundle.dart';
import '../../../domain/pdf_drive_rules.dart';
import '../../../domain/pdf_rules.dart';

/// Per-mode **PDF-shaped drive rules** (speed / corner / yaw–lat / tire), aligned with
/// training-module citations in [pdf_rules.dart].
Future<void> showPdfDriveRulesSheet({
  required BuildContext context,
  required ModeBundle bundle,
  required void Function(ModeBundle next) onApply,
}) async {
  var working = bundle;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (context, setModal) {
          final r = working.pdfRules;
          final h = MediaQuery.sizeOf(context).height * 0.9;
          void applyPdf(PdfDriveRules next) {
            setModal(() {
              working = working.copyWith(pdfRules: next);
            });
          }

          Widget sw(String label, bool v, void Function(bool) onChanged) {
            return SwitchListTile(
              dense: true,
              title: Text(label, style: const TextStyle(fontSize: 13)),
              value: v,
              onChanged: onChanged,
            );
          }

          Widget sl(
            String label,
            double v,
            double min,
            double max,
            int div,
            void Function(double) onChanged,
          ) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$label (${v.toStringAsFixed(2)})',
                    style: Theme.of(context).textTheme.labelMedium),
                Slider(
                  value: v.clamp(min, max),
                  min: min,
                  max: max,
                  divisions: div,
                  label: v.toStringAsFixed(2),
                  onChanged: onChanged,
                ),
              ],
            );
          }

          return SizedBox(
            height: h,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                Text('PDF drive rules',
                    style: Theme.of(context).textTheme.titleLarge),
                Text(
                  'Tunables mirror OEM-style layers from the training PDF '
                  '(pre-control baseline is separate on the map bundle).',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Divider(),
                sw('Master enable', r.enabled, (b) => applyPdf(r.copyWith(enabled: b))),
                Text('Citation — traction / dynamics',
                    style: Theme.of(context).textTheme.titleSmall),
                Text(pdfCitationDynamicsInputs,
                    style: Theme.of(context).textTheme.bodySmall),
                sw('Speed gate (≈${pdfDeactivateSpeedKmh.toStringAsFixed(0)} km/h context)',
                    r.applySpeedDeactivate,
                    (b) => applyPdf(r.copyWith(applySpeedDeactivate: b))),
                sl('Deactivate at km/h', r.speedDeactivateKmh, 80, 220, 28,
                    (v) => applyPdf(r.copyWith(speedDeactivateKmh: v))),
                sl('High-speed PWM retain factor', r.highSpeedPwmRetainFactor, 0.05,
                    0.95, 36, (v) => applyPdf(r.copyWith(highSpeedPwmRetainFactor: v))),
                const Divider(),
                Text('Tight corner + low torque (parking / maneuver)',
                    style: Theme.of(context).textTheme.titleSmall),
                sw('Apply tight-corner relax', r.applyTightCornerLowTorqueRelax,
                    (b) => applyPdf(r.copyWith(applyTightCornerLowTorqueRelax: b))),
                sl('|Steer| threshold °', r.tightCornerSteeringAbsDeg, 40, 180, 28,
                    (v) => applyPdf(r.copyWith(tightCornerSteeringAbsDeg: v))),
                sl('Engine torque below Nm', r.tightCornerEngineTorqueBelowNm, 20,
                    400, 38, (v) => applyPdf(r.copyWith(tightCornerEngineTorqueBelowNm: v))),
                sl('Relax factor (× PWM)', r.tightCornerRelaxFactor, 0.05, 0.8, 30,
                    (v) => applyPdf(r.copyWith(tightCornerRelaxFactor: v))),
                const Divider(),
                Text('Oversteer / understeer (yaw + lateral G)',
                    style: Theme.of(context).textTheme.titleSmall),
                sw('Oversteer boost (more front)', r.applyDynamicsOversteerBoost,
                    (b) => applyPdf(r.copyWith(applyDynamicsOversteerBoost: b))),
                sl('Yaw boost gain', r.yawOversteerBoostGain, 0, 0.6, 24,
                    (v) => applyPdf(r.copyWith(yawOversteerBoostGain: v))),
                sw('Positive yaw = rear-out (oversteer)', r.yawOversteerSignPositiveIsRearOut,
                    (b) => applyPdf(r.copyWith(yawOversteerSignPositiveIsRearOut: b))),
                sw('Understeer cut (open clutch)', r.applyDynamicsUndersteerCut,
                    (b) => applyPdf(r.copyWith(applyDynamicsUndersteerCut: b))),
                sl('Lateral G threshold', r.understeerLateralGThreshold, 0.2, 1.2, 20,
                    (v) => applyPdf(r.copyWith(understeerLateralGThreshold: v))),
                sl('Yaw quiet °/s', r.understeerYawQuietDegPerSec, 2, 45, 43,
                    (v) => applyPdf(r.copyWith(understeerYawQuietDegPerSec: v))),
                sl('Understeer cut gain', r.understeerCutGain, 0, 0.95, 38,
                    (v) => applyPdf(r.copyWith(understeerCutGain: v))),
                const Divider(),
                Text('Tire tolerance (clutch vs tire slip budget)',
                    style: Theme.of(context).textTheme.titleSmall),
                Text(pdfCitationTireTolerance,
                    style: Theme.of(context).textTheme.bodySmall),
                sw('Apply tire tolerance scaling', r.applyTireToleranceScaling,
                    (b) => applyPdf(r.copyWith(applyTireToleranceScaling: b))),
                sl('Tire PWM multiplier', r.tireTolerancePwmMultiplier, 0.7, 1.0,
                    30, (v) => applyPdf(r.copyWith(tireTolerancePwmMultiplier: v))),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () {
                    onApply(working);
                    Navigator.pop(ctx);
                  },
                  child: const Text('Apply to current mode'),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}
