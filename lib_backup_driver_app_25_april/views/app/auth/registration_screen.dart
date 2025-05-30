import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/auth/login_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../utils/show_toast_msg.dart';
import '../../../widgets/text_field.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: LayoutBuilder(
        builder: (context, constraints) {
          bool isDesktop = constraints.maxWidth >= 1024;
          return GetBuilder<AuthController>(
            init: AuthController(),
            builder: (controller) {
              if (!controller.isUserAcCreated) {
                if (isDesktop) {
                  return SizedBox();
                } else {
                  return buildMobileLayout(controller, context);
                }
              } else {
                return Center(child: CircularProgressIndicator());
              }
            },
          );
        },
      ),
    );
  }

  Stack buildMobileLayout(AuthController controller, BuildContext context) {
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
            key: controller.formKey,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 30.w, vertical: 20.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.1),
                  ReusableText(
                    text: "Sign up",
                    style: appStyle(34, kPrimary, FontWeight.normal),
                  ),
                  SizedBox(height: 24.h),
                  buildTextFieldInputWidget(
                    "Enter your name",
                    TextInputType.text,
                    controller.nameController,
                    MaterialCommunityIcons.account,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return "Please enter your name";
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 15.h),
                  buildTextFieldInputWidget(
                    "Enter your email",
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
                  SizedBox(height: 15.h),
                  buildTextFieldInputWidget(
                    "Enter your address",
                    TextInputType.streetAddress,
                    controller.addressController,
                    MaterialCommunityIcons.home,
                  ),
                  SizedBox(height: 15.h),
                  buildTextFieldInputWidget(
                    "Enter Company name",
                    TextInputType.text,
                    controller.companyNameController,
                    MaterialCommunityIcons.account,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return "Please enter your company name";
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 15.h),
                  buildTextFieldInputWidget(
                    "Enter your phone number",
                    TextInputType.number,
                    controller.phoneNumberController,
                    MaterialCommunityIcons.phone,
                    validator: (value) {
                      if (value == null || value.length != 10) {
                        return "Please enter a valid phone number";
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 15.h),
                  buildTextFieldInputWidget(
                    "Enter your password",
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
                  SizedBox(height: 15.h),
                  Obx(
                    () => DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: "Number of Vehicles",
                        labelStyle: appStyle(15, kPrimary, FontWeight.normal),
                        fillColor: Colors.white,
                        filled: true,
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(12.0), // Rounded corners
                          borderSide: BorderSide(
                            color: Colors.grey.shade300, // Border color
                            width: 1.0,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(12.0), // Rounded corners
                          borderSide: BorderSide(
                            color: Colors.grey.shade300, // Border color
                            width: 1.0,
                          ),
                        ),
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(12.0), // Rounded corners
                          borderSide: BorderSide(
                            color: Colors.grey.shade300, // Border color
                            width: 1.0,
                          ),
                        ),
                        contentPadding: const EdgeInsets.all(8),
                      ),
                      value: controller.selectedVehicleRange.value,
                      icon: const Icon(Icons.arrow_drop_down),
                      items: controller.vehicleRanges.map((String range) {
                        return DropdownMenuItem<String>(
                          value: range,
                          child: Text(range),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          controller.selectedVehicleRange.value = value;
                        }
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return "Please select a vehicle range";
                        }
                        return null;
                      },
                    ),
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
                    onPress: controller.isUserAcCreated
                        ? null
                        : () {
                            // controller.createUserWithEmailAndPassword();

                            if (controller.formKey.currentState != null &&
                                controller.formKey.currentState!.validate()) {
                              controller.createUserWithEmailAndPassword();
                            } else {
                              showToastMessage("Error",
                                  "Please enter valid inputs", Colors.red);
                            }
                          },
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
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                ],
              ),
            ),
          ),
        ),
      ],
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
