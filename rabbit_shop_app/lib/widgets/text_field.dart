import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_shop_app/utils/constants.dart';

class TextFieldInputWidget extends StatelessWidget {
  const TextFieldInputWidget({
    Key? key,
    required this.hintText,
    required this.textEditingController,
    required this.textInputType,
    required this.icon,
    this.isPass = false,
  }) : super(key: key);

  final String hintText;
  final TextEditingController textEditingController;
  final bool isPass;
  final TextInputType textInputType;
  final IconData icon;

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
      child: TextField(
        controller: textEditingController,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: kPrimary),
          hintText: hintText,
          border: inputBorder,
          focusedBorder: inputBorder,
          enabledBorder: inputBorder,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.all(8),
        ),
        keyboardType: textInputType,
        obscureText: isPass,
      ),
    );
  }
}


// import 'package:flutter/material.dart';
// import 'package:regal_service_d_app/utils/constants.dart';

// class TextFieldInputWidget extends StatelessWidget {
//   const TextFieldInputWidget({
//     Key? key,
//     required this.hintText,
//     required this.textEditingController,
//     required this.textInputType,
//     required this.icon,
//     this.isPass = false,
//   }) : super(key: key);

//   final String hintText;
//   final TextEditingController textEditingController;
//   final bool isPass;
//   final TextInputType textInputType;
//   final IconData icon;

//   @override
//   Widget build(BuildContext context) {
//     final inputBorder =
//         OutlineInputBorder(borderSide: Divider.createBorderSide(context));

//     return TextField(
//       controller: textEditingController,
//       decoration: InputDecoration(
//         prefixIcon: Icon(icon, color: kPrimary),
//         hintText: hintText,
//         border: inputBorder,
//         focusedBorder: inputBorder,
//         enabledBorder: inputBorder,
//         filled: true,
//         contentPadding: const EdgeInsets.all(8.0),
//       ),
//       keyboardType: textInputType,
//       obscureText: isPass,
//     );
//   }
// }
