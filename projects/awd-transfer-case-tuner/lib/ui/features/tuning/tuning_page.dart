import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/bias_map_2d.dart';
import '../../../domain/mode_bundle.dart';
import '../../../domain/preset_mode_id.dart';
import '../../../domain/profile.dart';
import '../../../domain/selected_mode.dart';
import '../../../domain/slip_input_mode.dart';
import '../../../providers/app_providers.dart';
import '../../../domain/pdf_rules.dart';
import '../../../ui/map_helpers.dart';
import 'pdf_drive_rules_sheet.dart';

ModeBundle _bundle(Profile p, SelectedMode m) {
  return switch (m) {
    SelectedPreset(:final preset) => p.bundleForPreset(preset),
    SelectedCustom(:final slotId) => p.bundleForCustom(slotId),
  };
}

class TuningPage extends ConsumerWidget {
  const TuningPage({super.key});

  static List<SelectedMode> get _allModes => [
        const SelectedPreset(PresetModeId.rain),
        const SelectedPreset(PresetModeId.snow),
        const SelectedPreset(PresetModeId.autoAwd),
        const SelectedPreset(PresetModeId.sportAwd),
        const SelectedPreset(PresetModeId.drag),
        const SelectedPreset(PresetModeId.driftRwd),
        const SelectedCustom(1),
        const SelectedCustom(2),
        const SelectedCustom(3),
      ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final mode = ref.watch(selectedModeProvider);
    final bundle = _bundle(profile, mode);
    final tel = ref.watch(telemetryProvider);

    final customRefs = profile.customSlots
        .map((s) => CustomNameRef(s.slotId, s.displayName))
        .toList();

    final modeIndex = _allModes.indexWhere((m) => modeEquals(m, mode)).clamp(0, _allModes.length - 1);

    final snap = tel.asData?.value;
    final torqueIn =
        snap == null ? null : effectiveTorqueIn(snap, bundle);
    final cursor = cursorCell(torqueNm: torqueIn, snap: snap, bundle: bundle);

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text('Tuning maps', style: Theme.of(context).textTheme.headlineSmall),
              FilledButton.tonal(
                onPressed: () => _axesDialog(context, ref, profile, mode),
                child: const Text('Configure axes'),
              ),
              OutlinedButton(
                onPressed: mode is SelectedPreset && mode.preset == PresetModeId.driftRwd
                    ? null
                    : () => showPdfDriveRulesSheet(
                          context: context,
                          bundle: bundle,
                          onApply: (ModeBundle next) => _persist(ref, mode, next),
                        ),
                child: const Text('PDF drive rules'),
              ),
              FilledButton(
                onPressed: () {
                  ref.read(profileProvider.notifier).save();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile saved')),
                  );
                },
                child: const Text('Save'),
              ),
              OutlinedButton(
                onPressed: () => _mathSheet(context),
                child: const Text('Math & PDF basis'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              DropdownButton<int>(
                value: modeIndex,
                items: List.generate(
                  _allModes.length,
                  (i) => DropdownMenuItem(
                    value: i,
                    child: Text(_allModes[i].label(customNames: customRefs)),
                  ),
                ),
                onChanged: (i) {
                  if (i != null) ref.read(selectedModeProvider.notifier).set(_allModes[i]);
                },
              ),
              if (mode is SelectedCustom)
                SizedBox(
                  width: 180,
                  child: TextField(
                    decoration: const InputDecoration(labelText: 'Custom name'),
                    controller: TextEditingController(
                      text: profile.customSlots
                          .firstWhere((s) => s.slotId == mode.slotId)
                          .displayName,
                    ),
                    onSubmitted: (t) {
                      ref.read(profileProvider.notifier).updateCustom(mode.slotId, name: t);
                    },
                  ),
                ),
              DropdownButton<PresetModeId>(
                hint: const Text('Duplicate from preset'),
                items: PresetModeId.values
                    .where((p) => p != PresetModeId.driftRwd)
                    .map(
                      (p) => DropdownMenuItem(
                        value: p,
                        child: Text(p.displayName),
                      ),
                    )
                    .toList(),
                onChanged: (src) {
                  if (src == null) return;
                  final srcB = profile.bundleForPreset(src);
                  final clone = ModeBundle.fromJson(srcB.toJson());
                  _persist(ref, mode, clone);
                },
              ),
            ],
          ),
          if (mode is SelectedPreset && mode.preset == PresetModeId.driftRwd)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.orangeAccent),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Drift / RWD: front PWM forced to 0%. Map editing disabled.',
                ),
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            flex: 12,
            child: mode is SelectedPreset && mode.preset == PresetModeId.driftRwd
                ? const Center(child: Text('No front bias in Drift / RWD'))
                : _HeatmapTable(
                    profile: profile,
                    mode: mode,
                    bundle: bundle,
                    cursor: cursor,
                    onCell: (i, j, v) => _updateCell(ref, profile, mode, i, j, v),
                  ),
          ),
          const SizedBox(height: 8),
          Text(
            'Live cell: ${cursor == null ? "— (telemetry + torque/slip validity)" : "Y-row ${cursor.$1}, X-col ${cursor.$2} "} '
            '| slip mode ${bundle.slipInputMode.name} | α=${bundle.alpha.toStringAsFixed(2)} ',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  static Future<void> _mathSheet(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        final h = MediaQuery.sizeOf(context).height * 0.88;
        return SizedBox(
          height: h,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            children: [
              Text('PWM math (full)',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Text(r'PWM_map = Σ bilinear corners M_ij on torque × slip breakpoints'),
              Text(
                  r'PWM_pred = driver / pre-control path (accel, RPM, torque, lateral, steer relax) anchored to nominal ~'),
              Text(
                  '${(pdfPrecontrolFrontTorqueFraction * 100).toStringAsFixed(0)}% front axle intent (training PDF § pre-control).',
                  style: Theme.of(context).textTheme.bodySmall),
              Text(
                  r'PWM_mix = α·PWM_map + (1−α)·PWM_pred   (DSC-style reactive vs predictive)'),
              Text(
                  r'PWM_dyn = f_dynamics_yaw_lat(PWM_mix) × f_tire_tolerance   (traction + tire-slip budget)'),
              Text(r'PWM_g = PWM_dyn · GearFactor(G) · (1 − k_steer·|δ|/δ_max)'),
              Text(r'PWM_c = clamp(PWM_g, P_min, P_max)'),
              Text(
                  r'Drag gate: if rear−front slip Δ ≤ slipThreshold → PWM_c ← 0 (launch protection)'),
              Text(
                  'PDF gates: speed ≥ ${pdfDeactivateSpeedKmh.toStringAsFixed(0)} km/h retains low coupling (training context); '
                  'tight corner + low torque relax; DSC self-test ${pdfDscSelfTestSpeedKmh.toStringAsFixed(0)} km/h / '
                  'wheel-plausibility from ${pdfWheelSpeedPlausibilityStartKmh.toStringAsFixed(2)} km/h.'),
              Text(
                  'PWM_final = slew(...) with Δ_max = span/(τ·f_h); PDF narrative τ ≈ ${pdfXdriveResponseApproxSec}s (clutch response).'),
              const Divider(height: 24),
              Text('PDF citations',
                  style: Theme.of(context).textTheme.titleMedium),
              Text(pdfCitationPrecontrolInputs,
                  style: Theme.of(context).textTheme.bodySmall),
              Text(pdfCitationDynamicsInputs,
                  style: Theme.of(context).textTheme.bodySmall),
              Text(pdfCitationTireTolerance,
                  style: Theme.of(context).textTheme.bodySmall),
              Text(pdfCitationVgsgDsc,
                  style: Theme.of(context).textTheme.bodySmall),
              Text(pdfCitationTccAlwaysOn,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        );
      },
    );
  }

  static void _persist(WidgetRef ref, SelectedMode mode, ModeBundle bundle) {
    switch (mode) {
      case SelectedPreset(:final preset):
        ref.read(profileProvider.notifier).setBundleForPreset(preset, bundle);
      case SelectedCustom(:final slotId):
        ref.read(profileProvider.notifier).updateCustom(slotId, bundle: bundle);
    }
  }

  static void _updateCell(
    WidgetRef ref,
    Profile profile,
    SelectedMode mode,
    int slipRow,
    int torqueCol,
    double value,
  ) {
    final b = _bundle(profile, mode);
    final next = b.map.cells.map((row) => [...row]).toList();
    next[slipRow][torqueCol] = value.clamp(0, profile.globalMaxPwm);
    final nb = b.copyWith(
      map: BiasMap2D(
        cells: next,
        revision: b.map.revision + 1,
      ),
    );
    _persist(ref, mode, nb);
  }

  static Future<void> _axesDialog(
    BuildContext context,
    WidgetRef ref,
    Profile profile,
    SelectedMode mode,
  ) async {
    final b = _bundle(profile, mode);
    final xCtrl = TextEditingController(text: b.xAxis.breakpoints.join(', '));
    final yCtrl = TextEditingController(text: b.yAxis.breakpoints.join(', '));
    var slipSel = b.slipInputMode;
    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setLocal) => AlertDialog(
          title: const Text('Configure axes'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: xCtrl,
                  decoration: const InputDecoration(
                    labelText: 'X breakpoints (comma-separated)',
                  ),
                ),
                TextField(
                  controller: yCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Y breakpoints (comma-separated)',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<SlipInputMode>(
                  value: slipSel,
                  decoration: const InputDecoration(
                    labelText: 'Slip scalar (Y-axis)',
                  ),
                  items: SlipInputMode.values
                      .map(
                        (m) => DropdownMenuItem(
                          value: m,
                          child: Text(m.name, style: const TextStyle(fontSize: 13)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setLocal(() => slipSel = v);
                  },
                ),
                const SizedBox(height: 8),
                const Text(
                  'Resize fills new cells with the mean of existing cells.',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () {
                final tx = _parseList(xCtrl.text);
                final sy = _parseList(yCtrl.text);
                if (tx.length < 2 || sy.length < 2) return;
                final mean = _meanGrid(b.map.cells);
                final resized = b.map.copyResize(
                  newRows: sy.length - 1,
                  newCols: tx.length - 1,
                  fill: mean,
                );
                final nb = b.copyWith(
                  xAxis: b.xAxis.copyWith(breakpoints: tx),
                  yAxis: b.yAxis.copyWith(breakpoints: sy),
                  map: resized,
                  slipInputMode: slipSel,
                );
                _persist(ref, mode, nb);
                Navigator.pop(ctx);
              },
              child: const Text('Apply'),
            ),
          ],
        ),
      ),
    );
  }

  static List<double> _parseList(String s) {
    return s
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .map((e) => double.tryParse(e))
        .whereType<double>()
        .toList();
  }

  static double _meanGrid(List<List<double>> g) {
    var n = 0;
    double sum = 0;
    for (final r in g) {
      for (final v in r) {
        sum += v;
        n++;
      }
    }
    return n == 0 ? 0 : sum / n;
  }
}

