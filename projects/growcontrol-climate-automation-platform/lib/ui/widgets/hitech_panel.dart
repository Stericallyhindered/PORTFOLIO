import 'dart:ui';

import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class HiTechPanel extends StatelessWidget {
  const HiTechPanel({
    super.key,
    required this.child,
    this.accent = AppTheme.neonCyan,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final Color accent;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: accent.withOpacity(0.22)),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.surfaceElevated.withOpacity(0.72),
                AppTheme.surface.withOpacity(0.48),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: accent.withOpacity(0.06),
                blurRadius: 24,
                spreadRadius: 0,
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
