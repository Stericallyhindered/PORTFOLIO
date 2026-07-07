import 'package:flutter/material.dart';

import '../services/telemetry_service.dart';
import '../widgets/telemetry_card.dart';

class RawFramesScreen extends StatelessWidget {
  const RawFramesScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final frames = telemetry.latestFrames;
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: <Widget>[
        TelemetryCard(
          title: 'Recent CAN Traffic',
          trailing: Chip(label: Text('${frames.length} buffered')),
          child: Column(
            children:
                frames
                    .map(
                      (frame) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2ECE4),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Row(
                            children: <Widget>[
                              SizedBox(
                                width: 78,
                                child: Text(
                                  frame.idLabel,
                                  style: Theme.of(context).textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                              ),
                              SizedBox(width: 76, child: Text(frame.bus)),
                              SizedBox(
                                width: 56,
                                child: Text('DLC ${frame.dlc}'),
                              ),
                              Expanded(
                                child: SelectableText(
                                  frame.payloadHex,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(letterSpacing: 0.5),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '${frame.timestamp.hour.toString().padLeft(2, '0')}:${frame.timestamp.minute.toString().padLeft(2, '0')}:${frame.timestamp.second.toString().padLeft(2, '0')}.${(frame.timestamp.millisecond ~/ 10).toString().padLeft(2, '0')}',
                                style: Theme.of(context).textTheme.labelMedium,
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
          ),
        ),
      ],
    );
  }
}
