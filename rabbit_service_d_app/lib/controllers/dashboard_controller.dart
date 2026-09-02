import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:location/location.dart' as loc;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:location/location.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/views/app/onBoard/on_boarding_screen.dart';
import '../services/find_mechanic.dart';
import '../services/generate_order_id.dart';
import '../services/latlng_converter.dart';
import '../utils/constants.dart';
import '../utils/show_toast_msg.dart';

class DashboardController extends GetxController {
  String get currentUId => FirebaseAuth.instance.currentUser?.uid ?? '';

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
  bool imageUploadEnabled = false; // To handle the upload button visibility
  bool isImageMandatory = false; // To handle the upload button visibility
  bool fixPriceEnabled = false; // for the fix price
  // String role = "";
  final RxString _role = ''.obs;
  String get role => _role.value;
  String ownerEmail = "";
  String ownerId = "";
  bool isAnonymous = true;
  bool isProfileComplete = false;

  File? image;
  List<File> images = [];

  // Add a boolean variable for loading state
  bool _isLoading = false;

  // Getter to expose loading state
  bool get isLoading => _isLoading;

  Timer? _debounce;

  // Method to set loading state
  void setLoading(bool loading) {
    _isLoading = loading;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update(); // Notify listeners safely after build phase
    });
  }

  TextEditingController locationController =
      new TextEditingController(text: "Select your location...");
  TextEditingController serviceAndNetworkController =
      new TextEditingController();
  TextEditingController selectedCompanyAndVehcileNameController =
      new TextEditingController();
  TextEditingController companyNameController = TextEditingController();
  TextEditingController descriptionController = TextEditingController();
  int currentIndex = 0;
  String? selectedCompanyAndVehcileName;
  List<Map<String, dynamic>> allServiceAndNetworkOptions = [];
  List<Map<String, dynamic>> filteredServiceAndNetworkOptions = [];

  List<Map<String, dynamic>> allFeaturedServiceAndNetworkOptions = [];
  List<Map<String, dynamic>> filteredFeaturedServiceAndNetworkOptions = [];

  List<dynamic> allVehicleAndCompanyName = [];
  List<dynamic> filterSelectedCompanyAndvehicleName = [];
  List<Map<String, dynamic>> userVehiclesList = [];
  List<Map<String, dynamic>> filteredUserVehiclesList = [];
  String? selectedVehicleId;
  String selectedVehicleMyCompany = '';
  String selectedVehicleMyComId = '';

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      initializeController();
    });
  }

  Future<void> initializeController() async {
    try {
      setLoading(true);
      await _fetchAndVerifyUserRole();
      if (_role.value.isEmpty) {
        final user = FirebaseAuth.instance.currentUser;
        if (user == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Get.offAll(() => const OnBoardingScreen());
          });
        }
        return;
      }
      await _loadAllData();
    } catch (e) {
      log("DashboardController init error: $e");
    } finally {
      setLoading(false);
    }
  }

  Future<void> _fetchAndVerifyUserRole() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        log("DashboardController: No authenticated user");
        _role.value = '';
        return;
      }

      final doc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(user.uid)
          .get();

      if (!doc.exists) {
        log("DashboardController: User document not found for ${user.uid}");
        _role.value = '';
        return;
      }

      final role = doc.data()?['role']?.toString() ?? '';
      isAnonymous = doc.data()?['isAnonymous'] ?? true;
      isProfileComplete = doc.data()?['isProfileComplete'] ?? false;
      ownerId = doc.data()?['createdBy']?.toString() ?? user.uid;

      _role.value = role;
      log("Role definitively set to: $role");
      log("Owner ID set to: $ownerId");
    } catch (e) {
      _role.value = '';
      log("Error in _fetchAndVerifyUserRole: $e");
    }
  }

  // Helper method to get the correct user ID based on role
  String get _effectiveUserId {
    return role == 'SubOwner' ? ownerId : currentUId;
  }

  Future<void> _loadAllData() async {
    // Load other data only after role is confirmed
    await Future.wait([
      // checkIfLocationIsSet(),
      fetchServicesName(),
      fetchUserVehicles(),
      fetchByDefaultUserVehicle(),
    ]);
  }

