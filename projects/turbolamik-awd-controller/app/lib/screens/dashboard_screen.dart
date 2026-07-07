import 'package:flutter/material.dart';

import '../services/telemetry_service.dart';
import '../widgets/metric_pill.dart';
import '../widgets/telemetry_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final snapshot = telemetry.snapshot;
    final health = telemetry.health;
    final shadow = snapshot.shadowOutput;
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TelemetryCard(
            title: 'Bus Status',
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: <Widget>[
                MetricPill(
                  label: 'Profile',
                  value: telemetry.profile.displayName,
                  highlight: true,
                ),
                MetricPill(
                  label: 'Bus',
                  value: '${health.busBitrate ~/ 1000} kbps',
                ),
                MetricPill(label: 'Frames', value: '${health.totalFrames}'),
                MetricPill(
                  label: 'Stale',
                  value:
                      health.staleSignals.isEmpty
                          ? 'None'
                          : health.staleSignals.join(', '),
                ),
                MetricPill(
                  label: 'Capture',
                  value: telemetry.captureControl.active ? 'Running' : 'Idle',
                  highlight: telemetry.captureControl.active,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              final wide = constraints.maxWidth > 960;
              return GridView.count(
                crossAxisCount: wide ? 4 : 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: wide ? 1.35 : 1.1,
                children: <Widget>[
                  _StatCard(
                    label: 'Engine RPM',
                    value: snapshot.engineRpm.toStringAsFixed(0),
                    unit: 'rpm',
                  ),
                  _StatCard(
                    label: 'Vehicle Speed',
                    value: snapshot.vehicleSpeedKph.toStringAsFixed(1),
                    unit: 'km/h',
                  ),
                  _StatCard(
                    label: 'Current Gear',
                    value: '${snapshot.gearCurrent}',
                    unit: 'gear',
                  ),
                  _StatCard(
                    label: 'AWD Shadow',
                    value: shadow.awdRequestPct.toStringAsFixed(1),
                    unit: '%',
                    accent: colorScheme.primaryContainer,
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              final stacked = constraints.maxWidth < 980;
              final chassisCard = TelemetryCard(
                title: 'Chassis Inputs',
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: <Widget>[
                    MetricPill(
                      label: 'Throttle',
                      value: '${snapshot.throttlePct.toStringAsFixed(1)}%',
                    ),
                    MetricPill(
                      label: 'Steering',
                      value:
                          '${snapshot.steeringAngleDeg.toStringAsFixed(1)} deg',
                    ),
                    MetricPill(
                      label: 'Brake',
                      value: snapshot.brakeActive ? 'Active' : 'Off',
                      highlight: snapshot.brakeActive,
                    ),
                    MetricPill(
                      label: 'Handbrake',
                      value: snapshot.handbrakeActive ? 'On' : 'Off',
                    ),
                    MetricPill(
                      label: 'Wheel FL',
                      value:
                          '${snapshot.wheelSpeedFlKph.toStringAsFixed(1)} km/h',
                    ),
                    MetricPill(
                      label: 'Wheel FR',
                      value:
                          '${snapshot.wheelSpeedFrKph.toStringAsFixed(1)} km/h',
                    ),
                    MetricPill(
                      label: 'Wheel RL',
                      value:
                          '${snapshot.wheelSpeedRlKph.toStringAsFixed(1)} km/h',
                    ),
                    MetricPill(
                      label: 'Wheel RR',
                      value:
                          '${snapshot.wheelSpeedRrKph.toStringAsFixed(1)} km/h',
                    ),
                  ],
                ),
              );
              final turboCard = TelemetryCard(
                title: 'TurboLamik Feed',
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: <Widget>[
                    MetricPill(
                      label: 'Target Gear',
                      value: '${snapshot.gearTarget}',
                    ),
                    MetricPill(
                      label: 'Lockup',
                      value: '${snapshot.lockupPct.toStringAsFixed(1)}%',
                    ),
                    MetricPill(
                      label: 'Wheel Torque',
                      value: '${snapshot.wheelTorqueNm.toStringAsFixed(0)} Nm',
                    ),
                    MetricPill(
                      label: 'Shift State',
                      value: snapshot.shiftActive ? 'Shift Active' : 'Stable',
                      highlight: snapshot.shiftActive,
                    ),
                    MetricPill(
                      label: 'Torque Reduction',
                      value:
                          '${snapshot.torqueReductionPct.toStringAsFixed(1)}%',
                    ),
                    MetricPill(
                      label: 'Input Shaft',
                      value: '${snapshot.inputShaftRpm.toStringAsFixed(0)} rpm',
                    ),
                    MetricPill(
                      label: 'Output Shaft',
                      value:
                          '${snapshot.outputShaftRpm.toStringAsFixed(0)} rpm',
                    ),
                    MetricPill(
                      label: 'Oil Temp',
                      value: '${snapshot.gearboxOilTempC.toStringAsFixed(1)} C',
                    ),
                  ],
                ),
              );

              if (stacked) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    chassisCard,
                    const SizedBox(height: 18),
                    turboCard,
                  ],
                );
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(child: chassisCard),
                  const SizedBox(width: 18),
                  Expanded(child: turboCard),
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          TelemetryCard(
            title: 'Derived Metrics + Shadow Controller',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: <Widget>[
                    MetricPill(
                      label: 'Front Axle',
                      value:
                          '${snapshot.metrics.frontAxleSpeedKph.toStringAsFixed(1)} km/h',
                    ),
                    MetricPill(
                      label: 'Rear Axle',
                      value:
                          '${snapshot.metrics.rearAxleSpeedKph.toStringAsFixed(1)} km/h',
                    ),
                    MetricPill(
                      label: 'Front/Rear Delta',
                      value:
                          '${snapshot.metrics.frontRearSpeedDeltaKph.toStringAsFixed(2)} km/h',
                    ),
                    MetricPill(
                      label: 'Rear Slip Ratio',
                      value: snapshot.metrics.rearSlipRatio.toStringAsFixed(3),
                    ),
                    MetricPill(
                      label: 'Turning State',
                      value: snapshot.metrics.turningState,
                    ),
                    MetricPill(
                      label: 'Drivetrain State',
                      value: snapshot.metrics.drivetrainState,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2ECE4),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: _ShadowLine(
                          label: 'Base precharge',
                          value:
                              '${shadow.basePrechargePct.toStringAsFixed(1)}%',
                        ),
                      ),
                      Expanded(
                        child: _ShadowLine(
                          label: 'Slip add',
                          value: '${shadow.slipAddPct.toStringAsFixed(1)}%',
                        ),
                      ),
                      Expanded(
                        child: _ShadowLine(
                          label: 'Shift add',
                          value: '${shadow.shiftAddPct.toStringAsFixed(1)}%',
                        ),
                      ),
                      Expanded(
                        child: _ShadowLine(
                          label: 'Clamp',
                          value: '${shadow.clampPct.toStringAsFixed(1)}%',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.unit,
    this.accent,
  });

  final String label;
  final String value;
  final String unit;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: accent,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              label,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: const Color(0xFF65584B),
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(unit, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _ShadowLine extends StatelessWidget {
  const _ShadowLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(color: const Color(0xFF7A6B5C)),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
