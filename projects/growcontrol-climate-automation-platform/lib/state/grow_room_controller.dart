import 'dart:async';

import 'package:flutter/foundation.dart';

import '../domain/models/grow_device.dart';
import '../domain/models/sensor_sample.dart';
import '../domain/settings/grow_scene.dart';
import '../domain/vpd/vpd_tables.dart';
import '../services/climate_calibration_store.dart';
import '../services/climate_control_service.dart';
import '../services/device_gateway.dart';
import '../services/device_gateway_factory.dart';
import '../services/grow_log_repository.dart';
import '../services/scene_rules_evaluator.dart';
import '../services/settings_repository.dart';
import '../services/supabase_device_gateway.dart';
import '../services/supabase_repository.dart';
import '../services/traffic_logger.dart';
import '../services/tuya_device_gateway.dart';

class GrowRoomController extends ChangeNotifier {
  GrowRoomController({
    required DeviceGateway gateway,
    required GrowLogRepository log,
    required SettingsRepository settings,
    ClimateCalibrationStore? calibration,
    ClimateControlService? climateService,
    TrafficLogger? trafficLogger,
    SupabaseRepository? supabase,
  })  : _log = log,
        _settings = settings,
        _traffic = trafficLogger,
        _supabase = supabase,
        gateway = gateway,
        climate = climateService ??
            ClimateControlService(log: log, calibration: calibration) {
    _settings.addListener(_onSettingsChanged);
    _gatewaySub = this.gateway.watchDevices().listen((list) {
      _devices = list;
      _reconcilePendingOutlets();
      _syncCanopySensorBinding();
      notifyListeners();
    });
    _refreshSupabaseStreams();
    unawaited(primeGateway());
  }

  StreamSubscription<({String deviceId, double tempC, double rhPct})>?
      _sensorSub;
  String? _boundCanopyId;

  final TrafficLogger? _traffic;
  final SupabaseRepository? _supabase;

  final SettingsRepository _settings;

  /// Lazy Tuya SDK gateway used purely for BLE pairing. Stays null until the
  /// user opens the "Add device" sheet, at which point [ensurePairingGateway]
  /// initialises the SDK and (optionally) prompts for Tuya sign-in.
  TuyaDeviceGateway? _pairingGateway;

  /// Live stream of new `sensor_samples` rows for the active hub. The ESP32
  /// inserts one row per device per climate tick; when the row's `device_id`
  /// matches the canopy sensor we route it into [applyEnvironmentReading]
  /// so the dashboard reflects the room in (near-)real time.
  StreamSubscription<SensorSample>? _supabaseSensorSub;

  /// Mirror of the hub's `controller_state` row. Used by the UI to show the
  /// hub's authoritative outlet state, current zone, decision JSON, etc.
  StreamSubscription<ControllerStateRecord>? _supabaseStateSub;
  ControllerStateRecord? _hubState;

  /// Track which hub the streams above are bound to so we re-subscribe on
  /// sign-out → sign-in into a different hub.
  String? _subscribedHubId;

  /// Latest (temp °C, RH %) keyed by Supabase `devices.id` from hub samples.
  final Map<String, (double, double)> _hubLastSensor = {};

  /// True when the ESP32 owns the climate loop. With the LAN-only architecture
  /// this is effectively the only mode the app has, but we keep the toggle so
  /// the developer-mode "Tuya direct" stub can be re-introduced without
  /// touching the UI.
  bool get _hubMode =>
      _settings.source == ControllerSource.hubViaSupabase &&
      _settings.activeHubId != null &&
      _supabase != null;

  /// True when the phone lists devices from Supabase for the ESP32 hub
  /// (normal production mode).
  bool get hubRemoteMode => _hubMode;

  void _onSettingsChanged() {
    // Re-subscribe Supabase realtime if the active hub changed.
    _refreshSupabaseStreams();
    if (_liveTempC != null && _liveRh != null && _sensorId != null) {
      _runClimateTick();
    }
    notifyListeners();
  }

  /// Boot the primary gateway. The phone's primary gateway is now always the
  /// Supabase-backed one, so this just kicks an initial `select`. The Tuya
  /// SDK is **not** initialised at boot; see [ensurePairingGateway].
  Future<void> primeGateway() async {
    await gateway.refreshDevices();
    notifyListeners();
  }

  /// True when the Tuya App SDK is available on this host (Android / iOS),
  /// meaning the user can open the "Add device" sheet and pair new hardware.
  /// Independent of whether they're signed in — that prompt is lazy.
  bool get usesNativeTuya => isTuyaPairingSupportedPlatform;

  /// True once the lazy pairing gateway has been initialised AND the SDK
  /// init succeeded. Only relevant inside the "Add device" sheet.
  bool get tuyaSdkReady => _pairingGateway?.sdkReady ?? false;

  String? get tuyaInitFailure {
    final g = _pairingGateway;
    if (g != null && g.sdkInitFailed) return g.sdkInitError;
    return null;
  }

  String? tuyaLoginFailure;

