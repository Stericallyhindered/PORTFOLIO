import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../domain/models/grow_device.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/add_tuya_device_sheet.dart';
import '../widgets/arcade_button.dart';

/// Manual override tab — sensors (temp/RH) at top, outlets below as compact
/// arcade buttons so everything fits more comfortably on phone screens.
class ManualPage extends StatelessWidget {
  const ManualPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GrowRoomController>(
      builder: (context, room, _) {
        final sensors = room.devices
            .where((d) => d.kind == GrowHardwareKind.tempHumiditySensor)
            .toList(growable: false);
        final outlets = room.devices
            .where((d) => d.kind == GrowHardwareKind.smartOutlet)
            .toList(growable: false);

        if (outlets.isEmpty && sensors.isEmpty) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _ManualHoldBanner(),
              Expanded(child: _empty(context, room)),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _ManualHoldBanner(),
            Expanded(
              child: RefreshIndicator(
                color: AppTheme.neonCyan,
                onRefresh: () => room.gateway.refreshDevices(),
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    if (sensors.isNotEmpty)
                      SliverToBoxAdapter(
                        child: _SensorsPanel(sensors: sensors, room: room),
                      )
                    else if (outlets.isNotEmpty)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
                          child: Text(
                            'OUTLETS',
                            style: AppTheme.fontMono(10, color: AppTheme.mutedText)
                                .copyWith(letterSpacing: 2),
                          ),
                        ),
                      ),
                    if (outlets.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Text(
                              'No smart outlets paired — use Mesh to add plugs.',
                              textAlign: TextAlign.center,
                              style:
                                  AppTheme.fontMono(12, color: AppTheme.mutedText),
                            ),
                          ),
                        ),
                      )
                    else
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(12, 6, 12, 28),
                        sliver: SliverLayoutBuilder(
                          builder: (context, constraints) {
                            final w = constraints.crossAxisExtent;
                            final cross = w >= 720
                                ? 4
                                : w >= 520
                                    ? 3
                                    : w >= 340
                                        ? 2
                                        : 1;
                            return SliverGrid(
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: cross,
                                mainAxisSpacing: 10,
                                crossAxisSpacing: 10,
                                childAspectRatio: 1.22,
                              ),
                              delegate: SliverChildBuilderDelegate(
                                (context, i) => _OutletTile(
                                  device: outlets[i],
                                  room: room,
                                ),
                                childCount: outlets.length,
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _empty(BuildContext context, GrowRoomController room) {
    final hub = room.hubRemoteMode;
    final tuya = room.usesNativeTuya;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 96, 24, 24),
      children: [
        Icon(
          Icons.power_settings_new,
          size: 56,
          color: AppTheme.mutedText.withOpacity(0.6),
        ),
        const SizedBox(height: 16),
        Text(
          'NO DEVICES',
          textAlign: TextAlign.center,
          style: AppTheme.fontDisplay(15).copyWith(letterSpacing: 3),
        ),
        const SizedBox(height: 12),
        Text(
          hub
              ? 'Manual uses the same device list as Mesh — rows come from '
                  'Supabase for this hub. Add or sync hardware from Smart Life '
                  '(antenna), then pull to refresh.'
              : 'Manual control needs the production Supabase gateway.',
          textAlign: TextAlign.center,
          style: AppTheme.fontMono(12, color: AppTheme.mutedText),
        ),
        const SizedBox(height: 20),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 10,
          runSpacing: 10,
          children: [
            OutlinedButton.icon(
              onPressed: () => room.gateway.refreshDevices(),
              icon: const Icon(Icons.refresh),
              label: Text(hub ? 'REFRESH FROM CLOUD' : 'REFRESH'),
            ),
            if (hub && tuya)
              FilledButton.icon(
                onPressed: () => showAddTuyaDeviceSheet(context),
                icon: const Icon(Icons.radar),
                label: const Text('ADD DEVICES'),
              ),
          ],
        ),
      ],
    );
  }
}

class _SensorsPanel extends StatelessWidget {
  const _SensorsPanel({required this.sensors, required this.room});

