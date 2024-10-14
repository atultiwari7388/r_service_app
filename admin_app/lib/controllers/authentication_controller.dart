import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/collection_references.dart';
import '../utils/show_toast_msg.dart';
import '../views/adminHome/admin_home_screen.dart';

class AuthenticationController extends GetxController {
  bool isLoading = false;
  var forgotPass = false;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

//======================= Sign in With Email and Pass ==================================

  Future<void> loginWithEmailAndPassword() async {
    isLoading = true;
    update();
    try {
      final data = await auth
          .signInWithEmailAndPassword(
              email: emailController.text.toString(),
              password: passwordController.text.toString())
          .then((value) {
        final ifUserExists = FirebaseFirestore.instance
            .collection("admin")
            .doc(auth.currentUser!.uid)
            .get()
            .then((DocumentSnapshot snapshot) {
          if (snapshot.exists) {
            Get.off(() => const AdminHomeScreen(),
                transition: Transition.leftToRightWithFade,
                duration: const Duration(seconds: 2));

            log("Login Successfully");
            showToastMessage("Success", "Login Successfully", Colors.green);
            isLoading = false;
            update();
          } else {
            if (auth.currentUser!.email == "adminrabbit@gmail.com") {
              log("Welcome  Admin");
              if (kIsWeb) {
                Get.off(() => const AdminHomeScreen(),
                    transition: Transition.leftToRightWithFade,
                    duration: const Duration(seconds: 2));
              }
              showToastMessage("Success", "Welcome Admin", Colors.green);
              isLoading = false;
              update();
            } else {
              showToastMessage("Error", "Something went wrong", Colors.red);

              isLoading = false;
              update();
            }
          }
        }).onError((error, stackTrace) {
          showToastMessage("Error", error.toString(), Colors.red);
          log(error.toString());
          isLoading = false;
          update();
        });
      }).onError((error, stackTrace) {
        log(error.toString());

        showToastMessage("Error", error.toString(), Colors.red);
        isLoading = false;
        update();
      });
    } catch (e) {
      log(e.toString());
      showToastMessage("Error", e.toString(), Colors.red);
      log(e.toString());

      isLoading = false;
      update();
    }
  }

  // Future<void> loginWithEmailAndPassword() async {
  //   isLoading = true;
  //   update();

  //   try {
  //     final userCredential = await auth.signInWithEmailAndPassword(
  //       email: emailController.text.trim(),
  //       password: passwordController.text.trim(),
  //     );

  //     final DocumentSnapshot snapshot = await FirebaseFirestore.instance
  //         .collection("admin")
  //         .doc(userCredential.user!.uid)
  //         .get();

  //     if (snapshot.exists) {
  //       // User exists, navigate to Admin Home
  //       Get.off(() => const AdminHomeScreen(),
  //           transition: Transition.leftToRightWithFade,
  //           duration: const Duration(seconds: 2));
  //       log("Login Successfully");
  //       showToastMessage("Success", "Login Successfully", Colors.green);
  //     } else {
  //       // Handle non-admin users or user not found
  //       showToastMessage("Error", "User not authorized", Colors.red);
  //     }
  //   } on FirebaseAuthException catch (authError) {
  //     log(authError.message ?? "Authentication error");
  //     showToastMessage(
  //         "Error", authError.message ?? "Authentication error", Colors.red);
  //   } catch (e) {
  //     log(e.toString());
  //     showToastMessage("Error", e.toString(), Colors.red);
  //   } finally {
  //     isLoading = false;
  //     update();
  //   }
  // }

  Future<void> resetPasswordWithEmail() async {
    forgotPass = true;
    update();
    try {
      await auth.sendPasswordResetEmail(email: emailController.text);
      showToastMessage(
          "Success", "Password reset email sent successfully", Colors.green);
    } on FirebaseAuthException catch (e) {
      forgotPass = false;
      update();
      handleAuthError(e);
    } finally {
      forgotPass = false;
      update();
    }
  }

  //========================== Handle FirebaseAuthException ==========================
  void handleAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        showToastMessage(
            "Error", "The email address is not valid.", Colors.red);
        break;
      case 'user-not-found':
        showToastMessage("Error", "No user found for that email.", Colors.red);
        break;
      case 'wrong-password':
        showToastMessage("Error", "Wrong password provided.", Colors.red);
        break;
      default:
        showToastMessage("Error",
            "Invalid email or password , create new account", Colors.red);
    }
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
    emailController.dispose();
    passwordController.dispose();
  }
}
