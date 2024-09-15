import 'dart:math' as math;

double calculateDistance(
    double userLat, double userLng, double mecLat, double mecLng) {
  const double earthRadius = 6371; // Radius of the Earth in kilometers

  double lat1 = userLat * math.pi / 180;
  double lon1 = userLng * math.pi / 180;
  double lat2 = mecLat * math.pi / 180;
  double lon2 = mecLng * math.pi / 180;

  double dLat = lat2 - lat1;
  double dLon = lon2 - lon1;

  double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1) * math.cos(lat2) * math.sin(dLon / 2) * math.sin(dLon / 2);
  double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));

  return earthRadius * c; // Distance in kilometers
}
