import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/database_services.dart';
import '../utils/show_toast_msg.dart';
import '../views/adminContact/admin_contact_screen.dart';
import '../views/auth/login_screen.dart';
import '../views/auth/registration_screen.dart';
import '../views/entry_screen.dart';

class AuthController extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _perHourCharge = TextEditingController();
  final TextEditingController _passController = TextEditingController();
  ScrollController scrollController = ScrollController();
  var isUserSign = false;
  var isUserAcCreated = false;
  var forgotPass = false;

  // List of languages and selected state
  final List<String> languages = [
    'English',
    'Hindi',
    'Punjabi',
    'Spanish',
  ];

  Map<String, bool> selectedLanguages = {};

  FirebaseAuth get auth => _auth;

  GlobalKey<FormState> get formKey => _formKey;

  TextEditingController get nameController => _nameController;

  TextEditingController get emailController => _emailController;

  TextEditingController get addressController => _addressController;

  TextEditingController get phoneNumberController => _phoneNumberController;

  TextEditingController get perHourCharge => _perHourCharge;

  TextEditingController get passController => _passController;

//========================== Create account with email and password =================

  Future<void> createUserWithEmailAndPassword() async {
    isUserAcCreated = true;
    update();
    try {
      var user = await _auth.createUserWithEmailAndPassword(
          email: _emailController.text, password: _passController.text);

      await DatabaseServices(uid: user.user!.uid).savingUserData(
        _emailController.text,
        _nameController.text,
        _phoneNumberController.text,
        _addressController.text,
        int.parse(_perHourCharge.text),
        selectedLanguages,
      );

      // Send email verification
      await user.user!.sendEmailVerification();

      isUserAcCreated = false;
      update();

      // Inform the user to verify their email before logging in
      showToastMessage(
          "Verification Required",
          "A verification email has been sent to your email address. Please verify it before logging in.",
          Colors.orange);

      // Sign out the user immediately after account creation, to prevent unverified access
      await _auth.signOut();

      Get.offAll(() => const LoginScreen()); // Redirect to login screen
    } on FirebaseAuthException catch (e) {
      String errorMessage;
      switch (e.code) {
        case 'email-already-in-use':
          errorMessage = "The email is already in use by another account.";
          showToastMessage("Error", errorMessage, Colors.red);
          break;
        case 'invalid-email':
          errorMessage = "The email address is invalid.";
          showToastMessage("Error", errorMessage, Colors.red);
          break;
        case 'weak-password':
          errorMessage = "The password is too weak.";
          showToastMessage("Error", errorMessage, Colors.red);
          break;
        default:
          errorMessage = e.message ?? "An unknown error occurred.";
          showToastMessage("Error", errorMessage, Colors.red);
      }
    } finally {
      isUserAcCreated = false;
      update();
    }
  }

