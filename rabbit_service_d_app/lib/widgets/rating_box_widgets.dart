import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';

class RatingBoxWidget extends StatelessWidget {
  const RatingBoxWidget({
    super.key,
    required this.rating,
    this.iconData = Icons.star,
  });
  final String rating;
  final IconData iconData;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0.r),
      ),
      child: Row(
        children: [
          Icon(iconData, color: Colors.green, size: 16.w),
          SizedBox(width: 4.w),
          Text(
            rating,
            style: appStyle(13.sp, kDark, FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
