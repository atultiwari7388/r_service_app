import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart' as location_data;
import 'dart:developer';
import 'package:http/http.dart' as http;
import 'dart:convert';

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
  final String apiKey = 'AIzaSyBLGQtovhzlh1ou14eKhNMOYK8uT2DfiW4';
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
        log('Failed to fetch place predictions.');
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

        setState(() {
          selectedLocation = LatLng(lat, lng);
          _animateCamera(selectedLocation!);
        });
      } else {
        log('Failed to fetch place details.');
      }
    } catch (e) {
      log('Error occurred during place details fetch: $e');
    }
  }

  Future<void> _animateCamera(LatLng location) async {
    if (_mapController != null) {
      _mapController.animateCamera(CameraUpdate.newLatLng(location));
    }
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
                            _mapController = controller;
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
                              title: Text(searchResults[index]['description']),
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
  }
}


// import 'package:flutter/material.dart';
// import 'package:google_maps_flutter/google_maps_flutter.dart';
// import 'package:location/location.dart' as location_data;
// import 'dart:developer';
// import 'package:http/http.dart' as http;
// import 'dart:convert';

// class SelectLocationScreen extends StatefulWidget {
//   final double userLat;
//   final double userLng;

//   const SelectLocationScreen({
//     super.key,
//     required this.userLat,
//     required this.userLng,
//   });

//   @override
//   _SelectLocationScreenState createState() => _SelectLocationScreenState();
// }

// class _SelectLocationScreenState extends State<SelectLocationScreen> {
//   LatLng? selectedLocation;
//   location_data.LocationData? currentLocation;
//   late GoogleMapController _mapController;
//   bool isLoading = true;
//   final String apiKey = 'AIzaSyBLGQtovhzlh1ou14eKhNMOYK8uT2DfiW4';
//   List<dynamic> searchResults = [];

//   @override
//   void initState() {
//     super.initState();
//     getCurrentLocation();
//   }

//   Future<void> getCurrentLocation() async {
//     location_data.Location location = location_data.Location();

//     bool _serviceEnabled;
//     location_data.PermissionStatus _permissionGranted;
//     location_data.LocationData _locationData;

//     _serviceEnabled = await location.serviceEnabled();
//     if (!_serviceEnabled) {
//       _serviceEnabled = await location.requestService();
//       if (!_serviceEnabled) {
//         return;
//       }
//     }

//     _permissionGranted = await location.hasPermission();
//     if (_permissionGranted == location_data.PermissionStatus.denied) {
//       _permissionGranted = await location.requestPermission();
//       if (_permissionGranted != location_data.PermissionStatus.granted) {
//         return;
//       }
//     }

//     _locationData = await location.getLocation();
//     setState(() {
//       currentLocation = _locationData;
//       isLoading = false;
//       log("Current location: ${currentLocation.toString()}");
//     });
//   }

//   Future<void> _searchPlace(String query) async {
//     final url =
//         'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=$query&key=$apiKey&components=country:in';
//     try {
//       final response = await http.get(Uri.parse(url));
//       if (response.statusCode == 200) {
//         final result = json.decode(response.body);
//         setState(() {
//           searchResults = result['predictions'];
//         });
//         log("Search Results: ${searchResults.toString()}");
//       } else {
//         log('Failed to fetch place predictions.');
//       }
//     } catch (e) {
//       log('Error occurred during place search: $e');
//     }
//   }

//   Future<void> _getPlaceDetails(String placeId) async {
//     final url =
//         'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=$apiKey';
//     try {
//       final response = await http.get(Uri.parse(url));
//       if (response.statusCode == 200) {
//         final result = json.decode(response.body);
//         final geometry = result['result']['geometry']['location'];
//         final lat = geometry['lat'];
//         final lng = geometry['lng'];

//         setState(() {
//           selectedLocation = LatLng(lat, lng);
//           _mapController.animateCamera(
//             CameraUpdate.newLatLng(selectedLocation!),
//           );
//         });
//       } else {
//         log('Failed to fetch place details.');
//       }
//     } catch (e) {
//       log('Error occurred during place details fetch: $e');
//     }
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
//         : LatLng(widget.userLat, widget.userLng);

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
//           : Column(
//               children: [
//                 Padding(
//                   padding: const EdgeInsets.all(8.0),
//                   child: TextField(
//                     decoration: InputDecoration(
//                       hintText: "Search place",
//                       suffixIcon: Icon(Icons.search),
//                     ),
//                     onChanged: (value) {
//                       if (value.isNotEmpty) {
//                         _searchPlace(value);
//                       } else {
//                         setState(() {
//                           searchResults = [];
//                         });
//                       }
//                     },
//                   ),
//                 ),
//                 Expanded(
//                   child: searchResults.isEmpty
//                       ? GoogleMap(
//                           onMapCreated: (controller) {
//                             _mapController = controller;
//                           },
//                           onTap: _onMapTap,
//                           initialCameraPosition: CameraPosition(
//                             target: initialCameraPosition,
//                             zoom: 15,
//                           ),
//                           myLocationEnabled: true,
//                           myLocationButtonEnabled: true,
//                           markers: selectedLocation != null
//                               ? {
//                                   Marker(
//                                     markerId: MarkerId('selectedLocation'),
//                                     position: selectedLocation!,
//                                   ),
//                                 }
//                               : {},
//                         )
//                       : ListView.builder(
//                           itemCount: searchResults.length,
//                           itemBuilder: (context, index) {
//                             return ListTile(
//                               title: Text(searchResults[index]['description']),
//                               onTap: () {
//                                 _getPlaceDetails(
//                                     searchResults[index]['place_id']);
//                               },
//                             );
//                           },
//                         ),
//                 ),
//               ],
//             ),
//     );
//   }

//   void _onMapTap(LatLng location) {
//     setState(() {
//       selectedLocation = location;
//     });
//   }
// }

