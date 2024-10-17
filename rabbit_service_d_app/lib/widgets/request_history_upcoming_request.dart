import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../utils/show_toast_msg.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

class RequestAcceptHistoryCard extends StatefulWidget {
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
    required this.jobStatus, //job status
    required this.mStatus,
    required this.isImage,
    required this.reviewSubmitted,
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
  final int jobStatus;
  final int mStatus;
  final bool isImage;
  final bool reviewSubmitted;

  @override
  State<RequestAcceptHistoryCard> createState() =>
      _RequestAcceptHistoryCardState();
}

class _RequestAcceptHistoryCardState extends State<RequestAcceptHistoryCard> {
  bool isStatusUpdating = false;

  @override
  Widget build(BuildContext context) {
    if (widget.isHidden) return SizedBox.shrink();

    String? _selectedPaymentMode;

    return isStatusUpdating
        ? SizedBox(
            height: MediaQuery.of(context).size.height,
            width: double.maxFinite,
            child: Center(child: CircularProgressIndicator()))
        : Container(
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
                // Job and Mechanic Details Row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24.w,
                      backgroundImage: NetworkImage(widget.imagePath),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.shopName,
                            style: kIsWeb
                                ? TextStyle(color: kDark)
                                : appStyle(16.sp, kDark, FontWeight.w500),
                          ),
                          SizedBox(height: 4.h),
                          Row(
                            children: [
                              _buildInfoBox("${widget.time} mins", Colors.red),
                              SizedBox(width: 6.w),
                              _buildInfoBox(widget.distance, kPrimary),
                              SizedBox(width: 6.w),
                              _buildRatingBox(widget.rating),
                            ],
                          ),
                          SizedBox(height: 5.h),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                for (var language in widget.languages) ...[
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 10.w, vertical: 4.h),
                                    margin: EdgeInsets.only(right: 4.w),
                                    decoration: BoxDecoration(
                                      color: kPrimary.withOpacity(0.1),
                                      borderRadius:
                                          BorderRadius.circular(8.0.r),
                                    ),
                                    child: Text(
                                      language.toString(),
                                      style: kIsWeb
                                          ? TextStyle(color: kPrimary)
                                          : appStyle(
                                              13.sp, kPrimary, FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12.h),
                // Charges Details Container
                Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 5.w, vertical: 12.h),
                  margin: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
                  decoration: BoxDecoration(
                    color: kSecondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Column(
                    children: [
                      // Display Fix Charges or Arrival Charges
                      widget.isImage
                          ? Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                SizedBox(
                                  width: 145.w,
                                  child: Text(
                                    "Fix Charges",
                                    style: kIsWeb
                                        ? TextStyle(color: kDark)
                                        : appStyle(
                                            16.sp, kDark, FontWeight.w500),
                                  ),
                                ),
                                Container(
                                  height: 20.h,
                                  width: 1.w,
                                  color: kDark,
                                  margin:
                                      EdgeInsets.symmetric(horizontal: 10.w),
                                ),
                                Text(
                                  "\$${widget.fixCharges}",
                                  style: kIsWeb
                                      ? TextStyle(color: kDark)
                                      : appStyle(16.sp, kDark, FontWeight.w500),
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
                                    style: kIsWeb
                                        ? TextStyle(color: kDark)
                                        : appStyle(
                                            16.sp, kDark, FontWeight.w500),
                                  ),
                                ),
                                Container(
                                  height: 20.h,
                                  width: 1.w,
                                  color: kDark,
                                  margin:
                                      EdgeInsets.symmetric(horizontal: 10.w),
                                ),
                                Text(
                                  "\$${widget.arrivalCharges}",
                                  style: kIsWeb
                                      ? TextStyle(color: kDark)
                                      : appStyle(16.sp, kDark, FontWeight.w500),
                                ),
                              ],
                            ),
                      Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          SizedBox(
                            width: 145.w,
                            child: Text(
                              "Per Hour Charges",
                              style: kIsWeb
                                  ? TextStyle(color: kDark)
                                  : appStyle(16.sp, kDark, FontWeight.w500),
                            ),
                          ),
                          Container(
                            height: 20.h,
                            width: 1.w,
                            color: kDark,
                            margin: EdgeInsets.symmetric(horizontal: 10.w),
                          ),
                          Text(
                            "\$${widget.perHourCharges}",
                            style: kIsWeb
                                ? TextStyle(color: kDark)
                                : appStyle(16.sp, kDark, FontWeight.w500),
                          ),
                        ],
                      ),
                      SizedBox(height: 15.h),
                      // Action Buttons
                      Row(
                        mainAxisAlignment: widget.mStatus == 1
                            ? MainAxisAlignment.center
                            : MainAxisAlignment.spaceEvenly,
                        children: [
                          // Accept Button (only if mStatus == 1)
                          if (widget.mStatus == 1)
                            buildButton(kSuccess, "Accept", () {
                              _showConfirmDialog(widget.mId);
                            }),

                          // Pay Button (only if mStatus == 2)
                          if (widget.jobStatus == 2)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                buildButton(
                                    kPrimary, "Need to talk", widget.onCallTap),
                                SizedBox(width: 10.w),
                                buildButton(
                                  kSecondary,
                                  widget.isImage
                                      ? "Pay \$${widget.fixCharges}"
                                      : "Pay \$${widget.arrivalCharges}",
                                  () {
                                    _showPayDialog(
                                      context,
                                      "${widget.fixCharges}",
                                      widget.isImage,
                                      _selectedPaymentMode,
                                      setState,
                                      widget.mId,
                                    );
                                  },
                                ),
                              ],
                            ),
                          // Ongoing Status (only if mStatus == 4)
                          if (widget.jobStatus == 4)
                            Container(
                              height: 40.h,
                              width: 220.w,
                              decoration: BoxDecoration(
                                color: kSecondary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Center(
                                child: Text(
                                  "Ongoing",
                                  textAlign: TextAlign.center,
                                  style: kIsWeb
                                      ? TextStyle(color: kSecondary)
                                      : TextStyle(
                                          color: kSecondary,
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.w500),
                                ),
                              ),
                            ),

                          if (widget.jobStatus == 5)
                            Row(
                              children: [
                                Container(
                                  height: 40.h,
                                  width: 120.w,
                                  decoration: BoxDecoration(
                                    color: kPrimary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  child: Center(
                                    child: Text(
                                      "Completed",
                                      textAlign: TextAlign.center,
                                      style: kIsWeb
                                          ? TextStyle(color: kPrimary)
                                          : TextStyle(
                                              color: kPrimary,
                                              fontSize: 16.sp,
                                              fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                ),
                                SizedBox(width: 15.w),
                                buildButton(
                                  widget.reviewSubmitted
                                      ? kSecondary
                                      : kSecondary,
                                  widget.reviewSubmitted
                                      ? "Edit Rating"
                                      : "Rate Now",
                                  () => showRatingDialog(
                                    context,
                                    widget.mId,
                                    widget.jobId,
                                    widget.reviewSubmitted,
                                    widget.userId,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      // Confirm to Start Button (only if mStatus == 3)
                      if (widget.jobStatus == 3)
                        buildButton(kPrimary, "Need to talk", widget.onCallTap),
                    ],
                  ),
                ),
                if (widget.jobStatus == 3)
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      minimumSize: Size(double.maxFinite, 45),
                      backgroundColor: kSecondary,
                      foregroundColor: kWhite,
                    ),
                    onPressed: () {
                      _showConfirmStartDialog(widget.mId);
                    },
                    child: Text("Confirm to Start"),
                  ),
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
        style: kIsWeb
            ? TextStyle(color: kWhite)
            : appStyle(13.sp, Colors.white, FontWeight.bold),
      ),
    );
  }

  void _showConfirmDialog(String mId) {
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
          style: TextStyle(color: kPrimary), // Custom color for "No" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(2, mId);
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

  // void _showPayDialog(String payCharges, bool isShowImage) {
  void _showPayDialog(BuildContext context, String payCharges, bool isShowImage,
      _selectedPaymentMode, setState, String mId) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text("Select Payment Mode"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: const Text('Online'),
                value: 'Online',
                groupValue: _selectedPaymentMode,
                onChanged: (String? value) {
                  setState(() {
                    _selectedPaymentMode = value;
                  });
                  Navigator.pop(context); // Close dialog after selection
                  updatePaymentAndStatus(3, _selectedPaymentMode,
                      mId); // Save selected payment mode to Firebase
                  // Save selected payment mode to Firebase
                },
              ),
              RadioListTile<String>(
                title: const Text('COD'),
                value: 'COD',
                groupValue: _selectedPaymentMode,
                onChanged: (String? value) {
                  setState(() {
                    _selectedPaymentMode = value;
                  });
                  Navigator.pop(context); // Close dialog after selection
                  updatePaymentAndStatus(3, _selectedPaymentMode,
                      mId); // Save selected payment mode to Firebase
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showConfirmStartDialog(String mId) {
    Get.defaultDialog(
      title: "Start Job Confirmation ",
      middleText:
          "Are you sure the Mechanic has arrived and you want to start this job?",
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(4, mId);
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

  Future<void> updateStatus(int status, String mechanicId) async {
    setState(() {
      isStatusUpdating = true;
    });
    final userHistoryRef = FirebaseFirestore.instance
        .collection('Users')
        .doc(widget.userId)
        .collection('history')
        .doc(widget.jobId);
    final jobRef =
        FirebaseFirestore.instance.collection('jobs').doc(widget.jobId);

    try {
      // Step 1: Update the general status for both user history and the job document
      await userHistoryRef.update({'status': status});
      await jobRef.update({'status': status});

      // Step 2: Update the mechanicsOffer array in the job document
      final jobSnapshot = await jobRef.get();
      final jobData = jobSnapshot.data();

      if (jobData != null) {
        final List<dynamic> mechanicsOffer = jobData['mechanicsOffer'] ?? [];

        // Find the index of the mechanic offer by mId in jobRef
        int mechanicIndex =
            mechanicsOffer.indexWhere((offer) => offer['mId'] == mechanicId);

        if (mechanicIndex != -1) {
          // Update the status of the specific mechanic offer in jobRef
          mechanicsOffer[mechanicIndex]['status'] = status;

          // Update the job document with the modified mechanicsOffer array
          await jobRef.update({
            'mechanicsOffer': mechanicsOffer,
          });
        } else {
          print("Mechanic with mId: $mechanicId not found in jobRef.");
        }
      }

      // Step 3: Update the mechanicsOffer array in the userHistoryRef document
      final historySnapshot = await userHistoryRef.get();
      final historyData = historySnapshot.data();

      if (historyData != null) {
        final List<dynamic> historyMechanicsOffer =
            historyData['mechanicsOffer'] ?? [];

        // Find the index of the mechanic offer by mId in userHistoryRef
        int historyMechanicIndex = historyMechanicsOffer
            .indexWhere((offer) => offer['mId'] == mechanicId);

        if (historyMechanicIndex != -1) {
          // Update the status of the specific mechanic offer in userHistoryRef
          historyMechanicsOffer[historyMechanicIndex]['status'] = status;

          // Update the userHistory document with the modified mechanicsOffer array
          await userHistoryRef.update({
            'mechanicsOffer': historyMechanicsOffer,
          });
        } else {
          setState(() {
            isStatusUpdating = false;
          });
          print("Mechanic with mId: $mechanicId not found in userHistoryRef.");
        }
      }
    } catch (e) {
      setState(() {
        isStatusUpdating = false;
      });
      print('Error updating status: $e');
    } finally {
      setState(() {
        isStatusUpdating = false;
      });
    }
  }

// Firestore update function
  Future<void> updatePaymentAndStatus(
      int status, String _selectedPaymentMode, String mId) async {
    final userHistoryRef = FirebaseFirestore.instance
        .collection('Users')
        .doc(widget.userId)
        .collection('history')
        .doc(widget.jobId);
    final jobRef =
        FirebaseFirestore.instance.collection('jobs').doc(widget.jobId);

    try {
      // Step 1: Update status and payment mode for both userHistoryRef and jobRef
      await userHistoryRef.update({
        'status': status,
        'payMode': _selectedPaymentMode.toString(),
      });
      await jobRef.update({
        'status': status,
        'payMode': _selectedPaymentMode.toString(),
      });

      // Step 2: Retrieve the current job data to update the mechanicsOffer array
      final jobSnapshot = await jobRef.get();
      final jobData = jobSnapshot.data();

      if (jobData != null) {
        final List<dynamic> mechanicsOffer = jobData['mechanicsOffer'] ?? [];

        // Update the mechanic's offer in the mechanicsOffer array in jobRef
        List<dynamic> updatedMechanicsOffer = mechanicsOffer.map((offer) {
          if (offer['mId'] == mId) {
            // Update the mechanic offer status to accepted
            return {
              ...offer,
              'status': status,
            };
          }
          return offer;
        }).toList();

        // Update the job document with the modified mechanicsOffer array
        await jobRef.update({
          'mechanicsOffer': updatedMechanicsOffer,
        });
      }

      // Step 3: Retrieve the current user history data to update the mechanicsOffer array
      final historySnapshot = await userHistoryRef.get();
      final historyData = historySnapshot.data();

      if (historyData != null) {
        final List<dynamic> historyMechanicsOffer =
            historyData['mechanicsOffer'] ?? [];

        // Update the mechanic's offer in the mechanicsOffer array in userHistoryRef
        List<dynamic> updatedHistoryMechanicsOffer =
            historyMechanicsOffer.map((offer) {
          if (offer['mId'] == mId) {
            // Update the mechanic offer status to accepted
            return {
              ...offer,
              'status': status,
            };
          }
          return offer;
        }).toList();

        // Update the user history document with the modified mechanicsOffer array
        await userHistoryRef.update({
          'mechanicsOffer': updatedHistoryMechanicsOffer,
        });
      }
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
        style: kIsWeb
            ? TextStyle(color: color)
            : appStyle(13.sp, color, FontWeight.bold),
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
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(13.sp, kDark, FontWeight.bold),
          ),
        ],
      ),
    );
  }

  void showRatingDialog(BuildContext context, String mId, String orderId,
      bool isEdit, String uId) async {
    double _rating = 0;
    String _review = 'Write a review';

    if (isEdit) {
      // Fetch existing rating and review from Firestore
      DocumentSnapshot jobSnapshot = await FirebaseFirestore.instance
          .collection('jobs')
          .doc(widget.jobId)
          .get();

      _rating = jobSnapshot.get('rating')?.toDouble() ?? 0;
      _review = jobSnapshot.get('review')?.toString() ?? '';
    }

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
                decoration: InputDecoration(hintText: _review.toString()),
                onChanged: (value) {
                  _review = value; // Update review when it changes
                },
              ),
            ],
          ),
          actions: [
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
            ElevatedButton(
              onPressed: () async {
                await _updateRatingAndReview(
                    mId, _rating, _review, orderId.toString(), uId);
                Navigator.of(context).pop();
              },
              child: Text('Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: kSecondary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateRatingAndReview(String mId, double rating, String review,
      String orderId, String uId) async {
    try {
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(widget.jobId)
          .update({
        'rating': rating,
        'review': review,
        "reviewSubmitted": true,
      });

      await FirebaseFirestore.instance
          .collection('Users')
          .doc(uId)
          .collection("history")
          .doc(orderId)
          .update({
        'rating': rating,
        'review': review,
        "reviewSubmitted": true,
      });

      await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(mId)
          .collection('ratings')
          .doc(orderId)
          .set({
        'rating': rating,
        'review': review,
        "uId": FirebaseAuth.instance.currentUser!.uid,
        "timestamp": DateTime.now(),
        "orderId": orderId.toString(),
      });
      showToastMessage('Rating', 'Review Submitted.', kSecondary);
      log('Rating and review updated successfully.');
    } catch (error) {
      log('Error updating rating and review: $error');
      showToastMessage(
          'Error', 'Failed to submit rating and review.', Colors.red);
    }
  }
}
