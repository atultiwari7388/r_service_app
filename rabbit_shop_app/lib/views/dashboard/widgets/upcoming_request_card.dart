import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_shop_app/services/make_call.dart';
import 'package:regal_shop_app/widgets/info_box.dart';
import 'package:regal_shop_app/widgets/rating_box.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';

class UpcomingRequestCard extends StatelessWidget {
  const UpcomingRequestCard({
    super.key,
    required this.userName,
    required this.vehicleName,
    this.companyNameAndVehicleName = "",
    required this.address,
    required this.serviceName,
    required this.jobId,
    this.imagePath = "",
    required this.date,
    this.isStatusCompleted = false,
    this.onButtonTap,
    this.currentStatus = 0,
    required this.buttonName,
    this.onCompletedButtonTap,
    this.rating = '',
    required this.arrivalCharges,
  });

  final String userName;
  final String vehicleName;
  final String companyNameAndVehicleName;
  final String address;
  final String serviceName;
  final String jobId;
  final String imagePath;
  final String date;
  final bool isStatusCompleted;
  final void Function()? onButtonTap;
  final void Function()? onCompletedButtonTap;
  final int currentStatus;
  final String buttonName;
  final String rating;
  final String arrivalCharges;

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
                        InfoBoxWidget(text: "5 km", color: kPrimary),
                        RatingBoxWidget(rating: rating),
                        Text(date, style: appStyle(12, kGray, FontWeight.w500)),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    //company Name
                    Text(
                      userName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),

                    SizedBox(height: 4.h),

                    SizedBox(
                      width: 250.w,
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
            padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
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
                SizedBox(height: 5.h),
                currentStatus == 0
                    ? Column(
                        children: [
                          buildReusableRow("Vehicle", "$vehicleName"),
                        ],
                      )
                    : currentStatus == 1
                        ? Column(
                            children: [
                              buildReusableRow(
                                  "Vehicle", "$companyNameAndVehicleName"),
                              buildReusableRow(
                                  "Arrival Charges", "\$$arrivalCharges"),
                            ],
                          )
                        : currentStatus == 2
                            ? Column(
                                children: [
                                  buildReusableRow(
                                      "Vehicle", "$companyNameAndVehicleName"),
                                  buildReusableRow(
                                      "Arrival Charges", "\$$arrivalCharges"),
                                ],
                              )
                            : currentStatus == 3
                                ? Column(
                                    children: [
                                      buildReusableRow("Vehicle",
                                          "$companyNameAndVehicleName"),
                                      buildReusableRow("Arrival Charges",
                                          "\$$arrivalCharges"),
                                    ],
                                  )
                                : SizedBox(),

                SizedBox(height: 10.h),
                //Interested Button
                currentStatus == 0
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          buildButton(kPrimary, buttonName, onButtonTap),
                          SizedBox(width: 10.w),
                          // buildButton(kSecondary, "Call",
                          //         () => makePhoneCall("+918989898989")),
                        ],
                      )
                    : currentStatus == 1
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              buildButton(kPrimary, buttonName, onButtonTap),
                              SizedBox(width: 10.w),
                              buildButton(kSecondary, "Call",
                                  () => makePhoneCall("+918989898989")),
                              SizedBox(width: 10.w),
                              CircleAvatar(
                                  radius: 25.r,
                                  backgroundColor: kSuccess,
                                  child: Icon(Icons.directions, color: kWhite)),
                            ],
                          )
                        : currentStatus == 2
                            ? Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  buildButton(kOrange, "Complete Now",
                                      onCompletedButtonTap),
                                  SizedBox(width: 10.w),
                                  // buildButton(kSecondary, "Call",
                                  //     () => makePhoneCall("+918989898989")),
                                ],
                              )
                            : currentStatus == 3
                                ? Container(
                                    height: 40.h,
                                    width: 220.w,
                                    decoration: BoxDecoration(
                                      color: kSuccess.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12.r),
                                    ),
                                    child: Center(
                                      child: Text("Completed",
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              color: kSuccess,
                                              fontSize: 16.sp,
                                              fontWeight: FontWeight.w500)),
                                    ),
                                  )
                                : SizedBox()
                //
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
          width: 170.w,
          child: Text(
            text2,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: appStyle(13.sp, kSecondary, FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
