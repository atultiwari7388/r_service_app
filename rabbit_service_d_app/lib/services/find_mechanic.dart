import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../utils/constants.dart';
import '../utils/show_toast_msg.dart';
import 'collection_references.dart';
import 'generate_order_id.dart';

Future<void> findMechanic(
  String address,
  String userPhoto,
  String name,
  String phoneNumber,
  double userLatitude,
  double userLongitude,
  String selectedService,
  String companyName,
  String vehicleNumber,
) async {
  try {
    // Generate order ID
    final orderId = await generateOrderId();

    // Save order details to user's history subcollection
    await FirebaseFirestore.instance
        .collection("Users")
        .doc(currentUId)
        .collection("history")
        .doc(orderId.toString())
        .set({
      'orderId': orderId.toString(),
      'userId': currentUId,
      "userPhoto": userPhoto,
      'userName': name,
      'selectedService': selectedService,
      "companyName": companyName,
      "vehicleNumber": vehicleNumber,
      'userPhoneNumber': phoneNumber,
      'userDeliveryAddress': address,
      'userLat': userLatitude,
      'userLong': userLongitude,
      'orderDate': DateTime.now(),
      'status': 0, // Status: 0 indicates order is pending
    });

    // Save order details to admin-accessible collection
    await FirebaseFirestore.instance
        .collection("jobs")
        .doc(orderId.toString())
        .set({
      'orderId': orderId.toString(),
      'userId': currentUId,
      'userName': name,
      "userPhoto": userPhoto,

      'selectedService': selectedService,
      "companyName": companyName,
      "vehicleNumber": vehicleNumber,
      'userPhoneNumber': phoneNumber,
      'userDeliveryAddress': address,
      'userLat': userLatitude,
      'userLong': userLongitude,
      'orderDate': DateTime.now(),
      'status': 0, // Status: 0 indicates order is pending
    });
    showToast('Job request submitted successfully');
    // Order placed successfully
    // showToastMessage("Success", "Order placed successfully!", kSuccess);
    print('Order placed successfully!');
  } catch (e) {
    // Error handling
    print('Failed to place order: $e');
    showToastMessage("Error", "Failed to Submit request: $e", kRed);
  }
}

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double earthRadius = 6371; // Radius of the earth in kilometers

  // Convert degrees to radians
  double dLat = _degreesToRadians(lat2 - lat1);
  double dLon = _degreesToRadians(lon2 - lon1);

  // Convert latitude and longitude to radians
  lat1 = _degreesToRadians(lat1);
  lat2 = _degreesToRadians(lat2);

  // Haversine formula
  double a =
      pow(sin(dLat / 2), 2) + pow(sin(dLon / 2), 2) * cos(lat1) * cos(lat2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  double distance = earthRadius * c;

  return distance;
}

double _degreesToRadians(double degrees) {
  return degrees * (pi / 180);
}

void showToast(String message) {
  Get.snackbar(
    'Notification',
    message,
    snackPosition: SnackPosition.BOTTOM,
    backgroundColor: Colors.black.withOpacity(0.7),
    colorText: Colors.white,
    margin: EdgeInsets.all(10),
    borderRadius: 10,
  );
}
