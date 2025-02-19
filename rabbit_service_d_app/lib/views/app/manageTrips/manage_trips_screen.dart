import 'dart:async';
import 'dart:io';

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
  final TextEditingController _tripNameController = TextEditingController();
  final TextEditingController _currentMilesController = TextEditingController();
  String selectedTrip = '';
  String selectedType = 'Miles';
  TextEditingController milesController = TextEditingController();
  TextEditingController amountController = TextEditingController();
  TextEditingController descriptionController = TextEditingController();
  DateTime? fromDate;
  DateTime? toDate;
  late StreamSubscription usersSubscription;
  String perMileCharge = '0';

  bool showAddTrip = false;
  bool showAddMileageOrExpense = false;
  bool showFilterByDate = false;
  bool showViewTrips = false;
  bool isLoading = false;

  File? _selectedImage;
  String _imageUrl = '';
  DateTime? selectedDate;
  DateTime? selectedFilterDate;

  void addTrip() async {
    setState(() {
      isLoading = true;
    });
    try {
      if (_tripNameController.text.isNotEmpty &&
          _currentMilesController.text.isNotEmpty) {
        await FirebaseFirestore.instance
            .collection("Users")
            .doc(currentUId)
            .collection('trips')
            .add({
          'tripName': _tripNameController.text,
          'currentMiles': int.parse(_currentMilesController.text),
          'previousMiles': int.parse(_currentMilesController.text),
          'milesArray': [
            {
              'mile': int.parse(_currentMilesController.text),
              'date': Timestamp.now(),
            }
          ],
          'isPaid': false,
          'date': selectedDate,
          'createdAt': Timestamp.now(),
        });
        showToastMessage("Success", "Trip added successfully", kSecondary);
        _tripNameController.clear();
        _currentMilesController.clear();
        setState(() {
          selectedDate = null;
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      showToastMessage("Error", e.toString(), kRed);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _selectDateRange(BuildContext context) async {
    DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      setState(() {
        fromDate = picked.start;
        toDate = picked.end;
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
        await FirebaseFirestore.instance
            .collection("Users")
            .doc(currentUId)
            .collection("trips")
            .doc(selectedTrip)
            .collection('tripDetails')
            .add({
          'tripId': selectedTrip,
          'type': 'Expenses',
          'amount': double.parse(amountController.text),
          'description': descriptionController.text,
          'imageUrl': _imageUrl, // Store image URL if available
          'createdAt': Timestamp.now(),
        });

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
          });
        }
      }
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
                  // Add Trip and add mileage or expense
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        buildCustomRowButton(Icons.add, "Add Trip", kPrimary,
                            () {
                          setState(() {
                            showAddTrip = !showAddTrip;
                            showAddMileageOrExpense = false;
                            showViewTrips = false;
                          });
                        }),
                        buildCustomRowButton(
                            Icons.add, "Add Mile/Exp", kSecondary, () {
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
                                height: 50.h,
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
                                        : 'Select Date',
                                  ),
                                ),
                              ),
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
                                      child: Text("Please add a trip first.",
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
                            DropdownButton<String>(
                              value: selectedType,
                              items: ['Miles', 'Expenses']
                                  .map((e) => DropdownMenuItem(
                                      value: e, child: Text(e)))
                                  .toList(),
                              onChanged: (value) {
                                setState(() => selectedType = value!);
                              },
                            ),
                            if (selectedType == 'Miles')
                              SizedBox(
                                height: 40.h,
                                child: TextField(
                                  controller: milesController,
                                  decoration: const InputDecoration(
                                    labelText: 'Enter Miles',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                ),
                              )
                            else ...[
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

                              //select Image
                              ElevatedButton.icon(
                                onPressed: pickImage,
                                icon: const Icon(Icons.add_photo_alternate,
                                    color: Colors.white),
                                label: const Text(
                                  'Upload Image',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kPrimary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 20, vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
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

                              SizedBox(
                                height: 40.h,
                                child: TextField(
                                  controller: descriptionController,
                                  decoration: const InputDecoration(
                                    labelText: 'Description',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.text,
                                ),
                              ),
                            ],
                            SizedBox(height: 10.h),
                            CustomButton(
                                text: "Add Entry ",
                                onPress: () => addMileageOrExpense(),
                                color: kPrimary),
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
                          onPressed: () async {
                            final DateTime? pickedDate = await showDatePicker(
                              context: context,
                              initialDate: selectedFilterDate ?? DateTime.now(),
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );

                            if (pickedDate != null) {
                              setState(() {
                                selectedFilterDate = pickedDate;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ),

                  StreamBuilder(
                    stream: FirebaseFirestore.instance
                        .collection("Users")
                        .doc(currentUId)
                        .collection('trips')
                        .snapshots(),
                    builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                      if (!snapshot.hasData)
                        return const CircularProgressIndicator();

                      // Convert selectedFilterDate to formatted string for comparison
                      String? selectedDateStr = selectedFilterDate != null
                          ? DateFormat('dd MMM yyyy')
                              .format(selectedFilterDate!)
                          : null;

                      // Filter trips based on selected date
                      var filteredTrips = snapshot.data!.docs.where((doc) {
                        String tripDate = DateFormat('dd MMM yyyy')
                            .format(doc['date'].toDate());
                        return selectedFilterDate == null ||
                            tripDate == selectedDateStr;
                      }).toList();

                      // Show message if no trips match the selected date
                      if (filteredTrips.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 20),
                          child: Center(
                            child: Text(
                              "No trips found",
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red),
                            ),
                          ),
                        );
                      }

                      return ListView(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: filteredTrips.map((doc) {
                          num totalMiles = doc['currentMiles'];
                          num perMileCharges = num.parse(perMileCharge);
                          num earnings = totalMiles * perMileCharges;
                          String formattedDate = DateFormat('dd MMM yyyy')
                              .format(doc['date'].toDate());
                          bool isPaid = doc['isPaid'];

                          return GestureDetector(
                            onTap: () =>
                                Get.to(() => TripDetailsScreen(docId: doc.id)),
                            child: Container(
                              padding: EdgeInsets.all(5.w),
                              margin: EdgeInsets.all(5.w),
                              decoration: BoxDecoration(
                                color: kWhite,
                                borderRadius: BorderRadius.circular(10.r),
                                border: Border.all(color: kPrimary),
                              ),
                              child: ListTile(
                                title: Text(doc['tripName']),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Miles: $totalMiles"),
                                    Text("Earnings: \$${earnings.toString()}"),
                                    Text("Date: $formattedDate"),
                                  ],
                                ),
                                trailing: Text(
                                  "Status: ${isPaid ? 'Paid' : 'Unpaid'}",
                                  style: appStyle(
                                      12,
                                      isPaid ? kSecondary : kPrimary,
                                      FontWeight.w400),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
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
