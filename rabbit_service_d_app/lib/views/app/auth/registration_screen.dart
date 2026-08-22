import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
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
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firestore = FirebaseFirestore.instance;
  static const List<String> _countries = [
    "USA",
    "Canada",
    "England",
    "Australia",
    "Mexico",
  ];

  @override
  void initState() {
    super.initState();
    if (Get.isRegistered<AuthController>()) {
      Get.find<AuthController>().clearAllControllers();
    }
  }

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
              if (isDesktop) {
                return const SizedBox();
              } else {
                return buildMobileLayout(controller, context);
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
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height,
              minWidth: MediaQuery.of(context).size.width,
            ),
            child: Form(
              key: _formKey,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 30.w, vertical: 20.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(height: MediaQuery.of(context).size.height * 0.06),
                    ReusableText(
                      text: "Sign up",
                      style: appStyle(32, kPrimary, FontWeight.bold),
                    ),
                    SizedBox(height: 16.h),

                    // ================= PERSONAL DETAILS =================
                    _buildSectionHeader(
                      "Personal Details",
                      MaterialCommunityIcons.account_outline,
                    ),

                    buildTextFieldInputWidget(
                      "Enter your name*",
                      TextInputType.text,
                      controller.nameController,
                      MaterialCommunityIcons.account,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Please enter your name";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your email*",
                      TextInputType.emailAddress,
                      controller.emailController,
                      MaterialCommunityIcons.email,
                      validator: (value) {
                        if (value == null || !GetUtils.isEmail(value.trim())) {
                          return "Please enter a valid email";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your phone number*",
                      TextInputType.phone,
                      controller.phoneNumberController,
                      MaterialCommunityIcons.phone,
                      validator: (value) {
                        if (value == null || value.trim().length != 10) {
                          return "Please enter a valid 10-digit phone number";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your password*",
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
                    SizedBox(height: 10.h),

                    Obx(
                      () => DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: "Number of Vehicles*",
                          labelStyle: appStyle(14, kPrimary, FontWeight.normal),
                          fillColor: Colors.white,
                          filled: true,
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0),
                            borderSide: BorderSide(
                              color: kPrimary,
                              width: 1.5,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0),
                            borderSide: BorderSide(
                              color: Colors.grey.shade300,
                              width: 1.0,
                            ),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0),
                            borderSide: BorderSide(
                              color: Colors.grey.shade300,
                              width: 1.0,
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                        ),
                        value: controller.selectedVehicleRange.value,
                        icon: const Icon(Icons.arrow_drop_down),
                        items: controller.vehicleRanges.map((String range) {
                          return DropdownMenuItem<String>(
                            value: range,
                            child: Text(range,
                                style: appStyle(14, kDark, FontWeight.normal)),
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
                    SizedBox(height: 16.h),

                    // ================= COMPANY DETAILS =================
                    _buildSectionHeader(
                      "Company Details",
                      MaterialCommunityIcons.domain,
                    ),

                    buildTextFieldInputWidget(
                      "Enter Company name*",
                      TextInputType.text,
                      controller.companyNameController,
                      MaterialCommunityIcons.office_building,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Please enter your company name";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter DOT (Optional)",
                      TextInputType.text,
                      controller.dotController,
                      MaterialCommunityIcons.card_bulleted_outline,
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter MC (Optional)",
                      TextInputType.text,
                      controller.mcController,
                      MaterialCommunityIcons.card_text_outline,
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your address*",
                      TextInputType.streetAddress,
                      controller.addressController,
                      MaterialCommunityIcons.home,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Please enter your address";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your city*",
                      TextInputType.streetAddress,
                      controller.cityController,
                      MaterialCommunityIcons.city,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Please enter your city";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    buildTextFieldInputWidget(
                      "Enter your state*",
                      TextInputType.streetAddress,
                      controller.stateController,
                      MaterialCommunityIcons.home_account,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return "Please enter your state";
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 10.h),

                    Container(
                      margin: EdgeInsets.symmetric(vertical: 4.0.h),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12.0.r),
                      ),
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        value: _countries.contains(controller.countryController.text)
                            ? controller.countryController.text
                            : null,
                        hint: Text(
                          "Select your country*",
                          style: appStyle(14, kGrayLight, FontWeight.normal),
                        ),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(MaterialCommunityIcons.earth,
                              color: kPrimary),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0.r),
                            borderSide: BorderSide(
                              color: Colors.grey.shade300,
                              width: 1.0,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0.r),
                            borderSide: const BorderSide(
                              color: kPrimary,
                              width: 1.5,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.0.r),
                            borderSide: BorderSide(
                              color: Colors.grey.shade300,
                              width: 1.0,
                            ),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                        ),
                        items: _countries.map((String country) {
                          return DropdownMenuItem<String>(
                            value: country,
                            child: Text(
                              country,
                              style: appStyle(14, kDark, FontWeight.normal),
                            ),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            controller.countryController.text = newValue ?? '';
                          });
                        },
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return "Please select your country";
                          }
                          return null;
                        },
                      ),
                    ),
                    SizedBox(height: 16.h),

                    SizedBox(
                      width: 280.w,
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
                                ..onTap = () async {
                                  const url =
                                      'https://www.rabbitmechanic.com/terms-condition';
                                  if (await canLaunchUrl(Uri.parse(url))) {
                                    await launchUrl(Uri.parse(url),
                                        mode: LaunchMode.externalApplication);
                                  } else {
                                    print("Could not launch $url");
                                  }
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
                                ..onTap = () async {
                                  const url =
                                      'https://www.rabbitmechanic.com/privacy-policy';
                                  if (await canLaunchUrl(Uri.parse(url))) {
                                    await launchUrl(Uri.parse(url),
                                        mode: LaunchMode.externalApplication);
                                  } else {
                                    print("Could not launch $url");
                                  }
                                },
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 16.h),
                    CustomButton(
                      text: controller.isUserAcCreated ? "Creating Account..." : "Continue",
                      onPress: controller.isUserAcCreated
                          ? null
                          : () async {
                              if (_formKey.currentState != null) {
                                if (_formKey.currentState!.validate()) {
                                  // Delete anonymous user if exists
                                  try {
                                    final prefs =
                                        await SharedPreferences.getInstance();
                                    final userId = prefs.getString('an_user_id');

                                    if (userId != null) {
                                      await _firestore
                                          .collection('Users')
                                          .doc(userId)
                                          .delete();
                                      await prefs.remove('an_user_id');
                                      log("Anonymous user $userId deleted from Firestore");
                                    }
                                  } catch (e) {
                                    log("Error deleting anonymous user: $e");
                                  }

                                  // Create user account
                                  await controller
                                      .createUserWithEmailAndPassword();
                                } else {
                                  if (controller.nameController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your name",
                                        Colors.red);
                                  } else if (controller.emailController.text.trim().isEmpty ||
                                      !GetUtils.isEmail(controller.emailController.text.trim())) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter a valid email",
                                        Colors.red);
                                  } else if (controller.phoneNumberController.text.trim().length != 10) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter a valid 10-digit phone number",
                                        Colors.red);
                                  } else if (controller.passController.text.length < 6) {
                                    showToastMessage(
                                        "Error",
                                        "Password must be at least 6 characters",
                                        Colors.red);
                                  } else if (controller.companyNameController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your company name",
                                        Colors.red);
                                  } else if (controller.addressController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your address",
                                        Colors.red);
                                  } else if (controller.cityController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your city",
                                        Colors.red);
                                  } else if (controller.stateController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your state",
                                        Colors.red);
                                  } else if (controller.countryController.text.trim().isEmpty) {
                                    showToastMessage(
                                        "Error",
                                        "Please enter your country",
                                        Colors.red);
                                  } else {
                                    showToastMessage(
                                        "Error",
                                        "Please fill all required fields",
                                        Colors.red);
                                  }
                                }
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
                    // SizedBox(height: 14.h),

                    SizedBox(height: MediaQuery.of(context).size.height * 0.1),
                  ],
                ),
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

  Widget _buildSectionHeader(String title, IconData icon) {
    return Container(
      margin: EdgeInsets.only(top: 10.h, bottom: 12.h),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18.sp, color: kPrimary),
              SizedBox(width: 8.w),
              Text(
                title,
                style: appStyle(16, kDark, FontWeight.bold),
              ),
            ],
          ),
          SizedBox(height: 6.h),
          Container(
            height: 2.h,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [kPrimary, kPrimary.withOpacity(0.1)],
              ),
              borderRadius: BorderRadius.circular(1),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    if (Get.isRegistered<AuthController>()) {
      Get.find<AuthController>().clearAllControllers();
    }
    super.dispose();
  }
}
