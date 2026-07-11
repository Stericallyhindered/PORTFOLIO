import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/models/grow_device.dart';
import '../domain/models/outlet_event.dart';
import '../domain/models/sensor_sample.dart';
import '../domain/settings/grow_scene.dart';
import '../domain/settings/scene_hub_rules_codec.dart';

/// Thin wrapper around the Supabase client that exposes
/// app-domain types and Realtime streams. Every method scopes by `hub_id`
/// so the same phone account can fan out to multiple grow rooms later.
///
/// Auth gating lives in the calling widget (see [SignedInGate]). All read /
/// write methods here assume the caller is signed in; if they aren't the
/// underlying SDK throws and the stream emits an error.
class SupabaseRepository {
  SupabaseRepository({SupabaseClient? client})
      : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  // ---------------------------------------------------------------------------
  // Auth helpers
  // ---------------------------------------------------------------------------

  bool get isSignedIn => _client.auth.currentSession != null;
  User? get currentUser => _client.auth.currentUser;
  Stream<AuthState> get authChanges => _client.auth.onAuthStateChange;

  /// Sends a magic-link email. The user clicks it on the phone, the supabase
  /// auth deep-link handler picks it up, and the session is created.
  Future<void> signInWithMagicLink(String email) {
    return _client.auth.signInWithOtp(
      email: email,
      // emailRedirectTo: null → use default project setting; can be tightened
      // to a custom scheme later (`growcontrol://auth-callback`).
    );
  }

  /// Email + password sign-in. Useful when the email OTP path is rate-limited
  /// or you've manually provisioned accounts via SQL.
  Future<AuthResponse> signInWithPassword({
    required String email,
    required String password,
  }) {
    return _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() => _client.auth.signOut();

  // ---------------------------------------------------------------------------
  // Hubs + memberships
  // ---------------------------------------------------------------------------

  Future<List<HubRecord>> listHubs() async {
    final rows = await _client
        .from('hubs')
        .select('id, owner_uid, name, fw_version, last_seen_at')
        .order('created_at') as List<dynamic>;
    return rows
        .map((r) => HubRecord.fromRow(Map<String, dynamic>.from(r as Map)))
        .toList(growable: false);
  }

  /// Creates a hub row. [id] is optional: when your ESP32 firmware already
  /// uses a fixed `hub_id` (printed in serial as `hub=…`), paste that UUID here
  /// so the phone, Supabase, and device rows all match without manual SQL.
  Future<HubRecord> createHub({
    required String name,
    String? id,
  }) async {
    final uid = _client.auth.currentUser?.id;
    if (uid == null) {
      throw StateError('Not signed in');
    }
    final rowPayload = <String, dynamic>{
      'name': name,
      'owner_uid': uid,
    };
    final trimmedId = id?.trim();
    if (trimmedId != null && trimmedId.isNotEmpty) {
      if (!_looksLikeUuid(trimmedId)) {
        throw ArgumentError(
          'Hub ID must look like a UUID (8-4-4-4-12 hex). '
          'Copy it exactly from the ESP32 serial line hub=…',
        );
      }
      rowPayload['id'] = trimmedId;
    }
    final row = await _client
        .from('hubs')
        .insert(rowPayload)
        .select()
        .single();
    return HubRecord.fromRow(Map<String, dynamic>.from(row));
  }

  static bool _looksLikeUuid(String s) {
    return RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    ).hasMatch(s.trim());
  }

  Future<void> renameHub(String hubId, String name) {
    return _client.from('hubs').update({'name': name}).eq('id', hubId);
  }

  // ---------------------------------------------------------------------------
  // Devices
  // ---------------------------------------------------------------------------

  Future<List<DeviceRecord>> listDevices(String hubId) async {
    final rows = await _client
        .from('devices')
        .select()
        .eq('hub_id', hubId)
        .order('created_at') as List<dynamic>;
    return rows
        .map((r) => DeviceRecord.fromRow(Map<String, dynamic>.from(r as Map)))
        .toList(growable: false);
  }

  /// Live snapshot of [devices] for a hub. Emits whenever the hub touches
  /// role / online / name. The initial event is the current row set.
  Stream<List<DeviceRecord>> watchDevices(String hubId) {
    return _watchTable<DeviceRecord>(
      hubId: hubId,
      table: 'devices',
      orderBy: 'created_at',
      ascending: true,
      fromRow: DeviceRecord.fromRow,
    );
  }

