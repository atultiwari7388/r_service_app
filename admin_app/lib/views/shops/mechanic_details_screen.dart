import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/views/shops/mechanic_booking_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../utils/app_styles.dart';

class MechanicDetailsScreen extends StatefulWidget {
  final DocumentSnapshot riderData;

  const MechanicDetailsScreen({super.key, required this.riderData});

  @override
  State<MechanicDetailsScreen> createState() => _MechanicDetailsScreenState();
}

class _MechanicDetailsScreenState extends State<MechanicDetailsScreen> {
  Future<Map<String, dynamic>> fetchRatings() async {
    final userId =
        widget.riderData.id; // Assuming the rider ID is the document ID
    final snapshot = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(userId)
        .collection('ratings')
        .get();

    if (snapshot.docs.isEmpty) {
      return {'ratings': [], 'averageRating': 0.0};
    }

    final ratings =
    snapshot.docs.map((doc) => doc.data()['rating'] as num).toList();
    final averageRating = ratings.reduce((a, b) => a + b) / ratings.length;

    return {'ratings': ratings, 'averageRating': averageRating};
  }

  String _formatDateTime(DateTime dateTime) {
    final DateFormat dateFormat = DateFormat('yyyy-MM-dd HH:mm:ss');
    return dateFormat.format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "${widget.riderData['userName']}'s Details",
          style: appStyle(18, kDark, FontWeight.normal),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
            onPressed: () {
              Get.to(
                    () => ViewAllMechanicsOrders(
                    mId: widget.riderData["uid"],
                    mName: widget.riderData['userName']),
              );
            },
            child: Text("View Bookings",
                style: appStyle(12, kWhite, FontWeight.normal)),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            FutureBuilder<Map<String, dynamic>>(
              future: fetchRatings(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final data = snapshot.data!;
                final ratings = data['ratings'] as List;
                final averageRating = data['averageRating'] as double;

                if (ratings.isEmpty) {
                  return Center(child: Text("This mechanic has no ratings."));
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        RatingBarIndicator(
                          rating: averageRating,
                          itemBuilder: (context, index) => Icon(
                            Icons.star,
                            color: Colors.amber,
                          ),
                          itemCount: 5,
                          itemSize: 30,
                          direction: Axis.horizontal,
                        ),
                        SizedBox(width: 10),
                        Text(
                          "${averageRating.toStringAsFixed(1)} (${ratings.length})",
                          style: appStyle(16, kDark, FontWeight.bold),
                        ),
                      ],
                    ),
                    SizedBox(height: 20),
                  ],
                );
              },
            ),
            _buildImageDocument(
                "Driver Image", widget.riderData['profilePicture']),
            _buildDetailItem(Icons.email, "Email", widget.riderData['email']),
            _buildDetailItem(
                Icons.phone, "Phone Number", widget.riderData['phoneNumber']),
          ],
        ),
      ),
    );
  }

  Widget _buildImageDocument(String title, String? imageUrl) {
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: appStyle(16, kDark, FontWeight.normal)),
          const SizedBox(height: 10),
          Image.network(imageUrl),
          TextButton.icon(
            onPressed: () {
              // Triggering download on the web using dart:html
              if (kIsWeb) {
                // AnchorElement(href: imageUrl)
                //   ..target = 'blank'
                //   ..download = title + '.png' // or any desired name
                //   ..click();
              }
            },
            icon: const Icon(Icons.download, color: kPrimary),
            label: const Text('Download', style: TextStyle(color: kDark)),
          ),
          const SizedBox(height: 20),
        ],
      );
    } else {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Text(title + ' not provided',
            style: appStyle(16, kDark, FontWeight.normal)),
      );
    }
  }

  Widget _buildDetailItem(IconData icon, String title, String value) {
    return Card(
      elevation: 4.0,
      margin: const EdgeInsets.symmetric(vertical: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
      ),
      child: ListTile(
        leading: Icon(icon, color: kSecondary, size: 30),
        title: Text(title, style: appStyle(16, kDark, FontWeight.normal)),
        subtitle: Text(value),
      ),
    );
  }
}
