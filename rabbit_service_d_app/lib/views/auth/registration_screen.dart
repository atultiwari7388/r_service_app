import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/auth/login_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/text_field.dart';

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
                                "Create Account",
                                style: TextStyle(fontSize: 60),
                              ),

                              const SizedBox(height: 30),
                              //create a new account using email and password
                              Form(
                                key: controller.formKey,
                                child: SizedBox(
                                  width: 350,
                                  child: Column(
                                    children: [
                                      TextFormField(
                                        controller: controller.nameController,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        decoration: const InputDecoration(
                                            hintText: "Your Name",
                                            prefixIcon:
                                                Icon(Icons.alternate_email)),
                                        validator: (value) {
                                          return value!.isEmpty
                                              ? "Enter your name"
                                              : null;
                                        },
                                      ),
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
                                        controller:
                                            controller.phoneNumberController,
                                        keyboardType: TextInputType.phone,
                                        decoration: const InputDecoration(
                                            hintText: "Your Phone number",
                                            prefixIcon:
                                                Icon(Icons.alternate_email)),
                                        validator: (value) {
                                          return value!.isEmpty
                                              ? "Enter your phone number"
                                              : null;
                                        },
                                      ),
                                      TextFormField(
                                        controller:
                                            controller.addressController,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        decoration: const InputDecoration(
                                            hintText: "Your Address",
                                            prefixIcon:
                                                Icon(Icons.alternate_email)),
                                        validator: (value) {
                                          return value!.isEmpty
                                              ? "Enter your address"
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
                                          return value!.isEmpty
                                              ? "Enter your password"
                                              : null;
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
                                    controller.createUserWithEmailAndPassword();
                                  } else {
                                    showToastMessage(
                                        "Error",
                                        "Please enter valid inputs",
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
                                              "Create account",
                                              style: TextStyle(
                                                  color: Colors.white),
                                            ),
                                          ),
                                        ),
                                      ),
                              ),
                              const SizedBox(height: 30),
                              SizedBox(
                                width: 260,
                                child: RichText(
                                  textAlign: TextAlign.center,
                                  text: TextSpan(
                                    text: "By continuing, you agree to our ",
                                    style: TextStyle(color: kDark),
                                    children: <TextSpan>[
                                      TextSpan(
                                        text: "Terms of Services",
                                        style: TextStyle(color: kPrimary),
                                        recognizer: TapGestureRecognizer()
                                          ..onTap = () {
                                            // Handle tap for Terms of Services
                                            print("Terms of Services tapped");
                                          },
                                      ),
                                      TextSpan(
                                        text: " and ",
                                        style: TextStyle(color: kDark),
                                      ),
                                      TextSpan(
                                        text: "Privacy Policy.",
                                        style: TextStyle(color: kPrimary),
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
            key: _formKey,
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