  Future<void> updateDeviceRole(String deviceId, GrowDeviceRole role) {
    return _client
        .from('devices')
        .update({'role': role.name})
        .eq('id', deviceId);
  }

  Future<void> renameDeviceRow(String deviceId, String name) {
    return _client
        .from('devices')
        .update({'name': name})
        .eq('id', deviceId);
  }

  /// Upsert one or more devices into Supabase. Keyed by `(hub_id,
  /// tuya_device_id)` so re-runs are idempotent. The ESP32 picks this list up
  /// on its next device refresh and starts talking to the device on the LAN
  /// using the supplied [DeviceRecord.localKey].
  ///
  /// Only non-empty fields are sent; existing rows keep prior values for any
  /// field left blank. `role` is sent unconditionally (so the caller can
  /// downgrade an existing device back to `unassigned`).
  Future<void> upsertDevicesLocal(
    String hubId,
    List<DeviceRecord> devices,
  ) async {
    if (devices.isEmpty) return;
    final rows = devices.map((d) {
      final r = <String, dynamic>{
        'hub_id': hubId,
        'tuya_device_id': d.tuyaDeviceId,
        'name': d.name,
        'kind': d.kind,
        'role': d.role,
        'protocol_version': d.protocolVersion,
      };
      if (d.localKey != null && d.localKey!.isNotEmpty) {
        r['local_key'] = d.localKey;
      }
      if (d.ip != null && d.ip!.isNotEmpty) {
        r['ip'] = d.ip;
      }
      if (d.dpMap.isNotEmpty) {
        r['dp_map'] = d.dpMap;
      }
      return r;
    }).toList(growable: false);
    await _client
        .from('devices')
        .upsert(rows, onConflict: 'hub_id,tuya_device_id');
  }

  Future<void> deleteDevice(String deviceId) {
    return _client.from('devices').delete().eq('id', deviceId);
  }

  // ---------------------------------------------------------------------------
  // Sensor samples
  // ---------------------------------------------------------------------------

  /// Most-recent-first list of samples in the given window. Bounded by
  /// [limit] to keep the initial paint cheap.
  Future<List<SensorSample>> recentSamples(
    String hubId, {
    Duration window = const Duration(hours: 24),
    int limit = 1000,
  }) async {
    final cutoff = DateTime.now().subtract(window).toUtc().toIso8601String();
    final rows = await _client
        .from('sensor_samples')
        .select()
        .eq('hub_id', hubId)
        .gte('ts', cutoff)
        .order('ts', ascending: false)
        .limit(limit) as List<dynamic>;
    return rows
        .map((r) => _sampleFromRow(Map<String, dynamic>.from(r as Map)))
        .toList(growable: false);
  }

  /// Live stream of newly-inserted samples for the hub. Does not replay
  /// history — call [recentSamples] for the initial paint, then merge this
  /// stream's events on top.
  Stream<SensorSample> liveSamples(String hubId) {
    return _liveInserts(
      hubId: hubId,
      table: 'sensor_samples',
      map: _sampleFromRow,
    );
  }

  // ---------------------------------------------------------------------------
  // Outlet events
  // ---------------------------------------------------------------------------

  Future<List<OutletEventRecord>> recentOutletEvents(
    String hubId, {
    Duration window = const Duration(hours: 48),
    int limit = 500,
  }) async {
    final cutoff = DateTime.now().subtract(window).toUtc().toIso8601String();
    final rows = await _client
        .from('outlet_events')
        .select()
        .eq('hub_id', hubId)
        .gte('ts', cutoff)
        .order('ts', ascending: false)
        .limit(limit) as List<dynamic>;
    return rows
        .map((r) => OutletEventRecord.fromRow(Map<String, dynamic>.from(r as Map)))
        .toList(growable: false);
  }

  Stream<OutletEventRecord> liveOutletEvents(String hubId) {
    return _liveInserts(
      hubId: hubId,
      table: 'outlet_events',
      map: OutletEventRecord.fromRow,
    );
  }

  // ---------------------------------------------------------------------------
  // Controller state (single row per hub, upserted by the hub each tick)
  // ---------------------------------------------------------------------------

  Future<ControllerStateRecord?> currentControllerState(String hubId) async {
    final row = await _client
        .from('controller_state')
        .select()
        .eq('hub_id', hubId)
        .maybeSingle();
    if (row == null) return null;
    return ControllerStateRecord.fromRow(Map<String, dynamic>.from(row));
  }

