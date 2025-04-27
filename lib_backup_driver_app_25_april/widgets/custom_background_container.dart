import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class CustomBackgroundContainer extends StatelessWidget {
  const CustomBackgroundContainer({
    super.key,
    required this.child,
    required this.horizontalW,
    required this.vertical,
    this.scrollPhysics,
    this.height,
    this.isBackgroundApplied = false,
  });

  final Widget child;
  final double horizontalW;
  final double vertical;
  final ScrollPhysics? scrollPhysics;
  final double? height;
  final bool isBackgroundApplied;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: -100.h,
          left: -100.w,
          child: Container(
            width: 300.w,
            height: 300.h,
            decoration: BoxDecoration(
              color: isBackgroundApplied ? kPrimary.withOpacity(0.3) : null,
              borderRadius: BorderRadius.circular(150),
            ),
          ),
        ),
        Positioned(
          bottom: -100.h,
          right: -100.w,
          child: Container(
            width: 300.w,
            height: 300.h,
            decoration: BoxDecoration(
              color: isBackgroundApplied ? kSecondary.withOpacity(0.3) : null,
              borderRadius: BorderRadius.circular(150),
            ),
          ),
        ),

        // Main content
        SingleChildScrollView(
          physics: scrollPhysics ?? NeverScrollableScrollPhysics(),
          child: Container(
            padding: EdgeInsets.symmetric(
                horizontal: horizontalW.w, vertical: vertical),
            height: height ?? MediaQuery.of(context).size.height,
            width: double.infinity,
            child: child,
          ),
        ),
      ],
    );
  }
}
