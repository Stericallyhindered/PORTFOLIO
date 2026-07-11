import 'package:flutter/material.dart';

import '../../domain/vpd/vpd_tables.dart';
import '../../theme/app_theme.dart';

Future<void> showVpdReferenceSheet(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppTheme.surfaceElevated,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.92,
      builder: (_, scroll) => _VpdReferenceBody(scrollController: scroll),
    ),
  );
}

class _VpdReferenceBody extends StatelessWidget {
  const _VpdReferenceBody({required this.scrollController});

  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'VPD REFERENCE',
            style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
          ),
          const SizedBox(height: 6),
          Text(
            'Built-in bands match common canopy charts (leaf Δ 2 °C vs air in automation). '
            'Automation compares live leaf-air VPD to these targets.',
            style: AppTheme.fontMono(10, color: AppTheme.mutedText),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: ListView(
              controller: scrollController,
              children: [
                for (final stage in GrowthStage.values) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: Text(
                      VpdReferenceTable.stageLabel(stage),
                      style: AppTheme.fontMono(11,
                          color: AppTheme.neonCyan.withOpacity(0.9)),
                    ),
                  ),
                  _BandRow(
                    label: 'Lights on',
                    band: VpdReferenceTable.bandFor(
                      stage,
                      PhotoperiodPhase.lightsOn,
                    ),
                  ),
                  const SizedBox(height: 6),
                  _BandRow(
                    label: 'Lights off',
                    band: VpdReferenceTable.bandFor(
                      stage,
                      PhotoperiodPhase.lightsOff,
                    ),
                  ),
                  const Divider(height: 22),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BandRow extends StatelessWidget {
  const _BandRow({
    required this.label,
    required this.band,
  });

  final String label;
  final VpdBand band;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.neonPink.withOpacity(0.15)),
        color: AppTheme.surface.withOpacity(0.55),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: AppTheme.fontMono(11)),
          ),
          Text(
            '${band.minKpa.toStringAsFixed(2)} – ${band.maxKpa.toStringAsFixed(2)} kPa',
            style: AppTheme.fontMono(12, color: AppTheme.neonYellow),
          ),
        ],
      ),
    );
  }
}
