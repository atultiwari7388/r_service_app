import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:regal_shop_app/views/profile/profile_screen.dart';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/calculate_distance.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
import '../../services/latlng_converter.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/reusable_text.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  bool online = false;
  String appbarTitle = "";
  int totalJobs = 0;
  int ongoingJobs = 0;

  bool firstTimeAppLaunch = true; // Boolean flag to track first app launch
  bool isLocationSet = false;
  double mecLat = 0.0;
  double mecLng = 0.0;
  LocationData? currentLocation;
  String _selectedSortOption = "Sort";
  String userName = "";
  String phoneNumber = "";
  String userPhoto = "";
  num perHourCharges = 0;
  Map<String, bool> languages = {};
  List<String> selectedLanguages = [];

  @override
  void initState() {
    super.initState();
    _fetchOnlineStatus();
    fetchUserCurrentLocationAndUpdateToFirebase();
    fetchJobData();
    fetchLanguagesFromDatabase();
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
      setState(() {
        languages = languagesData;
        selectedLanguages = languages.entries
            .where((entry) => entry.value) // Filter entries where value is true
            .map((entry) =>
                entry.key) // Map those entries to their keys (language names)
            .toList();
        print(selectedLanguages);
      });
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

  int? _selectedCardIndex; // Track which card is selected

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Dashboard", style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          // Switch(activeColor: kSuccess, value: true, onChanged: (value) {}),
          Switch(
            value: online,
            onChanged: (value) {
              _toggleActive(value);
            },
            activeColor: kSuccess,
          ),
          SizedBox(width: 10.w),
          GestureDetector(
            onTap: () => Get.to(() => const ProfileScreen(),
                transition: Transition.cupertino,
                duration: const Duration(milliseconds: 900)),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('Mechanics')
                    .doc(currentUId)
                    .snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<DocumentSnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot.data!.data() as Map<String, dynamic>;
                  userPhoto = data['profilePicture'] ?? '';
                  userName = data['userName'] ?? '';
                  phoneNumber = data['phoneNumber'] ?? '';
                  perHourCharges = data["perHCharge"] ?? 0;

                  if (userPhoto.isEmpty) {
                    return Text(
                      userName.isNotEmpty ? userName[0] : '',
                      style: appStyle(20, kWhite, FontWeight.w500),
                    );
                  } else {
                    return ClipOval(
                      child: Image.network(
                        userPhoto,
                        width: 38.r, // Set appropriate size for the image
                        height: 35.r,
                        fit: BoxFit.cover,
                      ),
                    );
                  }
                },
              ),
            ),
          ),

          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Total jobs and Ongoing jobs section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  GestureDetector(
                    // onTap: () => Get.to(() => OrderHistoryScreen()),
                    child: _compactDashboardItem(
                        "Total Jobs", totalJobs.toString(), kSecondary),
                  ),
                  // SizedBox(width: 10.w),
                  GestureDetector(
                    // onTap: () => Get.to(() => OrderHistoryScreen()),
                    child: _compactDashboardItem(
                        "Ongoing Jobs", ongoingJobs.toString(), kRed),
                  ),
                ],
              ),

              SizedBox(height: 20.h),
              // New jobs section

              online
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            ReusableText(
                                text: "New Jobs",
                                style: appStyle(17, kDark, FontWeight.w500)),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8.w, vertical: 4.h),
                              decoration: BoxDecoration(
                                color: kPrimary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8.0.r),
                              ),
                              child: PopupMenuButton<String>(
                                onSelected: (value) {
                                  setState(() {
                                    _selectedSortOption =
                                        value; // Update the button text
                                  });
                                  // Implement your sorting logic here if needed
                                  print('Selected sort option: $value');
                                },
                                itemBuilder: (context) => [
                                  PopupMenuItem(
                                    value: "Near by",
                                    child: Text("Near by"),
                                  ),
                                  PopupMenuItem(
                                    value: "Rating",
                                    child: Text("Rating"),
                                  ),
                                ],
                                child: Row(
                                  children: [
                                    Icon(Icons.sort, color: kPrimary),
                                    SizedBox(width: 4.w),
                                    Text(
                                      _selectedSortOption, // Show the selected option
                                      style: appStyle(
                                          16.sp, kPrimary, FontWeight.w500),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 10.h),
                        StreamBuilder(
                          stream: FirebaseFirestore.instance
                              .collection('jobs')
                              .where('status', isEqualTo: 0)
                              .snapshots(),
                          builder: (BuildContext context,
                              AsyncSnapshot<QuerySnapshot> snapshot) {
                            if (snapshot.hasError) {
                              return Text('Error: ${snapshot.error}');
                            }

                            if (snapshot.connectionState ==
                                ConnectionState.waiting) {
                              return const CircularProgressIndicator();
                            }

                            final data = snapshot.data!
                                .docs; // List of documents in the 'jobs' collection

                            return data.isEmpty
                                ? Center(child: Text("No Request Available"))
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemCount: data.length,
                                    itemBuilder: (context, index) {
                                      final job = data[index].data()
                                          as Map<String, dynamic>;
                                      final userName = job['userName'] ?? "N/A";
                                      final imagePath = job['userPhoto'] ?? "";
                                      final bool isImage =
                                          job["isImageSelected"] ?? false;
                                      final List<dynamic> images =
                                          job['images'] ?? [];

                                      String dateString = '';
                                      if (job['orderDate'] is Timestamp) {
                                        DateTime dateTime =
                                            (job['orderDate'] as Timestamp)
                                                .toDate();
                                        dateString =
                                            "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
                                      }
                                      final userLat =
                                          (job["userLat"] as num).toDouble();
                                      final userLng =
                                          (job["userLong"] as num).toDouble();

                                      print(
                                          'User Latitude: $userLat, User Longitude: $userLng');
                                      print(
                                          'Mechanic Latitude: $mecLat, Mechanic Longitude: $mecLng');

                                      double distance = calculateDistance(
                                          userLat, userLng, mecLat, mecLng);
                                      print('Calculated Distance: $distance');

                                      if (distance < 1) {
                                        distance = 1;
                                      }

                                      return UpcomingRequestCard(
                                        orderId: job["orderId"].toString(),
                                        userName: userName,
                                        vehicleName:
                                            job['vehicleNumber'] ?? "N/A",
                                        address:
                                            job['userDeliveryAddress'] ?? "N/A",
                                        serviceName:
                                            job['selectedService'] ?? "N/A",
                                        jobId: job['orderId'] ?? "#Unknown",
                                        imagePath: imagePath.isEmpty
                                            ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                            : imagePath,
                                        date: dateString,
                                        buttonName: "Interested",
                                        onButtonTap: () => _showConfirmDialog(
                                          index,
                                          data,
                                          job["userId"].toString(),
                                          job["orderId"].toString(),
                                          isImage,
                                        ),
                                        onDasMapButton: () async {
                                          final Uri googleMapsUri = Uri.parse(
                                              'https://www.google.com/maps/dir/?api=1&destination=$userLat,$userLng');
                                          // ignore: deprecated_member_use
                                          if (await canLaunch(
                                              googleMapsUri.toString())) {
                                            // ignore: deprecated_member_use
                                            await launch(
                                                googleMapsUri.toString());
                                          } else {
                                            // Handle the error if the URL cannot be launched
                                            print(
                                                'Could not launch Google Maps');
                                          }
                                        },
                                        currentStatus: job['status'] ?? 0,
                                        rating: "",
                                        arrivalCharges: "30",
                                        km: "${distance.toStringAsFixed(0)} km",
                                        isImage: isImage,
                                        images: images,
                                        fixCharge: job["fixPrice"].toString(),
                                      );
                                    });
                          },
                        ),
                        SizedBox(height: 70.h)
                      ],
                    )
                  : buildInactiveMechanicScreen()
            ],
          ),
        ),
      ),
    );
  }

  Widget buildInactiveMechanicScreen() {
    return Padding(
      padding: EdgeInsets.all(28.sp),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.warning,
              size: 100,
              color: kPrimary,
            ),
            const SizedBox(height: 20),
            ReusableText(
              text: "Please activate the online button.",
              style: appStyle(17, kSecondary, FontWeight.normal),
            ),
          ],
        ),
      ),
    );
  }

  Widget _compactDashboardItem(String title, String value, Color color) {
    return Container(
      height: 70.h,
      width: MediaQuery.of(context).size.width * 0.4,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12.r),
      ),
      // padding: EdgeInsets.all(10.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title,
              textAlign: TextAlign.center,
              style: appStyle(15, kWhite, FontWeight.w400)),
          SizedBox(height: 10.h),
          Text(value, style: appStyle(12, kWhite, FontWeight.w400)),
        ],
      ),
    );
  }

  void _showConfirmDialog(
      int index, dynamic data, String userId, String jobId, bool isShowImage) {
    if (isShowImage) {
      _showAddArrivalChargesDialog2(userId, jobId);
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
              Get.snackbar("Success", "Request updated successfully.");
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

  void _showAddArrivalChargesDialog2(String userId, String jobId) {
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
              await historyDoc.update(jobData);
            } else {
              // If document does not exist, create it
              await historyDoc.set(jobData);
            }

            // Optional: Show a confirmation message or navigate to another screen
            Get.snackbar("Success", "Request updated successfully.");
            // You can handle the arrival charges here, like saving them to a database
            print("Arrival Charges: $fixCharge");
            Get.snackbar("Success", "Request updated successfully.");

            Get.back(); // Close the dialog after submission
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

  void _fetchOnlineStatus() async {
    DocumentSnapshot snapshot = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(currentUId)
        .get();
    setState(() {
      online = snapshot['active'] ?? false;
    });
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
    setState(() {
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
    });
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
  void _toggleActive(bool value) {
    setState(() {
      online = value;
      saveUserStatus(value);
    });
  }

  // Save active status in Firestore
  void saveUserStatus(bool active) {
    FirebaseFirestore.instance.collection('Mechanics').doc(currentUId).update({
      'active': active,
    });
  }
}
