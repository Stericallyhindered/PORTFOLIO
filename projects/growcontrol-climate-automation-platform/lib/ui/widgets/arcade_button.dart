import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// Chunky retro arcade-style push button used by the Manual tab.
///
/// * Bright neon "cap" with a tiny status pip when [isOn] is true.
/// * Drops into the recessed base on press / when held in the "on" state.
/// * Greyed out + non-interactive when [enabled] is false (offline / unknown).
class ArcadeButton extends StatefulWidget {
  const ArcadeButton({
    super.key,
    required this.isOn,
    required this.onTap,
    this.diameter = 132,
    this.color = AppTheme.neonYellow,
    this.label,
    this.enabled = true,
    this.busy = false,
  });

  final bool isOn;
  final VoidCallback onTap;
  final double diameter;
  final Color color;

  /// Optional short label inside the button face (e.g. "ON" / "OFF" or "PUMP").
  final String? label;
  final bool enabled;
  final bool busy;

  @override
  State<ArcadeButton> createState() => _ArcadeButtonState();
}

class _ArcadeButtonState extends State<ArcadeButton>
    with SingleTickerProviderStateMixin {
  bool _holding = false;

  @override
  Widget build(BuildContext context) {
    final pressed = widget.isOn || _holding;
    final enabled = widget.enabled && !widget.busy;
    final accent = enabled ? widget.color : AppTheme.mutedText;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _holding = true) : null,
      onTapCancel: enabled ? () => setState(() => _holding = false) : null,
      onTapUp: enabled ? (_) => setState(() => _holding = false) : null,
      onTap: enabled ? widget.onTap : null,
      child: SizedBox(
        width: widget.diameter,
        height: widget.diameter,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 90),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF080B19),
            border: Border.all(
              color: accent.withOpacity(enabled ? 0.55 : 0.18),
              width: 2,
            ),
            boxShadow: [
              if (enabled && widget.isOn)
                BoxShadow(
                  color: accent.withOpacity(0.55),
                  blurRadius: 28,
                  spreadRadius: 2,
                ),
              const BoxShadow(
                color: Color(0xCC000000),
                blurRadius: 6,
                offset: Offset(0, 6),
              ),
            ],
          ),
          padding: EdgeInsets.all(pressed ? 12 : 8),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 90),
            curve: Curves.easeOut,
            transform: Matrix4.translationValues(0, pressed ? 4 : 0, 0),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                center: const Alignment(-0.3, -0.4),
                radius: 1.05,
                colors: enabled && widget.isOn
                    ? [
                        Color.lerp(accent, Colors.white, 0.55)!,
                        accent,
                        Color.lerp(accent, Colors.black, 0.45)!,
                      ]
                    : [
                        const Color(0xFF222B44),
                        const Color(0xFF131A2D),
                        const Color(0xFF080B17),
                      ],
                stops: const [0.0, 0.55, 1.0],
              ),
              boxShadow: [
                if (!pressed)
                  BoxShadow(
                    color: enabled
                        ? Colors.black.withOpacity(0.65)
                        : Colors.black.withOpacity(0.4),
                    blurRadius: 0,
                    offset: const Offset(0, 6),
                  ),
              ],
              border: Border.all(
                color: Colors.black.withOpacity(0.55),
                width: 1,
              ),
            ),
            alignment: Alignment.center,
            child: widget.busy
                ? SizedBox(
                    width: widget.diameter * 0.32,
                    height: widget.diameter * 0.32,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        enabled ? Colors.white : AppTheme.mutedText,
                      ),
                    ),
                  )
                : _buildFace(enabled, accent),
          ),
        ),
      ),
    );
  }

  Widget _buildFace(bool enabled, Color accent) {
    final label = widget.label;
    if (label != null && label.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: AppTheme.fontDisplay(widget.diameter * 0.16).copyWith(
            color: enabled
                ? (widget.isOn ? Colors.black : Colors.white.withOpacity(0.85))
                : AppTheme.mutedText,
            letterSpacing: 2.2,
            shadows: enabled && widget.isOn
                ? [
                    Shadow(
                      blurRadius: 10,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ]
                : null,
          ),
        ),
      );
    }
    return Icon(
      widget.isOn ? Icons.power_settings_new : Icons.power_settings_new_outlined,
      size: widget.diameter * 0.34,
      color: enabled
          ? (widget.isOn ? Colors.black : Colors.white.withOpacity(0.7))
          : AppTheme.mutedText,
    );
  }
}
