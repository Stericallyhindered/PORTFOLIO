import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'awd_app.dart';
import 'ui/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ProviderScope(
      child: MaterialApp(
        title: 'AWD Tuner',
        theme: awdDarkTheme(),
        home: const AwdApp(),
      ),
    ),
  );
}
