import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/controllers/authentication_controller.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/auth/login_screen.dart';
import 'package:regal_shop_app/widgets/custom_button.dart';
import 'package:regal_shop_app/widgets/reusable_text.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/text_field.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GetBuilder<AuthController>(
          init: AuthController(),
          builder: (controller) {
            if (!controller.isUserAcCreated) {
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
                    child: Container(
                      padding: EdgeInsets.symmetric(
                          horizontal: 20.w, vertical: 10.h),
                      margin: EdgeInsets.symmetric(
                          horizontal: 20.w, vertical: 10.h),
                      child: Form(
                        key: controller.formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: 20.h),
                            Center(
                              child: ReusableText(
                                text: "Sign up",
                                style:
                                    appStyle(34, kPrimary, FontWeight.normal),
                              ),
                            ),
                            SizedBox(height: 24.h),

                            // Name Field
                            buildTextFieldInputWidget(
                              "Your Name*",
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

                            // Workshop Name Field
                            buildTextFieldInputWidget(
                              "Workshop Name*",
                              TextInputType.text,
                              controller.workshopNameController,
                              MaterialCommunityIcons.store,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter workshop name";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Cell Phone Field
                            buildTextFieldInputWidget(
                              "Cell Phone*",
                              TextInputType.phone,
                              controller.cellPhoneController,
                              MaterialCommunityIcons.phone,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter cell phone number";
                                }
                                if (value.length < 10) {
                                  return "Please enter a valid phone number";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Telephone Field (Optional)
                            buildTextFieldInputWidget(
                              "Telephone",
                              TextInputType.phone,
                              controller.telephoneController,
                              MaterialCommunityIcons.phone_classic,
                            ),
                            SizedBox(height: 15.h),

                            // Email Field
                            buildTextFieldInputWidget(
                              "Your Email*",
                              TextInputType.emailAddress,
                              controller.emailController,
                              MaterialCommunityIcons.email,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter your email";
                                }
                                if (!GetUtils.isEmail(value)) {
                                  return "Please enter a valid email";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Address Field
                            buildTextFieldInputWidget(
                              "Address",
                              TextInputType.streetAddress,
                              controller.addressController,
                              MaterialCommunityIcons.home,
                            ),
                            SizedBox(height: 15.h),

                            // City Field
                            buildTextFieldInputWidget(
                              "City*",
                              TextInputType.text,
                              controller.cityController,
                              MaterialCommunityIcons.city,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter your city";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // State Field
                            buildTextFieldInputWidget(
                              "State*",
                              TextInputType.text,
                              controller.stateController,
                              MaterialCommunityIcons.map_marker,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter your state";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Country Field
                            buildTextFieldInputWidget(
                              "Country*",
                              TextInputType.text,
                              controller.countryController,
                              MaterialCommunityIcons.earth,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter your country";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Postal Code Field
                            buildTextFieldInputWidget(
                              "Postal / Zip Code",
                              TextInputType.text,
                              controller.postalCodeController,
                              MaterialCommunityIcons.zip_box,
                            ),
                            SizedBox(height: 15.h),

                            // Date of Birth Field
                            buildTextFieldInputWidget(
                              "Date of Birth",
                              TextInputType.datetime,
                              controller.dateOfBirthController,
                              MaterialCommunityIcons.cake,
                            ),
                            SizedBox(height: 15.h),

                            // Experience Field
                            buildTextFieldInputWidget(
                              "Experience (in years)",
                              TextInputType.number,
                              controller.experienceController,
                              MaterialCommunityIcons.briefcase,
                            ),
                            SizedBox(height: 15.h),

                            // Description Field
                            buildTextFieldInputWidget(
                              "Description (Describe your business in a few words)",
                              TextInputType.multiline,
                              controller.descriptionController,
                              MaterialCommunityIcons.text,
                              maxLines: 3,
                            ),
                            SizedBox(height: 15.h),

                            // Per Hour Charge Field
                            buildTextFieldInputWidget(
                              "Per Hour Charge*",
                              TextInputType.number,
                              controller.perHourCharge,
                              FontAwesome5Solid.dollar_sign,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter per hour charge";
                                }
                                if (int.tryParse(value) == null) {
                                  return "Please enter a valid number";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Password Field
                            buildTextFieldInputWidget(
                              "Your Password*",
                              TextInputType.visiblePassword,
                              controller.passController,
                              MaterialCommunityIcons.security,
                              isPass: true,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Please enter your password";
                                }
                                if (value.length < 6) {
                                  return "Password must be at least 6 characters";
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 15.h),

                            // Language Section
                            Text(
                              "Select Languages You Speak",
                              style: appStyle(16, kDark, FontWeight.w600),
                            ),
                            SizedBox(height: 10.h),
                            Container(
                              height: 180.h,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                              child: Scrollbar(
                                thumbVisibility: true,
                                controller: controller.scrollController,
                                child: ListView.builder(
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  itemCount: controller.languages.length,
                                  itemBuilder: (context, index) {
                                    return CheckboxListTile(
                                      contentPadding: EdgeInsets.zero,
                                      title: Text(controller.languages[index]),
                                      value: controller.selectedLanguages[
                                          controller.languages[index]],
                                      onChanged: (bool? value) {
                                        setState(() {
                                          controller.selectedLanguages[
                                                  controller.languages[index]] =
                                              value!;
                                        });
                                      },
                                      controlAffinity:
                                          ListTileControlAffinity.leading,
                                      activeColor: kPrimary,
                                    );
                                  },
                                ),
                              ),
                            ),
                            SizedBox(height: 15.h),

                            // Terms and Conditions
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
                                      style: appStyle(
                                          12, kPrimary, FontWeight.w500),
                                      recognizer: TapGestureRecognizer()
                                        ..onTap = () {
                                          // Handle tap for Terms of Services
                                          print("Terms of Services tapped");
                                        },
                                    ),
                                    TextSpan(
                                      text: " and ",
                                      style:
                                          appStyle(12, kDark, FontWeight.w500),
                                    ),
                                    TextSpan(
                                      text: "Privacy Policy.",
                                      style: appStyle(
                                          12, kPrimary, FontWeight.w500),
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

                            // Register Button
                            CustomButton(
                              text: "Create Account",
                              onPress: controller.isUserAcCreated
                                  ? null
                                  : () {
                                      if (controller.formKey.currentState !=
                                              null &&
                                          controller.formKey.currentState!
                                              .validate()) {
                                        // Check if at least one language is selected
                                        bool isLanguageSelected = controller
                                            .selectedLanguages.values
                                            .any((isSelected) => isSelected);

                                        if (!isLanguageSelected) {
                                          showToastMessage(
                                              "Error",
                                              "Please select at least one language",
                                              Colors.red);
                                          return;
                                        }

                                        controller
                                            .createUserWithEmailAndPassword();
                                      } else {
                                        showToastMessage(
                                            "Error",
                                            "Please fill all required fields correctly",
                                            Colors.red);
                                      }
                                    },
                              color: kPrimary,
                            ),
                            SizedBox(height: 24.h),

                            // Login Redirect
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ReusableText(
                                    text: "Joined us before?",
                                    style:
                                        appStyle(14, kDark, FontWeight.w500)),
                                SizedBox(width: 5.w),
                                GestureDetector(
                                  onTap: () =>
                                      Get.to(() => const LoginScreen()),
                                  child: ReusableText(
                                      text: "Login",
                                      style: appStyle(
                                          14, kPrimary, FontWeight.bold)),
                                ),
                              ],
                            ),
                            SizedBox(height: 20.h),
                          ],
                        ),
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
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFieldInputWidget(
      hintText: hintText,
      textInputType: type,
      textEditingController: controller,
      icon: icon,
      isPass: isPass,
      maxLines: maxLines,
      validator: validator,
    );
  }
}

// import 'package:flutter/gestures.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:flutter_vector_icons/flutter_vector_icons.dart';
// import 'package:get/get.dart';
// import 'package:regal_shop_app/controllers/authentication_controller.dart';
// import 'package:regal_shop_app/utils/app_styles.dart';
// import 'package:regal_shop_app/utils/constants.dart';
// import 'package:regal_shop_app/views/auth/login_screen.dart';
// import 'package:regal_shop_app/widgets/custom_button.dart';
// import 'package:regal_shop_app/widgets/reusable_text.dart';
// import '../../utils/show_toast_msg.dart';
// import '../../widgets/text_field.dart';

// class RegistrationScreen extends StatefulWidget {
//   const RegistrationScreen({super.key});

//   @override
//   State<RegistrationScreen> createState() => _RegistrationScreenState();
// }

// class _RegistrationScreenState extends State<RegistrationScreen> {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       resizeToAvoidBottomInset: true,
//       body: GetBuilder<AuthController>(
//           init: AuthController(),
//           builder: (controller) {
//             if (!controller.isUserAcCreated) {
//               return Stack(
//                 children: [
//                   Positioned(
//                     top: -100.h,
//                     left: -100.w,
//                     child: Container(
//                       width: 300.w,
//                       height: 300.h,
//                       decoration: BoxDecoration(
//                         color: kPrimary.withOpacity(0.3),
//                         borderRadius: BorderRadius.circular(150),
//                       ),
//                     ),
//                   ),
//                   Positioned(
//                     bottom: -100.h,
//                     right: -100.w,
//                     child: Container(
//                       width: 300.w,
//                       height: 300.h,
//                       decoration: BoxDecoration(
//                         color: kSecondary.withOpacity(0.3),
//                         borderRadius: BorderRadius.circular(150),
//                       ),
//                     ),
//                   ),
//                   SingleChildScrollView(
//                     child: Container(
//                       padding: EdgeInsets.symmetric(
//                           horizontal: 20.w, vertical: 10.h),
//                       margin: EdgeInsets.symmetric(
//                           horizontal: 20.w, vertical: 10.h),
//                       child: Form(
//                         key: controller.formKey,
//                         child: Column(
//                           crossAxisAlignment: CrossAxisAlignment.start,
//                           children: [
//                             SizedBox(height: 20.h),
//                             Center(
//                               child: ReusableText(
//                                 text: "Sign up",
//                                 style: appStyle(34, kPrimary, FontWeight.normal),
//                               ),
//                             ),
//                             SizedBox(height: 24.h),
//                             buildTextFieldInputWidget(
//                               "Your Name/Company Name",
//                               TextInputType.text,
//                               controller.nameController,
//                               MaterialCommunityIcons.account,
//                               validator: (value) {
//                                 if (value == null || value.isEmpty) {
//                                   return "Please enter your name";
//                                 }
//                                 return null;
//                               },
//                             ),
//                             SizedBox(height: 15.h),
//                             buildTextFieldInputWidget(
//                               "Your Email",
//                               TextInputType.emailAddress,
//                               controller.emailController,
//                               MaterialCommunityIcons.email,
//                               validator: (value) {
//                                 if (value == null || !GetUtils.isEmail(value)) {
//                                   return "Please enter a valid email";
//                                 }
//                                 return null;
//                               },
//                             ),
//                             SizedBox(height: 15.h),
//                             buildTextFieldInputWidget(
//                               "Your Address",
//                               TextInputType.streetAddress,
//                               controller.addressController,
//                               MaterialCommunityIcons.home,
//                             ),
//                             SizedBox(height: 15.h),
//                             buildTextFieldInputWidget(
//                               "Per Hour Charge",
//                               TextInputType.number,
//                               controller.perHourCharge,
//                               FontAwesome5Solid.dollar_sign,
//                               // validator: (value) {
//                               //   if (value == null || value.length != 2) {
//                               //     return "Please enter a value like 10/20";
//                               //   }
//                               //   return null;
//                               // },
//                             ),
//                             SizedBox(height: 15.h), // Adjust this value as needed
//                             buildTextFieldInputWidget(
//                               "Your Phone Number",
//                               TextInputType.number,
//                               controller.phoneNumberController,
//                               MaterialCommunityIcons.phone,
//                               validator: (value) {
//                                 if (value == null || value.length != 10) {
//                                   return "Please enter a valid phone number";
//                                 }
//                                 return null;
//                               },
//                             ),
//                             SizedBox(height: 15.h),
//                             buildTextFieldInputWidget(
//                               "Your Password",
//                               TextInputType.visiblePassword,
//                               controller.passController,
//                               MaterialCommunityIcons.security,
//                               isPass: true,
//                               validator: (value) {
//                                 if (value == null || value.length < 6) {
//                                   return "Password must be at least 6 characters";
//                                 }
//                                 return null;
//                               },
//                             ),
//                             SizedBox(height: 15.h),
//                             SizedBox(height: 15.h),
//                             Text("Select Language"),
//                             SizedBox(height: 15.h),
//                             // Language checkbox section
//                             Container(
//                               height: 180.h, // Fixed height for the container
//                               decoration: BoxDecoration(
//                                 // border: Border.all(color: kPrimary),
//                                 borderRadius: BorderRadius.circular(8.r),
//                               ),
//                               child: Scrollbar(
//                                 thumbVisibility: true,
//                                 controller: controller.scrollController,
//                                 child: ListView.builder(
//                                   padding: EdgeInsets.zero,
//                                   shrinkWrap: true,
//                                   // physics: const NeverScrollableScrollPhysics(),
//                                   itemCount: controller.languages.length,
//                                   itemBuilder: (context, index) {
//                                     return CheckboxListTile(
//                                       contentPadding: EdgeInsets.zero,
//                                       title: Text(controller.languages[index]),
//                                       value: controller.selectedLanguages[
//                                           controller.languages[index]],
//                                       onChanged: (bool? value) {
//                                         setState(() {
//                                           controller.selectedLanguages[controller
//                                               .languages[index]] = value!;
//                                         });
//                                       },
//                                       controlAffinity:
//                                           ListTileControlAffinity.leading,
//                                       activeColor: kPrimary,
//                                     );
//                                   },
//                                 ),
//                               ),
//                             ),

//                             SizedBox(
//                               width: 260.w,
//                               child: RichText(
//                                 textAlign: TextAlign.center,
//                                 text: TextSpan(
//                                   text: "By continuing, you agree to our ",
//                                   style: appStyle(12, kDark, FontWeight.w500),
//                                   children: <TextSpan>[
//                                     TextSpan(
//                                       text: "Terms of Services",
//                                       style:
//                                           appStyle(12, kPrimary, FontWeight.w500),
//                                       recognizer: TapGestureRecognizer()
//                                         ..onTap = () {
//                                           // Handle tap for Terms of Services
//                                           print("Terms of Services tapped");
//                                         },
//                                     ),
//                                     TextSpan(
//                                       text: " and ",
//                                       style: appStyle(12, kDark, FontWeight.w500),
//                                     ),
//                                     TextSpan(
//                                       text: "Privacy Policy.",
//                                       style:
//                                           appStyle(12, kPrimary, FontWeight.w500),
//                                       recognizer: TapGestureRecognizer()
//                                         ..onTap = () {
//                                           // Handle tap for Privacy Policy
//                                           print("Privacy Policy tapped");
//                                         },
//                                     ),
//                                   ],
//                                 ),
//                               ),
//                             ),
//                             SizedBox(height: 24.h),
//                             CustomButton(
//                               text: "Continue",
//                               onPress: controller.isUserAcCreated
//                                   ? null
//                                   : () {
//                                       // controller.createUserWithEmailAndPassword();

//                                       if (controller.formKey.currentState !=
//                                               null &&
//                                           controller.formKey.currentState!
//                                               .validate()) {
//                                         controller
//                                             .createUserWithEmailAndPassword();
//                                       } else {
//                                         showToastMessage(
//                                             "Error",
//                                             "Please enter valid inputs",
//                                             Colors.red);
//                                       }
//                                     },
//                               color: kPrimary,
//                             ),
//                             SizedBox(height: 24.h),
//                             Row(
//                               mainAxisAlignment: MainAxisAlignment.center,
//                               children: [
//                                 ReusableText(
//                                     text: "Joined us before?",
//                                     style: appStyle(14, kDark, FontWeight.w500)),
//                                 SizedBox(width: 5.w),
//                                 GestureDetector(
//                                   onTap: () => Get.to(() => const LoginScreen()),
//                                   child: ReusableText(
//                                       text: "Login",
//                                       style: appStyle(
//                                           14, kPrimary, FontWeight.bold)),
//                                 ),
//                               ],
//                             ),
//                           ],
//                         ),
//                       ),
//                     ),
//                   ),
//                 ],
//               );
//             } else {
//               return Center(child: CircularProgressIndicator());
//             }
//           }),
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
