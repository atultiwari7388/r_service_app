import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/database_services.dart';
import 'package:regal_service_d_app/views/app/adminContact/admin_contact_screen.dart';
import 'package:regal_service_d_app/views/app/auth/login_screen.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
import 'package:regal_service_d_app/entry_screen.dart';
import '../utils/show_toast_msg.dart';

class AuthController extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _companyNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
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

  TextEditingController get cityController => _cityController;

  TextEditingController get countryController => _countryController;

  TextEditingController get stateController => _stateController;

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
        _cityController.text,
        _stateController.text,
        _countryController.text,
        selectedVehicleRange.value,
      );

      // Send email verification
      await user.user!.sendEmailVerification();

      isUserAcCreated = false;
      update();

      // Inform the user to verify their email before logging in
      showToastMessage(
          "Verification Required",
          "A verification email has been sent to your email address. Please verify it before logging in. If you don't see the email, check your spam folder.",
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
          showToastMessage(
              "Email Not Verified",
              "Please verify your email before logging in, If you have not receive mail also check in spam",
              Colors.orange);

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
          if (userDoc['active'] == true && userDoc['status'] == "active") {
            //navigate to mobile view
            Get.offAll(() => EntryScreen());
            showToastMessage("Success", "Login Successful", Colors.green);
            // Clear all controllers after successful login
            _emailController.clear();
            _passController.clear();
          } else if (userDoc['status'] == "deactivated") {
            // User is not active, navigate to ContactWithAdmin screen
            showToastMessage(
                "Error",
                "Your Account is deactivated, kindly contact with your office.",
                Colors.red);
            Get.offAll(() => const AdminContactScreen());
          } else {
            // User is not active, navigate to ContactWithAdmin screen
            showToastMessage(
                "Error",
                "Your Account is  deactivated, kindly contact with your office.",
                Colors.red);
            Get.offAll(() => const AdminContactScreen());
          }
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

  Future<void> signOut() async {
    try {
      // Clear all text controllers
      _nameController.clear();
      _companyNameController.clear();
      _emailController.clear();
      _addressController.clear();
      _cityController.clear();
      _stateController.clear();
      _countryController.clear();
      _phoneNumberController.clear();
      _passController.clear();
      _vehicleRangeController.clear();

      // Reset observable values
      selectedVehicleRange.value = '1 to 5';

      // Sign out from Firebase
      await _auth.signOut();

      // Get.reset();
      // Get.offAll(() => const LoginScreen());
    } catch (e) {
      throw Exception(e);
    }
  }

  void clearUserData() {
    _nameController.clear();
    _companyNameController.clear();
    _emailController.clear();
    _addressController.clear();
    _cityController.clear();
    _stateController.clear();
    _countryController.clear();
    _phoneNumberController.clear();
    _passController.clear();
    _vehicleRangeController.clear();
    selectedVehicleRange.value = '1 to 5';
    isUserSign = false;
    isUserAcCreated = false;
    forgotPass = false;
    update();
  }

  @override
  void onClose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _phoneNumberController.dispose();
    _passController.dispose();
    _companyNameController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    super.onClose();
  }
}
