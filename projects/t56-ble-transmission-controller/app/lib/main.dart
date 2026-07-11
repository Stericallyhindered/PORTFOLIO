import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'grannas_app.dart';
import 'ui/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: GrannasT56App(),
    ),
  );
}

class GrannasT56App extends StatelessWidget {
  const GrannasT56App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grannas T56',
      debugShowCheckedModeBanner: false,
      theme: grannasTheme(),
      home: const GrannasApp(),
    );
  }
}
