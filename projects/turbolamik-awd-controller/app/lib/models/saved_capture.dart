import 'dart:convert';

import 'raw_can_frame.dart';

class SavedCapture {
  const SavedCapture({
    required this.name,
    required this.createdAt,
    required this.frames,
    required this.filterModeLabel,
  });

  final String name;
  final DateTime createdAt;
  final List<RawCanFrame> frames;
  final String filterModeLabel;

  String get summary => '$filterModeLabel • ${frames.length} frames';

  String toJsonString() {
    final payload = <String, dynamic>{
      'name': name,
      'createdAt': createdAt.toIso8601String(),
      'filterMode': filterModeLabel,
      'frames': frames.map((frame) => frame.toMap()).toList(),
    };
    return const JsonEncoder.withIndent('  ').convert(payload);
  }
}
