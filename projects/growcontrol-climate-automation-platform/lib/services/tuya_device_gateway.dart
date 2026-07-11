import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:tuya_home_sdk_flutter/tuya_home_sdk_flutter.dart';

import '../config/tuya_env.dart';
import '../domain/models/discovered_tuya_device.dart';
import '../domain/models/grow_device.dart';
import 'device_gateway.dart';
import 'device_role_store.dart';
import 'dp_environment.dart';
import 'settings_repository.dart';
import 'supabase_repository.dart';
import 'traffic_logger.dart';

/// Tuya App SDK-backed device gateway.
///
/// This is the **phone-side** integration. It:
///  - Initialises the Tuya SDK with our App Key/Secret (free, never expires)
///  - Tracks the user's Tuya Smart Life login session (one-time, cached)
///  - Picks (or auto-creates) a Tuya "home" and streams its device list
///  - Provides BLE discovery + pair so new devices flow in without copy-paste
///  - Drives outlet on/off via `publishDps`
///  - Subscribes to DP updates from sensors and parses them into (°C, %RH)
///  - **Auto-upserts every device (including `localKey` and `pv` protocol
///    version) into Supabase via [SupabaseRepository.upsertDevicesLocal]** so
///    the ESP32 hub can pick them up and talk Local Tuya on the LAN — no
///    tinytuya wizard required.
///
/// The ESP32 hub does NOT use this gateway. It reads `public.devices` from
/// Supabase and talks the LAN Tuya protocol directly on port 6668.
class TuyaDeviceGateway implements DeviceGateway {
  TuyaDeviceGateway({
    SupabaseRepository? supabase,
    SettingsRepository? settings,
    TrafficLogger? trafficLogger,
  })  : _supabase = supabase,
        _settings = settings,
        _traffic = trafficLogger;

  final SupabaseRepository? _supabase;
  final SettingsRepository? _settings;
  final TrafficLogger? _traffic;
  final DeviceRoleStore _roleStore = DeviceRoleStore();

  final TuyaHomeSdkFlutter _sdk = TuyaHomeSdkFlutter.instance;

  // ----- SDK + auth state ----------------------------------------------------
  bool _sdkInited = false;
  bool _sdkInitFailed = false;
  String? _sdkInitError;
  bool _hasCloudSession = false;
  num? _homeId;

  // ----- Device cache --------------------------------------------------------
  final Map<String, ThingSmartDeviceModel> _byDevId = {};
  final Map<String, Map<String, dynamic>> _dpsById = {};
  final Map<String, StreamSubscription<TuyaDeviceEvent>> _dpsSubs = {};
  final Map<String, (double, double)> _sensorSnap = {};
  final Set<String> _online = {};
  final Map<String, GrowDeviceRole> _localRoles = {};

  final StreamController<List<GrowDevice>> _devicesCtrl =
      StreamController<List<GrowDevice>>.broadcast();

  final StreamController<({String deviceId, double tempC, double rhPct})>
      _sensorCtrl = StreamController.broadcast();

  /// True once `initSdk` completed without throwing.
  bool get sdkReady => _sdkInited;

  /// One-line reason `initSdk` failed (for the login panel).
  String? get sdkInitError => _sdkInitError;
  bool get sdkInitFailed => _sdkInitFailed;

  /// True after a successful Tuya cloud login. Cached across launches by the
  /// native SDK; calling `currentUser` returns non-null on warm starts.
  bool get hasCloudSession => _hasCloudSession;

  /// Set when [refreshDevices] ran a Supabase upsert and it failed or was
  /// skipped for a blocking reason (missing hub, RLS, network). Null on success.
  String? get lastSupabasePushError => _lastSupabasePushError;

  String? _lastSupabasePushError;

  /// Live (deviceId, °C, %RH) updates parsed from Tuya DP events.
  Stream<({String deviceId, double tempC, double rhPct})> get sensorStream =>
      _sensorCtrl.stream;

  // ----- DeviceGateway interface --------------------------------------------

  @override
  Stream<List<GrowDevice>> watchDevices() {
    scheduleMicrotask(() {
      if (!_devicesCtrl.isClosed) _devicesCtrl.add(_snapshot());
    });
    return _devicesCtrl.stream;
  }

