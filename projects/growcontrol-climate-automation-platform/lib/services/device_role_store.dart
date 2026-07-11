import 'package:shared_preferences/shared_preferences.dart';

import '../domain/models/grow_device.dart';

/// Per-device role cache (canopySensor / humidifier / dehumidifier / ...).
///
/// Roles live authoritatively in Supabase `public.devices.role`; this local
/// store is a fast-path so the UI doesn't flicker on launch before the
/// realtime stream catches up. Survives restarts via [SharedPreferences].
class DeviceRoleStore {
  static const _prefix = 'device_role_';

  Future<GrowDeviceRole?> roleFor(String devId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_prefix$devId');
    if (raw == null) return null;
    try {
      return GrowDeviceRole.values.byName(raw);
    } catch (_) {
      return null;
    }
  }

  Future<void> setRole(String devId, GrowDeviceRole role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_prefix$devId', role.name);
  }

  Future<Map<String, GrowDeviceRole>> loadAll() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_prefix));
    final out = <String, GrowDeviceRole>{};
    for (final k in keys) {
      final devId = k.substring(_prefix.length);
      final raw = prefs.getString(k);
      if (raw == null) continue;
      try {
        out[devId] = GrowDeviceRole.values.byName(raw);
      } catch (_) {}
    }
    return out;
  }
}
