import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/models/dehu_learning_record.dart';
import '../domain/models/humidifier_ramp_record.dart';
import '../domain/models/outlet_event.dart';
import '../domain/models/sensor_sample.dart';
import 'grow_log_repository.dart';
import 'traffic_logger.dart';

/// Mirrors every new local log entry into Supabase so the user gets remote
/// telemetry even before the real ESP32 hub is built.
///
/// While the user is on the "Tuya direct" source, this sink uses the active
/// hub id (the user explicitly creates one through the setup screen) as the
/// `hub_id` for every insert. Once the real ESP32 hub starts writing for the
/// same `hub_id`, this sink can be disabled — both sides will simply append
/// to the same tables.
///
/// Resilience model: short-lived blips (sign-out, network, RLS race during
/// hub creation) are absorbed by a small in-memory queue; if the backlog
/// exceeds [bufferCapacity] the oldest entries get dropped. We never block
/// the controller's tick on Supabase IO — every method returns immediately
/// and the actual HTTP call rides a microtask.
class SupabaseLogSink implements GrowLogObserver {
  SupabaseLogSink({
    required this.hubId,
    SupabaseClient? client,
    TrafficLogger? traffic,
    this.bufferCapacity = 256,
  })  : _client = client ?? Supabase.instance.client,
        _traffic = traffic;

  /// Active hub UUID. Every insert is tagged with this id.
  final String hubId;

  /// Max number of pending entries we'll buffer if Supabase is unreachable.
  /// Older entries are evicted oldest-first on overflow.
  final int bufferCapacity;

  final SupabaseClient _client;
  final TrafficLogger? _traffic;

  bool _flushScheduled = false;
  bool _paused = false;

  /// Each queued action knows how to write itself to Supabase. We keep them
  /// as closures so each one can be retried in isolation. The queue itself
  /// is a fixed-capacity ring (FIFO).
  final Queue<_Pending> _pending = Queue<_Pending>();

  /// Stop pushing without losing the queue (e.g. while the user signs out).
  void pause() => _paused = true;
  void resume() {
    _paused = false;
    _scheduleFlush();
  }

  int get pendingCount => _pending.length;

  // ---------------------------------------------------------------------------
  // GrowLogObserver
  // ---------------------------------------------------------------------------

  @override
  void onSampleAdded(SensorSample s) {
    _enqueue(_Pending(
      table: 'sensor_samples',
      payload: {
        'hub_id': hubId,
        'ts': s.timestamp.toUtc().toIso8601String(),
        'temp_c': s.tempC,
        'rh_pct': s.rhPercent,
        'vpd_kpa': s.vpdKpa,
        'raw': {
          if (s.sourceDeviceId != null) 'tuya_device_id': s.sourceDeviceId,
        },
      },
    ));
  }

  @override
  void onOutletEventAdded(OutletEvent e) {
    _enqueue(_Pending(
      table: 'outlet_events',
      payload: {
        'hub_id': hubId,
        'ts': e.at.toUtc().toIso8601String(),
        'is_on': e.on,
        'reason': e.reason,
        // Best-effort source classification — the controller writes things
        // like "burst" / "Automation rule override" into the reason string.
        'source': _classifyEventSource(e.reason),
        'role': e.role.name,
      },
    ));
  }

  @override
  void onDehuSegmentAdded(DehumidifierPullDownRecord r) {
    // Learning segments are an aggregate, not a sample — we stash them as
    // `automation_decisions` rows of kind `dehu_pulldown` so they still flow
    // through the Realtime channel and don't pollute outlet_events.
    _enqueue(_Pending(
      table: 'automation_decisions',
      payload: {
        'hub_id': hubId,
        'ts': DateTime.now().toUtc().toIso8601String(),
        'zone': 'dehu_learning',
        'decision': {'kind': 'dehu_pulldown', ...r.toJson()},
      },
    ));
  }

  @override
  void onHumSegmentAdded(HumidifierRampRecord r) {
    _enqueue(_Pending(
      table: 'automation_decisions',
      payload: {
        'hub_id': hubId,
        'ts': DateTime.now().toUtc().toIso8601String(),
        'zone': 'hum_learning',
        'decision': {'kind': 'hum_ramp', ...r.toJson()},
      },
    ));
  }

  // ---------------------------------------------------------------------------
  // Queue + flush
  // ---------------------------------------------------------------------------

  void _enqueue(_Pending p) {
    if (_pending.length >= bufferCapacity) {
      _pending.removeFirst();
    }
    _pending.addLast(p);
    _scheduleFlush();
  }

  void _scheduleFlush() {
    if (_flushScheduled || _paused) return;
    _flushScheduled = true;
    Future<void>.microtask(_flushOnce);
  }

  Future<void> _flushOnce() async {
    _flushScheduled = false;
    if (_paused) return;
    if (_pending.isEmpty) return;
    if (_client.auth.currentSession == null) {
      // Drop everything — we can't authenticate. Re-queue would just retry
      // forever. The user signs back in, fresh data starts flowing.
      return;
    }
    // Drain in small batches per-table so we keep network round-trips low
    // without crossing the row-payload size limit.
    final batches = <String, List<Map<String, dynamic>>>{};
    while (_pending.isNotEmpty) {
      final p = _pending.removeFirst();
      batches.putIfAbsent(p.table, () => []).add(p.payload);
    }
    for (final entry in batches.entries) {
      try {
        await _client.from(entry.key).insert(entry.value);
      } catch (e, st) {
        debugPrint('SupabaseLogSink ${entry.key} insert failed: $e\n$st');
        _traffic?.log(
          source: TrafficSource.error,
          kind: TrafficKind.info,
          label: 'supabase ${entry.key} insert failed',
          detail: '$e',
          ok: false,
        );
        // Re-queue failed batch so we retry later. If we can't even retry
        // (e.g. row violates RLS), the cap eventually evicts them.
        for (final row in entry.value) {
          if (_pending.length >= bufferCapacity) {
            _pending.removeFirst();
          }
          _pending.addLast(_Pending(table: entry.key, payload: row));
        }
        // Back off slightly so we don't hammer a flaky server.
        await Future<void>.delayed(const Duration(seconds: 5));
        _scheduleFlush();
        return;
      }
    }
  }

  static String _classifyEventSource(String reason) {
    final r = reason.toLowerCase();
    if (r.contains('manual')) return 'manual';
    if (r.contains('burst') || r.contains('pulse') || r.contains('cool-down')) {
      return 'burst';
    }
    if (r.contains('automation') || r.contains('rule')) return 'rule';
    return 'auto';
  }
}

class _Pending {
  _Pending({required this.table, required this.payload});
  final String table;
  final Map<String, dynamic> payload;
}
