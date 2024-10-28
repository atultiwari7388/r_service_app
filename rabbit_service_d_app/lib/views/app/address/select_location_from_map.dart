import 'dart:developer';
import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:google_maps_place_picker_mb/google_maps_place_picker.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart' as location_data;
import 'package:google_maps_flutter_android/google_maps_flutter_android.dart';
import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class SelectLocationScreen extends StatefulWidget {
  final double userLat;
  final double userLng;

  SelectLocationScreen({
    Key? key,
    required this.userLat,
    required this.userLng,
  }) : super(key: key);

  final GoogleMapsFlutterPlatform mapsImplementation =
      GoogleMapsFlutterPlatform.instance;

  @override
  _SelectLocationScreenState createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  PickResult? selectedPlace;
  bool isLoading = true;
  bool _mapsInitialized = false;
  String _mapsRenderer = "latest";
  location_data.LocationData? currentLocation;
  LatLng? selectedLocation;

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
  }

  // Initialize the renderer for Android
  void initRenderer() {
    if (_mapsInitialized) return;
    if (widget.mapsImplementation is GoogleMapsFlutterAndroid) {
      switch (_mapsRenderer) {
        case "legacy":
          (widget.mapsImplementation as GoogleMapsFlutterAndroid)
              .initializeWithRenderer(AndroidMapRenderer.legacy);
          break;
        case "latest":
          (widget.mapsImplementation as GoogleMapsFlutterAndroid)
              .initializeWithRenderer(AndroidMapRenderer.latest);
          break;
        default:
          // Default to latest if auto or any other value
          (widget.mapsImplementation as GoogleMapsFlutterAndroid)
              .initializeWithRenderer(AndroidMapRenderer.latest);
      }
    }
    setState(() {
      _mapsInitialized = true;
    });
  }

  // Fetch current location with proper error handling
  Future<void> getCurrentLocation() async {
    location_data.Location location = location_data.Location();

    bool _serviceEnabled;
    location_data.PermissionStatus _permissionGranted;
    location_data.LocationData _locationData;

    // Check if location service is enabled
    _serviceEnabled = await location.serviceEnabled();
    if (!_serviceEnabled) {
      _serviceEnabled = await location.requestService();
      if (!_serviceEnabled) {
        log('Location services are disabled.');
        // Optionally, show a dialog to the user
        return;
      }
    }

    // Check for location permissions
    _permissionGranted = await location.hasPermission();
    if (_permissionGranted == location_data.PermissionStatus.denied) {
      _permissionGranted = await location.requestPermission();
      if (_permissionGranted != location_data.PermissionStatus.granted) {
        log('Location permissions are denied.');
        // Optionally, show a dialog to the user
        return;
      }
    }

    // Get the current location
    try {
      _locationData = await location.getLocation();
      setState(() {
        currentLocation = _locationData;
        isLoading = false;
        log("Current location: ${currentLocation.toString()}");
      });
    } catch (e) {
      log('Error fetching location: $e');
      // Optionally, show a dialog to the user
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine the initial camera position
    LatLng initialCameraPosition = currentLocation != null
        ? LatLng(currentLocation!.latitude!, currentLocation!.longitude!)
        : LatLng(widget.userLat, widget.userLng);

    return Scaffold(
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : PlacePicker(
              apiKey: Platform.isAndroid ? googleApiKey : "",
              initialPosition: initialCameraPosition,
              useCurrentLocation: true,
              selectInitialPosition: true,
              usePlaceDetailSearch: true,
              onPlacePicked: (PickResult result) {
                setState(() {
                  selectedPlace = result;
                  selectedLocation = LatLng(
                      selectedPlace!.geometry!.location.lat,
                      selectedPlace!.geometry!.location.lng);
                });
                log("Place picked: ${result.formattedAddress}");
                log("Selected Lat Long: ${selectedPlace!.geometry!.location.lat} ${selectedPlace!.geometry!.location.lng}");
                // Navigator.of(context).pop();
                Navigator.of(context).pop(selectedLocation);
              },
              onMapCreated: (GoogleMapController controller) {
                log("Place Picker Map created");
              },
            ),
    );
  }
}
