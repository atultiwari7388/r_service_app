import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/manageTrips/trip_details.dart';

class ViewMemberTrip extends StatefulWidget {
  const ViewMemberTrip({
    super.key,
    required this.memberId,
    required this.memberName,
    required this.ownerId,
    required this.perMileCharge,
  });

  final String memberId;
  final String memberName;
  final String ownerId;
  final num perMileCharge;

  @override
  State<ViewMemberTrip> createState() => _ViewMemberTripState();
}

class _ViewMemberTripState extends State<ViewMemberTrip> {
  DateTime? selectedFilterDate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.memberName}'s Trip"),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list, color: kPrimary),
            onPressed: () async {
              final DateTime? pickedDate = await showDatePicker(
                context: context,
                initialDate: selectedFilterDate ?? DateTime.now(),
                firstDate: DateTime(2000),
                lastDate: DateTime(2100),
              );

              if (pickedDate != null) {
                setState(() {
                  selectedFilterDate = pickedDate;
                });
              }
            },
          ),
        ],
      ),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance
            .collection("Users")
            .doc(widget.memberId)
            .collection('trips')
            .snapshots(),
        builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
          if (!snapshot.hasData) return const CircularProgressIndicator();

          // Convert selectedFilterDate to formatted string for comparison
          String? selectedDateStr = selectedFilterDate != null
              ? DateFormat('dd MMM yyyy').format(selectedFilterDate!)
              : null;

          // Filter trips based on selected date
          var filteredTrips = snapshot.data!.docs.where((doc) {
            String tripDate =
                DateFormat('dd MMM yyyy').format(doc['createdAt'].toDate());
            return selectedFilterDate == null || tripDate == selectedDateStr;
          }).toList();

          // Show message if no trips match the selected date
          if (filteredTrips.isEmpty) {
            return Padding(
              padding: const EdgeInsets.only(top: 20),
              child: Center(
                child: Text(
                  "No trips found",
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red),
                ),
              ),
            );
          }

          return ListView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: filteredTrips.map((doc) {
              bool isPaid = doc['isPaid'];
              String formattedStartDate = DateFormat('dd MMM yyyy')
                  .format(doc['tripStartDate'].toDate());
              String formattedEndDate =
                  DateFormat('dd MMM yyyy').format(doc['tripEndDate'].toDate());

              num tripStartMiles = doc['tripStartMiles'];
              num tripEndMiles = doc['tripEndMiles'];
              num totalMiles = doc['tripEndMiles'] - doc['tripStartMiles'];
              num perMileCharges = num.parse(widget.perMileCharge.toString());
              num earnings = totalMiles * perMileCharges;
              String tripStatus = getStringFromTripStatus(doc['tripStatus']);

              return FutureBuilder<QuerySnapshot>(
                future: FirebaseFirestore.instance
                    .collection("Users")
                    .doc(widget.memberId)
                    .collection('trips')
                    .doc(doc.id)
                    .collection('tripDetails')
                    .where('tripId', isEqualTo: doc.id) // ✅ Match tripId
                    .get(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Container(); // Prevents flickering UI while loading
                  }

                  // ✅ If tripDetails subcollection doesn't exist or is empty, hide "Total Expenses"
                  if (!snapshot.hasData ||
                      snapshot.data == null ||
                      snapshot.data!.docs.isEmpty) {
                    return buildTripCard(
                        doc,
                        formattedStartDate,
                        tripStartMiles,
                        tripStatus,
                        formattedEndDate,
                        tripEndMiles,
                        totalMiles,
                        earnings,
                        isPaid,
                        0);
                  }

                  // ✅ Sum all "amount" values ONLY if tripId matches
                  num totalExpenses = snapshot.data!.docs.fold(
                    0,
                    (sum, item) => sum + (item['amount'] ?? 0),
                  );

                  return buildTripCard(
                      doc,
                      formattedStartDate,
                      tripStartMiles,
                      tripStatus,
                      formattedEndDate,
                      tripEndMiles,
                      totalMiles,
                      earnings,
                      isPaid,
                      totalExpenses);
                },
              );

              // return buildTripCard(doc, formattedStartDate, tripStartMiles, tripStatus, formattedEndDate, tripEndMiles, totalMiles, earnings);
            }).toList(),
          );
        },
      ),
    );
  }

  Container buildTripCard(
    QueryDocumentSnapshot<Object?> doc,
    String formattedStartDate,
    num tripStartMiles,
    String tripStatus,
    String formattedEndDate,
    num tripEndMiles,
    num totalMiles,
    num earnings,
    bool isPaid,
    num totalExpenses,
  ) {
    return Container(
      padding: EdgeInsets.all(5.w),
      margin: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(10.r),
        border: Border.all(color: kPrimary),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Text(doc['tripName'],
                style: appStyle(16, kDark, FontWeight.w500)),
          ),
          SizedBox(height: 10.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Start Date: $formattedStartDate"),
              Text("Start Miles: $tripStartMiles"),
            ],
          ),
          SizedBox(height: 5.h),
          if (tripStatus == "Completed") ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("End Date: $formattedEndDate"),
                Text("End Miles: $tripEndMiles"),
              ],
            ),
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Total Miles: $totalMiles"),
                Text("Earnings: $earnings"),
              ],
            ),
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [Text("Total Expenses:"), Text("\$${totalExpenses}")],
            ),
            SizedBox(height: 5.h),
            Row(
              children: [
                Text("Payment Status: "),
                Spacer(),
                isPaid
                    ? Text("Paid",
                        style: appStyle(16, kSecondary, FontWeight.w500))
                    : ElevatedButton(
                        onPressed: () {},
                        child: Text("Pay"),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary, foregroundColor: kWhite))
              ],
            ),
            SizedBox(height: 5.h),
            Center(
              child: ElevatedButton(
                onPressed: () => Get.to(() => TripDetailsScreen(
                      docId: doc.id,
                      userId: widget.memberId,
                      tripName: doc['tripName'],
                    )),
                child: Text("View Details"),
                style: ElevatedButton.styleFrom(
                    backgroundColor: kSecondary, foregroundColor: kWhite),
              ),
            )
          ]
        ],
      ),
    );
  }

  String getStringFromTripStatus(int status) {
    if (status == 0) {
      return 'Pending';
    } else if (status == 1) {
      return 'Started';
    } else if (status == 2) {
      return 'Completed';
    }
    return 'Pending';
  }

  int getIntFromTripStatus(String status) {
    if (status == 'Pending') {
      return 0;
    } else if (status == 'Started') {
      return 1;
    } else if (status == 'Completed') {
      return 2;
    }
    return 0;
  }
}
