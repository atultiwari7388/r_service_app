import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
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
  DateTime? fromDate;
  DateTime? toDate;

  Future<void> _pickDateRange() async {
    DateTime now = DateTime.now();
    DateTime firstDate = DateTime(now.year - 5);
    DateTime lastDate = DateTime(now.year + 1);

    DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: firstDate,
      lastDate: lastDate,
      initialDateRange: fromDate != null && toDate != null
          ? DateTimeRange(start: fromDate!, end: toDate!)
          : null,
    );

    if (picked != null) {
      setState(() {
        fromDate = picked.start;
        toDate = picked.end;
      });
    }
  }

  // this helper function calculate the total Earning and expenses
  Future<Map<String, double>> calculateTotals(
      List<QueryDocumentSnapshot> trips, String perMileCharge, driverId) async {
    double totalExpenses = 0;
    double totalEarnings = 0;
    String userId = driverId;
    double perMile = double.tryParse(perMileCharge) ?? 0.0;

    for (var trip in trips) {
      // Calculate expenses from tripDetails
      var expensesSnapshot = await FirebaseFirestore.instance
          .collection("Users")
          .doc(userId)
          .collection('trips')
          .doc(trip.id)
          .collection('tripDetails')
          .where('type', isEqualTo: 'Expenses')
          .get();

      double tripExpenses = expensesSnapshot.docs
          .fold(0.0, (sum, doc) => sum + (doc['amount'] ?? 0.0));
      totalExpenses += tripExpenses;

      // Calculate earnings only for completed trips

      int startMiles = trip['tripStartMiles'];
      int endMiles = trip['tripEndMiles'];
      int miles = endMiles - startMiles;
      double earnings = miles * perMile;
      totalEarnings += earnings;
    }

    return {'expenses': totalExpenses, 'earnings': totalEarnings};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.memberName}'s Trip"),
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.only(left: 8.0, right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: Icon(Icons.filter_list, color: kPrimary),
                  onPressed: _pickDateRange,
                ),
                if (fromDate != null && toDate != null)
                  Text(
                    "${DateFormat('dd MMM yyyy').format(fromDate!)} - ${DateFormat('dd MMM yyyy').format(toDate!)}",
                    style: appStyle(14, kDark, FontWeight.w500),
                  ),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder(
              stream: FirebaseFirestore.instance
                  .collection("Users")
                  .doc(widget.memberId)
                  .collection('trips')
                  .snapshots(),
              builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                if (!snapshot.hasData) return const CircularProgressIndicator();

                var filteredTrips = snapshot.data!.docs.where((doc) {
                  DateTime tripDate = doc['createdAt'].toDate();
                  return (fromDate == null || tripDate.isAfter(fromDate!)) &&
                      (toDate == null || tripDate.isBefore(toDate!));
                }).toList();

                if (filteredTrips.isEmpty) {
                  return Center(
                    child: Text(
                      "No trips found",
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.red),
                    ),
                  );
                }

                return Column(
                  children: [
                    FutureBuilder<Map<String, double>>(
                      future: calculateTotals(filteredTrips,
                          widget.perMileCharge.toString(), widget.memberId),
                      builder: (context, totalsSnapshot) {
                        if (totalsSnapshot.connectionState ==
                            ConnectionState.waiting) {
                          return Padding(
                            padding: EdgeInsets.symmetric(vertical: 10.h),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        if (totalsSnapshot.hasError) {
                          return Text('Error calculating totals');
                        }
                        var totals = totalsSnapshot.data ??
                            {'expenses': 0.0, 'earnings': 0.0};
                        return Padding(
                          padding: EdgeInsets.symmetric(
                              vertical: 10.h, horizontal: 12.w),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 10.w, vertical: 10.h),
                                decoration: BoxDecoration(
                                    color: kPrimary.withOpacity(0.8),
                                    borderRadius: BorderRadius.circular(10)),
                                child: Column(
                                  children: [
                                    Text(
                                      'Total Expenses',
                                      style:
                                          appStyle(16, kWhite, FontWeight.w500),
                                    ),
                                    Text(
                                      "\$${totals['expenses']!.toStringAsFixed(2)}",
                                      style:
                                          appStyle(15, kWhite, FontWeight.w500),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 10.w, vertical: 10.h),
                                decoration: BoxDecoration(
                                    color: kSecondary.withOpacity(0.8),
                                    borderRadius: BorderRadius.circular(10)),
                                child: Column(
                                  children: [
                                    Text(
                                      'Total Earnings',
                                      style:
                                          appStyle(16, kWhite, FontWeight.w500),
                                    ),
                                    Text(
                                        "\$${totals['earnings']!.toStringAsFixed(2)}",
                                        style: appStyle(
                                            15, kWhite, FontWeight.normal))
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    ListView(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: filteredTrips.map((doc) {
                        bool isPaid = doc['isPaid'];
                        String formattedStartDate = DateFormat('dd MMM yyyy')
                            .format(doc['tripStartDate'].toDate());
                        String formattedEndDate = DateFormat('dd MMM yyyy')
                            .format(doc['tripEndDate'].toDate());

                        num tripStartMiles = doc['tripStartMiles'];
                        num tripEndMiles = doc['tripEndMiles'];
                        num totalMiles =
                            doc['tripEndMiles'] - doc['tripStartMiles'];
                        num perMileCharges =
                            num.parse(widget.perMileCharge.toString());
                        num earnings = totalMiles * perMileCharges;
                        String tripStatus =
                            getStringFromTripStatus(doc['tripStatus']);

                        return FutureBuilder<QuerySnapshot>(
                          future: FirebaseFirestore.instance
                              .collection("Users")
                              .doc(widget.memberId)
                              .collection('trips')
                              .doc(doc.id)
                              .collection('tripDetails')
                              .where('tripId',
                                  isEqualTo: doc.id) // ✅ Match tripId
                              .get(),
                          builder: (context, snapshot) {
                            if (snapshot.connectionState ==
                                ConnectionState.waiting) {
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
                    ),
                  ],
                );
              },
            ),
          ),
        ],
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
                        onPressed: () {
                          showDialog(
                              context: context,
                              builder: (context) {
                                return AlertDialog(
                                  title: Text('Payment'),
                                  content: Text("Are you sure to Pay ?",
                                      style: appStyle(
                                          17, kDark, FontWeight.normal)),
                                  actions: [
                                    TextButton(
                                      onPressed: () {
                                        FirebaseFirestore.instance
                                            .collection("Users")
                                            .doc(widget.memberId)
                                            .collection('trips')
                                            .doc(doc.id)
                                            .update({
                                          'isPaid': true,
                                        }).then((value) {
                                          Get.back();
                                        }).catchError((error) {
                                          print(error);
                                        });
                                      },
                                      child: Text('Confirm'),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                      },
                                      child: Text('Cancel'),
                                    ),
                                  ],
                                );
                              });
                        },
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
