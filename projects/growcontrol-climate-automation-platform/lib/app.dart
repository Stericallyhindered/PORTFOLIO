import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/supabase_env.dart';
import 'services/climate_calibration_store.dart';
import 'services/device_gateway.dart';
import 'services/grow_log_repository.dart';
import 'services/session_auth_relauncher.dart';
import 'services/settings_repository.dart';
import 'services/supabase_log_sink.dart';
import 'services/supabase_repository.dart';
import 'services/traffic_logger.dart';
import 'state/grow_room_controller.dart';
import 'theme/app_theme.dart';
import 'ui/screens/session_gate.dart';

class GrowControlApp extends StatefulWidget {
  const GrowControlApp({
    super.key,
    required this.log,
    required this.calibration,
    required this.settings,
    required this.gateway,
    required this.trafficLogger,
    this.supabase,
  });

  final GrowLogRepository log;
  final ClimateCalibrationStore calibration;
  final SettingsRepository settings;
  final DeviceGateway gateway;
  final TrafficLogger trafficLogger;
  final SupabaseRepository? supabase;

  @override
  State<GrowControlApp> createState() => _GrowControlAppState();
}

class _GrowControlAppState extends State<GrowControlApp> {
  SupabaseRepository? _supabaseRepo;
  SupabaseLogSink? _activeSink;

  @override
  void initState() {
    super.initState();
    // Prefer the repository wired in main.dart so the gateway and the app
    // share the same client; fall back to constructing one locally if Supabase
    // creds came online after startup.
    _supabaseRepo = widget.supabase ??
        (SupabaseEnv.hasCredentials ? SupabaseRepository() : null);
    widget.settings.addListener(_onSettingsChanged);
    _onSettingsChanged();
  }

  @override
  void dispose() {
    widget.settings.removeListener(_onSettingsChanged);
    _detachSink();
    super.dispose();
  }

  /// Reattach (or detach) the Supabase log sink whenever the active hub id
  /// changes. The sink itself is cheap; we just rebuild it pointed at the
  /// new hub so RLS authorises the inserts. No-op when Supabase isn't
  /// configured.
  void _onSettingsChanged() {
    if (_supabaseRepo == null) return;
    final hubId = widget.settings.activeHubId;
    if (hubId == null) {
      _detachSink();
      return;
    }
    if (_activeSink?.hubId == hubId) return;
    _detachSink();
    final sink = SupabaseLogSink(
      hubId: hubId,
      traffic: widget.trafficLogger,
    );
    widget.log.addObserver(sink);
    _activeSink = sink;
  }

  void _detachSink() {
    final sink = _activeSink;
    if (sink == null) return;
    widget.log.removeObserver(sink);
    _activeSink = null;
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionAuthRelauncher>(
          create: (_) => SessionAuthRelauncher(),
        ),
        ChangeNotifierProvider<ClimateCalibrationStore>.value(
          value: widget.calibration,
        ),
        ChangeNotifierProvider<SettingsRepository>.value(
          value: widget.settings,
        ),
        Provider<TrafficLogger>.value(value: widget.trafficLogger),
        if (_supabaseRepo != null)
          Provider<SupabaseRepository>.value(value: _supabaseRepo!),
      ],
      child: ChangeNotifierProvider(
        create: (ctx) => GrowRoomController(
          log: widget.log,
          calibration: widget.calibration,
          gateway: widget.gateway,
          settings: ctx.read<SettingsRepository>(),
          trafficLogger: widget.trafficLogger,
          supabase: _supabaseRepo,
        ),
        child: MaterialApp(
          title: 'Growmie Smart Controller',
          theme: AppTheme.dark(),
          home: const SessionGate(),
          debugShowCheckedModeBanner: false,
        ),
      ),
    );
  }
}
