import 'dart:convert';

class RawCanFrame {
  const RawCanFrame({
    required this.timestamp,
    required this.bus,
    required this.id,
    required this.dlc,
    required this.data,
  });

  final DateTime timestamp;
  final String bus;
  final int id;
  final int dlc;
  final List<int> data;

  String get idLabel =>
      '0x${id.toRadixString(16).toUpperCase().padLeft(3, '0')}';

  String get payloadHex => data
      .map((byte) => byte.toRadixString(16).toUpperCase().padLeft(2, '0'))
      .join(' ');

  Map<String, dynamic> toMap() => <String, dynamic>{
    'timestamp': timestamp.toIso8601String(),
    'bus': bus,
    'id': id,
    'dlc': dlc,
    'data': data,
  };

  String toJson() => jsonEncode(toMap());
}
