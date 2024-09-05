import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/find_mechanic.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import '../../services/collection_references.dart';
import '../../services/latlng_converter.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/dashboard_search_text_field.dart';
import 'dart:developer';
import 'package:location/location.dart' as loc;
import 'package:location/location.dart';
import '../address/address_management_screen.dart';
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
  bool hasVehicles = false;
  String userName = "";
  String phoneNumber = "";
  String userPhoto = "";

  TextEditingController _locationController =
      new TextEditingController(text: "Finding Address....");
  TextEditingController _serviceAndNetworkController =
      new TextEditingController();
  TextEditingController _selectedCompanyAndVehcileNameController =
      new TextEditingController();
  TextEditingController _companyNameController = TextEditingController();
  int _currentIndex = 0;
  String? _selectedCompanyAndVehcileName;
  List<String> allServiceAndNetworkOptions = [];
  List<String> filteredServiceAndNetworkOptions = [];
  List<dynamic> allVehicleAndCompanyName = [];
  List<dynamic> filterSelectedCompanyAndvehicleName = [];

  @override
  void initState() {
    super.initState();
    // fetchUserCurrentLocationAndUpdateToFirebase();
    checkIfLocationIsSet();
    _fetchServicesName();
    _fetchUserVehicles();
    _fetchByDefaultUserVehicle();
  }

  Future<void> _fetchServicesName() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('servicesName')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> servicesList = metadataSnapshot.data()?['data'] ?? [];
        // print('Services List: $servicesList'); // Debugging line

        setState(() {
          allServiceAndNetworkOptions = List<String>.from(servicesList);
          // Initialize filtered list with all options
          filteredServiceAndNetworkOptions =
              List.from(allServiceAndNetworkOptions);

          print(
              'Filter List: $filteredServiceAndNetworkOptions'); // Debugging line
        });
      }
    } catch (e) {
      print('Error fetching services names: $e');
    }
  }

  void _filterServiceAndNetwork(String query) {
    final filteredList = allServiceAndNetworkOptions
        .where((item) => item.toLowerCase().contains(query.toLowerCase()))
        .toList();
    setState(() {
      filteredServiceAndNetworkOptions = filteredList;
      print(
          'New Filter List: $filteredServiceAndNetworkOptions'); // Debugging line
    });
  }

  Future<void> _fetchByDefaultUserVehicle() async {
    try {
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .where('isSet', isEqualTo: true)
          .get();

      if (vehiclesSnapshot.docs.isNotEmpty) {
        // Set the selected vehicle name
        final vehicleData =
            vehiclesSnapshot.docs.first.data() as Map<String, dynamic>;
        setState(() {
          _selectedCompanyAndVehcileName =
              vehicleData['vehicleNumber'] ?? 'Select your Vehicle';
          _selectedCompanyAndVehcileNameController.text =
              vehicleData['vehicleNumber'] ?? 'Select your Vehicle';

          _companyNameController.text =
              vehicleData['companyName'] ?? 'Company Name';

          print(
              "new function called $_selectedCompanyAndVehcileNameController");
        });
      } else {
        // No vehicles found, set default label
        setState(() {
          _selectedCompanyAndVehcileName = 'Select your Vehicle';
        });
      }
    } catch (e) {
      log("Error fetching user vehicles: $e");
      // In case of error, also set default label
      setState(() {
        _selectedCompanyAndVehcileName = 'Select your Vehicle';
      });
    }
  }

  Future<void> _fetchUserVehicles() async {
    try {
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          // .where('isSet', isEqualTo: true)
          .get();

      if (vehiclesSnapshot.docs.isNotEmpty) {
        List vehicleNames = vehiclesSnapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          return data['vehicleNumber'] ?? '';
        }).toList();
        // List companyNames = vehiclesSnapshot.docs.map((doc) {
        //   final data = doc.data() as Map<String, dynamic>;
        //   return data['companyName'] ?? '';
        // }).toList();

        print('Vehicle Names with isSet true: $vehicleNames'); // Debugging line

        setState(() {
          hasVehicles = true;
          allVehicleAndCompanyName = vehicleNames;
          // _companyNameController = companyNames[0];
          // _selectedCompanyAndVehcileName =vehicleNames;
          filterSelectedCompanyAndvehicleName =
              List.from(allVehicleAndCompanyName);
        });
      } else {
        setState(() {
          hasVehicles = false;
        });
      }
    } catch (e) {
      log("Error fetching user vehicles: $e");
    }
  }

  void _filterselectedCompanyAndvehicle(String query) {
    final filteredList = allVehicleAndCompanyName
        .where((item) => item.toLowerCase().contains(query.toLowerCase()))
        .toList();
    setState(() {
      filterSelectedCompanyAndvehicleName = filteredList;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // appBar: buildCustomAppBar(context),
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: Image.asset(
          'assets/appbar_logo.png', // Replace with your logo asset path
          height: 60.h, // Adjust the height as needed
        ),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => const ProfileScreen(),
                transition: Transition.cupertino,
                duration: const Duration(milliseconds: 900)),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('Users')
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
          SizedBox(width: 20.w),
        ],
      ),

      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 15.w, vertical: 5.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 20.h),

              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
                decoration: BoxDecoration(
                    color: kSecondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r)),
                child: Column(
                  children: [
                    //select your vehicle section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () {
                            _showSelectedVehicleAndCompanyOptions();
                          },
                          child: SizedBox(
                            width: 270.w,
                            child: AbsorbPointer(
                              child: DashBoardSearchTextField(
                                label: "Select your Vehicle",
                                controller:
                                    _selectedCompanyAndVehcileNameController,
                                enable: true,
                              ),
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () async {
                            var result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AddVehicleScreen(),
                              ),
                            );
                            if (result != null) {
                              // Handle the result
                              String? company = result['company'];
                              String? vehicleNumber = result['vehicleNumber'];
                              log("Company: $company, Vehicle Number: $vehicleNumber");

                              setState(() {
                                _selectedCompanyAndVehcileName = company;
                              });
                            }
                          },
                          child: CircleAvatar(
                            backgroundColor: kPrimary,
                            child: Icon(
                              Icons.add,
                              color: kWhite,
                              size: 24.r,
                            ),
                          ),
                        ),
                      ],
                    ),

                    SizedBox(height: 20.h),

                    GestureDetector(
                      onTap: () {
                        _showServiceAndNetworkOptions();
                      },
                      child: AbsorbPointer(
                        child: DashBoardSearchTextField(
                          label: "Select Service",
                          // hint: "Service or Network",
                          controller: _serviceAndNetworkController,
                          enable: true,
                        ),
                      ),
                    ),
                    SizedBox(height: 20.h),
                    GestureDetector(
                      onTap: () async {
                        var selectedAddress = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => AddressManagementScreen(
                              userLat: userLat,
                              userLng: userLong,
                            ),
                          ),
                        );
                        if (selectedAddress != null) {
                          setState(() {
                            appbarTitle = selectedAddress["address"];
                            _locationController.text = selectedAddress[
                                "address"]; // Set the selected address to the text field
                            log("Selected location: " +
                                selectedAddress["address"]);
                          });
                        }
                      },
                      child: DashBoardSearchTextField(
                        label: "Select your Location",
                        // label: "Select your Location",
                        controller: _locationController,
                        enable: false,
                      ),
                    ),

                    SizedBox(height: 20.h),
                    CustomButton(
                      text: "Find Mechanic",
                      onPress: () async {
                        findMechanic(
                          _locationController.text,
                          userPhoto,
                          userName,
                          phoneNumber,
                          userLat,
                          userLong,
                          _serviceAndNetworkController.text.toString(),
                          _companyNameController.text.toString(),
                          _selectedCompanyAndVehcileNameController.text
                              .toString(),
                        );
                      },
                      color: kPrimary,
                    ),
                  ],
                ),
              ),

              SizedBox(height: 12.h),
              // Quick Search Section
              Align(
                alignment: Alignment.centerLeft,
                child: Text('Our Services',
                    style: appStyle(22, kDark, FontWeight.w500)),
              ),
              SizedBox(height: 10.h),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
                decoration: BoxDecoration(
                    color: kSecondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r)),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  crossAxisCount: 3,
                  crossAxisSpacing: 1,
                  mainAxisSpacing: 1,
                  childAspectRatio: 6 / 5,
                  children: _buildQuickSearchItems(),
                ),
              ),

              SizedBox(height: 100.h),
            ],
          ),
        ),
      ),
    );
  }

  void _showServiceAndNetworkOptions() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 1.0,
          builder: (BuildContext context, ScrollController scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(20.0),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    margin: EdgeInsets.symmetric(vertical: 10),
                    width: 60,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: "Search Service or Network",
                        prefixIcon: Icon(Icons.search),
                      ),
                      onChanged: (value) {
                        _filterServiceAndNetwork(value);
                      },
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: filteredServiceAndNetworkOptions.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(filteredServiceAndNetworkOptions[index]),
                          onTap: () {
                            setState(() {
                              _serviceAndNetworkController.text =
                                  filteredServiceAndNetworkOptions[index];
                            });
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showSelectedVehicleAndCompanyOptions() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.5,
          maxChildSize: 1.0,
          builder: (BuildContext context, ScrollController scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(20.0),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    margin: EdgeInsets.symmetric(vertical: 10),
                    width: 60,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: "Select your Vehicle",
                        prefixIcon: Icon(Icons.search),
                      ),
                      onChanged: (value) {
                        _filterselectedCompanyAndvehicle(value);
                      },
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: filterSelectedCompanyAndvehicleName.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title:
                              Text(filterSelectedCompanyAndvehicleName[index]),
                          onTap: () async {
                            // await _updateVehicleSelection(filterSelectedCompanyAndvehicleName[index]);
                            setState(() {
                              _selectedCompanyAndVehcileName =
                                  filterSelectedCompanyAndvehicleName[index];
                            });
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  List<Widget> _buildQuickSearchItems() {
    List<Map<String, dynamic>> items = [
      {"title": "Tires", "icon": "assets/tire.png"},
      {"title": "Air Leak", "icon": "assets/air_leak.png"},
      {"title": "Battery", "icon": "assets/battery_truck.png"},
      {"title": "Engine Sign", "icon": "assets/engine_2.png"},
      {"title": "Electrical", "icon": "assets/electrical.png"},
      {"title": "Towing", "icon": "assets/towing_truck.png"},
    ];

    return items.map((item) {
      return GestureDetector(
        onTap: () {
          // Get.to(
          //     () => SearchResultsScreen(searchText: item["title"].toString()));
          // // Your quick search logic here
        },
        child: Container(
          width: 100,
          // Define width for the rectangle
          height: 50,
          // Define height for the rectangle
          margin: EdgeInsets.only(left: 8, right: 8, bottom: 8, top: 8),
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kPrimary,
            borderRadius: BorderRadius.circular(8), // Optional: rounded corners
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                item["icon"],
                color: Colors.white,
                height: 30.h, // Image height
                width: 30.w, // Image width
              ),
              // Space between image and text
              Flexible(
                child: Text(
                  item["title"],
                  style: TextStyle(color: Colors.white, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Future<void> _updateVehicleSelection(String selectedVehicle) async {
    try {
      // First, set all vehicles' isSet to false
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .get();

      for (var doc in vehiclesSnapshot.docs) {
        await FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('Vehicles')
            .doc(doc.id)
            .update({'isSet': false});
      }

      // Then, set the selected vehicle's isSet to true
      QuerySnapshot selectedVehicleSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .where('vehicleName', isEqualTo: selectedVehicle)
          .get();

      if (selectedVehicleSnapshot.docs.isNotEmpty) {
        await FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('Vehicles')
            .doc(selectedVehicleSnapshot.docs.first.id)
            .update({'isSet': true});
      }
    } catch (e) {
      log("Error updating vehicle selection: $e");
    }
  }

  //========================================= Location Section ==========================
  //
  // Future<void> checkIfLocationIsSet() async {
  //   try {
  //     DocumentSnapshot userDoc = await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .get();
  //
  //     if (userDoc.exists && userDoc.data() != null) {
  //       var data = userDoc.data() as Map<String, dynamic>;
  //       if (data.containsKey('isLocationSet') &&
  //           data['isLocationSet'] == true) {
  //         // Location is already set, fetch the current address
  //         fetchCurrentAddress();
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
  //
  // Future<void> fetchCurrentAddress() async {
  //   try {
  //     QuerySnapshot addressSnapshot = await FirebaseFirestore.instance
  //         .collection('Users')
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
  //       });
  //     }
  //   } catch (e) {
  //     log("Error fetching current address: $e");
  //   }
  // }
  //
  // //====================== Fetching user current location =====================
  // void fetchUserCurrentLocationAndUpdateToFirebase() async {
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
  //     // Open app settings to grant permission
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
  //   // Get the address from latitude and longitude
  //   String address = await getAddressFromLtLng(
  //     "LatLng(${currentLocation!.latitude}, ${currentLocation!.longitude})",
  //   );
  //   log(address.toString());
  //
  //   // Update the app bar with the current address
  //   setState(() {
  //     appbarTitle = address;
  //     _locationController.text = address.toString();
  //     log(appbarTitle);
  //     log(currentLocation!.latitude.toString());
  //     log(currentLocation!.longitude.toString());
  //     // Update the Firestore document with the current location
  //     saveUserLocation(
  //       currentLocation!.latitude!,
  //       currentLocation!.longitude!,
  //       appbarTitle,
  //     );
  //   });
  // }
  //
  // void saveUserLocation(double latitude, double longitude, String userAddress) {
  //   FirebaseFirestore.instance.collection('Users').doc(currentUId).set({
  //     'isLocationSet': true,
  //   }, SetOptions(merge: true));
  //
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

//========================================= Location Section ==========================

  Future<void> checkIfLocationIsSet() async {
    try {
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('Users')
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
          .collection('Users')
          .doc(currentUId)
          .collection("Addresses")
          .where('isAddressSelected', isEqualTo: true)
          .get();

      if (addressSnapshot.docs.isNotEmpty) {
        var addressData =
            addressSnapshot.docs.first.data() as Map<String, dynamic>;
        setState(() {
          appbarTitle = addressData['address'];
          _locationController.text = addressData['address'];
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
          _locationController.text = appbarTitle; // previously stored address
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
      _locationController.text = address;
      saveUserLocation(
        currentLocation!.latitude!,
        currentLocation!.longitude!,
        appbarTitle,
      );
    });
  }

  void saveUserLocation(double latitude, double longitude, String userAddress) {
    FirebaseFirestore.instance.collection('Users').doc(currentUId).set({
      'isLocationSet': true,
      'lastLocation': {
        'latitude': latitude,
        'longitude': longitude,
      },
      'lastAddress': userAddress,
    }, SetOptions(merge: true));

    FirebaseFirestore.instance
        .collection('Users')
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
