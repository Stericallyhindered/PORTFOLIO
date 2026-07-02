import 'package:flutter/material.dart';
import 'dart:math' as math;

class CustomGauge extends StatelessWidget {
  final String label;
  final String value;
  final double min;
  final double max;
  final double? providedValue;
  final List<Color> gaugeColors;
  final Color textColor;
  final Color valueTextColor;

  const CustomGauge({
    Key? key,
    required this.label,
    required this.value,
    this.min = 0,
    this.max = 100,
    this.providedValue,
    this.gaugeColors = const [Color(0xFF8B0000), Color(0xFFE53935)],
    this.textColor = Colors.white,
    this.valueTextColor = Colors.white,
  }) : super(key: key);

  double _parseValue() {
    if (providedValue != null) {
      return providedValue!;
    }
    
    // Extract the numeric part from the value string
    final cleanValue = value.replaceAll(RegExp(r'[^\d.-]'), '');
    return double.tryParse(cleanValue) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentValue = _parseValue();
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // The gauge itself
        SizedBox(
          width: 100,
          height: 100,
          child: CustomPaint(
            painter: GaugePainter(
              min: min,
              max: max,
              value: currentValue,
              gaugeColors: gaugeColors,
              textColor: textColor,
            ),
          ),
        ),
        const SizedBox(height: 5),
        // Label
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        // Digital value display
        Text(
          value.isEmpty ? "--" : value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: valueTextColor,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class GaugePainter extends CustomPainter {
  final double min;
  final double max;
  final double value;
  final List<Color> gaugeColors;
  final Color textColor;

  GaugePainter({
    required this.min,
    required this.max,
    required this.value,
    required this.gaugeColors,
    required this.textColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    final rect = Rect.fromCenter(
      center: center,
      width: size.width,
      height: size.height,
    );

    // Draw the dark background circle
    final backgroundPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, backgroundPaint);

    // Draw gauge background (270 degree arc)
    final gaugeBgPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = radius * 0.2
      ..color = Colors.black87;

    canvas.drawArc(
      rect.deflate(radius * 0.1),
      math.pi * 0.75, // Start from 135 degrees
      math.pi * 1.5, // Sweep 270 degrees
      false,
      gaugeBgPaint,
    );

    // Draw the colored gauge arc
    final sweepAngle = (math.min(value, max) - min) / (max - min) * math.pi * 1.5;
    
    // Only draw the colored arc if the sweep angle is greater than zero
    if (sweepAngle > 0.001) {
      final gaugePaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = radius * 0.2
        ..color = gaugeColors.last;
      
      // For gradients, we need to ensure the angles are valid
      if (gaugeColors.length > 1) {
        gaugePaint.shader = LinearGradient(
          colors: gaugeColors,
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ).createShader(rect);
      }

      canvas.drawArc(
        rect.deflate(radius * 0.1),
        math.pi * 0.75, // Start from 135 degrees
        sweepAngle,
        false,
        gaugePaint,
      );
    }

    // Draw the gauge outline
    final outlinePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white24;
    
    canvas.drawCircle(center, radius, outlinePaint);

    // Draw tick marks
    _drawTicks(canvas, center, radius, rect);

    // Draw the needle/pointer
    _drawNeedle(canvas, center, radius, (value - min) / (max - min));
  }

  void _drawTicks(Canvas canvas, Offset center, double radius, Rect rect) {
    final tickPaint = Paint()
      ..color = textColor
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final textStyle = TextStyle(
      color: textColor,
      fontSize: radius * 0.18,
      fontWeight: FontWeight.bold,
    );

    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    // Draw the ticks and labels at 0%, 25%, 50%, 75%, and 100% positions
    for (int i = 0; i <= 4; i++) {
      // Calculate angle position (135° to 405° or -45°)
      final angle = math.pi * 0.75 + (i / 4) * math.pi * 1.5;
      
      // Calculate tick start and end points
      final outerPoint = Offset(
        center.dx + (radius - radius * 0.1) * math.cos(angle),
        center.dy + (radius - radius * 0.1) * math.sin(angle),
      );
      
      final innerPoint = Offset(
        center.dx + (radius - radius * 0.3) * math.cos(angle),
        center.dy + (radius - radius * 0.3) * math.sin(angle),
      );
      
      // Draw tick mark
      canvas.drawLine(innerPoint, outerPoint, tickPaint);
      
      // Draw tick label
      final value = min + (i / 4) * (max - min);
      final label = value.toInt().toString();
      
      textPainter.text = TextSpan(
        text: label,
        style: textStyle,
      );
      
      textPainter.layout();
      
      // Position the text away from the edge
      final textPoint = Offset(
        center.dx + (radius - radius * 0.45) * math.cos(angle) - textPainter.width / 2,
        center.dy + (radius - radius * 0.45) * math.sin(angle) - textPainter.height / 2,
      );
      
      textPainter.paint(canvas, textPoint);
    }
  }

  void _drawNeedle(Canvas canvas, Offset center, double radius, double percentage) {
    // Calculate angle based on the percentage (0-1)
    final angle = math.pi * 0.75 + percentage * math.pi * 1.5;
    
    // Create needle path
    final needlePath = Path();
    
    // Needle point (on the gauge)
    final needlePoint = Offset(
      center.dx + (radius - radius * 0.2) * math.cos(angle),
      center.dy + (radius - radius * 0.2) * math.sin(angle),
    );
    
    // Back of the needle (slightly past center)
    final needleBack = Offset(
      center.dx - radius * 0.1 * math.cos(angle),
      center.dy - radius * 0.1 * math.sin(angle),
    );
    
    // Side points to create a triangular needle
    final perpendicularAngle = angle + math.pi / 2;
    final sideOffset = radius * 0.04;
    
    final sidePoint1 = Offset(
      needleBack.dx + sideOffset * math.cos(perpendicularAngle),
      needleBack.dy + sideOffset * math.sin(perpendicularAngle),
    );
    
    final sidePoint2 = Offset(
      needleBack.dx - sideOffset * math.cos(perpendicularAngle),
      needleBack.dy - sideOffset * math.sin(perpendicularAngle),
    );
    
    // Draw the needle path
    needlePath.moveTo(needlePoint.dx, needlePoint.dy);
    needlePath.lineTo(sidePoint1.dx, sidePoint1.dy);
    needlePath.lineTo(sidePoint2.dx, sidePoint2.dy);
    needlePath.close();
    
    // Needle paint
    final needlePaint = Paint()
      ..color = const Color(0xFFE53935)
      ..style = PaintingStyle.fill;
    
    canvas.drawPath(needlePath, needlePaint);
    
    // Draw center cap
    final centerCapPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, radius * 0.07, centerCapPaint);
    
    final centerCapBorderPaint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    canvas.drawCircle(center, radius * 0.07, centerCapBorderPaint);
  }

  @override
  bool shouldRepaint(GaugePainter oldDelegate) {
    return oldDelegate.value != value || 
           oldDelegate.min != min || 
           oldDelegate.max != max || 
           oldDelegate.gaugeColors != gaugeColors ||
           oldDelegate.textColor != textColor;
  }
}
