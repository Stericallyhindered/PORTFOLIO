import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/app_providers.dart';

class ConnectPage extends ConsumerStatefulWidget {
  const ConnectPage({super.key});

  @override
  ConsumerState<ConnectPage> createState() => _ConnectPageState();
}

class _ConnectPageState extends ConsumerState<ConnectPage> {
  List<ScanResult> _results = [];

  @override
  Widget build(BuildContext context) {
    final adapter = ref.watch(
      StreamProvider((ref) => FlutterBluePlus.adapterState),
    );

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bluetooth', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          adapter.when(
            data: (s) => Text('Adapter: $s'),
            loading: () => const Text('Adapter: …'),
            error: (e, _) => Text('Adapter error: $e'),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            children: [
              FilledButton(
                onPressed: () async {
                  await ref.read(bleServiceProvider).startScan();
                  FlutterBluePlus.scanResults.listen((list) {
                    setState(() => _results = list);
                  });
                },
                child: const Text('Scan'),
              ),
              OutlinedButton(
                onPressed: () => ref.read(bleServiceProvider).stopScan(),
                child: const Text('Stop scan'),
              ),
              OutlinedButton(
                onPressed: () async {
                  await ref.read(bleServiceProvider).disconnect();
                  syncBleTransports(ref);
                  setState(() {});
                },
                child: const Text('Disconnect'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: _results.length,
              itemBuilder: (ctx, i) {
                final r = _results[i];
                final name = r.device.platformName.isEmpty
                    ? '(no name)'
                    : r.device.platformName;
                return ListTile(
                  title: Text(name),
                  subtitle: Text(r.device.remoteId.str),
                  trailing: FilledButton(
                    onPressed: () async {
                      await ref.read(bleServiceProvider).connect(r.device);
                      syncBleTransports(ref);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Connected')),
                        );
                      }
                      setState(() {});
                    },
                    child: const Text('Connect'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
