import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/database_services.dart';
import '../services/push_notification.dart';
import '../utils/show_toast_msg.dart';
import '../views/adminContact/admin_contact_screen.dart';
import '../views/auth/login_screen.dart';
import '../views/auth/registration_screen.dart';
import '../views/entry_screen.dart';

class AuthController extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _workshopNameController = TextEditingController();
  final TextEditingController _cellPhoneController = TextEditingController();
  final TextEditingController _telephoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
  final TextEditingController _postalCodeController = TextEditingController();
  final TextEditingController _dateOfBirthController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _perHourCharge = TextEditingController();
  final TextEditingController _passController = TextEditingController();

  ScrollController scrollController = ScrollController();
  var isUserSign = false;
  var isUserAcCreated = false;
  var forgotPass = false;

  // List of languages and selected state
  List<String> languages = [
    'English',
    'Hindi',
    'Punjabi',
    'Spanish',
  ];

  Map<String, bool> selectedLanguages = {};

  FirebaseAuth get auth => _auth;

  GlobalKey<FormState> get formKey => _formKey;

  TextEditingController get nameController => _nameController;
  TextEditingController get workshopNameController => _workshopNameController;
  TextEditingController get cellPhoneController => _cellPhoneController;
  TextEditingController get telephoneController => _telephoneController;
  TextEditingController get emailController => _emailController;
  TextEditingController get addressController => _addressController;
  TextEditingController get cityController => _cityController;
  TextEditingController get stateController => _stateController;
  TextEditingController get countryController => _countryController;
  TextEditingController get postalCodeController => _postalCodeController;
  TextEditingController get dateOfBirthController => _dateOfBirthController;
  TextEditingController get experienceController => _experienceController;
  TextEditingController get descriptionController => _descriptionController;
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
        _workshopNameController.text,
        _cellPhoneController.text,
        _telephoneController.text,
        _addressController.text,
        _cityController.text,
        _stateController.text,
        _countryController.text,
        _postalCodeController.text,
        _dateOfBirthController.text,
        _experienceController.text,
        _descriptionController.text,
        0, // Per hour charge default to 0
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

      // Clear all controllers after successful registration
      clearAllControllers();

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

  Future<void> signInWithEmailAndPassword(
    TextEditingController emailController,
    TextEditingController passwordController,
  ) async {
    isUserSign = true;
    update();
    try {
      var signInUser = await _auth.signInWithEmailAndPassword(
        email: emailController.text,
        password: passwordController.text,
      );

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
              .where('email', isEqualTo: emailController.text)
              .get();

          // If email exists in Users collection, show error
          if (userDoc.docs.isNotEmpty) {
            showToastMessage(
                "Error",
                "This email is already registered with the customer app.",
                Colors.red);
            await _auth.signOut();
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
            final data = mechanicDoc.data();
            final String storedFcmToken = (data?['fcmToken'] ?? '').toString();
            final bool isMultiDeEnable = data?['isMultiDeEnable'] == true;

            // Restrict login if already logged in on another device (fcmToken exists, not null/empty and differs) and multi-device access is disabled
            if (storedFcmToken.trim().isNotEmpty &&
                storedFcmToken != 'null' &&
                !isMultiDeEnable) {
              final currentToken = await PushNotification.getDeviceToken();
              if (currentToken != null && storedFcmToken != currentToken) {
                await _auth.signOut();
                isUserSign = false;
                update();
                showToastMessage(
                  "Access Restricted",
                  "You are not enabled for multiple device login. Please log out from your active device or contact admin.",
                  Colors.red,
                );
                return;
              }
            }

            // If user UID exists, isEnabled is true, and passes multi-device check:
            final String? token = await PushNotification.getDeviceToken();
            if (token != null && token.isNotEmpty) {
              await FirebaseFirestore.instance
                  .collection('Mechanics')
                  .doc(user.uid)
                  .update({
                'fcmToken': token,
                'active': true,
              });
            }

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
      // showToastMessage("Error", e.toString(), Colors.red);
      log(e.toString());
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

//========================== Clear All Controllers ==========================
  void clearAllControllers() {
    _nameController.clear();
    _workshopNameController.clear();
    _cellPhoneController.clear();
    _telephoneController.clear();
    _emailController.clear();
    _addressController.clear();
    _cityController.clear();
    _stateController.clear();
    _countryController.clear();
    _postalCodeController.clear();
    _dateOfBirthController.clear();
    _experienceController.clear();
    _descriptionController.clear();
    _perHourCharge.clear();
    _passController.clear();

    // Reset language selections
    for (var language in languages) {
      selectedLanguages[language] = false;
    }
  }

//========================== Handle FirebaseAuthException ==========================
  void handleAuthError(FirebaseAuthException e) {
    log("FirebaseAuthException code: ${e.code}, message: ${e.message}");
    final code = e.code.toLowerCase();
    switch (code) {
      case 'invalid-credential':
      case 'invalid_login_credentials':
      case 'wrong-password':
      case 'user-not-found':
        showToastMessage("Error", "Email or Password is incorrect", Colors.red);
        break;
      case 'invalid-email':
        showToastMessage(
            "Error", "The email address is not valid.", Colors.red);
        break;
      case 'user-disabled':
        showToastMessage(
            "Error", "This user account has been disabled.", Colors.red);
        break;
      case 'too-many-requests':
        showToastMessage(
            "Error", "Too many attempts. Please try again later.", Colors.red);
        break;
      default:
        showToastMessage("Error",
            "Something went wrong. Please retry after some time.", Colors.red);
    }
  }

  Future<void> fetchMetadataLanguages() async {
    try {
      final docSnapshot = await FirebaseFirestore.instance
          .collection('metadata')
          .doc('languages')
          .get();

      if (docSnapshot.exists && docSnapshot.data() != null) {
        final dataMap = docSnapshot.data() as Map<String, dynamic>;
        final List<dynamic>? list = dataMap['data'] as List<dynamic>?;
        if (list != null && list.isNotEmpty) {
          languages = list.map((e) => e.toString()).toList();
        }
      }
    } catch (e) {
      log("Error fetching metadata languages: $e");
    } finally {
      // Sort languages alphabetically A to Z
      languages.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
      for (var language in languages) {
        if (!selectedLanguages.containsKey(language)) {
          selectedLanguages[language] = false;
        }
      }
      update();
    }
  }

  @override
  void onInit() {
    super.onInit();
    // Sort default languages alphabetically A to Z
    languages.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    // Initialize all languages as unchecked
    for (var language in languages) {
      selectedLanguages[language] = false;
    }
    // Fetch dynamic master language list from metadata/languages
    fetchMetadataLanguages();
  }

  @override
  void onClose() {
    _nameController.dispose();
    _workshopNameController.dispose();
    _cellPhoneController.dispose();
    _telephoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _postalCodeController.dispose();
    _dateOfBirthController.dispose();
    _experienceController.dispose();
    _descriptionController.dispose();
    _perHourCharge.dispose();
    _passController.dispose();
    scrollController.dispose();
    super.onClose();
  }
}
