import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';

class SelectLocationScreen extends StatefulWidget {
  final double userLat;
  final double userLng;

  const SelectLocationScreen(
      {super.key, required this.userLat, required this.userLng});
  @override
  _SelectLocationScreenState createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  LatLng? selectedLocation;
  LocationData? currentLocation;
  late GoogleMapController _mapController;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
  }

  Future<void> getCurrentLocation() async {
    Location location = Location();

    bool _serviceEnabled;
    PermissionStatus _permissionGranted;
    LocationData _locationData;

    _serviceEnabled = await location.serviceEnabled();
    if (!_serviceEnabled) {
      _serviceEnabled = await location.requestService();
      if (!_serviceEnabled) {
        return;
      }
    }

    _permissionGranted = await location.hasPermission();
    if (_permissionGranted == PermissionStatus.denied) {
      _permissionGranted = await location.requestPermission();
      if (_permissionGranted != PermissionStatus.granted) {
        return;
      }
    }

    _locationData = await location.getLocation();
    setState(() {
      currentLocation = _locationData;
      isLoading = false; // Set loading to false after getting location
      log("Current location: " + currentLocation.toString());
      log("Current location latitude longtitude: " +
          "${LatLng(currentLocation!.latitude!, currentLocation!.longitude!).toString()}");
    });
  }

  void _onMapTap(LatLng location) {
    setState(() {
      selectedLocation = location;
    });
  }

  void _confirmLocation() {
    if (selectedLocation != null) {
      Navigator.of(context).pop(selectedLocation);
    }
  }

  @override
  Widget build(BuildContext context) {
    LatLng initialCameraPosition = currentLocation != null
        ? LatLng(currentLocation!.latitude!, currentLocation!.longitude!)
        : LatLng(widget.userLat, widget.userLng); // Default to India's center

    return Scaffold(
      appBar: AppBar(
        title: Text('Select Location'),
        actions: [
          IconButton(
            icon: Icon(Icons.check),
            onPressed: _confirmLocation,
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : GoogleMap(
              onMapCreated: (controller) {
                _mapController = controller;
                if (currentLocation != null) {
                  setState(() {
                    selectedLocation = LatLng(currentLocation!.latitude!,
                        currentLocation!.longitude!);
                  });
                }
              },
              onTap: _onMapTap,
              initialCameraPosition: CameraPosition(
                target: initialCameraPosition,
                zoom: 15,
                tilt: 59.440717697143555,
              ),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
              zoomGesturesEnabled: true,
              indoorViewEnabled: true,
              mapType: MapType.terrain,
              zoomControlsEnabled: false,
              trafficEnabled: true,
              markers: selectedLocation != null
                  ? {
                      Marker(
                        markerId: MarkerId('selectedLocation'),
                        position: selectedLocation!,
                      ),
                    }
                  : {},
            ),
    );
  }
}
