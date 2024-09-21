import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';

class DashBoardSearchTextField extends StatelessWidget {
  const DashBoardSearchTextField({
    super.key,
    required this.label,
    required this.controller,
    required this.enable,
  });

  final String label;
  final TextEditingController controller;
  final bool enable;

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
        controller: controller,
        readOnly: !enable, // Disable interaction but keep style intact
        decoration: InputDecoration(
          labelText: label,
          border: inputBorder,
          focusedBorder: inputBorder,
          enabledBorder: inputBorder,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.all(8),
          hintStyle: appStyle(14, kDark, FontWeight.normal),
          labelStyle: appStyle(14, kSecondary, FontWeight.bold),
        ),
      ),
    );
  }
}



// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import '../utils/app_styles.dart';
// import '../utils/constants.dart';

// class DashBoardSearchTextField extends StatelessWidget {
//   const DashBoardSearchTextField({
//     super.key,
//     required this.label,
//     // required this.hint,
//     required this.controller,
//     required this.enable,
//   });

//   final String label;
//   // final String hint;
//   final TextEditingController controller;
//   final bool enable;

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
//       child: TextField(
//         controller: controller,
//         decoration: InputDecoration(
//           enabled: enable,
//           labelText: label,
//           // hintText: hint,
//           border: inputBorder,
//           focusedBorder: inputBorder,
//           enabledBorder: inputBorder,
//           filled: true,
//           fillColor: Colors.white,
//           contentPadding: const EdgeInsets.all(8),
//           hintStyle: appStyle(14, kDark, FontWeight.normal),
//           labelStyle: appStyle(14, kSecondary, FontWeight.bold),
//         ),
//       ),
//     );
//   }
// }
