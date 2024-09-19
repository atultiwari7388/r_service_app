import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../../services/collection_references.dart';
import '../../../services/find_mechanic.dart';
import '../../../services/get_month_string.dart';
import '../../../services/make_call.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/request_history_card.dart';
import '../../../widgets/request_history_upcoming_request.dart';
import '../../../widgets/reusable_text.dart';
import '../../profile/profile_screen.dart';

class HistoryCompletedScreen extends StatefulWidget {
  const HistoryCompletedScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<HistoryCompletedScreen> createState() => _HistoryCompletedScreenState();
}

class _HistoryCompletedScreenState extends State<HistoryCompletedScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "History", style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => ProfileScreen()),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            children: [
              StreamBuilder(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .collection("history")
                    .where("orderId", isEqualTo: widget.orderId)
                    .where("status", whereIn: [1, 2, 3, 4, 5]).snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<QuerySnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot
                      .data!.docs; // List of documents in the 'jobs' collection

                  return data.isEmpty
                      ? Center(child: Text("No Mechanic Found"))
                      : ListView.builder(
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      itemCount: data.length,
                      itemBuilder: (context, index) {
                        final job =
                        data[index].data() as Map<String, dynamic>;
                        final userName = job['userName'] ?? "N/A";
                        final imagePath = job['userPhoto'] ?? "";
                        final vehicleNumber = job['vehicleNumber'] ??
                            "N/A"; // Fetch the vehicle number

                        String dateString = '';
                        if (job['orderDate'] is Timestamp) {
                          DateTime dateTime =
                          (job['orderDate'] as Timestamp).toDate();
                          dateString =
                          "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
                        }
                        final userLat = (job["userLat"] as num).toDouble();
                        final userLng = (job["userLong"] as num).toDouble();
                        final mecLatitude =
                        (job["mecLatitude"] as num).toDouble();
                        final mecLongtitude =
                        (job["mecLongtitude"] as num).toDouble();

                        // Print to check values
                        print(
                            'User Latitude: $userLat, User Longitude: $userLng');
                        print(
                            'Mechanic Latitude: $mecLatitude, Mechanic Longitude: $mecLongtitude');

                        double distance = calculateDistance(
                            userLat, userLng, mecLatitude, mecLongtitude);
                        print('Calculated Distance: $distance');

                        if (distance < 1) {
                          distance = 1;
                        }
                        return RequestAcceptHistoryCard(
                          shopName: job["mName"].toString(),
                          time: job["time"].toString(),
                          distance: "${distance.toStringAsFixed(0)} km",
                          rating: "4.5",
                          jobId: job["orderId"].toString(),
                          userId: job["userId"].toString(),
                          mId: job["mId"].toString(),
                          arrivalCharges: job["arrivalCharges"].toString(),
                          fixCharges: job["fixPrice"].toString(),
                          perHourCharges: job["perHourCharges"].toString(),
                          imagePath: job["mDp"].toString().isEmpty
                              ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                              : job["mDp"].toString(),
                          currentStatus: job["status"],
                          // isHidden: _selectedCardIndex != null &&
                          //     _selectedCardIndex != index,
                          languages: job["languages"] ?? [],
                          isImage: job["isImageSelected"],
                          onCallTap: () {
                            makePhoneCall(job["mNumber"].toString());
                          },
                        );
                      });
                },
              ),

              // RequestHistoryCard(
              //   shopName: "Repair Shop",
              //   date: "24 Aug 2024",
              //   rating: "4.7",
              //   payAdvance: "180",
              //   isOrderCompleted: true,
              // ),
            ],
          ),
        ),
      ),
    );
  }
}
