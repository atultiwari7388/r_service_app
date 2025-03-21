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
    final userId = widget.riderData.id;
    try {
      final ratingsSnapshot = await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(userId)
          .collection('ratings')
          .orderBy('timestamp', descending: true)
          .get();

      if (ratingsSnapshot.docs.isEmpty) {
        return {'ratings': <Map<String, dynamic>>[], 'averageRating': 0.0};
      }

      List<Future<Map<String, dynamic>>> ratingFutures =
          ratingsSnapshot.docs.map((doc) async {
        final data = doc.data();
        final uId = data['uId'];

        String mechanicName = 'Unknown';

        if (uId != null && uId is String && uId.isNotEmpty) {
          final mechanicDoc = await FirebaseFirestore.instance
              .collection('Users')
              .doc(uId)
              .get();

          if (mechanicDoc.exists) {
            final mechanicData = mechanicDoc.data();
            mechanicName = mechanicData?['userName'] ?? 'Unknown';
          }
        }

        return {
          'rating': (data['rating'] ?? 0.0).toDouble(),
          'review': data['review'] ?? '',
          'userName': mechanicName,
          'timestamp':
              (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
        };
      }).toList();

      List<Map<String, dynamic>> ratings = await Future.wait(ratingFutures);

      double averageRating = 0.0;
      if (ratings.isNotEmpty) {
        double total = ratings.fold(
            0.0, (prev, element) => prev + (element['rating'] as double));
        averageRating = total / ratings.length;
      }

      return {'ratings': ratings, 'averageRating': averageRating};
    } catch (e) {
      // Return an empty ratings list and a 0 average if an error occurs
      return {'ratings': <Map<String, dynamic>>[], 'averageRating': 0.0};
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final DateFormat dateFormat = DateFormat('yyyy-MM-dd HH:mm:ss');
    return dateFormat.format(dateTime);
  }

  // New method to show reviews in a popup dialog
  void _showReviewsDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16.0),
            child: FutureBuilder<Map<String, dynamic>>(
              future: fetchRatings(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return SizedBox(
                    height: 200,
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                if (snapshot.hasError) {
                  return SizedBox(
                    height: 200,
                    child: Center(child: Text('Error: ${snapshot.error}')),
                  );
                }

                final data = snapshot.data!;
                final ratings = data['ratings'] as List<Map<String, dynamic>>;
                final averageRating = data['averageRating'] as double;

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "Reviews",
                      style: appStyle(20, kDark, FontWeight.bold),
                    ),
                    SizedBox(height: 10),
                    ratings.isEmpty
                        ? Text("This Mechanic has no ratings yet.",
                            style: appStyle(14, kDark, FontWeight.normal))
                        : Expanded(
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: ratings.length,
                              itemBuilder: (context, index) {
                                final rating = ratings[index];
                                return Card(
                                  elevation: 2.0,
                                  margin:
                                      const EdgeInsets.symmetric(vertical: 8.0),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10.0),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              rating['userName'],
                                              style: appStyle(
                                                  16, kDark, FontWeight.bold),
                                            ),
                                          ],
                                        ),
                                        RatingBarIndicator(
                                          rating: (rating['rating'] as double),
                                          itemBuilder: (context, index) => Icon(
                                            Icons.star,
                                            color: Colors.amber,
                                          ),
                                          itemCount: 5,
                                          itemSize: 20,
                                          direction: Axis.horizontal,
                                        ),
                                        SizedBox(height: 5),
                                        Text(
                                          rating['review'],
                                          style: appStyle(
                                              14, kDark, FontWeight.normal),
                                        ),
                                        SizedBox(height: 5),
                                        Text(
                                          _formatDateTime(rating['timestamp']),
                                          style: appStyle(12, kSecondary,
                                              FontWeight.normal),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text("Close",
                            style: appStyle(14, kPrimary, FontWeight.bold)),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
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
                final ratings = data['ratings'] as List<Map<String, dynamic>>;
                final averageRating = data['averageRating'] as double;

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
                        Spacer(),
                      ],
                    ),
                    SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                      ),
                      onPressed: _showReviewsDialog,
                      child: Text(
                        "View Reviews",
                        style: appStyle(12, kWhite, FontWeight.normal),
                      ),
                    ),

                    // Remove the inline Reviews Section
                    // Optionally, you can remove the "Reviews" header and related widgets below
                  ],
                );
              },
            ),
            SizedBox(height: 20),
            _buildImageDocument(
                "Mechanic Image", widget.riderData['profilePicture']),
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
                // Uncomment and import 'dart:html' if needed
                // import 'dart:html' as html;
                // html.AnchorElement(href: imageUrl)
                //   ..target = 'blank'
                //   ..download = '$title.png' // or any desired name
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
