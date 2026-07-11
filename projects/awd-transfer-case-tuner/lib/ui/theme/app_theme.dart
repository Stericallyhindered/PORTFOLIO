import 'package:flutter/material.dart';

ThemeData awdDarkTheme() {
  const seed = Color(0xFF0A1628);
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF1E7F5C),
      brightness: Brightness.dark,
      surface: seed,
    ),
    scaffoldBackgroundColor: const Color(0xFF0A0F18),
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: Color(0xFF121A28),
      selectedIconTheme: IconThemeData(color: Color(0xFF3DDC9A)),
      selectedLabelTextStyle: TextStyle(color: Color(0xFF3DDC9A)),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF121A28),
      foregroundColor: Color(0xFFE8F0FF),
    ),
  );
}
