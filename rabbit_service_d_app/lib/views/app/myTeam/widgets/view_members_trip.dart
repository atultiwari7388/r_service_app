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
    required this.role,
  });

  final String memberId;
  final String memberName;
  final String ownerId;
  final num perMileCharge;
  final String role;

  @override
  State<ViewMemberTrip> createState() => _ViewMemberTripState();
}

class _ViewMemberTripState extends State<ViewMemberTrip> {
  DateTime? fromDate;
  DateTime? toDate;

  final TextEditingController _tripNameController = TextEditingController();
  final TextEditingController _startMilesController = TextEditingController();
  final TextEditingController _endMilesController = TextEditingController();
  final TextEditingController _googleMilesController = TextEditingController();
  DateTime? _selectedStartDate;
  DateTime? _selectedEndDate;

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

      // Only calculate earnings if miles is positive
      if (miles > 0) {
        double earnings = miles * perMile;
        totalEarnings += earnings;
      }
    }

    return {
      'expenses': totalExpenses,
      'earnings': totalEarnings < 0 ? 0 : totalEarnings
    };
  }

  Future<void> _showEditDialog(DocumentSnapshot tripDoc) async {
    _tripNameController.text = tripDoc['tripName'];
    _startMilesController.text = tripDoc['tripStartMiles'].toString();
    _endMilesController.text = tripDoc['tripEndMiles'].toString();
    _selectedStartDate = tripDoc['tripStartDate'].toDate();
    _selectedEndDate = tripDoc['tripEndDate'].toDate();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text('Edit Trip Details'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _tripNameController,
                      decoration: InputDecoration(labelText: 'Trip Name'),
                    ),
                    SizedBox(height: 10.h),
                    TextField(
                      controller: _startMilesController,
                      decoration: InputDecoration(labelText: 'Start Miles'),
                      keyboardType: TextInputType.number,
                    ),
                    SizedBox(height: 10.h),
                    TextField(
                      controller: _endMilesController,
                      decoration: InputDecoration(labelText: 'End Miles'),
                      keyboardType: TextInputType.number,
                    ),
                    SizedBox(height: 10.h),
                    ListTile(
                      title: Text(
                          'Start Date: ${_selectedStartDate != null ? DateFormat('dd MMM yyyy').format(_selectedStartDate!) : 'Not selected'}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedStartDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedStartDate = picked;
                          });
                        }
                      },
                    ),
                    ListTile(
                      title: Text(
                          'End Date: ${_selectedEndDate != null ? DateFormat('dd MMM yyyy').format(_selectedEndDate!) : 'Not selected'}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedEndDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedEndDate = picked;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    if (_tripNameController.text.isEmpty ||
                        _startMilesController.text.isEmpty ||
                        _endMilesController.text.isEmpty ||
                        _selectedStartDate == null ||
                        _selectedEndDate == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Please fill all fields')),
                      );
                      return;
                    }

                    try {
                      await FirebaseFirestore.instance
                          .collection("Users")
                          .doc(widget.memberId)
                          .collection('trips')
                          .doc(tripDoc.id)
                          .update({
                        'tripName': _tripNameController.text,
                        'tripStartMiles': int.parse(_startMilesController.text),
                        'tripEndMiles': int.parse(_endMilesController.text),
                        'tripStartDate': _selectedStartDate,
                        'tripEndDate': _selectedEndDate,
                      });
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Trip updated successfully')),
                      );
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error updating trip: $e')),
                      );
                    }
                  },
                  child: Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showGoogleMilesDialog(DocumentSnapshot tripDoc) async {
    _googleMilesController.clear();

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add Google Miles'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _googleMilesController,
                decoration: InputDecoration(labelText: 'Enter Google Miles'),
                keyboardType: TextInputType.number,
              ),
              SizedBox(height: 10.h),
              FutureBuilder<DocumentSnapshot>(
                future: FirebaseFirestore.instance
                    .collection("Users")
                    .doc(widget.memberId)
                    .get(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return CircularProgressIndicator();
                  }
                  if (snapshot.hasError) {
                    return Text('Error loading driver data');
                  }

                  String perMileCharge = snapshot.data?['perMileCharge'] ?? '0';
                  double googleMiles =
                      double.tryParse(_googleMilesController.text) ?? 0;
                  double totalEarning =
                      googleMiles * double.parse(perMileCharge);

                  return Column(
                    children: [
                      Text('Per Mile Charge: \$$perMileCharge'),
                      SizedBox(height: 10.h),
                      Text(
                        'Total Earning: \$${totalEarning.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                if (_googleMilesController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please enter Google Miles')),
                  );
                  return;
                }

                try {
                  // Get driver's perMileCharge
                  DocumentSnapshot driverDoc = await FirebaseFirestore.instance
                      .collection("Users")
                      .doc(widget.memberId)
                      .get();

                  String perMileCharge = driverDoc['perMileCharge'] ?? '0';
                  double googleMiles =
                      double.parse(_googleMilesController.text);
                  double googleTotalEarning =
                      googleMiles * double.parse(perMileCharge);

                  // Update the trip document
                  await FirebaseFirestore.instance
                      .collection("Users")
                      .doc(widget.memberId)
                      .collection('trips')
                      .doc(tripDoc.id)
                      .update({
                    'googleMiles': googleMiles,
                    'googleTotalEarning': googleTotalEarning,
                  });

                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Google Miles added successfully')),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error adding Google Miles: $e')),
                  );
                }
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.memberName}'s Trip"),
      ),
      body: SingleChildScrollView(
        child: Column(
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
            StreamBuilder(
              stream: FirebaseFirestore.instance
                  .collection("Users")
                  .doc(widget.memberId)
                  .collection('trips')
                  .snapshots(),
              builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                if (!snapshot.hasData) return const CircularProgressIndicator();

                var filteredTrips = snapshot.data!.docs.where((doc) {
                  DateTime tripStartDate = doc['tripStartDate'].toDate();
                  DateTime tripEndDate = doc['tripEndDate'].toDate();

                  // ✅ Show trips **only if** they overlap the selected range correctly
                  return (fromDate == null ||
                          tripEndDate.isAfter(
                              fromDate!.subtract(const Duration(days: 1)))) &&
                      (toDate == null ||
                          tripStartDate.isBefore(
                                  toDate!.add(const Duration(days: 1))) &&
                              tripEndDate.isAfter(
                                  toDate!.subtract(const Duration(days: 1))));
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
                                      "\$${totals['expenses']!.toStringAsFixed(0)}",
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
                                        "\$${totals['earnings']!.toStringAsFixed(0)}",
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
                              .where('tripId', isEqualTo: doc.id)
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
                      }).toList(),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
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
    // // Check if google miles data exists
    bool hasGoogleMiles = doc['googleMiles'] != null;
    num googleMiles = hasGoogleMiles ? doc['googleMiles'] : 0;
    num googleTotalEarning = hasGoogleMiles ? doc['googleTotalEarning'] : 0;
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
                Text("Earnings: \$${earnings.toStringAsFixed(0)}",
                    style: appStyle(14, kSecondary, FontWeight.w500)),
                Text("Trip Miles: ${totalMiles.toStringAsFixed(0)}"),
              ],
            ),
            if (hasGoogleMiles) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("G'Miles: ${googleMiles.toStringAsFixed(0)}",
                      style: appStyle(14, Colors.blue, FontWeight.w500)),
                  Text("G'Earnings: \$${googleTotalEarning.toStringAsFixed(0)}",
                      style: appStyle(14, Colors.green, FontWeight.w500)),
                ],
              ),
            ],
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Expenses: \$${totalExpenses.toStringAsFixed(0)}",
                    style: appStyle(15, kPrimary, FontWeight.w500)),
              ],
            ),
            SizedBox(height: 5.h),
            Wrap(
              direction: Axis.horizontal,
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                isPaid
                    ? ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kSecondary,
                          foregroundColor: kWhite,
                        ),
                        onPressed: null,
                        child: Text("Paid"))
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
                        child: Text(
                          "Pay",
                          style: appStyle(12, kWhite, FontWeight.normal),
                        ),
                        style: ElevatedButton.styleFrom(
                            minimumSize: Size(60, 40),
                            backgroundColor: kPrimary,
                            foregroundColor: kWhite)),
                SizedBox(width: 10.w),
                widget.role == "Manager"
                    ? SizedBox()
                    : ElevatedButton(
                        onPressed: () => _showEditDialog(doc),
                        child: Text("Edit",
                            style: appStyle(12, kWhite, FontWeight.normal)),
                        style: ElevatedButton.styleFrom(
                            minimumSize: Size(60, 40),
                            backgroundColor: Colors.orange,
                            foregroundColor: kWhite),
                      ),
                SizedBox(width: 10.w),
                widget.role == "Accountant"
                    ? ElevatedButton(
                        onPressed: () => _showGoogleMilesDialog(doc),
                        child: Text(
                          "Add Google Miles",
                          style: appStyle(12, kWhite, FontWeight.normal),
                        ),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: kWhite),
                      )
                    : Container(),
                SizedBox(width: 10.w),
                ElevatedButton(
                  onPressed: () => Get.to(() => TripDetailsScreen(
                        docId: doc.id,
                        userId: widget.memberId,
                        tripName: doc['tripName'],
                        truckDetails:
                            doc['companyName'] + " (${doc['vehicleNumber']})",
                        trailerDetails: doc['trailerCompanyName'] +
                            " (${doc['trailerNumber']})",
                      )),
                  child: Text(
                    "View",
                    style: appStyle(12, kWhite, FontWeight.normal),
                  ),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: kSecondary, foregroundColor: kWhite),
                ),
              ],
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
