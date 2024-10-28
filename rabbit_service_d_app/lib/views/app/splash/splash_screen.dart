import 'dart:async';
import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/auth/login_screen.dart';
import 'package:regal_service_d_app/entry_screen.dart';
import '../../../utils/show_toast_msg.dart';
import '../onBoard/on_boarding_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // Import Firestore package

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
    Timer(const Duration(seconds: 2), _navigate);
  }

  void _navigate() async {
    if (user != null) {
      // Check if the user's email is verified
      if (!user!.emailVerified) {
        await user!.sendEmailVerification(); // Send verification email
        await FirebaseAuth.instance.signOut(); // Sign the user out
        log("User is not verified, signing out");
        Get.offAll(() => const LoginScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
      } else {
        // Fetch both Mechanics and Users docs in parallel
        var mechanicsDocFuture =
            FirebaseFirestore.instance.doc("Mechanics/${user!.uid}").get();
        var usersDocFuture =
            FirebaseFirestore.instance.doc("Users/${user!.uid}").get();

        var docs = await Future.wait([mechanicsDocFuture, usersDocFuture]);

        var mechanicDoc = docs[0];
        var userDoc = docs[1];

        if (mechanicDoc.exists && mechanicDoc['uid'] == user!.uid) {
          // User exists in Mechanics collection
          showToastMessage(
              "Error",
              "Please try with another email... this email already exists with Mechanic app",
              Colors.red);

          await FirebaseAuth.instance.signOut();
          log("User exists in Mechanics collection, signing out");
          Get.offAll(() => const LoginScreen(),
              transition: Transition.cupertino,
              duration: const Duration(milliseconds: 900));
          return;
        }

        if (userDoc.exists && userDoc['uid'] == user!.uid) {
          // User exists in Users collection
          log("User exists in Users collection, navigating to EntryScreen");
          Get.offAll(() => EntryScreen(),
              transition: Transition.cupertino,
              duration: const Duration(milliseconds: 900));
        } else {
          // If the user does not exist in the Users collection, navigate to Registration
          log("User does not exist in Users collection, navigating to RegistrationScreen");
          Get.offAll(() => const LoginScreen(),
              transition: Transition.cupertino,
              duration: const Duration(milliseconds: 900));
        }
      }
    } else {
      // Navigate based on platform
      if (kIsWeb) {
        Get.offAll(() => const LoginScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
        log("User is null, navigating to LoginScreen");
      } else {
        Get.offAll(() => const OnBoardingScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900));
        log("User is null, navigating to OnBoardingScreen");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kSplashBackground,
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




// import 'dart:async';
// import 'dart:developer';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:flutter/foundation.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/views/auth/login_screen.dart';
// import 'package:regal_service_d_app/views/entry_screen.dart';
// import '../onBoard/on_boarding_screen.dart';

// class SplashScreen extends StatefulWidget {
//   const SplashScreen({super.key});

//   @override
//   State<SplashScreen> createState() => _SplashScreenState();
// }

// class _SplashScreenState extends State<SplashScreen> {
//   final user = FirebaseAuth.instance.currentUser;

//   @override
//   void initState() {
//     super.initState();
//     Timer(const Duration(seconds: 2), () {
//       if (user != null) {
//         Get.offAll(() => EntryScreen(),
//             transition: Transition.cupertino,
//             duration: const Duration(milliseconds: 900));
//         log("User is authenticated");
//       } else {
//         if (kIsWeb) {
//           Get.offAll(() => const LoginScreen(),
//               transition: Transition.cupertino,
//               duration: const Duration(milliseconds: 900));
//           log("User is null");
//         } else {
//           Get.offAll(() => const OnBoardingScreen(),
//               transition: Transition.cupertino,
//               duration: const Duration(milliseconds: 900));
//           log("User is null");
//         }
//       }
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: kSplashBackground,
//       body: Center(
//         child: TweenAnimationBuilder(
//           tween: Tween<double>(begin: 0.0, end: 1.0),
//           duration: Duration(seconds: 2),
//           curve: Curves.easeOutBack,
//           builder: (context, value, child) {
//             return Transform.scale(
//               scale: value,
//               child: child,
//             );
//           },
//           child: Image.asset(
//             "assets/new_splash_logo.png",
//             height: 200.h,
//             fit: BoxFit.cover,
//           ),
//         ),
//       ),
//     );
//   }
// }
