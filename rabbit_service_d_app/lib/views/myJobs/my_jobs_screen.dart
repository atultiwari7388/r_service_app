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
                    .where("status", whereIn: [0, 1, 2, 3, 4])
                    .orderBy("orderDate", descending: true)
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
                              imagePath: job["userPhoto"].toString().isEmpty
                                  ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                  : job["userPhoto"].toString(),
                              dateTime: dateString,
                              onButtonTap: () {
                                Get.to(() => RequestsScreen(
                                    serviceName:
                                        job["selectedService"].toString(),
                                    id: job["orderId"].toString(),
                                    companyAndVehicleName:
                                        "${job["companyName"]} (${vehicleNumber})"));
                              },
                              onCancelBtnTap: () {
                                // Step 1: Show the first confirmation dialog (Are you sure?)
                                showDialog(
                                  context: context,
                                  builder: (context) {
                                    return AlertDialog(
                                      title: Text(
                                          "Are you sure to cancel this job?"),
                                      actions: [
                                        TextButton(
                                          onPressed: () {
                                            // If "No" is pressed, close the dialog
                                            Navigator.pop(context);
                                          },
                                          child: Text("No"),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            // If "Yes" is pressed, proceed to select the reason
                                            Navigator.pop(
                                                context); // Close the first dialog

                                            // Step 2: Show the reason selection dialog
                                            _showReasonDialog(job[
                                                'orderId']); // Pass the job ID to update status later
                                          },
                                          child: Text("Yes"),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              },
                              currentStatus: job["status"],
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

  void _showReasonDialog(String orderId) {
    // List of reasons for canceling the job
    List<String> reasons = [
      'Driver Late',
      'Mis-Communication',
      'Language Problem',
      'Other'
    ];

    String? selectedReason;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Select Reason:"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: reasons.map((reason) {
              return RadioListTile<String>(
                title: Text(reason),
                value: reason,
                groupValue: selectedReason,
                onChanged: (value) {
                  setState(() {
                    selectedReason = value!;
                  });
                  Navigator.pop(context); // Close the reason selection dialog
                  _updateJobStatus(orderId,
                      selectedReason!); // Proceed to update the job status
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }

  void _updateJobStatus(String orderId, String reason) async {
    try {
      // Update the job document in Firestore with the new status and reason

      final data = {
        'status': -1, // Update status to cancelled
        'cancelReason': reason, // Store the selected reason
        'cancelBy': 'Driver',
      };
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(orderId)
          .update(data);

      await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('history')
          .doc(orderId)
          .update(data);

      // Show a success message
      Get.snackbar("Job Cancelled", "The job was cancelled due to: $reason",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white);
    } catch (error) {
      // Handle any errors
      Get.snackbar("Error", "Failed to cancel job: $error",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    }
  }
}
