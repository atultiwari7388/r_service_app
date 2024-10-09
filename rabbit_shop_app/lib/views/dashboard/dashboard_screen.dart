import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/controllers/dashboard_controller.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:regal_shop_app/views/profile/profile_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/calculate_distance.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
import '../../widgets/reusable_text.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  @override
  Widget build(BuildContext context) {
    return GetBuilder<DashboardController>(
        init: DashboardController(),
        builder: (controller) {
          return Scaffold(
            appBar: buildAppBar(controller),
            body: SingleChildScrollView(
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 15.h),
                    // Total jobs and Ongoing jobs section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        GestureDetector(
                          // onTap: () => Get.to(() => OrderHistoryScreen()),
                          child: _compactDashboardItem("Total Jobs",
                              controller.totalJobs.toString(), kSecondary),
                        ),
                        // SizedBox(width: 10.w),
                        GestureDetector(
                          // onTap: () => Get.to(() => OrderHistoryScreen()),
                          child: _compactDashboardItem("Ongoing Jobs",
                              controller.ongoingJobs.toString(), kRed),
                        ),
                      ],
                    ),

                    SizedBox(height: 20.h),
                    // New jobs section

                    controller.online
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  ReusableText(
                                      text: "New Jobs",
                                      style:
                                          appStyle(17, kDark, FontWeight.w500)),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 8.w, vertical: 4.h),
                                    decoration: BoxDecoration(
                                      color: kPrimary.withOpacity(0.1),
                                      borderRadius:
                                          BorderRadius.circular(8.0.r),
                                    ),
                                    child: PopupMenuButton<String>(
                                      onSelected: (value) {
                                        setState(() {
                                          controller.selectedSortOption = value;
                                        });
                                        // Implement your sorting logic here if needed
                                        print('Selected sort option: $value');
                                      },
                                      itemBuilder: (context) => [
                                        PopupMenuItem(
                                          value: "Near by",
                                          child: Text("Near by"),
                                        ),
                                        PopupMenuItem(
                                          value: "Rating",
                                          child: Text("Rating"),
                                        ),
                                      ],
                                      child: Row(
                                        children: [
                                          Icon(Icons.sort, color: kPrimary),
                                          SizedBox(width: 4.w),
                                          Text(
                                            controller
                                                .selectedSortOption, // Show the selected option
                                            style: appStyle(16.sp, kPrimary,
                                                FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 10.h),
                              StreamBuilder<QuerySnapshot>(
                                stream: FirebaseFirestore.instance
                                    .collection('jobs')
                                    .where('status', isEqualTo: 0)
                                    .snapshots(),
                                builder: (BuildContext context,
                                    AsyncSnapshot<QuerySnapshot> snapshot) {
                                  if (snapshot.hasError) {
                                    return Center(
                                        child:
                                            Text('Error: ${snapshot.error}'));
                                  }

                                  if (snapshot.connectionState ==
                                      ConnectionState.waiting) {
                                    return Center(
                                        child: CircularProgressIndicator());
                                  }

                                  final data = snapshot.data!.docs;

                                  // Filter the data based on mechanicsOffers
                                  final filteredData = data.where((doc) {
                                    final job =
                                        doc.data() as Map<String, dynamic>;
                                    final mechanicsOffers =
                                        job['mechanicsOffer'] as List<dynamic>?;

                                    // Check if mechanicsOffers is null or empty
                                    if (mechanicsOffers == null ||
                                        mechanicsOffers.isEmpty) {
                                      print(
                                          'Job ${job['orderId']} has no offers. Showing this job.');
                                      return true; // Show the job if offers are empty
                                    }

                                    bool shouldShowJob =
                                        true; // Flag to determine if the job should be shown

                                    // Check if mId is not equal to currentUId or if the status is 0
                                    for (var offer in mechanicsOffers) {
                                      if (offer['mId'] == currentUId) {
                                        // If the mechanic's ID matches, check the offer status
                                        if (offer['status'] == 1) {
                                          print(
                                              'Hiding job ${job['orderId']} because status is 1 (accepted).');
                                          shouldShowJob =
                                              false; // Hide the job if the mechanic's offer status is 1
                                          break; // No need to check other offers
                                        }
                                        // If the mechanic's offer status is 0, we want to show this job
                                        // So we continue checking the other offers
                                      }
                                    }

                                    if (shouldShowJob) {
                                      print('Showing job ${job['orderId']}');
                                    }

                                    return shouldShowJob; // Return the final decision
                                  }).toList();

                                  if (filteredData.isEmpty) {
                                    return Center(
                                        child: Text("No Request Available"));
                                  }

                                  return ListView.builder(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemCount: filteredData.length,
                                    itemBuilder: (context, index) {
                                      final job = filteredData[index].data()
                                          as Map<String, dynamic>;

                                      // Initialize the mechanic's status
                                      int mechanicStatus = job['status'] ?? 0;

                                      // Extract job details
                                      final userLat =
                                          (job["userLat"] as num).toDouble();
                                      final userLng =
                                          (job["userLong"] as num).toDouble();
                                      final bool isImage =
                                          job["isImageSelected"] ?? false;
                                      final imagePath = job['userPhoto'] ?? "";
                                      final List<dynamic> images =
                                          job['images'] ?? [];

                                      // Date Formatting
                                      String dateString = '';
                                      if (job['orderDate'] is Timestamp) {
                                        DateTime dateTime =
                                            (job['orderDate'] as Timestamp)
                                                .toDate();
                                        dateString =
                                            "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
                                      }

                                      double distance = calculateDistance(
                                          userLat,
                                          userLng,
                                          controller.mecLat,
                                          controller.mecLng);

                                      if (distance < 1) {
                                        distance = 1;
                                      }

                                      // Logic to ensure job is nearby
                                      if (distance <=
                                          (job['nearByDistance'] ?? 0)) {
                                        return FutureBuilder(
                                          future: getAverageUserRating(
                                              job["userId"]),
                                          builder: (ctx, snapshot) {
                                            double rating = 4.5;
                                            if (snapshot.hasData) {
                                              rating = snapshot.data ?? 4.5;
                                            }

                                            return UpcomingRequestCard(
                                              orderId:
                                                  job["orderId"].toString(),
                                              userName:
                                                  job["userName"].toString(),
                                              vehicleName:
                                                  "${job["companyName"]} (${job['vehicleNumber']})",
                                              address:
                                                  job['userDeliveryAddress'] ??
                                                      "N/A",
                                              serviceName:
                                                  job['selectedService'] ??
                                                      "N/A",
                                              jobId:
                                                  job['orderId'] ?? "#Unknown",
                                              imagePath: imagePath.isEmpty
                                                  ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                                  : imagePath,
                                              date: dateString,
                                              buttonName: "Interested",
                                              onButtonTap: () =>
                                                  controller.showConfirmDialog(
                                                index,
                                                filteredData,
                                                job["userId"].toString(),
                                                job["orderId"].toString(),
                                                isImage,
                                                job["fixPriceEnabled"] ?? false,
                                              ),
                                              onDasMapButton: () async {
                                                final Uri googleMapsUri = Uri.parse(
                                                    'https://www.google.com/maps/dir/?api=1&destination=$userLat,$userLng');
                                                if (await canLaunch(
                                                    googleMapsUri.toString())) {
                                                  await launch(
                                                      googleMapsUri.toString());
                                                } else {
                                                  print(
                                                      'Could not launch Google Maps');
                                                }
                                              },
                                              currentStatus: mechanicStatus,
                                              rating: rating.toStringAsFixed(1),
                                              arrivalCharges: "30",
                                              km: "${distance.toStringAsFixed(0)} miles",
                                              isImage: isImage,
                                              images: images,
                                              fixCharge:
                                                  job["fixPrice"].toString(),
                                              reviewSubmitted:
                                                  job["reviewSubmitted"] ??
                                                      false,
                                            );
                                          },
                                        );
                                      } else {
                                        return Container(); // Return an empty container if distance is greater than nearbyDistance
                                      }
                                    },
                                  );
                                },
                              ),
                              SizedBox(height: 70.h),
                            ],
                          )
                        : buildInactiveMechanicScreen()
                  ],
                ),
              ),
            ),
          );
        });
  }

  Future<double> getAverageUserRating(String userId) async {
    try {
      final ratingsSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(userId)
          .collection('ratings')
          .get();

      if (ratingsSnapshot.docs.isEmpty) {
        return 4.5; // Default rating if there are no ratings
      }

      double totalRating = 0;
      for (var doc in ratingsSnapshot.docs) {
        totalRating += (doc.data()['rating'] as num).toDouble();
      }

      double averageRating = totalRating / ratingsSnapshot.docs.length;
      return averageRating;
    } catch (e) {
      print("Error fetching ratings: $e");
      return 4.5; // Return default rating in case of an error
    }
  }

  AppBar buildAppBar(DashboardController controller) {
    return AppBar(
      backgroundColor: kLightWhite,
      elevation: 0,
      title: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start, // Align the title and address to the left
        children: [
          // Dashboard Title
          ReusableText(
            text: "Dashboard",
            style: appStyle(20, kDark, FontWeight.normal),
          ),
          SizedBox(height: 1.h),

          // Address and Icon Row

          Row(
            children: [
              Icon(Icons.location_on_outlined,
                  size: 16, color: kSecondary), // Reduce icon size if necessary
              SizedBox(width: 5.w), // Add space between the icon and text
              SizedBox(
                width: 160.w, // Limit the width to 150
                child: ReusableText(
                  text: controller.appbarTitle.isEmpty
                      ? "Fetching Address..."
                      : controller.appbarTitle,
                  style:
                      appStyle(13, kGray, FontWeight.normal) // Make it unbold
                          .copyWith(
                              overflow: TextOverflow.ellipsis), // Add ellipsis
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        // Switch Button
        Switch(
          value: controller.online,
          onChanged: (value) {
            controller.toggleActive(value);
          },
          activeColor: kSuccess,
        ),
        SizedBox(width: 10.w),

        // Profile Avatar with StreamBuilder
        GestureDetector(
          onTap: () => Get.to(
            () => const ProfileScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900),
          ),
          child: CircleAvatar(
            radius: 19.r,
            backgroundColor: kPrimary,
            child: StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('Mechanics')
                  .doc(currentUId)
                  .snapshots(),
              builder: (BuildContext context,
                  AsyncSnapshot<DocumentSnapshot> snapshot) {
                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator();
                }

                final data = snapshot.data!.data() as Map<String, dynamic>;
                controller.userPhoto = data['profilePicture'] ?? '';
                controller.userName = data['userName'] ?? '';
                controller.phoneNumber = data['phoneNumber'] ?? '';
                controller.perHourCharges = data["perHCharge"] ?? 0;

                if (controller.userPhoto.isEmpty) {
                  return Text(
                    controller.userName.isNotEmpty
                        ? controller.userName[0]
                        : '',
                    style: appStyle(20, kWhite, FontWeight.w500),
                  );
                } else {
                  return ClipOval(
                    child: Image.network(
                      controller.userPhoto,
                      width: 38.r, // Adjust image size accordingly
                      height: 35.r,
                      fit: BoxFit.cover,
                    ),
                  );
                }
              },
            ),
          ),
        ),

        SizedBox(width: 10.w),
      ],
    );
  }

  Widget buildInactiveMechanicScreen() {
    return Padding(
      padding: EdgeInsets.all(28.sp),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.warning,
              size: 100,
              color: kPrimary,
            ),
            const SizedBox(height: 20),
            ReusableText(
              text: "Please activate the online button.",
              style: appStyle(17, kSecondary, FontWeight.normal),
            ),
          ],
        ),
      ),
    );
  }

  Widget _compactDashboardItem(String title, String value, Color color) {
    return Container(
      height: 70.h,
      width: MediaQuery.of(context).size.width * 0.4,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12.r),
      ),
      // padding: EdgeInsets.all(10.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title,
              textAlign: TextAlign.center,
              style: appStyle(15, kWhite, FontWeight.w400)),
          SizedBox(height: 10.h),
          Text(value, style: appStyle(12, kWhite, FontWeight.w400)),
        ],
      ),
    );
  }
}

// StreamBuilder(
//   stream: FirebaseFirestore.instance
//       .collection('jobs')
//       .where('status', isEqualTo: 0)
//       .where('mechanicOffers',
//           arrayContains: {'status': 0})
//       .orderBy("orderDate", descending: true)
//       .snapshots(),
//   builder: (BuildContext context,
//       AsyncSnapshot<QuerySnapshot> snapshot) {
//     if (snapshot.hasError) {
//       return Text('Error: ${snapshot.error}');
//     }

//     if (snapshot.connectionState ==
//         ConnectionState.waiting) {
//       return const CircularProgressIndicator();
//     }

//     final data = snapshot.data!.docs;

//     if (data.isEmpty) {
//       return Center(
//           child: Text("No Request Available"));
//     }

//   },
// ),
