import 'dart:developer';
import 'package:android_id/android_id.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/auth/forgot_password.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../utils/show_toast_msg.dart';
import '../../../widgets/text_field.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firestore = FirebaseFirestore.instance;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passController = TextEditingController();
  final DeviceInfoPlugin deviceInfoPlugin = DeviceInfoPlugin();
  String? deviceId;
  String? fcmToken;

  @override
  void initState() {
    super.initState();
    _getDeviceInfo();
    _getFcmToken();
  }

  // Future<void> _getDeviceInfo() async {
  //   if (defaultTargetPlatform == TargetPlatform.android) {
  //     AndroidDeviceInfo androidInfo = await deviceInfoPlugin.androidInfo;
  //     deviceId = androidInfo.id;
  //     log("DeviceId: $deviceId");
  //   } else if (defaultTargetPlatform == TargetPlatform.iOS) {
  //     IosDeviceInfo iosInfo = await deviceInfoPlugin.iosInfo;
  //     deviceId = iosInfo.identifierForVendor;
  //   }
  // }

  Future<void> _getDeviceInfo() async {
    if (defaultTargetPlatform == TargetPlatform.android) {
      final androidIdPlugin = AndroidId();
      deviceId = await androidIdPlugin.getId(); // ✅ true ANDROID_ID
      print("DeviceId: $deviceId");
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosInfo = await deviceInfoPlugin.iosInfo;
      deviceId = iosInfo.identifierForVendor;
      print("DeviceId: $deviceId");
    }
  }

  Future<void> _getFcmToken() async {
    fcmToken = await FirebaseMessaging.instance.getToken();
  }

  Future<bool> _checkDeviceAuthorization(String userId) async {
    if (deviceId == null) return false;

    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(userId)
          .get();

      if (userDoc.exists) {
        final data = userDoc.data();
        final authorizedDeviceId = data?['currentDeviceId'];

        // If no device is registered yet, update with current device and allow login
        if (authorizedDeviceId == null) {
          // Update the user document with current device info
          await FirebaseFirestore.instance
              .collection('Users')
              .doc(userId)
              .update({
            'currentDeviceId': deviceId,
            'lastLogin': FieldValue.serverTimestamp(),
          });
          return true;
        }

        // Check if this device is the authorized one
        return authorizedDeviceId == deviceId;
      }
      return false;
    } catch (e) {
      log("Error checking device authorization: $e");
      return false;
    }
  }

  // Add this method to update device info
  Future<void> _updateDeviceInfo(String userId) async {
    try {
      await _firestore.collection('Users').doc(userId).update({
        'fcmToken': fcmToken,
        'currentDeviceId': deviceId,
        'lastLogin': FieldValue.serverTimestamp(),
      });
      log('Device info updated in Users collection');
    } catch (error) {
      log('Error updating device info in Users collection: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Using LayoutBuilder to determine screen size
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: LayoutBuilder(
        builder: (context, constraints) {
          // Define a breakpoint for desktop
          bool isDesktop = constraints.maxWidth >= 1024;

          return GetBuilder<AuthController>(
            init: AuthController(),
            builder: (controller) {
              if (!controller.isUserSign) {
                if (isDesktop) {
                  return Container();
                } else {
                  // Mobile Layout
                  return buildMobileLayout(controller);
                }
              } else {
                return const Center(child: CircularProgressIndicator());
              }
            },
          );
        },
      ),
    );
  }

  /// Builds the mobile layout with background shapes, logo, and form
  Widget buildMobileLayout(AuthController controller) {
    return Stack(
      children: [
        // Top Background Shape
        Positioned(
          top: -100.h,
          left: -100.w,
          child: Container(
            width: 300.w,
            height: 300.h,
            decoration: BoxDecoration(
              color: kPrimary.withOpacity(0.3),
              borderRadius: BorderRadius.circular(150),
            ),
          ),
        ),
        // Bottom Background Shape
        Positioned(
          bottom: -100.h,
          right: -100.w,
          child: Container(
            width: 300.w,
            height: 300.h,
            decoration: BoxDecoration(
              color: kSecondary.withOpacity(0.3),
              borderRadius: BorderRadius.circular(150),
            ),
          ),
        ),
        // Content - Logo and Form
        SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.1),
                // Logo and Title
                Center(
                  child: Column(
                    children: [
                      Image.asset(
                        'assets/logo_new.png',
                        height: 270.h,
                        width: double.maxFinite,
                        fit: BoxFit.contain,
                      ),
                      SizedBox(height: 20.h),
                      ReusableText(
                        text: "Login",
                        style: appStyle(24, kPrimary, FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                // Form Container
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    height: MediaQuery.of(context).size.height / 1.9,
                    padding:
                        EdgeInsets.symmetric(horizontal: 30.w, vertical: 20.h),
                    child: buildForm(controller),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Builds the login form
  Widget buildForm(AuthController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Email Field
        buildTextFieldInputWidget(
          "Email ID",
          TextInputType.emailAddress,
          _emailController,
          MaterialCommunityIcons.email,
          validator: (value) {
            if (value == null || !GetUtils.isEmail(value)) {
              return "Please enter a valid email";
            }
            return null;
          },
        ),
        SizedBox(height: 24.h),
        // Password Field
        buildTextFieldInputWidget(
          "Password",
          TextInputType.visiblePassword,
          _passController,
          MaterialCommunityIcons.security,
          isPass: true,
          validator: (value) {
            if (value == null || value.length < 6) {
              return "Password must be at least 6 characters";
            }
            return null;
          },
        ),
        SizedBox(height: 5.h),
        // Forgot Password Link
        Row(
          children: [
            Expanded(child: Container()),
            GestureDetector(
              onTap: () => Get.to(() => const ForgotPasswordScreen()),
              child: Text(
                "Forgot Password?",
                style: appStyle(14, kPrimary, FontWeight.bold),
              ),
            ),
          ],
        ),
        SizedBox(height: 30.h),
        // Login Button
        CustomButton(
          text: "Login",
          //   onPress: controller.isUserAcCreated
          //       ? null
          //       : () async {
          //           if (_formKey.currentState != null &&
          //               _formKey.currentState!.validate()) {
          //             //firstly we delete the anonymous user from the firestore if exists
          //             final prefs = await SharedPreferences.getInstance();
          //             final userId = prefs.getString('an_user_id');

          //             if (userId != null) {
          //               await _firestore.collection('Users').doc(userId).delete();
          //               await prefs.remove('an_user_id');

          //               log("Anonymous user $userId deleted from Firestore");
          //             }

          //             controller.signInWithEmailAndPassword(
          //                 _emailController.text.toString(),
          //                 _passController.text.toString());
          //           } else {
          //             showToastMessage(
          //                 "Error", "Invalid Email or Password", Colors.red);
          //           }
          //         },
          //   color: kPrimary,
          // ),

          onPress: controller.isUserAcCreated
              ? null
              : () async {
                  if (_formKey.currentState != null &&
                      _formKey.currentState!.validate()) {
                    // First, delete the anonymous user from firestore if exists
                    final prefs = await SharedPreferences.getInstance();
                    final userId = prefs.getString('an_user_id');

                    if (userId != null) {
                      await _firestore.collection('Users').doc(userId).delete();
                      await prefs.remove('an_user_id');
                      log("Anonymous user $userId deleted from Firestore");
                    }

                    // Sign in with email and password
                    final user = await controller.signInWithEmailAndPassword(
                      _emailController.text.toString(),
                      _passController.text.toString(),
                    );

                    // if (user != null) {
                    //   // Check if this device is authorized
                    //   final isAuthorized =
                    //       await _checkDeviceAuthorization(user.uid);

                    //   // if (!isAuthorized) {
                    //   //   // Not authorized - sign out and show message
                    //   //   await FirebaseAuth.instance.signOut();
                    //   //   showToastMessage(
                    //   //       "Device Not Authorized",
                    //   //       "You are already logged in on another device. Please logout from the other device first or contact support.",
                    //   //       Colors.red);
                    //   //   return;
                    //   // }

                    //   // Update device info for authorized login
                    //   await _updateDeviceInfo(user.uid);
                    // }
                  } else {
                    showToastMessage(
                        "Error", "Invalid Email or Password", Colors.red);
                  }
                },
          color: kPrimary,
        ),
        SizedBox(height: 20.h),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10.w),
          child: Text(
            "If you didn't receive the verification email, check your spam folder.",
            textAlign: TextAlign.center,
            style: appStyle(12, kPrimary, FontWeight.bold),
          ),
        ),
        SizedBox(height: 20.h),

        // Registration Link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ReusableText(
              text: "New to Rabbit Mechanic Service?",
              style: appStyle(13, kDark, FontWeight.w500),
            ),
            SizedBox(width: 5.w),
            GestureDetector(
              onTap: () => Get.to(() => const RegistrationScreen()),
              child: ReusableText(
                text: "Register",
                style: appStyle(11, kPrimary, FontWeight.bold),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Helper method to build text field input widgets
  TextFieldInputWidget buildTextFieldInputWidget(
    String hintText,
    TextInputType type,
    TextEditingController controller,
    IconData icon, {
    bool isPass = false,
    String? Function(String?)? validator,
  }) {
    return TextFieldInputWidget(
      hintText: hintText,
      textInputType: type,
      textEditingController: controller,
      icon: icon,
      isPass: isPass,
      validator: validator,
    );
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
    _emailController.dispose();
    _passController.dispose();
    _formKey.currentState?.dispose();
  }
}
