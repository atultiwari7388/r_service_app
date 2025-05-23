import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/database_services.dart';
import 'package:regal_service_d_app/views/app/auth/login_screen.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
import 'package:regal_service_d_app/entry_screen.dart';
import 'package:regal_service_d_app/views/web/web_dashboard_screen.dart';
import '../utils/show_toast_msg.dart';

class AuthController extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _companyNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _passController = TextEditingController();
  final TextEditingController _vehicleRangeController = TextEditingController();

  var isUserSign = false;
  var isUserAcCreated = false;
  var forgotPass = false;

  FirebaseAuth get auth => _auth;

  GlobalKey<FormState> get formKey => _formKey;

  TextEditingController get nameController => _nameController;

  TextEditingController get companyNameController => _companyNameController;

  TextEditingController get vehicleRangeController => _vehicleRangeController;

  TextEditingController get emailController => _emailController;

  TextEditingController get addressController => _addressController;

  TextEditingController get phoneNumberController => _phoneNumberController;

  TextEditingController get passController => _passController;

  final RxString selectedVehicleRange = '1 to 5'.obs;

  final List<String> vehicleRanges = [
    '1 to 5',
    '1 to 10',
    '1 to 20',
    '1 to 30',
    '1 to 50',
    '1 to 100',
    '1 to 200',
    '1 to 500',
    'above 500'
  ];

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
        _companyNameController.text,
        selectedVehicleRange.value,
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

  Future<void> signInWithEmailAndPassword() async {
    isUserSign = true;
    update();
    try {
      var signInUser = await _auth.signInWithEmailAndPassword(
          email: _emailController.text, password: _passController.text);

      final User? user = signInUser.user;
      if (user != null) {
        if (!user.emailVerified) {
          showToastMessage("Email Not Verified",
              "Please verify your email before logging in.", Colors.orange);

          await user.sendEmailVerification();
          await _auth.signOut();
          isUserSign = false;
          update();
          return;
        }

        // Fetch both Mechanics and Users docs in parallel
        var mechanicsDocFuture =
            FirebaseFirestore.instance.doc("Mechanics/${user.uid}").get();
        var usersDocFuture =
            FirebaseFirestore.instance.doc("Users/${user.uid}").get();

        var docs = await Future.wait([mechanicsDocFuture, usersDocFuture]);

        var mechanicDoc = docs[0];
        var userDoc = docs[1];

        if (mechanicDoc.exists && mechanicDoc['uid'] == user.uid) {
          showToastMessage(
              "Error",
              "Please try with another email... this email already exists with Mechanic app",
              Colors.red);

          await _auth.signOut();
          isUserSign = false;
          update();
          return;
        }

        if (userDoc.exists && userDoc['uid'] == user.uid) {
          isUserSign = false;
          update();
          if (kIsWeb) {
            Get.offAll(() => WebDashboardScreen(setTab: () {}));
          } else {
            //navigate to mobile view
            Get.offAll(() => EntryScreen());
          }
          showToastMessage("Success", "Login Successful", Colors.green);
        } else {
          Get.to(() => RegistrationScreen());
        }
      }
    } on FirebaseAuthException catch (e) {
      handleAuthError(e);
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
  void onClose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _phoneNumberController.dispose();
    _passController.dispose();
    super.onClose();
  }
}
