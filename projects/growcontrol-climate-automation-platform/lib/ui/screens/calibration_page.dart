import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../domain/models/dehu_learning_record.dart';
import '../../domain/models/humidifier_ramp_record.dart';
import '../../services/climate_calibration_store.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/grid_scrim.dart';
import '../widgets/vpd_reference_sheet.dart';

double? _medianRh(List<double> xs) {
  if (xs.isEmpty) return null;
  final s = [...xs]..sort();
  return s[s.length ~/ 2];
}

List<double> _takeLastN(List<double> all, int n) {
  if (all.length <= n) return all;
  return all.sublist(all.length - n);
}

class CalibrationPage extends StatelessWidget {
  const CalibrationPage({super.key});

  static const int _segmentWindow = 15;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const GridScrim(intensity: 0.55),
        Consumer2<GrowRoomController, ClimateCalibrationStore>(
          builder: (context, room, cal, _) {
            final log = room.log;
            final dehuSeg = log.dehuSegments;
            final humSeg = log.humSegments;

            final dehuRates =
                _takeLastN(dehuSeg.map((r) => r.rhPerMinute).toList(), _segmentWindow);
            final humRates =
                _takeLastN(humSeg.map((r) => r.rhPerMinute).toList(), _segmentWindow);

            final medDehu = _medianRh(dehuRates);
            final medHum = _medianRh(humRates);

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
              children: [
                Text(
                  'LOAD CALIBRATION',
                  style: AppTheme.fontDisplay(12).copyWith(
                    letterSpacing: 3,
                    color: AppTheme.mutedText,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Each humidifier / dehumidifier ON→OFF cycle logs RH vs time. '
                  'Tick learning updates EMA continuously; here you can seed rates from '
                  'recent segments or reset.',
                  style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                ),
                const SizedBox(height: 16),
                _CardBlock(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ACTIVE MODEL',
                        style: AppTheme.fontMono(10, color: AppTheme.neonCyan),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Humidify ${cal.humRhPerMinuteEma.toStringAsFixed(4)} %RH/min\n'
                        'Dry ${cal.dehuRhPerMinuteEma.toStringAsFixed(4)} %RH/min\n'
                        'RH deadband ±${cal.rhHalfWidth.toStringAsFixed(1)} pts · '
                        '${cal.learningConfidenceTicks} tick samples',
                        style: AppTheme.fontMono(11),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          FilledButton(
                            onPressed: (medHum != null || medDehu != null)
                                ? () async {
                                    await cal.seedRatesOptional(
                                      humidifyRhPerMinute: medHum,
                                      dryRhPerMinute: medDehu,
                                    );
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Calibration rates updated'),
                                        ),
                                      );
                                    }
                                  }
                                : null,
                            child: Text(
                              medHum != null || medDehu != null
                                  ? 'USE MEDIAN (LAST $_segmentWindow)'
                                  : 'NO SEGMENTS YET',
                            ),
                          ),
                          OutlinedButton(
                            onPressed: () async {
                              await cal.resetLearning();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Learning reset')),
                                );
                              }
                            },
                            child: const Text('RESET'),
                          ),
                          TextButton(
                            onPressed: () => showVpdReferenceSheet(context),
                            child: Text(
                              'VPD TABLE',
                              style: AppTheme.fontMono(11,
                                  color: AppTheme.neonPurple),
                            ),
                          ),
                        ],
                      ),
                      if (medHum != null || medDehu != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          'Median from logs: '
                          'hum ${medHum?.toStringAsFixed(4) ?? "—"} · '
                          'dehu ${medDehu?.toStringAsFixed(4) ?? "—"} %RH/min',
                          style: AppTheme.fontMono(10,
                              color: AppTheme.mutedText),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'DEHUMIDIFIER SEGMENTS (${dehuSeg.length})',
                  style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                ),
                const SizedBox(height: 8),
                _SegmentTableDehu(rows: dehuSeg.reversed.take(12).toList()),
                const SizedBox(height: 18),
                Text(
                  'HUMIDIFIER SEGMENTS (${humSeg.length})',
                  style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                ),
                const SizedBox(height: 8),
                _SegmentTableHum(rows: humSeg.reversed.take(12).toList()),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _CardBlock extends StatelessWidget {
  const _CardBlock({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.neonYellow.withOpacity(0.22)),
        color: AppTheme.surface.withOpacity(0.72),
      ),
      child: child,
    );
  }
}

class _SegmentTableDehu extends StatelessWidget {
  const _SegmentTableDehu({required this.rows});

  final List<DehumidifierPullDownRecord> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return Text(
        'None yet — runs while dehumidifier relay cycles.',
        style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
      );
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 36,
        dataRowMinHeight: 36,
        dataRowMaxHeight: 48,
        columns: const [
          DataColumn(label: Text('ΔRH')),
          DataColumn(label: Text('%/min')),
          DataColumn(label: Text('s')),
          DataColumn(label: Text('°C')),
        ],
        rows: rows.map((r) {
          final dr = r.rhEnd - r.rhStart;
          return DataRow(
            cells: [
              DataCell(Text(dr.toStringAsFixed(1))),
              DataCell(Text(r.rhPerMinute.toStringAsFixed(3))),
              DataCell(Text('${r.duration.inSeconds}')),
              DataCell(Text(r.tempCAvg.toStringAsFixed(1))),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _SegmentTableHum extends StatelessWidget {
  const _SegmentTableHum({required this.rows});

  final List<HumidifierRampRecord> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return Text(
        'None yet — runs while humidifier relay cycles.',
        style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
      );
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 36,
        dataRowMinHeight: 36,
        dataRowMaxHeight: 48,
        columns: const [
          DataColumn(label: Text('ΔRH')),
          DataColumn(label: Text('%/min')),
          DataColumn(label: Text('s')),
          DataColumn(label: Text('°C')),
        ],
        rows: rows.map((r) {
          final dr = r.rhEnd - r.rhStart;
          return DataRow(
            cells: [
              DataCell(Text(dr.toStringAsFixed(1))),
              DataCell(Text(r.rhPerMinute.toStringAsFixed(3))),
              DataCell(Text('${r.duration.inSeconds}')),
              DataCell(Text(r.tempCAvg.toStringAsFixed(1))),
            ],
          );
        }).toList(),
      ),
    );
  }
}
