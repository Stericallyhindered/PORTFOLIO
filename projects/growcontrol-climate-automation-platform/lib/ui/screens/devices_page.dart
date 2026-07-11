import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../domain/models/grow_device.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/add_tuya_device_sheet.dart';
class DevicesPage extends StatelessWidget {
  const DevicesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GrowRoomController>(
      builder: (context, room, _) {
        final devices = room.devices;
        final hubRemote = room.hubRemoteMode;
        final tuya = room.usesNativeTuya;

        return Stack(
          fit: StackFit.expand,
          children: [
            if (devices.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        hubRemote
                            ? 'Nothing in Supabase for this grow room yet.\n\n'
                                'Devices are stored in the cloud for this hub. '
                                'Sign into Smart Life once (antenna icon) so your '
                                'Tuya home syncs here, then pull to refresh.\n\n'
                                'The ESP32 hub reads the same rows for control '
                                'and telemetry.'
                            : tuya
                                ? 'No devices in your Tuya home yet.\n'
                                    'Sign in, then use ADD DEVICE to scan & pair.'
                                : 'No devices (non-production gateway).',
                        textAlign: TextAlign.center,
                        style: AppTheme.fontMono(12, color: AppTheme.mutedText),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => room.gateway.refreshDevices(),
                            icon: const Icon(Icons.refresh),
                            label: Text(
                              hubRemote ? 'REFRESH FROM CLOUD' : 'REFRESH',
                            ),
                          ),
                          if (hubRemote && tuya)
                            FilledButton.icon(
                              onPressed: () => showAddTuyaDeviceSheet(context),
                              icon: const Icon(Icons.radar),
                              label: const Text('ADD DEVICES'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              )
            else
              RefreshIndicator(
                color: AppTheme.neonCyan,
                onRefresh: () => room.gateway.refreshDevices(),
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  itemCount: devices.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final d = devices[index];
                    return Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: AppTheme.surfaceElevated.withOpacity(0.9),
                        border: Border.all(
                          color: AppTheme.neonCyan.withOpacity(0.12),
                        ),
                      ),
                      child: ListTile(
                        title: Text(d.name),
                        subtitle: Text(_subtitle(d, hubRemote, tuya)),
                        trailing: SizedBox(
                          width: 160,
                          child: DropdownButtonFormField<GrowDeviceRole>(
                            value: d.role,
                            isExpanded: true,
                            items: GrowDeviceRole.values
                                .map(
                                  (r) => DropdownMenuItem(
                                    value: r,
                                    child: Text(
                                      r.name,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (role) {
                              if (role != null) {
                                room.assignRole(d.id, role);
                              }
                            },
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        );
      },
    );
  }

  static String _subtitle(GrowDevice d, bool hubRemote, bool tuya) {
    final base = d.kind == GrowHardwareKind.tempHumiditySensor
        ? 'Temp / humidity sensor'
        : 'Smart outlet / switch';
    if (hubRemote || !tuya) {
      return tuya ? '$base · ${d.tuyaDeviceId}' : base;
    }
    return '$base · ${d.tuyaDeviceId}';
  }
}
