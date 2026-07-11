import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/app_providers.dart';
import '../../theme/app_theme.dart';

class FirmwarePage extends ConsumerStatefulWidget {
  const FirmwarePage({super.key});

  @override
  ConsumerState<FirmwarePage> createState() => _FirmwarePageState();
}

class _FirmwarePageState extends ConsumerState<FirmwarePage> {
  File? _selectedFile;
  List<int>? _sha256;
  double _progress = 0;
  bool _uploading = false;
  String? _status;

  Future<void> _pickFirmware() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['bin'],
    );
    if (result == null || result.files.single.path == null) return;
    final file = File(result.files.single.path!);
    final bytes = await file.readAsBytes();
    final hash = sha256.convert(bytes).bytes;
    setState(() {
      _selectedFile = file;
      _sha256 = hash;
      _progress = 0;
      _status = null;
    });
  }

  Future<void> _upload() async {
    final client = ref.read(bleDeviceClientProvider);
    if (client == null || _selectedFile == null || _sha256 == null) return;

    setState(() {
      _uploading = true;
      _progress = 0;
      _status = 'Transferring…';
    });

    try {
      final bytes = await _selectedFile!.readAsBytes();
      await client.performOta(
        bytes,
        _sha256!,
        onProgress: (p) {
          if (mounted) setState(() => _progress = p);
        },
      );
      if (mounted) {
        setState(() => _status = 'Complete — device rebooting');
      }
    } catch (e) {
      if (mounted) setState(() => _status = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final connected = ref.watch(isConnectedProvider);
    final deviceInfo = ref.watch(deviceInfoProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        stripeHeader(
          child: Text('FIRMWARE', style: Theme.of(context).textTheme.titleLarge),
        ),
        const SizedBox(height: 16),
        deviceInfo.when(
          data: (info) => grannasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('INSTALLED', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  info?.fwVersion ?? (connected ? '…' : 'Connect device to read'),
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                if (info != null)
                  Text(
                    '${info.hwRev}  ·  preset: ${info.presetId}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
              ],
            ),
          ),
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),
        const SizedBox(height: 16),
        grannasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('OTA UPDATE', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Select a firmware .bin built from the PlatformIO project.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  FilledButton(
                    onPressed: _uploading ? null : _pickFirmware,
                    child: const Text('PICK .BIN'),
                  ),
                  FilledButton(
                    onPressed: (!connected || _selectedFile == null || _uploading)
                        ? null
                        : _upload,
                    child: Text(_uploading ? 'UPLOADING…' : 'FLASH'),
                  ),
                ],
              ),
              if (_selectedFile != null) ...[
                const SizedBox(height: 12),
                Text(
                  _selectedFile!.path.split(Platform.pathSeparator).last,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (_sha256 != null)
                  Text(
                    'SHA256: ${_sha256!.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                  ),
              ],
              if (_uploading || _progress > 0) ...[
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: _progress,
                    minHeight: 10,
                    backgroundColor: GrannasColors.surfaceHigh,
                    color: GrannasColors.accent,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(_progress * 100).toStringAsFixed(0)}%',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
              if (_status != null) ...[
                const SizedBox(height: 8),
                Text(
                  _status!,
                  style: TextStyle(
                    color: _status!.startsWith('Failed')
                        ? GrannasColors.danger
                        : GrannasColors.accentAlt,
                  ),
                ),
              ],
              if (!connected) ...[
                const SizedBox(height: 12),
                Text(
                  'Connect to Grannas-T56 to flash firmware.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: GrannasColors.accentAlt,
                      ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