class _HeatmapTable extends StatelessWidget {
  const _HeatmapTable({
    required this.profile,
    required this.mode,
    required this.bundle,
    required this.cursor,
    required this.onCell,
  });

  final Profile profile;
  final SelectedMode mode;
  final ModeBundle bundle;
  final (int i, int j)? cursor;
  final void Function(int slipRow, int torqueCol, double v) onCell;

  @override
  Widget build(BuildContext context) {
    final rows = bundle.map.rows;
    final cols = bundle.map.cols;
    final tx = bundle.xAxis.breakpoints;
    final sy = bundle.yAxis.breakpoints;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: Table(
          defaultColumnWidth: const FixedColumnWidth(68),
          border: TableBorder.all(color: Colors.white24),
          children: [
            TableRow(
              children: [
                const SizedBox(height: 36, child: Center(child: Text('Slip \\ Torque'))),
                ...List.generate(cols, (j) {
                  final lo = tx[j];
                  final hi = tx[j + 1];
                  return Padding(
                    padding: const EdgeInsets.all(4),
                    child: Text(
                      '${lo.toStringAsFixed(0)}–${hi.toStringAsFixed(0)}\n${bundle.xAxis.unit}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 10),
                    ),
                  );
                }),
              ],
            ),
            ...List.generate(rows, (displayR) {
              final slipRow = rows - 1 - displayR;
              final slo = sy[slipRow];
              final shi = sy[slipRow + 1];
              return TableRow(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(4),
                    child: Text(
                      '${slo.toStringAsFixed(0)}–${shi.toStringAsFixed(0)} ${bundle.yAxis.unit}',
                      style: const TextStyle(fontSize: 10),
                    ),
                  ),
                  ...List.generate(cols, (j) {
                    final val = bundle.map.cells[slipRow][j];
                    final active = cursor != null &&
                        cursor!.$1 == slipRow &&
                        cursor!.$2 == j;
                    return GestureDetector(
                      onTap: () async {
                        final ctrl = TextEditingController(text: val.toStringAsFixed(1));
                        final next = await showDialog<double>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('PWM % (0–40)'),
                            content: TextField(
                              controller: ctrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Cancel'),
                              ),
                              FilledButton(
                                onPressed: () =>
                                    Navigator.pop(ctx, double.tryParse(ctrl.text)),
                                child: const Text('OK'),
                              ),
                            ],
                          ),
                        );
                        if (next != null) onCell(slipRow, j, next);
                      },
                      child: Container(
                        height: 44,
                        alignment: Alignment.center,
                        color: heatmapColor(val, profile.globalMaxPwm)
                            .withValues(alpha: active ? 1 : 0.85),
                        child: Text(
                          val.toStringAsFixed(1),
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: active ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}
