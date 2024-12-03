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
  final _engineController = TextEditingController();
  final _currentReadingController = TextEditingController();
  final _hoursReadingController = TextEditingController();
  final _dotController = TextEditingController();
  final _iccmsController = TextEditingController();

  DateTime? _selectedYear;
  DateTime? _oilChangeDate;
  String? _selectedCompany;
  String? _selectedVehicleType;
  List<String> _companies = [];
  List<String> _vehicleTypes = [];

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

  Future<void> _selectOilChangeDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _oilChangeDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != _oilChangeDate) {
      setState(() {
        _oilChangeDate = picked;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchCompanyNames();
    _fetchVehicleTypes();
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

  Future<void> _fetchVehicleTypes() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('vehicleType')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> vehicleTypeList = metadataSnapshot.data()?['type'] ?? [];
        setState(() {
          _vehicleTypes = List<String>.from(vehicleTypeList);
        });
      }
    } catch (e) {
      print('Error fetching vehicle types: $e');
    }
  }

  Future<void> _saveVehicleData() async {
    try {
      CollectionReference vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles');

      QuerySnapshot vehiclesSnapshot = await vehiclesRef.get();
      for (QueryDocumentSnapshot vehicleDoc in vehiclesSnapshot.docs) {
        await vehicleDoc.reference.update({
          'isSet': false,
        });
      }

      Map<String, dynamic> vehicleData = {
        'vehicleType': _selectedVehicleType,
        'companyName': _selectedCompany,
        'engineNumber': _engineController.text,
        'vehicleNumber': _vehicleNumberController.text,
        'vin': _vinController.text,
        'dot': _dotController.text,
        'iccms': _iccmsController.text,
        'licensePlate': _licensePlateController.text,
        'year': _selectedYear != null
            ? DateFormat('yyyy-MM-dd').format(_selectedYear!)
            : null,
        'isSet': true,
        'createdAt': FieldValue.serverTimestamp(),
      };

      if (_selectedVehicleType == 'Truck') {
        vehicleData['currentReading'] = _currentReadingController.text;
        vehicleData['oilChangeDate'] = '';
        vehicleData['hoursReading'] = '';
      }

      if (_selectedVehicleType == 'Trailer') {
        vehicleData['currentReading'] = '';
        vehicleData['oilChangeDate'] = _oilChangeDate != null
            ? DateFormat('yyyy-MM-dd').format(_oilChangeDate!)
            : null;
        vehicleData['hoursReading'] = _hoursReadingController.text;
      }

      await vehiclesRef.add(vehicleData);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle added successfully')),
      );
      Navigator.pop(context);
    } catch (e) {
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
        backgroundColor: kPrimary,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 4,
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      DropdownButtonFormField<String>(
                        value: _selectedVehicleType,
                        hint: Text('Select Vehicle Type'),
                        decoration: InputDecoration(
                          labelText: 'Vehicle Type *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                        items: _vehicleTypes.map((String type) {
                          return DropdownMenuItem<String>(
                            value: type,
                            child: Text(type),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedVehicleType = newValue;
                          });
                        },
                      ),
                      SizedBox(height: 16.h),
                      DropdownButtonFormField<String>(
                        value: _selectedCompany,
                        hint: Text('Select Company Name'),
                        decoration: InputDecoration(
                          labelText: 'Company Name *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
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
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _engineController,
                        decoration: InputDecoration(
                          labelText: 'Engine Number *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      if (_selectedVehicleType == 'Truck') ...[
                        SizedBox(height: 16.h),
                        TextFormField(
                          controller: _currentReadingController,
                          decoration: InputDecoration(
                            labelText: 'Current Reading *',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: Colors.grey[100],
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ],
                      if (_selectedVehicleType == 'Trailer') ...[
                        SizedBox(height: 16.h),
                        GestureDetector(
                          onTap: () => _selectOilChangeDate(context),
                          child: AbsorbPointer(
                            child: TextFormField(
                              decoration: InputDecoration(
                                labelText: 'Oil Change Date *',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                filled: true,
                                fillColor: Colors.grey[100],
                              ),
                              controller: TextEditingController(
                                text: _oilChangeDate == null
                                    ? ''
                                    : DateFormat('yyyy-MM-dd')
                                        .format(_oilChangeDate!),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 16.h),
                        TextFormField(
                          controller: _hoursReadingController,
                          decoration: InputDecoration(
                            labelText: 'Hours Reading *',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: Colors.grey[100],
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ],
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _vehicleNumberController,
                        decoration: InputDecoration(
                          labelText: 'Vehicle Number *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _vinController,
                        decoration: InputDecoration(
                          labelText: 'VIN *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _dotController,
                        decoration: InputDecoration(
                          labelText: 'DOT (Optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _iccmsController,
                        decoration: InputDecoration(
                          labelText: 'ICCMS (Optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      TextFormField(
                        controller: _licensePlateController,
                        decoration: InputDecoration(
                          labelText: 'License Plate *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      GestureDetector(
                        onTap: () => _selectYear(context),
                        child: AbsorbPointer(
                          child: TextFormField(
                            decoration: InputDecoration(
                              labelText: 'Year *',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              filled: true,
                              fillColor: Colors.grey[100],
                            ),
                            controller: TextEditingController(
                              text: _selectedYear == null
                                  ? ''
                                  : DateFormat('yyyy').format(_selectedYear!),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 24.h),
                      CustomButton(
                        text: "Save Vehicle",
                        onPress: () {
                          if (_selectedVehicleType != null &&
                              _selectedCompany != null &&
                              _engineController.text.isNotEmpty &&
                              _vehicleNumberController.text.isNotEmpty &&
                              _vinController.text.isNotEmpty &&
                              _licensePlateController.text.isNotEmpty &&
                              _selectedYear != null) {
                            _saveVehicleData();
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content:
                                    Text('Please fill all required fields (*)'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                        color: kPrimary,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
