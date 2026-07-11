import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'config/supabase_env.dart';
import 'services/climate_calibration_store.dart';
import 'services/device_gateway_factory.dart';
import 'services/grow_log_repository.dart';
import 'services/settings_repository.dart';
import 'services/supabase_repository.dart';
import 'services/traffic_logger.dart';
import 'ui/screens/unsupported_platform_app.dart';

/// We use the Tuya App SDK on the phone, which is Android/iOS native. Pre-empt
/// confusion when someone tries `flutter run -d windows` by showing an
/// unsupported-platform splash instead of a crash on `initSdk`.
bool _tuyaSdkSupportedHost() {
  if (kIsWeb) return false;
  try {
    return Platform.isAndroid || Platform.isIOS;
  } catch (_) {
    return false;
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!_tuyaSdkSupportedHost()) {
    runApp(const UnsupportedPlatformApp());
    return;
  }

  // Supabase comes first: the rest of the app can `Supabase.instance.client`
  // unconditionally once `hasCredentials` is set. Without creds the device
  // gateway still works (Tuya direct path) and the Source toggle just stays
  // pinned to "Tuya direct".
  if (SupabaseEnv.hasCredentials) {
    await Supabase.initialize(
      url: SupabaseEnv.url,
      anonKey: SupabaseEnv.anonKey,
      authOptions: const FlutterAuthClientOptions(
        autoRefreshToken: true,
      ),
      realtimeClientOptions: const RealtimeClientOptions(
        eventsPerSecond: 10,
      ),
    );
  }

  final log = GrowLogRepository();
  await log.loadFromDisk();
  final calibration = ClimateCalibrationStore();
  await calibration.load();
  final settings = SettingsRepository();
  await settings.load();
  final traffic = TrafficLogger();

  // Single SupabaseRepository shared between the gateway (which auto-pushes
  // device rows after each Tuya refresh) and the rest of the app.
  final supabaseRepo =
      SupabaseEnv.hasCredentials ? SupabaseRepository() : null;
  final gateway = createProductionGateway(
    repository: supabaseRepo,
    settings: settings,
    trafficLogger: traffic,
  );

  runApp(
    GrowControlApp(
      log: log,
      calibration: calibration,
      settings: settings,
      gateway: gateway,
      trafficLogger: traffic,
      supabase: supabaseRepo,
    ),
  );
}
