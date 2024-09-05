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

import '../../../widgets/text_field.dart';

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
      body: Padding(
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
            CustomButton(
              text: "Add Member",
              onPress: () {},
              color: kPrimary,
            ),
            SizedBox(height: 24.h),
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