//======================== Fetch Services Name=============================

  Future<void> fetchServicesName() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('servicesList')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> servicesList = metadataSnapshot.data()?['data'] ?? [];

        // Extract titles, image_type, and price_type from each service map
        allServiceAndNetworkOptions = servicesList.map((service) {
          String title = service['title'].toString();
          int imageType = int.tryParse(service['image_type'].toString()) ?? 0;
          int priceType = int.tryParse(service['price_type'].toString()) ?? 0;
          String image = service["image"].toString();
          bool isFeatured = service["isFeatured"] ?? false;

          // Return a map or object with title, imageType, and priceType
          return {
            'title': title,
            'image_type': imageType,
            'price_type': priceType,
            'image': image,
            'isFeatured': isFeatured,
          };
        }).toList();

        // Initialize filtered list with all options
        filteredServiceAndNetworkOptions =
            List.from(allServiceAndNetworkOptions);

        print('Filter List: $filteredServiceAndNetworkOptions');
        update();
      }
    } catch (e) {
      print('Error fetching services names: $e');
    }
  }

//============================ Filter Services and Network Options =============================

  void filterServiceAndNetwork(String query) {
    // Log query to see what's happening
    print('Searching for: $query');

    if (query.isNotEmpty) {
      // Filter the list based on the start of the title
      final filteredList = allServiceAndNetworkOptions
          .where((item) => (item['title'] as String).toLowerCase().startsWith(
              query.toLowerCase())) // Show items that start with the query
          .toList();

      filteredServiceAndNetworkOptions = filteredList;
    } else {
      // If the search query is empty, show all options
      filteredServiceAndNetworkOptions = List.from(allServiceAndNetworkOptions);
    }

    print('New Filter List: $filteredServiceAndNetworkOptions');
    update(); // Use your state management (like GetX) to update the UI
  }

  Future<void> fetchByDefaultUserVehicle() async {
    try {
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId) // Use effective user ID
          .collection('Vehicles')
          .where('isSet', isEqualTo: true)
          .get();

      if (vehiclesSnapshot.docs.isNotEmpty) {
        // Fetch first matching vehicle
        final vehicleData =
            vehiclesSnapshot.docs.first.data() as Map<String, dynamic>;

        String vehicleNumber =
            vehicleData['vehicleNumber'] ?? 'Select your Vehicle';
        String companyName = vehicleData['companyName'] ?? 'Company Name';
        String myCompany = (vehicleData['myCompany'] ?? '').toString().trim();

        // Format as "BZDPT6650G (MACK)"
        // String formattedVehicle = myCompany.isNotEmpty
        //     ? "$vehicleNumber ($companyName) ($myCompany)"
        //     : "$vehicleNumber ($companyName)";
        String formattedVehicle = "$vehicleNumber ($companyName)";

        // Assign formatted data
        selectedVehicleId = vehiclesSnapshot.docs.first.id;
        selectedCompanyAndVehcileName = formattedVehicle;
        selectedCompanyAndVehcileNameController.text = formattedVehicle;
        companyNameController.text = companyName;
        selectedVehicleMyCompany =
            (vehicleData['myCompany'] ?? '').toString().trim();
        selectedVehicleMyComId =
            (vehicleData['mycomId'] ?? '').toString().trim();

        isVehicleSelected = true; // Vehicle selected
        checkIfAllSelected();

        print("new function called $selectedCompanyAndVehcileNameController");
        update();
      } else {
        // No vehicles found, set default label
        selectedCompanyAndVehcileName = 'Select your Vehicle';
        selectedCompanyAndVehcileNameController.text = 'Select your Vehicle';
        update();
      }
    } catch (e) {
      log("Error fetching user vehicles: $e");

      // In case of error, also set default label
      selectedCompanyAndVehcileName = 'Select your Vehicle';
      selectedCompanyAndVehcileNameController.text = 'Select your Vehicle';
      update();
    }
  }

  Future<void> fetchUserVehicles() async {
    try {
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId) // Use effective user ID
          .collection('Vehicles')
          .where("active", isEqualTo: true)
          .orderBy('vehicleNumber')
          .get();

      if (vehiclesSnapshot.docs.isNotEmpty) {
        List<String> vehicleNames = vehiclesSnapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          String vehicleNumber =
              (data['vehicleNumber'] ?? '').toString().trim();
          String companyName = (data['companyName'] ?? '').toString().trim();
          // String myCompany = (data['myCompany'] ?? '').toString().trim();

          // Combine vehicleNumber and companyName
          // return myCompany.isNotEmpty
          //     ? "$vehicleNumber ($companyName) ($myCompany)"
          //     : "$vehicleNumber ($companyName)";
          return "$vehicleNumber ($companyName)";
        }).toList();

        print('Vehicle Names with isSet true: $vehicleNames'); // Debugging line

        hasVehicles = true;
        allVehicleAndCompanyName = vehicleNames;
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

  void onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      filterselectedCompanyAndvehicle(query);
    });
  }

  void filterselectedCompanyAndvehicle(String query) {
    if (query.isEmpty) {
      filteredUserVehiclesList = List.from(userVehiclesList);
      filterSelectedCompanyAndvehicleName = List.from(allVehicleAndCompanyName);
    } else {
      final q = query.toLowerCase();
      filteredUserVehiclesList = userVehiclesList.where((v) {
        final dName = (v['displayName'] ?? '').toString().toLowerCase();
        final vNum = (v['vehicleNumber'] ?? '').toString().toLowerCase();
        return dName.contains(q) || vNum.contains(q);
      }).toList();

      filterSelectedCompanyAndvehicleName = filteredUserVehiclesList
          .map((v) => v['displayName'] as String)
          .toList();
    }
    update();
  }

