import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/manageTrips/trip_details.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ManageTripsScreen extends StatefulWidget {
  const ManageTripsScreen({super.key});

  @override
  _ManageTripsScreenState createState() => _ManageTripsScreenState();
}

class _ManageTripsScreenState extends State<ManageTripsScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final TextEditingController _tripNameController = TextEditingController();
  final TextEditingController _currentMilesController = TextEditingController();
  final TextEditingController _oEarningController = TextEditingController();
  String selectedTrip = '';
  String selectedType = 'Expenses';
  TextEditingController milesController = TextEditingController();
  TextEditingController amountController = TextEditingController();
  TextEditingController descriptionController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  DateTime? fromDate;
  DateTime? toDate;
  late StreamSubscription usersSubscription;
  late StreamSubscription vehiclesSubscription;
  final List<Map<String, dynamic>> vehicles = [];
  String? selectedVehicle;
  String perMileCharge = '0';
  String role = "";
  String ownerId = "";

  bool showAddTrip = false;
  bool showAddMileageOrExpense = false;
  bool showFilterByDate = false;
  bool showViewTrips = false;
  bool isLoading = false;

  File? _selectedImage;
  String _imageUrl = '';
  DateTime? selectedDate;

  // void addTrip() async {
  //   if (_tripNameController.text.isEmpty ||
  //       _currentMilesController.text.isEmpty) {
  //     showToastMessage("Error", "Please fill all required fields", kRed);
  //     return;
  //   }

  //   if (selectedDate == null) {
  //     showToastMessage("Error", "Please select a trip start date", kRed);
  //     return;
  //   }

  //   if (selectedVehicle == null) {
  //     showToastMessage("Error", "Please select a vehicle", kRed);
  //     return;
  //   }

  //   setState(() {
  //     isLoading = true;
  //   });

  //   try {
  //     // Get selected vehicle details from Firestore
  //     DocumentSnapshot vehicleSnapshot = await FirebaseFirestore.instance
  //         .collection("Users")
  //         .doc(currentUId)
  //         .collection("Vehicles")
  //         .doc(selectedVehicle)
  //         .get();

  //     if (!vehicleSnapshot.exists) {
  //       showToastMessage("Error", "Selected vehicle not found", kRed);
  //       setState(() {
  //         isLoading = false;
  //       });
  //       return;
  //     }

  //     Map<String, dynamic> selectedVehicleData =
  //         vehicleSnapshot.data() as Map<String, dynamic>;

  //     if (selectedVehicleData.containsKey('tripAssign') &&
  //         selectedVehicleData['tripAssign'] == true) {
  //       showToastMessage(
  //           "Error",
  //           "Your vehicle is already assigned. Please complete your ongoing ride.",
  //           kRed);
  //       setState(() {
  //         isLoading = false;
  //       });
  //       return;
  //     }

  //     String vehicleName = selectedVehicleData['companyName'] ?? "Unknown";
  //     String vehicleNumber = selectedVehicleData['vehicleNumber'] ?? "Unknown";

  //     // Generate docId for consistency
  //     String docId = FirebaseFirestore.instance.collection('trips').doc().id;

  //     final tripData = {
  //       'tripName': _tripNameController.text,
  //       'vehicleId': selectedVehicle,
  //       'currentUID': currentUId,
  //       'role': role,
  //       'companyName': vehicleName,
  //       'vehicleNumber': vehicleNumber,
  //       'totalMiles': 0,
  //       'tripStartMiles': int.parse(_currentMilesController.text),
  //       'tripEndMiles': 0,
  //       'currentMiles': int.parse(_currentMilesController.text),
  //       'previousMiles': int.parse(_currentMilesController.text),
  //       'milesArray': [
  //         {
  //           'mile': int.parse(_currentMilesController.text),
  //           'date': Timestamp.now(),
  //         }
  //       ],
  //       'isPaid': false,
  //       'tripStatus': 1,
  //       'tripStartDate': selectedDate,
  //       'tripEndDate': DateTime.now(),
  //       'createdAt': Timestamp.now(),
  //       'updatedAt': Timestamp.now(),
  //       'oEarnings': (role == "Owner" && _oEarningController.text.isNotEmpty)
  //           ? int.parse(_oEarningController.text)
  //           : 0,
  //     };

  //     WriteBatch batch = FirebaseFirestore.instance.batch();

  //     DocumentReference userTripRef = FirebaseFirestore.instance
  //         .collection("Users")
  //         .doc(currentUId)
  //         .collection('trips')
  //         .doc(docId);

  //     DocumentReference tripRef =
  //         FirebaseFirestore.instance.collection('trips').doc(docId);

  //     DocumentReference vehicleRef = FirebaseFirestore.instance
  //         .collection("Users")
  //         .doc(currentUId)
  //         .collection("Vehicles")
  //         .doc(selectedVehicle);

  //     // Update current user's vehicle
  //     batch.set(userTripRef, tripData);
  //     batch.set(tripRef, tripData);
  //     batch.update(vehicleRef, {'tripAssign': true});

  //     // **Find and update assigned drivers' vehicles**
  //     QuerySnapshot driverDocs = await FirebaseFirestore.instance
  //         .collection("Users")
  //         .where("createdBy", isEqualTo: ownerId)
  //         .where("isDriver", isEqualTo: true)
  //         .where("isTeamMember", isEqualTo: true)
  //         .get();

  //     for (var driverDoc in driverDocs.docs) {
  //       String driverId = driverDoc.id;

  //       DocumentReference driverVehicleRef = FirebaseFirestore.instance
  //           .collection("Users")
  //           .doc(driverId)
  //           .collection("Vehicles")
  //           .doc(selectedVehicle);

  //       batch.update(driverVehicleRef, {'tripAssign': true});
  //     }

  //     // **If driver creates a trip, update owner's vehicle**
  //     if (role == "Driver") {
  //       DocumentReference ownerVehicleRef = FirebaseFirestore.instance
  //           .collection("Users")
  //           .doc(ownerId)
  //           .collection("Vehicles")
  //           .doc(selectedVehicle);

  //       batch.update(ownerVehicleRef, {'tripAssign': true});
  //     }

  //     await batch.commit();

  //     showToastMessage("Success", "Trip added successfully", kSecondary);

  //     _tripNameController.clear();
  //     _currentMilesController.clear();
  //     _oEarningController.clear();

  //     setState(() {
  //       selectedDate = null;
  //     });
  //   } catch (e) {
  //     showToastMessage("Error", e.toString(), kRed);
  //   } finally {
  //     setState(() {
  //       isLoading = false;
  //     });
  //   }
  // }

  void addTrip() async {
    if (_tripNameController.text.isEmpty ||
        _currentMilesController.text.isEmpty) {
      showToastMessage("Error", "Please fill all required fields", kRed);
      return;
    }

    if (selectedDate == null) {
      showToastMessage("Error", "Please select a trip start date", kRed);
      return;
    }

    if (selectedVehicle == null) {
      showToastMessage("Error", "Please select a vehicle", kRed);
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      // Get selected vehicle details from Firestore
      DocumentSnapshot vehicleSnapshot = await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection("Vehicles")
          .doc(selectedVehicle)
          .get();

      if (!vehicleSnapshot.exists) {
        showToastMessage("Error", "Selected vehicle not found", kRed);
        setState(() {
          isLoading = false;
        });
        return;
      }

      Map<String, dynamic> selectedVehicleData =
          vehicleSnapshot.data() as Map<String, dynamic>;

      if (selectedVehicleData.containsKey('tripAssign') &&
          selectedVehicleData['tripAssign'] == true) {
        showToastMessage(
            "Error",
            "Your vehicle is already assigned. Please complete your ongoing ride.",
            kRed);
        setState(() {
          isLoading = false;
        });
        return;
      }

      String vehicleName = selectedVehicleData['companyName'] ?? "Unknown";
      String vehicleNumber = selectedVehicleData['vehicleNumber'] ?? "Unknown";

      // Generate docId for consistency
      String docId = FirebaseFirestore.instance.collection('trips').doc().id;

      final tripData = {
        'tripName': _tripNameController.text,
        'vehicleId': selectedVehicle,
        'currentUID': currentUId,
        'role': role,
        'companyName': vehicleName,
        'vehicleNumber': vehicleNumber,
        'totalMiles': 0,
        'tripStartMiles': int.parse(_currentMilesController.text),
        'tripEndMiles': 0,
        'currentMiles': int.parse(_currentMilesController.text),
        'previousMiles': int.parse(_currentMilesController.text),
        'milesArray': [
          {
            'mile': int.parse(_currentMilesController.text),
            'date': Timestamp.now(),
          }
        ],
        'isPaid': false,
        'tripStatus': 1,
        'tripStartDate': selectedDate,
        'tripEndDate': DateTime.now(),
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
        'oEarnings': (role == "Owner" && _oEarningController.text.isNotEmpty)
            ? int.parse(_oEarningController.text)
            : 0,
      };

      WriteBatch batch = FirebaseFirestore.instance.batch();

      DocumentReference userTripRef = FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection('trips')
          .doc(docId);

      DocumentReference tripRef =
          FirebaseFirestore.instance.collection('trips').doc(docId);

      DocumentReference vehicleRef = FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection("Vehicles")
          .doc(selectedVehicle);

      // Update current user's vehicle and create trip
      batch.set(userTripRef, tripData);
      batch.set(tripRef, tripData);
      batch.update(vehicleRef, {'tripAssign': true});

      // **Find and update assigned drivers' vehicles - only if they have the vehicle**
      if (role == "Owner") {
        QuerySnapshot driverDocs = await FirebaseFirestore.instance
            .collection("Users")
            .where("createdBy", isEqualTo: ownerId)
            .where("isDriver", isEqualTo: true)
            .where("isTeamMember", isEqualTo: true)
            .get();

        for (var driverDoc in driverDocs.docs) {
          String driverId = driverDoc.id;

          // Check if driver has this vehicle before trying to update
          DocumentReference driverVehicleRef = FirebaseFirestore.instance
              .collection("Users")
              .doc(driverId)
              .collection("Vehicles")
              .doc(selectedVehicle);

          // First check if the vehicle exists for this driver
          DocumentSnapshot driverVehicleSnapshot = await driverVehicleRef.get();

          if (driverVehicleSnapshot.exists) {
            // Only update if the vehicle exists for this driver
            batch.update(driverVehicleRef, {'tripAssign': true});

            // Also create the trip in the driver's trips collection
            DocumentReference driverTripRef = FirebaseFirestore.instance
                .collection("Users")
                .doc(driverId)
                .collection('trips')
                .doc(docId);

            batch.set(driverTripRef, tripData);
          }
        }
      }

      // **If driver creates a trip, update owner's vehicle if it exists**
      if (role == "Driver") {
        DocumentReference ownerVehicleRef = FirebaseFirestore.instance
            .collection("Users")
            .doc(ownerId)
            .collection("Vehicles")
            .doc(selectedVehicle);

        // First check if the owner has this vehicle
        DocumentSnapshot ownerVehicleSnapshot = await ownerVehicleRef.get();

        if (ownerVehicleSnapshot.exists) {
          batch.update(ownerVehicleRef, {'tripAssign': true});

          // Also create the trip in the owner's trips collection
          DocumentReference ownerTripRef = FirebaseFirestore.instance
              .collection("Users")
              .doc(ownerId)
              .collection('trips')
              .doc(docId);

          batch.set(ownerTripRef, tripData);
        }
      }

      await batch.commit();

      showToastMessage("Success", "Trip added successfully", kSecondary);

      _tripNameController.clear();
      _currentMilesController.clear();
      _oEarningController.clear();

      setState(() {
        selectedDate = null;
        selectedVehicle = null;
      });
    } catch (e) {
      showToastMessage("Error", e.toString(), kRed);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

// Function to pick an image
  Future<void> pickImage() async {
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

// Function to upload image to Firebase Storage
  Future<String> uploadImage(File image) async {
    String fileName =
        "trip_images/${DateTime.now().millisecondsSinceEpoch}.jpg";
    Reference ref = FirebaseStorage.instance.ref().child(fileName);
    UploadTask uploadTask = ref.putFile(image);
    TaskSnapshot taskSnapshot = await uploadTask;
    return await taskSnapshot.ref.getDownloadURL();
  }

// Function to add Mileage or Expense
  void addMileageOrExpense() async {
    setState(() {
      isLoading = true;
    });
    try {
      if (selectedTrip.isEmpty) {
        showToastMessage("Error", "Please select a trip first.", kRed);
        return;
      }

      DocumentReference tripRef = FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection('trips')
          .doc(selectedTrip);

      DocumentSnapshot tripSnapshot = await tripRef.get();

      if (!tripSnapshot.exists) {
        showToastMessage("Error", "Trip not found.", kRed);
        return;
      }

      // Upload image if selected
      if (_selectedImage != null) {
        _imageUrl = await uploadImage(_selectedImage!);
      }

      if (selectedType == 'Miles' && milesController.text.isNotEmpty) {
        int newMiles = int.parse(milesController.text);
        int previousMiles =
            tripSnapshot['currentMiles'] ?? 0; // Get the last saved miles

        // Check if new miles entry is less than previous
        if (newMiles < previousMiles) {
          showToastMessage(
              "Error", "New miles cannot be less than previous miles.", kRed);
          return;
        }

        // Fetch the existing milesArray
        List<dynamic> milesArray = tripSnapshot['milesArray'] ?? [];

        // Append new entry to milesArray
        milesArray.add({
          'mile': newMiles,
          'date': Timestamp.now(),
        });

        // Update Firestore document
        await tripRef.update({
          'previousMiles': previousMiles, // Move currentMiles to previousMiles
          'currentMiles': newMiles, // Update currentMiles with new value
          'milesArray': milesArray, // Save the updated miles array
          'updatedAt': Timestamp.now(),
        });

        showToastMessage("Success", "Miles added successfully!", kSecondary);

        // Reset fields
        setState(() {
          milesController.clear();
          isLoading = false;
        });
      } else if (selectedType == 'Expenses' &&
          amountController.text.isNotEmpty) {
        final expensesData = {
          'tripId': selectedTrip,
          'type': 'Expenses',
          'amount': double.parse(amountController.text),
          'description': descriptionController.text,
          'imageUrl': _imageUrl, // Store image URL if available
          'createdAt': Timestamp.now(),
        };
        await FirebaseFirestore.instance
            .collection("Users")
            .doc(currentUId)
            .collection("trips")
            .doc(selectedTrip)
            .collection('tripDetails')
            .add(expensesData);

        await FirebaseFirestore.instance
            .collection('trips')
            .doc(selectedTrip)
            .collection('tripDetails')
            .add(expensesData);

        showToastMessage("Success", "Expense added successfully!", kSecondary);
      }

      // Reset after adding
      setState(() {
        _selectedImage = null;
        _imageUrl = '';
        isLoading = false;
        amountController.clear();
        descriptionController.clear();
      });
    } catch (e) {
      showToastMessage("Error", e.toString(), kRed);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  void initializeStreams() {
    usersSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final userData = snapshot.data();
        if (userData != null) {
          setState(() {
            perMileCharge = userData['perMileCharge'];
            role = userData['role'];
            ownerId = userData['createdBy'];
          });
        }
      }
    });

    // Setup vehicle stream
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection("Vehicles")
        .where("active", isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        debugPrint('No vehicles found for user');
        return;
      }

      setState(() {
        vehicles.clear();
        vehicles
            .addAll(snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
    });
  }

  Future<void> _pickDateRange() async {
    DateTime now = DateTime.now();
    DateTime firstDate = DateTime(now.year - 5);
    DateTime lastDate = DateTime(now.year + 1);

    DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: firstDate,
      lastDate: lastDate,
      initialDateRange: fromDate != null && toDate != null
          ? DateTimeRange(start: fromDate!, end: toDate!)
          : null,
    );

    if (picked != null) {
      setState(() {
        fromDate = picked.start;
        toDate = picked.end;
      });
    }
  }

  Future<Map<String, double>> calculateTotals(List<QueryDocumentSnapshot> trips,
      String perMileCharge, String driverId, String role) async {
    double totalExpenses = 0;
    double totalEarnings = 0;
    String userId = driverId;
    double perMile = double.tryParse(perMileCharge) ?? 0.0;

    for (var trip in trips) {
      // Calculate expenses from tripDetails
      var expensesSnapshot = await FirebaseFirestore.instance
          .collection("Users")
          .doc(userId)
          .collection('trips')
          .doc(trip.id)
          .collection('tripDetails')
          .where('type', isEqualTo: 'Expenses')
          .get();

      double tripExpenses = expensesSnapshot.docs
          .fold(0.0, (sum, doc) => sum + (doc['amount'] ?? 0.0));
      totalExpenses += tripExpenses;

      // Calculate earnings based on role
      if (role == "Driver") {
        int startMiles = trip['tripStartMiles'];
        int endMiles = trip['tripEndMiles'];
        int miles = endMiles - startMiles;
        totalEarnings += miles * perMile;
      } else if (role == "Owner") {
        // Sum all oEarnings values
        double ownerEarnings = (trip['oEarnings'] ?? 0.0).toDouble();
        totalEarnings += ownerEarnings;
      }
    }

    // If any value is negative, set it to 0
    totalExpenses = totalExpenses < 0 ? 0 : totalExpenses;
    totalEarnings = totalEarnings < 0 ? 0 : totalEarnings;

    return {'expenses': totalExpenses, 'earnings': totalEarnings};
  }

  @override
  void initState() {
    super.initState();
    initializeStreams();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Manage Trips",
            style: appStyle(18, kWhite, FontWeight.normal)),
        iconTheme: const IconThemeData(color: kWhite),
        elevation: 1,
        backgroundColor: kPrimary,
      ),
      body: SingleChildScrollView(
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 10.h),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search by Trip Name or Vehicle Number',
                        prefixIcon: Icon(Icons.search),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(Icons.clear),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {}); // Trigger rebuild
                                },
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {});
                      },
                    ),
                  ),
                  SizedBox(height: 10.h),

                  // Add Trip and add mileage or expense
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        buildCustomRowButton(Icons.add, "Add Trip", kSecondary,
                            () {
                          setState(() {
                            showAddTrip = !showAddTrip;
                            showAddMileageOrExpense = false;
                            showViewTrips = false;
                          });
                        }),
                        buildCustomRowButton(
                            Icons.add, "Add Expenses", kPrimary, () {
                          setState(() {
                            showAddTrip = false;
                            showAddMileageOrExpense = !showAddMileageOrExpense;
                            showViewTrips = false;
                          });
                        }),
                      ],
                    ),
                  ),

                  if (showAddTrip) ...[
                    SizedBox(height: 20.h),
                    Card(
                      elevation: 4,
                      child: Padding(
                        padding: EdgeInsets.all(8.0.w),
                        child: Column(
                          children: [
                            SizedBox(
                              height: 40.h,
                              child: TextField(
                                controller: _tripNameController,
                                decoration: const InputDecoration(
                                  labelText: 'Trip Name',
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.text,
                              ),
                            ),
                            SizedBox(height: 10.h),
                            SizedBox(
                              height: 40.h,
                              child: TextField(
                                controller: _currentMilesController,
                                decoration: const InputDecoration(
                                  labelText: 'Current Miles',
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            SizedBox(height: 10.h),
                            role == "Owner"
                                ? SizedBox(
                                    height: 40.h,
                                    child: TextField(
                                      controller: _oEarningController,
                                      decoration: const InputDecoration(
                                        labelText: 'Load Price',
                                        border: OutlineInputBorder(),
                                      ),
                                      keyboardType: TextInputType.number,
                                    ),
                                  )
                                : SizedBox(),
                            role == "Owner"
                                ? SizedBox(height: 10.h)
                                : SizedBox(),
                            InkWell(
                              onTap: () async {
                                final DateTime? picked = await showDatePicker(
                                  context: context,
                                  initialDate: selectedDate ?? DateTime.now(),
                                  firstDate: DateTime(2000),
                                  lastDate: DateTime(2100),
                                );
                                if (picked != null) {
                                  setState(() {
                                    selectedDate = picked;
                                  });
                                }
                              },
                              child: SizedBox(
                                height: 55.h,
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Date',
                                    border: OutlineInputBorder(),
                                  ),
                                  child: Text(
                                    selectedDate != null
                                        ? selectedDate!
                                            .toLocal()
                                            .toString()
                                            .split(' ')[0]
                                        : 'Select Trip Start Date',
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(height: 10.h),
                            // Vehicle Dropdown
                            DropdownButtonFormField<String>(
                              value: selectedVehicle,
                              hint: const Text('Select Vehicle'),
                              items: vehicles.map((vehicle) {
                                return DropdownMenuItem<String>(
                                  value: vehicle['id'],
                                  child: Text(
                                    '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                    style: appStyleUniverse(
                                        17, kDark, FontWeight.normal),
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedVehicle = value;
                                });
                              },
                            ),

                            SizedBox(height: 10.h),

                            CustomButton(
                              text: "Add Trip",
                              onPress: addTrip,
                              color: kPrimary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  if (showAddMileageOrExpense) ...[
                    SizedBox(height: 20.h),
                    Card(
                      elevation: 4,
                      child: Padding(
                        padding: EdgeInsets.all(8.0.w),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                //trip drop-down
                                StreamBuilder<QuerySnapshot>(
                                  stream: FirebaseFirestore.instance
                                      .collection("Users")
                                      .doc(currentUId)
                                      .collection('trips')
                                      .snapshots(),
                                  builder: (context, snapshot) {
                                    if (!snapshot.hasData ||
                                        snapshot.data!.docs.isEmpty) {
                                      return Center(
                                          child: Text(
                                              "Please add a trip first.",
                                              style: TextStyle(color: kRed)));
                                    }

                                    List<DropdownMenuItem<String>> tripItems =
                                        snapshot.data!.docs.map((doc) {
                                      return DropdownMenuItem<String>(
                                        value: doc.id,
                                        child: Text(doc['tripName']),
                                      );
                                    }).toList();

                                    return DropdownButton<String>(
                                      value: selectedTrip.isNotEmpty
                                          ? selectedTrip
                                          : null,
                                      hint: Text("Select Trip"),
                                      items: tripItems,
                                      onChanged: (value) {
                                        setState(() {
                                          selectedTrip = value!;
                                        });
                                      },
                                    );
                                  },
                                ),
                                Spacer(),
                                // expense type drop-down
                                DropdownButton<String>(
                                  value: selectedType,
                                  items: ['Expenses']
                                      .map((e) => DropdownMenuItem(
                                          value: e, child: Text(e)))
                                      .toList(),
                                  onChanged: (value) {
                                    setState(() => selectedType = value!);
                                  },
                                ),
                              ],
                            ),
                            SizedBox(height: 10.h),
                            SizedBox(
                              height: 40.h,
                              child: TextField(
                                controller: amountController,
                                decoration: const InputDecoration(
                                  labelText: 'Enter Amount',
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            SizedBox(height: 10.h),
                            TextField(
                              controller: descriptionController,
                              maxLines: 2,
                              decoration: const InputDecoration(
                                labelText: 'Description',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.text,
                            ),
                            SizedBox(height: 10.h),
                            _selectedImage != null
                                ? Image.file(
                                    _selectedImage!,
                                    height: 100.h,
                                    // width: 100.w,
                                  )
                                : const SizedBox(),
                            SizedBox(height: 10.h),
                            Row(
                              children: [
//select Image
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: pickImage,
                                    icon: const Icon(Icons.add_photo_alternate,
                                        color: Colors.white),
                                    label: const Text(
                                      'Upload Image',
                                      style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: kSecondary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),

                                CustomButton(
                                    height: 30.h,
                                    width: 100.w,
                                    text: "Add Entry ",
                                    onPress: () => addMileageOrExpense(),
                                    color: kPrimary),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  SizedBox(height: 20.h),

                  // Add this above the StreamBuilder
                  Padding(
                    padding: const EdgeInsets.only(left: 12.0, right: 12.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Trips",
                            style: appStyle(18, kDark, FontWeight.w500)),
                        IconButton(
                          icon: Icon(Icons.filter_list, color: kPrimary),
                          onPressed: _pickDateRange,
                        ),
                        if (fromDate != null && toDate != null)
                          Text(
                            "${DateFormat('dd MMM yyyy').format(fromDate!)} - ${DateFormat('dd MMM yyyy').format(toDate!)}",
                            style: appStyle(14, kDark, FontWeight.w500),
                          ),
                      ],
                    ),
                  ),

                  StreamBuilder(
                    stream: FirebaseFirestore.instance
                        .collection("Users")
                        .doc(currentUId)
                        .collection('trips')
                        .orderBy("createdAt", descending: true)
                        .snapshots(),
                    builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                      if (!snapshot.hasData) {
                        return const CircularProgressIndicator();
                      }

                      // var filteredTrips = snapshot.data!.docs.where((doc) {
                      //   DateTime tripStartDate = doc['tripStartDate'].toDate();
                      //   DateTime tripEndDate = doc['tripEndDate'].toDate();

                      //   // ✅ Show trips **only if** they overlap the selected range correctly
                      //   return (fromDate == null ||
                      //           tripEndDate.isAfter(fromDate!
                      //               .subtract(const Duration(days: 1)))) &&
                      //       (toDate == null ||
                      //           tripStartDate.isBefore(
                      //                   toDate!.add(const Duration(days: 1))) &&
                      //               tripEndDate.isAfter(toDate!
                      //                   .subtract(const Duration(days: 1))));
                      // }).toList();
                      var filteredTrips = snapshot.data!.docs.where((doc) {
                        // Date range filtering
                        DateTime tripStartDate = doc['tripStartDate'].toDate();
                        DateTime tripEndDate = doc['tripEndDate'].toDate();

                        bool dateInRange = (fromDate == null ||
                                tripEndDate.isAfter(fromDate!
                                    .subtract(const Duration(days: 1)))) &&
                            (toDate == null ||
                                tripStartDate.isBefore(
                                        toDate!.add(const Duration(days: 1))) &&
                                    tripEndDate.isAfter(toDate!
                                        .subtract(const Duration(days: 1))));

                        // Search filtering
                        String searchTerm =
                            _searchController.text.toLowerCase();
                        bool matchesSearch = searchTerm.isEmpty ||
                            doc['tripName']
                                .toString()
                                .toLowerCase()
                                .contains(searchTerm) ||
                            doc['vehicleNumber']
                                .toString()
                                .toLowerCase()
                                .contains(searchTerm);

                        return dateInRange && matchesSearch;
                      }).toList();

                      if (filteredTrips.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 20),
                          child: Center(
                            child: Text(
                              _searchController.text.isEmpty
                                  ? "No trips found"
                                  : "No trips match your search",
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red),
                            ),
                          ),
                        );
                      }

                      return Column(
                        children: [
                          FutureBuilder<Map<String, double>>(
                            future: calculateTotals(
                                filteredTrips, perMileCharge, currentUId, role),
                            builder: (context, totalsSnapshot) {
                              if (totalsSnapshot.connectionState ==
                                  ConnectionState.waiting) {
                                return Padding(
                                  padding: EdgeInsets.symmetric(vertical: 10.h),
                                  child: Center(
                                      child: CircularProgressIndicator()),
                                );
                              }
                              if (totalsSnapshot.hasError) {
                                return Text('Error calculating totals');
                              }
                              var totals = totalsSnapshot.data ??
                                  {'expenses': 0.0, 'earnings': 0.0};
                              return Padding(
                                padding: EdgeInsets.symmetric(
                                    vertical: 10.h, horizontal: 12.w),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 10.w, vertical: 10.h),
                                      decoration: BoxDecoration(
                                          color: kPrimary.withOpacity(0.8),
                                          borderRadius:
                                              BorderRadius.circular(10)),
                                      child: Column(
                                        children: [
                                          Text(
                                            'Total Expenses',
                                            style: appStyle(
                                                16, kWhite, FontWeight.w500),
                                          ),
                                          Text(
                                            "\$${totals['expenses']!.truncateToDouble() == totals['expenses'] ? totals['expenses']!.toInt() : totals['expenses']}",
                                            style: appStyle(
                                                15, kWhite, FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 10.w, vertical: 10.h),
                                      decoration: BoxDecoration(
                                          color: kSecondary.withOpacity(0.8),
                                          borderRadius:
                                              BorderRadius.circular(10)),
                                      child: Column(
                                        children: [
                                          Text(
                                            getTitleForRole(role),
                                            style: appStyle(
                                                16, kWhite, FontWeight.w500),
                                          ),
                                          Text(
                                              "\$${totals['earnings']!.truncateToDouble() == totals['earnings'] ? totals['earnings']!.toInt() : totals['earnings']}",
                                              style: appStyle(15, kWhite,
                                                  FontWeight.normal))
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                          ListView(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: filteredTrips.map((doc) {
                              String formattedStartDate =
                                  DateFormat('dd MMM yyyy')
                                      .format(doc['tripStartDate'].toDate());
                              String formattedEndDate =
                                  DateFormat('dd MMM yyyy')
                                      .format(doc['tripEndDate'].toDate());
                              bool isPaid = doc['isPaid'];
                              String tripStatus =
                                  getStringFromTripStatus(doc['tripStatus']);
                              num tripStartMiles = doc['tripStartMiles'];
                              num tripEndMiles = doc['tripEndMiles'];
                              num totalMiles =
                                  doc['tripEndMiles'] - doc['tripStartMiles'];
                              num perMileCharges = role == "Owner"
                                  ? 0
                                  : num.parse(perMileCharge);
                              num earnings = totalMiles * perMileCharges;

                              num oEarnings = doc['oEarnings'];
                              String vehicleID = doc['vehicleId'];
                              String vehicleNumber = doc['vehicleNumber'];
                              String companyName = doc['companyName'];

                              return FutureBuilder<QuerySnapshot>(
                                future: FirebaseFirestore.instance
                                    .collection("Users")
                                    .doc(currentUId)
                                    .collection('trips')
                                    .doc(doc.id)
                                    .collection('tripDetails')
                                    .where('tripId',
                                        isEqualTo: doc.id) // ✅ Match tripId
                                    .get(),
                                builder: (context, snapshot) {
                                  if (snapshot.connectionState ==
                                      ConnectionState.waiting) {
                                    return Container(); // Prevents flickering UI while loading
                                  }

                                  // ✅ If tripDetails subcollection doesn't exist or is empty, hide "Total Expenses"
                                  if (!snapshot.hasData ||
                                      snapshot.data == null ||
                                      snapshot.data!.docs.isEmpty) {
                                    return buildTripCard(
                                      doc,
                                      formattedStartDate,
                                      tripStartMiles,
                                      tripStatus,
                                      formattedEndDate,
                                      tripEndMiles,
                                      totalMiles,
                                      earnings,
                                      isPaid,
                                      0,
                                      context,
                                      role,
                                      oEarnings,
                                      vehicleID,
                                      vehicleNumber,
                                      companyName,
                                    );
                                  }

                                  // ✅ Sum all "amount" values ONLY if tripId matches
                                  num totalExpenses = snapshot.data!.docs.fold(
                                    0,
                                    (sum, item) => sum + (item['amount'] ?? 0),
                                  );

                                  return buildTripCard(
                                    doc,
                                    formattedStartDate,
                                    tripStartMiles,
                                    tripStatus,
                                    formattedEndDate,
                                    tripEndMiles,
                                    totalMiles,
                                    earnings,
                                    isPaid,
                                    totalExpenses,
                                    // Show total expenses if exists
                                    context,
                                    role,
                                    oEarnings,
                                    vehicleID, vehicleNumber,
                                    companyName,
                                  );
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
      ),
    );
  }

  String getTitleForRole(String role) {
    if (role == "Owner" || role == "Manager") {
      return 'Total Loads';
    } else {
      return 'Total Earnings';
    }
  }

  GestureDetector buildTripCard(
    QueryDocumentSnapshot<Object?> doc,
    String formattedStartDate,
    num tripStartMiles,
    String tripStatus,
    String formattedEndDate,
    num tripEndMiles,
    num totalMiles,
    num earnings,
    bool isPaid,
    num totalExpenses,
    BuildContext context,
    String role,
    num oEarnings,
    String vehicleID,
    String vehicleNumber,
    String companyName,
  ) {
    return GestureDetector(
      // onTap: () => Get.to(() => TripDetailsScreen(
      //       docId: doc.id,
      //       userId: currentUId,
      //       tripName: doc['tripName'],
      //     )),
      child: Container(
        padding: EdgeInsets.all(5.w),
        margin: EdgeInsets.all(5.w),
        decoration: BoxDecoration(
          color: kWhite,
          borderRadius: BorderRadius.circular(10.r),
          border: Border.all(color: kPrimary),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Center(
              child: Text(doc['tripName'],
                  style: appStyle(16, kDark, FontWeight.w500)),
            ),
            SizedBox(height: 10.h),
            Row(
              children: [
                Text("${vehicleNumber} (${companyName})",
                    textAlign: TextAlign.left,
                    style: appStyle(14, kPrimary, FontWeight.w500)),
                Container(),
              ],
            ),
            SizedBox(height: 10.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Start Date: $formattedStartDate"),
                Text("Start Miles: $tripStartMiles"),
              ],
            ),
            SizedBox(height: 4.h),
            if (tripStatus == "Completed") ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "End Date: $formattedEndDate",
                  ),
                  Text("End Miles: $tripEndMiles"),
                ],
              ),
              SizedBox(height: 4.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  role == "Owner"
                      ? Text("Load Price: \$${oEarnings}",
                          style: appStyle(15, kSecondary, FontWeight.w500))
                      : Text("Earnings: \$${earnings}",
                          style: appStyle(15, kSecondary, FontWeight.w500)),
                  Text("Trip Miles: $totalMiles"),
                ],
              ),
              SizedBox(height: 4.h),
              role == "Owner"
                  ? SizedBox()
                  : Row(
                      children: [
                        Text("Payment Status: "),
                        Spacer(),
                        isPaid
                            ? Text("Paid",
                                style:
                                    appStyle(16, kSecondary, FontWeight.w500))
                            : Text("Unpaid",
                                style: appStyle(16, kRed, FontWeight.w500))
                      ],
                    ),
            ],
            SizedBox(height: 4.h),
            Row(
              // mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Expenses:",
                    style: appStyle(15, kPrimary, FontWeight.w500)),
                SizedBox(width: 5.w),
                Text("\$${totalExpenses}",
                    style: appStyle(15, kPrimary, FontWeight.w500)),
              ],
            ),
            SizedBox(height: 4.h),
            Row(
              // mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Trip Status: "),
                SizedBox(width: 5.w),
                if (tripStatus != 'Completed') ...[
                  DropdownButton<String>(
                    value: tripStatus,
                    items: ['Started', 'Completed']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (value) async {
                      if (value != null) {
                        int newStatus = getIntFromTripStatus(value);

                        if (value == 'Completed') {
                          String? currentMilesStr = await showDialog<String>(
                            context: context,
                            builder: (BuildContext context) {
                              TextEditingController milesController =
                                  TextEditingController();
                              return AlertDialog(
                                title: Text('Enter Trip End Miles'),
                                content: TextField(
                                  controller: milesController,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                      labelText: 'Current Miles'),
                                ),
                                actions: <Widget>[
                                  TextButton(
                                    child: Text('Cancel'),
                                    onPressed: () {
                                      Navigator.of(context).pop();
                                    },
                                  ),
                                  TextButton(
                                    child: Text('Submit'),
                                    onPressed: () {
                                      Navigator.of(context)
                                          .pop(milesController.text);
                                    },
                                  ),
                                ],
                              );
                            },
                          );
                          if (currentMilesStr != null &&
                              currentMilesStr.isNotEmpty) {
                            int currentMiles =
                                int.tryParse(currentMilesStr) ?? 0;

                            // if (currentMiles <= tripStartMiles) {
                            //   showToastMessage(
                            //       "Warning",
                            //       "End miles must be greater than start miles.",
                            //       kRed);
                            //   return; // Stop the status change
                            // }

                            WriteBatch batch =
                                FirebaseFirestore.instance.batch();

                            // **Update the current user's trip**
                            DocumentReference userTripRef = FirebaseFirestore
                                .instance
                                .collection("Users")
                                .doc(currentUId)
                                .collection('trips')
                                .doc(doc.id);

                            batch.update(userTripRef, {
                              'tripStatus': newStatus,
                              'tripEndMiles': currentMiles,
                              'tripEndDate': Timestamp.now(),
                              'updatedAt': Timestamp.now(),
                            });

                            // **Update the global trips collection**
                            DocumentReference globalTripRef = FirebaseFirestore
                                .instance
                                .collection('trips')
                                .doc(doc.id);

                            batch.update(globalTripRef, {
                              'tripStatus': newStatus,
                              'tripEndMiles': currentMiles,
                              'tripEndDate': Timestamp.now(),
                              'updatedAt': Timestamp.now(),
                            });

                            // **Update the current user's vehicle to remove trip assignment**
                            DocumentReference currentUserVehicleRef =
                                FirebaseFirestore.instance
                                    .collection("Users")
                                    .doc(currentUId)
                                    .collection("Vehicles")
                                    .doc(vehicleID);

                            batch.update(
                                currentUserVehicleRef, {'tripAssign': false});

                            // **Find and update all assigned drivers' vehicles**
                            QuerySnapshot driverDocs = await FirebaseFirestore
                                .instance
                                .collection("Users")
                                .where("createdBy", isEqualTo: ownerId)
                                .where("isDriver", isEqualTo: true)
                                .where("isTeamMember", isEqualTo: true)
                                .get();

                            for (var driverDoc in driverDocs.docs) {
                              String driverId = driverDoc.id;

                              DocumentReference driverVehicleRef =
                                  FirebaseFirestore.instance
                                      .collection("Users")
                                      .doc(driverId)
                                      .collection("Vehicles")
                                      .doc(vehicleID);

                              batch.update(
                                  driverVehicleRef, {'tripAssign': false});
                            }

                            // **If the current user is a driver, update the owner's vehicle**
                            if (role == "Driver") {
                              DocumentReference ownerVehicleRef =
                                  FirebaseFirestore.instance
                                      .collection("Users")
                                      .doc(ownerId)
                                      .collection("Vehicles")
                                      .doc(vehicleID);

                              batch.update(
                                  ownerVehicleRef, {'tripAssign': false});
                            }

                            await batch.commit();
                          } else {
                            showToastMessage(
                                "Warning", "Please enter current miles.", kRed);
                            return;
                          }
                        } else {
                          FirebaseFirestore.instance
                              .collection("Users")
                              .doc(currentUId)
                              .collection('trips')
                              .doc(doc.id)
                              .update({
                            'tripStatus': newStatus,
                            'updatedAt': Timestamp.now(),
                          });
                        }
                      }
                    },
                  ),
                ] else ...[
                  Text(
                    "Completed",
                    style: appStyle(16, kSecondary, FontWeight.w500),
                  ),
                ],
                Spacer(),
              ],
            ),
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (tripStatus != "Completed") ...[
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        foregroundColor: kWhite,
                        elevation: 0,
                        minimumSize: Size(70.w, 35.h)),
                    onPressed: () {
                      showEditTripDialog(context, doc.id,
                          doc['tripStartDate'].toDate(), doc['tripStartMiles']);
                    },
                    child: Text("Edit Trip"),
                  ),
                ],
                SizedBox(width: 5.w),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: kSecondary,
                      foregroundColor: kWhite,
                      elevation: 0,
                      minimumSize: Size(70.w, 35.h)),
                  onPressed: () {
                    log("Doc ID  " + doc.id);
                    Get.to(() => TripDetailsScreen(
                          docId: doc.id,
                          userId: currentUId,
                          tripName: doc['tripName'],
                        ));
                  },
                  child: Text("View"),
                )
              ],
            ),
          ],
        ),
      ),
    );
  }

  void showEditTripDialog(BuildContext context, String tripId,
      DateTime currentStartDate, num currentStartMiles) {
    TextEditingController startMilesController =
        TextEditingController(text: currentStartMiles.toString());
    DateTime selectedDate = currentStartDate;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text("Edit Trip Details"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Date Picker for Start Date
              GestureDetector(
                onTap: () async {
                  DateTime? pickedDate = await showDatePicker(
                    context: context,
                    initialDate: selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );

                  if (pickedDate != null) {
                    selectedDate = pickedDate;
                  }
                },
                child: AbsorbPointer(
                  child: TextField(
                    decoration: InputDecoration(
                      labelText: "Start Date",
                      hintText: DateFormat('dd MMM yyyy').format(selectedDate),
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 10),
              // Start Miles Input
              TextField(
                controller: startMilesController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: "Start Miles"),
              ),
            ],
          ),
          actions: [
            TextButton(
              child: Text("Cancel"),
              onPressed: () => Navigator.pop(context),
            ),
            TextButton(
              child: Text("Update"),
              onPressed: () {
                int updatedMiles = int.tryParse(startMilesController.text) ?? 0;

                if (updatedMiles <= 0) {
                  showToastMessage(
                      "Warning", "Start miles must be greater than 0.", kRed);
                  return;
                }

                // Update Firestore
                FirebaseFirestore.instance
                    .collection("Users")
                    .doc(currentUId)
                    .collection("trips")
                    .doc(tripId)
                    .update({
                  "tripStartDate": Timestamp.fromDate(selectedDate),
                  "tripStartMiles": updatedMiles,
                  "updatedAt": Timestamp.now(),
                }).then((_) {
                  showToastMessage(
                      "Success", "Trip details updated!", kPrimary);
                  Navigator.pop(context);
                }).catchError((error) {
                  showToastMessage(
                      "Error", "Failed to update trip: $error", kRed);
                });
              },
            ),
          ],
        );
      },
    );
  }

  Widget buildCustomRowButton(
      IconData iconName, String text, Color boxColor, void Function()? onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 38.h,
        width: MediaQuery.of(context).size.width * 0.45,
        decoration: BoxDecoration(
            color: boxColor, borderRadius: BorderRadius.circular(10.r)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(iconName, color: kWhite),
            Text(text, style: appStyleUniverse(14, kWhite, FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  String getStringFromTripStatus(int status) {
    if (status == 1) {
      return 'Started';
    } else if (status == 2) {
      return 'Completed';
    }
    return 'Pending';
  }

  int getIntFromTripStatus(String status) {
    if (status == 'Started') {
      return 1;
    } else if (status == 'Completed') {
      return 2;
    }
    return 0;
  }
}
