import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import '../../widgets/text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // TextEditingController emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GetBuilder<AuthController>(
          init: AuthController(),
          builder: (controller) {
            if (!controller.forgotPass) {
              return Stack(
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
                  Positioned(
                    top: 60.h,
                    left: 20.w,
                    child: IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.arrow_back, size: 30.h, color: kDark),
                    ),
                  ),

                  // Main content
                  Container(
                    padding: EdgeInsets.symmetric(
                        horizontal: 32.w,
                        vertical: MediaQuery.of(context).size.height / 10),
                    width: double.infinity,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Forgot \nPassword?",
                            style: appStyle(34, kPrimary, FontWeight.normal),
                          ),
                          SizedBox(height: 10.h),
                          Text(
                            "Don't worry it happens. Please enter the address associated with your account.",
                            style: appStyle(13, kGray, FontWeight.normal),
                          ),
                          SizedBox(height: 24.h),
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
                          SizedBox(height: 50.h),
                          CustomButton(
                            text: "Submit",
                            onPress: () => controller.resetPasswordWithEmail(),
                            color: kPrimary,
                          ),
                          SizedBox(height: 20.h),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            } else {
              return Center(child: CircularProgressIndicator());
            }
          }),
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
