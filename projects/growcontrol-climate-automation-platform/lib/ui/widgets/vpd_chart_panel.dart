import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/models/sensor_sample.dart';
import '../../domain/vpd/vpd_tables.dart';
import '../../theme/app_theme.dart';
import 'hitech_panel.dart';

class VpdChartPanel extends StatelessWidget {
  const VpdChartPanel({
    super.key,
    required this.samples,
    required this.band,
    required this.title,
  });

  final List<SensorSample> samples;
  final VpdBand band;
  final String title;

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    var i = 0.0;
    final slice = samples.length > 120 ? samples.sublist(samples.length - 120) : samples;
    for (final s in slice) {
      spots.add(FlSpot(i, s.vpdKpa));
      i += 1;
    }

    final minY = () {
      final vals = slice.map((s) => s.vpdKpa).toList();
      if (vals.isEmpty) return 0.0;
      final m = vals.reduce((a, b) => a < b ? a : b);
      return (m - 0.15).clamp(0.0, double.infinity);
    }();

    final maxY = () {
      final vals = slice.map((s) => s.vpdKpa).toList();
      if (vals.isEmpty) return 1.6;
      final m = vals.reduce((a, b) => a > b ? a : b);
      return (m + 0.15).clamp(0.3, 2.2);
    }();

    return HiTechPanel(
      accent: AppTheme.neonYellow,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title.toUpperCase(),
                style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  color: AppTheme.neonPurple.withOpacity(0.15),
                  border: Border.all(
                    color: AppTheme.neonPurple.withOpacity(0.35),
                  ),
                ),
                child: Text(
                  '${band.minKpa.toStringAsFixed(2)}–${band.maxKpa.toStringAsFixed(2)} kPa target',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.mutedText,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: slice.isEmpty
                ? Center(
                    child: Text(
                      'No logged samples yet.',
                      style: AppTheme.fontMono(12, color: AppTheme.mutedText),
                      textAlign: TextAlign.center,
                    ),
                  )
                : LineChart(
              LineChartData(
                minY: minY,
                maxY: maxY,
                clipData: const FlClipData.all(),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: (maxY - minY) / 4,
                  getDrawingHorizontalLine: (v) => FlLine(
                    color: Colors.white.withOpacity(0.06),
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 36,
                      getTitlesWidget: (value, meta) => Text(
                        value.toStringAsFixed(2),
                        style: AppTheme.fontMono(
                          10,
                          color: Colors.white.withOpacity(0.45),
                        ),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: (spots.length / 6).clamp(1, 999).toDouble(),
                      getTitlesWidget: (value, meta) {
                        if (slice.isEmpty) return const SizedBox.shrink();
                        final idx = value.round().clamp(0, slice.length - 1);
                        final t = slice[idx].timestamp;
                        final label =
                            '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            label,
                            style: AppTheme.fontMono(
                              9,
                              color: Colors.white.withOpacity(0.35),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                rangeAnnotations: RangeAnnotations(
                  horizontalRangeAnnotations: [
                    HorizontalRangeAnnotation(
                      y1: band.minKpa,
                      y2: band.maxKpa,
                      color: AppTheme.neonCyan.withOpacity(0.10),
                    ),
                  ],
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    curveSmoothness: 0.22,
                    color: AppTheme.neonYellow,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.neonYellow.withOpacity(0.35),
                          AppTheme.neonPink.withOpacity(0.02),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
                extraLinesData: ExtraLinesData(
                  horizontalLines: [
                    HorizontalLine(
                      y: band.midpointKpa,
                      color: AppTheme.neonCyan.withOpacity(0.55),
                      strokeWidth: 1,
                      dashArray: [6, 6],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
