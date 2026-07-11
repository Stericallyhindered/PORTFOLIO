import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/models/sensor_sample.dart';
import '../../domain/telemetry/spike_detector.dart';
import '../../domain/telemetry/telemetry_math.dart';
import '../../domain/telemetry/telemetry_window.dart';
import '../../theme/app_theme.dart';
import 'hitech_panel.dart';

enum TelemetryChartLayout {
  /// Single chart — temp & RH normalized to shared vertical span with precise touch tooltips.
  overlay,

  /// Stacked — temperature strip then RH strip (shared timeline).
  stacked,
}

class TelemetryLabChart extends StatefulWidget {
  const TelemetryLabChart({
    super.key,
    required this.allSamples,
    this.footerHint,
  });

  final List<SensorSample> allSamples;

  /// One-line hint shown under the chart (e.g. local-store summary). Null hides it.
  final String? footerHint;

  @override
  State<TelemetryLabChart> createState() => _TelemetryLabChartState();
}

class _TelemetryLabChartState extends State<TelemetryLabChart> {
  TelemetryWindow _window = TelemetryWindow.twentyFourHours;
  TelemetryChartLayout _layout = TelemetryChartLayout.stacked;
  bool _showTemp = true;
  bool _showRh = true;

  List<SensorSample> _prepared() {
    final now = DateTime.now();
    final from = now.subtract(_window.duration);
    var slice = widget.allSamples
        .where((s) => !s.timestamp.isBefore(from) && !s.timestamp.isAfter(now))
        .toList();
    slice.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    if (_window == TelemetryWindow.oneYear) {
      slice = aggregateDaily(slice);
    } else if (_window.prefersAggregation && slice.length > 800) {
      slice = aggregateDaily(slice);
    }
    if (slice.length > 700) {
      slice = downsampleSeries(slice, 640);
    }
    return slice;
  }