  Stream<ControllerStateRecord> watchControllerState(String hubId) {
    final controller = StreamController<ControllerStateRecord>();
    var cancelled = false;

    Future<void> primeAndSubscribe() async {
      try {
        final initial = await currentControllerState(hubId);
        if (cancelled) return;
        if (initial != null) controller.add(initial);
      } catch (e, st) {
        if (!cancelled) controller.addError(e, st);
      }

      final ch = _client
          .channel('controller_state:$hubId')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'controller_state',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'hub_id',
              value: hubId,
            ),
            callback: (payload) {
              final row = payload.newRecord;
              if (row.isEmpty) return;
              controller.add(ControllerStateRecord.fromRow(row));
            },
          )
          .subscribe();

      controller.onCancel = () async {
        cancelled = true;
        await _client.removeChannel(ch);
      };
    }

    unawaited(primeAndSubscribe());
    return controller.stream;
  }

  // ---------------------------------------------------------------------------
  // Scenes (phone authors, hub consumes)
  // ---------------------------------------------------------------------------

  Stream<List<SceneRecord>> watchScenes(String hubId) {
    return _watchTable<SceneRecord>(
      hubId: hubId,
      table: 'scenes',
      orderBy: 'created_at',
      ascending: true,
      fromRow: SceneRecord.fromRow,
    );
  }

  Future<List<SceneRecord>> listScenes(String hubId) async {
    final rows = await _client
        .from('scenes')
        .select()
        .eq('hub_id', hubId)
        .order('created_at', ascending: true) as List<dynamic>?;
    if (rows == null || rows.isEmpty) return const [];
    return rows
        .map((r) => SceneRecord.fromRow(Map<String, dynamic>.from(r as Map)))
        .toList(growable: false);
  }

  Future<SceneRecord> upsertScene({
    required String hubId,
    String? id,
    required GrowScene scene,
  }) async {
    final row = await _client
        .from('scenes')
        .upsert({
          if (id != null) 'id': id,
          'hub_id': hubId,
          'name': scene.name,
          'stage_override': scene.stageOverride?.name,
          'photoperiod_override': scene.photoperiodOverride?.name,
          'member_device_ids': scene.memberDeviceIds,
          'automation_overrides': scene.automationOverrides
              .map((k, v) => MapEntry(k, v.toJson())),
          'automation_rules':
              sceneAutomationRulesForSupabaseHub(scene.automationRules),
        })
        .select()
        .single();
    return SceneRecord.fromRow(Map<String, dynamic>.from(row));
  }

  Future<void> deleteScene(String sceneId) {
    return _client.from('scenes').delete().eq('id', sceneId);
  }

  Future<void> setSceneActive({
    required String hubId,
    required String sceneId,
    required bool active,
  }) async {
    if (active) {
      // Monotonic "active_order" so the latest active scene wears the crown;
      // we read max + 1 client-side to avoid a stored proc.
      final maxRow = await _client
          .from('scenes')
          .select('active_order')
          .eq('hub_id', hubId)
          .not('active_order', 'is', null)
          .order('active_order', ascending: false)
          .limit(1)
          .maybeSingle();
      final next =
          ((maxRow?['active_order'] as int?) ?? 0) + 1;
      await _client
          .from('scenes')
          .update({'active': true, 'active_order': next})
          .eq('id', sceneId);
    } else {
      await _client
          .from('scenes')
          .update({'active': false, 'active_order': null})
          .eq('id', sceneId);
    }
  }

  // ---------------------------------------------------------------------------
  // Commands (phone -> hub queue)
  // ---------------------------------------------------------------------------

  Future<void> sendCommand({
    required String hubId,
    required String kind,
    Map<String, dynamic> payload = const {},
  }) {
    final uid = _client.auth.currentUser?.id;
    return _client.from('commands').insert({
      'hub_id': hubId,
      'kind': kind,
      'payload': payload,
      'requested_by': uid,
      'status': 'pending',
    });
  }

  Stream<CommandRecord> liveCommands(String hubId) {
    return _liveInserts(
      hubId: hubId,
      table: 'commands',
      map: CommandRecord.fromRow,
    );
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  Stream<List<T>> _watchTable<T>({
    required String hubId,
    required String table,
    required String orderBy,
    required bool ascending,
    required T Function(Map<String, dynamic>) fromRow,
  }) {
    final controller = StreamController<List<T>>();
    final items = <String, T>{};
    String idOf(Map<String, dynamic> row) => row['id'] as String;
    var cancelled = false;

    Future<void> primeAndSubscribe() async {
      try {
        final rows = await _client
            .from(table)
            .select()
            .eq('hub_id', hubId)
            .order(orderBy, ascending: ascending) as List<dynamic>;
        if (cancelled) return;
        items.clear();
        for (final raw in rows) {
          final row = Map<String, dynamic>.from(raw as Map);
          items[idOf(row)] = fromRow(row);
        }
        controller.add(items.values.toList(growable: false));
      } catch (e, st) {
        if (!cancelled) controller.addError(e, st);
      }

      final ch = _client
          .channel('$table:$hubId')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: table,
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'hub_id',
              value: hubId,
            ),
            callback: (payload) {
              switch (payload.eventType) {
                case PostgresChangeEvent.delete:
                  final id = payload.oldRecord['id'] as String?;
                  if (id != null) items.remove(id);
                  break;
                case PostgresChangeEvent.update:
                case PostgresChangeEvent.insert:
                  final row = payload.newRecord;
                  if (row.isEmpty) return;
                  items[idOf(row)] = fromRow(row);
                  break;
                case PostgresChangeEvent.all:
                  break;
              }
              controller.add(items.values.toList(growable: false));
            },
          )
          .subscribe();

      controller.onCancel = () async {
        cancelled = true;
        await _client.removeChannel(ch);
      };
    }

    unawaited(primeAndSubscribe());
    return controller.stream;
  }

  Stream<T> _liveInserts<T>({
    required String hubId,
    required String table,
    required T Function(Map<String, dynamic>) map,
  }) {
    final controller = StreamController<T>();
    final ch = _client
        .channel('$table-live:$hubId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: table,
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'hub_id',
            value: hubId,
          ),
          callback: (payload) {
            final row = payload.newRecord;
            if (row.isEmpty) return;
            try {
              controller.add(map(row));
            } catch (e, st) {
              debugPrint('supabase live $table row map failed: $e\n$st');
            }
          },
        )
        .subscribe();
    controller.onCancel = () async {
      await _client.removeChannel(ch);
    };
    return controller.stream;
  }
}

