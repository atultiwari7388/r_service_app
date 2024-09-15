// Future<void> checkIfLocationIsSet() async {
//   try {
//     DocumentSnapshot userDoc = await FirebaseFirestore.instance
//         .collection('Mechanics')
//         .doc(currentUId)
//         .get();
//
//     if (userDoc.exists && userDoc.data() != null) {
//       var data = userDoc.data() as Map<String, dynamic>;
//       if (data.containsKey('isLocationSet') &&
//           data['isLocationSet'] == true) {
//         // If location is set, fetch the stored location and address
//         userLat = data['lastLocation']['latitude'] ?? 0.0;
//         userLong = data['lastLocation']['longitude'] ?? 0.0;
//         fetchCurrentAddress();
//       } else {
//         // If location is not set, fetch and update the current location
//         fetchUserCurrentLocationAndUpdateToFirebase();
//       }
//     } else {
//       // If document doesn't exist, fetch and update current location
//       fetchUserCurrentLocationAndUpdateToFirebase();
//     }
//   } catch (e) {
//     log("Error checking location set status: $e");
//   }
// }
//
// Future<void> fetchCurrentAddress() async {
//   try {
//     QuerySnapshot addressSnapshot = await FirebaseFirestore.instance
//         .collection('Mechanics')
//         .doc(currentUId)
//         .collection("Addresses")
//         .where('isAddressSelected', isEqualTo: true)
//         .get();
//
//     if (addressSnapshot.docs.isNotEmpty) {
//       var addressData =
//           addressSnapshot.docs.first.data() as Map<String, dynamic>;
//       setState(() {
//         appbarTitle = addressData['address'];
//         // _locationController.text = addressData['address'];
//       });
//     }
//   } catch (e) {
//     log("Error fetching current address: $e");
//   }
// }
//
// Future<void> fetchUserCurrentLocationAndUpdateToFirebase() async {
//   loc.Location location = loc.Location();
//   bool serviceEnabled;
//   PermissionStatus permissionGranted;
//
//   // Check if location services are enabled
//   serviceEnabled = await location.serviceEnabled();
//   if (!serviceEnabled) {
//     showToastMessage(
//       "Location Error",
//       "Please enable location Services",
//       kRed,
//     );
//     serviceEnabled = await location.requestService();
//     if (!serviceEnabled) {
//       return;
//     }
//   }
//
//   // Check if location permissions are granted
//   permissionGranted = await location.hasPermission();
//   if (permissionGranted == loc.PermissionStatus.denied) {
//     showToastMessage(
//       "Error",
//       "Please grant location permission in app settings",
//       kRed,
//     );
//     await loc.Location().requestPermission();
//     permissionGranted = await location.hasPermission();
//     if (permissionGranted != loc.PermissionStatus.granted) {
//       return;
//     }
//   }
//
//   // Get the current location
//   currentLocation = await location.getLocation();
//
//   // Check the distance from the stored location (userLat and userLong)
//   if (userLat != 0.0 && userLong != 0.0) {
//     double distanceInMeters = Geolocator.distanceBetween(
//       userLat,
//       userLong,
//       currentLocation!.latitude!,
//       currentLocation!.longitude!,
//     );
//
//     if (distanceInMeters < 100) {
//       // User hasn't moved far; use the stored address
//       setState(() {
//         // _locationController.text = appbarTitle; // previously stored address
//       });
//       return; // Skip storing the same address again
//     } else {
//       // If the user has moved more than 100 meters, set isLocationSet to false
//       await FirebaseFirestore.instance
//           .collection('Mechanics')
//           .doc(currentUId)
//           .set({
//         'isLocationSet': false,
//       }, SetOptions(merge: true));
//     }
//   }
//
//   // If the location is different, fetch the new address
//   String address = await getAddressFromLtLng(
//     "LatLng(${currentLocation!.latitude}, ${currentLocation!.longitude})",
//   );
//   log(address.toString());
//
//   // Update app bar with the current address and save it to Firestore
//   setState(() {
//     appbarTitle = address;
//     // _locationController.text = address;
//     saveUserLocation(
//       currentLocation!.latitude!,
//       currentLocation!.longitude!,
//       appbarTitle,
//     );
//   });
// }
//
// void saveUserLocation(double latitude, double longitude, String userAddress) {
//   // Update the new location and set isLocationSet to true
//   FirebaseFirestore.instance.collection('Mechanics').doc(currentUId).set({
//     'isLocationSet': true, // Now set to true after updating
//     'lastLocation': {
//       'latitude': latitude,
//       'longitude': longitude,
//     },
//     'lastAddress': userAddress,
//   }, SetOptions(merge: true));
//
//   FirebaseFirestore.instance
//       .collection('Mechanics')
//       .doc(currentUId)
//       .collection("Addresses")
//       .add({
//     'address': userAddress,
//     'location': {
//       'latitude': latitude,
//       'longitude': longitude,
//     },
//     'addressType': "Current",
//     "isAddressSelected": true,
//   });
// }