  final List<GrowDevice> sensors;
  final GrowRoomController room;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                'TEMP / HUMIDITY',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText)
                    .copyWith(letterSpacing: 2),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => room.gateway.refreshDevices(),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'REFRESH',
                  style: AppTheme.fontMono(10, color: AppTheme.neonCyan),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...sensors.map(
            (d) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: _SensorRow(device: d, room: room),
            ),
          ),
          const SizedBox(height: 4),
          Divider(height: 1, color: AppTheme.neonCyan.withOpacity(0.15)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                'OUTLETS',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText)
                    .copyWith(letterSpacing: 2),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SensorRow extends StatelessWidget {
  const _SensorRow({required this.device, required this.room});

  final GrowDevice device;
  final GrowRoomController room;

  @override
  Widget build(BuildContext context) {
    final online = room.isDeviceOnline(device.id);
    final snap = room.sensorSnapshotOf(device.id);
    final t = snap?.$1;
    final rh = snap?.$2;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: AppTheme.surfaceElevated.withOpacity(0.75),
        border: Border.all(color: AppTheme.neonCyan.withOpacity(0.12)),
      ),
      child: Row(
        children: [
          _onlinePip(online),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  device.name.isEmpty ? 'Sensor' : device.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTheme.fontDisplay(12).copyWith(letterSpacing: 0.8),
                ),
                Text(
                  _roleLabel(device.role),
                  style: AppTheme.fontMono(9, color: AppTheme.mutedText),
                ),
              ],
            ),
          ),
          Text(
            t != null && rh != null
                ? '${t.toStringAsFixed(1)}°C  ·  ${rh.toStringAsFixed(0)}% RH'
                : '—  ·  —',
            style: AppTheme.fontMono(11, color: online ? Colors.white : AppTheme.mutedText),
          ),
        ],
      ),
    );
  }

  Widget _onlinePip(bool online) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: online ? AppTheme.neonYellow : AppTheme.alertOrange,
      ),
    );
  }

  static String _roleLabel(GrowDeviceRole role) {
    switch (role) {
      case GrowDeviceRole.unassigned:
        return 'Temp / humidity sensor';
      case GrowDeviceRole.canopySensor:
        return 'Canopy sensor';
      case GrowDeviceRole.humidifier:
      case GrowDeviceRole.dehumidifier:
      case GrowDeviceRole.exhaustFan:
      case GrowDeviceRole.intakeFan:
      case GrowDeviceRole.circulationFan:
      case GrowDeviceRole.waterPump:
      case GrowDeviceRole.lightOutlet:
      case GrowDeviceRole.heater:
      case GrowDeviceRole.genericOutlet:
        return role.name;
    }
  }
}

class _OutletTile extends StatefulWidget {
  const _OutletTile({required this.device, required this.room});

  final GrowDevice device;
  final GrowRoomController room;

  @override
  State<_OutletTile> createState() => _OutletTileState();
}

class _OutletTileState extends State<_OutletTile> {
  bool _busy = false;
  Timer? _burstTicker;

  @override
  void initState() {
    super.initState();
    _burstTicker =
        Timer.periodic(const Duration(seconds: 1), (_) => _maybeRebuild());
  }

  void _maybeRebuild() {
    final s = widget.room.burstStatusOf(widget.device.id);
    if (s != null && s.phaseRemaining != null && mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _burstTicker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.device;
    final room = widget.room;
    final state = room.outletStateOf(d.id);
    final online = room.isDeviceOnline(d.id);
    final burst = room.burstStatusOf(d.id);

    final color = _accentForRole(d.role);
    final unknown = state == null;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppTheme.surfaceElevated.withOpacity(0.92),
        border: Border.all(
          color: (state == true ? color : AppTheme.neonCyan).withOpacity(0.18),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  d.name.isEmpty ? 'Outlet' : d.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTheme.fontDisplay(11).copyWith(letterSpacing: 0.6),
                ),
              ),
              _statusPip(online: online, on: state == true, unknown: unknown),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            _roleLabel(d.role),
            style: AppTheme.fontMono(8, color: AppTheme.mutedText)
                .copyWith(letterSpacing: 1.2),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (burst != null && burst.desired) ...[
            const SizedBox(height: 2),
            Text(
              _burstSubtitle(burst),
              style: AppTheme.fontMono(8, color: AppTheme.neonYellow)
                  .copyWith(letterSpacing: 0.8),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 4),
          Expanded(
            child: Center(
              child: ArcadeButton(
                isOn: state == true,
                color: color,
                enabled: online && !unknown,
                busy: _busy,
                diameter: 76,
                label: state == true ? 'ON' : (unknown ? '—' : 'OFF'),
                onTap: () => _toggle(state),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            !online
                ? 'OFFLINE'
                : unknown
                    ? 'UNKNOWN'
                    : (state == true ? 'ON' : 'OFF'),
            textAlign: TextAlign.center,
            style: AppTheme.fontMono(
              8,
              color: !online
                  ? AppTheme.alertOrange
                  : unknown
                      ? AppTheme.mutedText
                      : (state == true ? color : AppTheme.mutedText),
            ).copyWith(letterSpacing: 1.2),
            maxLines: 1,
          ),
        ],
      ),
    );
  }

