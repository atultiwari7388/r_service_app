import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../utils/show_toast_msg.dart';
import '../../../widgets/text_field.dart';
import '../../auth/login_screen.dart';

class AddTeamMember extends StatefulWidget {
  const AddTeamMember({super.key});

  @override
  State<AddTeamMember> createState() => _AddTeamMemberState();
}

class _AddTeamMemberState extends State<AddTeamMember> {
  TextEditingController nameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController vehicleController = TextEditingController();
  TextEditingController passController = TextEditingController();

  var isUserAcCreated = false;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: ReusableText(
          text: "Add Member",
          style: appStyle(20, kDark, FontWeight.normal),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(height: 24.h),
              buildTextFieldInputWidget(
                "Enter member name",
                TextInputType.text,
                nameController,
                MaterialCommunityIcons.account,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member email",
                TextInputType.emailAddress,
                emailController,
                MaterialCommunityIcons.email,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member phone number",
                TextInputType.number,
                phoneController,
                MaterialCommunityIcons.phone,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member password",
                TextInputType.visiblePassword,
                passController,
                MaterialCommunityIcons.security,
                isPass: true,
              ),
              SizedBox(height: 15.h),
              SizedBox(height: 24.h),
              isUserAcCreated
                  ? CircularProgressIndicator()
                  : CustomButton(
                      text: "Add Member",
                      onPress: () => createMemberWithEmailAndPassword(),
                      color: kPrimary,
                    ),
              SizedBox(height: 24.h),
            ],
          ),
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

  Future<void> createMemberWithEmailAndPassword() async {
    if (nameController.text.isEmpty ||
        emailController.text.isEmpty ||
        phoneController.text.isEmpty ||
        passController.text.isEmpty) {
      showToastMessage("Error", "All fields are required", Colors.red);
      return;
    }

    final emailValid = RegExp(
        r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+\.[a-zA-Z]+");
    if (!emailValid.hasMatch(emailController.text)) {
      showToastMessage("Error", "Please enter a valid email", Colors.red);
      return;
    }

    isUserAcCreated = true;
    setState(() {});

    try {
      var user = await _auth.createUserWithEmailAndPassword(
        email: emailController.text,
        password: passController.text,
      );

      // Store the new team member in Firestore
      await _firestore.collection('Users').doc(user.user!.uid).set({
        "uid": user.user!.uid,
        "email": emailController.text.toString(),
        "active": true,
        "isTeamMember": true,
        "userName": nameController.text.toString(),
        "phoneNumber": phoneController.text.toString(),
        "address": addressController.text.toString(),
        "lastAddress": "",
        "profilePicture": "",
        "wallet": 0,
        "isNotificationOn": true,
        "created_at": DateTime.now(),
        "updated_at": DateTime.now(),
        'createdBy': currentUId, // ID of the current user
        'role': 'TMember',
      });

      // Continue with the flow as before
      await user.user!.sendEmailVerification();
      showToastMessage(
        "Verification Sent",
        "A verification email has been sent to ${emailController.text}.",
        Colors.orange,
      );
      // Get.back();
      // Sign out the newly created user immediately
      await _auth.signOut();

      // Go back or navigate to the login screen after signing out
      Get.offAll(() => const LoginScreen());
    } on FirebaseAuthException catch (e) {
      handleError(e);
    } finally {
      isUserAcCreated = false;
      setState(() {});
    }
  }

  void handleError(FirebaseAuthException e) {
    String errorMessage;
    switch (e.code) {
      case 'email-already-in-use':
        errorMessage = "The email is already in use by another account.";
        break;
      case 'invalid-email':
        errorMessage = "The email address is invalid.";
        break;
      case 'weak-password':
        errorMessage = "The password is too weak.";
        break;
      default:
        errorMessage = e.message ?? "An unknown error occurred.";
    }
    showToastMessage("Error", errorMessage, Colors.red);
  }
}
