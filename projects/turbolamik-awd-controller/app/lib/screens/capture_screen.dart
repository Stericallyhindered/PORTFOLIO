import 'package:flutter/material.dart';

import '../models/capture_control.dart';
import '../services/telemetry_service.dart';
import '../widgets/metric_pill.dart';
import '../widgets/telemetry_card.dart';

class CaptureScreen extends StatelessWidget {
  const CaptureScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final capture = telemetry.captureControl;

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: <Widget>[
        TelemetryCard(
          title: 'Capture Control',
          trailing: FilledButton.icon(
            onPressed:
                capture.active ? telemetry.stopCapture : telemetry.startCapture,
            icon: Icon(
              capture.active
                  ? Icons.stop_circle_outlined
                  : Icons.play_circle_fill_rounded,
            ),
            label: Text(capture.active ? 'Stop Capture' : 'Start Capture'),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  MetricPill(
                    label: 'State',
                    value: capture.active ? 'Capturing' : 'Idle',
                    highlight: capture.active,
                  ),
                  MetricPill(
                    label: 'Buffered Frames',
                    value: '${capture.bufferedFrames}',
                  ),
                  MetricPill(
                    label: 'Max Frames',
                    value: '${capture.maxFrames}',
                  ),
                  MetricPill(
                    label: 'Filter',
                    value:
                        capture.filterMode == CaptureFilterMode.selectedProfile
                            ? 'Profile IDs'
                            : 'Full bus',
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SegmentedButton<CaptureFilterMode>(
                segments: const <ButtonSegment<CaptureFilterMode>>[
                  ButtonSegment<CaptureFilterMode>(
                    value: CaptureFilterMode.selectedProfile,
                    label: Text('Profile IDs'),
                    icon: Icon(Icons.filter_alt_outlined),
                  ),
                  ButtonSegment<CaptureFilterMode>(
                    value: CaptureFilterMode.fullBus,
                    label: Text('Full bus'),
                    icon: Icon(Icons.hub_outlined),
                  ),
                ],
                selected: <CaptureFilterMode>{capture.filterMode},
                onSelectionChanged: (Set<CaptureFilterMode> selection) {
                  telemetry.setCaptureFilter(selection.first);
                },
              ),
              const SizedBox(height: 18),
              Text(
                'Phase 1 keeps live telemetry flowing continuously, while raw frames are captured in short buffered windows for export and replay.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        TelemetryCard(
          title: 'Capture Notes',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const <Widget>[
              _NoteLine(
                'Use Profile IDs mode for focused TurboLamik + E90 bring-up sessions.',
              ),
              _NoteLine(
                'Use Full bus when validating unknown traffic or timing collisions.',
              ),
              _NoteLine(
                'Saved captures stay in-app for now and can be exported as JSON text.',
              ),
              _NoteLine(
                'Shadow AWD output remains passive until transfer-case control is enabled later.',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NoteLine extends StatelessWidget {
  const _NoteLine(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(Icons.circle, size: 8),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