  Future<void> _toggle(bool? state) async {
    if (_busy) return;
    final next = !(state ?? false);
    setState(() => _busy = true);
    try {
      await widget.room.setOutletManual(widget.device.id, next);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Toggle failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _statusPip({
    required bool online,
    required bool on,
    required bool unknown,
  }) {
    final Color color = !online
        ? AppTheme.alertOrange
        : unknown
            ? AppTheme.mutedText
            : (on ? AppTheme.neonYellow : AppTheme.mutedText);
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: online && on
            ? [BoxShadow(color: color.withOpacity(0.6), blurRadius: 6)]
            : const [],
      ),
    );
  }

  static Color _accentForRole(GrowDeviceRole role) {
    switch (role) {
      case GrowDeviceRole.humidifier:
        return AppTheme.neonCyan;
      case GrowDeviceRole.dehumidifier:
        return AppTheme.neonPurple;
      case GrowDeviceRole.lightOutlet:
        return AppTheme.neonYellow;
      case GrowDeviceRole.heater:
        return AppTheme.alertOrange;
      case GrowDeviceRole.exhaustFan:
      case GrowDeviceRole.intakeFan:
      case GrowDeviceRole.circulationFan:
        return AppTheme.neonCyan;
      case GrowDeviceRole.waterPump:
        return AppTheme.neonCyan;
      case GrowDeviceRole.canopySensor:
      case GrowDeviceRole.unassigned:
      case GrowDeviceRole.genericOutlet:
        return AppTheme.neonPink;
    }
  }

  static String _burstSubtitle(
      ({bool relayOn, bool desired, Duration? phaseRemaining, bool inOnPhase})
          b) {
    final remaining = b.phaseRemaining;
    final phaseLabel = b.inOnPhase ? 'PULSE' : 'COOL';
    if (remaining == null) {
      return 'BURST · $phaseLabel';
    }
    final secs = remaining.inSeconds;
    if (secs >= 60) {
      final m = remaining.inMinutes;
      final s = secs % 60;
      return 'BURST $phaseLabel $m:${s.toString().padLeft(2, "0")}';
    }
    return 'BURST $phaseLabel ${secs}s';
  }

  static String _roleLabel(GrowDeviceRole role) {
    switch (role) {
      case GrowDeviceRole.unassigned:
        return 'UNASSIGNED';
      case GrowDeviceRole.canopySensor:
        return 'CANOPY SENSOR';
      case GrowDeviceRole.humidifier:
        return 'HUMIDIFIER';
      case GrowDeviceRole.dehumidifier:
        return 'DEHUMIDIFIER';
      case GrowDeviceRole.exhaustFan:
        return 'EXHAUST';
      case GrowDeviceRole.intakeFan:
        return 'INTAKE';
      case GrowDeviceRole.circulationFan:
        return 'CIRC FAN';
      case GrowDeviceRole.waterPump:
        return 'PUMP';
      case GrowDeviceRole.lightOutlet:
        return 'LIGHT';
      case GrowDeviceRole.heater:
        return 'HEATER';
      case GrowDeviceRole.genericOutlet:
        return 'OUTLET';
    }
  }
}

/// Compact strip rendered above the outlet grid while the Manual tab is the
/// visible page.
class _ManualHoldBanner extends StatelessWidget {
  const _ManualHoldBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: AppTheme.neonCyan.withOpacity(0.10),
        border: Border.all(color: AppTheme.neonCyan.withOpacity(0.55)),
      ),
      child: Row(
        children: [
          Icon(Icons.pan_tool_alt_rounded,
              size: 14, color: AppTheme.neonCyan),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'MANUAL OVERRIDE — automation paused on this tab',
              style: AppTheme.fontMono(10, color: AppTheme.neonCyan)
                  .copyWith(letterSpacing: 1.1),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
