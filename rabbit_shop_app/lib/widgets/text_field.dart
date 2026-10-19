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
    this.isEnabled = true,
    this.isIconApply = true,
    this.maxLines = 1,
    this.validator,
    this.obscureText = true,
    this.onToggleObscureText,
  }) : super(key: key);

  final String hintText;
  final TextEditingController textEditingController;
  final bool isPass;
  final bool isEnabled;
  final TextInputType textInputType;
  final IconData icon;
  final bool isIconApply;
  final int maxLines;
  final String? Function(String?)? validator;
  final bool obscureText;
  final VoidCallback? onToggleObscureText;

  @override
  Widget build(BuildContext context) {
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12.0),
      borderSide: BorderSide(
        color: Colors.grey.shade300,
        width: 1.0,
      ),
    );

    return Container(
      margin: EdgeInsets.symmetric(vertical: 4.0.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.0.r),
      ),
      child: TextFormField(
        validator: validator,
        controller: textEditingController,
        maxLines: maxLines,
        enabled: isEnabled,
        decoration: InputDecoration(
          prefixIcon: isIconApply ? Icon(icon, color: kPrimary) : null,
          hintText: hintText,
          border: inputBorder,
          focusedBorder: inputBorder,
          enabledBorder: inputBorder,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.all(8),
          hintStyle: appStyle(14, kGrayLight, FontWeight.normal),
          suffixIcon: isPass && onToggleObscureText != null
              ? IconButton(
                  icon: Icon(
                    obscureText ? Icons.visibility_off : Icons.visibility,
                    color: kPrimary,
                  ),
                  onPressed: onToggleObscureText,
                )
              : null,
        ),
        keyboardType: textInputType,
        obscureText: isPass ? obscureText : false,
      ),
    );
  }
}

// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import '../utils/app_styles.dart';
// import '../utils/constants.dart';

// class TextFieldInputWidget extends StatelessWidget {
//   const TextFieldInputWidget({
//     Key? key,
//     required this.hintText,
//     required this.textEditingController,
//     required this.textInputType,
//     required this.icon,
//     this.isPass = false,
//     this.isEnabled = true,
//     this.isIconApply = true,
//     this.maxLines = 1,
//     this.validator,
//   }) : super(key: key);

//   final String hintText;
//   final TextEditingController textEditingController;
//   final bool isPass;
//   final bool isEnabled;
//   final TextInputType textInputType;
//   final IconData icon;
//   final bool isIconApply;
//   final int maxLines;
//   final String? Function(String?)? validator;

//   @override
//   Widget build(BuildContext context) {
//     final inputBorder = OutlineInputBorder(
//       borderRadius: BorderRadius.circular(12.0), // Rounded corners
//       borderSide: BorderSide(
//         color: Colors.grey.shade300, // Border color
//         width: 1.0,
//       ),
//     );

//     return Container(
//       margin: EdgeInsets.symmetric(vertical: 4.0.h),
//       decoration: BoxDecoration(
//         color: Colors.white, // White background
//         borderRadius: BorderRadius.circular(12.0.r), // Rounded corners
//       ),
//       child: TextFormField(
//         validator: validator,
//         controller: textEditingController,
//         maxLines: maxLines,
//         enabled: isEnabled,
//         decoration: InputDecoration(
//             prefixIcon: isIconApply ? Icon(icon, color: kPrimary) : null,
//             hintText: hintText,
//             border: inputBorder,
//             focusedBorder: inputBorder,
//             enabledBorder: inputBorder,
//             filled: true,
//             fillColor: Colors.white,
//             contentPadding: const EdgeInsets.all(8),
//             hintStyle: appStyle(14, kGrayLight, FontWeight.normal)),
//         keyboardType: textInputType,
//         obscureText: isPass,
//       ),
//     );
//   }
// }
