import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/views/myJobs/widgets/my_jobs_card.dart';
import '../../services/get_month_string.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';
import '../requests/requests.dart';

class MyJobsScreen extends StatefulWidget {
  const MyJobsScreen({super.key});

  @override
  State<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends State<MyJobsScreen> {
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
            text: "My Jobs", style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => const ProfileScreen(),
                transition: Transition.cupertino,
                duration: const Duration(milliseconds: 900)),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('Users')
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
                  final userPhoto = data['profilePicture'] ?? '';
                  final userName = data['userName'] ?? '';
                  final phoneNumber = data['phoneNumber'] ?? '';

                  if (userPhoto.isEmpty) {
                    return Text(
                      userName.isNotEmpty ? userName[0] : '',
                      style: appStyle(20, kWhite, FontWeight.w500),
                    );
                  } else {
                    return ClipOval(
                      child: Image.network(
                        userPhoto,
                        width: 38.r, // Set appropriate size for the image
                        height: 35.r,
                        fit: BoxFit.cover,
                      ),
                    );
                  }
                },
              ),
            ),
          ),
          SizedBox(width: 20.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: 10.h),
              StreamBuilder(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .collection("history")
                    .snapshots(),
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
                      ? Center(child: Text("No Jobs Created"))
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
                              jobId: job["orderId"].toString(),
                              imagePath: job["userPhoto"].toString(),
                              dateTime: dateString,
                              onButtonTap: () {
                                Get.to(() => RequestsScreen(
                                    serviceName:
                                        job["selectedService"].toString(),
                                    id: job["orderId"].toString(),
                                    companyAndVehicleName:
                                        "${job["companyName"]} (${vehicleNumber})"));
                              },
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
