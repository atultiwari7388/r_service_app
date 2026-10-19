import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class GoogleMapFlutterScreen extends StatefulWidget {
  const GoogleMapFlutterScreen({super.key});

  @override
  State<GoogleMapFlutterScreen> createState() => _GoogleMapFlutterScreenState();
}

class _GoogleMapFlutterScreenState extends State<GoogleMapFlutterScreen> {
  GoogleMapController? mapController;
  final LatLng _center =
      const LatLng(27.7172, 85.3240); // Example: Kathmandu, Nepal

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Google Map Flutter"),
      ),
      body: GoogleMap(
        initialCameraPosition: CameraPosition(
          target: _center,
          zoom: 11.0,
        ),
      ),
    );
  }
}