  @override
  Future<void> refreshDevices() async {
    if (!await _ensureReady()) return;
    final homeId = await _ensureHome();
    if (homeId == null) return;
    try {
      final list = await _sdk.getHomeDevices(homeId: homeId);
      _byDevId.clear();
      for (final d in list) {
        final id = d.devId;
        if (id == null) continue;
        _byDevId[id] = d;
        _online.add(id);
        if (d.dps != null) {
          _dpsById[id] = d.dps!.map((k, v) => MapEntry(k.toString(), v));
        }
        _ensureDpSubscription(id);
        _refreshSensorSnap(id);
      }
      // Drop any cached devices no longer in the list.
      _online.removeWhere((id) => !_byDevId.containsKey(id));
      _devicesCtrl.add(_snapshot());
      _traffic?.log(
        source: TrafficSource.gateway,
        kind: TrafficKind.info,
        label: 'tuya device list ${list.length}',
        detail: 'home $homeId',
      );
      await _pushToSupabase();
    } catch (e, st) {
      debugPrint('TuyaDeviceGateway refreshDevices $e $st');
      _traffic?.log(
        source: TrafficSource.error,
        kind: TrafficKind.info,
        label: 'tuya refreshDevices FAILED',
        detail: '$e',
        ok: false,
      );
    }
  }

  @override
  Future<void> renameDevice(String deviceId, String name) async {
    await _sdk.renameDevice(deviceId: deviceId, name: name);
    final m = _byDevId[deviceId];
    if (m != null) {
      _byDevId[deviceId] = _mergeNamed(m, name);
      _devicesCtrl.add(_snapshot());
    }
    await _pushToSupabase();
  }

  @override
  Future<void> setOutlet(String deviceId, bool on) async {
    final dp = TuyaEnv.defaultSwitchDpId;
    final ok = await _sdk.publishDps(deviceId: deviceId, dps: {dp: on});
    _traffic?.log(
      source: TrafficSource.gateway,
      kind: TrafficKind.setOutlet,
      deviceId: deviceId,
      label: 'tuya dp $dp → ${on ? "ON" : "OFF"}',
      detail: ok ? 'ok' : 'publishDps returned false',
      ok: ok,
    );
    if (ok) {
      final dps = _dpsById[deviceId] ?? <String, dynamic>{};
      dps[dp] = on;
      _dpsById[deviceId] = dps;
    } else {
      throw StateError('Tuya publishDps refused $deviceId dp=$dp on=$on');
    }
  }

  @override
  Future<void> setDeviceRole(String deviceId, GrowDeviceRole role) async {
    _localRoles[deviceId] = role;
    await _roleStore.setRole(deviceId, role);
    _devicesCtrl.add(_snapshot());
    await _pushToSupabase();
  }

  // ----- Local UI helpers ----------------------------------------------------

  /// Last cached on/off for the default switch DP. Null if the device hasn't
  /// reported any DPS yet (or isn't an outlet).
  bool? outletStateOf(String deviceId) {
    final dps = _dpsById[deviceId];
    if (dps == null) return null;
    final raw = dps[TuyaEnv.defaultSwitchDpId];
    if (raw is bool) return raw;
    if (raw is num) return raw != 0;
    if (raw is String) {
      if (raw == 'true' || raw == '1') return true;
      if (raw == 'false' || raw == '0') return false;
    }
    return null;
  }

  bool isDeviceOnline(String deviceId) {
    final m = _byDevId[deviceId];
    if (m == null) return false;
    return m.isOnline || m.isLocalOnline || m.isCloudOnline;
  }

  (double, double)? sensorSnapshotOf(String deviceId) =>
      _sensorSnap[deviceId];

  // ----- Init & login --------------------------------------------------------

  Future<bool> _ensureReady() async {
    if (_sdkInited) return _hasCloudSession;
    await initSdk();
    return _sdkInited && _hasCloudSession;
  }

