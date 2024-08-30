import 'package:flutter/material.dart';

class DashedDivider extends StatelessWidget {
  final double height;
  final Color color;
  final double dashWidth;
  final double dashSpace;

  const DashedDivider({
    Key? key,
    this.height = 1.0,
    this.color = Colors.black,
    this.dashWidth = 5.0,
    this.dashSpace = 3.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      // Wrap with Container
      height: height,
      child: CustomPaint(
        size: Size.infinite,
        painter: _DashedDividerPainter(color, dashWidth, dashSpace),
      ),
    );
  }
}

class _DashedDividerPainter extends CustomPainter {
  final Color color;
  final double dashWidth;
  final double dashSpace;

  _DashedDividerPainter(this.color, this.dashWidth, this.dashSpace);

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final double startX = 0.0;
    final double endX = size.width;
    double currentX = startX;

    while (currentX < endX) {
      canvas.drawLine(
        Offset(currentX, 0.0),
        Offset(currentX + dashWidth, 0.0),
        paint,
      );
      currentX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(_DashedDividerPainter oldDelegate) {
    return color != oldDelegate.color ||
        dashWidth != oldDelegate.dashWidth ||
        dashSpace != oldDelegate.dashSpace;
  }
}