//========================== SignIn with email and Password ===============================

  // Future<void> signInWithEmailAndPassword() async {
  //   isUserSign = true;
  //   update();
  //   try {
  //     var signInUser = await _auth.signInWithEmailAndPassword(
  //         email: _emailController.text, password: _passController.text);

  //     final User? user = signInUser.user;
  //     if (user != null) {
  //       if (!user.emailVerified) {
  //         // If the email is not verified, prompt the user to verify
  //         showToastMessage("Email Not Verified",
  //             "Please verify your email before logging in.", Colors.orange);

  //         // Send another verification email
  //         await user.sendEmailVerification();

  //         // Optionally sign out the user
  //         await _auth.signOut();

  //         isUserSign = false;
  //         update();
  //         return;
  //       }

  //       // Check if the UID exists in the Mechanics collection
  //       var mechanicDoc = await FirebaseFirestore.instance
  //           .collection("Mechanics")
  //           .doc(user.uid)
  //           .get();

  //       // If the user is not found in the Mechanics collection, check the Users collection
  //       if (!mechanicDoc.exists) {
  //         // Check if the email exists in the Users collection (Customer App)
  //         var userDoc = await FirebaseFirestore.instance
  //             .collection("Users")
  //             .where('email', isEqualTo: _emailController.text)
  //             .get();

  //         // If email exists in Users collection, show error
  //         if (userDoc.docs.isNotEmpty) {
  //           showToastMessage(
  //               "Error",
  //               "This email is already registered with the customer app.",
  //               Colors.red);
  //           await _auth.signOut(); // Sign out the user if email exists in Users
  //           isUserSign = false;
  //           update();
  //           return;
  //         } else {
  //           // Proceed to RegistrationScreen if email is not found in Users
  //           Get.to(() => RegistrationScreen());
  //         }
  //       } else if (mechanicDoc['uid'] == user.uid) {
  //         // If user UID exists in the Mechanics collection, login success
  //         isUserSign = false;
  //         update();
  //         Get.offAll(() => EntryScreen());
  //         showToastMessage("Success", "Login Successful", Colors.green);
  //       }
  //     }
  //   } on FirebaseAuthException catch (e) {
  //     handleAuthError(e);
  //     showToastMessage("Error", e.toString(), Colors.red);
  //   } finally {
  //     isUserSign = false;
  //     update();
  //   }
  // }

  Future<void> signInWithEmailAndPassword() async {
    isUserSign = true;
    update();
    try {
      var signInUser = await _auth.signInWithEmailAndPassword(
          email: _emailController.text, password: _passController.text);

      final User? user = signInUser.user;
      if (user != null) {
        if (!user.emailVerified) {
          // If the email is not verified, prompt the user to verify
          showToastMessage("Email Not Verified",
              "Please verify your email before logging in.", Colors.orange);

          // Send another verification email
          await user.sendEmailVerification();

          // Optionally sign out the user
          await _auth.signOut();

          isUserSign = false;
          update();
          return;
        }

        // Check if the UID exists in the Mechanics collection
        var mechanicDoc = await FirebaseFirestore.instance
            .collection("Mechanics")
            .doc(user.uid)
            .get();

        // If the user is not found in the Mechanics collection, check the Users collection
        if (!mechanicDoc.exists) {
          // Check if the email exists in the Users collection (Customer App)
          var userDoc = await FirebaseFirestore.instance
              .collection("Users")
              .where('email', isEqualTo: _emailController.text)
              .get();

          // If email exists in Users collection, show error
          if (userDoc.docs.isNotEmpty) {
            showToastMessage(
                "Error",
                "This email is already registered with the customer app.",
                Colors.red);
            await _auth.signOut(); // Sign out the user if email exists in Users
            isUserSign = false;
            update();
            return;
          } else {
            // Proceed to RegistrationScreen if email is not found in Users
            Get.to(() => RegistrationScreen());
          }
        } else if (mechanicDoc['uid'] == user.uid) {
          // Check if the mechanic's account is enabled
          if (mechanicDoc['isEnabled'] == true) {
            // If user UID exists and isEnabled is true, login success
            isUserSign = false;
            update();
            Get.offAll(() => EntryScreen());
            showToastMessage("Success", "Login Successful", Colors.green);
          } else {
            // If isEnabled is false, redirect to AdminContactScreen
            isUserSign = false;
            update();
            Get.to(() => AdminContactScreen());
            showToastMessage(
                "Account Deactivated",
                "Your account is deactivated. Please contact admin.",
                Colors.red);
          }
        }
      }
    } on FirebaseAuthException catch (e) {
      handleAuthError(e);
      showToastMessage("Error", e.toString(), Colors.red);
    } finally {
      isUserSign = false;
      update();
    }
  }

//========================== Forgot Password with email =============================
  Future<void> resetPasswordWithEmail() async {
    forgotPass = true;
    update();
    try {
      await _auth.sendPasswordResetEmail(email: _emailController.text);
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

//========================== Logout User ===============================
  Future<void> logout() async {
    try {
      await _auth.signOut();
      Get.offAll(() => const LoginScreen());
    } catch (e) {
      showToastMessage("Error", e.toString(), Colors.red);
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
        showToastMessage("Error", e.message ?? "An error occurred", Colors.red);
    }
  }

  @override
  void onInit() {
    super.onInit();
    // Initialize all languages as unchecked
    for (var language in languages) {
      selectedLanguages[language] = false;
    }
  }

  @override
  void onClose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _phoneNumberController.dispose();
    _passController.dispose();
    super.onClose();
  }
}
