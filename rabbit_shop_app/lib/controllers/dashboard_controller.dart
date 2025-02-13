import 'package:get/get.dart';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
import '../../services/collection_references.dart';
import '../../services/latlng_converter.dart';
import '../../utils/show_toast_msg.dart';

class DashboardController extends GetxController {
  bool online = true;
  String appbarTitle = "";
  int totalJobs = 0;
  int ongoingJobs = 0;
  double mecLat = 0.0;
  double mecLng = 0.0;
  LocationData? currentLocation;
  String selectedSortOption = "Sort";
  String userName = "";
  String phoneNumber = "";
  String userPhoto = "";
  num perHourCharges = 0;
  num nearbyDistance = 0;
  Map<String, bool> languages = {};
  List<String> selectedLanguages = [];

// Remove or comment out the fetchNearByDistance method
  Future<List<num>> fetchNearByDistance() async {
    try {
      // Fetch all documents in the 'jobs' collection
      QuerySnapshot<Map<String, dynamic>> snapshot =
          await FirebaseFirestore.instance.collection('jobs').get();

      List<num> nearbyDistances = [];

      // Loop through each document and extract the 'nearByDistance' field
      for (var doc in snapshot.docs) {
        if (doc.exists) {
          nearbyDistance = doc.data()['nearByDistance'] ?? 0;
          nearbyDistances.add(nearbyDistance);

          // Log the nearbyDistance for each job
          log('Job ID: ${doc.id} - Nearby Distance: $nearbyDistance km');
        }
      }
      update();

      return nearbyDistances;
    } catch (e) {
      log('Error fetching nearbyDistances from jobs collection: $e');
      return [];
    }
  }

  Future<void> fetchLanguagesFromDatabase() async {
    // Fetch the document from Firestore
    DocumentSnapshot doc = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(currentUId) // replace with the actual mechanic's ID
        .get();

    if (doc.exists) {
      // Ensure the data is a Map and cast it properly
      Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

      // Extract the 'languages' field and cast it as Map<String, bool>
      Map<String, bool> languagesData =
          Map<String, bool>.from(data['languages']);

      // Update the state with the languages data

      languages = languagesData;
      selectedLanguages = languages.entries
          .where((entry) => entry.value) // Filter entries where value is true
          .map((entry) =>
              entry.key) // Map those entries to their keys (language names)
          .toList();
      print(selectedLanguages);
      update();
    }
  }

  void fetchJobData() {
    try {
      // Listen to real-time changes in the 'jobs' collection
      FirebaseFirestore.instance
          .collection('jobs')
          .snapshots()
          .listen((jobSnapshot) {
        // Retrieve all job documents
        var allJobs = jobSnapshot.docs;

        // Total Jobs where mechanicsOffer contains currentUId and status is 5
        var totalJobsCount = allJobs.where((job) {
          List<dynamic> mechanicsOffer = job['mechanicsOffer'] ?? [];
          return mechanicsOffer.any(
              (offer) => offer['mId'] == currentUId && offer['status'] == 5);
        }).length;
        totalJobs = totalJobsCount;

        // Ongoing Jobs where mechanicsOffer contains currentUId and status is 1 to 4
        var ongoingJobsCount = allJobs.where((job) {
          List<dynamic> mechanicsOffer = job['mechanicsOffer'] ?? [];
          return mechanicsOffer.any((offer) =>
              offer['mId'] == currentUId &&
              [1, 2, 3, 4].contains(offer['status']));
        }).length;
        ongoingJobs = ongoingJobsCount;

        // Update the UI
        update();
      });
    } catch (e) {
      print('Error fetching job data: $e');
    }
  }

  void fetchOnlineStatus() async {
    DocumentSnapshot snapshot = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(currentUId)
        .get();

    online = snapshot['active'] ?? false;
    update();
  }

  void fetchUserCurrentLocationAndUpdateToFirebase() async {
    loc.Location location = loc.Location();
    bool serviceEnabled;
    PermissionStatus permissionGranted;

    // Check if location services are enabled
    serviceEnabled = await location.serviceEnabled();
    if (!serviceEnabled) {
      // showToastMessage(
      //     "Location Error", "Please enable location Services", kRed);
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) {
        return;
      }
    }

    // Check if location permissions are granted
    permissionGranted = await location.hasPermission();
    if (permissionGranted == loc.PermissionStatus.denied) {
      // showToastMessage(
      //     "Error", "Please grant location permission in app settings", kRed);
      // Open app settings to grant permission
      await loc.Location().requestPermission();
      permissionGranted = await location.hasPermission();
      permissionGranted = await location.requestPermission();
      if (permissionGranted != loc.PermissionStatus.granted) {
        return;
      }
    }

    // Get the current location
    loc.LocationData locationData = await location.getLocation();

    // Get the address from latitude and longitude
    String address = await getAddressFromLtLng(
        "LatLng(${locationData.latitude}, ${locationData.longitude})");
    print(address);

    // Update the app bar with the current address

    appbarTitle = address;
    mecLat = locationData.latitude!;
    mecLng = locationData.longitude!;
    log(appbarTitle);
    log(locationData.latitude.toString());
    log(locationData.longitude.toString());
    // Update the Firestore document with the current location
    saveUserLocation(
        locationData.latitude!, locationData.longitude!, appbarTitle);
    saveUserStatus(online);
    update();
  }

  void saveUserLocation(double latitude, double longitude, String userAddress) {
    FirebaseFirestore.instance.collection('Mechanics').doc(currentUId).update({
      'address': userAddress,
      "location": {
        'latitude': latitude,
        'longitude': longitude,
      }
    });
  }

  // Toggle active status
  void toggleActive(bool value) {
    online = value;
    saveUserStatus(value);
    update();
  }

  // Save active status in Firestore
  void saveUserStatus(bool active) {
    FirebaseFirestore.instance.collection('Mechanics').doc(currentUId).update({
      'active': active,
    });
  }

  @override
  void onInit() {
    super.onInit();
    fetchOnlineStatus();
    fetchUserCurrentLocationAndUpdateToFirebase();
    fetchJobData();
    fetchLanguagesFromDatabase();
    fetchNearByDistance();
  }
}
