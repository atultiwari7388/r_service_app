import 'package:admin_app/views/adminHome/admin_home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/views/auth/forgot_password.dart';
import 'package:admin_app/widgets/custom_button.dart';
import 'package:admin_app/widgets/reusable_text.dart';
import '../../widgets/text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  TextEditingController emailController = TextEditingController();
  TextEditingController passController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // Background Curves
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

          // Main content
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: 32.w,
                vertical: MediaQuery.of(context).size.height / 10),
            width: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ReusableText(
                  text: "Login",
                  style: appStyle(34, kDark, FontWeight.normal),
                ),
                SizedBox(height: 24.h),
                SizedBox(height: 24.h),
                buildTextFieldInputWidget(
                  "Email ID",
                  TextInputType.emailAddress,
                  emailController,
                  MaterialCommunityIcons.email,
                ),
                SizedBox(height: 24.h),
                buildTextFieldInputWidget(
                  "Password",
                  TextInputType.visiblePassword,
                  passController,
                  MaterialCommunityIcons.security,
                  isPass: true,
                ),
                SizedBox(height: 5.h),
                Row(
                  children: [
                    Expanded(child: Container()),
                    GestureDetector(
                      onTap: () => Get.to(() => ForgotPasswordScreen()),
                      child: Text("Forgot Password?",
                          style: appStyle(14, kPrimary, FontWeight.bold)),
                    ),
                  ],
                ),
                SizedBox(height: 30.h),
                CustomButton(
                  text: "Login",
                  onPress: () => Get.offAll(() => AdminHomeScreen()),
                  color: kPrimary,
                ),
                SizedBox(height: 20.h),
              ],
            ),
          ),
        ],
      ),
    );
  }

  TextFieldInputWidget buildTextFieldInputWidget(
    String hintText,
    TextInputType type,
    TextEditingController controller,
    IconData icon, {
    bool isPass = false,
  }) {
    return TextFieldInputWidget(
      hintText: hintText,
      textInputType: type,
      textEditingController: controller,
      icon: icon,
      isPass: isPass,
    );
  }
}
