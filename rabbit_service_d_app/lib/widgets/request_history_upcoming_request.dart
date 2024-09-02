import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';

class RequestAcceptHistoryCard extends StatelessWidget {
  const RequestAcceptHistoryCard({
    super.key,
    required this.shopName,
    this.time = "",
    this.distance = "",
    required this.rating,
    required this.arrivalCharges,
    required this.perHourCharges,
    this.imagePath = '',
    this.isAcceptVisible = true,
    this.isPayVisible = false,
    this.isConfirmVisible = false,
    this.isOngoingVisible = false,
    this.isHidden = false,
    this.onAcceptTap,
    this.onPayTap,
    this.onConfirmStartTap,
    this.onCallTap,
  });

  final String shopName;
  final String time;
  final String distance;
  final String rating;
  final String arrivalCharges;
  final String perHourCharges;
  final String imagePath;
  final bool isAcceptVisible;
  final bool isPayVisible;
  final bool isConfirmVisible;
  final bool isOngoingVisible;
  final bool isHidden;
  final void Function()? onAcceptTap;
  final void Function()? onPayTap;
  final void Function()? onConfirmStartTap;
  final void Function()? onCallTap;

  @override
  Widget build(BuildContext context) {
    if (isHidden)
      return SizedBox.shrink(); // Hide the widget if it's marked as hidden

    return Container(
      padding: EdgeInsets.all(12.w),
      margin: EdgeInsets.all(5.h),
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
                    // Shop name
                    Text(
                      shopName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    SizedBox(height: 4.h),
                    Row(
                      children: [
                        _buildInfoBox(time, Colors.red),
                        SizedBox(width: 6.w),
                        _buildInfoBox(distance, kPrimary),
                        SizedBox(width: 6.w),
                        _buildRatingBox(rating),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          // Arrival and per hour charges
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 12.h),
            margin: EdgeInsets.symmetric(horizontal: 12.w, vertical: 5.h),
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
                      "Arrival Charges",
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    Container(
                      height: 20.h,
                      width: 1.w,
                      color: kDark,
                      margin: EdgeInsets.symmetric(horizontal: 10.w),
                    ),
                    Text(
                      "\$$arrivalCharges",
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                  ],
                ),
                SizedBox(height: 5.h),
                Divider(),
                SizedBox(height: 5.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Per Hour Charges",
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    Container(
                      height: 20.h,
                      width: 1.w,
                      color: kDark,
                      margin: EdgeInsets.symmetric(horizontal: 10.w),
                    ),
                    Text(
                      "\$$perHourCharges",
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                  ],
                ),
                SizedBox(height: 15.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (isAcceptVisible)
                      buildButton(kSuccess, "Accept", onAcceptTap),
                    if (isPayVisible) buildButton(kSecondary, "Pay", onPayTap),
                    if (isConfirmVisible)
                      buildButton(
                          kPrimary, "Confirm to Start", onConfirmStartTap),
                    if (isOngoingVisible)
                      Text("Ongoing",
                          style:
                              TextStyle(color: Colors.green, fontSize: 16.sp)),
                    SizedBox(width: 8.w),
                    if (!isHidden)
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Color(0xff88532B), // Button color
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.0.r),
                            ),
                          ),
                          onPressed: onCallTap,
                          child: Text(
                            "Need to talk",
                            style:
                                appStyle(13.sp, Colors.white, FontWeight.bold),
                          ),
                        ),
                      ),
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

  Widget _buildInfoBox(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0.r),
      ),
      child: Text(
        text,
        style: appStyle(12.sp, color, FontWeight.normal),
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
            style: appStyle(12.sp, kDark, FontWeight.normal),
          ),
        ],
      ),
    );
  }
}



// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import '../../utils/app_styles.dart';
// import '../../utils/constants.dart';

// class RequestAcceptHistoryCard extends StatelessWidget {
//   const RequestAcceptHistoryCard({
//     super.key,
//     required this.shopName,
//     this.time = "",
//     this.distance = "",
//     required this.rating,
//     required this.arrivalCharges,
//     required this.perHourCharges,
//     this.imagePath = '',
//     this.onAcceptTap,
//     this.onCallTap,
//   });

