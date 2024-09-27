import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart' as location_data;
import 'dart:developer';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async'; // Added for Completer

class BackUpAddress extends StatefulWidget {
  final double userLat;
  final double userLng;

  const BackUpAddress({
    super.key,
    required this.userLat,
    required this.userLng,
  });

  @override
  _BackUpAddressState createState() => _BackUpAddressState();
}

class _BackUpAddressState extends State<BackUpAddress> {
  LatLng? selectedLocation;
  location_data.LocationData? currentLocation;
  Completer<GoogleMapController> _mapController =
      Completer(); // Changed to Completer
  bool isLoading = true;
  final String apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
  List<dynamic> searchResults = [];

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
  }

  Future<void> getCurrentLocation() async {
    location_data.Location location = location_data.Location();

    bool _serviceEnabled;
    location_data.PermissionStatus _permissionGranted;
    location_data.LocationData _locationData;

    _serviceEnabled = await location.serviceEnabled();
    if (!_serviceEnabled) {
      _serviceEnabled = await location.requestService();
      if (!_serviceEnabled) {
        log('Location services are disabled.');
        return;
      }
    }

    _permissionGranted = await location.hasPermission();
    if (_permissionGranted == location_data.PermissionStatus.denied) {
      _permissionGranted = await location.requestPermission();
      if (_permissionGranted != location_data.PermissionStatus.granted) {
        log('Location permissions are denied.');
        return;
      }
    }

    _locationData = await location.getLocation();
    setState(() {
      currentLocation = _locationData;
      isLoading = false;
      log("Current location: ${currentLocation.toString()}");
    });
  }

  Future<void> _searchPlace(String query) async {
    final url =
        'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=$query&key=$apiKey&components=country:in';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        setState(() {
          searchResults = result['predictions'];
        });
        log("Search Results: ${searchResults.toString()}");
      } else {
        log('Failed to fetch place predictions. Status Code: ${response.statusCode}');
      }
    } catch (e) {
      log('Error occurred during place search: $e');
    }
  }

  Future<void> _getPlaceDetails(String placeId) async {
    final url =
        'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=$apiKey';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        final geometry = result['result']['geometry']['location'];
        final lat = geometry['lat'];
        final lng = geometry['lng'];

        log("Place Details - Latitude: $lat, Longitude: $lng");

        setState(() {
          selectedLocation = LatLng(lat, lng);
          searchResults = []; // Clear search results
        });

        // Ensure that the camera animates after the UI has updated
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _animateCamera(selectedLocation!);
        });
      } else {
        log('Failed to fetch place details. Status Code: ${response.statusCode}');
      }
    } catch (e) {
      log('Error occurred during place details fetch: $e');
    }
  }

  Future<void> _animateCamera(LatLng location) async {
    try {
      final controller = await _mapController.future;
      await controller.animateCamera(CameraUpdate.newLatLngZoom(location, 15));
      log('Camera animated to: $location');
    } catch (e) {
      log('Error animating camera: $e');
    }
  }

  void _confirmLocation() {
    if (selectedLocation != null) {
      Navigator.of(context).pop(selectedLocation);
    } else {
      log('No location selected to confirm.');
    }
  }

  @override
  Widget build(BuildContext context) {
    LatLng initialCameraPosition = currentLocation != null
        ? LatLng(currentLocation!.latitude!, currentLocation!.longitude!)
        : LatLng(widget.userLat, widget.userLng);

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
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: "Search place",
                      suffixIcon: Icon(Icons.search),
                    ),
                    onChanged: (value) {
                      if (value.isNotEmpty) {
                        _searchPlace(value);
                      } else {
                        setState(() {
                          searchResults = [];
                        });
                      }
                    },
                  ),
                ),
                Expanded(
                  child: searchResults.isEmpty
                      ? GoogleMap(
                          onMapCreated: (controller) {
                            if (!_mapController.isCompleted) {
                              _mapController.complete(controller);
                            }
                          },
                          onTap: _onMapTap,
                          initialCameraPosition: CameraPosition(
                            target: initialCameraPosition,
                            zoom: 15,
                          ),
                          myLocationEnabled: true,
                          myLocationButtonEnabled: true,
                          markers: selectedLocation != null
                              ? {
                                  Marker(
                                    markerId: MarkerId('selectedLocation'),
                                    position: selectedLocation!,
                                  ),
                                }
                              : {},
                        )
                      : ListView.builder(
                          itemCount: searchResults.length,
                          itemBuilder: (context, index) {
                            return ListTile(
                              title: Text(
                                  searchResults[index]['description'] ?? ''),
                              onTap: () {
                                _getPlaceDetails(
                                    searchResults[index]['place_id']);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  void _onMapTap(LatLng location) {
    setState(() {
      selectedLocation = location;
    });
    log('Map tapped at: $location');
  }
}
