import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/models/grow_device.dart';
import '../domain/settings/actuator_role_settings.dart';
import '../domain/settings/device_display_settings.dart';
import '../domain/settings/grow_scene.dart';

const _kPayloadVersion = 1;
const _kKey = 'growcontrol_settings_v1';

/// Where the phone gets its truth and where it sends commands.
///
/// - [hubViaSupabase]: **default and only intended mode.** The ESP32 hub in
///   the grow room owns the climate loop and talks LAN-Tuya to every device.
///   The phone reads telemetry and writes settings/commands through Supabase
///   from anywhere on the internet, and doesn't need to stay running.
/// - [tuyaDirect]: legacy fall-back kept behind a debug flag — the phone runs
///   the climate controller locally and talks Tuya cloud directly. Only
///   useful for development; ordinary builds never select this.
enum ControllerSource { tuyaDirect, hubViaSupabase }

/// Local JSON persistence for display names, actuator JSON, scenes, manual overrides.
class SettingsRepository extends ChangeNotifier {
  SettingsRepository();

  bool _loaded = false;
  bool get isLoaded => _loaded;

  final Map<String, DeviceDisplaySettings> _displays = {};
  final Map<String, ActuatorRoleSettings> _actuators = {};
  final Map<String, ManualOutletCommand> _manual = {};
  final List<GrowScene> _scenes = [];

  /// Active controller source. Defaults to **hub-via-Supabase** — the ESP32
  /// owns the room and the phone is a thin remote. The legacy Tuya-direct
  /// mode can still be selected by code paths that explicitly want it (none
  /// remain in the production UI).
  ControllerSource _source = ControllerSource.hubViaSupabase;

  /// Which Supabase hub row the phone is currently bound to. Set when the
  /// user first signs in and either creates or selects a hub. Mirrors to
  /// Supabase via the repository, never to the legacy local Tuya path.
  String? _activeHubId;

  ControllerSource get source => _source;
  String? get activeHubId => _activeHubId;

  /// Set of automation ids currently running. Order is preserved so the *last*
  /// activated scene's stage / photoperiod overrides win in conflicts (newest
  /// "wears the crown"), while every active scene's automation rules and
  /// per-device overrides are merged.
  final List<String> _activeSceneIds = [];

  Map<String, DeviceDisplaySettings> get displays => Map.unmodifiable(_displays);
  Map<String, ActuatorRoleSettings> get actuators => Map.unmodifiable(_actuators);
  Map<String, ManualOutletCommand> get manualOverrides => Map.unmodifiable(_manual);
  List<GrowScene> get scenes => List.unmodifiable(_scenes);

  /// Live ordered list of active scene ids (oldest → newest).
  List<String> get activeSceneIds => List.unmodifiable(_activeSceneIds);

  /// Live list of active scenes, oldest → newest.
  List<GrowScene> get activeScenes {
    final out = <GrowScene>[];
    for (final id in _activeSceneIds) {
      for (final s in _scenes) {
        if (s.id == id) {
          out.add(s);
          break;
        }
      }
    }
    return out;
  }

  /// True if [sceneId] is currently active.
  bool isSceneActive(String sceneId) => _activeSceneIds.contains(sceneId);

  /// Legacy single-scene accessor — returns the *most recently* activated
  /// scene, or null when nothing is active. Existing callers keep compiling
  /// while [activeScenes] is the source of truth for stacked automations.
  String? get activeSceneId =>
      _activeSceneIds.isEmpty ? null : _activeSceneIds.last;

