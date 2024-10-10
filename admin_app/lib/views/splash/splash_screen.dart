import 'dart:async';
import 'package:admin_app/views/auth/login_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../utils/constants.dart';
import '../adminHome/admin_home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  void _initializeApp() async {
    // Add a delay of 5 seconds
    await Future.delayed(const Duration(seconds: 2));

    // Check if user is already logged in
    User? user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      if (user.email == "adminmylex@gmail.com") {
        _navigateToAdminScreen();
      } else {
        _navigateToDashboardScreen();
      }
    } else {
      _navigateToAuthScreen();
    }
  }

  void _navigateToAdminScreen() {
    if (kIsWeb) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AdminHomeScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AdminHomeScreen()),
      );
    }
  }

  void _navigateToDashboardScreen() {
    if (kIsWeb) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AdminHomeScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AdminHomeScreen()),
      );
    }
  }

  void _navigateToAuthScreen() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
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
            "assets/new_splash_logo.png",
            height: 300.h,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}
