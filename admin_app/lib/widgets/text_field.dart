import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';

class TextFieldInputWidget extends StatelessWidget {
  const TextFieldInputWidget({
    Key? key,
    required this.hintText,
    required this.textEditingController,
    required this.textInputType,
    required this.icon,
    this.isPass = false,
    this.isIconApply = true,
    this.maxLines = 1,
    this.enabled = true,
    this.validator,
  }) : super(key: key);

  final String hintText;
  final TextEditingController textEditingController;
  final bool isPass;
  final TextInputType textInputType;
  final IconData icon;
  final bool isIconApply;
  final int maxLines;
  final bool enabled;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12.0), // Rounded corners
      borderSide: BorderSide(
        color: Colors.grey.shade300, // Border color
        width: 1.0,
      ),
    );

    return Container(
      margin: EdgeInsets.symmetric(vertical: 4.0.h),
      decoration: BoxDecoration(
        color: Colors.white, // White background
        borderRadius: BorderRadius.circular(12.0.r), // Rounded corners
      ),
      child: TextFormField(
        controller: textEditingController,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
            prefixIcon: isIconApply ? Icon(icon, color: kPrimary) : null,
            hintText: hintText,
            border: inputBorder,
            focusedBorder: inputBorder,
            enabledBorder: inputBorder,
            filled: true,
            enabled: enabled,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.all(8),
            hintStyle: appStyle(14, kGrayLight, FontWeight.normal)),
        keyboardType: textInputType,
        obscureText: isPass,
      ),
    );
  }
}
