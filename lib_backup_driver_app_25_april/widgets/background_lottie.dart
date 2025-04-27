import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lottie/lottie.dart';
import '../utils/constants.dart';

class BackgroundLottieContainer extends StatelessWidget {
  const BackgroundLottieContainer(
      {super.key, required this.child, required this.color});

  final Widget child;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(0.r),
          topRight: Radius.circular(0.r),
        ),
      ),
      child: Stack(
        children: [
          Lottie.asset(
            'assets/repair_animation_1.json', // Path to your Lottie file
            fit: BoxFit.contain,

            height: height,
            width: width,
            alignment: Alignment.center,
            repeat: true,
          ),
          child,
        ],
      ),
    );
  }
}
