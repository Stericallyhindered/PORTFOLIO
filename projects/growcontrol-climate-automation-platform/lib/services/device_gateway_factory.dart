import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

import '../domain/models/grow_device.dart';
import 'device_gateway.dart';
import 'settings_repository.dart';
import 'supabase_device_gateway.dart';
import 'supabase_repository.dart';
import 'traffic_logger.dart';
import 'tuya_device_gateway.dart';

/// Production gateway factory.
///
/// The ESP32 hub owns the grow room, so the phone's primary gateway is
/// **[SupabaseDeviceGateway]** — it streams the `public.devices` table that
/// the hub also reads from, and pushes outlet/setting changes through the
/// `commands` queue that the hub drains every 10 s. The phone never needs
/// to talk to Tuya during normal operation.
///
/// The Tuya App SDK is still useful for **pairing** new devices: BLE scan,
/// captive-portal-free onboarding, and grabbing the per-device `localKey`
/// that the hub needs for Local Tuya. That gateway is created lazily by
/// [createPairingGateway] when the user opens the "Add device" sheet — it
/// stays dormant otherwise, so the SDK never tries to log the user in at
/// startup.
DeviceGateway createProductionGateway({
  required SupabaseRepository? repository,
  required SettingsRepository settings,
  TrafficLogger? trafficLogger,
}) {
  if (repository == null) {
    // No Supabase creds compiled in — surface a clear stub instead of
    // silently doing nothing. Real builds always have credentials.
    return _UnconfiguredGateway();
  }
  return SupabaseDeviceGateway(
    repository: repository,
    activeHubId: () => settings.activeHubId,
    trafficLogger: trafficLogger,
  );
}

/// Lazy Tuya gateway used exclusively for BLE pairing. Returns null on hosts
/// without the Tuya SDK (desktop, web). The caller is responsible for
/// `dispose()`-ing the returned gateway when it's done.
TuyaDeviceGateway? createPairingGateway({
  required SupabaseRepository? repository,
  required SettingsRepository settings,
  TrafficLogger? trafficLogger,
}) {
  if (!_tuyaSdkSupportedHost) return null;
  return TuyaDeviceGateway(
    supabase: repository,
    settings: settings,
    trafficLogger: trafficLogger,
  );
}

bool get _tuyaSdkSupportedHost {
  if (kIsWeb) return false;
  try {
    return Platform.isAndroid || Platform.isIOS;
  } catch (_) {
    return false;
  }
}

/// True everywhere except web (which can't run either gateway today).
bool get isGatewaySupportedPlatform => !kIsWeb;

/// True on hosts where the Tuya App SDK can run (Android / iOS). The UI uses
/// this to decide whether to expose the "Add device" pairing button.
bool get isTuyaPairingSupportedPlatform => _tuyaSdkSupportedHost;

class _UnconfiguredGateway implements DeviceGateway {
  @override
  Stream<List<GrowDevice>> watchDevices() =>
      const Stream<List<GrowDevice>>.empty();

  @override
  Future<void> refreshDevices() async {}

  @override
  Future<void> renameDevice(String deviceId, String name) async {
    throw StateError('Gateway unconfigured on this platform');
  }

  @override
  Future<void> setOutlet(String deviceId, bool on) async {
    throw StateError('Gateway unconfigured on this platform');
  }

  @override
  Future<void> setDeviceRole(String deviceId, GrowDeviceRole role) async {
    throw StateError('Gateway unconfigured on this platform');
  }
}
