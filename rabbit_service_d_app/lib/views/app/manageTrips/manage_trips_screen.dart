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
  String selectedType = 'Expenses';
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
          'tripStatus': 0,
          'tripStartDate': selectedDate,
          'tripEndDate': DateTime.now(),
          'createdAt': Timestamp.now(),
          'updatedAt': Timestamp.now(),
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
                            Icons.add, "Add Expenses", kSecondary, () {
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
                              maxLines: 3,
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
                      if (!snapshot.hasData) {
                        return const CircularProgressIndicator();
                      }

                      String? selectedDateStr = selectedFilterDate != null
                          ? DateFormat('dd MMM yyyy')
                              .format(selectedFilterDate!)
                          : null;

                      var filteredTrips = snapshot.data!.docs.where((doc) {
                        String tripDate = DateFormat('dd MMM yyyy')
                            .format(doc['createdAt'].toDate());
                        return selectedFilterDate == null ||
                            tripDate == selectedDateStr;
                      }).toList();

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
                          String formattedStartDate = DateFormat('dd MMM yyyy')
                              .format(doc['tripStartDate'].toDate());
                          String formattedEndDate = DateFormat('dd MMM yyyy')
                              .format(doc['tripEndDate'].toDate());
                          bool isPaid = doc['isPaid'];
                          String tripStatus =
                              getStringFromTripStatus(doc['tripStatus']);
                          num tripStartMiles = doc['tripStartMiles'];
                          num tripEndMiles = doc['tripEndMiles'];
                          num totalMiles =
                              doc['tripEndMiles'] - doc['tripStartMiles'];
                          num perMileCharges = num.parse(perMileCharge);
                          num earnings = totalMiles * perMileCharges;

                          // print("Trip Status: " + tripStatus);

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
                                    // 0 means no expenses, so we hide it
                                    context);
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
                                  context);
                            },
                          );

                          // return buildTripCard(doc, formattedStartDate, tripStartMiles, tripStatus, formattedEndDate, tripEndMiles, totalMiles, earnings, isPaid, context);
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
      ),
    );
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
      BuildContext context) {
    return GestureDetector(
      onTap: () => Get.to(() => TripDetailsScreen(
            docId: doc.id,
            userId: currentUId,
            tripName: doc['tripName'],
          )),
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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Start Date: $formattedStartDate"),
                Text("Start Miles: $tripStartMiles"),
              ],
            ),
            SizedBox(height: 5.h),
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
              SizedBox(height: 5.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Total Miles: $totalMiles"),
                  Text("Earnings: \$${earnings}"),
                ],
              ),
              SizedBox(height: 5.h),
              Row(
                children: [
                  Text("Payment Status: "),
                  Spacer(),
                  isPaid
                      ? Text("Paid",
                          style: appStyle(16, kSecondary, FontWeight.w500))
                      : Text("Unpaid",
                          style: appStyle(16, kRed, FontWeight.w500))
                ],
              ),
              SizedBox(height: 5.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [Text("Total Expenses:"), Text("\$${totalExpenses}")],
              ),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Trip Status: "),
                Spacer(),
                if (tripStatus != 'Completed') ...[
                  DropdownButton<String>(
                    value: tripStatus,
                    items: ['Pending', 'Started', 'Completed']
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

                            if (currentMiles <= tripStartMiles) {
                              showToastMessage(
                                  "Warning",
                                  "End miles must be greater than start miles.",
                                  kRed);

                              return; // Stop the status change
                            }

                            FirebaseFirestore.instance
                                .collection("Users")
                                .doc(currentUId)
                                .collection('trips')
                                .doc(doc.id)
                                .update({
                              'tripStatus': newStatus,
                              'tripEndMiles': currentMiles,
                              'tripEndDate': Timestamp.now(),
                              'updatedAt': Timestamp.now(),
                            });
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
              ],
            ),
            SizedBox(height: 5.h),
            if (tripStatus != "Completed") ...[
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: kWhite,
                ),
                onPressed: () {
                  showEditTripDialog(context, doc.id,
                      doc['tripStartDate'].toDate(), doc['tripStartMiles']);
                },
                child: Text("Edit Trip"),
              ),
            ]
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
    if (status == 0) {
      return 'Pending';
    } else if (status == 1) {
      return 'Started';
    } else if (status == 2) {
      return 'Completed';
    }
    return 'Pending';
  }

  int getIntFromTripStatus(String status) {
    if (status == 'Pending') {
      return 0;
    } else if (status == 'Started') {
      return 1;
    } else if (status == 'Completed') {
      return 2;
    }
    return 0;
  }
}
