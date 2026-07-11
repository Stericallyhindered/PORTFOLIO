import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../theme/app_theme.dart';

/// Minimal provisioning payload for future firmware parsers (BLE / serial).
/// Today the hub copies `hubs.id` into NVS via the captive-portal **Hub UUID**
/// field or `hub_secrets.h`; scanning is optional convenience.
String hubPairingPayload(String hubId) {
  return '{"v":1,"hub_id":"$hubId"}';
}

Future<void> showHubPairingSheet(
  BuildContext context, {
  required String hubId,
}) {
  final payload = hubPairingPayload(hubId);
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppTheme.surfaceElevated,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.mutedText.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'PAIR HUB HARDWARE',
                style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
              ),
              const SizedBox(height: 10),
              Text(
                'Use this UUID in the hub captive portal (Hub UUID) or in '
                'hub_secrets.h so NVS matches the grow room the app created.',
                textAlign: TextAlign.center,
                style: AppTheme.fontMono(11, color: AppTheme.mutedText),
              ),
              const SizedBox(height: 20),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: QrImageView(
                    data: payload,
                    version: QrVersions.auto,
                    size: 200,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Color(0xFF0A1628),
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Color(0xFF0A1628),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SelectableText(
                hubId,
                style: AppTheme.fontMono(11, color: AppTheme.neonCyan),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: hubId));
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Hub UUID copied',
                              style: AppTheme.fontMono(12),
                            ),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.copy, size: 18),
                    label: const Text('COPY UUID'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: payload));
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(
                            content: Text(
                              'QR payload copied',
                              style: AppTheme.fontMono(12),
                            ),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.data_object, size: 18),
                    label: const Text('COPY JSON'),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}
