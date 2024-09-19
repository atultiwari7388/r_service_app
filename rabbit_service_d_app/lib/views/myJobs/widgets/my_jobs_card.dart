import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/views/history/widgets/history_completed_screen.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/rating_box_widgets.dart';

class MyJobsCard extends StatefulWidget {
  const MyJobsCard({
    super.key,
    required this.companyNameAndVehicleName,
    required this.address,
    required this.serviceName,
    required this.jobId,
    this.imagePath = "",
    required this.dateTime,
    this.isStatusCompleted = false,
    this.onButtonTap,
    this.onCancelBtnTap,
    required this.currentStatus,
  });

  final String companyNameAndVehicleName;
  final String address;
  final String serviceName;
  final String jobId;
  final String imagePath;
  final String dateTime;
  final bool isStatusCompleted;
  final void Function()? onButtonTap;
  final void Function()? onCancelBtnTap;
  final int currentStatus;

  @override
  State<MyJobsCard> createState() => _MyJobsCardState();
}

class _MyJobsCardState extends State<MyJobsCard> {
  late Timer _timer;
  int _remainingTime = 5 * 60; // 25 minutes in seconds

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  void startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingTime > 0) {
        setState(() {
          _remainingTime--;
        });
      } else {
        _timer.cancel();
      }
    });
  }

  String getFormattedTime() {
    int minutes = _remainingTime ~/ 60;
    int seconds = _remainingTime % 60;
    String formattedMinutes = minutes.toString().padLeft(2, '0');
    String formattedSeconds = seconds.toString().padLeft(2, '0');
    return '$formattedMinutes:$formattedSeconds';
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

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
                backgroundImage: NetworkImage(widget.imagePath),
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
                        Text(widget.jobId,
                            style: appStyle(12, kSecondary, FontWeight.bold)),
                        Text(widget.dateTime,
                            style: appStyle(13, kGray, FontWeight.bold)),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    //company Name
                    Text(
                      widget.companyNameAndVehicleName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    SizedBox(height: 4.h),
                    SizedBox(
                      width: 250,
                      child: Text(
                        widget.address,
                        maxLines: 2,
                        style: appStyle(15.sp, kGray, FontWeight.bold),
                      ),
                    ),
                    SizedBox(height: 4.h),

                    widget.currentStatus == -1
                        ? SizedBox()
                        : widget.currentStatus == 5
                            ? SizedBox()
                            : SizedBox(
                                width: 120.w,
                                child: RatingBoxWidget(
                                  rating: getFormattedTime(),
                                  iconData: Icons.timer,
                                ),
                              )
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
                buildReusableRow("Selected Service", "${widget.serviceName}"),
                SizedBox(height: 15.h),
                widget.currentStatus == -1
                    ? Container(
                        height: 40.h,
                        width: 320.w,
                        decoration: BoxDecoration(
                            color: kPrimary,
                            borderRadius: BorderRadius.circular(12.r)),
                        child: Center(
                          child: Text(
                            "Canceled",
                            style: appStyle(15.sp, kWhite, FontWeight.bold),
                          ),
                        ),
                      )
                    : Row(
                        children: [
                          widget.currentStatus == 5
                              ? buildButton(kSuccess, "Completed",
                                  () => Get.to(() => HistoryCompletedScreen(orderId: widget.jobId)))
                              : buildButton(
                                  kSecondary, "View", widget.onButtonTap),
                          SizedBox(width: 20.w),
                          widget.currentStatus == 1
                              ? buildButton(
                                  kRed,
                                  "Cancel",
                                  widget.onCancelBtnTap,
                                )
                              : SizedBox()
                        ],
                      ),
              ],
            ),
          ),
          SizedBox(height: 12.h),

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

  Row buildReusableRow(String text1, String text2) {
    return Row(
      // mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          text1,
          maxLines: 2,
          style: appStyle(16.sp, kDark, FontWeight.w500),
        ),
        SizedBox(width: 20.w),
        SizedBox(
          width: 155.w,
          child: Text(
            text2,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: appStyle(13.sp, kSecondary, FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