  @override
  Widget build(BuildContext context) {
    final slice = _prepared();
    final spikes = SpikeDetector().findSpikes(slice);

    return SingleChildScrollView(
      padding: EdgeInsets.zero,
      child: HiTechPanel(
        accent: AppTheme.neonPurple,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Row(
            children: [
              Text(
                'ENV TELEMETRY',
                style: AppTheme.fontDisplay(13).copyWith(
                  letterSpacing: 3,
                  color: AppTheme.mutedText,
                ),
              ),
              const Spacer(),
              Text(
                '${slice.length} pts · ${_window.label}',
                style: AppTheme.fontMono(11, color: AppTheme.mutedText),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'RANGE',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
              ...TelemetryWindow.values.map((w) {
                final sel = _window == w;
                return ChoiceChip(
                  label: Text(w.label),
                  selected: sel,
                  onSelected: (_) => setState(() => _window = w),
                  selectedColor: AppTheme.neonCyan.withOpacity(0.25),
                  labelStyle: AppTheme.fontMono(11,
                      color: sel ? AppTheme.neonCyan : AppTheme.mutedText),
                );
              }),
            ],
          ),
          const SizedBox(height: 10),
          // Wrap (not Row) so the MERGE/SPLIT segmented button drops onto a
          // second line on narrow phones instead of clipping by ~40px.
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              FilterChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.thermostat,
                        size: 14,
                        color:
                            _showTemp ? AppTheme.neonCyan : AppTheme.mutedText),
                    const SizedBox(width: 6),
                    Text('TEMP °C',
                        style: AppTheme.fontMono(11,
                            color: _showTemp
                                ? AppTheme.neonCyan
                                : AppTheme.mutedText)),
                  ],
                ),
                selected: _showTemp,
                onSelected: (v) => setState(() => _showTemp = v),
              ),
              FilterChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.water_drop_outlined,
                        size: 14,
                        color:
                            _showRh ? AppTheme.neonPink : AppTheme.mutedText),
                    const SizedBox(width: 6),
                    Text('RH %',
                        style: AppTheme.fontMono(11,
                            color: _showRh
                                ? AppTheme.neonPink
                                : AppTheme.mutedText)),
                  ],
                ),
                selected: _showRh,
                onSelected: (v) => setState(() => _showRh = v),
              ),
              SegmentedButton<TelemetryChartLayout>(
                segments: [
                  ButtonSegment(
                    value: TelemetryChartLayout.overlay,
                    label: Text('MERGE', style: AppTheme.fontMono(10)),
                  ),
                  ButtonSegment(
                    value: TelemetryChartLayout.stacked,
                    label: Text('SPLIT', style: AppTheme.fontMono(10)),
                  ),
                ],
                selected: {_layout},
                onSelectionChanged: (s) => setState(() => _layout = s.first),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (slice.length < 2)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'Collecting telemetry… need more samples in this window.',
                style: AppTheme.fontMono(12, color: AppTheme.mutedText),
              ),
            )
          else if (_layout == TelemetryChartLayout.stacked)
            Column(
              children: [
                if (_showTemp)
                  _stripChart(
                    slice,
                    color: AppTheme.neonCyan,
                    title: 'TEMP °C',
                    value: (s) => s.tempC,
                    formatY: (v) => v.toStringAsFixed(1),
                  ),
                if (_showTemp && _showRh) const SizedBox(height: 12),
                if (_showRh)
                  _stripChart(
                    slice,
                    color: AppTheme.neonPink,
                    title: 'RH %',
                    value: (s) => s.rhPercent,
                    formatY: (v) => v.toStringAsFixed(0),
                  ),
              ],
            )
          else
            _overlayChart(slice),
          if (spikes.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              'SPIKE SCAN',
              style: AppTheme.fontDisplay(11).copyWith(
                letterSpacing: 2,
                color: AppTheme.alertOrange,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: spikes.take(12).map((sp) {
                final label = switch (sp.kind) {
                  SpikeKind.rhUp =>
                    'RH ↑ ${sp.deltaPerMinute.toStringAsFixed(1)}%/min',
                  SpikeKind.rhDown =>
                    'RH ↓ ${sp.deltaPerMinute.abs().toStringAsFixed(1)}%/min',
                  SpikeKind.tempUp =>
                    'T ↑ ${sp.deltaPerMinute.toStringAsFixed(2)}°C/min',
                  SpikeKind.tempDown =>
                    'T ↓ ${sp.deltaPerMinute.abs().toStringAsFixed(2)}°C/min',
                };
                return Tooltip(
                  message:
                      '${MaterialLocalizations.of(context).formatFullDate(sp.at)}',
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppTheme.alertOrange.withOpacity(0.35)),
                      color: AppTheme.surface.withOpacity(0.8),
                    ),
                    child: Text(
                      '$label @ ${TimeOfDay.fromDateTime(sp.at).format(context)}',
                      style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          if (widget.footerHint != null && widget.footerHint!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.storage_rounded,
                    size: 12, color: AppTheme.mutedText.withOpacity(0.7)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.footerHint!,
                    style: AppTheme.fontMono(9, color: AppTheme.mutedText),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          ],
        ),
      ),
    );
  }

  Widget _stripChart(
    List<SensorSample> slice, {
    required Color color,
    required String title,
    required double Function(SensorSample) value,
    required String Function(double) formatY,
  }) {
    final spots = <FlSpot>[];
    var i = 0.0;
    double minV = double.infinity;
    double maxV = -double.infinity;
    for (final s in slice) {
      final v = value(s);
      minV = v < minV ? v : minV;
      maxV = v > maxV ? v : maxV;
      spots.add(FlSpot(i, v));
      i += 1;
    }
    final pad = (maxV - minV) * 0.12;
    if (pad == 0) {
      minV -= 1;
      maxV += 1;
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: AppTheme.fontMono(11, color: color.withOpacity(0.85))),
        const SizedBox(height: 6),
        SizedBox(
          height: 140,
          child: LineChart(
            LineChartData(
              minY: minV - (pad == 0 ? 0 : pad),
              maxY: maxV + (pad == 0 ? 0 : pad),
              clipData: const FlClipData.all(),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(
                  color: Colors.white.withOpacity(0.05),
                  strokeWidth: 1,
                ),
              ),
              titlesData: FlTitlesData(
                topTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 34,
                    getTitlesWidget: (v, _) => Text(
                      formatY(v),
                      style: AppTheme.fontMono(9,
                          color: Colors.white.withOpacity(0.45)),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: (spots.length / 5).clamp(1, 999).toDouble(),
                    getTitlesWidget: (vi, _) {
                      final idx = vi.floor().clamp(0, slice.length - 1);
                      final t = slice[idx].timestamp;
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          _axisTime(t),
                          style: AppTheme.fontMono(8,
                              color: Colors.white.withOpacity(0.35)),
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  curveSmoothness: 0.2,
                  color: color,
                  barWidth: 2.4,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [
                        color.withOpacity(0.35),
                        color.withOpacity(0.02),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ],
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (spots) {
                    return spots.map((ls) {
                      final idx = ls.x.toInt().clamp(0, slice.length - 1);
                      final s = slice[idx];
                      return LineTooltipItem(
                        '${s.tempC.toStringAsFixed(1)}°C · '
                        '${s.rhPercent.toStringAsFixed(0)}% RH',
                        TextStyle(color: color, fontSize: 11),
                      );
                    }).toList();
                  },
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _axisTime(DateTime t) {
    switch (_window) {
      case TelemetryWindow.oneHour:
      case TelemetryWindow.twentyFourHours:
        return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
      case TelemetryWindow.sevenDays:
      case TelemetryWindow.thirtyDays:
        return '${t.month}/${t.day}';
      case TelemetryWindow.oneYear:
        return '${t.month}/${t.year % 100}';
    }
  }

  Widget _overlayChart(List<SensorSample> slice) {
    double tMin = slice.map((s) => s.tempC).reduce((a, b) => a < b ? a : b);
    double tMax = slice.map((s) => s.tempC).reduce((a, b) => a > b ? a : b);
    if ((tMax - tMin) < 0.25) {
      tMin -= 0.5;
      tMax += 0.5;
    }
    final spotsT = <FlSpot>[];
    final spotsRh = <FlSpot>[];
    var i = 0.0;
    for (final s in slice) {
      final tn = (s.tempC - tMin) / (tMax - tMin);
      spotsT.add(FlSpot(i, tn.clamp(0, 1)));
      spotsRh.add(FlSpot(i, (s.rhPercent / 100).clamp(0, 1)));
      i += 1;
    }
    return SizedBox(
      height: 220,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: 1,
          clipData: const FlClipData.all(),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 0.25,
            getDrawingHorizontalLine: (_) => FlLine(
              color: Colors.white.withOpacity(0.06),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 38,
                getTitlesWidget: (v, _) {
                  final temp =
                      tMin + v * (tMax - tMin);
                  final rh = v * 100;
                  return Text(
                    '${temp.toStringAsFixed(0)}° ${rh.toStringAsFixed(0)}%',
                    style: AppTheme.fontMono(8,
                        color: Colors.white.withOpacity(0.4)),
                  );
                },
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: (spotsT.length / 6).clamp(1, 999).toDouble(),
                getTitlesWidget: (vi, _) {
                  final idx = vi.floor().clamp(0, slice.length - 1);
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      _axisTime(slice[idx].timestamp),
                      style: AppTheme.fontMono(8,
                          color: Colors.white.withOpacity(0.35)),
                    ),
                  );
                },
              ),
            ),
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            if (_showTemp)
              LineChartBarData(
                spots: spotsT,
                isCurved: true,
                curveSmoothness: 0.25,
                color: AppTheme.neonCyan,
                barWidth: 2.2,
                dotData: const FlDotData(show: false),
              ),
            if (_showRh)
              LineChartBarData(
                spots: spotsRh,
                isCurved: true,
                curveSmoothness: 0.25,
                color: AppTheme.neonPink,
                barWidth: 2.2,
                dotData: const FlDotData(show: false),
              ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (touched) {
                return touched.map((ls) {
                  final idx = ls.x.toInt().clamp(0, slice.length - 1);
                  final s = slice[idx];
                  return LineTooltipItem(
                    '${s.tempC.toStringAsFixed(2)}°C\n'
                    '${s.rhPercent.toStringAsFixed(1)}% RH',
                    const TextStyle(color: Colors.white, fontSize: 11),
                  );
                }).toList();
              },
            ),
          ),
        ),
      ),
    );
  }
}
