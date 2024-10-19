import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/views/myJobs/widgets/my_jobs_card.dart';
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
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "My Jobs",
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(20, kDark, FontWeight.normal)),
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

                  if (userPhoto.isEmpty) {
                    return Text(
                      userName.isNotEmpty ? userName[0] : '',
                      style: kIsWeb
                          ? TextStyle(color: kWhite)
                          : appStyle(20, kWhite, FontWeight.w500),
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

                  final data = snapshot.data!.docs;

                  return data.isEmpty
                      ? Center(child: Text("No Jobs Created"))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: data.length,
                          itemBuilder: (context, index) {
                            final job =
                                data[index].data() as Map<String, dynamic>;
                            final vehicleNumber = job['vehicleNumber'] ?? "N/A";

                            DateTime orderDateTime;
                            if (job['orderDate'] is Timestamp) {
                              orderDateTime = (job['orderDate'] as Timestamp)
                                  .toDate()
                                  .toLocal();
                            } else {
                              orderDateTime = DateTime.now();
                            }
                            final mechanicsOffer =
                                job["mechanicsOffer"] as List<dynamic>? ?? [];

                            return MyJobsCard(
                              companyNameAndVehicleName:
                                  "${job["companyName"]} (${vehicleNumber})",
                              address: job["userDeliveryAddress"].toString(),
                              serviceName: job["selectedService"].toString(),
                              jobId: job["orderId"].toString(),
                              imagePath: job["userPhoto"].toString().isEmpty
                                  ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                  : job["userPhoto"].toString(),
                              dateTime:
                                  orderDateTime, // Pass DateTime object directly
                              onButtonTap: () {
                                Get.to(() => RequestsScreen(
                                      serviceName:
                                          job["selectedService"].toString(),
                                      id: job["orderId"].toString(),
                                      companyAndVehicleName:
                                          "${job["companyName"]} (${vehicleNumber})",
                                    ));
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
                                            Navigator.pop(context);
                                            _showReasonDialog(job['orderId']);
                                          },
                                          child: Text("Yes"),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              },
                              currentStatus: job["status"],
                              nearByDistance: job["nearByDistance"],
                              onDistanceChanged: (newDistance) {
                                _updateNearbyDistance(newDistance,
                                    job["nearByDistance"], job['orderId']);
                              },
                              userLat: job["userLat"],
                              userLong: job["userLong"],
                              mechanicOffers: mechanicsOffer,
                            );
                          },
                        );
                },
              ),
              SizedBox(height: 50.h)
            ],
          ),
        ),
      ),
    );
  }

  void _updateNearbyDistance(
      num newDistance, num nearByDistance, String jobId) async {
    try {
      var data = {
        "nearByDistance": newDistance,
      };

      // Update the Firestore `jobs` collection
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(jobId)
          .update(data);

      // Check if the history document exists
      DocumentReference historyDoc = await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection("history")
          .doc(jobId);

      // Get the history document snapshot
      DocumentSnapshot docSnapshot = await historyDoc.get();

      if (docSnapshot.exists) {
        // If document exists, update it
        await historyDoc.update(data);
      } else {
        // If document does not exist, create it
        await historyDoc.set(data);
      }

      setState(() {
        nearByDistance = newDistance;
      });

      Get.snackbar("Success", "Nearby distance updated to $newDistance km.",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white);
    } catch (error) {
      Get.snackbar("Error", "Failed to update distance: $error",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    }
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
