import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:regal_shop_app/views/profile/profile_screen.dart';
import 'package:regal_shop_app/widgets/custom_background_container.dart';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
import '../../services/collection_references.dart';
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
  int totalOrders = 0;
  int todaysOrder = 0;
  int pendingOrders = 0;

  bool firstTimeAppLaunch = true; // Boolean flag to track first app launch
  bool isLocationSet = false;
  double userLat = 0.0;
  double userLong = 0.0;
  LocationData? currentLocation;
  String _selectedSortOption = "Sort";
  String userName = "";
  String phoneNumber = "";
  String userPhoto = "";

  @override
  void initState() {
    super.initState();
    checkIfLocationIsSet();
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
          Switch(activeColor: kSuccess, value: true, onChanged: (value) {}),
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
                        "Total Jobs", todaysOrder.toString(), kSecondary),
                  ),
                  // SizedBox(width: 10.w),
                  GestureDetector(
                    // onTap: () => Get.to(() => OrderHistoryScreen()),
                    child: _compactDashboardItem(
                        "Ongoing Jobs", totalOrders.toString(), kRed),
                  ),
                ],
              ),
              SizedBox(height: 20.h),
              // New jobs section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ReusableText(
                      text: "New Jobs",
                      style: appStyle(17, kDark, FontWeight.w500)),
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: kPrimary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8.0.r),
                    ),
                    child: PopupMenuButton<String>(
                      onSelected: (value) {
                        setState(() {
                          _selectedSortOption = value; // Update the button text
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
                            style: appStyle(16.sp, kPrimary, FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 10.h),
              for (int i = 0; i < 1; i++)
                UpcomingRequestCard(
                  userName: "Sachin Minhas",
                  vehicleName: "Freightliner",
                  address: "STPI - 2nd phase, Mohali PB.",
                  serviceName: "5th wheel",
                  jobId: "#RMS0001",
                  imagePath: "assets/images/profile.jpg",
                  date: "25 Aug 2024",
                  buttonName: "Interested",
                  onButtonTap: () => _showConfirmDialog(i),
                  currentStatus: 0,
                  rating: "4.3",
                  arrivalCharges: "20",
                ),

              SizedBox(height: 50.h)
            ],
          ),
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

  void _showConfirmDialog(int index) {
    Get.defaultDialog(
      title: "Confirm",
      middleText: "Are you sure you want to accept this offer?",
      textCancel: "No",
      textConfirm: "Yes",
      cancel: OutlinedButton(
        onPressed: () {
          Get.back(); // Close the dialog if "No" is pressed
        },
        child: Text(
          "No",
          style: TextStyle(color: Colors.red), // Custom color for "No" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the current dialog
          setState(() {
            _selectedCardIndex = index; // Select the card
          });
          _showAddArrivalChargesDialog(); // Show the next dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Yes" button
        ),
        child: Text(
          "Yes",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  void _showAddArrivalChargesDialog() {
    final TextEditingController arrivalChargesController =
        TextEditingController();

    Get.defaultDialog(
      title: "Add Arrival Charges",
      content: Column(
        children: [
          Text(
            "Please enter the arrival charges:",
            style: TextStyle(fontSize: 16),
          ),
          SizedBox(height: 20.h),
          TextField(
            controller: arrivalChargesController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: "Arrival Charges",
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
        child: Text(
          "Cancel",
          style:
              TextStyle(color: Colors.red), // Custom color for "Cancel" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          final arrivalCharges = arrivalChargesController.text;
          if (arrivalCharges.isNotEmpty) {
            // You can handle the arrival charges here, like saving them to a database
            print("Arrival Charges: $arrivalCharges");

            Get.back(); // Close the dialog after submission
            // Further actions can be taken here, like navigating to another screen
          } else {
            // Optionally show a message if the input is empty
            Get.snackbar("Error", "Please enter arrival charges.");
          }
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

  //========================================= Location Section ==========================

  Future<void> checkIfLocationIsSet() async {
    try {
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(currentUId)
          .get();

      if (userDoc.exists && userDoc.data() != null) {
        var data = userDoc.data() as Map<String, dynamic>;
        if (data.containsKey('isLocationSet') &&
            data['isLocationSet'] == true) {
          // If location is set, fetch the stored location and address
          userLat = data['lastLocation']['latitude'] ?? 0.0;
          userLong = data['lastLocation']['longitude'] ?? 0.0;
          fetchCurrentAddress();
        } else {
          // If location is not set, fetch and update the current location
          fetchUserCurrentLocationAndUpdateToFirebase();
        }
      } else {
        // If document doesn't exist, fetch and update current location
        fetchUserCurrentLocationAndUpdateToFirebase();
      }
    } catch (e) {
      log("Error checking location set status: $e");
    }
  }

  Future<void> fetchCurrentAddress() async {
    try {
      QuerySnapshot addressSnapshot = await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(currentUId)
          .collection("Addresses")
          .where('isAddressSelected', isEqualTo: true)
          .get();

      if (addressSnapshot.docs.isNotEmpty) {
        var addressData =
            addressSnapshot.docs.first.data() as Map<String, dynamic>;
        setState(() {
          appbarTitle = addressData['address'];
          // _locationController.text = addressData['address'];
        });
      }
    } catch (e) {
      log("Error fetching current address: $e");
    }
  }

//====================== Fetching user current location =====================
  Future<void> fetchUserCurrentLocationAndUpdateToFirebase() async {
    loc.Location location = loc.Location();
    bool serviceEnabled;
    PermissionStatus permissionGranted;

    // Check if location services are enabled
    serviceEnabled = await location.serviceEnabled();
    if (!serviceEnabled) {
      showToastMessage(
        "Location Error",
        "Please enable location Services",
        kRed,
      );
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) {
        return;
      }
    }

    // Check if location permissions are granted
    permissionGranted = await location.hasPermission();
    if (permissionGranted == loc.PermissionStatus.denied) {
      showToastMessage(
        "Error",
        "Please grant location permission in app settings",
        kRed,
      );
      await loc.Location().requestPermission();
      permissionGranted = await location.hasPermission();
      if (permissionGranted != loc.PermissionStatus.granted) {
        return;
      }
    }

    // Get the current location
    currentLocation = await location.getLocation();

    // Check the distance from the stored location (userLat and userLong)
    if (userLat != 0.0 && userLong != 0.0) {
      double distanceInMeters = Geolocator.distanceBetween(
        userLat,
        userLong,
        currentLocation!.latitude!,
        currentLocation!.longitude!,
      );

      if (distanceInMeters < 100) {
        // User hasn't moved far; use the stored address
        setState(() {
          // _locationController.text = appbarTitle; // previously stored address
        });
        return; // Skip storing the same address again
      }
    }

    // If the location is different, fetch the new address
    String address = await getAddressFromLtLng(
      "LatLng(${currentLocation!.latitude}, ${currentLocation!.longitude})",
    );
    log(address.toString());

    // Update app bar with the current address and save it to Firestore
    setState(() {
      appbarTitle = address;
      // _locationController.text = address;
      saveUserLocation(
        currentLocation!.latitude!,
        currentLocation!.longitude!,
        appbarTitle,
      );
    });
  }

  void saveUserLocation(double latitude, double longitude, String userAddress) {
    FirebaseFirestore.instance.collection('Mechanics').doc(currentUId).set({
      'isLocationSet': true,
      'lastLocation': {
        'latitude': latitude,
        'longitude': longitude,
      },
      'lastAddress': userAddress,
    }, SetOptions(merge: true));

    FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(currentUId)
        .collection("Addresses")
        .add({
      'address': userAddress,
      'location': {
        'latitude': latitude,
        'longitude': longitude,
      },
      'addressType': "Current",
      "isAddressSelected": true,
    });
  }
}
