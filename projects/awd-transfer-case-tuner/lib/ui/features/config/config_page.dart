import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../domain/default_profile.dart';
import '../../../providers/app_providers.dart';

class ConfigPage extends ConsumerWidget {
  const ConfigPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final storage = ref.watch(profileStorageProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Text('Configuration', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Telemetry rate for slew math (Hz)'),
            subtitle: Slider(
              value: profile.telemetryHz.clamp(10, 200),
              min: 10,
              max: 200,
              divisions: 19,
              label: profile.telemetryHz.round().toString(),
              onChanged: (v) {
                ref.read(profileProvider.notifier).replace(
                      profile.copyWith(telemetryHz: v),
                    );
              },
            ),
          ),
          ListTile(
            title: const Text('Max steering angle (deg)'),
            subtitle: Slider(
              value: profile.maxSteerAngleDeg,
              min: 180,
              max: 720,
              divisions: 54,
              label: profile.maxSteerAngleDeg.round().toString(),
              onChanged: (v) {
                ref.read(profileProvider.notifier).replace(
                      profile.copyWith(maxSteerAngleDeg: v),
                    );
              },
            ),
          ),
          const Divider(),
          ListTile(
            title: const Text('Reset to defaults'),
            subtitle: const Text('Reload factory map bundle — discards edits.'),
            trailing: FilledButton.tonal(
              onPressed: () {
                ref.read(profileProvider.notifier).replace(createDefaultProfile());
              },
              child: const Text('Reset'),
            ),
          ),
          ListTile(
            title: const Text('Save profile'),
            subtitle: const Text('Persist to app documents'),
            trailing: FilledButton(
              onPressed: () async {
                await ref.read(profileProvider.notifier).save();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Saved')),
                  );
                }
              },
              child: const Text('Save'),
            ),
          ),
          ListTile(
            title: const Text('Export JSON'),
            subtitle: const Text('Share profile file'),
            trailing: FilledButton.tonal(
              onPressed: () async {
                final name = 'awd_profile_${DateTime.now().millisecondsSinceEpoch}';
                final file = await storage.exportNamedFile(name, profile);
                await Share.shareXFiles([XFile(file.path)], text: 'AWD Tuner profile');
              },
              child: const Text('Export'),
            ),
          ),
          ListTile(
            title: const Text('Import JSON'),
            subtitle: const Text('Pick a previously exported profile'),
            trailing: FilledButton.tonal(
              onPressed: () async {
                final r = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: const ['json'],
                  withData: false,
                );
                final p = r?.files.single.path;
                if (p == null) return;
                final loaded = await storage.importFromPath(p);
                if (loaded != null) {
                  ref.read(profileProvider.notifier).replace(loaded);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Profile imported')),
                    );
                  }
                }
              },
              child: const Text('Import'),
            ),
          ),
          const Divider(),
          const ListTile(
            title: Text('Theory'),
            subtitle: Text(
              'Control mirrors OEM-style layers: pre-control (driver torque demand), '
              'traction/dynamics (slip / yaw), then clutch PWM with slew limiting. '
              'BLE carries real telemetry only — no simulated dash values.',
            ),
          ),
        ],
      ),
    );
  }
}
