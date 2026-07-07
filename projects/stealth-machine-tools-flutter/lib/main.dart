import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme/smt_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/ai_service.dart';
import 'core/services/speech_service.dart';
import 'core/services/support_materials_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Initialize core services
    try {
      await AIService.initialize();
      print('AI service initialized');
    } catch (e) {
      print('AI service initialization failed: $e');
    }
    
    try {
      await SpeechService.initialize();
      print('Speech service initialized');
    } catch (e) {
      print('Speech service initialization failed: $e');
    }
    
    try {
      await SupportMaterialsService(baseUrl: 'https://support.stealthmachinetools.com');
      print('Support materials service initialized');
    } catch (e) {
      print('Support materials service initialization failed: $e');
    }
    
    // Note: AI service now uses backend API - no direct Anthropic initialization needed
    print('AI chat service will use backend API');
    
    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: SMTTheme.primaryWhite,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );
    
    runApp(
      const ProviderScope(
        child: StealthMachineToolsApp(),
      ),
    );
  } catch (e) {
    print('Initialization error: $e');
    // Fallback - run app anyway
    runApp(
      const ProviderScope(
        child: StealthMachineToolsApp(),
      ),
    );
  }
}

class StealthMachineToolsApp extends ConsumerWidget {
  const StealthMachineToolsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    
    return MaterialApp.router(
      title: 'Stealth Machine Tools',
      debugShowCheckedModeBanner: false,
      theme: SMTTheme.lightTheme,
      darkTheme: SMTTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(1.0),
          ),
          child: child!,
        );
      },
    );
  }
}