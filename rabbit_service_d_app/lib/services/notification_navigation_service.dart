import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/cloud_noti_msg.dart';

class NotificationNavigationService {
  static bool pendingNotificationCenter = false;

  /// Retrieves the effective user ID for the current authenticated user.
  /// If the user is a SubOwner, returns the owner ID (`createdBy`); otherwise returns the user's UID.
  static Future<String> getEffectiveUserId() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return '';

    try {
      if (Get.isRegistered<DashboardController>()) {
        final dash = Get.find<DashboardController>();
        if (dash.role == 'SubOwner' && dash.ownerId.isNotEmpty) {
          return dash.ownerId;
        } else if (dash.role.isNotEmpty && dash.role != 'SubOwner') {
          return user.uid;
        }
      }

      final doc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(user.uid)
          .get();

      if (doc.exists) {
        final data = doc.data();
        if (data != null &&
            data['role'] == 'SubOwner' &&
            data['createdBy'] != null &&
            data['createdBy'].toString().isNotEmpty) {
          return data['createdBy'].toString();
        }
      }
    } catch (e) {
      log("Error fetching effective user id for notification navigation: $e");
    }

    return user.uid;
  }

  /// Redirects the user directly to CloudNotificationMessageCenter
  static Future<void> openNotificationCenter() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        log("No logged in user found on notification tap; marking pending");
        pendingNotificationCenter = true;
        return;
      }

      final effectiveUserId = await getEffectiveUserId();
      if (effectiveUserId.isEmpty) {
        log("Effective user id empty; marking pending");
        pendingNotificationCenter = true;
        return;
      }

      pendingNotificationCenter = false;
      log("Navigating to CloudNotificationMessageCenter for user $effectiveUserId");

      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.to(() => CloudNotificationMessageCenter(
              currentUId: effectiveUserId,
            ));
      });
    } catch (e) {
      log("Error in openNotificationCenter: $e");
    }
  }

  /// Checks if there was a pending notification tap (e.g. from cold start) and navigates
  static void checkAndOpenPending() {
    if (pendingNotificationCenter) {
      pendingNotificationCenter = false;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        openNotificationCenter();
      });
    }
  }
}
