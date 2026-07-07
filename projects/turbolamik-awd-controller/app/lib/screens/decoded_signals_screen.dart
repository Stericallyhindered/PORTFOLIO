import 'package:flutter/material.dart';

import '../services/telemetry_service.dart';
import '../widgets/telemetry_card.dart';

class DecodedSignalsScreen extends StatelessWidget {
  const DecodedSignalsScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final readings = telemetry.snapshot.signalRows;
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: <Widget>[
        TelemetryCard(
          title: 'Normalized Signal Store',
          trailing: Chip(label: Text('${readings.length} signals')),
          child: Column(
            children:
                readings
                    .map(
                      (reading) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2ECE4),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: ListTile(
                          title: Text(
                            reading.label,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(reading.source),
                          trailing: SizedBox(
                            width: 140,
                            child: Text(
                              '${reading.value} ${reading.unit}'.trim(),
                              textAlign: TextAlign.end,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
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