// =============================================================================
// Row → domain mapping
// =============================================================================

SensorSample _sampleFromRow(Map<String, dynamic> row) {
  final devId = row['device_id'] as String? ?? row['deviceId'] as String?;
  return SensorSample(
    timestamp: DateTime.parse(row['ts'] as String).toLocal(),
    tempC: (row['temp_c'] as num?)?.toDouble() ?? 0,
    rhPercent: (row['rh_pct'] as num?)?.toDouble() ?? 0,
    vpdKpa: (row['vpd_kpa'] as num?)?.toDouble() ?? 0,
    sourceDeviceId: devId,
  );
}

@immutable
class HubRecord {
  const HubRecord({
    required this.id,
    required this.ownerUid,
    required this.name,
    this.fwVersion,
    this.lastSeenAt,
  });

  final String id;
  final String ownerUid;
  final String name;
  final String? fwVersion;
  final DateTime? lastSeenAt;

  factory HubRecord.fromRow(Map<String, dynamic> row) => HubRecord(
        id: row['id'] as String,
        ownerUid: row['owner_uid'] as String,
        name: (row['name'] as String?) ?? '',
        fwVersion: row['fw_version'] as String?,
        lastSeenAt: row['last_seen_at'] != null
            ? DateTime.parse(row['last_seen_at'] as String).toLocal()
            : null,
      );
}

@immutable
class DeviceRecord {
  const DeviceRecord({
    this.id = '',
    this.hubId = '',
    required this.tuyaDeviceId,
    required this.name,
    required this.role,
    required this.kind,
    this.online = false,
    this.lastDpsAt,
    this.localKey,
    this.ip,
    this.protocolVersion = '3.3',
    this.dpMap = const <String, String>{},
  });

  /// `devices.id` (UUID generated by Postgres). Empty for rows the phone is
  /// about to upsert.
  final String id;
  final String hubId;

  /// Tuya gwId / devId — 22-char alphanumeric printed in the Smart Life app's
  /// device-info dialog and in `tinytuya wizard`'s `devices.json`.
  final String tuyaDeviceId;
  final String name;

  /// Stored as a string ([GrowDeviceRole.name]) for forward compatibility.
  final String role;
  final String kind;
  final bool online;
  final DateTime? lastDpsAt;