  /// True if the lazy pairing gateway has a cached Tuya cloud session. Only
  /// meaningful after [ensurePairingGateway] has been called at least once.
  bool get hasTuyaCloudSession => _pairingGateway?.hasCloudSession ?? false;

  /// The lazy Tuya pairing gateway (null until [ensurePairingGateway] runs).
  TuyaDeviceGateway? get tuyaGateway => _pairingGateway;

  /// Snapshot of the hub's latest controller-state row (null until the hub
  /// has published one, which it does every climate tick).
  ControllerStateRecord? get hubState => _hubState;

  /// Lazily create + initialise the Tuya pairing gateway. Safe to call from
  /// multiple places; concurrent calls return the same instance once init
  /// finishes. Returns null on hosts without the Tuya SDK (desktop / web).
  Future<TuyaDeviceGateway?> ensurePairingGateway() async {
    if (!isTuyaPairingSupportedPlatform) return null;
    var g = _pairingGateway;
    if (g == null) {
      g = createPairingGateway(
        repository: _supabase,
        settings: _settings,
        trafficLogger: _traffic,
      );
      if (g == null) return null;
      _pairingGateway = g;
      _subscribeToPairingGatewayIfReady();
    }
    if (!g.sdkReady && !g.sdkInitFailed) {
      await g.initSdk();
      notifyListeners();
    }
    return g;
  }

  /// Loads the Tuya home device list and upserts it into Supabase for the
  /// current [SettingsRepository.activeHubId]. Call after Smart Life login
  /// so the hub-backed UI (which reads only Supabase) shows outlets/sensors.
  ///
  /// Returns `null` on success, or a short error string (RLS, missing hub,
  /// network, etc.).
  Future<String?> pushTuyaHomeToSupabaseNow() async {
    if (_settings.activeHubId == null || _settings.activeHubId!.isEmpty) {
      return 'No active hub selected. Finish Supabase sign-in and pick the hub '
          'that matches your ESP32 (same id as in firmware logs).';
    }
    final g = await ensurePairingGateway();
    if (g == null) return null;
    if (!g.hasCloudSession) return null;
    await g.refreshDevices();
    return g.lastSupabasePushError;
  }

  void _subscribeToPairingGatewayIfReady() {
    final g = _pairingGateway;
    if (g == null || _sensorSub != null) return;
    _sensorSub = g.sensorStream.listen((evt) {
      final c = _canopyDevice;
      if (c == null) return;
      if (evt.deviceId != c.id && evt.deviceId != c.tuyaDeviceId) return;
      applyEnvironmentReading(tempC: evt.tempC, rhPercent: evt.rhPct);
    });
  }

  void _refreshSupabaseStreams() {
    final repo = _supabase;
    final hubId = _settings.activeHubId;
    if (repo == null || hubId == null) {
      _disposeSupabaseStreams();
      return;
    }
    if (_subscribedHubId == hubId &&
        _supabaseSensorSub != null &&
        _supabaseStateSub != null) {
      return;
    }
    _disposeSupabaseStreams();
    _subscribedHubId = hubId;
    _supabaseSensorSub = repo.liveSamples(hubId).listen(
      (sample) {
        final src = sample.sourceDeviceId;
        if (src != null && src.isNotEmpty) {
          _rememberHubSensorSample(sample);
        }
        if (_sensorSampleIsFromCanopy(sample)) {
          applyEnvironmentReading(
            tempC: sample.tempC,
            rhPercent: sample.rhPercent,
          );
        } else {
          notifyListeners();
        }
      },
      onError: (Object e, StackTrace st) {
        debugPrint('GrowRoomController liveSamples $e $st');
      },
    );
    _supabaseStateSub = repo.watchControllerState(hubId).listen(
      (state) {
        _hubState = state;
        notifyListeners();
      },
      onError: (Object e, StackTrace st) {
        debugPrint('GrowRoomController watchControllerState $e $st');
      },
    );
    if (_hubMode) {
      unawaited(_primeCanopyFromRecentSamples());
      unawaited(_primeHubSensorSamplesFromRecent());
      unawaited(_hydrateScenesFromSupabase());
    }
  }

  void _disposeSupabaseStreams() {
    unawaited(_supabaseSensorSub?.cancel());
    _supabaseSensorSub = null;
    unawaited(_supabaseStateSub?.cancel());
    _supabaseStateSub = null;
    _subscribedHubId = null;
    _hubState = null;
    _hubLastSensor.clear();
  }

  void _rememberHubSensorSample(SensorSample sample) {
    final src = sample.sourceDeviceId;
    if (src == null || src.isEmpty) return;
    final pair = (sample.tempC, sample.rhPercent);
    _hubLastSensor[src] = pair;
    for (final d in _devices) {
      if (d.id != src) continue;
      if (d.tuyaDeviceId.isEmpty) return;
      _hubLastSensor[d.tuyaDeviceId] = pair;
      return;
    }
  }

