//With Image
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/auth/registration_screen.dart';
import '../../controllers/authentication_controller.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/reusable_text.dart';
import '../../widgets/text_field.dart';
import 'forgot_password.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GetBuilder<AuthController>(
        init: AuthController(),
        builder: (controller) {
          if (!controller.isUserSign) {
            return Stack(
              children: [
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
                SingleChildScrollView(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.1),
                        // Logo and Title
                        Center(
                          child: Column(
                            children: [
                              Image.asset(
                                'assets/new_logo_m.png',
                                height: 270.h,
                                width: double.maxFinite,
                                // color: kWhite,
                              ),
                              SizedBox(height: 20.h),
                              ReusableText(
                                text: "Mechanic Login",
                                style: appStyle(24, kPrimary, FontWeight.w500),
                              ),
                            ],
                          ),
                        ),

                        // SizedBox(height: 20.h),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Container(
                            // height: 400.h,
                            height: MediaQuery.of(context).size.height / 1.7,
                            padding: EdgeInsets.symmetric(
                                horizontal: 30.w, vertical: 20.h),
                            decoration: BoxDecoration(
                              // color: Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(30.r),
                                topRight: Radius.circular(30.r),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Spacer(),
                                buildTextFieldInputWidget(
                                  "Email ID",
                                  TextInputType.emailAddress,
                                  controller.emailController,
                                  MaterialCommunityIcons.email,
                                  validator: (value) {
                                    if (value == null ||
                                        !GetUtils.isEmail(value)) {
                                      return "Please enter a valid email";
                                    }
                                    return null;
                                  },
                                ),
                                SizedBox(height: 24.h),
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
                                Row(
                                  children: [
                                    Expanded(child: Container()),
                                    GestureDetector(
                                      onTap: () =>
                                          Get.to(() => ForgotPasswordScreen()),
                                      child: Text("Forgot Password?",
                                          style: appStyle(
                                              14, kPrimary, FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 30.h),
                                CustomButton(
                                  text: "Login",
                                  onPress: controller.isUserAcCreated
                                      ? null
                                      : () {
                                          if (_formKey.currentState != null &&
                                              _formKey.currentState!
                                                  .validate()) {
                                            controller
                                                .signInWithEmailAndPassword();
                                          } else {
                                            showToastMessage(
                                                "Error",
                                                "Please enter valid inputs",
                                                Colors.red);
                                          }
                                        },
                                  color: kPrimary,
                                ),
                                // CustomGradientButton(text: "Login", onPress: () {}),
                                SizedBox(height: 20.h),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    ReusableText(
                                        text: "New to Rabbit Mechanic Service?",
                                        style: appStyle(
                                            14, kDark, FontWeight.w500)),
                                    SizedBox(width: 5.w),
                                    GestureDetector(
                                      onTap: () =>
                                          Get.to(() => RegistrationScreen()),
                                      child: ReusableText(
                                          text: "Register",
                                          style: appStyle(
                                              14, kPrimary, FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                Spacer(),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          } else {
            return Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }

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
// import 'package:regal_shop_app/views/auth/registration_screen.dart';
// import '../../utils/app_styles.dart';
// import '../../utils/constants.dart';
// import '../../widgets/custom_button.dart';
// import '../../widgets/reusable_text.dart';
// import '../../widgets/text_field.dart';
// import '../entry_screen.dart';
// import 'forgot_password.dart';
//
// class LoginScreen extends StatefulWidget {
//   const LoginScreen({super.key});
//
//   @override
//   State<LoginScreen> createState() => _LoginScreenState();
// }
//
// class _LoginScreenState extends State<LoginScreen> {
//   TextEditingController emailController = TextEditingController();
//   TextEditingController passController = TextEditingController();
//
//   @override
//   Widget build(BuildContext context) {
//
//     return Scaffold(
//       resizeToAvoidBottomInset: true,
//       body: Stack(
//         children: [
//           Positioned(
//             top: -100.h,
//             left: -100.w,
//             child: Container(
//               width: 300.w,
//               height: 300.h,
//               decoration: BoxDecoration(
//                 color:  kPrimary.withOpacity(0.3) ,
//                 borderRadius: BorderRadius.circular(150),
//               ),
//             ),
//           ),
//           Positioned(
//             bottom: -100.h,
//             right: -100.w,
//             child: Container(
//               width: 300.w,
//               height: 300.h,
//               decoration: BoxDecoration(
//                 color: kSecondary.withOpacity(0.3) ,
//                 borderRadius: BorderRadius.circular(150),
//               ),
//             ),
//           ),
//
//           SingleChildScrollView(
//             child: Column(
//               children: [
//                 SizedBox(height: MediaQuery.of(context).size.height * 0.1),
//                 // Logo and Title
//                 Center(
//                   child: Column(
//                     children: [
//                       Image.asset(
//                         'assets/no-background-logo.png',
//                         height: 270.h,
//                         width: double.maxFinite,
//                         // color: kWhite,
//                       ),
//                       SizedBox(height: 20.h),
//                       ReusableText(
//                         text: "Mechanic Login",
//                         style: appStyle(24, kPrimary, FontWeight.w500),
//                       ),
//                     ],
//                   ),
//                 ),
//
//                 // SizedBox(height: 20.h),
//                 Align(
//                   alignment: Alignment.bottomCenter,
//                   child: Container(
//                     // height: 400.h,
//                     height: MediaQuery.of(context).size.height / 1.7,
//                     padding:
//                     EdgeInsets.symmetric(horizontal: 30.w, vertical: 20.h),
//                     decoration: BoxDecoration(
//                       // color: Colors.white,
//                       borderRadius: BorderRadius.only(
//                         topLeft: Radius.circular(30.r),
//                         topRight: Radius.circular(30.r),
//                       ),
//                     ),
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.center,
//                       children: [
//                         // Spacer(),
//                         buildTextFieldInputWidget(
//                           "Email ID",
//                           TextInputType.emailAddress,
//                           emailController,
//                           MaterialCommunityIcons.email,
//                         ),
//                         SizedBox(height: 24.h),
//                         buildTextFieldInputWidget(
//                           "Password",
//                           TextInputType.visiblePassword,
//                           passController,
//                           MaterialCommunityIcons.security,
//                           isPass: true,
//                         ),
//                         SizedBox(height: 5.h),
//                         Row(
//                           children: [
//                             Expanded(child: Container()),
//                             GestureDetector(
//                               onTap: () => Get.to(() => ForgotPasswordScreen()),
//                               child: Text("Forgot Password?",
//                                   style: appStyle(14, kPrimary, FontWeight.bold)),
//                             ),
//                           ],
//                         ),
//                         SizedBox(height: 30.h),
//                         CustomButton(
//                           text: "Login",
//                           onPress: () => Get.offAll(() => EntryScreen()),
//                           color: kPrimary,
//                         ),
//                         // CustomGradientButton(text: "Login", onPress: () {}),
//                         SizedBox(height: 20.h),
//                         Row(
//                           mainAxisAlignment: MainAxisAlignment.center,
//                           children: [
//                             ReusableText(
//                                 text: "New to Rabbit Mechanic Service?",
//                                 style: appStyle(14, kDark, FontWeight.w500)),
//                             SizedBox(width: 5.w),
//                             GestureDetector(
//                               onTap: () => Get.to(() => RegistrationScreen()),
//                               child: ReusableText(
//                                   text: "Register",
//                                   style: appStyle(14, kPrimary, FontWeight.bold)),
//                             ),
//                           ],
//                         ),
//                         Spacer(),
//                       ],
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }
//
//   TextFieldInputWidget buildTextFieldInputWidget(
//       String hintText,
//       TextInputType type,
//       TextEditingController controller,
//       IconData icon, {
//         bool isPass = false,
//       }) {
//     return TextFieldInputWidget(
//       hintText: hintText,
//       textInputType: type,
//       textEditingController: controller,
//       icon: icon,
//       isPass: isPass,
//     );
//   }
// }
