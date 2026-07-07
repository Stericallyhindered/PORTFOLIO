import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/saved_capture.dart';
import '../services/telemetry_service.dart';
import '../widgets/telemetry_card.dart';

class SavedLogsScreen extends StatelessWidget {
  const SavedLogsScreen({super.key, required this.telemetry});

  final TelemetryService telemetry;

  @override
  Widget build(BuildContext context) {
    final captures = telemetry.savedCaptures;
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: <Widget>[
        TelemetryCard(
          title: 'Saved Sessions',
          trailing: TextButton.icon(
            onPressed: captures.isEmpty ? null : telemetry.clearSavedCaptures,
            icon: const Icon(Icons.delete_sweep_outlined),
            label: const Text('Clear All'),
          ),
          child:
              captures.isEmpty
                  ? const Text(
                    'No captures saved yet. Start a raw-frame capture from the Capture tab.',
                  )
                  : Column(
                    children:
                        captures
                            .map(
                              (capture) => _SavedCaptureTile(
                                telemetry: telemetry,
                                capture: capture,
                              ),
                            )
                            .toList(),
                  ),
        ),
      ],
    );
  }
}

class _SavedCaptureTile extends StatelessWidget {
  const _SavedCaptureTile({required this.telemetry, required this.capture});

  final TelemetryService telemetry;
  final SavedCapture capture;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF2ECE4),
        borderRadius: BorderRadius.circular(18),
      ),
      child: ListTile(
        title: Text(
          capture.name,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text('${capture.summary}\n${capture.createdAt.toLocal()}'),
        isThreeLine: true,
        trailing: Wrap(
          spacing: 8,
          children: <Widget>[
            IconButton(
              tooltip: 'Export JSON',
              onPressed: () => _showExportDialog(context, capture),
              icon: const Icon(Icons.file_download_outlined),
            ),
            IconButton(
              tooltip: 'Delete capture',
              onPressed: () => telemetry.deleteSavedCapture(capture),
              icon: const Icon(Icons.delete_outline),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showExportDialog(
    BuildContext context,
    SavedCapture capture,
  ) async {
    final json = capture.toJsonString();
    await showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(capture.name),
          content: SizedBox(
            width: 680,
            child: SingleChildScrollView(child: SelectableText(json)),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: json));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Capture JSON copied to clipboard'),
                    ),
                  );
                }
              },
              child: const Text('Copy JSON'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}