  Future<void> _primeHubSensorSamplesFromRecent() async {
    final repo = _supabase;
    final hubId = _settings.activeHubId;
    if (repo == null || hubId == null || !_hubMode) return;
    try {
      final list = await repo.recentSamples(hubId, limit: 400);
      final seen = <String>{};
      for (final s in list) {
        final id = s.sourceDeviceId;
        if (id == null || id.isEmpty) continue;
        if (seen.contains(id)) continue;
        seen.add(id);
        _rememberHubSensorSample(s);
      }
      notifyListeners();
    } catch (e, st) {
      debugPrint('GrowRoomController _primeHubSensorSamplesFromRecent $e $st');
    }
  }

  Future<void> _hydrateScenesFromSupabase() async {
    final repo = _supabase;
    final hubId = _settings.activeHubId;
    if (repo == null || hubId == null || !_hubMode) return;
    try {
      final records = await repo.listScenes(hubId);
      if (records.isEmpty) return;
      final ordered = records.where((r) => r.active).toList()
        ..sort((a, b) =>
            (a.activeOrder ?? 0).compareTo(b.activeOrder ?? 0));
      await _settings.mergeScenesFromCloud(
        cloudScenes: records.map((r) => r.scene).toList(),
        activeIdsOrdered: ordered.map((r) => r.id).toList(),
      );
    } catch (e, st) {
      debugPrint('GrowRoomController _hydrateScenesFromSupabase $e $st');
    }
  }

  /// Persists an automation to Supabase so the ESP32 hub can load it.
  Future<void> pushSceneToSupabase(GrowScene scene) async {
    if (!_hubMode) return;
    final hubId = _settings.activeHubId!;
    await _supabase!.upsertScene(hubId: hubId, id: scene.id, scene: scene);
  }

  Future<void> deleteSceneOnSupabase(String sceneId) async {
    if (!_hubMode) return;
    await _supabase!.deleteScene(sceneId);
  }

  Future<void> setSceneActiveOnSupabase(String sceneId, bool active) async {
    if (!_hubMode) return;
    await _supabase!.setSceneActive(
      hubId: _settings.activeHubId!,
      sceneId: sceneId,
      active: active,
    );
  }

  Future<void> clearActiveScenesOnSupabase(List<String> sceneIds) async {
    if (!_hubMode) return;
    final hubId = _settings.activeHubId!;
    for (final id in sceneIds) {
      try {
        await _supabase!.setSceneActive(
          hubId: hubId,
          sceneId: id,
          active: false,
        );
      } catch (e, st) {
        debugPrint('GrowRoomController clearActiveScenesOnSupabase $id $e $st');
      }
    }
  }

  // ----- Tuya login passthroughs (used by the "Add device" pair flow) -------
  //
  // These spin up the lazy pairing gateway on first call so the user never
  // sees a Tuya prompt during normal operation — only when they intentionally
  // open the pairing sheet.

