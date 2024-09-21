import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:location/location.dart' as loc;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:location/location.dart';
import '../services/collection_references.dart';
import '../services/find_mechanic.dart';
import '../services/generate_order_id.dart';
import '../services/latlng_converter.dart';
import '../utils/constants.dart';
import '../utils/show_toast_msg.dart';

class DashboardController extends GetxController {
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
  String userPhoto =
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658";
  bool imageSelected = false;
  bool isVehicleSelected = false;
  bool isServiceSelected = false;
  bool isAddressSelected = false;
  bool isFindMechanicEnabled = false;

  File? image;
  List<File> images = [];

  // Add a boolean variable for loading state
  bool _isLoading = false;

  // Getter to expose loading state
  bool get isLoading => _isLoading;

  Timer? _debounce;

  void onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      filterselectedCompanyAndvehicle(query);
    });
  }

  // Method to set loading state
  void setLoading(bool loading) {
    _isLoading = loading;
    update(); // Notify listeners
  }

  TextEditingController locationController =
      new TextEditingController(text: "Finding Address....");
  TextEditingController serviceAndNetworkController =
      new TextEditingController();
  TextEditingController selectedCompanyAndVehcileNameController =
      new TextEditingController();
  TextEditingController companyNameController = TextEditingController();
  int currentIndex = 0;
  String? selectedCompanyAndVehcileName;
  List<String> allServiceAndNetworkOptions = [];
  List<String> filteredServiceAndNetworkOptions = [];
  List<dynamic> allVehicleAndCompanyName = [];
  List<dynamic> filterSelectedCompanyAndvehicleName = [];

  @override
  void onInit() {
    super.onInit();
    checkIfLocationIsSet();
    fetchServicesName();
    fetchUserVehicles();
    fetchByDefaultUserVehicle();
  }

  Future<void> fetchServicesName() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('servicesName')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> servicesList = metadataSnapshot.data()?['data'] ?? [];
        // print('Services List: $servicesList'); // Debugging line

        allServiceAndNetworkOptions = List<String>.from(servicesList);
        // Initialize filtered list with all options
        filteredServiceAndNetworkOptions =
            List.from(allServiceAndNetworkOptions);

        print(
            'Filter List: $filteredServiceAndNetworkOptions'); // Debugging line
        update();
      }
    } catch (e) {
      print('Error fetching services names: $e');
    }
  }

  void filterServiceAndNetwork(String query) {
    final filteredList = allServiceAndNetworkOptions
        .where((item) => item.toLowerCase().contains(query.toLowerCase()))
        .toList();

    filteredServiceAndNetworkOptions = filteredList;
    print(
        'New Filter List: $filteredServiceAndNetworkOptions'); // Debugging line
    update();
  }

  Future<void> fetchByDefaultUserVehicle() async {
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

        selectedCompanyAndVehcileName =
            vehicleData['vehicleNumber'] ?? 'Select your Vehicle';
        selectedCompanyAndVehcileNameController.text =
            vehicleData['vehicleNumber'] ?? 'Select your Vehicle';

        companyNameController.text =
            vehicleData['companyName'] ?? 'Company Name';
        isVehicleSelected = true; // Vehicle selected
        checkIfAllSelected();

        print("new function called $selectedCompanyAndVehcileNameController");
        update();
      } else {
        // No vehicles found, set default label

        selectedCompanyAndVehcileName = 'Select your Vehicle';
        update();
      }
    } catch (e) {
      log("Error fetching user vehicles: $e");
      // In case of error, also set default label

      selectedCompanyAndVehcileName = 'Select your Vehicle';
      update();
    }
  }

  Future<void> fetchUserVehicles() async {
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

        hasVehicles = true;
        allVehicleAndCompanyName = vehicleNames;
        // _companyNameController = companyNames[0];
        // _selectedCompanyAndVehcileName =vehicleNames;
        filterSelectedCompanyAndvehicleName =
            List.from(allVehicleAndCompanyName);
        update();
      } else {
        hasVehicles = false;
        update();
      }
    } catch (e) {
      log("Error fetching user vehicles: $e");
    }
  }

  void filterselectedCompanyAndvehicle(String query) {
    final filteredList = allVehicleAndCompanyName
        .where((item) => item.toLowerCase().contains(query.toLowerCase()))
        .toList();

    filterSelectedCompanyAndvehicleName = filteredList;
    update();
  }

  void showSelectedVehicleAndCompanyOptions(BuildContext context) {
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
                        // filterselectedCompanyAndvehicle(value);
                        onSearchChanged(value);
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
                          // onTap: () async {
                          //   selectedCompanyAndVehcileName =
                          //       filterSelectedCompanyAndvehicleName[index];
                          //   log("New Selected Company ${filterSelectedCompanyAndvehicleName[index]} ");
                          //   await updateVehicleSelection(
                          //       filterSelectedCompanyAndvehicleName[index]);
                          //   selectedCompanyAndVehcileNameController.text =
                          //       filterSelectedCompanyAndvehicleName[index];
                          //   update();
                          //   Navigator.pop(context);
                          // },
                          onTap: () async {
                            // _isLoading = true; // Show loading indicator
                            // update();

                            selectedCompanyAndVehcileName =
                                filterSelectedCompanyAndvehicleName[index];
                            log("New Selected Company ${filterSelectedCompanyAndvehicleName[index]} ");

                            await updateVehicleSelection(
                                filterSelectedCompanyAndvehicleName[
                                    index]); // Database update
                            selectedCompanyAndVehcileNameController.text =
                                filterSelectedCompanyAndvehicleName[index];

                            // _isLoading = false; // Hide loading indicator
                            isVehicleSelected = true; // Vehicle selected
                            checkIfAllSelected();
                            update(); // UI update
                            Navigator.pop(context); // Close dialog
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

  Future<void> updateVehicleSelection(String selectedVehicle) async {
    try {
      // First, set all vehicles' isSet to false
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .get();

      // Check if there are any vehicles to update
      if (vehiclesSnapshot.docs.isEmpty) {
        log("No vehicles found for user $currentUId");
        return;
      }

      // Set isSet to false for all vehicles
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
          .where('vehicleNumber',
              isEqualTo: selectedVehicle) // Ensure the field name is correct
          .get();

      // Check if the selected vehicle is found
      if (selectedVehicleSnapshot.docs.isNotEmpty) {
        await FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('Vehicles')
            .doc(selectedVehicleSnapshot.docs.first.id)
            .update({'isSet': true});
        log("Vehicle $selectedVehicle set to isSet true");
      } else {
        log("Selected vehicle $selectedVehicle not found");
      }
    } catch (e) {
      log("Error updating vehicle selection: $e");
    }
  }

  void showServiceAndNetworkOptions(BuildContext context) {
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
                        filterServiceAndNetwork(value);
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
                            serviceAndNetworkController.text =
                                filteredServiceAndNetworkOptions[index];
                            isServiceSelected = true; // Service selected
                            checkIfAllSelected();
                            update();
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

  void showImageSourceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Select Image Source'),
          actions: <Widget>[
            TextButton(
              child: Text('Camera'),
              onPressed: () {
                Navigator.of(context).pop();
                getImage(ImageSource.camera, context);
              },
            ),
            TextButton(
              child: Text('Gallery'),
              onPressed: () {
                Navigator.of(context).pop();
                getImage(ImageSource.gallery, context);
              },
            ),
            TextButton(
              child: Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  void getImage(ImageSource source, BuildContext context) async {
    if (source == ImageSource.camera) {
      // For camera, use pickImage
      final pickedFile = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 50,
      );

      if (pickedFile != null) {
        images = [File(pickedFile.path)];
        imageSelected = true; // Update the boolean value
        update(); // Notify listeners
      } else {
        imageSelected = false; // No image captured
        update(); // Notify listeners
      }
    } else if (source == ImageSource.gallery) {
      // For gallery, use pickMultiImage
      final pickedFiles = await ImagePicker().pickMultiImage(
        imageQuality: 50,
      );

      if (pickedFiles != null && pickedFiles.length <= 4) {
        images = pickedFiles.map((file) => File(file.path)).toList();
        imageSelected = images.isNotEmpty; // Update the boolean value
        update(); // Notify listeners
      } else if (pickedFiles != null && pickedFiles.length > 4) {
        // If more than 4 images selected, show a message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("You can only select up to 4 images")),
        );
      } else {
        imageSelected = false; // No images selected
        update(); // Notify listeners
      }
    }
  }

  Future<void> findMechanic(
    String address,
    String userPhoto,
    String name,
    String phoneNumber,
    double userLatitude,
    double userLongitude,
    String selectedService,
    String companyName,
    String vehicleNumber,
    bool isImageSelected,
    List<File> images,
  ) async {
    try {
      setLoading(true);
      // Generate order ID
      final orderId = await generateOrderId();

      // List to store image URLs
      List<String> imageUrls = [];

      // Upload images to Firebase Storage
      if (isImageSelected) {
        for (File image in images) {
          String fileName =
              DateTime.now().millisecondsSinceEpoch.toString() + '.jpg';
          Reference storageRef = FirebaseStorage.instance
              .ref()
              .child('order_images')
              .child(fileName);

          // Upload the image
          UploadTask uploadTask = storageRef.putFile(image);

          // Get the download URL
          String imageUrl = await (await uploadTask).ref.getDownloadURL();
          imageUrls.add(imageUrl);
        }
      }

      var data = {
        'orderId': orderId.toString(),
        "cancelReason": "",
        'userId': currentUId,
        "userPhoto": userPhoto,
        'userName': name,
        'selectedService': selectedService,
        "companyName": companyName,
        "vehicleNumber": vehicleNumber,
        'userPhoneNumber': phoneNumber,
        'userDeliveryAddress': address,
        'userLat': userLatitude,
        "isImageSelected": isImageSelected,
        "images": imageUrls,
        'userLong': userLongitude,
        'orderDate': DateTime.now(),
        "payMode": "",
        "status": 0,
        "rating": "4.3",
        "time": "",
        "mId": "",
        "mName": "",
        "mNumber": "",
        "mDp": "",
        'arrivalCharges': "",
        'perHourCharges': "",
        'mechanicAddress': "",
        'mecLatitude': "",
        'mecLongtitude': "",
      };

      // Save order details to user's history subcollection
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection("history")
          .doc(orderId.toString())
          .set(data);

      // Save order details to admin-accessible collection
      await FirebaseFirestore.instance
          .collection("jobs")
          .doc(orderId.toString())
          .set(data);
      showToast('Job created successfully');
      // Order placed successfully
      // showToastMessage("Success", "Order placed successfully!", kSuccess);
      print('Order placed successfully!');
    } catch (e) {
      // Error handling
      print('Failed to place order: $e');
      showToastMessage("Error", "Failed to Submit request: $e", kRed);
    } finally {
      images.clear();
      setLoading(false);
    }
  }

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

        appbarTitle = addressData['address'];
        locationController.text = addressData['address'];
        isAddressSelected = true; // Address selected
        checkIfAllSelected();
        update();
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

        locationController.text = appbarTitle; // previously stored address
        isAddressSelected = true; // Address selected
        checkIfAllSelected();
        update();
        return; // Skip storing the same address again
      }
    }

    // If the location is different, fetch the new address
    String address = await getAddressFromLtLng(
      "LatLng(${currentLocation!.latitude}, ${currentLocation!.longitude})",
    );
    log(address.toString());

    // Update app bar with the current address and save it to Firestore

    appbarTitle = address;
    locationController.text = address;
    saveUserLocation(
      currentLocation!.latitude!,
      currentLocation!.longitude!,
      appbarTitle,
    );
    update();
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

  void checkIfAllSelected() {
    if (isVehicleSelected && isServiceSelected && isAddressSelected) {
      isFindMechanicEnabled = true;
    } else {
      isFindMechanicEnabled = false;
    }
  }
}
