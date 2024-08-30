import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/text_field.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../services/latlng_converter.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/reusable_text.dart';
import 'dart:developer';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
import '../profile/profile_screen.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
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
    "https://firebasestorage.googleapis.com/v0/b/food-otg-service-app.appspot.com/o/6.png?alt=media&token=83efcc3f-0020-4ff4-a6a7-3b1381962de6",
    "https://firebasestorage.googleapis.com/v0/b/food-otg-service-app.appspot.com/o/7.png?alt=media&token=ce747cf1-39eb-4cdd-936a-8db77a8f6299"
  ];

  TextEditingController titleController = new TextEditingController();
  TextEditingController descriptionController = new TextEditingController();
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: buildCustomAppBar(context),
      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 15.w, vertical: 5.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 20.h),
              buildImageSlider(),
              SizedBox(height: 20.h),
              // Request form container
              Container(
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  color: kGrayLight.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(15.r),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Text(
                        "Submit Your Details",
                        style: TextStyle(
                          fontSize: 20.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    SizedBox(height: 20.h),
                    Text(
                      "Title",
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 5.h),
                    TextFieldInputWidget(
                      hintText: "Enter your title",
                      textEditingController: titleController,
                      textInputType: TextInputType.text,
                      icon: Icons.abc,
                      isIconApply: false,
                    ),
                    SizedBox(height: 20.h),
                    Text(
                      "Description",
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 5.h),
                    TextFieldInputWidget(
                      hintText: "Enter your description",
                      textEditingController: descriptionController,
                      textInputType: TextInputType.text,
                      icon: Icons.abc,
                      isIconApply: false,
                      maxLines: 5,
                    ),
                    SizedBox(height: 30.h),
                    Center(
                      child: CustomButton(
                          text: "Submit", onPress: () {}, color: kPrimary),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 100.h),
            ],
          ),
        ),
      ),
    );
  }

  /**--------------------------- Build Carousel Slider ----------------------------**/
  Widget buildImageSlider() {
    return Column(
      children: [
        CarouselSlider(
          items: sliderDocs.map((imageUrl) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(15),
              child: Image.network(
                imageUrl,
                loadingBuilder: (BuildContext context, Widget child,
                    ImageChunkEvent? loadingProgress) {
                  if (loadingProgress == null) {
                    return child;
                  } else {
                    return _buildPlaceholder(); // Display placeholder while loading
                  }
                },
                width: double.maxFinite,
                fit: BoxFit.fill,
              ),
            );
          }).toList(),
          options: CarouselOptions(
            enableInfiniteScroll: false,
            // Disable infinite scroll to prevent wrapping
            autoPlay: true,
            aspectRatio: 16 / 7,
            viewportFraction: 1,
            onPageChanged: (index, reason) {
              setState(() {
                _currentIndex = index;
              });
            },
          ),
        ),
        SizedBox(height: 10.h),
        buildDotIndicator(), // Add the dot indicator below the slider
      ],
    );
  }

  Widget buildDotIndicator() {
    return AnimatedSmoothIndicator(
      activeIndex: _currentIndex,
      count: sliderDocs.length,
      effect: ExpandingDotsEffect(
        activeDotColor: kPrimary, // Color of the active dot
        dotHeight: 8.h,
        dotWidth: 8.w,
        expansionFactor: 3,
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Center(child: CircularProgressIndicator());
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
                          Row(
                            children: [
                              Icon(Icons.location_on_outlined),
                              ReusableText(
                                  text: "Delivery in",
                                  style: appStyle(13, kDark, FontWeight.bold)),
                            ],
                          ),
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
                GestureDetector(
                  onTap: () => Get.to(() => ProfileScreen()),
                  child: CircleAvatar(
                    radius: 19.r,
                    backgroundColor: kPrimary,
                    child: Text("A",
                        style: appStyle(18, kWhite, FontWeight.normal)),
                  ),
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