//   final String shopName;
//   final String time;
//   final String distance;
//   final String rating;
//   final String arrivalCharges;
//   final String perHourCharges;
//   final String imagePath;
//   final void Function()? onAcceptTap;
//   final void Function()? onCallTap;

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       padding: EdgeInsets.all(12.w),
//       margin: EdgeInsets.all(5.h),
//       decoration: BoxDecoration(
//         color: kWhite,
//         borderRadius: BorderRadius.circular(12.w),
//         boxShadow: [
//           BoxShadow(
//             color: kSecondary.withOpacity(0.1),
//             blurRadius: 6.w,
//             offset: Offset(0, 2.h),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             children: [
//               // Shop image
//               CircleAvatar(
//                 radius: 24.w,
//                 backgroundImage: AssetImage(imagePath),
//               ),
//               SizedBox(width: 12.w),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     // Shop name
//                     Text(
//                       shopName,
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                     SizedBox(height: 4.h),
//                     Row(
//                       children: [
//                         _buildInfoBox(time, Colors.red),
//                         SizedBox(width: 6.w),
//                         _buildInfoBox(distance, kPrimary),
//                         SizedBox(width: 6.w),
//                         _buildRatingBox(rating),
//                       ],
//                     ),
//                   ],
//                 ),
//               ),
         
//             ],
//           ),
//           SizedBox(height: 12.h),
//           Container(
//             padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 12.h),
//             margin: EdgeInsets.symmetric(horizontal: 12.w, vertical: 5.h),
//             decoration: BoxDecoration(
//               color: kSecondary.withOpacity(0.1),
//               borderRadius: BorderRadius.circular(12.r),
//             ),
//             child: Column(
//               children: [
//                 Row(
//                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                   children: [
//                     Text(
//                       "Arrival Charges",
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                     Container(
//                       height: 20.h,
//                       width: 1.w,
//                       color: kDark,
//                       margin: EdgeInsets.symmetric(horizontal: 10.w),
//                     ),
//                     Text(
//                       "\$$arrivalCharges",
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                   ],
//                 ),
//                 SizedBox(height: 5.h),
//                 Divider(),
//                 SizedBox(height: 5.h),
//                 Row(
//                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                   children: [
//                     Text(
//                       "Per Hour Charges",
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                     Container(
//                       height: 20.h,
//                       width: 1.w,
//                       color: kDark,
//                       margin: EdgeInsets.symmetric(horizontal: 10.w),
//                     ),
//                     Text(
//                       "\$$perHourCharges",
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                   ],
//                 ),
//                 SizedBox(height: 15.h),
//                 Row(
//                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                   children: [
//                     Expanded(
//                       child: ElevatedButton(
//                         style: ElevatedButton.styleFrom(
//                           backgroundColor: kSuccess, // Button color
//                           shape: RoundedRectangleBorder(
//                             borderRadius: BorderRadius.circular(12.0.r),
//                           ),
//                         ),
//                         onPressed: onAcceptTap,
//                         child: Text(
//                           "Accept",
//                           style: appStyle(13.sp, Colors.white, FontWeight.bold),
//                         ),
//                       ),
//                     ),
//                     SizedBox(width: 8.w),
//                     Expanded(
//                       child: ElevatedButton(
//                         style: ElevatedButton.styleFrom(
//                           backgroundColor: Color(0xff88532B), // Button color
//                           shape: RoundedRectangleBorder(
//                             borderRadius: BorderRadius.circular(12.0.r),
//                           ),
//                         ),
//                         onPressed: onCallTap,
//                         child: Text(
//                           "Need to talk",
//                           style: appStyle(13.sp, Colors.white, FontWeight.bold),
//                         ),
//                       ),
//                     ),
//                   ],
//                 ),
//               ],
//             ),
//           ),
//           SizedBox(height: 12.h),
        
//         ],
//       ),
//     );
//   }

//   Widget _buildInfoBox(String text, Color color) {
//     return Container(
//       padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
//       decoration: BoxDecoration(
//         color: color.withOpacity(0.1),
//         borderRadius: BorderRadius.circular(8.0.r),
//       ),
//       child: Text(
//         text,
//         style: appStyle(12.sp, color, FontWeight.normal),
//       ),
//     );
//   }

//   Widget _buildRatingBox(String rating) {
//     return Container(
//       padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
//       decoration: BoxDecoration(
//         color: Colors.green.withOpacity(0.1),
//         borderRadius: BorderRadius.circular(8.0.r),
//       ),
//       child: Row(
//         children: [
//           Icon(Icons.star, color: Colors.green, size: 16.w),
//           SizedBox(width: 4.w),
//           Text(
//             rating,
//             style: appStyle(12.sp, kDark, FontWeight.normal),
//           ),
//         ],
//       ),
//     );
//   }


// }
