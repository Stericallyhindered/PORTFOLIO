import 'package:flutter/material.dart';

import '../services/telemetry_service.dart';
import '../widgets/telemetry_card.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final profile = telemetry.profile;
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: <Widget>[
        TelemetryCard(
          title: 'Active Profile',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                profile.displayName,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text('CAN bitrate: ${profile.busBitrate ~/ 1000} kbps'),
              Text('Shared bus: ${profile.sharedBus ? 'Yes' : 'No'}'),
              Text(
                'Yaw profile ready: ${profile.supportsYawRate ? 'Yes' : 'Pending'}',
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        TelemetryCard(
          title: 'Watched CAN IDs',
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children:
                profile.watchedIds
                    .map(
                      (id) => Chip(
                        label: Text(
                          '0x${id.toRadixString(16).toUpperCase().padLeft(3, '0')}',
                        ),
                      ),
                    )
                    .toList(),
          ),
        ),
        const SizedBox(height: 18),
        LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            final stacked = constraints.maxWidth < 900;
            final requiredCard = TelemetryCard(
              title: 'Required Signals',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: profile.requiredSignals.map(_line).toList(),
              ),
            );
            final optionalCard = TelemetryCard(
              title: 'Optional Signals',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: profile.optionalSignals.map(_line).toList(),
              ),
            );

            if (stacked) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  requiredCard,
                  const SizedBox(height: 18),
                  optionalCard,
                ],
              );
            }

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(child: requiredCard),
                const SizedBox(width: 18),
                Expanded(child: optionalCard),
              ],
            );
          },
        ),
        const SizedBox(height: 18),
        TelemetryCard(
          title: 'Profile Notes',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: profile.notes.map(_line).toList(),
          ),
        ),
      ],
    );
  }

  static Widget _line(String text) {
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
