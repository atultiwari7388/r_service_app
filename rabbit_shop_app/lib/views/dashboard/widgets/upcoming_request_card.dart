import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:photo_view/photo_view.dart';
import 'package:regal_shop_app/services/collection_references.dart';
import 'package:regal_shop_app/widgets/info_box.dart';
import 'package:regal_shop_app/widgets/rating_box.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../utils/show_toast_msg.dart';

class UpcomingRequestCard extends StatefulWidget {
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
    this.onPhoneCallTap,
    this.onDirectionTapButton,
    this.onDasMapButton,
    this.currentStatus = 0,
    required this.buttonName,
    this.onCompletedButtonTap,
    this.rating = "",
    required this.arrivalCharges,
    this.fixCharge = "",
    this.km = "",
    this.dId = "",
    required this.orderId,
    required this.isImage,
    this.images = const [],
    this.payMode = "",
    this.onCancelBtnTap,
    required this.reviewSubmitted, // New parameter
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
  final Future<void> Function()? onPhoneCallTap;
  final void Function()? onCompletedButtonTap;
  final Future<void> Function()? onDirectionTapButton;
  final Future<void> Function()? onDasMapButton;
  final void Function()? onCancelBtnTap;
  final int currentStatus;
  final String buttonName;
  final String rating;
  final String arrivalCharges;
  final String fixCharge;
  final String km;
  final String dId;
  final String orderId;
  final bool isImage;
  final List images;
  final String payMode;
  final bool reviewSubmitted; // New parameter

  @override
  State<UpcomingRequestCard> createState() => _UpcomingRequestCardState();
}

