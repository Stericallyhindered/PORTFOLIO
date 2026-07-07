import 'package:flutter/material.dart';

import 'screens/phase_one_shell.dart';
import 'services/demo_telemetry_service.dart';
import 'services/telemetry_service.dart';
import 'services/tuning_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TurboLamikPhaseOneApp());
}

class TurboLamikPhaseOneApp extends StatefulWidget {
  const TurboLamikPhaseOneApp({super.key});

  @override
  State<TurboLamikPhaseOneApp> createState() => _TurboLamikPhaseOneAppState();
}

class _TurboLamikPhaseOneAppState extends State<TurboLamikPhaseOneApp> {
  late final TelemetryService _telemetry;
  late final TuningService _tuning;

  @override
  void initState() {
    super.initState();
    _telemetry = DemoTelemetryService()..start();
    _tuning = TuningService();
  }

  @override
  void dispose() {
    _telemetry.shutdown();
    _tuning.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFC95D12),
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: const Color(0xFFF7F3ED),
      cardTheme: const CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(22)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFF7F3ED),
        foregroundColor: Color(0xFF1F1B16),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      chipTheme: const ChipThemeData(
        shape: StadiumBorder(),
        side: BorderSide.none,
      ),
    );

    return MaterialApp(
      title: 'TurboLamik AWD Phase 1',
      debugShowCheckedModeBanner: false,
      theme: theme,
      home: PhaseOneShell(telemetry: _telemetry, tuning: _tuning),
    );
  }
}
