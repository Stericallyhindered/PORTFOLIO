import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class GrannasColors {
  static const background = Color(0xFF0B0B0B);
  static const surface = Color(0xFF141414);
  static const surfaceHigh = Color(0xFF1C1C1C);
  static const accent = Color(0xFFFF5A00);
  static const accentAlt = Color(0xFFFFB000);
  static const textPrimary = Color(0xFFF5F5F5);
  static const textMuted = Color(0xFF9A9A9A);
  static const danger = Color(0xFFFF3333);
  static const stripe = Color(0x22FF5A00);
}

ThemeData grannasTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: GrannasColors.background,
    colorScheme: const ColorScheme.dark(
      primary: GrannasColors.accent,
      secondary: GrannasColors.accentAlt,
      surface: GrannasColors.surface,
      onPrimary: Colors.black,
      onSurface: GrannasColors.textPrimary,
    ),
  );

  return base.copyWith(
    textTheme: TextTheme(
      displayLarge: GoogleFonts.rajdhani(
        fontSize: 56,
        fontWeight: FontWeight.w700,
        color: GrannasColors.textPrimary,
        letterSpacing: 2,
      ),
      headlineMedium: GoogleFonts.rajdhani(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: GrannasColors.textPrimary,
        letterSpacing: 1.2,
      ),
      titleLarge: GoogleFonts.rajdhani(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: GrannasColors.accent,
      ),
      bodyLarge: GoogleFonts.inter(color: GrannasColors.textPrimary),
      bodyMedium: GoogleFonts.inter(color: GrannasColors.textMuted, fontSize: 14),
      labelLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        letterSpacing: 1.5,
        color: GrannasColors.textPrimary,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: GrannasColors.background,
      foregroundColor: GrannasColors.textPrimary,
      elevation: 0,
      titleTextStyle: GoogleFonts.rajdhani(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: GrannasColors.accent,
        letterSpacing: 1.5,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: GrannasColors.surface,
      indicatorColor: GrannasColors.accent.withValues(alpha: 0.2),
      labelTextStyle: WidgetStateProperty.all(
        GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
      ),
    ),
    cardTheme: CardTheme(
      color: GrannasColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: const BorderSide(color: GrannasColors.accent, width: 1),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: GrannasColors.surfaceHigh,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: BorderSide(color: GrannasColors.accent.withValues(alpha: 0.4)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: BorderSide(color: GrannasColors.textMuted.withValues(alpha: 0.3)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: GrannasColors.accent, width: 1.5),
      ),
      labelStyle: GoogleFonts.inter(color: GrannasColors.textMuted, fontSize: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: GrannasColors.accent,
        foregroundColor: Colors.black,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, letterSpacing: 1),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: GrannasColors.accent,
        side: const BorderSide(color: GrannasColors.accent),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
    ),
  );
}

Widget stripeHeader({required Widget child}) {
  return Container(
    width: double.infinity,
    decoration: BoxDecoration(
      color: GrannasColors.surface,
      border: const Border(
        left: BorderSide(color: GrannasColors.accent, width: 3),
        bottom: BorderSide(color: GrannasColors.accent, width: 1),
      ),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          GrannasColors.stripe,
          Colors.transparent,
        ],
      ),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: child,
  );
}

Widget grannasCard({required Widget child, EdgeInsets? padding}) {
  return Container(
    width: double.infinity,
    padding: padding ?? const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: GrannasColors.surface,
      borderRadius: BorderRadius.circular(4),
      border: Border.all(color: GrannasColors.accent.withValues(alpha: 0.6)),
    ),
    child: child,
  );
}
