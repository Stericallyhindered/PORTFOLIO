import 'dart:async';

import 'package:flutter/foundation.dart';

import '../domain/models/grow_device.dart';
import 'device_gateway.dart';
import 'supabase_repository.dart';
import 'traffic_logger.dart';

/// Supabase-backed device gateway. The phone no longer talks to Tuya — every
/// device action becomes either a Supabase row update (`renameDevice`,
/// `setDeviceRole`) or a `commands` row insert (`setOutlet`) that the ESP32
/// hub drains and turns into a LAN packet for the actual device.
///
/// The "active hub" lookup is injected as a callback so this class stays
/// independent of [SettingsRepository] (and is trivially testable).
class SupabaseDeviceGateway implements DeviceGateway {
  SupabaseDeviceGateway({
    required SupabaseRepository repository,
    required ValueGetter<String?> activeHubId,
    TrafficLogger? trafficLogger,
  })  : _repo = repository,
        _activeHubId = activeHubId,
        _traffic = trafficLogger;

  final SupabaseRepository _repo;
  final ValueGetter<String?> _activeHubId;
  final TrafficLogger? _traffic;

  final StreamController<List<GrowDevice>> _devicesCtrl =
      StreamController<List<GrowDevice>>.broadcast();

  String? _watchedHubId;
  StreamSubscription<List<DeviceRecord>>? _watchSub;
  List<GrowDevice> _last = const [];

  @override
  Stream<List<GrowDevice>> watchDevices() {
    _ensureSubscription();
    // New listener: replay the last cached snapshot so the UI doesn't blink.
    scheduleMicrotask(() {
      if (!_devicesCtrl.isClosed) _devicesCtrl.add(List.unmodifiable(_last));
    });
    return _devicesCtrl.stream;
  }

  /// Force a one-shot refresh. The realtime subscription does this automatically
  /// for live edits; this method is mostly here so other code paths (manual
  /// pull-to-refresh) keep working unchanged.
  @override
  Future<void> refreshDevices() async {
    final hubId = _activeHubId();
    if (hubId == null) {
      _emit(const []);
      return;
    }
    _ensureSubscription();
    try {
      final rows = await _repo.listDevices(hubId);
      _emit(rows.map(_toDomain).toList(growable: false));
    } catch (e, st) {
      debugPrint('SupabaseDeviceGateway refreshDevices $e $st');
    }
  }

  void _ensureSubscription() {
    final hubId = _activeHubId();
    if (hubId == _watchedHubId && _watchSub != null) return;
    _watchSub?.cancel();
    _watchedHubId = hubId;
    if (hubId == null) {
      _emit(const []);
      return;
    }
    _watchSub = _repo.watchDevices(hubId).listen((rows) {
      _emit(rows.map(_toDomain).toList(growable: false));
    }, onError: (Object e, StackTrace st) {
      debugPrint('SupabaseDeviceGateway watchDevices stream $e $st');
    });
  }

  GrowDevice _toDomain(DeviceRecord r) => GrowDevice(
        id: r.id,
        tuyaDeviceId: r.tuyaDeviceId,
        name: r.name,
        kind: r.hardwareKind,
        role: r.growRole,
      );

  void _emit(List<GrowDevice> list) {
    _last = list;
    if (!_devicesCtrl.isClosed) {
      _devicesCtrl.add(List.unmodifiable(list));
    }
  }

  @override
  Future<void> setOutlet(String deviceId, bool on) async {
    final hubId = _activeHubId();
    if (hubId == null) {
      throw StateError('No active hub configured');
    }
    final started = DateTime.now();
    try {
      await _repo.sendCommand(
        hubId: hubId,
        kind: 'setOutlet',
        payload: {'device_id': deviceId, 'on': on},
      );
      _traffic?.log(
        source: TrafficSource.gateway,
        kind: TrafficKind.setOutlet,
        deviceId: deviceId,
        label: 'cmd ${on ? "ON" : "OFF"}',
        detail: 'enqueued for hub via Supabase · '
            '${DateTime.now().difference(started).inMilliseconds}ms',
      );
    } catch (e) {
      _traffic?.log(
        source: TrafficSource.error,
        kind: TrafficKind.setOutlet,
        deviceId: deviceId,
        label: 'cmd FAILED ${on ? "ON" : "OFF"}',
        detail: '$e',
        ok: false,
      );
      rethrow;
    }
  }

  @override
  Future<void> renameDevice(String deviceId, String name) async {
    await _repo.renameDeviceRow(deviceId, name);
  }

  @override
  Future<void> setDeviceRole(String deviceId, GrowDeviceRole role) async {
    await _repo.updateDeviceRole(deviceId, role);
  }

  void dispose() {
    unawaited(_watchSub?.cancel());
    _watchSub = null;
    _devicesCtrl.close();
  }
}
