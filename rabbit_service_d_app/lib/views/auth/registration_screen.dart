import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/auth/login_screen.dart';
import 'package:regal_service_d_app/widgets/custom_background_container.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../widgets/text_field.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  TextEditingController nameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController vehicleController = TextEditingController();
  TextEditingController passController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: CustomBackgroundContainer(
        horizontalW: 35,
        vertical: MediaQuery.of(context).size.height * 0.1,
        scrollPhysics: AlwaysScrollableScrollPhysics(),
        isBackgroundApplied: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ReusableText(
              text: "Sign up",
              style: appStyle(34, kPrimary, FontWeight.normal),
            ),
            SizedBox(height: 24.h),
            buildTextFieldInputWidget(
              "Enter your name",
              TextInputType.text,
              nameController,
              MaterialCommunityIcons.account,
            ),
            SizedBox(height: 15.h),
            buildTextFieldInputWidget(
              "Enter your email",
              TextInputType.emailAddress,
              emailController,
              MaterialCommunityIcons.email,
            ),
            SizedBox(height: 15.h),
            buildTextFieldInputWidget(
              "Enter your address",
              TextInputType.streetAddress,
              addressController,
              MaterialCommunityIcons.home,
            ),
            SizedBox(height: 15.h),
            buildTextFieldInputWidget(
              "Enter your phone number",
              TextInputType.number,
              phoneController,
              MaterialCommunityIcons.phone,
            ),
            SizedBox(height: 15.h),
            buildTextFieldInputWidget(
              "Enter your vehicle number",
              TextInputType.streetAddress,
              vehicleController,
              MaterialCommunityIcons.car,
            ),
            SizedBox(height: 15.h),
            buildTextFieldInputWidget(
              "Enter your password",
              TextInputType.visiblePassword,
              passController,
              MaterialCommunityIcons.security,
              isPass: true,
            ),
            SizedBox(height: 15.h),
            SizedBox(
              width: 260.w,
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  text: "By continuing, you agree to our ",
                  style: appStyle(12, kDark, FontWeight.w500),
                  children: <TextSpan>[
                    TextSpan(
                      text: "Terms of Services",
                      style: appStyle(12, kPrimary, FontWeight.w500),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          // Handle tap for Terms of Services
                          print("Terms of Services tapped");
                        },
                    ),
                    TextSpan(
                      text: " and ",
                      style: appStyle(12, kDark, FontWeight.w500),
                    ),
                    TextSpan(
                      text: "Privacy Policy.",
                      style: appStyle(12, kPrimary, FontWeight.w500),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          // Handle tap for Privacy Policy
                          print("Privacy Policy tapped");
                        },
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24.h),
            CustomButton(
              text: "Continue",
              onPress: () {},
              color: kPrimary,
            ),
            SizedBox(height: 24.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ReusableText(
                    text: "Joined us before?",
                    style: appStyle(14, kDark, FontWeight.w500)),
                SizedBox(width: 5.w),
                GestureDetector(
                  onTap: () => Get.to(() => LoginScreen()),
                  child: ReusableText(
                      text: "Login",
                      style: appStyle(14, kPrimary, FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
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
