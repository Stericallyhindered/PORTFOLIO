import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/app_providers.dart';

class DiagnosticsPage extends ConsumerWidget {
  const DiagnosticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adapter = ref.watch(StreamProvider((_) => FlutterBluePlus.adapterState));
    final ble = ref.watch(bleServiceProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Text('Diagnostics', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          adapter.when(
            data: (s) => ListTile(title: const Text('Adapter'), subtitle: Text('$s')),
            loading: () => const ListTile(title: Text('Adapter'), subtitle: Text('…')),
            error: (e, _) => ListTile(title: const Text('Adapter'), subtitle: Text('$e')),
          ),
          ListTile(
            title: const Text('BLE device'),
            subtitle: Text(ble.device?.remoteId.str ?? 'None'),
          ),
          const ListTile(
            title: Text('Telemetry codec'),
            subtitle: Text(
              'Notify characteristic decoding not configured — no frames until UUID/packet layout is added in BleTelemetrySource.',
            ),
          ),
          const ListTile(
            title: Text('PWM command codec'),
            subtitle: Text(
              'Outbound duty encoding not configured — BlePwmCommandSink ready when protocol is fixed.',
            ),
          ),
        ],
      ),
    );
  }
}
