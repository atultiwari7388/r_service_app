import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/auth/forgot_password.dart';
import 'package:regal_service_d_app/views/auth/registration_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

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
                  return SizedBox(
                    height: double.maxFinite,
                    width: double.maxFinite,
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Text(
                                "Welcome Driver",
                                style: TextStyle(fontSize: 60),
                              ),
                              const SizedBox(height: 10),
                              const Text("Login to access your account details",
                                  style: TextStyle()),
                              const SizedBox(height: 30),
                              //create a new account using email and password
                              Form(
                                key: _formKey,
                                child: SizedBox(
                                  width: 350,
                                  child: Column(
                                    children: [
                                      TextFormField(
                                        controller: controller.emailController,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        decoration: const InputDecoration(
                                            hintText: "Your Email",
                                            prefixIcon:
                                                Icon(Icons.alternate_email)),
                                        validator: (value) {
                                          return value!.isEmpty
                                              ? "Enter your email"
                                              : null;
                                        },
                                      ),
                                      TextFormField(
                                        controller: controller.passController,
                                        keyboardType:
                                            TextInputType.visiblePassword,
                                        obscureText: true,
                                        decoration: const InputDecoration(
                                            hintText: "Your Password",
                                            prefixIcon: Icon(Icons.visibility)),
                                        validator: (value) {
                                          if (value == null ||
                                              value.length < 6) {
                                            return "Password must be at least 6 characters";
                                          }
                                          return null;
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 30),
                              //signup button
                              InkWell(
                                onTap: () {
                                  if (_formKey.currentState != null &&
                                      _formKey.currentState!.validate()) {
                                    controller.signInWithEmailAndPassword();
                                  } else {
                                    showToastMessage(
                                        "Error",
                                        "Invalid Email or Password",
                                        Colors.red);
                                  }
                                },
                                child: controller.isUserAcCreated
                                    ? const CircularProgressIndicator()
                                    : Material(
                                        elevation: 5,
                                        borderRadius: BorderRadius.circular(10),
                                        color: kPrimary,
                                        child: const SizedBox(
                                          height: 45,
                                          width: 400,
                                          child: Center(
                                            child: Text(
                                              "Login",
                                              style: TextStyle(
                                                  color: Colors.white),
                                            ),
                                          ),
                                        ),
                                      ),
                              ),
                              const SizedBox(height: 30),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ReusableText(
                                    text: "New to Rabbit Mechanic Service?",
                                    style: TextStyle(),
                                  ),
                                  SizedBox(width: 2.w),
                                  GestureDetector(
                                    onTap: () => Get.to(
                                        () => const RegistrationScreen()),
                                    child: ReusableText(
                                      text: "Register",
                                      style: TextStyle(color: kPrimary),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.only(
                                bottom: 80, top: 80, left: 80, right: 80),
                            child: Image.asset(
                              "assets/no-background-logo.png",
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
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
                        'assets/app_icon_new_logo.png',
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
          controller.emailController,
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
          controller.passController,
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
          onPress: controller.isUserAcCreated
              ? null
              : () {
                  if (_formKey.currentState != null &&
                      _formKey.currentState!.validate()) {
                    controller.signInWithEmailAndPassword();
                  } else {
                    showToastMessage(
                        "Error", "Invalid Email or Password", Colors.red);
                  }
                },
          color: kPrimary,
        ),
        SizedBox(height: 20.h),
        // Registration Link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ReusableText(
              text: "New to Rabbit Mechanic Service?",
              style: appStyle(14, kDark, FontWeight.w500),
            ),
            SizedBox(width: 5.w),
            GestureDetector(
              onTap: () => Get.to(() => const RegistrationScreen()),
              child: ReusableText(
                text: "Register",
                style: appStyle(14, kPrimary, FontWeight.bold),
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
}


// //With Image
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:flutter_vector_icons/flutter_vector_icons.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/controllers/authentication_controller.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/views/auth/forgot_password.dart';
// import 'package:regal_service_d_app/views/auth/registration_screen.dart';
// import 'package:regal_service_d_app/views/entry_screen.dart';
// import 'package:regal_service_d_app/widgets/custom_button.dart';
// import 'package:regal_service_d_app/widgets/custom_gradient_button.dart';
// import 'package:regal_service_d_app/widgets/reusable_text.dart';
// import '../../utils/show_toast_msg.dart';
// import '../../widgets/text_field.dart';

// class LoginScreen extends StatefulWidget {
//   const LoginScreen({super.key});

//   @override
//   State<LoginScreen> createState() => _LoginScreenState();
// }

// class _LoginScreenState extends State<LoginScreen> {
//   final _formKey = GlobalKey<FormState>();
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       resizeToAvoidBottomInset: true,
//       body: GetBuilder<AuthController>(
//         init: AuthController(),
//         builder: (controller) {
//           if (!controller.isUserSign) {
//             return Stack(
//               children: [
//                 Positioned(
//                   top: -100.h,
//                   left: -100.w,
//                   child: Container(
//                     width: 300.w,
//                     height: 300.h,
//                     decoration: BoxDecoration(
//                       color: kPrimary.withOpacity(0.3),
//                       borderRadius: BorderRadius.circular(150),
//                     ),
//                   ),
//                 ),
//                 Positioned(
//                   bottom: -100.h,
//                   right: -100.w,
//                   child: Container(
//                     width: 300.w,
//                     height: 300.h,
//                     decoration: BoxDecoration(
//                       color: kSecondary.withOpacity(0.3),
//                       borderRadius: BorderRadius.circular(150),
//                     ),
//                   ),
//                 ),
//                 SingleChildScrollView(
//                   child: Form(
//                     key: _formKey,
//                     child: Column(
//                       children: [
//                         SizedBox(
//                             height: MediaQuery.of(context).size.height * 0.1),
//                         // Logo and Title
//                         Center(
//                           child: Column(
//                             children: [
//                               Image.asset(
//                                 'assets/no-background-logo.png',
//                                 height: 270.h,
//                                 width: double.maxFinite,
//                                 // color: kWhite,
//                               ),
//                               SizedBox(height: 20.h),
//                               ReusableText(
//                                 text: "Login",
//                                 style: appStyle(24, kPrimary, FontWeight.w500),
//                               ),
//                             ],
//                           ),
//                         ),

//                         // SizedBox(height: 20.h),
//                         Align(
//                           alignment: Alignment.bottomCenter,
//                           child: Container(
//                             // height: 400.h,
//                             height: MediaQuery.of(context).size.height / 1.7,
//                             padding: EdgeInsets.symmetric(
//                                 horizontal: 30.w, vertical: 20.h),
//                             decoration: BoxDecoration(
//                               // color: Colors.white,
//                               borderRadius: BorderRadius.only(
//                                 topLeft: Radius.circular(30.r),
//                                 topRight: Radius.circular(30.r),
//                               ),
//                             ),
//                             child: Column(
//                               crossAxisAlignment: CrossAxisAlignment.center,
//                               children: [
//                                 // Spacer(),
//                                 buildTextFieldInputWidget(
//                                   "Email ID",
//                                   TextInputType.emailAddress,
//                                   controller.emailController,
//                                   MaterialCommunityIcons.email,
//                                   validator: (value) {
//                                     if (value == null ||
//                                         !GetUtils.isEmail(value)) {
//                                       return "Please enter a valid email";
//                                     }
//                                     return null;
//                                   },
//                                 ),
//                                 SizedBox(height: 24.h),
//                                 buildTextFieldInputWidget(
//                                   "Password",
//                                   TextInputType.visiblePassword,
//                                   controller.passController,
//                                   MaterialCommunityIcons.security,
//                                   isPass: true,
//                                   validator: (value) {
//                                     if (value == null || value.length < 6) {
//                                       return "Password must be at least 6 characters";
//                                     }
//                                     return null;
//                                   },
//                                 ),
//                                 SizedBox(height: 5.h),
//                                 Row(
//                                   children: [
//                                     Expanded(child: Container()),
//                                     GestureDetector(
//                                       onTap: () =>
//                                           Get.to(() => ForgotPasswordScreen()),
//                                       child: Text("Forgot Password?",
//                                           style: appStyle(
//                                               14, kPrimary, FontWeight.bold)),
//                                     ),
//                                   ],
//                                 ),
//                                 SizedBox(height: 30.h),
//                                 CustomButton(
//                                   text: "Login",
//                                   onPress: controller.isUserAcCreated
//                                       ? null
//                                       : () {
//                                           if (_formKey.currentState != null &&
//                                               _formKey.currentState!
//                                                   .validate()) {
//                                             controller
//                                                 .signInWithEmailAndPassword();
//                                           } else {
//                                             showToastMessage(
//                                                 "Error",
//                                                 "Invalid Email or Password",
//                                                 Colors.red);
//                                           }
//                                         },
//                                   color: kPrimary,
//                                 ),
//                                 // CustomGradientButton(text: "Login", onPress: () {}),
//                                 SizedBox(height: 20.h),
//                                 Row(
//                                   mainAxisAlignment: MainAxisAlignment.center,
//                                   children: [
//                                     ReusableText(
//                                         text: "New to Rabbit Mechanic Service?",
//                                         style: appStyle(
//                                             14, kDark, FontWeight.w500)),
//                                     SizedBox(width: 5.w),
//                                     GestureDetector(
//                                       onTap: () =>
//                                           Get.to(() => RegistrationScreen()),
//                                       child: ReusableText(
//                                           text: "Register",
//                                           style: appStyle(
//                                               14, kPrimary, FontWeight.bold)),
//                                     ),
//                                   ],
//                                 ),
//                                 Spacer(),
//                               ],
//                             ),
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                 ),
//               ],
//             );
//           } else {
//             return Center(child: CircularProgressIndicator());
//           }
//         },
//       ),
//     );
//   }

//   TextFieldInputWidget buildTextFieldInputWidget(
//     String hintText,
//     TextInputType type,
//     TextEditingController controller,
//     IconData icon, {
//     bool isPass = false,
//     String? Function(String?)? validator,
//   }) {
//     return TextFieldInputWidget(
//       hintText: hintText,
//       textInputType: type,
//       textEditingController: controller,
//       icon: icon,
//       isPass: isPass,
//       validator: validator,
//     );
//   }
// }
