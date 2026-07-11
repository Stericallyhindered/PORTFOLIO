import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../domain/settings/grow_scene.dart';
import '../../domain/vpd/vpd_leaf_air_chart.dart';
import '../../domain/vpd/vpd_tables.dart';
import '../../services/climate_calibration_store.dart';
import '../../services/settings_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/grid_scrim.dart';
import '../widgets/hitech_panel.dart';
import '../widgets/vpd_chart_panel.dart';
import '../widgets/vpd_reference_sheet.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GrowRoomController>(
      builder: (context, room, _) {
        final band =
            VpdReferenceTable.bandFor(room.growthStage, room.photoperiod);
        final hasLive = room.hasLiveEnvironmentReading;
        final leafVpd = room.lastDecision?.liveVpdKpa ??
            (hasLive
                ? vpdLeafBelowAirKpa(room.liveTempC!, room.liveRh!)
                : null);
        final targetMid = room.lastDecision?.targetVpdMidKpa;
        final zoneLabel = room.lastDecision?.zoneLabel ??
            (hasLive ? 'CONTROL ACTIVE' : 'NO LIVE SENSOR DATA');
        final samples = room.log.samples;
        final landscape =
            MediaQuery.of(context).orientation == Orientation.landscape;

        return Stack(
          fit: StackFit.expand,
          children: [
            const GridScrim(intensity: 0.85),
            ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Icon(Icons.hexagon_outlined,
                          color: AppTheme.neonCyan.withOpacity(0.85), size: 20),
                      const SizedBox(width: 10),
                      Text(
                        'LIVE TELEMETRY',
                        style: AppTheme.fontDisplay(12).copyWith(
                          letterSpacing: 4,
                          color: AppTheme.mutedText,
                        ),
                      ),
                    ],
                  ),
                ),
                if (room.activeAutomations.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ActiveAutomationStrip(
                      scenes: room.activeAutomations,
                    ),
                  ),
                Consumer<ClimateCalibrationStore>(
                  builder: (context, cal, _) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: AppTheme.neonYellow.withOpacity(0.25)),
                          color: AppTheme.surface.withOpacity(0.65),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              zoneLabel.toUpperCase(),
                              style: AppTheme.fontMono(11,
                                  color: AppTheme.neonYellow),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              hasLive
                                  ? 'Δleaf−air 2 °C · RH ± '
                                      '${cal.rhHalfWidth.toStringAsFixed(1)} · '
                                      'hum ${cal.humRhPerMinuteEma.toStringAsFixed(3)} '
                                      '· dehu ${cal.dehuRhPerMinuteEma.toStringAsFixed(3)} %RH/min'
                                  : 'No readings yet — pair sensor / assign roles on Devices.',
                              style: AppTheme.fontMono(10,
                                  color: AppTheme.mutedText),
                            ),
                            TextButton(
                              onPressed: () => showVpdReferenceSheet(context),
                              child: Text(
                                'VPD bands',
                                style: AppTheme.fontMono(11,
                                    color: AppTheme.neonPurple),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                if (landscape)
                  // Landscape: single row of 4 compact metric tiles so the
                  // chart below isn't pushed off the screen.
                  Row(
                    children: [
                      Expanded(
                        child: _MetricTile(
                          label: 'CANOPY °C',
                          value: room.liveTempC?.toStringAsFixed(1) ?? '—',
                          unit: room.liveTempC != null ? '°C' : '',
                          accent: AppTheme.neonCyan,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _MetricTile(
                          label: 'RH',
                          value: room.liveRh?.toStringAsFixed(1) ?? '—',
                          unit: room.liveRh != null ? '%' : '',
                          accent: AppTheme.neonPink,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _MetricTile(
                          label: 'VPD',
                          value: leafVpd?.toStringAsFixed(2) ?? '—',
                          unit: leafVpd != null ? 'kPa' : '',
                          accent: AppTheme.neonYellow,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _MetricTile(
                          label: 'TARGET',
                          value: targetMid?.toStringAsFixed(2) ?? '—',
                          unit: targetMid != null ? 'kPa' : '',
                          accent: AppTheme.neonPurple,
                        ),
                      ),
                    ],
                  )
                else ...[
                  Row(
                    children: [
                      Expanded(
                        child: _MetricTile(
                          label: 'CANOPY °C',
                          value: room.liveTempC?.toStringAsFixed(1) ?? '—',
                          unit: room.liveTempC != null ? '°C' : '',
                          accent: AppTheme.neonCyan,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _MetricTile(
                          label: 'RH',
                          value: room.liveRh?.toStringAsFixed(1) ?? '—',
                          unit: room.liveRh != null ? '%' : '',
                          accent: AppTheme.neonPink,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _MetricTile(
                          label: 'VPD',
                          value: leafVpd?.toStringAsFixed(2) ?? '—',
                          unit: leafVpd != null ? 'kPa' : '',
                          accent: AppTheme.neonYellow,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _MetricTile(
                          label: 'TARGET',
                          value: targetMid?.toStringAsFixed(2) ?? '—',
                          unit: targetMid != null ? 'kPa' : '',
                          accent: AppTheme.neonPurple,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                VpdChartPanel(
                  samples: samples,
                  band: band,
                  title: 'VPD trace',
                ),
                const SizedBox(height: 16),
                HiTechPanel(
                  accent: AppTheme.neonPurple,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'GROWTH CONTEXT',
                        style: AppTheme.fontDisplay(12).copyWith(
                          letterSpacing: 3,
                          color: AppTheme.mutedText,
                        ),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<GrowthStage>(
                        value: room.growthStage,
                        dropdownColor: AppTheme.surfaceElevated,
                        decoration: InputDecoration(
                          labelText: 'Stage',
                          labelStyle: AppTheme.fontMono(12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppTheme.neonCyan.withOpacity(0.25),
                            ),
                          ),
                        ),
                        items: GrowthStage.values
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(VpdReferenceTable.stageLabel(s)),
                              ),
                            )
                            .toList(),
                        onChanged: (v) {
                          if (v != null) room.setGrowthStage(v);
                        },
                      ),
                      const SizedBox(height: 14),
                      SegmentedButton<PhotoperiodPhase>(
                        segments: [
                          ButtonSegment(
                            value: PhotoperiodPhase.lightsOn,
                            label: Text(
                              'LIGHTS ON',
                              style: AppTheme.fontMono(10),
                            ),
                          ),
                          ButtonSegment(
                            value: PhotoperiodPhase.lightsOff,
                            label: Text(
                              'LIGHTS OFF',
                              style: AppTheme.fontMono(10),
                            ),
                          ),
                        ],
                        selected: {room.photoperiod},
                        onSelectionChanged: (set) {
                          room.setPhotoperiod(set.first);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.unit,
    required this.accent,
  });

  final String label;
  final String value;
  final String unit;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withOpacity(0.35)),
        gradient: LinearGradient(
          colors: [
            AppTheme.surfaceElevated.withOpacity(0.92),
            AppTheme.bgMid.withOpacity(0.75),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withOpacity(0.08),
            blurRadius: 18,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTheme.fontMono(10, color: AppTheme.mutedText),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: AppTheme.fontMono(24, color: accent),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  unit,
                  style: AppTheme.fontMono(11, color: accent.withOpacity(0.7)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Horizontally scrolling chip strip at the top of the dashboard listing every
/// currently active automation. Last chip is the "crown" — it owns the global
/// stage / photoperiod override (others contribute their rules to the merged
/// command map).
class _ActiveAutomationStrip extends StatelessWidget {
  const _ActiveAutomationStrip({required this.scenes});

  final List<GrowScene> scenes;

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsRepository>(
      builder: (context, settings, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: AppTheme.surface.withOpacity(0.65),
            border: Border.all(color: AppTheme.neonCyan.withOpacity(0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(Icons.layers_rounded,
                      size: 14, color: AppTheme.neonCyan),
                  const SizedBox(width: 6),
                  Text(
                    '${scenes.length} ACTIVE AUTOMATIONS',
                    style: AppTheme.fontMono(10, color: AppTheme.neonCyan),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (var i = 0; i < scenes.length; i++) ...[
                      _SceneChip(
                        scene: scenes[i],
                        crown: i == scenes.length - 1,
                        onClear: () {
                          final id = scenes[i].id;
                          unawaited(() async {
                            await settings.setSceneActive(id, false);
                            if (!context.mounted) return;
                            await context
                                .read<GrowRoomController>()
                                .setSceneActiveOnSupabase(id, false);
                          }());
                        },
                      ),
                      const SizedBox(width: 8),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SceneChip extends StatelessWidget {
  const _SceneChip({
    required this.scene,
    required this.crown,
    required this.onClear,
  });

  final GrowScene scene;
  final bool crown;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final accent = crown ? AppTheme.neonYellow : AppTheme.neonCyan;
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 4, 4, 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: accent.withOpacity(0.16),
        border: Border.all(color: accent.withOpacity(0.55)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (crown) ...[
            Icon(Icons.workspace_premium_rounded,
                size: 14, color: accent),
            const SizedBox(width: 4),
          ],
          Text(
            scene.name,
            style: AppTheme.fontMono(11, color: accent),
          ),
          const SizedBox(width: 4),
          InkResponse(
            radius: 14,
            onTap: onClear,
            child: Icon(Icons.close, size: 14, color: accent.withOpacity(0.85)),
          ),
        ],
      ),
    );
  }
}
