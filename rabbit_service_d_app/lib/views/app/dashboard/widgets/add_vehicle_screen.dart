import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class AddVehicleScreen extends StatefulWidget {
  @override
  _AddVehicleScreenState createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _vehicleNumberController = TextEditingController();
  final _vinController = TextEditingController();
  final _licensePlateController = TextEditingController();

  DateTime? _selectedYear;
  String? _selectedCompany;
  List<String> _companies = [];

  Future<void> _selectYear(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedYear ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedYear) {
      setState(() {
        _selectedYear = picked;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchCompanyNames();
  }

  Future<void> _fetchCompanyNames() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('companyName')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> companyList = metadataSnapshot.data()?['data'] ?? [];

        setState(() {
          _companies = List<String>.from(companyList);
        });
      }
    } catch (e) {
      print('Error fetching company names: $e');
    }
  }

  // Future<void> _saveVehicleData() async {
  //   try {
  //     await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .collection('Vehicles')
  //         .add({
  //       'companyName': _selectedCompany,
  //       'vehicleNumber': _vehicleNumberController.text,
  //       'vin': _vinController.text.isNotEmpty ? _vinController.text : null,
  //       'licensePlate': _licensePlateController.text.isNotEmpty
  //           ? _licensePlateController.text
  //           : null,
  //       'year': _selectedYear != null
  //           ? DateFormat('yyyy').format(_selectedYear!)
  //           : null,
  //       "isSet": true,
  //       'createdAt': FieldValue.serverTimestamp(),
  //     });
  //
  //     if (_selectedCompany != null &&
  //         _vehicleNumberController.text.isNotEmpty) {
  //       // Return the data to the previous screen
  //       Navigator.pop(context, {
  //         'vehicleNumber': _vehicleNumberController.text,
  //       });
  //     } else {
  //       // Show an error if fields are empty
  //       ScaffoldMessenger.of(context).showSnackBar(
  //         SnackBar(
  //           content: Text('Please fill all fields'),
  //         ),
  //       );
  //     }
  //
  //     // Show success message
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       SnackBar(content: Text('Vehicle added successfully')),
  //     );
  //
  //     // Clear fields after saving
  //     _vehicleNumberController.clear();
  //     _vinController.clear();
  //     _licensePlateController.clear();
  //     setState(() {
  //       _selectedCompany = null;
  //       _selectedYear = null;
  //     });
  //   } catch (e) {
  //     // Show error message
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       SnackBar(content: Text('Error adding vehicle: $e')),
  //     );
  //   }
  // }

  Future<void> _saveVehicleData() async {
    try {
      // Get a reference to the 'Vehicles' collection
      CollectionReference vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles');

      // Step 1: Set 'isSet' to false for all existing vehicles
      QuerySnapshot vehiclesSnapshot = await vehiclesRef.get();
      for (QueryDocumentSnapshot vehicleDoc in vehiclesSnapshot.docs) {
        await vehicleDoc.reference.update({
          'isSet': false,
        });
      }

      // Step 2: Add the new vehicle with 'isSet' set to true
      await vehiclesRef.add({
        'companyName': _selectedCompany,
        'vehicleNumber': _vehicleNumberController.text,
        'vin': _vinController.text.isNotEmpty ? _vinController.text : null,
        'licensePlate': _licensePlateController.text.isNotEmpty
            ? _licensePlateController.text
            : null,
        'year': _selectedYear != null
            ? DateFormat('yyyy-MM-dd').format(_selectedYear!)
            : null,
        'isSet': true, // Set isSet to true for the newly added vehicle
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle added successfully')),
      );
      Navigator.pop(context);

      // Clear input fields
      _vehicleNumberController.clear();
      _vinController.clear();
      _licensePlateController.clear();
      setState(() {
        _selectedCompany = null;
        _selectedYear = null;
      });
    } catch (e) {
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding vehicle: $e')),
      );
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Your Vehicle'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                value: _selectedCompany,
                hint: Text('Select Company Name'),
                items: _companies.map((String company) {
                  return DropdownMenuItem<String>(
                    value: company,
                    child: Text(company),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedCompany = newValue;
                  });
                },
                decoration: InputDecoration(
                  labelText: 'Company ',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20.h),
              TextField(
                controller: _vehicleNumberController,
                decoration: InputDecoration(
                  labelText: 'Vehicle Number',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20.h),
              TextField(
                controller: _vinController,
                decoration: InputDecoration(
                  labelText: 'Vin (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20.h),
              TextField(
                controller: _licensePlateController,
                decoration: InputDecoration(
                  labelText: 'License Plate (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20.h),
              GestureDetector(
                onTap: () => _selectYear(context),
                child: AbsorbPointer(
                  child: TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Year',
                    ),
                    controller: TextEditingController(
                      text: _selectedYear == null
                          ? ''
                          : DateFormat('yyyy').format(_selectedYear!),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              CustomButton(
                  text: "Save",
                  onPress: () {
                    if (_selectedCompany != null &&
                        _vehicleNumberController.text.isNotEmpty) {
                      _saveVehicleData();
                    } else {
                      // Show an error if fields are empty
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Please fill all fields'),
                        ),
                      );
                    }
                  },
                  color: kPrimary),
            ],
          ),
        ),
      ),
    );
  }
}
