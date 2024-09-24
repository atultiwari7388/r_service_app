import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../utils/constants.dart';

class RatingsScreen extends StatefulWidget {
  const RatingsScreen({super.key});

  @override
  State<RatingsScreen> createState() => _RatingsScreenState();
}

class _RatingsScreenState extends State<RatingsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<Map<String, dynamic>> ratings = [];

  Future<void> fetchUsersRatings() async {
    try {
      String currentUId = _auth.currentUser?.uid ?? '';
      QuerySnapshot ratingsSnapshot = await _firestore
          .collection('Mechanics')
          .doc(currentUId)
          .collection('ratings')
          .get();

      List<Map<String, dynamic>> fetchedRatings = [];

      for (var ratingDoc in ratingsSnapshot.docs) {
        var data = ratingDoc.data() as Map<String, dynamic>;
        String uId = data['uId'];

        // Fetch mechanic name using mId
        DocumentSnapshot mechanicSnapshot =
            await _firestore.collection('Users').doc(uId).get();

        String userName = mechanicSnapshot['userName'];

        fetchedRatings.add({
          'uId': uId,
          'userName': userName,
          'orderId': data['orderId'],
          'rating': data['rating'],
          'review': data['review'],
          'timeStamp': data['timestamp'],
        });
      }

      setState(() {
        ratings = fetchedRatings;
      });
    } catch (e) {
      log("Error fetching user ratings: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    fetchUsersRatings();
  }

  String formatDate(Timestamp timestamp) {
    var date = timestamp.toDate();
    return DateFormat('dd MMM yyyy, hh:mm a').format(date);
  }

  Color getRatingColor(double rating) {
    if (rating >= 4.5) {
      return Colors.green[300]!;
    } else if (rating >= 3.0) {
      return Colors.orange[300]!;
    } else {
      return Colors.red[300]!;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ratings'),
      ),
      body: ratings.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: ratings.length,
              itemBuilder: (context, index) {
                var rating = ratings[index];
                return Card(
                  margin: const EdgeInsets.all(8.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15.0),
                  ),
                  elevation: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      color: kWhite,
                      borderRadius: BorderRadius.circular(15.0),
                    ),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              rating['userName'],
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Row(
                              children: [
                                Icon(
                                  Icons.star,
                                  color: Colors.amber,
                                ),
                                Text(
                                  '${rating['rating']}/5',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Order ID: ${rating['orderId']}',
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Review: ${rating['review']}',
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Date: ${formatDate(rating['timeStamp'])}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
