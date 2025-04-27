import 'package:geocoding/geocoding.dart';
//================= Convert latlang to actual address =========================

Future<String> getAddressFromLtLng(String latLngString) async {
  // Assuming latLngString format is 'LatLng(x.x, y.y)'
  final coords = latLngString.split(', ');
  final latitude = double.parse(coords[0].split('(').last);
  final longitude = double.parse(coords[1].split(')').first);

  List<Placemark> placemarks =
      await placemarkFromCoordinates(latitude, longitude);

  if (placemarks.isNotEmpty) {
    final Placemark pm = placemarks.first;
    return "${pm.name}, ${pm.locality}, ${pm.administrativeArea}";
  }
  return '';
}
