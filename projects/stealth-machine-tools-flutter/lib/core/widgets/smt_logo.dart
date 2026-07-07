import 'package:flutter/material.dart';

class SMTLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final Color? color;
  final BoxFit fit;

  const SMTLogo({
    super.key,
    this.width,
    this.height,
    this.color,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/logo.PNG',
      width: width,
      height: height,
      fit: fit,
      color: color,
      errorBuilder: (context, error, stackTrace) {
        // Fallback if logo is not found
        return Container(
          width: width ?? 120,
          height: height ?? 40,
          decoration: BoxDecoration(
            color: Colors.red,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Center(
            child: Text(
              'SMT',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      },
    );
  }
}

class SMTLogoWithText extends StatelessWidget {
  final double? logoSize;
  final double? textSize;
  final bool showTagline;
  final Color? textColor;
  final MainAxisAlignment alignment;

  const SMTLogoWithText({
    super.key,
    this.logoSize,
    this.textSize,
    this.showTagline = true,
    this.textColor,
    this.alignment = MainAxisAlignment.center,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: alignment,
      children: [
        SMTLogo(
          width: logoSize ?? 120,
          height: logoSize ?? 40,
        ),
        const SizedBox(height: 8),
        Text(
          'STEALTH MACHINE TOOLS',
          style: TextStyle(
            fontSize: textSize ?? 16,
            fontWeight: FontWeight.bold,
            color: textColor ?? Colors.black87,
            letterSpacing: 1.2,
          ),
        ),
        if (showTagline) ...[
          const SizedBox(height: 4),
          Text(
            'Advanced CNC Machine Solutions',
            style: TextStyle(
              fontSize: (textSize ?? 16) - 4,
              color: textColor?.withOpacity(0.7) ?? Colors.grey[600],
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ],
    );
  }
}

class SMTAppBarLogo extends StatelessWidget {
  final double? height;
  final EdgeInsets? padding;

  const SMTAppBarLogo({
    super.key,
    this.height,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(vertical: 8),
      child: SMTLogo(
        height: height ?? 32,
      ),
    );
  }
}

class SMTLogoCircular extends StatelessWidget {
  final double size;
  final Color? backgroundColor;
  final EdgeInsets? padding;

  const SMTLogoCircular({
    super.key,
    this.size = 80,
    this.backgroundColor,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: padding ?? const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.red,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SMTLogo(
        fit: BoxFit.contain,
      ),
    );
  }
}
