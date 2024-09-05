import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_google_places/flutter_google_places.dart';
import 'package:google_maps_webservice/places.dart';
import 'package:location/location.dart' as location_data;
import 'dart:developer';

class SelectLocationScreen extends StatefulWidget {
  final double userLat;
  final double userLng;

  const SelectLocationScreen({
    super.key,
    required this.userLat,
    required this.userLng,
  });

  @override
  _SelectLocationScreenState createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  LatLng? selectedLocation;
  location_data.LocationData? currentLocation;
  late GoogleMapController _mapController;
  bool isLoading = true;
  final String apiKey = 'AIzaSyBLlQfAkdkka1mJYL-H0GPYvdUWeT4o9Uw';

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
        return;
      }
    }

    _permissionGranted = await location.hasPermission();
    if (_permissionGranted == location_data.PermissionStatus.denied) {
      _permissionGranted = await location.requestPermission();
      if (_permissionGranted != location_data.PermissionStatus.granted) {
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

  Future<void> _searchPlace() async {
    try {
      Prediction? p = await PlacesAutocomplete.show(
        context: context,
        apiKey: apiKey,
        mode: Mode.overlay,
        language: "en",
        components: [Component(Component.country, "in")],
      );

      if (p != null && p.placeId != null) {
        await _displayPrediction(p);
      } else {
        log('No prediction or place ID found.');
      }
    } catch (e) {
      log('Error occurred during place search: $e');
    }
  }

  Future<void> _displayPrediction(Prediction p) async {
    if (p.placeId == null) {
      log('No place ID found in the prediction.');
      return;
    }

    GoogleMapsPlaces _places = GoogleMapsPlaces(apiKey: apiKey);
    PlacesDetailsResponse detail =
        await _places.getDetailsByPlaceId(p.placeId!);

    if (detail.result.geometry == null) {
      log('No geometry found in the place details.');
      return;
    }

    final lat = detail.result.geometry!.location.lat;
    final lng = detail.result.geometry!.location.lng;

    setState(() {
      selectedLocation = LatLng(lat, lng);
      _mapController.animateCamera(
        CameraUpdate.newLatLng(selectedLocation!),
      );
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
        : LatLng(widget.userLat, widget.userLng);

    return Scaffold(
      appBar: AppBar(
        title: Text('Select Location'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: _searchPlace,
          ),
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

  void _onMapTap(LatLng location) {
    setState(() {
      selectedLocation = location;
    });
  }
}



// import 'dart:developer';
// import 'package:flutter/material.dart';
// import 'package:google_maps_flutter/google_maps_flutter.dart';
// import 'package:location/location.dart';

// class SelectLocationScreen extends StatefulWidget {
//   final double userLat;
//   final double userLng;

//   const SelectLocationScreen(
//       {super.key, required this.userLat, required this.userLng});
//   @override
//   _SelectLocationScreenState createState() => _SelectLocationScreenState();
// }

// class _SelectLocationScreenState extends State<SelectLocationScreen> {
//   LatLng? selectedLocation;
//   LocationData? currentLocation;
//   late GoogleMapController _mapController;
//   bool isLoading = true;

//   @override
//   void initState() {
//     super.initState();
//     getCurrentLocation();
//   }

//   Future<void> getCurrentLocation() async {
//     Location location = Location();

//     bool _serviceEnabled;
//     PermissionStatus _permissionGranted;
//     LocationData _locationData;

//     _serviceEnabled = await location.serviceEnabled();
//     if (!_serviceEnabled) {
//       _serviceEnabled = await location.requestService();
//       if (!_serviceEnabled) {
//         return;
//       }
//     }

//     _permissionGranted = await location.hasPermission();
//     if (_permissionGranted == PermissionStatus.denied) {
//       _permissionGranted = await location.requestPermission();
//       if (_permissionGranted != PermissionStatus.granted) {
//         return;
//       }
//     }

//     _locationData = await location.getLocation();
//     setState(() {
//       currentLocation = _locationData;
//       isLoading = false; // Set loading to false after getting location
//       log("Current location: " + currentLocation.toString());
//       log("Current location latitude longtitude: " +
//           "${LatLng(currentLocation!.latitude!, currentLocation!.longitude!).toString()}");
//     });
//   }

//   void _onMapTap(LatLng location) {
//     setState(() {
//       selectedLocation = location;
//     });
//   }

//   void _confirmLocation() {
//     if (selectedLocation != null) {
//       Navigator.of(context).pop(selectedLocation);
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     LatLng initialCameraPosition = currentLocation != null
//         ? LatLng(currentLocation!.latitude!, currentLocation!.longitude!)
//         : LatLng(widget.userLat, widget.userLng); // Default to India's center

//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Select Location'),
//         actions: [
//           IconButton(
//             icon: Icon(Icons.check),
//             onPressed: _confirmLocation,
//           ),
//         ],
//       ),
//       body: isLoading
//           ? Center(child: CircularProgressIndicator())
//           : GoogleMap(
//               onMapCreated: (controller) {
//                 _mapController = controller;
//                 if (currentLocation != null) {
//                   setState(() {
//                     selectedLocation = LatLng(currentLocation!.latitude!,
//                         currentLocation!.longitude!);
//                   });
//                 }
//               },
//               onTap: _onMapTap,
//               initialCameraPosition: CameraPosition(
//                 target: initialCameraPosition,
//                 zoom: 15,
//                 tilt: 59.440717697143555,
//               ),
//               myLocationEnabled: true,
//               myLocationButtonEnabled: true,
//               zoomGesturesEnabled: true,
//               indoorViewEnabled: true,
//               mapType: MapType.terrain,
//               zoomControlsEnabled: false,
//               trafficEnabled: true,
//               markers: selectedLocation != null
//                   ? {
//                       Marker(
//                         markerId: MarkerId('selectedLocation'),
//                         position: selectedLocation!,
//                       ),
//                     }
//                   : {},
//             ),
//     );
//   }
// }
