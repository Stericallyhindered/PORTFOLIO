import 'package:flutter/material.dart';

/// Shown when the host platform doesn't support the Tuya App SDK (e.g.
/// `flutter run -d windows` for debugging). The app needs Android or iOS to
/// init the native SDK + run BLE pairing.
class UnsupportedPlatformApp extends StatelessWidget {
  const UnsupportedPlatformApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GrowControl',
      theme: ThemeData.dark(useMaterial3: true),
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: const [
                  Icon(Icons.phone_iphone, size: 56, color: Colors.cyanAccent),
                  SizedBox(height: 16),
                  Text(
                    'GrowControl runs on Android or iOS',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'The Tuya App SDK is mobile-only. Build for android or '
                    'ios — desktop / web builds are not supported.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
