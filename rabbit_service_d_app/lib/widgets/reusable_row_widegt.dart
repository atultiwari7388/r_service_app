import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';

class ReusableRowWidget extends StatelessWidget {
  const ReusableRowWidget(
      {super.key, required this.headingName, required this.onTap});
  final String headingName;
  final void Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Padding(
          padding: EdgeInsets.only(top: 10.h),
          child:
              Text(headingName, style: appStyle(18, kDark, FontWeight.normal)),
        ),
        GestureDetector(
          onTap: onTap,
          child: Padding(
              padding: EdgeInsets.only(top: 10.h, right: 12.w),
              child: const Icon(Icons.arrow_forward_ios,
                  color: kPrimary, size: 18)),
        ),
      ],
    );
  }
}
