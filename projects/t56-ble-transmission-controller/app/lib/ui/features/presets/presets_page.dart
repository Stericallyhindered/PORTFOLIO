import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/models.dart';
import '../../../providers/app_providers.dart';
import '../../theme/app_theme.dart';

class PresetsPage extends ConsumerWidget {
  const PresetsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bundled = ref.watch(bundledPresetsProvider);
    final active = ref.watch(activePresetProvider);
    final connected = ref.watch(isConnectedProvider);
    final client = ref.watch(bleDeviceClientProvider);

    return bundled.when(
      data: (presets) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            stripeHeader(
              child: Text('PRESETS', style: Theme.of(context).textTheme.titleLarge),
            ),
            const SizedBox(height: 16),
            active.when(
              data: (current) => grannasCard(
                child: Text(
                  'ACTIVE: ${current?.name ?? 'None'}',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            ...presets.map((p) => _PresetCard(
                  preset: p,
                  onApplyLocal: () async {
                    await ref.read(activePresetProvider.notifier).setPreset(p);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Loaded ${p.name} locally')),
                      );
                    }
                  },
                  onPushDevice: connected && client != null
                      ? () async {
                          try {
                            await client.pushPreset(p);
                            await ref
                                .read(activePresetProvider.notifier)
                                .setPreset(p);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Pushed ${p.name} to device')),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Push failed: $e')),
                              );
                            }
                          }
                        }
                      : null,
                )),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Failed to load presets: $e')),
    );
  }
}

class _PresetCard extends StatelessWidget {
  const _PresetCard({
    required this.preset,
    required this.onApplyLocal,
    this.onPushDevice,
  });

  final GearMappingPreset preset;
  final VoidCallback onApplyLocal;
  final VoidCallback? onPushDevice;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: grannasCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(preset.name, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(preset.description, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                FilledButton(
                  onPressed: onApplyLocal,
                  child: const Text('LOAD'),
                ),
                if (onPushDevice != null)
                  OutlinedButton(
                    onPressed: onPushDevice,
                    child: const Text('PUSH TO DEVICE'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