  // ---- LAN protocol bits -----------------------------------------------------
  /// 16-char AES key from `tinytuya wizard`. Required for the hub to talk to
  /// the device locally.
  final String? localKey;

  /// Optional LAN IP hint. The hub re-discovers this via UDP broadcasts every
  /// ~10 s, so this can stay null and things still work.
  final String? ip;

  /// Tuya protocol revision: '3.3' (default) or '3.4'.
  final String protocolVersion;

  /// Optional friendly-name → DP id map. Defaults are baked into the firmware:
  /// `{"switch":"1", "temperature":"1", "humidity":"2"}`. Override here only
  /// if the device uses non-default DP ids (visible in `tinytuya wizard`).
  final Map<String, String> dpMap;

  GrowDeviceRole get growRole {
    final values = GrowDeviceRole.values;
    for (final v in values) {
      if (v.name == role) return v;
    }
    return GrowDeviceRole.unassigned;
  }

  GrowHardwareKind get hardwareKind => kind == 'tempHumiditySensor'
      ? GrowHardwareKind.tempHumiditySensor
      : GrowHardwareKind.smartOutlet;

  factory DeviceRecord.fromRow(Map<String, dynamic> row) {
    final dpMapRaw = row['dp_map'];
    final Map<String, String> dpMap = (dpMapRaw is Map)
        ? dpMapRaw.map<String, String>(
            (k, v) => MapEntry(k.toString(), v.toString()))
        : const <String, String>{};
    return DeviceRecord(
      id: row['id'] as String? ?? '',
      hubId: row['hub_id'] as String? ?? '',
      tuyaDeviceId: row['tuya_device_id'] as String? ?? '',
      name: (row['name'] as String?) ?? '',
      role: (row['role'] as String?) ?? 'unassigned',
      kind: (row['kind'] as String?) ?? 'smartOutlet',
      online: (row['online'] as bool?) ?? false,
      lastDpsAt: row['last_dps_at'] != null
          ? DateTime.parse(row['last_dps_at'] as String).toLocal()
          : null,
      localKey: row['local_key'] as String?,
      ip: row['ip'] as String?,
      protocolVersion: (row['protocol_version'] as String?) ?? '3.3',
      dpMap: dpMap,
    );
  }
}

@immutable
class OutletEventRecord {
  const OutletEventRecord({
    required this.id,
    required this.hubId,
    required this.deviceId,
    required this.ts,
    required this.isOn,
    required this.reason,
    required this.source,
    this.role,
  });

  final String id;
  final String hubId;
  final String? deviceId;
  final DateTime ts;
  final bool isOn;
  final String reason;
  final String source;
  final String? role;

  /// Adapter to the existing in-app [OutletEvent] type. Role falls back to
  /// `unassigned` when the row didn't carry one (older firmware).
  OutletEvent toDomain() {
    GrowDeviceRole r = GrowDeviceRole.unassigned;
    if (role != null) {
      for (final v in GrowDeviceRole.values) {
        if (v.name == role) {
          r = v;
          break;
        }
      }
    }
    return OutletEvent(
      id: id,
      deviceId: deviceId ?? '',
      role: r,
      on: isOn,
      at: ts,
      reason: reason,
    );
  }

  factory OutletEventRecord.fromRow(Map<String, dynamic> row) =>
      OutletEventRecord(
        id: row['id'] as String,
        hubId: row['hub_id'] as String,
        deviceId: row['device_id'] as String?,
        ts: DateTime.parse(row['ts'] as String).toLocal(),
        isOn: row['is_on'] as bool,
        reason: (row['reason'] as String?) ?? '',
        source: (row['source'] as String?) ?? 'auto',
        role: row['role'] as String?,
      );
}

@immutable
class ControllerStateRecord {
  const ControllerStateRecord({
    required this.hubId,
    this.humRelayOn,
    this.dehuRelayOn,
    this.humBurstPhase,
    this.humBurstRemaining,
    this.dehuBurstPhase,
    this.dehuBurstRemaining,
    this.humDesired,
    this.dehuDesired,
    this.lastTempC,
    this.lastRhPct,
    this.lastVpdKpa,
    this.lastTickAt,
    this.lastError,
    this.activeSceneIds = const [],
    this.manualHeldIds = const [],
  });

