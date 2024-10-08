import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';

class MyJobsCard extends StatelessWidget {
  const MyJobsCard({
    super.key,
    required this.companyNameAndVehicleName,
    required this.address,
    required this.serviceName,
    required this.jobId,
    this.imagePath = "",
    required this.dateTime,
    this.isStatusCompleted = false,
  });

  final String companyNameAndVehicleName;
  final String address;
  final String serviceName;
  final String jobId;
  final String imagePath;
  final String dateTime;
  final bool isStatusCompleted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(5.w),
      margin: EdgeInsets.all(2.h),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(12.w),
        boxShadow: [
          BoxShadow(
            color: kSecondary.withOpacity(0.1),
            blurRadius: 6.w,
            offset: Offset(0, 2.h),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Shop image
              CircleAvatar(
                radius: 24.w,
                backgroundImage: AssetImage(imagePath),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // id

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(jobId,
                            style: appStyle(12, kSecondary, FontWeight.bold)),
                        Text(dateTime,
                            style: appStyle(12, kGray, FontWeight.w500)),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    //company Name
                    Text(
                      companyNameAndVehicleName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),

                    SizedBox(height: 4.h),

                    SizedBox(
                      width: 250,
                      child: Text(
                        address,
                        maxLines: 2,
                        style: appStyle(12.sp, kGray, FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          // Arrival and per hour charges
          Container(
            padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 12.h),
            margin: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
            decoration: BoxDecoration(
              color: kSecondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Selected Service :  $serviceName",
                      maxLines: 2,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                  ],
                ),
                SizedBox(height: 15.h),
                Row(
                  children: [
                    isStatusCompleted
                        ? buildButton(kSuccess, "Completed",
                            () {})
                        : buildButton(
                            kSecondary,
                            "View",
                            () {}),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 12.h),

          SizedBox(height: 10.h),
          // Call button
        ],
      ),
    );
  }

  Expanded buildButton(Color color, String text, void Function()? onTap) {
    return Expanded(
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: color, // Button color
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0.r),
          ),
        ),
        onPressed: onTap,
        child: Text(
          text,
          style: appStyle(13.sp, Colors.white, FontWeight.bold),
        ),
      ),
    );
  }
}
