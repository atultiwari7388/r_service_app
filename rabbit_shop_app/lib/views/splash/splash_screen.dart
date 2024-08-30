import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../utils/constants.dart';
import '../auth/login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(Duration(seconds: 3), () {
      Get.offAll(() => LoginScreen(),
          transition: Transition.cupertino,
          duration: const Duration(milliseconds: 900));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kWhite,
      body: Container(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: Image.asset(
                "assets/no-background-logo.png",
                height: 300.h,
                fit: BoxFit.cover,
              ),
            ),
            SizedBox(height: 30.h),
          ],
        ),
      ),
      //
      // body: BackgroundLottieContainer(
      //   child: Image.asset(
      //     "assets/no-background-logo.png",
      //     height: 300.h,
      //     fit: BoxFit.cover,
      //   ),
      //   color: kWhite,
      // ),
    );
  }
}