//================================== Select Company and Vehicle ===============================
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
                        onSearchChanged(value);
                      },
                    ),
                  ),
                  Expanded(
                    child: Builder(
                      builder: (_) {
                        final listToUse = filteredUserVehiclesList.isNotEmpty
                            ? filteredUserVehiclesList
                            : userVehiclesList;

                        if (listToUse.isNotEmpty) {
                          return ListView.builder(
                            controller: scrollController,
                            itemCount: listToUse.length,
                            itemBuilder: (context, index) {
                              final vehicle = listToUse[index];
                              final String displayName =
                                  vehicle['displayName'] ?? '';
                              return ListTile(
                                title: Text(
                                  displayName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: appStyle(14, kDark, FontWeight.w500),
                                ),
                                onTap: () async {
                                  // 1. Show immediate small loading indicator
                                  showDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    barrierColor: Colors.black26,
                                    builder: (dialogCtx) => Center(
                                      child: Container(
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 24.w, vertical: 18.h),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius:
                                              BorderRadius.circular(16.r),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black26,
                                              blurRadius: 10,
                                              spreadRadius: 2,
                                            ),
                                          ],
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            SizedBox(
                                              width: 24.w,
                                              height: 24.w,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.8,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                        Color>(kPrimary),
                                              ),
                                            ),
                                            SizedBox(width: 14.w),
                                            Text(
                                              "Selecting vehicle...",
                                              style: appStyle(
                                                  14, kDark, FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );

                                  selectedVehicleId = vehicle['id'];
                                  selectedVehicleMyCompany =
                                      (vehicle['myCompany'] ?? '')
                                          .toString()
                                          .trim();
                                  selectedVehicleMyComId =
                                      (vehicle['mycomId'] ?? '')
                                          .toString()
                                          .trim();
                                  selectedCompanyAndVehcileName = displayName;
                                  selectedCompanyAndVehcileNameController.text =
                                      displayName;
                                  companyNameController.text =
                                      vehicle['companyName'] ?? '';
                                  isVehicleSelected = true;
                                  checkIfAllSelected();
                                  update();

                                  log("Selected vehicle ID: $selectedVehicleId, myCompany: $selectedVehicleMyCompany, mycomId: $selectedVehicleMyComId");

                                  // Fast atomic batch update in Firestore
                                  await updateVehicleSelection(displayName,
                                      vehicleDocId: vehicle['id']);

                                  // Close loading dialog & bottom sheet
                                  Navigator.of(context, rootNavigator: true)
                                      .pop();
                                  Navigator.pop(context);
                                },
                              );
                            },
                          );
                        }

                        filterSelectedCompanyAndvehicleName.sort((a, b) =>
                            a.toLowerCase().compareTo(b.toLowerCase()));
                        return ListView.builder(
                          controller: scrollController,
                          itemCount: filterSelectedCompanyAndvehicleName.length,
                          itemBuilder: (context, index) {
                            final name =
                                filterSelectedCompanyAndvehicleName[index];
                            return ListTile(
                              title: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: appStyle(14, kDark, FontWeight.w500),
                              ),
                              onTap: () async {
                                // 1. Show immediate small loading indicator
                                showDialog(
                                  context: context,
                                  barrierDismissible: false,
                                  barrierColor: Colors.black26,
                                  builder: (dialogCtx) => Center(
                                    child: Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 24.w, vertical: 18.h),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius:
                                            BorderRadius.circular(16.r),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black26,
                                            blurRadius: 10,
                                            spreadRadius: 2,
                                          ),
                                        ],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 24.w,
                                            height: 24.w,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.8,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                      kPrimary),
                                            ),
                                          ),
                                          SizedBox(width: 14.w),
                                          Text(
                                            "Selecting vehicle...",
                                            style: appStyle(
                                                14, kDark, FontWeight.w600),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );

                                selectedCompanyAndVehcileName = name;
                                selectedCompanyAndVehcileNameController.text =
                                    name;
                                isVehicleSelected = true;
                                checkIfAllSelected();
                                update();

                                log("New Selected Company $name ");

                                // Fast atomic batch update in Firestore
                                await updateVehicleSelection(name);

                                // Close loading dialog & bottom sheet
                                Navigator.of(context, rootNavigator: true)
                                    .pop();
                                Navigator.pop(context);
                              },
                            );
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

