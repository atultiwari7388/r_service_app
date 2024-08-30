import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_shop_app/utils/app_styles.dart';
import 'package:regal_shop_app/utils/constants.dart';
import '../../services/latlng_converter.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/reusable_text.dart';
import 'dart:developer';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';

class NewRequestScreeen extends StatefulWidget {
  const NewRequestScreeen({super.key});

  @override
  State<NewRequestScreeen> createState() => _NewRequestScreeenState();
}

class _NewRequestScreeenState extends State<NewRequestScreeen> {
  // bool _showMenu = false;
  String appbarTitle = "";
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

  List sliderDocs = [
    "https://timesproweb-static-backend-prod.s3.ap-south-1.amazonaws.com/Blog_page_on_What_Is_Automotive_Engineering_fe98e29c6e.webp",
    "https://bcdn.mindler.com/bloglive/wp-content/uploads/2021/12/10163055/Blog-Banner.png",
    "https://kahedu.edu.in/n/wp-content/uploads/2022/04/b2.jpg",
    "https://www.univariety.com/blog/wp-content/uploads/2014/08/automotive-engineering-1.jpg"
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: buildCustomAppBar(context),
      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 15.w, vertical: 5.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [],
          ),
        ),
      ),
    );
  }

  // ----------------------------------- Custom App bar ------------------------------
  PreferredSize buildCustomAppBar(BuildContext context) {
    return PreferredSize(
      preferredSize: Size.fromHeight(130.h),
      child: GestureDetector(
        onTap: () async {
//           var selectedAddress = await Navigator.push(
//             context,
//             MaterialPageRoute(
//               builder: (context) => AddressManagementScreen(
//                 userLat: userLat,
//                 userLng: userLong,
//               ),
//             ),
//           );

//           if (selectedAddress != null) {
//             setState(() {
//               appbarTitle = selectedAddress['address'];
//             });
// // Update the selected address in Firestore
//             // Update the selected address in Firestore
//             FirebaseFirestore.instance
//                 .collection('Users')
//                 .doc(currentUId)
//                 .collection('Addresses')
//                 .get()
//                 .then((querySnapshot) {
//               WriteBatch batch = FirebaseFirestore.instance.batch();

//               for (var doc in querySnapshot.docs) {
//                 log("Selected Address Id : ${selectedAddress["id"]}");
//                 // Update all addresses to set isAddressSelected to false
//                 batch.update(doc.reference, {'isAddressSelected': false});
//               }

//               // Update the selected address to set isAddressSelected to true
//               batch.update(
//                 FirebaseFirestore.instance
//                     .collection('Users')
//                     .doc(currentUId)
//                     .collection('Addresses')
//                     .doc(selectedAddress["id"]),
//                 {'isAddressSelected': true},
//               );

//               // Commit the batch write
//               batch.commit().then((value) {
//                 // _onAddressChanged();
//               });
//             });

//           }
        },
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 1.h),
          height: 90.h,
          width: MediaQuery.of(context).size.width,
          color: kOffWhite,
          child: Container(
            margin: EdgeInsets.only(top: 8.h),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Padding(
                      padding:
                          EdgeInsets.only(bottom: 4.h, left: 5.w, top: 7.h),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ReusableText(
                              text: "Delivery in",
                              style: appStyle(13, kDark, FontWeight.bold)),
                          SizedBox(
                            width: MediaQuery.of(context).size.width * 0.65,
                            child: Text(
                              appbarTitle.isEmpty
                                  ? "Fetching Addresses....."
                                  : appbarTitle,
                              overflow: TextOverflow.ellipsis,
                              style: appStyle(12, kDarkGray, FontWeight.normal),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Icon(Icons.location_on, color: kSecondary, size: 35.sp),
                  ],
                ),
                // GestureDetector(
                //   onTap: () => Get.to(() => const ProfileScreen(),
                //       transition: Transition.cupertino,
                //       duration: const Duration(milliseconds: 900)),
                //   child: CircleAvatar(
                //     radius: 19.r,
                //     backgroundColor: kPrimary,
                //     child: StreamBuilder<DocumentSnapshot>(
                //       stream: FirebaseFirestore.instance
                //           .collection('Users')
                //           .doc(currentUId)
                //           .snapshots(),
                //       builder: (BuildContext context,
                //           AsyncSnapshot<DocumentSnapshot> snapshot) {
                //         if (snapshot.hasError) {
                //           return Text('Error: ${snapshot.error}');
                //         }

                //         if (snapshot.connectionState ==
                //             ConnectionState.waiting) {
                //           return const CircularProgressIndicator();
                //         }

                //         final data =
                //             snapshot.data!.data() as Map<String, dynamic>;
                //         final profileImageUrl = data['profilePicture'] ?? '';
                //         final userName = data['userName'] ?? '';

                //         if (profileImageUrl.isEmpty) {
                //           return Text(
                //             userName.isNotEmpty ? userName[0] : '',
                //             style: appStyle(20, kWhite, FontWeight.bold),
                //           );
                //         } else {
                //           return ClipOval(
                //             child: Image.network(
                //               profileImageUrl,
                //               width: 38.r, // Set appropriate size for the image
                //               height: 35.r,
                //               fit: BoxFit.cover,
                //             ),
                //           );
                //         }
                //       },
                //     ),
                //   ),
                // ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
