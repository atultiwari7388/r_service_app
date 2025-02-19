import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';

class TripDetailsScreen extends StatefulWidget {
  const TripDetailsScreen({super.key, required this.docId});
  final String docId;

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Trip Details'),
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
            return Center(child: Text("No trip details found."));
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
                elevation: 3,
                margin: EdgeInsets.symmetric(vertical: 10),
                child: Padding(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Text("Trip ID: $tripId",
                      //     style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(height: 5),
                      Text("Type: $type"),
                      SizedBox(height: 5),
                      Text("Amount: ${amount.toStringAsFixed(2)}"),
                      SizedBox(height: 5),
                      Text("Description: $description"),
                      SizedBox(height: 5),
                      Text("Created At: $formattedDate"),
                      SizedBox(height: 10),
                      imageUrl.isNotEmpty
                          ? Image.network(imageUrl,
                              height: 150.h,
                              width: double.infinity,
                              fit: BoxFit.cover)
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
