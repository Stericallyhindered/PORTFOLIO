import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';

/// What part of the system emitted a traffic entry. Drives the colour and
/// the filter chips on the TRAFFIC sub-tab.
enum TrafficSource {
  /// Outgoing IO from the gateway (publishDps, refresh, etc.).
  gateway,

  /// Sensor / device pushes coming back over MQTT.
  sensor,

  /// User-driven actions from the Manual tab.
  manual,

  /// Climate tick decisions and other controller-side reasoning.
  controller,

  /// Anything tagged as an exception path.
  error,
}

/// Coarse categorisation; subcategorise via [TrafficEntry.label] / detail.
enum TrafficKind {
  setOutlet,
  dpUpdate,
  refresh,
  decision,
  manualPress,
  info,
}

@immutable
class TrafficEntry {
  TrafficEntry({
    DateTime? at,
    required this.source,
    required this.kind,
    this.deviceId,
    required this.label,
    this.detail,
    this.ok = true,
  }) : at = at ?? DateTime.now();

  final DateTime at;
  final TrafficSource source;
  final TrafficKind kind;
  final String? deviceId;
  final String label;
  final String? detail;
  final bool ok;
}

/// In-memory ring-buffer + broadcast stream of [TrafficEntry] events used by
/// the LOGS → TRAFFIC sub-tab. No disk persistence; rebuilds on every cold
/// start (telemetry / outlet-event logs already cover durable storage).
class TrafficLogger {
  TrafficLogger({this.capacity = 2000});

  final int capacity;
  final Queue<TrafficEntry> _buf = Queue<TrafficEntry>();
  final StreamController<TrafficEntry> _ctrl =
      StreamController<TrafficEntry>.broadcast();

  /// Live stream of new entries (does not replay history — read [snapshot]
  /// for the initial paint and append new ones from this stream).
  Stream<TrafficEntry> watch() => _ctrl.stream;

  /// Most-recent-first list of currently-buffered entries.
  List<TrafficEntry> get snapshot => _buf.toList(growable: false).reversed
      .toList(growable: false);

  /// Append one entry, evicting the oldest when [capacity] is exceeded.
  /// Safe to call from any isolate thread Flutter normally exposes (Dart is
  /// single-threaded per isolate, so no locking needed).
  void emit(TrafficEntry e) {
    _buf.addLast(e);
    while (_buf.length > capacity) {
      _buf.removeFirst();
    }
    if (!_ctrl.isClosed) _ctrl.add(e);
  }

  /// Convenience helper so callers don't have to construct the entry.
  void log({
    required TrafficSource source,
    required TrafficKind kind,
    required String label,
    String? deviceId,
    String? detail,
    bool ok = true,
  }) {
    emit(
      TrafficEntry(
        source: source,
        kind: kind,
        label: label,
        deviceId: deviceId,
        detail: detail,
        ok: ok,
      ),
    );
  }

  void clear() {
    _buf.clear();
  }

  Future<void> dispose() async {
    await _ctrl.close();
  }
}
