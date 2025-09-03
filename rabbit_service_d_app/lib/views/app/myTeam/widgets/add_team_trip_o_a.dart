import 'dart:async';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class AddTeamTripOwnerAndAccountant extends StatefulWidget {
  const AddTeamTripOwnerAndAccountant(
      {super.key,
      required this.driverName,
      required this.mId,
      required this.teamRole});
  final String driverName;
  final String mId;
  final String teamRole;

  @override
  State<AddTeamTripOwnerAndAccountant> createState() =>
      _AddTeamTripOwnerAndAccountantState();
}

class _AddTeamTripOwnerAndAccountantState
    extends State<AddTeamTripOwnerAndAccountant> {
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
  String? selectedTrailer;
  String selectLoadType = "Empty";
  String perMileCharge = '0';
  // String role = "";
  String ownerId = "";

  final List<String> loadTypes = [
    'Empty',
    'Loaded',
  ];

  bool showAddTrip = false;
  bool showAddMileageOrExpense = false;
  bool showFilterByDate = false;
  bool showViewTrips = false;
  bool isLoading = false;

  File? _selectedImage;
  String _imageUrl = '';
  DateTime? selectedDate;

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
          .doc(widget.mId)
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
        'trailerId': selectedTrailer ?? "",
        'currentUID': widget.mId,
        'role': widget.teamRole,
        'companyName': vehicleName,
        'vehicleNumber': vehicleNumber,
        'loadType': selectLoadType,
        'googleMiles': 0,
        'googleTotalEarning': 0,
        'trailerCompanyName': selectedTrailer != null
            ? vehicles
                .firstWhere((v) => v['id'] == selectedTrailer)['companyName']
            : "",
        'trailerNumber': selectedTrailer != null
            ? vehicles
                .firstWhere((v) => v['id'] == selectedTrailer)['vehicleNumber']
            : "",
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
        'oEarnings':
            (widget.teamRole == "Owner" && _oEarningController.text.isNotEmpty)
                ? int.parse(_oEarningController.text)
                : 0,
      };

      WriteBatch batch = FirebaseFirestore.instance.batch();

      DocumentReference userTripRef = FirebaseFirestore.instance
          .collection("Users")
          .doc(widget.mId)
          .collection('trips')
          .doc(docId);

      DocumentReference tripRef =
          FirebaseFirestore.instance.collection('trips').doc(docId);

      DocumentReference vehicleRef = FirebaseFirestore.instance
          .collection("Users")
          .doc(widget.mId)
          .collection("Vehicles")
          .doc(selectedVehicle);

      // Update current user's vehicle and create trip
      batch.set(userTripRef, tripData);
      batch.set(tripRef, tripData);
      batch.update(vehicleRef, {'tripAssign': true});

      // **Find and update assigned drivers' vehicles - only if they have the vehicle**
      if (widget.teamRole == "Owner") {
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
      if (widget.teamRole == "Driver") {
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
        selectedTrailer = null;
        selectLoadType = "Empty";
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
        .doc(widget.mId)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final userData = snapshot.data();
        if (userData != null) {
          setState(() {
            perMileCharge = userData['perMileCharge'];
            // widget.teamRole = userData['role'];
            ownerId = userData['createdBy'];
          });
        }
      }
    });

    // Setup vehicle stream
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(widget.mId)
        .collection("Vehicles")
        .where("active", isEqualTo: true)
        .where("vehicleType", whereIn: ["Truck", "Trailer"])
        .snapshots()
        .listen((snapshot) {
          if (snapshot.docs.isEmpty) {
            debugPrint('No vehicles found for user');
            return;
          }

          setState(() {
            vehicles.clear();
            vehicles.addAll(
                snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
          });
        });
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
        title: Text("Add Trip for ${widget.driverName}"),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  SizedBox(height: 20.h),
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
                            widget.teamRole == "Owner"
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
                            widget.teamRole == "Owner"
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
                              hint: const Text('Select Truck'),
                              items: vehicles
                                  .where((v) => v['vehicleType'] == "Truck")
                                  .map((vehicle) {
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

                            DropdownButtonFormField<String>(
                              value: selectedTrailer,
                              hint: const Text('Select Trailer'),
                              items: vehicles
                                  .where((v) => v['vehicleType'] == "Trailer")
                                  .map((vehicle) {
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
                                  selectedTrailer = value;
                                });
                              },
                            ),
                            SizedBox(height: 10.h),

                            // Load Type Dropdown
                            DropdownButtonFormField<String>(
                              value: selectLoadType,
                              hint: const Text('Select Load Type'),
                              items: loadTypes.map((type) {
                                return DropdownMenuItem<String>(
                                  value: type,
                                  child: Text(
                                    type,
                                    style: appStyleUniverse(
                                        17, kDark, FontWeight.normal),
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectLoadType = value!;
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
                ],
              ),
            ),
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
}
