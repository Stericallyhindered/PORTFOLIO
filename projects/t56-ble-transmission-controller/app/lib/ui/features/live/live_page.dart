import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/app_providers.dart';
import '../../theme/app_theme.dart';

class LivePage extends ConsumerWidget {
  const LivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connected = ref.watch(isConnectedProvider);
    final statusAsync = ref.watch(liveStatusProvider);

    return statusAsync.when(
      data: (status) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            stripeHeader(
              child: Text('LIVE', style: Theme.of(context).textTheme.titleLarge),
            ),
            const SizedBox(height: 24),
            Center(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32),
                decoration: BoxDecoration(
                  color: GrannasColors.surface,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: GrannasColors.accent, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: GrannasColors.accent.withValues(alpha: 0.15),
                      blurRadius: 24,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      status.gearLabel.toUpperCase(),
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                            color: GrannasColors.accent,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      connected ? 'GEAR DETECTED' : 'NO DEVICE — STANDBY',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: GrannasColors.textMuted,
                          ),
                    ),
                    if (status.outputsDisabled) ...[
                      const SizedBox(height: 8),
                      Text(
                        'OUTPUTS DISABLED (BMW TABLE EMPTY)',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: GrannasColors.accentAlt,
                            ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('T56 INPUTS', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            for (var i = 0; i < 3; i++)
              _channelBar(
                context,
                label: 'IN ${i + 1}',
                duty: status.inputs[i].dutyPct,
                period: status.inputs[i].periodMs,
              ),
            const SizedBox(height: 16),
            Text('BMW OUTPUTS', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            for (var i = 0; i < 2; i++)
              _channelBar(
                context,
                label: 'OUT ${i + 1}',
                duty: status.outputs[i].dutyPct,
                period: status.outputs[i].periodMs,
                accent: GrannasColors.accentAlt,
              ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Status error: $e')),
    );
  }

  Widget _channelBar(
    BuildContext context, {
    required String label,
    required double duty,
    required double period,
    Color accent = GrannasColors.accent,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: grannasCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: Theme.of(context).textTheme.labelLarge),
                Text(
                  '${duty.toStringAsFixed(1)}%  ·  ${period.toStringAsFixed(2)} ms',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: (duty / 100).clamp(0.0, 1.0),
                minHeight: 8,
                backgroundColor: GrannasColors.surfaceHigh,
                color: accent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