//================================== Update Vehicle Section =============================
  Future<void> updateVehicleSelection(String selectedVehicle,
      {String? vehicleDocId}) async {
    try {
      final vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('Vehicles');

      // 1. Fetch only vehicles that currently have isSet == true
      final currentSetSnapshot =
          await vehiclesRef.where('isSet', isEqualTo: true).get();

      final batch = FirebaseFirestore.instance.batch();

      // 2. Unset existing isSet true documents
      for (var doc in currentSetSnapshot.docs) {
        if (vehicleDocId != null && doc.id != vehicleDocId) {
          batch.update(doc.reference, {'isSet': false});
        } else if (vehicleDocId == null) {
          batch.update(doc.reference, {'isSet': false});
        }
      }

      // 3. Set the target vehicle isSet to true
      if (vehicleDocId != null && vehicleDocId.isNotEmpty) {
        batch.update(vehiclesRef.doc(vehicleDocId), {'isSet': true});
      } else {
        String cleanNum = selectedVehicle.contains('(')
            ? selectedVehicle.split('(').first.trim()
            : selectedVehicle.trim();

        final matchSnapshot = await vehiclesRef
            .where('vehicleNumber', isEqualTo: cleanNum)
            .limit(1)
            .get();

        if (matchSnapshot.docs.isNotEmpty) {
          batch.update(matchSnapshot.docs.first.reference, {'isSet': true});
          final vData = matchSnapshot.docs.first.data();
          selectedVehicleMyCompany =
              (vData['myCompany'] ?? '').toString().trim();
          selectedVehicleMyComId = (vData['mycomId'] ?? '').toString().trim();
        }
      }

      // 4. Commit all updates atomically in a single roundtrip
      await batch.commit();
      log("Vehicle selection updated successfully in atomic batch");
    } catch (e) {
      log("Error updating vehicle selection: $e");
    }
  }

//=============================== Image Uploader =====================================
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

