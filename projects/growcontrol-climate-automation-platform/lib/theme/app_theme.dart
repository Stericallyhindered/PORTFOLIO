import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Cannabis cultivar aesthetic: deep canopy shadows, leaf-green primary,
/// trichome gold + indica purple accents, sage muted text.
///
/// Constant names are legacy ("neonCyan" / "neonPink" / "neonYellow") — the
/// values were rebranded but the symbol names stayed so screens didn't all
/// have to change at once. Map of intent:
///   neonCyan   → leafGreen (primary signal)
///   neonPink   → kiefGold  (secondary highlight, was magenta)
///   neonYellow → pollen    (tertiary accent, was electric yellow)
///   neonPurple → indica    (cool purple, kept similar)
///   alertOrange→ autumnLeaf (warnings)
///   mutedText  → sage
class AppTheme {
  static const Color bgDeep = Color(0xFF050B07);          // soil / canopy shadow
  static const Color bgMid = Color(0xFF0E1A12);           // forest floor
  static const Color surface = Color(0xFF132619);          // deep moss panel
  static const Color surfaceElevated = Color(0xFF1B3724);  // raised moss panel
  static const Color neonPink = Color(0xFFD8AE52);         // kief / trichome gold
  static const Color neonYellow = Color(0xFFD9E36B);       // pollen / pistil yellow-green
  static const Color neonCyan = Color(0xFF6FE05A);         // bright cannabis leaf
  static const Color neonPurple = Color(0xFF8E5AE0);       // indica purple
  static const Color alertOrange = Color(0xFFE08A40);      // autumn leaf warning
  static const Color mutedText = Color(0xFF7B8C7B);        // sage muted text

  static TextStyle fontDisplay(double size, {FontWeight? w}) =>
      GoogleFonts.orbitron(fontSize: size, fontWeight: w ?? FontWeight.w600);

  static TextStyle fontMono(double size, {FontWeight? w, Color? color}) =>
      GoogleFonts.shareTechMono(
        fontSize: size,
        fontWeight: w ?? FontWeight.w400,
        color: color,
      );

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
    );
    final scheme = ColorScheme.dark(
      surface: surface,
      primary: neonCyan,
      secondary: neonPink,
      tertiary: neonYellow,
      onSurface: Colors.white,
      outline: mutedText.withOpacity(0.35),
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: bgDeep,
      textTheme: TextTheme(
        displaySmall: fontDisplay(24),
        titleLarge: fontDisplay(20, w: FontWeight.w500),
        titleMedium: fontDisplay(16, w: FontWeight.w500),
        bodyLarge: GoogleFonts.inter(color: Colors.white, fontSize: 15),
        bodyMedium: GoogleFonts.inter(color: mutedText, fontSize: 13),
        labelSmall: fontMono(11, color: mutedText),
      ),
      cardTheme: CardThemeData(
        color: surfaceElevated.withOpacity(0.88),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: neonCyan.withOpacity(0.12)),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: fontDisplay(18, w: FontWeight.w600).copyWith(
          letterSpacing: 1.2,
        ),
        iconTheme: const IconThemeData(color: neonCyan),
      ),
      dividerTheme: DividerThemeData(color: mutedText.withOpacity(0.12)),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface.withOpacity(0.75),
        indicatorColor: neonCyan.withOpacity(0.2),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.all(
          fontMono(10, color: mutedText),
        ),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final sel = states.contains(WidgetState.selected);
          return IconThemeData(
            color: sel ? neonCyan : mutedText,
            size: 22,
          );
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceElevated,
        selectedColor: neonCyan.withOpacity(0.22),
        labelStyle: fontMono(11),
        secondaryLabelStyle: fontMono(11),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: neonCyan.withOpacity(0.15)),
        ),
      ),
    );
  }
}