  final String hubId;
  final bool? humRelayOn;
  final bool? dehuRelayOn;
  final String? humBurstPhase;
  final Duration? humBurstRemaining;
  final String? dehuBurstPhase;
  final Duration? dehuBurstRemaining;
  final bool? humDesired;
  final bool? dehuDesired;
  final double? lastTempC;
  final double? lastRhPct;
  final double? lastVpdKpa;
  final DateTime? lastTickAt;
  final String? lastError;
  final List<String> activeSceneIds;
  final List<String> manualHeldIds;

  factory ControllerStateRecord.fromRow(Map<String, dynamic> row) {
    Duration? ms(Object? v) {
      if (v is num) return Duration(milliseconds: v.toInt());
      return null;
    }

    List<String> strList(Object? v) {
      if (v is List) return v.cast<String>();
      return const [];
    }

    return ControllerStateRecord(
      hubId: row['hub_id'] as String,
      humRelayOn: row['hum_relay_on'] as bool?,
      dehuRelayOn: row['dehu_relay_on'] as bool?,
      humBurstPhase: row['hum_burst_phase'] as String?,
      humBurstRemaining: ms(row['hum_burst_remaining_ms']),
      dehuBurstPhase: row['dehu_burst_phase'] as String?,
      dehuBurstRemaining: ms(row['dehu_burst_remaining_ms']),
      humDesired: row['hum_desired'] as bool?,
      dehuDesired: row['dehu_desired'] as bool?,
      lastTempC: (row['last_temp_c'] as num?)?.toDouble(),
      lastRhPct: (row['last_rh_pct'] as num?)?.toDouble(),
      lastVpdKpa: (row['last_vpd_kpa'] as num?)?.toDouble(),
      lastTickAt: row['last_tick_at'] != null
          ? DateTime.parse(row['last_tick_at'] as String).toLocal()
          : null,
      lastError: row['last_error'] as String?,
      activeSceneIds: strList(row['active_scene_ids']),
      manualHeldIds: strList(row['manual_held_ids']),
    );
  }
}

@immutable
class SceneRecord {
  const SceneRecord({
    required this.id,
    required this.hubId,
    required this.scene,
    required this.active,
    this.activeOrder,
  });

  final String id;
  final String hubId;
  final GrowScene scene;
  final bool active;
  final int? activeOrder;

  factory SceneRecord.fromRow(Map<String, dynamic> row) {
    final id = row['id'] as String;
    final memberIds = (row['member_device_ids'] as List?)
            ?.cast<String>() ??
        const <String>[];
    return SceneRecord(
      id: id,
      hubId: row['hub_id'] as String,
      active: (row['active'] as bool?) ?? false,
      activeOrder: row['active_order'] as int?,
      scene: GrowScene.fromJson({
        'id': id,
        'name': (row['name'] as String?) ?? '',
        'memberDeviceIds': memberIds,
        if (row['stage_override'] != null)
          'stageOverride': row['stage_override'],
        if (row['photoperiod_override'] != null)
          'photoperiodOverride': row['photoperiod_override'],
        'automationOverrides':
            (row['automation_overrides'] as Map?)?.cast<String, dynamic>() ??
                const <String, dynamic>{},
        'automationRules': normalizeAutomationRulesJsonForApp(
          row['automation_rules'] as List?,
        ),
      }),
    );
  }
}

@immutable
class CommandRecord {
  const CommandRecord({
    required this.id,
    required this.hubId,
    required this.kind,
    required this.payload,
    required this.status,
    required this.requestedAt,
    this.requestedBy,
    this.ackedAt,
    this.error,
  });

  final String id;
  final String hubId;
  final String kind;
  final Map<String, dynamic> payload;
  final String status;
  final DateTime requestedAt;
  final String? requestedBy;
  final DateTime? ackedAt;
  final String? error;

  factory CommandRecord.fromRow(Map<String, dynamic> row) => CommandRecord(
        id: row['id'] as String,
        hubId: row['hub_id'] as String,
        kind: row['kind'] as String,
        payload: (row['payload'] as Map?)?.cast<String, dynamic>() ??
            const <String, dynamic>{},
        status: (row['status'] as String?) ?? 'pending',
        requestedAt: DateTime.parse(row['requested_at'] as String).toLocal(),
        requestedBy: row['requested_by'] as String?,
        ackedAt: row['acked_at'] != null
            ? DateTime.parse(row['acked_at'] as String).toLocal()
            : null,
        error: row['error'] as String?,
      );
}
