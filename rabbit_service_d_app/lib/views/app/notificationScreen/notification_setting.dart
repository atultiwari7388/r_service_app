import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';

class NotificationScreenSetting extends StatefulWidget {
  const NotificationScreenSetting({super.key});

  @override
  State<NotificationScreenSetting> createState() =>
      _NotificationScreenSettingState();
}

class _NotificationScreenSettingState extends State<NotificationScreenSetting> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  bool _isNotificationOn = true;
  bool _isLoading = true;

  Future<void> fetchUserDetails() async {
    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        setState(() {
          _isNotificationOn = userData["isNotificationOn"] ?? true;
          _isLoading = false;
        });
      } else {
        log("No user document found for ID: $currentUId");
        _isLoading = false;
      }
    } catch (e) {
      log("Error fetching user details: $e");
      _isLoading = false;
    }
  }

  Future<void> updateNotificationStatus(bool value) async {
    try {
      await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .update({"isNotificationOn": value});
      showToastMessage("Success", "Value Change Successfully", kSecondary);

      log("Notification setting updated to: $value");
    } catch (e) {
      log("Error updating notification status: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    fetchUserDetails();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              title: const Text('Enable Notifications'),
              trailing: Switch(
                value: _isNotificationOn,
                onChanged: (value) {
                  setState(() {
                    _isNotificationOn = value;
                  });
                  updateNotificationStatus(value);
                },
              ),
            ),
    );
  }
}
