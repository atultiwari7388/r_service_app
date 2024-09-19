import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../utils/show_toast_msg.dart';

class RequestAcceptHistoryCard extends StatelessWidget {
  const RequestAcceptHistoryCard({
    super.key,
    required this.shopName,
    this.time = "",
    this.distance = "",
    required this.rating,
    required this.arrivalCharges,
    this.fixCharges = "",
    this.perHourCharges = "",
    this.imagePath = '',
    this.isHidden = false,
    required this.jobId,
    required this.userId,
    required this.mId,
    this.onCallTap,
    this.languages = const [],
    required this.currentStatus,
    required this.isImage,
  });

  final String shopName;
  final String time;
  final String distance;
  final String rating;
  final String arrivalCharges;
  final String fixCharges;
  final String perHourCharges;
  final String imagePath;
  final bool isHidden;
  final String jobId;
  final String userId;
  final String mId;
  final void Function()? onCallTap;
  final List<dynamic> languages;
  final int currentStatus;
  final bool isImage;

  @override
  Widget build(BuildContext context) {
    if (isHidden) return SizedBox.shrink();

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
              CircleAvatar(
                radius: 24.w,
                backgroundImage: NetworkImage(imagePath),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shopName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    SizedBox(height: 4.h),
                    Row(
                      children: [
                        _buildInfoBox("$time mints", Colors.red),
                        SizedBox(width: 6.w),
                        _buildInfoBox(distance, kPrimary),
                        SizedBox(width: 6.w),
                        _buildRatingBox(rating),
                      ],
                    ),
                    SizedBox(height: 5.h),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (int i = 0; i < languages.length; i++) ...[
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 10.w, vertical: 4.h),
                              margin: EdgeInsets.only(right: 4.w),
                              decoration: BoxDecoration(
                                color: i.isEven
                                    ? kPrimary.withOpacity(0.1)
                                    : kSecondary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8.0.r),
                              ),
                              child: Text(
                                languages[i],
                                style: appStyle(
                                    13.sp,
                                    i.isEven ? kPrimary : kSecondary,
                                    FontWeight.bold),
                              ),
                            ),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 12.h),
            margin: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
            decoration: BoxDecoration(
              color: kSecondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              children: [
                isImage
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          SizedBox(
                            width: 145.w,
                            child: Text(
                              "Fix Charges",
                              style: appStyle(16.sp, kDark, FontWeight.w500),
                            ),
                          ),
                          Container(
                            height: 20.h,
                            width: 1.w,
                            color: kDark,
                            margin: EdgeInsets.symmetric(horizontal: 10.w),
                          ),
                          Text(
                            "\$$fixCharges",
                            style: appStyle(16.sp, kDark, FontWeight.w500),
                          ),
                        ],
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          SizedBox(
                            width: 145.w,
                            child: Text(
                              "Arrival Charges",
                              style: appStyle(16.sp, kDark, FontWeight.w500),
                            ),
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
                currentStatus == 2
                    ? SizedBox()
                    : isImage
                        ? SizedBox()
                        : Divider(),
                currentStatus == 2
                    ? SizedBox()
                    : isImage
                        ? SizedBox()
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              SizedBox(
                                width: 145.w,
                                child: Text(
                                  "Per Hour Charges",
                                  style:
                                      appStyle(16.sp, kDark, FontWeight.w500),
                                ),
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
                  mainAxisAlignment: currentStatus == [1, 2, 3, 4]
                      ? MainAxisAlignment.center
                      : MainAxisAlignment.spaceEvenly,
                  children: [
                    if (currentStatus == 1)
                      buildButton(kSuccess, "Accept", () {
                        _showConfirmDialog();
                      }),
                    if (currentStatus == 2)
                      isImage
                          ? buildButton(kSecondary, "Pay \$$fixCharges", () {
                              _showPayDialog("$fixCharges", isImage);
                              // updateStatus(3);flu
                            })
                          : buildButton(kSecondary, "Pay \$$arrivalCharges",
                              () {
                              _showPayDialog("$arrivalCharges", isImage);
                              // updateStatus(3);
                            }),
                    if (currentStatus == 3)
                      buildButton(kPrimary, "Confirm to Start", () {
                        // updateStatus(4);
                        _showConfirmStartDialog();
                      }),
                    if (currentStatus == 4)
                      Container(
                        height: 40.h,
                        width: 220.w,
                        decoration: BoxDecoration(
                          color: kSecondary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Center(
                          child: Text("Ongoing",
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: kSecondary,
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.w500)),
                        ),
                      ),
                    currentStatus == 4
                        ? SizedBox()
                        : currentStatus == 5
                            ? SizedBox()
                            : ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color(0xff88532B),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.0.r),
                                  ),
                                ),
                                onPressed: onCallTap,
                                child: Text(
                                  "Need to talk",
                                  style: appStyle(
                                      13.sp, Colors.white, FontWeight.bold),
                                ),
                              ),
                    currentStatus == 5
                        ? Row(
                            // mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                height: 40.h,
                                width: 120.w,
                                decoration: BoxDecoration(
                                  color: kSecondary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Center(
                                  child: Text("Completed",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          color: kSecondary,
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.w500)),
                                ),
                              ),
                              SizedBox(width: 15.w),
                              buildButton(kSuccess, "Rate Now",
                                  () => showRatingDialog(context, mId))
                            ],
                          )
                        : SizedBox()
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 12.h),
        ],
      ),
    );
  }

  Widget buildButton(Color color, String text, void Function()? onTap) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        minimumSize: Size(110.w, 40.h),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.0.r),
        ),
      ),
      onPressed: onTap,
      child: Text(
        text,
        style: appStyle(13.sp, Colors.white, FontWeight.bold),
      ),
    );
  }

  void _showConfirmDialog() {
    Get.defaultDialog(
      title: "Confirm",
      middleText: "Are you sure you want to accept this offer?",
      textCancel: "No",
      textConfirm: "Yes",
      cancel: OutlinedButton(
        onPressed: () {
          Get.back(); // Close the dialog if "No" is pressed
        },
        child: Text(
          "No",
          style: TextStyle(color: Colors.red), // Custom color for "No" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(2);
          Get.back();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Yes" button
        ),
        child: Text(
          "Yes",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  void _showPayDialog(String payCharges, bool isShowImage) {
    Get.defaultDialog(
      title: "Pay \$$payCharges",
      middleText: "Please proceed to pay.",
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(3);
          Get.back(); // Close the pay dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kSecondary, // Custom color for "Pay" button
        ),
        child: Text(
          "Pay",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  void _showConfirmStartDialog() {
    Get.defaultDialog(
      title: "Start Job Confirmation ",
      middleText:
          "Are you sure Mechanic is arrived and you want to start this job?",
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(4);
          Get.back(); // Close the pay dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary, // Custom color for "Pay" button
        ),
        child: Text(
          "Confirm",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  // Firestore update function
  Future<void> updateStatus(int status) async {
    final userHistoryRef = FirebaseFirestore.instance
        .collection('Users')
        .doc(userId)
        .collection('history')
        .doc(jobId);
    final jobRef = FirebaseFirestore.instance.collection('jobs').doc(jobId);

    try {
      await userHistoryRef.update({'status': status});
      await jobRef.update({'status': status});
    } catch (e) {
      print('Error updating status: $e');
    }
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
        style: appStyle(13.sp, color, FontWeight.bold),
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
            style: appStyle(13.sp, kDark, FontWeight.bold),
          ),
        ],
      ),
    );
  }

  void showRatingDialog(BuildContext context, String mId) {
    double _rating = 0;
    String _review = '';

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Please Rate to Driver'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RatingBar.builder(
                initialRating: _rating,
                minRating: 1,
                direction: Axis.horizontal,
                allowHalfRating: false,
                itemCount: 5,
                itemSize: 30,
                itemBuilder: (context, _) => Icon(
                  Icons.star,
                  color: Colors.amber,
                ),
                onRatingUpdate: (rating) {
                  _rating = rating; // Update rating when it changes
                },
              ),
              TextField(
                decoration: InputDecoration(hintText: 'Write a review'),
                onChanged: (value) {
                  _review = value; // Update review when it changes
                },
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () async {
                await _updateRatingAndReview(mId, _rating, _review);
                Navigator.of(context).pop();
              },
              child: Text('Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: kSuccess,
                foregroundColor: Colors.white,
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel'),
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateRatingAndReview(
      String mId, double rating, String review) async {
    try {
      await FirebaseFirestore.instance.collection('jobs').doc(jobId).update({
        'rating': rating,
        'review': review,
        "reviewSubmitted": true,
      });

      await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(mId)
          .collection('ratings')
          .doc()
          .set({
        'rating': rating,
        'review': review,
        "uId": FirebaseAuth.instance.currentUser!.uid,
        "timestamp": DateTime.now(),
      });
      showToastMessage('Rating', 'Review Submitted.', Colors.red);
      log('Rating and review updated successfully.');
    } catch (error) {
      log('Error updating rating and review: $error');
      showToastMessage(
          'Error', 'Failed to submit rating and review.', Colors.red);
    }
  }
}