  /// Idempotent SDK init. Safe to call on every app start.
  Future<void> initSdk() async {
    if (_sdkInited) return;
    if (!TuyaEnv.hasCredentials) {
      _sdkInitFailed = true;
      _sdkInitError =
          'TUYA_APP_KEY / TUYA_APP_SECRET not provided at build time '
          '(see lib/config/tuya_env.dart)';
      return;
    }
    try {
      await _sdk.initSdk(
        TuyaEnv.appKey,
        TuyaEnv.appSecret,
        TuyaEnv.licenseKey,
      );
      _sdkInited = true;
      _sdkInitFailed = false;
      _sdkInitError = null;
      final user = await _sdk.getUserInfo();
      _hasCloudSession = user != null;
      if (_hasCloudSession) {
        await _loadLocalRoles();
        // Cached Smart Life session: still push the whole home to Supabase so
        // the ESP32 sees local_key / pv without forcing another login.
        await refreshDevices();
      }
    } catch (e) {
      _sdkInited = false;
      _sdkInitFailed = true;
      _sdkInitError = '$e';
    }
  }

  Future<bool> loginWithEmailCode({
    required String email,
    required String countryCode,
    required String code,
  }) async {
    if (!_sdkInited) await initSdk();
    if (!_sdkInited) return false;
    final ok = await _sdk.loginWithEmailCode(
      email: email,
      countryCode: countryCode,
      code: code,
    );
    if (ok) {
      _hasCloudSession = true;
      await _loadLocalRoles();
      await refreshDevices();
    }
    return ok;
  }

  Future<bool> loginWithUserName({
    required String username,
    required String countryCode,
    required String password,
  }) async {
    if (!_sdkInited) await initSdk();
    if (!_sdkInited) return false;
    final ok = await _sdk.loginWithUserName(
      username: username,
      countryCode: countryCode,
      password: password,
    );
    if (ok) {
      _hasCloudSession = true;
      await _loadLocalRoles();
      await refreshDevices();
    }
    return ok;
  }

  Future<bool> loginWithPhonePassword({
    required String phone,
    required String countryCode,
    required String password,
  }) async {
    if (!_sdkInited) await initSdk();
    if (!_sdkInited) return false;
    final ok = await _sdk.loginWithPhonePassword(
      phone: phone,
      countryCode: countryCode,
      password: password,
    );
    if (ok) {
      _hasCloudSession = true;
      await _loadLocalRoles();
      await refreshDevices();
    }
    return ok;
  }

  Future<bool> sendEmailCode({
    required String email,
    required String countryCode,
  }) =>
      _sdk.sendVerifyCodeWithUserName(
        username: email,
        countryCode: countryCode,
        // Type 2 = login code (per Tuya docs).
        type: 2,
      );

  Future<bool> registerWithEmail({
    required String email,
    required String countryCode,
    required String code,
    required String password,
  }) =>
      _sdk.registerByUserName(
        username: email,
        countryCode: countryCode,
        code: code,
        password: password,
      );

  Future<bool> registerWithPhone({
    required String phone,
    required String countryCode,
    required String code,
    required String password,
  }) =>
      _sdk.registerByPhone(
        phone: phone,
        countryCode: countryCode,
        code: code,
        password: password,
      );

  Future<void> logout() async {
    try {
      await _sdk.logout();
    } catch (_) {}
    _hasCloudSession = false;
    _byDevId.clear();
    _dpsById.clear();
    _sensorSnap.clear();
    _online.clear();
    for (final s in _dpsSubs.values) {
      unawaited(s.cancel());
    }
    _dpsSubs.clear();
    _homeId = null;
    _devicesCtrl.add(const []);
  }

  // ----- Home / device discovery --------------------------------------------

  Future<num?> _ensureHome() async {
    if (_homeId != null) return _homeId;
    try {
      final homes = await _sdk.getHomeList();
      if (homes.isNotEmpty) {
        _homeId = homes.first.homeId;
        return _homeId;
      }
      // No home yet — auto-create one so first-time users aren't blocked.
      final created = await _sdk.addHomeWithName(
        name: 'GrowControl',
        geoName: 'GrowControl',
      );
      _homeId = created;
      return _homeId;
    } catch (e) {
      debugPrint('TuyaDeviceGateway _ensureHome $e');
      return null;
    }
  }

