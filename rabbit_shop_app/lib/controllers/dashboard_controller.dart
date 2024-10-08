import 'package:get/get.dart';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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

  bool firstTimeAppLaunch = true; // Boolean flag to track first app launch
  bool isLocationSet = false;
  // bool requestCardVisible = false;
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

  // Future<num> fetchNearByDistance() async {
  //   try {
  //     DocumentSnapshot<Map<String, dynamic>> snapshot = await FirebaseFirestore
  //         .instance
  //         .collection('metadata')
  //         .doc('nearByDistance')
  //         .get();

  //     if (snapshot.exists) {
  //       nearbyDistance = snapshot.get("value") ?? 0;
  //       update();
  //       log('Nearby Distance: $nearbyDistance km');
  //       return nearbyDistance;
  //     } else {
  //       log('Document does not exist.');
  //       return 0;
  //     }
  //   } catch (e) {
  //     log('Error fetching nearbyDistance: $e');
  //     return 0;
  //   }
  // }

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

      // Update if needed (if you're using a state management solution)
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

  Future<void> fetchJobData() async {
    try {
      // Fetch all jobs for the current user
      QuerySnapshot jobSnapshot = await FirebaseFirestore.instance
          .collection('jobs')
          .where("mId", isEqualTo: currentUId)
          .get();

      // Filter jobs based on status
      var allJobs = jobSnapshot.docs;

      // Total Jobs where status is 5
      var totalJobsCount = allJobs.where((job) => job['status'] == 5).length;
      totalJobs = totalJobsCount;

      // Ongoing Jobs where status is [1, 2, 3, 4]
      var ongoingJobsCount =
          allJobs.where((job) => [1, 2, 3, 4].contains(job['status'])).length;
      ongoingJobs = ongoingJobsCount;
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
      showToastMessage(
          "Location Error", "Please enable location Services", kRed);
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) {
        return;
      }
    }

    // Check if location permissions are granted
    permissionGranted = await location.hasPermission();
    if (permissionGranted == loc.PermissionStatus.denied) {
      showToastMessage(
          "Error", "Please grant location permission in app settings", kRed);
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

  void showConfirmDialog(int index, dynamic data, String userId, String jobId,
      bool isShowImage, bool isPriceTypeEnable) {
    if (isShowImage) {
      showAddArrivalChargesDialog2(userId, jobId);
    } else if (isPriceTypeEnable) {
      showAddArrivalChargesDialog2(userId, jobId);
    } else {
      final TextEditingController arrivalChargesController =
          TextEditingController();
      final TextEditingController timeController =
          TextEditingController(text: "10");
      final TextEditingController perHourChargesController =
          TextEditingController(text: perHourCharges.toString());

      Get.defaultDialog(
        title: "Confirm",
        content: Column(
          children: [
            Text("Please enter the arrival and per-hour charges:",
                style: TextStyle(fontSize: 16)),
            SizedBox(height: 20.h),
            TextField(
              controller: arrivalChargesController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "Enter your Arrival Charges",
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 10.h),
            TextField(
              controller: timeController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "Arrival Time",
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 10.h),
            TextField(
              controller: perHourChargesController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "Per Hour Charges",
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        textCancel: "Cancel",
        textConfirm: "Submit",
        cancel: OutlinedButton(
          onPressed: () {
            Get.back(); // Close the dialog if "Cancel" is pressed
          },
          child: Text("Cancel", style: TextStyle(color: Colors.red)),
        ),
        confirm: ElevatedButton(
          onPressed: () async {
            final arrivalCharges = arrivalChargesController.text;
            final perHourCharges = perHourChargesController.text;
            final time = timeController.text;

            if (arrivalCharges.isNotEmpty && perHourCharges.isNotEmpty) {
              Get.back(); // Close the current dialog

              // Get the current mechanic location
              loc.Location location = loc.Location();
              loc.LocationData locationData = await location.getLocation();

              var jobData = {
                "status": 1,
                "rating": "4.3",
                "time": time,
                "mId": currentUId.toString(),
                "mName": userName.toString(),
                "mNumber": phoneNumber.toString(),
                "mDp": userPhoto.toString(),
                'arrivalCharges': arrivalCharges,
                'perHourCharges': perHourCharges,
                "fixPrice": 0,
                "reviewSubmitted": false,
                "languages": selectedLanguages,
                'mechanicAddress': appbarTitle,
                'mecLatitude': locationData.latitude,
                'mecLongtitude': locationData.longitude,
              };

              // Update the Firestore `jobs` collection
              await FirebaseFirestore.instance
                  .collection('jobs')
                  .doc(jobId)
                  .update(jobData);

              // Check if the history document exists
              DocumentReference historyDoc = await FirebaseFirestore.instance
                  .collection("Users")
                  .doc(userId)
                  .collection("history")
                  .doc(jobId);

              // Get the history document snapshot
              DocumentSnapshot docSnapshot = await historyDoc.get();

              if (docSnapshot.exists) {
                // If document exists, update it
                await historyDoc.update(jobData);
              } else {
                // If document does not exist, create it
                await historyDoc.set(jobData);
              }

              // Optional: Show a confirmation message or navigate to another screen
              Get.snackbar("Success", "Request Sent Successfully.");
            } else {
              Get.snackbar("Error", "Please enter all required charges.");
            }
          },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
          child: Text("Submit", style: TextStyle(color: Colors.white)),
        ),
      );
    }
  }

  void showAddArrivalChargesDialog2(String userId, String jobId) {
    final TextEditingController fixPriceController =
        TextEditingController(text: "150");
    final TextEditingController timeController =
        TextEditingController(text: "10 ");

    Get.defaultDialog(
      title: "Add Fix Price",
      content: Column(
        children: [
          Text(
            "Please enter the fix price:",
            style: TextStyle(fontSize: 16),
          ),
          SizedBox(height: 20.h),
          TextField(
            controller: timeController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: "Arrival Time",
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 10.h),
          TextField(
            controller: fixPriceController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: "Enter Fix Price",
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 10.h),
        ],
      ),
      textCancel: "Cancel",
      textConfirm: "Submit",
      cancel: OutlinedButton(
        onPressed: () {
          Get.back(); // Close the dialog if "Cancel" is pressed
        },
        child: Text(
          "Cancel",
          style:
              TextStyle(color: Colors.red), // Custom color for "Cancel" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () async {
          final fixCharge = fixPriceController.text;
          final time = timeController.text;
          if (fixCharge.isNotEmpty) {
            loc.Location location = loc.Location();
            loc.LocationData locationData = await location.getLocation();

            var jobData = {
              "status": 1,
              "rating": "4.3",
              "time": time,
              "mId": currentUId.toString(),
              "mName": userName.toString(),
              "mNumber": phoneNumber.toString(),
              "mDp": userPhoto.toString(),
              "languages": selectedLanguages,
              'arrivalCharges': 0,
              'perHourCharges': 0,
              "reviewSubmitted": false,
              "fixPrice": fixCharge,
              'mechanicAddress': appbarTitle,
              'mecLatitude': locationData.latitude,
              'mecLongtitude': locationData.longitude,
            };

            // Update the Firestore `jobs` collection
            await FirebaseFirestore.instance
                .collection('jobs')
                .doc(jobId)
                .update(jobData);

            // Check if the history document exists
            DocumentReference historyDoc = await FirebaseFirestore.instance
                .collection("Users")
                .doc(userId)
                .collection("history")
                .doc(jobId);

            // Get the history document snapshot
            DocumentSnapshot docSnapshot = await historyDoc.get();

            if (docSnapshot.exists) {
              // If document exists, update it
              await historyDoc.update(jobData).then((value) {
                Get.back();
              });
            } else {
              // If document does not exist, create it
              await historyDoc.set(jobData).then((value) {
                Get.back();
              });
            }

            // Optional: Show a confirmation message or navigate to another screen
            Get.snackbar("Success", "Request Sent Successfully.");
            // You can handle the arrival charges here, like saving them to a database
            print("Fix Charges: $fixCharge");
            Get.snackbar("Success", "Request Sent Successfully.");

            // Close the dialog after submission
            // Further actions can be taken here, like navigating to another screen
          } else {
            // Optionally show a message if the input is empty
            Get.snackbar("Error", "Please enter arrival charges.");
          }

          Get.back();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Submit" button
        ),
        child: Text(
          "Submit",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
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