  Future<bool> tuyaSendEmailCode(
      {required String email, required String countryCode}) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    return g.sendEmailCode(email: email, countryCode: countryCode);
  }

  Future<bool> tuyaLoginWithEmailCode({
    required String email,
    required String countryCode,
    required String code,
  }) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    final ok = await g.loginWithEmailCode(
      email: email,
      countryCode: countryCode,
      code: code,
    );
    tuyaLoginFailure = ok ? null : 'Tuya rejected the code.';
    notifyListeners();
    return ok;
  }

  Future<bool> tuyaLoginWithUserNamePassword({
    required String username,
    required String countryCode,
    required String password,
  }) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    final ok = await g.loginWithUserName(
      username: username,
      countryCode: countryCode,
      password: password,
    );
    tuyaLoginFailure = ok ? null : 'Tuya rejected the credentials.';
    notifyListeners();
    return ok;
  }

  Future<bool> tuyaLoginWithPhonePassword({
    required String phone,
    required String countryCode,
    required String password,
  }) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    final ok = await g.loginWithPhonePassword(
      phone: phone,
      countryCode: countryCode,
      password: password,
    );
    tuyaLoginFailure = ok ? null : 'Tuya rejected the credentials.';
    notifyListeners();
    return ok;
  }

  Future<bool> tuyaRegisterWithEmail({
    required String email,
    required String countryCode,
    required String code,
    required String password,
  }) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    return g.registerWithEmail(
      email: email,
      countryCode: countryCode,
      code: code,
      password: password,
    );
  }

  Future<bool> tuyaRegisterWithPhone({
    required String phone,
    required String countryCode,
    required String code,
    required String password,
  }) async {
    final g = await ensurePairingGateway();
    if (g == null) return false;
    return g.registerWithPhone(
      phone: phone,
      countryCode: countryCode,
      code: code,
      password: password,
    );
  }

  Future<void> tuyaLogout() async {
    final g = _pairingGateway;
    if (g == null) return;
    await g.logout();
    tuyaLoginFailure = null;
    notifyListeners();
  }

  void _syncCanopySensorBinding() {
    final canopyId = _sensorId;
    if (canopyId == _boundCanopyId) return;
    _boundCanopyId = canopyId;
    // When the canopy device changes we clear stale numbers so the UI doesn't
    // show data from the previous sensor while the new one ramps up.
    if (canopyId == null) {
      clearEnvironmentReading();
      return;
    }
    final g = _pairingGateway;
    if (g != null) {
      final c = _canopyDevice;
      if (c != null) {
        final snap = g.sensorSnapshotOf(c.id) ??
            (c.tuyaDeviceId.isNotEmpty ? g.sensorSnapshotOf(c.tuyaDeviceId) : null);
        if (snap != null) {
          applyEnvironmentReading(tempC: snap.$1, rhPercent: snap.$2);
        }
      }
    }
    // Hub mode: realtime only forwards new inserts, so paint the latest row
    // from history once when the canopy binding changes (assign role / boot).
    if (_hubMode) {
      unawaited(_primeCanopyFromRecentSamples());
    }
  }

  Future<void> _primeCanopyFromRecentSamples() async {
    final repo = _supabase;
    final hubId = _settings.activeHubId;
    if (repo == null || hubId == null) return;
    if (_canopyDevice == null) return;
    try {
      final list = await repo.recentSamples(hubId, limit: 80);
      for (final s in list) {
        if (_sensorSampleIsFromCanopy(s)) {
          applyEnvironmentReading(tempC: s.tempC, rhPercent: s.rhPercent);
          return;
        }
      }
    } catch (e, st) {
      debugPrint('GrowRoomController _primeCanopyFromRecentSamples $e $st');
    }
  }

  bool get hasCanopySensorRole =>
      _devices.any((d) => d.role == GrowDeviceRole.canopySensor);

  /// All currently active automations (oldest → newest); the *last* entry
  /// owns the global stage / photoperiod override, every entry contributes
  /// to the merged automation rule set.
  List<GrowScene> get activeAutomations => _settings.activeScenes;

  /// Real °C / RH from hardware — wired when the ESP32 streams a sample row
  /// into Supabase and an outer subscription calls [applyEnvironmentReading].
  double? get liveTempC => _liveTempC;
  double? get liveRh => _liveRh;

  bool get hasLiveEnvironmentReading =>
      _liveTempC != null && _liveRh != null;

  /// Best-effort live on/off state for a smart outlet. Priority is:
  ///   1. local optimistic cache (the user just toggled this),
  ///   2. the hub's `controller_state` row (authoritative for hum / dehu),
  ///   3. the Tuya pairing gateway DPS cache (only valid while pairing),
  ///   4. null when nothing knows yet.
  bool? outletStateOf(String deviceId) {
    final pending = _pendingOutlet[deviceId];
    if (pending != null) return pending;
    final state = _hubState;
    if (state != null) {
      if (deviceId == _humId && state.humRelayOn != null) {
        return state.humRelayOn;
      }
      if (deviceId == _dehuId && state.dehuRelayOn != null) {
        return state.dehuRelayOn;
      }
    }
    // Tuya direct / dev: live DP cache. Skip when hub owns the room — the
    // pairing SDK's online map is unrelated to LAN reachability the ESP has.
    final g = _pairingGateway;
    if (!_hubMode && g != null) return g.outletStateOf(deviceId);
    // controller_state today only carries hum/dehu booleans; every other
    // outlet is still driven via Supabase commands. Use OFF as a neutral
    // default so Manual tiles stay tappable until the hub echoes state.
    if (_hubMode && _isSmartOutlet(deviceId)) return false;
    if (g != null) return g.outletStateOf(deviceId);
    return null;
  }

  bool _isSmartOutlet(String deviceId) {
    for (final d in _devices) {
      if (d.id == deviceId) return d.kind == GrowHardwareKind.smartOutlet;
    }
    return false;
  }

  /// True when the device is currently reachable. In hub mode the phone does
  /// not maintain a Tuya subscription for every LAN device — the ESP does —
  /// so we never trust the pairing gateway's offline map here.
  bool isDeviceOnline(String deviceId) {
    if (_hubMode) return true;
    final g = _pairingGateway;
    if (g != null) return g.isDeviceOnline(deviceId);
    return true;
  }

  (double tempC, double rhPct)? sensorSnapshotOf(String deviceId) {
    if (_hubMode) {
      final snap = _hubSensorSnapshot(deviceId);
      if (snap != null) return snap;
      final c = _canopyDevice;
      if (c != null &&
          (deviceId == c.id || deviceId == c.tuyaDeviceId) &&
          _liveTempC != null &&
          _liveRh != null) {
        return (_liveTempC!, _liveRh!);
      }
      // One temp/RH device in the mesh: mirror the same live aggregates the
      // dashboard uses (covers "canopy role not assigned yet" as long as a
      // sample stream is warming _liveTempC / _liveRh).
      if (_liveTempC != null && _liveRh != null) {
        final temps = _devices
            .where((d) => d.kind == GrowHardwareKind.tempHumiditySensor)
            .toList(growable: false);
        if (temps.length == 1) {
          final d = temps.single;
          if (deviceId == d.id || deviceId == d.tuyaDeviceId) {
            return (_liveTempC!, _liveRh!);
          }
        }
      }
      return null;
    }
    final g = _pairingGateway;
    if (g != null) return g.sensorSnapshotOf(deviceId);
    return null;
  }

  (double, double)? _hubSensorSnapshot(String deviceId) {
    final direct = _hubLastSensor[deviceId];
    if (direct != null) return direct;
    for (final d in _devices) {
      if (d.id != deviceId && d.tuyaDeviceId != deviceId) continue;
      return _hubLastSensor[d.id];
    }
    return null;
  }

  /// User-driven outlet control (Manual tab). Optimistically updates the UI,
  /// publishes the DP, then schedules a refresh so the cached state catches up.
  ///
  /// Also marks [deviceId] as "held" so the climate tick stops touching it
  /// for as long as the Manual tab is the visible page (see
  /// [setManualTabActive]); leaving the tab clears the hold automatically.
  Future<void> setOutletManual(String deviceId, bool on) async {
    _pendingOutlet[deviceId] = on;
    _manualHeldIds.add(deviceId);
    final burst = _burst[deviceId];
    if (burst != null) {
      burst.phaseTimer?.cancel();
      burst.phaseTimer = null;
      burst.relayOn = on;
      burst.phaseStarted = null;
    }
    _traffic?.log(
      source: TrafficSource.manual,
      kind: TrafficKind.manualPress,
      deviceId: deviceId,
      label: 'manual ${on ? "ON" : "OFF"}',
      detail: _hubMode
          ? 'routed via Supabase commands → hub'
          : 'tab held → automation skips this device until tab leaves',
    );
    notifyListeners();
    try {
      if (_hubMode) {
        await _supabase!.sendCommand(
          hubId: _settings.activeHubId!,
          kind: 'setOutlet',
          payload: {
            'device_id': deviceId,
            'on': on,
          },
        );
      } else {
        await gateway.setOutlet(deviceId, on);
      }
    } catch (e, st) {
      debugPrint('GrowRoomController setOutletManual $deviceId=$on $e $st');
      _pendingOutlet.remove(deviceId);
      notifyListeners();
      rethrow;
    }
    if (!_hubMode) {
      unawaited(
          Future<void>.delayed(const Duration(milliseconds: 600), () async {
        try {
          await gateway.refreshDevices();
        } catch (_) {}
      }));
    }
  }

  /// Toggle convenience for arcade buttons; uses the last known state (defaults
  /// to OFF when unknown so the first tap turns the outlet ON).
  Future<void> toggleOutletManual(String deviceId) {
    final current = outletStateOf(deviceId) ?? false;
    return setOutletManual(deviceId, !current);
  }

  final Map<String, bool> _pendingOutlet = {};

  /// Drop optimistic outlet states once the authoritative source confirms
  /// the same value. In hub mode that source is the `controller_state` row.
  /// The pairing gateway, when active, can also confirm via its DPS cache.
  void _reconcilePendingOutlets() {
    if (_pendingOutlet.isEmpty) return;
    final state = _hubState;
    final g = _pairingGateway;
    _pendingOutlet.removeWhere((id, want) {
      if (state != null) {
        if (id == _humId && state.humRelayOn == want) return true;
        if (id == _dehuId && state.dehuRelayOn == want) return true;
      }
      if (g != null) {
        final actual = g.outletStateOf(id);
        if (actual != null && actual == want) return true;
      }
      return false;
    });
  }

  final GrowLogRepository _log;
  final ClimateControlService climate;
  final DeviceGateway gateway;

  GrowLogRepository get log => _log;

  String get logPersistenceHint => _log.storeSummary;

  ClimateControlDecision? lastDecision;

  StreamSubscription<List<GrowDevice>>? _gatewaySub;

  List<GrowDevice> _devices = [];
  List<GrowDevice> get devices => _devices;

  GrowthStage growthStage = GrowthStage.midFlower;
  PhotoperiodPhase photoperiod = PhotoperiodPhase.lightsOn;

  double? _liveTempC;
  double? _liveRh;

  void setGrowthStage(GrowthStage s) {
    growthStage = s;
    notifyListeners();
  }

  void setPhotoperiod(PhotoperiodPhase p) {
    photoperiod = p;
    notifyListeners();
  }

  Future<void> assignRole(String deviceId, GrowDeviceRole role) async {
    await gateway.setDeviceRole(deviceId, role);
    notifyListeners();
  }

  Future<void> renameDevice(String deviceId, String name) async {
    await gateway.renameDevice(deviceId, name);
    notifyListeners();
  }

  /// Push temperature / RH from your sensor pipeline (e.g. Tuya DPs). Until called, dashboard stays empty (no fake numbers).
  void applyEnvironmentReading({required double tempC, required double rhPercent}) {
    _liveTempC = tempC;
    _liveRh = rhPercent;
    _runClimateTick();
    notifyListeners();
  }

  void clearEnvironmentReading() {
    _liveTempC = null;
    _liveRh = null;
    lastDecision = null;
    notifyListeners();
  }

  static const double _tickMinutes = 3 / 60.0;

  String? get _humId {
    for (final d in _devices) {
      if (d.role == GrowDeviceRole.humidifier) return d.id;
    }
    return null;
  }

  String? get _dehuId {
    for (final d in _devices) {
      if (d.role == GrowDeviceRole.dehumidifier) return d.id;
    }
    return null;
  }

  String? get _sensorId {
    return _canopyDevice?.id;
  }

  GrowDevice? get _canopyDevice {
    for (final d in _devices) {
      if (d.role == GrowDeviceRole.canopySensor) return d;
    }
    return null;
  }

  /// True when [s] belongs to whichever device currently has [canopySensor].
  bool _sensorSampleIsFromCanopy(SensorSample s) {
    final src = s.sourceDeviceId;
    if (src == null || src.isEmpty) return false;
    final c = _canopyDevice;
    if (c == null) return false;
    if (src == c.id) return true;
    if (c.tuyaDeviceId.isNotEmpty && src == c.tuyaDeviceId) return true;
    return false;
  }

  double? _prevRh;

  void _runClimateTick() {
    // Hub mode hands the room over to the ESP32; the phone must not race the
    // hub with its own publishes. We still process incoming sensor data (so
    // the dashboard shows live numbers when Tuya pushes hit us), we just
    // don't act on it.
    if (_hubMode) return;

    final t = _liveTempC;
    final rh = _liveRh;
    if (t == null || rh == null) return;

    final sensorId = _sensorId;
    if (sensorId == null) return;

    final rhPrev = _prevRh;
    final humWasDesired = _humWantPrev;
    final dehuWasDesired = _dehuWantPrev;

    // Stack-aware: the last activated scene "wears the crown" for the global
    // stage / photoperiod overrides; rules from every active scene merge.
    final activeScenes = _settings.activeScenes;
    final crown = activeScenes.isEmpty ? null : activeScenes.last;
    final stage = crown?.stageOverride ?? growthStage;
    final photo = crown?.photoperiodOverride ?? photoperiod;

    // Hysteresis input is "what did climate *want* last tick", not "what is
    // the relay doing this instant" — bursts pulse the relay every 30s but
    // the model's intent across a tick is one steady state.
    final decision = climate.evaluate(
      tempC: t,
      rhPercent: rh,
      stage: stage,
      photoperiod: photo,
      humidifierWasOn: humWasDesired,
      dehumidifierWasOn: dehuWasDesired,
      canopySensorId: sensorId,
      humidifierDeviceId: _humId,
      dehumidifierDeviceId: _dehuId,
      tickMinutes: _tickMinutes,
      rhPrev: rhPrev,
    );
    lastDecision = decision;
    _prevRh = rh;

    final liveVpd = decision.liveVpdKpa;
    final ruleOutlets = SceneRulesEvaluator.outletCommandsForScenes(
      scenes: activeScenes,
      tempC: t,
      rhPercent: rh,
      vpdKpa: liveVpd,
    );

    final humId = _humId;
    final dehuId = _dehuId;

    final humWant = humId != null
        ? (ruleOutlets.containsKey(humId)
            ? ruleOutlets[humId]!
            : decision.humidifierOn)
        : false;
    final dehuWant = dehuId != null
        ? (ruleOutlets.containsKey(dehuId)
            ? ruleOutlets[dehuId]!
            : decision.dehumidifierOn)
        : false;

    final activeSummary = activeScenes.isEmpty
        ? 'no automation'
        : 'auto: ${activeScenes.map((s) => s.name).join(" + ")}';

    final humBurst = humId == null ? null : _burst[humId];
    final dehuBurst = dehuId == null ? null : _burst[dehuId];
    _traffic?.log(
      source: TrafficSource.controller,
      kind: TrafficKind.decision,
      label: 'tick T=${t.toStringAsFixed(1)}°C RH=${rh.toStringAsFixed(1)}% '
          'VPD=${liveVpd.toStringAsFixed(2)}',
      detail: 'hum: was=$humWasDesired want=$humWant '
          'relay=${humBurst?.relayOn} · '
          'dehu: was=$dehuWasDesired want=$dehuWant '
          'relay=${dehuBurst?.relayOn} · '
          '$activeSummary · '
          'manualTab=$_manualTabActive '
          'held=${_manualHeldIds.toList()} · '
          'zone=${decision.zoneLabel}',
    );

    final humReason = humId != null && ruleOutlets.containsKey(humId)
        ? 'Automation rule override · $activeSummary'
        : '${decision.notes.join('; ')} · $activeSummary';
    final dehuReason = dehuId != null && ruleOutlets.containsKey(dehuId)
        ? 'Automation rule override · $activeSummary'
        : '${decision.notes.join('; ')} · $activeSummary';

    if (humId != null) {
      _setBurstDesired(
        humId,
        humWant,
        reason: humReason,
        role: GrowDeviceRole.humidifier,
      );
    }

    if (dehuId != null) {
      _setBurstDesired(
        dehuId,
        dehuWant,
        reason: dehuReason,
        role: GrowDeviceRole.dehumidifier,
      );
    }

    _humWantPrev = humWant;
    _dehuWantPrev = dehuWant;

    // Feed the learning model the *desired* state (one steady ON segment per
    // climate decision) rather than the bursted relay state, otherwise it'd
    // see a transition every 30s and learn nothing useful.
    climate.recordHumidityLoadSegments(
      humidifierWasOn: humWasDesired,
      humidifierNowOn: humId != null ? humWant : false,
      dehumidifierWasOn: dehuWasDesired,
      dehumidifierNowOn: dehuId != null ? dehuWant : false,
      rh: rh,
      tempC: t,
    );

    for (final entry in ruleOutlets.entries) {
      final id = entry.key;
      final want = entry.value;
      if (id == humId || id == dehuId) continue;
      if (_holdsHumDuringManual(id)) continue;
      GrowDevice? dev;
      for (final d in _devices) {
        if (d.id == id) {
          dev = d;
          break;
        }
      }
      if (dev == null || dev.kind != GrowHardwareKind.smartOutlet) continue;
      final prev = _sceneOutletState[id] ?? false;
      if (prev != want) {
        _sceneOutletState[id] = want;
        unawaited(gateway.setOutlet(id, want));
      }
    }
  }

  /// True while the user is on the Manual tab and has touched [deviceId];
  /// while held, [_runClimateTick] leaves that outlet alone. Cleared the
  /// instant the Manual tab loses focus.
  bool _holdsHumDuringManual(String deviceId) =>
      _manualTabActive && _manualHeldIds.contains(deviceId);

  // -------- Burst (duty-cycle) controller ---------------------------------
  //
  // The dehumidifier is high-throughput and the canopy sensor only refreshes
  // every few minutes, so leaving the relay on for a full sensor interval
  // over-corrects badly (RH drops past the target before we get a reading).
  // Same risk on the humidifier side. Instead of holding the relay solid,
  // we pulse it: [_defaultBurstOn] on, [_defaultBurstOff] cooldown, repeat
  // until climate stops asking. The learning model and hysteresis still see
  // one steady "ON" window — they're fed the *desired* state, not the pulse.

  /// Default pulse-on duration (relay held on per burst).
  Duration burstOnDuration = const Duration(seconds: 30);

  /// Default cool-down between pulses; long enough for the room and the
  /// canopy sensor to register the effect of the previous pulse.
  Duration burstOffDuration = const Duration(seconds: 150); // 2:30

  final Map<String, _BurstState> _burst = {};
  bool _humWantPrev = false;
  bool _dehuWantPrev = false;
  final Map<String, bool> _sceneOutletState = {};

  /// Snapshot of the burst cycle for [deviceId] (relay state, phase, time
  /// remaining). Returns null when [deviceId] has no cycle.
  ({bool relayOn, bool desired, Duration? phaseRemaining, bool inOnPhase})?
      burstStatusOf(String deviceId) {
    final state = _burst[deviceId];
    if (state == null) return null;
    Duration? remaining;
    if (state.phaseStarted != null && state.phaseTimer != null) {
      final phase = state.relayOn ? burstOnDuration : burstOffDuration;
      final elapsed = DateTime.now().difference(state.phaseStarted!);
      final left = phase - elapsed;
      remaining = left.isNegative ? Duration.zero : left;
    }
    return (
      relayOn: state.relayOn,
      desired: state.desired,
      phaseRemaining: remaining,
      inOnPhase: state.relayOn,
    );
  }

  void _setBurstDesired(
    String deviceId,
    bool wantOn, {
    required String reason,
    required GrowDeviceRole role,
  }) {
    final state = _burst.putIfAbsent(deviceId, () => _BurstState());
    state.lastReason = reason;
    state.role = role;

    if (_holdsHumDuringManual(deviceId)) {
      // User has the wheel; record intent so we resume correctly on release.
      state.desired = wantOn;
      return;
    }

    if (!wantOn) {
      state.desired = false;
      state.phaseTimer?.cancel();
      state.phaseTimer = null;
      state.phaseStarted = null;
      if (state.relayOn) {
        _publishBurstChange(deviceId, false, role,
            '$reason · burst end (climate satisfied)');
      }
      return;
    }

    state.desired = true;
    if (state.phaseTimer != null) {
      // Cycle already running; leave it alone, intent is still ON.
      return;
    }
    // Start a new cycle: ON now, schedule OFF after [burstOnDuration].
    if (!state.relayOn) {
      _publishBurstChange(
        deviceId,
        true,
        role,
        '$reason · pulse ON (${burstOnDuration.inSeconds}s)',
      );
    }
    state.phaseStarted = DateTime.now();
    state.phaseTimer =
        Timer(burstOnDuration, () => _onBurstPhaseEnd(deviceId, role));
  }

  void _onBurstPhaseEnd(String deviceId, GrowDeviceRole role) {
    final state = _burst[deviceId];
    if (state == null) return;
    state.phaseTimer = null;
    if (_holdsHumDuringManual(deviceId)) {
      // Manual tab grabbed the relay mid-cycle; stop cycling, the next tick
      // after the hold is released will restart us.
      state.phaseStarted = null;
      return;
    }

    if (state.relayOn) {
      // ON phase ended → drop to cool-down regardless of desired (gives the
      // sensor + room time to register the previous pulse).
      _publishBurstChange(
        deviceId,
        false,
        role,
        '${state.lastReason ?? "burst"} · cool-down ${_fmtDur(burstOffDuration)}',
      );
      state.phaseStarted = DateTime.now();
      state.phaseTimer =
          Timer(burstOffDuration, () => _onBurstPhaseEnd(deviceId, role));
    } else {
      // Cool-down ended. If climate still wants this device, fire again;
      // otherwise stop cycling.
      if (state.desired) {
        _publishBurstChange(
          deviceId,
          true,
          role,
          '${state.lastReason ?? "burst"} · pulse ON (${burstOnDuration.inSeconds}s)',
        );
        state.phaseStarted = DateTime.now();
        state.phaseTimer =
            Timer(burstOnDuration, () => _onBurstPhaseEnd(deviceId, role));
      } else {
        state.phaseStarted = null;
      }
    }
  }

  void _publishBurstChange(
    String deviceId,
    bool on,
    GrowDeviceRole role,
    String reason,
  ) {
    final state = _burst[deviceId];
    if (state == null) return;
    final prev = state.relayOn;
    state.relayOn = on;
    if (prev != on) {
      climate.emitOutletIfChanged(
        previous: prev,
        next: on,
        deviceId: deviceId,
        role: role,
        reason: reason,
      );
      _traffic?.log(
        source: TrafficSource.controller,
        kind: TrafficKind.setOutlet,
        deviceId: deviceId,
        label: 'burst ${on ? "ON" : "OFF"}',
        detail: reason,
      );
      unawaited(gateway.setOutlet(deviceId, on));
    }
  }

  static String _fmtDur(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    if (m == 0) return '${s}s';
    return '${m}:${s.toString().padLeft(2, "0")}';
  }

  /// True while the Manual tab is the visible one. While true, automation
  /// skips any device the user has touched (see [_manualHeldIds]) so the
  /// arcade buttons don't get stomped 1-3s after the user lets go.
  bool _manualTabActive = false;
  final Set<String> _manualHeldIds = {};

  bool get manualTabActive => _manualTabActive;
  Set<String> get manualHeldIds => Set.unmodifiable(_manualHeldIds);

  /// Wired by [HomeShell] every time the bottom-nav index changes. When
  /// transitioning *off* the Manual tab we drop the held set and immediately
  /// re-evaluate the climate tick so the relays snap back to the current
  /// automation decision (no lag waiting for the next sensor push).
  void setManualTabActive(bool active) {
    if (_manualTabActive == active) return;
    _manualTabActive = active;
    _traffic?.log(
      source: TrafficSource.controller,
      kind: TrafficKind.info,
      label: active ? 'manual tab focus → automation paused' : 'manual tab left → automation resumed',
      detail: 'held=${_manualHeldIds.toList()}',
    );
    if (!active) {
      _manualHeldIds.clear();
      // Force a tick — but only if we already have a live reading, otherwise
      // there's nothing to evaluate.
      if (_liveTempC != null && _liveRh != null) {
        _runClimateTick();
      }
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _settings.removeListener(_onSettingsChanged);
    _gatewaySub?.cancel();
    _sensorSub?.cancel();
    _disposeSupabaseStreams();
    for (final s in _burst.values) {
      s.phaseTimer?.cancel();
    }
    _burst.clear();
    unawaited(_log.flush());
    final g = gateway;
    if (g is SupabaseDeviceGateway) {
      g.dispose();
    } else if (g is TuyaDeviceGateway) {
      g.dispose();
    }
    _pairingGateway?.dispose();
    _pairingGateway = null;
    super.dispose();
  }
}

class _BurstState {
  GrowDeviceRole role = GrowDeviceRole.unassigned;

  /// `true` while climate keeps asking for this outlet to be running.
  bool desired = false;

  /// `true` when the relay is currently energised (i.e. we're in the ON
  /// phase of the burst). Flipped only by [_publishBurstChange].
  bool relayOn = false;

  /// Pending phase-transition timer (next ON→OFF or OFF→ON).
  Timer? phaseTimer;

  /// Wall-clock start of the current phase, used to compute "time remaining
  /// in this pulse" for UI/logging.
  DateTime? phaseStarted;

  /// Last reason text captured from the climate tick (so the per-pulse
  /// outlet events still tell the user *why* we're cycling).
  String? lastReason;
}