  /// Returns the current Tuya home id (resolves it if not yet cached).
  Future<num?> activeHomeId() => _ensureHome();

  Future<void> _loadLocalRoles() async {
    final stored = await _roleStore.loadAll();
    _localRoles
      ..clear()
      ..addAll(stored);
  }

  // ----- BLE discovery + pair -----------------------------------------------

  /// Live stream of BLE-discovered devices. The native side filters this to
  /// Tuya-branded BLE adverts; we just translate the model.
  Stream<DiscoveredTuyaDevice> discoverDevices() {
    return _sdk.discoverDevices().map(
          (d) => DiscoveredTuyaDevice(
            uuid: d.uuid,
            productId: d.productId,
            name: d.name,
            iconUrl: d.iconUrl,
          ),
        );
  }

  /// Pairs a BLE-discovered device onto the given Wi-Fi network. Returns the
  /// `devId` of the newly paired device, or null on failure. After a successful
  /// pair we automatically refresh the device list so the new entry shows up
  /// in Supabase within seconds.
  Future<String?> pairDevice({
    required DiscoveredTuyaDevice device,
    required String ssid,
    required String password,
    Duration timeout = const Duration(seconds: 120),
  }) async {
    final homeId = await _ensureHome();
    if (homeId == null) return null;
    try {
      final paired = await _sdk.startConfigBLEWifiDevice(
        ssid: ssid,
        password: password,
        homeId: homeId,
        deviceUuid: device.uuid,
        deviceProductId: device.productId,
        timeout: timeout.inMilliseconds,
      );
      await refreshDevices();
      return paired?.devId;
    } catch (e) {
      debugPrint('TuyaDeviceGateway pairDevice $e');
      return null;
    }
  }

  // ----- Internals -----------------------------------------------------------

  void _ensureDpSubscription(String deviceId) {
    if (_dpsSubs.containsKey(deviceId)) return;
    _dpsSubs[deviceId] = _sdk.onDeviceEvents(deviceId: deviceId).listen((evt) {
      if (evt is DpsUpdateEvent) {
        final dps = _dpsById[deviceId] ?? <String, dynamic>{};
        dps.addAll(evt.dps.map((k, v) => MapEntry(k.toString(), v)));
        _dpsById[deviceId] = dps;
        _refreshSensorSnap(deviceId);
        _devicesCtrl.add(_snapshot());
      } else if (evt is StatusChangedEvent) {
        if (evt.isOnline) {
          _online.add(deviceId);
        } else {
          _online.remove(deviceId);
        }
        _devicesCtrl.add(_snapshot());
      } else if (evt is NetworkStatusEvent) {
        if (evt.isConnected) {
          _online.add(deviceId);
        } else {
          _online.remove(deviceId);
        }
        _devicesCtrl.add(_snapshot());
      } else if (evt is DeviceRemovedEvent) {
        _byDevId.remove(deviceId);
        _dpsById.remove(deviceId);
        _sensorSnap.remove(deviceId);
        _online.remove(deviceId);
        _devicesCtrl.add(_snapshot());
      }
    }, onError: (Object e) {
      debugPrint('TuyaDeviceGateway device events $deviceId $e');
    });
  }

  void _refreshSensorSnap(String deviceId) {
    final dps = _dpsById[deviceId];
    if (dps == null) return;
    final parsed = tryParseDpTempHumidity(dps);
    if (parsed == null) return;
    _sensorSnap[deviceId] = parsed;
    if (!_sensorCtrl.isClosed) {
      _sensorCtrl.add((
        deviceId: deviceId,
        tempC: parsed.$1,
        rhPct: parsed.$2,
      ));
    }
  }

  ThingSmartDeviceModel _mergeNamed(ThingSmartDeviceModel m, String name) {
    final json = m.toJson();
    json['name'] = name;
    return ThingSmartDeviceModel.fromJson(json);
  }