class _UpcomingRequestCardState extends State<UpcomingRequestCard> {
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
              SizedBox(width: 5.w),
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
                        SizedBox(
                          // width: 250.w,
                          child: Row(
                            children: [
                              InfoBoxWidget(text: widget.km, color: kPrimary),
                              RatingBoxWidget(rating: widget.rating),
                              SizedBox(width: 5.w),
                              Text(widget.date,
                                  style: appStyle(10, kGray, FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    //company Name
                    Text(
                      widget.userName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),

                    SizedBox(height: 4.h),

                    SizedBox(
                      width: 250.w,
                      child: Text(
                        widget.address,
                        maxLines: 2,
                        style: appStyle(15.sp, kGray, FontWeight.bold),
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
                buildReusableRow("Selected Service", "${widget.serviceName}"),
                widget.currentStatus == 5
                    ? buildReusableRow("Payment Mode", "${widget.payMode}")
                    : SizedBox(),
                SizedBox(height: 5.h),
                widget.currentStatus == 0
                    ? Column(
                        children: [
                          buildReusableRow("Vehicle", "${widget.vehicleName}"),
                        ],
                      )
                    : widget.currentStatus == 1
                        ? Column(
                            children: [
                              buildReusableRow("Vehicle",
                                  "${widget.companyNameAndVehicleName}"),
                              widget.isImage
                                  ? buildReusableRow(
                                      "Fix Charge", "\$${widget.fixCharge}")
                                  : buildReusableRow("Arrival Charges",
                                      "\$${widget.arrivalCharges}"),
                            ],
                          )
                        : widget.currentStatus == 2
                            ? Column(
                                children: [
                                  buildReusableRow("Vehicle",
                                      "${widget.companyNameAndVehicleName}"),
                                  buildReusableRow("Arrival Charges",
                                      "\$${widget.arrivalCharges}"),
                                ],
                              )
                            : widget.currentStatus == 3
                                ? Column(
                                    children: [
                                      buildReusableRow("Vehicle",
                                          "${widget.companyNameAndVehicleName}"),
                                      buildReusableRow("Arrival Charges",
                                          "\$${widget.arrivalCharges}"),
                                    ],
                                  )
                                : SizedBox(),

                widget.isImage
                    ?
                    //images section
                    _buildSelectedImages()
                    : SizedBox(),

                SizedBox(height: 10.h),
                //Interested Button
                widget.currentStatus == 0
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          buildButton(
                              kPrimary, widget.buttonName, widget.onButtonTap),
                          SizedBox(width: 10.w),
                          Expanded(
                            child: GestureDetector(
                              onTap: widget.onDasMapButton,
                              child: Container(
                                height: 40.h,
                                width: 120.w,
                                decoration: BoxDecoration(
                                  color: kSecondary, // Button color
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.directions, color: kWhite),
                                    SizedBox(width: 5.w),
                                    Text(
                                      "Map",
                                      style: appStyle(
                                          14, kWhite, FontWeight.normal),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          // SizedBox(width: 10.w),
                        ],
                      )
                    : widget.currentStatus == 1
                        ? Row(
                            children: [
                              Container(
                                height: 45.h,
                                padding: EdgeInsets.all(2.h),
                                margin: EdgeInsets.all(2.h),
                                decoration: BoxDecoration(
                                  color: kSecondary,
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Center(
                                  child: Text("Wait for driver acceptance.",
                                      style: appStyle(
                                          12, kWhite, FontWeight.normal)),
                                ),
                              ),
                              SizedBox(width: 5.w),
                              buildButton(
                                  kPrimary, "Cancel", widget.onCancelBtnTap)
                            ],
                          )
                        : widget.currentStatus == 2
                            ? Container(
                                height: 45.h,
                                decoration: BoxDecoration(
                                  color: kPrimary,
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Center(
                                  child: Text(
                                      "Waiting for driver to pay the price",
                                      style: appStyle(
                                          14, kWhite, FontWeight.normal)),
                                ),
                              )
                            : widget.currentStatus == 3
                                ? Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      SizedBox(width: 10.w),
                                      buildButton(kSecondary, "Call",
                                          widget.onPhoneCallTap),
                                      SizedBox(width: 10.w),
                                      buildButton(kPrimary, widget.buttonName,
                                          widget.onButtonTap),
                                      SizedBox(width: 10.w),
                                      GestureDetector(
                                        onTap: widget.onDirectionTapButton,
                                        child: CircleAvatar(
                                            radius: 25.r,
                                            backgroundColor: kSuccess,
                                            child: Icon(Icons.directions,
                                                color: kWhite)),
                                      ),
                                    ],
                                  )
                                : widget.currentStatus == 3
                                    ? Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          buildButton(kOrange, "Complete Now",
                                              widget.onCompletedButtonTap),
                                          SizedBox(width: 10.w),
                                          // buildButton(kSecondary, "Call",
                                          //     () => makePhoneCall("+918989898989")),
                                        ],
                                      )
                                    : widget.currentStatus == 4
                                        ? widget.payMode == "COD"
                                            ? GestureDetector(
                                                onTap: () =>
                                                    _showCollectCashFromUser(),
                                                child: Container(
                                                  height: 40.h,
                                                  width: 220.w,
                                                  decoration: BoxDecoration(
                                                    color: kPrimary,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.r),
                                                  ),
                                                  child: Center(
                                                    child: Text(
                                                        "Collect cash from user",
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: TextStyle(
                                                            color: kWhite,
                                                            fontSize: 16.sp,
                                                            fontWeight:
                                                                FontWeight
                                                                    .w500)),
                                                  ),
                                                ),
                                              )
                                            : GestureDetector(
                                                onTap: () =>
                                                    _showConfirmStartDialog(),
                                                child: Container(
                                                  height: 40.h,
                                                  width: 220.w,
                                                  decoration: BoxDecoration(
                                                    color: kPrimary,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.r),
                                                  ),
                                                  child: Center(
                                                    child: Text("Complete now",
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: TextStyle(
                                                            color: kWhite,
                                                            fontSize: 16.sp,
                                                            fontWeight:
                                                                FontWeight
                                                                    .w500)),
                                                  ),
                                                ),
                                              )
                                        : widget.currentStatus == 5
                                            ? Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Container(
                                                    height: 40.h,
                                                    width: 120.w,
                                                    decoration: BoxDecoration(
                                                      color: kPrimary
                                                          .withOpacity(0.1),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              12.r),
                                                    ),
                                                    child: Center(
                                                      child: Text("Completed",
                                                          textAlign:
                                                              TextAlign.center,
                                                          style: TextStyle(
                                                              color: kPrimary,
                                                              fontSize: 16.sp,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w500)),
                                                    ),
                                                  ),
                                                  SizedBox(width: 15.w),
                                                  buildButton(
                                                      widget.reviewSubmitted
                                                          ? kSecondary
                                                          : kSecondary,
                                                      widget.reviewSubmitted
                                                          ? "Edit Review"
                                                          : "Rate Now",
                                                      () => showRatingDialog(
                                                            context,
                                                            widget.dId,
                                                            widget.orderId,
                                                            widget
                                                                .reviewSubmitted,
                                                          ))
                                                ],
                                              )
                                            : SizedBox()
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

  Widget _buildSelectedImages() {
    return widget.images.isNotEmpty
        ? Wrap(
            spacing: 10.w,
            runSpacing: 10.h,
            children: widget.images.map((image) {
              return GestureDetector(
                onTap: () => _showImageViewer(image),
                child: Container(
                  width: 50.w,
                  height: 50.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12.r),
                    image: DecorationImage(
                      image: NetworkImage(image),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              );
            }).toList(),
          )
        : Container(); // Empty container when no images are selected
  }

  void _showImageViewer(String imageUrl) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          child: Container(
            // Set a fixed height and width, or use MediaQuery for dynamic sizing
            height: MediaQuery.of(context).size.height * 0.8,
            width: MediaQuery.of(context).size.width * 0.8,
            child: PhotoView(
              imageProvider: NetworkImage(imageUrl),
              minScale:
                  PhotoViewComputedScale.contained, // Adjust this as needed
              maxScale: PhotoViewComputedScale.covered, // Adjust this as needed
            ),
          ),
        );
      },
    );
  }

  void _showConfirmStartDialog() {
    Get.defaultDialog(
      title: "Complete Job Confirmation ",
      middleText: "Are you sure you want to complete this job?",
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(5, widget.dId);
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

  void _showCollectCashFromUser() {
    Get.defaultDialog(
      title: "Complete Job Confirmation ",
      middleText: "Collect cash from user ",
      confirm: ElevatedButton(
        onPressed: () {
          updateStatus(5, widget.dId);
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

  Future<void> updateStatus(int status, String dId) async {
    final userHistoryRef = FirebaseFirestore.instance
        .collection('Users')
        .doc(dId)
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
            mechanicsOffer.indexWhere((offer) => offer['mId'] == currentUId);

        if (mechanicIndex != -1) {
          // Update the status of the specific mechanic offer in jobRef
          mechanicsOffer[mechanicIndex]['status'] = status;

          // Update the job document with the modified mechanicsOffer array
          await jobRef.update({
            'mechanicsOffer': mechanicsOffer,
          });
        } else {
          print("Mechanic with mId: $currentUId not found in jobRef.");
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
            .indexWhere((offer) => offer['mId'] == currentUId);

        if (historyMechanicIndex != -1) {
          // Update the status of the specific mechanic offer in userHistoryRef
          historyMechanicsOffer[historyMechanicIndex]['status'] = status;

          // Update the userHistory document with the modified mechanicsOffer array
          await userHistoryRef.update({
            'mechanicsOffer': historyMechanicsOffer,
          });
        } else {
          print("Mechanic with mId: $currentUId not found in userHistoryRef.");
        }
      }
    } catch (e) {
      print('Error updating status: $e');
    }
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

  void showRatingDialog(
      BuildContext context, String dId, String orderId, bool isEdit) async {
    double _rating = 0;
    String _review = 'Write a review';

    if (isEdit) {
      // Fetch existing rating and review from Firestore
      DocumentSnapshot jobSnapshot = await FirebaseFirestore.instance
          .collection('jobs')
          .doc(widget.jobId)
          .get();

      _rating = jobSnapshot.get('mRating')?.toDouble() ?? 0;
      _review = jobSnapshot.get('mReview')?.toString() ?? '';
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
                await _updateRatingAndReview(dId, orderId, _rating, _review);
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

  Future<void> _updateRatingAndReview(
      String dId, String orderId, double rating, String review) async {
    try {
      final data = {
        'rating': rating,
        'review': review,
        "mId": FirebaseAuth.instance.currentUser!.uid,
        "reviewSubmitted": true,
        "orderId": orderId,
        "timestamp": DateTime.now(),
      };
      await FirebaseFirestore.instance
          .collection('Users')
          .doc(dId)
          .collection('ratings')
          .doc(orderId)
          .set(data);

      // Update the Firestore `jobs` collection
      await FirebaseFirestore.instance.collection('jobs').doc(orderId).update({
        'mRating': rating,
        'mReview': review,
        "mId": FirebaseAuth.instance.currentUser!.uid,
        "mReviewSubmitted": true,
        "orderId": orderId,
        "timestamp": DateTime.now(),
      });

      // Check if the history document exists
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(dId)
          .collection("history")
          .doc(orderId)
          .update(data);

      showToastMessage('Rating', 'Review Submitted.', kSecondary);
      log('Rating and review updated successfully.');
    } catch (error) {
      log('Error updating rating and review: $error');
      showToastMessage(
          'Error', 'Failed to submit rating and review.', Colors.red);
    }
  }
}
