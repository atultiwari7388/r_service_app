import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  Future<String> getAboutUsDescription() async {
    // Access the Firestore collection 'metadata' and document 'about_us'
    DocumentSnapshot<Map<String, dynamic>> snapshot = await FirebaseFirestore
        .instance
        .collection('metadata')
        .doc('privacyPolicy')
        .get();

    // Check if the 'description' field exists and return it, or return a default string
    return snapshot.data()?['description'] ?? 'No description available';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
      ),
      body: FutureBuilder<String>(
        future: getAboutUsDescription(),
        builder: (BuildContext context, AsyncSnapshot<String> snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return const Center(child: Text('Error loading data'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No description available'));
          } else {
            // Show the description from Firestore
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                snapshot.data!,
                style: const TextStyle(fontSize: 16.0),
              ),
            );
          }
        },
      ),
    );
  }
}
