import 'dart:async';
import 'package:admin_app/views/auth/login_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
    // Add a delay of 2 seconds
    await Future.delayed(const Duration(seconds: 2));

    // Check if user is already logged in
    User? user = FirebaseAuth.instance.currentUser;

    if (user != null) {
      // Check if user is the predefined admin
      if (user.email == "adminrabbit@gmail.com") {
        _navigateToAdminScreen();
      } else {
        _navigateToDashboardScreen(); // Handle other users here
      }
    } else {
      _navigateToAuthScreen(); // If no user, navigate to login
    }
  }

  void _navigateToAdminScreen() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AdminHomeScreen()),
    );
  }

  void _navigateToDashboardScreen() {
    // Change this to your actual dashboard screen for non-admin users
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
          builder: (_) => const AdminHomeScreen()), // Update this as needed
    );
  }

  void _navigateToAuthScreen() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
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
