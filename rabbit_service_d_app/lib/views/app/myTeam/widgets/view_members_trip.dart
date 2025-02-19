import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';

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
                DateFormat('dd MMM yyyy').format(doc['date'].toDate());
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
              num totalMiles = doc['currentMiles'];
              num perMileCharges = widget.perMileCharge;
              num earnings = totalMiles * perMileCharges;
              String formattedDate =
                  DateFormat('dd MMM yyyy').format(doc['date'].toDate());
              bool isPaid = doc['isPaid'];

              return Container(
                padding: EdgeInsets.all(5.w),
                margin: EdgeInsets.all(10.w),
                decoration: BoxDecoration(
                  color: kWhite,
                  borderRadius: BorderRadius.circular(10.r),
                  border: Border.all(color: kPrimary),
                ),
                child: ListTile(
                  title: Text(doc['tripName']),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Miles: $totalMiles"),
                      Text("Earnings: \$${earnings.toString()}"),
                      Text("Date: $formattedDate"),
                    ],
                  ),
                  trailing: isPaid
                      ? Text("Paid",
                          style: appStyle(18, kSecondary, FontWeight.bold))
                      : ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary,
                            foregroundColor: kWhite,
                            elevation: 0,
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: Text("Pay"),
                                content: Text("Are you sure you want to pay?"),
                                actions: [
                                  TextButton(
                                      onPressed: () async {
                                        await FirebaseFirestore.instance
                                            .collection("Users")
                                            .doc(widget.memberId)
                                            .collection('trips')
                                            .doc(doc.id)
                                            .update({'isPaid': true}).then(
                                                (value) {
                                          showToastMessage(
                                              "Success",
                                              "Trip paid successfully",
                                              kSecondary);
                                          Navigator.pop(context);
                                        });
                                      },
                                      child: Text("Pay",
                                          style: appStyle(18, kSecondary,
                                              FontWeight.w400))),
                                  TextButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                      },
                                      child: Text(
                                        "Cancel",
                                        style: appStyle(
                                            18, kPrimary, FontWeight.w400),
                                      )),
                                ],
                              ),
                            );
                          },
                          child: Text("Pay"),
                        ),
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
