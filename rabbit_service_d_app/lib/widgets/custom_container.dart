import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class CustomContainerBox extends StatelessWidget {
  final double height;
  final double width;
  final Color color;
  final Color borderColor;
  final double borderRadius;
  final double borderWidth;
  final Widget? child;

  const CustomContainerBox({
    super.key,
    this.height = 250,
    this.width = double.infinity,
    required this.color,
    required this.borderColor,
    this.borderRadius = 12,
    this.borderWidth = 2.0,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height.h,
      width: width,
      decoration: BoxDecoration(
        color: color,
        border: Border.all(
          color: borderColor,
          width: borderWidth,
        ),
        borderRadius: BorderRadius.circular(borderRadius.r),
      ),
      child: child,
    );
  }
}
