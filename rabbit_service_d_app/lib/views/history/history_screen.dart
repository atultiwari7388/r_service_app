import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/views/myJobs/widgets/my_jobs_card.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _selectedSortOption = "Sort";
  int? _selectedCardIndex;

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
          if (_selectedCardIndex == null) // Show only if no card is selected
            GestureDetector(
              onTap: () => Get.to(() => ProfileScreen()),
              child: CircleAvatar(
                radius: 19.r,
                backgroundColor: kPrimary,
                child:
                    Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
              ),
            ),
          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              if (_selectedCardIndex == null)
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                      decoration: BoxDecoration(
                        color: kPrimary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8.0.r),
                      ),
                      child: PopupMenuButton<String>(
                        onSelected: (value) {
                          setState(() {
                            _selectedSortOption =
                                value; // Update the button text
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
                            value: "Price",
                            child: Text("Price"),
                          ),
                          PopupMenuItem(
                            value: "Review",
                            child: Text("Review"),
                          ),
                        ],
                        child: Row(
                          children: [
                            Icon(Icons.sort, color: kPrimary),
                            SizedBox(width: 4.w),
                            Text(
                              _selectedSortOption, // Show the selected option
                              style: appStyle(16.sp, kPrimary, FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              SizedBox(height: 10.h),
              StreamBuilder(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .collection("history")
                    .where("status", whereIn: [-1, 5]).snapshots(),
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
                      ? Center(child: Text("No History found !"))
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
                            return MyJobsCard(
                              companyNameAndVehicleName:
                                  "${job["companyName"]} (${vehicleNumber})",
                              address: job["userDeliveryAddress"].toString(),
                              serviceName: job["selectedService"].toString(),
                              cancelationReason: job["cancelReason"].toString(),
                              jobId: job["orderId"].toString(),
                              imagePath: job["userPhoto"].toString().isEmpty
                                  ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                  : job["userPhoto"].toString(),
                              dateTime: dateString,
                              currentStatus: job["status"],
                              // isStatusCompleted: true,
                            );
                          });
                },
              ),
              SizedBox(height: 50.h)
            ],
          ),
        ),
      ),
    );
  }
}
