import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../ble/uuids.dart';
import '../../../providers/app_providers.dart';
import '../../../services/ble_device_client.dart';
import '../../theme/app_theme.dart';

class ConnectPage extends ConsumerStatefulWidget {
  const ConnectPage({super.key});

  @override
  ConsumerState<ConnectPage> createState() => _ConnectPageState();
}

class _ConnectPageState extends ConsumerState<ConnectPage> {
  List<ScanResult> _results = [];
  bool _scanning = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    FlutterBluePlus.scanResults.listen((list) {
      if (mounted) setState(() => _results = list);
    });
  }

  Future<void> _scan() async {
    setState(() {
      _scanning = true;
      _error = null;
    });
    try {
      await ref.read(bleConnectionProvider).startScan();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _scanning = false);
    }
  }

  Future<void> _connect(ScanResult result) async {
    setState(() => _error = null);
    try {
      final ble = ref.read(bleConnectionProvider);
      await ble.connect(result.device);
      final client = BleDeviceClient(result.device);
      await client.discover();
      await client.startLiveNotifications();
      ref.read(bleDeviceClientProvider.notifier).state = client;
      ref.invalidate(deviceInfoProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Linked to ${result.device.platformName}'),
            backgroundColor: GrannasColors.surfaceHigh,
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _disconnect() async {
    final client = ref.read(bleDeviceClientProvider);
    await client?.dispose();
    ref.read(bleDeviceClientProvider.notifier).state = null;
    await ref.read(bleConnectionProvider).disconnect();
    ref.invalidate(deviceInfoProvider);
  }

  @override
  Widget build(BuildContext context) {
    final connected = ref.watch(isConnectedProvider);
    final deviceInfo = ref.watch(deviceInfoProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        stripeHeader(
          child: Text('LINK', style: Theme.of(context).textTheme.titleLarge),
        ),
        const SizedBox(height: 16),
        grannasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                connected ? 'DEVICE ONLINE' : 'OFFLINE — CONFIG LOCAL ONLY',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: connected ? GrannasColors.accentAlt : GrannasColors.textMuted,
                    ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton.icon(
                    onPressed: _scanning ? null : _scan,
                    icon: _scanning
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.radar, size: 18),
                    label: Text(_scanning ? 'SCANNING' : 'SCAN'),
                  ),
                  if (connected)
                    OutlinedButton.icon(
                      onPressed: _disconnect,
                      icon: const Icon(Icons.link_off, size: 18),
                      label: const Text('DISCONNECT'),
                    ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: GrannasColors.danger)),
              ],
            ],
          ),
        ),
        if (connected) ...[
          const SizedBox(height: 16),
          deviceInfo.when(
            data: (info) {
              if (info == null) return const SizedBox.shrink();
              return grannasCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('DEVICE INFO', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    _infoRow('Firmware', info.fwVersion),
                    _infoRow('Hardware', info.hwRev),
                    _infoRow('Active preset', info.presetId),
                    _infoRow('I/O', '${info.inputCount} in / ${info.outputCount} out'),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Info error: $e'),
          ),
        ],
        const SizedBox(height: 16),
        Text('NEARBY', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        ..._filteredResults().map((r) {
          final name = r.device.platformName.isEmpty
              ? '(unnamed)'
              : r.device.platformName;
          final isTarget = name.contains('Grannas') ||
              r.advertisementData.serviceUuids
                  .any((u) => u.str.toLowerCase() == kServiceUuid.toLowerCase());
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: grannasCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: isTarget ? GrannasColors.accent : null,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        Text(
                          '${r.device.remoteId.str}  ·  ${r.rssi} dBm',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: connected ? null : () => _connect(r),
                    child: const Text('LINK'),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  List<ScanResult> _filteredResults() {
    final seen = <String>{};
    return _results.where((r) {
      final id = r.device.remoteId.str;
      if (seen.contains(id)) return false;
      seen.add(id);
      return true;
    }).toList()
      ..sort((a, b) => b.rssi.compareTo(a.rssi));
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyLarge),
          ),
        ],
      ),
    );
  }
}
