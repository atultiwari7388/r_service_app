import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';

class RequestHistoryCard extends StatelessWidget {
  const RequestHistoryCard({
    super.key,
    required this.shopName,
    this.time = "",
    this.distance = "",
    required this.rating,
    required this.payAdvance,
    this.isOrderCompleted = false,
    this.date = "",
    this.onAcceptTap,
  });

  final String shopName;
  final String time;
  final String distance;
  final String rating;
  final String payAdvance;
  final bool isOrderCompleted;
  final String date;
  final void Function()? onAcceptTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
      margin: EdgeInsets.all(5.h),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(12.w),
      ),
      child: Padding(
        padding: EdgeInsets.all(16.0.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            isOrderCompleted
                ? Row(
                    children: [
                      Expanded(
                        child: Text(
                          shopName,
                          style: appStyle(17, kDark, FontWeight.w500),
                        ),
                      ),
                      _buildInfoBox(date, kSecondary),
                      SizedBox(width: 10.w),
                      _buildRatingBox(rating)
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: Text(
                          shopName,
                          style: appStyle(17, kDark, FontWeight.w500),
                        ),
                      ),
                      _buildInfoBox(time, kPrimary),
                      SizedBox(width: 10.w),
                      _buildInfoBox(distance, kSecondary),
                      SizedBox(width: 10.w),
                      _buildRatingBox(rating)
                    ],
                  ),
            SizedBox(height: 8.h),
            Text(
              "All type of repairing services are available there",
              style: appStyle(13, kDark, FontWeight.normal),
            ),
            Container(
              padding: EdgeInsets.all(9.h),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12.r),
                color: kSecondary.withOpacity(0.1),
              ),
              child: Column(
                children: [
                  SizedBox(height: 16.h),
                  isOrderCompleted
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Text(
                              "Paid Amount",
                              style: appStyle(16, kDark, FontWeight.w500),
                            ),
                            Container(
                              height: 20.h,
                              width: 1.w,
                              color: kDark,
                              margin: EdgeInsets.symmetric(horizontal: 10.w),
                            ),
                            Text(
                              "\$$payAdvance",
                              style: appStyle(16, kDark, FontWeight.w500),
                            ),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Text(
                              "Pay Advance",
                              style: appStyle(16, kDark, FontWeight.w500),
                            ),
                            Container(
                              height: 20.h,
                              width: 1.w,
                              color: kDark,
                              margin: EdgeInsets.symmetric(horizontal: 10.w),
                            ),
                            Text(
                              "\$$payAdvance",
                              style: appStyle(16, kDark, FontWeight.w500),
                            ),
                          ],
                        ),
                  SizedBox(height: 15.h),
                  Center(
                    child: isOrderCompleted
                        ? Container(
                            width: 240.w,
                            height: 35.h,
                            decoration: BoxDecoration(
                                color: kSuccess,
                                borderRadius: BorderRadius.circular(10.r)),
                            child: Center(
                                child: Text("Completed",
                                    style: appStyle(
                                        16, kWhite, FontWeight.normal))),
                          )
                        : SizedBox(
                            width: 240.w,
                            height: 35.h,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kPrimary, // Button color
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0.r),
                                ),
                              ),
                              onPressed: onAcceptTap,
                              child: Text(
                                "Accept",
                                style:
                                    appStyle(14, Colors.white, FontWeight.bold),
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBox(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0.r),
      ),
      child: Text(
        text,
        style: appStyle(12, color, FontWeight.normal),
      ),
    );
  }

  Widget _buildRatingBox(String rating) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0.r),
      ),
      child: Row(
        children: [
          Icon(Icons.star, color: Colors.green, size: 16.w),
          SizedBox(width: 4.w),
          Text(
            rating,
            style: appStyle(12, kDark, FontWeight.normal),
          ),
        ],
      ),
    );
  }
}
