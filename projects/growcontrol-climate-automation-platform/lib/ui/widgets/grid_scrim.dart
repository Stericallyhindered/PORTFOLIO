import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// Dark vignette behind screens — no grid lines (those read as fake graph paper).
class GridScrim extends StatelessWidget {
  const GridScrim({
    super.key,
    this.child,
    this.intensity = 1,
  });

  final Widget? child;
  final double intensity;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              colors: [
                Colors.transparent,
                AppTheme.bgDeep.withOpacity(0.55 * intensity),
              ],
              radius: 1.05,
              center: const Alignment(0, -0.2),
            ),
          ),
        ),
        if (child != null) child!,
      ],
    );
  }
}
