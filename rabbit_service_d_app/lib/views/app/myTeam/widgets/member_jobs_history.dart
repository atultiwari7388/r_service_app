import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/views/app/myJobs/widgets/my_jobs_card.dart';
import '../../../../services/get_month_string.dart';
import 'memebr_jobs_card.dart';

class MemberJobsHistoryScreen extends StatefulWidget {
  const MemberJobsHistoryScreen({
    super.key,
    required this.memberName,
    required this.memebrId,
    required this.ownerId,
  });
  final String memberName;
  final String memebrId;
  final String ownerId;

  @override
  State<MemberJobsHistoryScreen> createState() =>
      _MemberJobsHistoryScreenState();
}

class _MemberJobsHistoryScreenState extends State<MemberJobsHistoryScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.memberName} History"),
      ),
      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: 10.h),
              StreamBuilder(
                // stream: FirebaseFirestore.instance
                //     .collection('jobs')
                //     .where("status", whereIn: [0, 1, 2, 3, 4, 5])
                //     .where("ownerId", isEqualTo: widget.ownerId.toString())
                //     .where("userId", isEqualTo: widget.memebrId)
                //     .orderBy("orderDate", descending: true)
                //     .snapshots(),

                stream: FirebaseFirestore.instance
                    .collection("Users")
                    .doc(widget.memebrId)
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

                            DateTime dateTime = DateTime.now();
                            if (job['orderDate'] is Timestamp) {
                              dateTime =
                                  (job['orderDate'] as Timestamp).toDate();
                            }

                            // return MemberJobsCard(
                            //   companyNameAndVehicleName:
                            //       "${job["companyName"]} (${vehicleNumber})",
                            //   address: job["userDeliveryAddress"].toString(),
                            //   serviceName: job["selectedService"].toString(),
                            //   jobId: job["orderId"].toString(),
                            //   imagePath: job["userPhoto"].toString().isEmpty
                            //       ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                            //       : job["userPhoto"].toString(),
                            //   dateTime: dateString,
                            //   status: getStatusString(status),
                            //   charges: job["arrivalCharges"].toString(),
                            //   fixCharges: job["fixPrice"].toString() ?? "0",
                            //   isImage: isImage,
                            // );

                            return MyJobsCard(
                              companyNameAndVehicleName: "${vehicleNumber}",
                              address: job["userDeliveryAddress"].toString(),
                              serviceName: job["selectedService"].toString(),
                              cancelationReason: job["cancelReason"].toString(),
                              jobId: job["orderId"].toString(),
                              imagePath: job["userPhoto"].toString().isEmpty
                                  ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                  : job["userPhoto"].toString(),
                              dateTime: dateTime,
                              currentStatus: job["status"],
                              userLat: job["userLat"],
                              userLong: job['userLong'],
                              description: job["description"].toString(),
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

  // Define a function to map numeric status to string status
  String getStatusString(int status) {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Mechanic Accepted";
      case 2:
        return "Driver Accepted";
      case 3:
        return "Paid";
      case 4:
        return "Ongoing";
      case 5:
        return "Completed";
      case -1:
        return "Cancelled";
      // Add more cases as needed for other statuses
      default:
        return "Unknown Status";
    }
  }
}
