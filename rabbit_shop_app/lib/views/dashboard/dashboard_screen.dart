import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/profile/profile_screen.dart';
import 'package:regal_shop_app/widgets/custom_background_container.dart';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
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

  @override
  void initState() {
    super.initState();
    fetchUserCurrentLocationAndUpdateToFirebase();
  }

  // Future<void> checkIfLocationIsSet() async {
  //   try {
  //     DocumentSnapshot userDoc = await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .get();

  //     if (userDoc.exists && userDoc.data() != null) {
  //       var data = userDoc.data() as Map<String, dynamic>;
  //       if (data.containsKey('isLocationSet') &&
  //           data['isLocationSet'] == true) {
  //         // Location is already set, fetch the current address
  //         // fetchCurrentAddress();
  //       } else {
  //         // Location is not set, fetch and update current location
  //         fetchUserCurrentLocationAndUpdateToFirebase();
  //       }
  //     } else {
  //       // Document doesn't exist, fetch and update current location
  //       fetchUserCurrentLocationAndUpdateToFirebase();
  //     }
  //   } catch (e) {
  //     log("Error checking location set status: $e");
  //   }
  // }

  // Future<void> fetchCurrentAddress() async {
  //   try {
  //     QuerySnapshot addressSnapshot = await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .collection("Addresses")
  //         .where('isAddressSelected', isEqualTo: true)
  //         .get();

  //     if (addressSnapshot.docs.isNotEmpty) {
  //       var addressData =
  //           addressSnapshot.docs.first.data() as Map<String, dynamic>;
  //       setState(() {
  //         appbarTitle = addressData['address'];
  //       });
  //     }
  //   } catch (e) {
  //     log("Error fetching current address: $e");
  //   }
  // }

  //====================== Fetching user current location =====================
  void fetchUserCurrentLocationAndUpdateToFirebase() async {
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
      // Open app settings to grant permission
      await loc.Location().requestPermission();
      permissionGranted = await location.hasPermission();
      if (permissionGranted != loc.PermissionStatus.granted) {
        return;
      }
    }

    // Get the current location
    currentLocation = await location.getLocation();

    // Get the address from latitude and longitude
    String address = await getAddressFromLtLng(
      "LatLng(${currentLocation!.latitude}, ${currentLocation!.longitude})",
    );
    log(address.toString());

    // Update the app bar with the current address
    setState(() {
      appbarTitle = address;
      log(appbarTitle);
      log(currentLocation!.latitude.toString());
      log(currentLocation!.longitude.toString());
      // Update the Firestore document with the current location
      // saveUserLocation(
      //   currentLocation!.latitude!,
      //   currentLocation!.longitude!,
      //   appbarTitle,
      // );
    });
  }

  // void saveUserLocation(double latitude, double longitude, String userAddress) {
  //   FirebaseFirestore.instance.collection('Users').doc(currentUId).set({
  //     'isLocationSet': true,
  //   }, SetOptions(merge: true));

  //   FirebaseFirestore.instance
  //       .collection('Users')
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Dashboard", style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => ProfileScreen()),
            child: CircleAvatar(
              backgroundColor: kPrimary,
              radius: 19.r,
              child: Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: CustomBackgroundContainer(
        horizontalW: 20,
        vertical: 1,
        scrollPhysics: NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              child: _compactDashboardItem(
                  "Today Orders", todaysOrder.toString(), kSecondary),
            ),
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              child: _compactDashboardItem(
                  "Total Orders", totalOrders.toString(), kRed),
            ),
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              onTap: () {
                // widget.setTab?.call(1);
              },
              child: _compactDashboardItem(
                  "Pending Orders", pendingOrders.toString(), Colors.green),
            ),
          ],
        ),
      ),
    );
  }

  Widget _compactDashboardItem(String title, String value, Color color) {
    return Container(
      height: 180.h,
      width: double.maxFinite,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12.r),
      ),
      padding: EdgeInsets.all(10.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title,
              textAlign: TextAlign.center,
              style: appStyle(26, kWhite, FontWeight.bold)),
          SizedBox(height: 10.h),
          Text(value, style: appStyle(16, kWhite, FontWeight.bold)),
        ],
      ),
    );
  }
}
