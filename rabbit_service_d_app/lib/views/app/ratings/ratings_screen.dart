import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class RatingsScreen extends StatefulWidget {
  const RatingsScreen({super.key});

  @override
  State<RatingsScreen> createState() => _RatingsScreenState();
}

class _RatingsScreenState extends State<RatingsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<Map<String, dynamic>> ratings = [];
  String? _userRole;
  String? _ownerId;
  bool _isLoading = true;

  // Get effective user ID based on role
  String get _effectiveUserId {
    return _userRole == 'SubOwner' ? _ownerId! : _auth.currentUser?.uid ?? '';
  }

  Future<void> _fetchUserRole() async {
    try {
      String currentUId = _auth.currentUser?.uid ?? '';
      if (currentUId.isEmpty) return;

      DocumentSnapshot userSnapshot =
          await _firestore.collection('Users').doc(currentUId).get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        setState(() {
          _userRole = userData['role']?.toString() ?? '';
          _ownerId = userData['createdBy']?.toString() ?? currentUId;
        });
      }
    } catch (e) {
      log("Error fetching user role: $e");
    }
  }

  Future<void> fetchUsersRatings() async {
    try {
      await _fetchUserRole(); // Ensure role is fetched first

      String effectiveUserId = _effectiveUserId;

      if (effectiveUserId.isEmpty) {
        setState(() {
          ratings = [];
          _isLoading = false;
        });
        return;
      }

      QuerySnapshot ratingsSnapshot = await _firestore
          .collection('Users')
          .doc(effectiveUserId) // Use effective user ID
          .collection('ratings')
          .orderBy('timestamp', descending: true) // Sort by latest first
          .get();

      List<Map<String, dynamic>> fetchedRatings = [];

      for (var ratingDoc in ratingsSnapshot.docs) {
        var data = ratingDoc.data() as Map<String, dynamic>;
        String mId = data['mId'];

        // Fetch mechanic name using mId
        DocumentSnapshot mechanicSnapshot =
            await _firestore.collection('Mechanics').doc(mId).get();

        if (mechanicSnapshot.exists) {
          String mechanicName =
              mechanicSnapshot['userName'] ?? 'Unknown Mechanic';

          fetchedRatings.add({
            'mId': mId,
            'mechanicName': mechanicName,
            'orderId': data['orderId'] ?? 'N/A',
            'rating': data['rating'] ?? 0.0,
            'review': data['review'] ?? 'No review provided',
            'timeStamp': data['timestamp'],
            'ratedBySubOwner':
                _userRole == 'SubOwner', // Track if rated by subowner
          });
        }
      }

      setState(() {
        ratings = fetchedRatings;
        _isLoading = false;
      });
    } catch (e) {
      log("Error fetching user ratings: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    fetchUsersRatings();
  }

  String formatDate(Timestamp timestamp) {
    try {
      var date = timestamp.toDate();
      return DateFormat('dd MMM yyyy, hh:mm a').format(date);
    } catch (e) {
      return 'Invalid Date';
    }
  }

  Color getRatingColor(double rating) {
    if (rating >= 4.5) {
      return Colors.green;
    } else if (rating >= 3.0) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }

  Widget _buildRatingCard(Map<String, dynamic> rating) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15.0),
      ),
      elevation: 2,
      child: Container(
        decoration: BoxDecoration(
          color: kWhite,
          borderRadius: BorderRadius.circular(15.0),
          border: Border.all(
            color: getRatingColor(rating['rating']).withOpacity(0.3),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with mechanic name and rating
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rating['mechanicName'],
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (_userRole == 'SubOwner')
                        Container(
                          margin: EdgeInsets.only(top: 4),
                          padding:
                              EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Owner\'s Rating',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue[700],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: getRatingColor(rating['rating']).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: getRatingColor(rating['rating']),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.star,
                        color: Colors.amber,
                        size: 16,
                      ),
                      SizedBox(width: 4),
                      Text(
                        '${rating['rating']}/5',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: getRatingColor(rating['rating']),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Order ID
            Row(
              children: [
                Icon(Icons.receipt, size: 16, color: Colors.grey[600]),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Order ID: ${rating['orderId']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Review
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.message, size: 16, color: Colors.grey[600]),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Review:',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        rating['review'],
                        style: const TextStyle(fontSize: 14),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Date
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                SizedBox(width: 8),
                Text(
                  formatDate(rating['timeStamp']),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.star_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          SizedBox(height: 16),
          Text(
            _userRole == 'SubOwner'
                ? "No ratings found for owner"
                : "No ratings found",
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          Text(
            _userRole == 'SubOwner'
                ? "Ratings given to the owner will appear here"
                : "Your ratings will appear here",
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _userRole == 'SubOwner' ? "Owner's Ratings" : 'My Ratings',
        ),
        backgroundColor: kPrimary,
        foregroundColor: kWhite,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : ratings.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    if (_userRole == 'SubOwner')
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(12),
                        color: Colors.blue[50],
                        child: Row(
                          children: [
                            Icon(Icons.info_outline,
                                color: Colors.blue, size: 16),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                "Viewing ratings given to the owner",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: ratings.length,
                        itemBuilder: (context, index) {
                          return _buildRatingCard(ratings[index]);
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}
