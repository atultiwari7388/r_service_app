import 'package:admin_app/controllers/authentication_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
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
  // TextEditingController emailController = TextEditingController();
  // TextEditingController passController = TextEditingController();
  final formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GetBuilder<AuthenticationController>(
        init: AuthenticationController(),
        builder: (controller) {
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
                            // color: kWhite,
                          ),
                          SizedBox(height: 20.h),
                          ReusableText(
                            text: "Admin Login",
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
                        child: Form(
                          key: formKey,
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
                                controller.passwordController,
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

                              controller.isLoading
                                  ? const CircularProgressIndicator()
                                  : CustomButton(
                                      text: "Login",
                                      onPress: () {
                                        if (formKey.currentState!.validate()) {
                                          controller
                                              .loginWithEmailAndPassword();
                                        }
                                      },
                                      color: kPrimary,
                                    ),
                              // CustomGradientButton(text: "Login", onPress: () {}),
                              SizedBox(height: 20.h),

                              Spacer(),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
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
