import 'dart:async';
import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart'; 
import 'package:cloud_firestore/cloud_firestore.dart';
import '../auth/login_screen.dart';
import '../entry_screen.dart';
import '../auth/registration_screen.dart';

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
    Timer(const Duration(seconds: 2), () async {
      if (user != null) {
        // Check if user exists in the Mechanics collection
        var mechanicDoc = await FirebaseFirestore.instance
            .collection("Mechanics")
            .doc(user!.uid)
            .get();

        if (mechanicDoc.exists && mechanicDoc['uid'] == user!.uid) {
          // User is authenticated as a mechanic
          Get.offAll(() => EntryScreen(),
              transition: Transition.cupertino,
              duration: const Duration(milliseconds: 900));
          log("User authenticated as a mechanic");
        } else {
          // If the user is not found in Mechanics, go to RegistrationScreen
          Get.offAll(() => RegistrationScreen(),
              transition: Transition.cupertino,
              duration: const Duration(milliseconds: 900));
          log("User needs to register");
        }
      } else {
        // No user is logged in, go to login screen
        Get.offAll(() => const LoginScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
        log("User is null");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xffFFEBF3),
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
            "assets/new_splash_logo.png",
            height: 200.h,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}

