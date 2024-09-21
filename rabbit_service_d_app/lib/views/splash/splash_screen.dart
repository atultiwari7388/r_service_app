import 'dart:async';
import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/auth/login_screen.dart';
import 'package:regal_service_d_app/views/entry_screen.dart';
import 'package:regal_service_d_app/widgets/background_lottie.dart';

import '../onBoard/on_boarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final user = FirebaseAuth.instance.currentUser;

  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 2), () {
      if (user != null) {
        Get.offAll(() => EntryScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
        log("User is authenticated");
      } else {
        Get.offAll(() => const OnBoardingScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
        log("User is null");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kWhite,
      body: Center(
        child: TweenAnimationBuilder(
          tween: Tween<double>(begin: 0.0, end: 1.0),
          duration: Duration(seconds: 2),
          curve: Curves.easeOutBack,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: child,
            );
          },
          child: Image.asset(
            "assets/no-background-logo.png",
            height: 300.h,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
    // return Scaffold(
    //   backgroundColor: kWhite,
    //   body: Container(
    //     child: Column(
    //       mainAxisAlignment: MainAxisAlignment.center,
    //       children: [
    //         Center(
    //           child: Image.asset(
    //             "assets/no-background-logo.png",
    //             height: 300.h,
    //             fit: BoxFit.cover,
    //           ),
    //         ),
    //         SizedBox(height: 30.h),
    //       ],
    //     ),
    //   ),
    //
    // body: BackgroundLottieContainer(
    //   child: Image.asset(
    //     "assets/no-background-logo.png",
    //     height: 300.h,
    //     fit: BoxFit.cover,
    //   ),
    //   color: kWhite,
    // ),
    // );
  }
}
