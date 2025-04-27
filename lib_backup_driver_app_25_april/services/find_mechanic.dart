import 'dart:math';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

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