//=============================== Image Previewer =====================================
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

      // ignore: unnecessary_null_comparison
      if (pickedFiles != null && pickedFiles.length <= 4) {
        images = pickedFiles.map((file) => File(file.path)).toList();
        imageSelected = images.isNotEmpty; // Update the boolean value
        update(); // Notify listeners
        // ignore: unnecessary_null_comparison
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

//=============================== Order Generation =====================================

  Future<void> findMechanic(
    String userId,
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

      final actualUserId = FirebaseAuth.instance.currentUser?.uid ?? userId;

      // Extract clean vehicle number
      String cleanVehicleNumber = vehicleNumber.contains('(')
          ? vehicleNumber.split('(').first.trim()
          : vehicleNumber.trim();

      String vehicleMyCompany = selectedVehicleMyCompany.trim();
      String vehicleMyComId = selectedVehicleMyComId.trim();

      // Priority 1: Fetch directly by selectedVehicleId
      if (selectedVehicleId != null && selectedVehicleId!.isNotEmpty) {
        try {
          DocumentSnapshot vDoc = await FirebaseFirestore.instance
              .collection('Users')
              .doc(_effectiveUserId)
              .collection('Vehicles')
              .doc(selectedVehicleId)
              .get();

          if (vDoc.exists) {
            final vData = vDoc.data() as Map<String, dynamic>;
            vehicleMyCompany = (vData['myCompany'] ?? '').toString().trim();
            vehicleMyComId = (vData['mycomId'] ?? '').toString().trim();
          }
        } catch (e) {
          log("Error fetching vehicle by selectedVehicleId in findMechanic: $e");
        }
      }

      // Priority 2: If still empty, search across vehicles list by vehicle number
      if (vehicleMyCompany.isEmpty && cleanVehicleNumber.isNotEmpty) {
        final List<String> targetUids = {
          _effectiveUserId,
          actualUserId,
          userId,
          if (ownerId.isNotEmpty) ownerId,
        }.where((id) => id.trim().isNotEmpty).toList();

        for (String targetUid in targetUids) {
          if (vehicleMyCompany.isNotEmpty) break;
          try {
            QuerySnapshot vSnap = await FirebaseFirestore.instance
                .collection('Users')
                .doc(targetUid)
                .collection('Vehicles')
                .get();

            for (var doc in vSnap.docs) {
              final vData = doc.data() as Map<String, dynamic>;
              final vNum = (vData['vehicleNumber'] ?? '').toString().trim();
              if (vNum.toLowerCase() == cleanVehicleNumber.toLowerCase() ||
                  vNum.toLowerCase() == vehicleNumber.trim().toLowerCase()) {
                vehicleMyCompany = (vData['myCompany'] ?? '').toString().trim();
                vehicleMyComId = (vData['mycomId'] ?? '').toString().trim();
                selectedVehicleId = doc.id;
                selectedVehicleMyCompany = vehicleMyCompany;
                selectedVehicleMyComId = vehicleMyComId;
                break;
              }
            }
          } catch (e) {
            log("Error fetching vehicle in findMechanic for uid $targetUid: $e");
          }
        }
      }

      // Prepare data for the job document
      var data = {
        'orderId': orderId.toString(),
        "cancelReason": "",
        "cancelBy": "",
        'userId': actualUserId,
        "userPhoto": userPhoto,
        'userName': name,
        'selectedService': selectedService,
        "companyName": companyName,
        "myCompany": vehicleMyCompany,
        "mycomId": vehicleMyComId,
        "description": descriptionController.text.toString(),
        "vehicleNumber": cleanVehicleNumber,
        'userPhoneNumber': phoneNumber,
        'userDeliveryAddress': address,
        'userLat': userLatitude,
        "isImageSelected": images.isNotEmpty ? true : isImageSelected,
        "fixPriceEnabled": fixPriceEnabled,
        "images": imageUrls,
        'userLong': userLongitude,
        'orderDate': DateTime.now(),
        "role": role.toString(),
        "ownerId": ownerId.toString(), // Use ownerId for tracking ownership
        "payMode": "",
        "status": 0,
        "rating": "4.3",
        "review": "",
        "reviewSubmitted": false,
        "mRating": "4.3",
        "mReview": "",
        "mReviewSubmitted": false,
        'nearByDistance': 5,
        'mechanicsOffer': [],
      };

      // Save order details to fleet owner's history subcollection
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(_effectiveUserId)
          .collection("history")
          .doc(orderId.toString())
          .set(data);

      // If creator is a team member/driver (actualUserId != _effectiveUserId), also save under driver's history
      if (actualUserId.isNotEmpty && actualUserId != _effectiveUserId) {
        await FirebaseFirestore.instance
            .collection("Users")
            .doc(actualUserId)
            .collection("history")
            .doc(orderId.toString())
            .set(data);
      }

      // Save order details to admin-accessible collection
      await FirebaseFirestore.instance
          .collection("jobs")
          .doc(orderId.toString())
          .set(data);

      showToast('Job created successfully');
      print('Order placed successfully! ${data}');
    } catch (e) {
      // Error handling
      print('Failed to place order: $e');
      showToastMessage("Error", "Failed to Submit request: $e", kRed);
    } finally {
      images.clear();
      isImageSelected = false;
      isImageMandatory = false;
      update();
      setLoading(false);
    }
  }

  //========================================= Location Section ==========================

  Future<void> checkIfLocationIsSet() async {
    try {
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId) // Use effective user ID
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
          .doc(_effectiveUserId) // Use effective user ID
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
    FirebaseFirestore.instance.collection('Users').doc(_effectiveUserId).set({
      'isLocationSet': true,
      'lastLocation': {
        'latitude': latitude,
        'longitude': longitude,
      },
      'lastAddress': userAddress,
    }, SetOptions(merge: true));

    FirebaseFirestore.instance
        .collection('Users')
        .doc(_effectiveUserId)
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
    if (isVehicleSelected && isServiceSelected) {
      isFindMechanicEnabled = true;
    } else {
      isFindMechanicEnabled = false;
    }
  }
}