  GrowHardwareKind _kindOf(ThingSmartDeviceModel m) {
    // Lazy heuristic: if any DP carries a >=0..100 numeric that looks like RH,
    // call it a sensor; everything else is a switch. This matches what the
    // legacy gateway did and works for all the canopy / outlet hardware we
    // ship.
    final dps = _dpsById[m.devId ?? ''];
    if (dps != null && tryParseDpTempHumidity(dps) != null) {
      return GrowHardwareKind.tempHumiditySensor;
    }
    // Also fall back on Tuya's category code when DPS hasn't arrived yet.
    final cat = (m.categoryCode ?? '').toLowerCase();
    if (cat.contains('wsdcg') || cat.contains('temhum')) {
      return GrowHardwareKind.tempHumiditySensor;
    }
    return GrowHardwareKind.smartOutlet;
  }

  List<GrowDevice> _snapshot() {
    final list = <GrowDevice>[];
    for (final m in _byDevId.values) {
      final devId = m.devId;
      if (devId == null) continue;
      list.add(GrowDevice(
        id: devId,
        tuyaDeviceId: devId,
        name: m.name,
        kind: _kindOf(m),
        role: _localRoles[devId] ?? GrowDeviceRole.unassigned,
      ));
    }
    return list;
  }

  /// Pushes the current SDK device list (with localKey and protocol version)
  /// into Supabase so the ESP32 hub can talk Local Tuya. Best-effort; never
  /// throws into callers.
  Future<void> _pushToSupabase() async {
    _lastSupabasePushError = null;
    final repo = _supabase;
    final hubId = _settings?.activeHubId;
    if (repo == null) {
      _lastSupabasePushError =
          'SupabaseRepository missing — cannot save devices to the cloud.';
      debugPrint('TuyaDeviceGateway _pushToSupabase: $lastSupabasePushError');
      return;
    }
    if (hubId == null || hubId.isEmpty) {
      _lastSupabasePushError =
          'No active hub selected in the app. Sign in to Supabase and pick the '
          'same hub id your ESP32 firmware uses, then try again.';
      debugPrint('TuyaDeviceGateway _pushToSupabase: $lastSupabasePushError');
      return;
    }
    if (_byDevId.isEmpty) return;
    try {
      final records = <DeviceRecord>[];
      for (final m in _byDevId.values) {
        final devId = m.devId;
        if (devId == null) continue;
        final kind = _kindOf(m) == GrowHardwareKind.tempHumiditySensor
            ? 'tempHumiditySensor'
            : 'smartOutlet';
        final role = (_localRoles[devId] ?? GrowDeviceRole.unassigned).name;
        records.add(DeviceRecord(
          tuyaDeviceId: devId,
          name: m.name,
          kind: kind,
          role: role,
          localKey: m.localKey,
          protocolVersion: _normalisePv(m.pv),
        ));
      }
      if (records.isEmpty) return;
      await repo.upsertDevicesLocal(hubId, records);
      _lastSupabasePushError = null;
      _traffic?.log(
        source: TrafficSource.gateway,
        kind: TrafficKind.info,
        label: 'tuya → supabase synced ${records.length}',
        detail: 'hub $hubId',
      );
    } catch (e) {
      _lastSupabasePushError = '$e';
      debugPrint('TuyaDeviceGateway _pushToSupabase FAILED: $e');
      _traffic?.log(
        source: TrafficSource.error,
        kind: TrafficKind.info,
        label: 'tuya → supabase sync FAILED',
        detail: '$e',
        ok: false,
      );
    }
  }

  /// Tuya `pv` arrives as strings like `"2.3"`, `"2.4"` (BLE protocol) or
  /// `"3.3"`, `"3.4"` (LAN protocol). Local Tuya only cares about the LAN
  /// number; default to `3.3` when the value is missing or doesn't look like
  /// one.
  String _normalisePv(String? pv) {
    if (pv == null) return '3.3';
    final s = pv.trim();
    if (s == '3.3' || s == '3.4' || s == '3.1' || s == '3.5') return s;
    return '3.3';
  }

  /// Tear down. Closes SDK event subscriptions; does NOT log the user out (we
  /// want the cached session to survive app restarts).
  void dispose() {
    for (final s in _dpsSubs.values) {
      unawaited(s.cancel());
    }
    _dpsSubs.clear();
    _devicesCtrl.close();
    _sensorCtrl.close();
  }
}
