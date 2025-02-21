import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class TripDetailsScreen extends StatefulWidget {
  const TripDetailsScreen(
      {super.key, required this.docId, required this.tripName});
  final String docId;
  final String tripName;

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text('Trip Details', style: appStyle(18, kWhite, FontWeight.w500)),
        backgroundColor: kPrimary,
        iconTheme: IconThemeData(color: kWhite),
      ),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance
            .collection("Users")
            .doc(currentUId) // Replace with the current user ID
            .collection('trips')
            .doc(widget.docId)
            .collection('tripDetails')
            .snapshots(),
        builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(
                child: Text("No trip details found.",
                    style: TextStyle(fontSize: 18.sp, color: Colors.grey)));
          }

          return ListView(
            padding: EdgeInsets.all(10),
            children: snapshot.data!.docs.map((doc) {
              String tripId = doc['tripId'];
              String description = doc['description'];
              String imageUrl = doc['imageUrl'];
              String type = doc['type'];
              num amount = doc['amount'];
              String formattedDate =
                  DateFormat('dd MMM yyyy').format(doc['createdAt'].toDate());

              return Card(
                elevation: 1,
                margin: EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text("Type: $type",
                              style: TextStyle(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold)),
                          Spacer(),
                          Text("Date: $formattedDate",
                              style: TextStyle(
                                  fontSize: 12.sp, color: Colors.grey)),
                        ],
                      ),
                      SizedBox(height: 5),
                      Text("Amount: \$${amount.toStringAsFixed(2)}",
                          style:
                              TextStyle(fontSize: 16.sp, color: Colors.green)),
                      SizedBox(height: 5),
                      Text("Description: $description",
                          style: TextStyle(fontSize: 14.sp)),
                      SizedBox(height: 10),
                      imageUrl.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.network(imageUrl,
                                  height: 150.h,
                                  width: double.infinity,
                                  fit: BoxFit.cover),
                            )
                          : Container(),
                    ],
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