  GrowScene? get activeScene {
    final id = activeSceneId;
    if (id == null) return null;
    for (final s in _scenes) {
      if (s.id == id) return s;
    }
    return null;
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kKey);
    if (raw == null || raw.isEmpty) {
      _loaded = true;
      notifyListeners();
      return;
    }
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      if ((map['v'] as int?) != _kPayloadVersion) {
        _loaded = true;
        notifyListeners();
        return;
      }
      _displays.clear();
      final d = map['displays'];
      if (d is Map) {
        for (final e in d.entries) {
          _displays[e.key as String] = DeviceDisplaySettings.fromJson(
            Map<String, dynamic>.from(e.value as Map),
          );
        }
      }
      _actuators.clear();
      final a = map['actuators'];
      if (a is Map) {
        for (final e in a.entries) {
          _actuators[e.key as String] = ActuatorRoleSettings.fromJson(
            Map<String, dynamic>.from(e.value as Map),
          );
        }
      }
      _manual.clear();
      final m = map['manual'];
      if (m is Map) {
        for (final e in m.entries) {
          _manual[e.key as String] = ManualOutletCommand.values.firstWhere(
            (c) => c.name == e.value,
            orElse: () => ManualOutletCommand.none,
          );
        }
      }
      _scenes.clear();
      final sc = map['scenes'];
      if (sc is List) {
        for (final x in sc) {
          _scenes.add(GrowScene.fromJson(Map<String, dynamic>.from(x as Map)));
        }
      }
      _activeSceneIds.clear();
      final ids = map['activeSceneIds'];
      if (ids is List) {
        for (final x in ids) {
          if (x is String && x.isNotEmpty) _activeSceneIds.add(x);
        }
      } else {
        // Legacy single-scene payload (pre multi-scene migration).
        final legacy = map['activeSceneId'];
        if (legacy is String && legacy.isNotEmpty) {
          _activeSceneIds.add(legacy);
        }
      }
      // Drop any active id that doesn't reference a still-existing scene.
      _activeSceneIds
          .removeWhere((id) => !_scenes.any((s) => s.id == id));
      final src = map['source'];
      if (src is String) {
        _source = ControllerSource.values.firstWhere(
          (v) => v.name == src,
          orElse: () => ControllerSource.hubViaSupabase,
        );
      }
      // One-time migration: the legacy `tuyaDirect` source is no longer
      // supported in production builds — the phone is always a thin remote
      // for the ESP32 hub. Silently flip persisted values so existing
      // installs adopt the new default without user intervention.
      if (_source == ControllerSource.tuyaDirect) {
        _source = ControllerSource.hubViaSupabase;
      }
      final hub = map['activeHubId'];
      if (hub is String && hub.isNotEmpty) {
        _activeHubId = hub;
      }
    } catch (e, st) {
      debugPrint('SettingsRepository load failed: $e $st');
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    final map = <String, dynamic>{
      'v': _kPayloadVersion,
      'displays': _displays.map((k, v) => MapEntry(k, v.toJson())),
      'actuators': _actuators.map((k, v) => MapEntry(k, v.toJson())),
      'manual': _manual.map((k, v) => MapEntry(k, v.name)),
      'scenes': _scenes.map((s) => s.toJson()).toList(),
      'activeSceneIds': List<String>.from(_activeSceneIds),
      // Legacy field kept for older builds that may still read it.
      'activeSceneId':
          _activeSceneIds.isEmpty ? null : _activeSceneIds.last,
      'source': _source.name,
      if (_activeHubId != null) 'activeHubId': _activeHubId,
    };
    await prefs.setString(_kKey, jsonEncode(map));
    notifyListeners();
  }

  Future<void> setDisplay(DeviceDisplaySettings s) async {
    _displays[s.deviceId] = s;
    await _persist();
  }

  Future<void> removeDisplay(String deviceId) async {
    _displays.remove(deviceId);
    await _persist();
  }

  Future<void> setActuator(String deviceId, ActuatorRoleSettings settings) async {
    _actuators[deviceId] = settings;
    await _persist();
  }

  ActuatorRoleSettings effectiveActuator(
    String deviceId,
    GrowDeviceRole role,
  ) {
    final saved = _actuators[deviceId];
    final base = ActuatorRoleSettings.defaultsFor(role);
    if (saved == null) return base;
    return ActuatorRoleSettings(
      humidityLoad: saved.humidityLoad ?? base.humidityLoad,
      light: saved.light ?? base.light,
      pump: saved.pump ?? base.pump,
      fan: saved.fan ?? base.fan,
      generic: saved.generic ?? base.generic,
    );
  }

  Future<void> setManualOverride(
    String deviceId,
    ManualOutletCommand cmd,
  ) async {
    if (cmd == ManualOutletCommand.none) {
      _manual.remove(deviceId);
    } else {
      _manual[deviceId] = cmd;
    }
    await _persist();
  }

  ManualOutletCommand manualFor(String deviceId) =>
      _manual[deviceId] ?? ManualOutletCommand.none;

  Future<void> upsertScene(GrowScene scene) async {
    final i = _scenes.indexWhere((s) => s.id == scene.id);
    if (i >= 0) {
      _scenes[i] = scene;
    } else {
      _scenes.add(scene);
    }
    await _persist();
  }

  Future<void> removeScene(String id) async {
    _scenes.removeWhere((s) => s.id == id);
    _activeSceneIds.remove(id);
    await _persist();
  }

  /// Toggle a scene's active state without affecting other active scenes.
  /// Re-activating an already-active scene moves it to the back of the stack
  /// (so its overrides win until something newer is activated).
  Future<void> setSceneActive(String id, bool active) async {
    _activeSceneIds.remove(id);
    if (active) _activeSceneIds.add(id);
    await _persist();
  }

  /// Legacy single-active accessor: passing null deactivates everything; passing
  /// an id makes that scene active *in addition to* anything already active.
  /// Use [setSceneActive] when you mean to toggle.
  Future<void> setActiveScene(String? id) async {
    if (id == null) {
      _activeSceneIds.clear();
    } else {
      _activeSceneIds.remove(id);
      _activeSceneIds.add(id);
    }
    await _persist();
  }

  /// Hard reset of the active stack — useful when the user wants a clean slate.
  Future<void> clearActiveScenes() async {
    if (_activeSceneIds.isEmpty) return;
    _activeSceneIds.clear();
    await _persist();
  }

  /// Merges rows from Supabase into the local scene list (by id) and replaces
  /// the active stack with [activeIdsOrdered]. Scenes that exist only on the
  /// phone are left untouched.
  Future<void> mergeScenesFromCloud({
    required List<GrowScene> cloudScenes,
    required List<String> activeIdsOrdered,
  }) async {
    if (cloudScenes.isEmpty) return;
    for (final s in cloudScenes) {
      final i = _scenes.indexWhere((x) => x.id == s.id);
      if (i >= 0) {
        _scenes[i] = s;
      } else {
        _scenes.add(s);
      }
    }
    _activeSceneIds
      ..clear()
      ..addAll(activeIdsOrdered);
    _activeSceneIds.removeWhere((id) => !_scenes.any((s) => s.id == id));
    await _persist();
  }

  Future<void> setSource(ControllerSource s) async {
    if (_source == s) return;
    _source = s;
    await _persist();
  }

  Future<void> setActiveHubId(String? id) async {
    if (_activeHubId == id) return;
    _activeHubId = id;
    await _persist();
  }
}
