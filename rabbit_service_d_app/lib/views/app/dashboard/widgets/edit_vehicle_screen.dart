import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class EditVehicleScreen extends StatefulWidget {
  final String vehicleId;
  final Map<String, dynamic> vehicleData;

  const EditVehicleScreen({
    Key? key,
    required this.vehicleId,
    required this.vehicleData,
  }) : super(key: key);

  @override
  _EditVehicleScreenState createState() => _EditVehicleScreenState();
}

class _EditVehicleScreenState extends State<EditVehicleScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final _vehicleNumberController = TextEditingController();
  final _vinController = TextEditingController();
  final _licensePlateController = TextEditingController();
  final _currentMilesController = TextEditingController();
  final _hoursReadingController = TextEditingController();
  final _dotController = TextEditingController();
  final _iccmsController = TextEditingController();

  DateTime? _selectedYear;
  DateTime? _oilChangeDate;
  String? _selectedCompany;
  String? _selectedVehicleType;
  String? _selectedEngineName;
  List<String> _companies = [];
  List<String> _vehicleTypes = [];
  List<String> _engineNameList = [];
  List<Map<String, dynamic>> servicesData = [];
  bool isLoading = true;
  bool isSaving = false;
  StreamSubscription<DocumentSnapshot>? _engineNameSubscription;

  @override
  void initState() {
    super.initState();
    _initializeFormWithExistingData();
    _fetchVehicleTypes();
    _fetchServicesData();
  }

  void _initializeFormWithExistingData() {
    final data = widget.vehicleData;

    setState(() {
      _selectedVehicleType = data['vehicleType'];
      _selectedCompany = data['companyName'];
      _selectedEngineName = data['engineName'];
      _vehicleNumberController.text = data['vehicleNumber'] ?? '';
      _vinController.text = data['vin'] ?? '';
      _licensePlateController.text = data['licensePlate'] ?? '';

      if (data['year'] != null) {
        try {
          _selectedYear = DateTime.parse(data['year']);
        } catch (e) {
          print('Error parsing year: $e');
        }
      }

      // Handle miles and hours based on vehicle type
      if (_selectedVehicleType == 'Truck') {
        if (data['currentMilesArray'] != null &&
            data['currentMilesArray'].isNotEmpty) {
          _currentMilesController.text =
              data['currentMilesArray'].last['miles'].toString();
        } else if (data['currentMiles'] != null) {
          _currentMilesController.text = data['currentMiles'].toString();
        }
      } else if (_selectedVehicleType == 'Trailer') {
        if (data['oilChangeDate'] != null) {
          try {
            _oilChangeDate = DateTime.parse(data['oilChangeDate']);
          } catch (e) {
            print('Error parsing oil change date: $e');
          }
        }

        if (data['hoursReadingArray'] != null &&
            data['hoursReadingArray'].isNotEmpty) {
          _hoursReadingController.text =
              data['hoursReadingArray'].last['hours'].toString();
        } else if (data['hoursReading'] != null) {
          _hoursReadingController.text = data['hoursReading'].toString();
        }
      }

      _dotController.text = data['dot'] ?? '';
      _iccmsController.text = data['iccms'] ?? '';

      // Fetch companies and engine names after setting initial values
      _fetchCompanyNames().then((_) {
        _setupEngineNameListener();
      });
    });
  }

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

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  Future<void> _fetchServicesData() async {
    try {
      DocumentSnapshot doc = await metadataCollection.doc('serviceData').get();
      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        List<dynamic> servicesList = data['data'] ?? [];
        setState(() {
          servicesData = servicesList.cast<Map<String, dynamic>>();
          isLoading = false;
        });
      } else {
        print("No services data found.");
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      print("Error fetching services data: $e");
      setState(() {
        isLoading = false;
      });
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

  Future<void> _fetchCompanyNames() async {
    try {
      if (_selectedVehicleType == null) return;

      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('companyNameL')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> companyList = metadataSnapshot.data()?['data'] ?? [];

        List<String> filteredCompanies = companyList
            .where((company) => company['type'] == _selectedVehicleType)
            .map((company) => company['cName'].toString().toUpperCase())
            .toList();

        setState(() {
          _companies = filteredCompanies;
        });
      }
    } catch (e) {
      print('Error fetching company names: $e');
    }
  }

  void _setupEngineNameListener() {
    _engineNameSubscription?.cancel();

    if (_selectedVehicleType == null || _selectedCompany == null) {
      setState(() {
        _engineNameList = [];
        _selectedEngineName = null;
      });
      return;
    }

    _engineNameSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('engineNameList')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        List<dynamic> engineNameList = snapshot.data()?['data'] ?? [];

        String selectedCompanyUpper = _selectedCompany!.toUpperCase().trim();
        String selectedType = _selectedVehicleType!.trim();

        List<String> filteredList = engineNameList
            .where((engine) {
              String engineCompany =
                  (engine['cName'] as String).toUpperCase().trim();
              String engineType = (engine['type'] as String).trim();

              return engineCompany == selectedCompanyUpper &&
                  engineType == selectedType;
            })
            .map((engine) => engine['eName'].toString().toUpperCase())
            .toList();

        setState(() {
          _engineNameList = filteredList;
          if (!_engineNameList.contains(_selectedEngineName)) {
            _selectedEngineName = null;
          }
        });
      }
    });
  }

  Future<void> _updateVehicleData() async {
    setState(() {
      isSaving = true;
    });

    try {
      DocumentReference vehicleRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .doc(widget.vehicleId);

      // Prepare the update data
      Map<String, dynamic> updateData = {
        'vehicleType': _selectedVehicleType,
        'companyName': _selectedCompany?.toUpperCase(),
        'engineName': _selectedEngineName?.toUpperCase(),
        'vehicleNumber': _vehicleNumberController.text.toString(),
        'vin': _vinController.text.toString(),
        'dot': _dotController.text.toString(),
        'iccms': _iccmsController.text.toString(),
        'licensePlate': _licensePlateController.text.toString(),
        'year': _selectedYear != null
            ? DateFormat('yyyy-MM-dd').format(_selectedYear!)
            : null,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      // Handle vehicle type specific fields
      if (_selectedVehicleType == 'Truck') {
        int? currentMiles = int.tryParse(_currentMilesController.text);
        if (currentMiles != null) {
          List<dynamic> currentMilesArray =
              widget.vehicleData['currentMilesArray'] ?? [];

          // Only add new entry if miles have changed
          if (currentMilesArray.isEmpty ||
              currentMilesArray.last['miles'] != currentMiles) {
            currentMilesArray.add({
              "miles": currentMiles,
              "date": DateTime.now().toIso8601String()
            });
          }

          updateData['currentMilesArray'] = currentMilesArray;
          updateData['currentMiles'] = currentMiles.toString();
        }
      } else if (_selectedVehicleType == 'Trailer') {
        if (_oilChangeDate != null) {
          updateData['oilChangeDate'] =
              DateFormat('yyyy-MM-dd').format(_oilChangeDate!);
        }

        int? hoursReading = int.tryParse(_hoursReadingController.text);
        if (hoursReading != null) {
          List<dynamic> hoursReadingArray =
              widget.vehicleData['hoursReadingArray'] ?? [];

          // Only add new entry if hours have changed
          if (hoursReadingArray.isEmpty ||
              hoursReadingArray.last['hours'] != hoursReading) {
            hoursReadingArray.add({
              "hours": hoursReading,
              "date": DateTime.now().toIso8601String()
            });
          }

          updateData['hoursReadingArray'] = hoursReadingArray;
          updateData['hoursReading'] = hoursReading.toString();
        }
      }

      await vehicleRef.update(updateData);

      setState(() {
        isSaving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle updated successfully')),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() {
        isSaving = false;
      });

      print('Error updating vehicle: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating vehicle: $e')),
      );
    }
  }

  @override
  void dispose() {
    _engineNameSubscription?.cancel();
    _vehicleNumberController.dispose();
    _vinController.dispose();
    _licensePlateController.dispose();
    _currentMilesController.dispose();
    _hoursReadingController.dispose();
    _dotController.dispose();
    _iccmsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Vehicle',
            style: appStyle(22, kWhite, FontWeight.normal)),
        iconTheme: IconThemeData(color: kWhite),
        backgroundColor: kPrimary,
      ),
      body: isSaving
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
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
                            // Vehicle Type Dropdown
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedVehicleType,
                                hint: Text('Select Vehicle Type'),
                                decoration: InputDecoration(
                                  labelText: 'Vehicle Type *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
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
                                    _fetchCompanyNames();
                                  });
                                },
                              ),
                            ),
                            SizedBox(height: 16.h),

                            // Company Name Dropdown
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedCompany,
                                hint: Text('Select Company Name'),
                                decoration: InputDecoration(
                                  labelText: 'Company Name *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
                                ),
                                items: _companies.map((String company) {
                                  return DropdownMenuItem<String>(
                                    value: company,
                                    child: Text(company),
                                  );
                                }).toList(),
                                onChanged: _selectedVehicleType == null
                                    ? null
                                    : (String? newValue) {
                                        setState(() {
                                          _selectedCompany = newValue;
                                          _setupEngineNameListener();
                                        });
                                      },
                              ),
                            ),
                            SizedBox(height: 16.h),

                            // Engine Name Dropdown
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedEngineName,
                                hint: Text('Select Engine'),
                                decoration: InputDecoration(
                                  labelText: 'Select Engine Name *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
                                ),
                                items: _engineNameList.isEmpty
                                    ? []
                                    : _engineNameList.map((String engineName) {
                                        return DropdownMenuItem<String>(
                                          value: engineName,
                                          child: Text(engineName),
                                        );
                                      }).toList(),
                                onChanged: _engineNameList.isEmpty
                                    ? null
                                    : (String? newValue) {
                                        setState(() {
                                          _selectedEngineName = newValue;
                                        });
                                      },
                              ),
                            ),

                            // Vehicle type specific fields
                            if (_selectedVehicleType == 'Truck') ...[
                              SizedBox(height: 16.h),
                              Container(
                                margin: kIsWeb
                                    ? EdgeInsets.symmetric(vertical: 4.0.h)
                                    : EdgeInsets.symmetric(vertical: 4.0.h),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: kIsWeb
                                      ? BorderRadius.circular(12.r)
                                      : BorderRadius.circular(12.0.r),
                                ),
                                child: TextField(
                                  controller: _currentMilesController,
                                  onChanged: (value) {
                                    _currentMilesController.value =
                                        TextEditingValue(
                                      text: value.toUpperCase(),
                                      selection:
                                          _currentMilesController.selection,
                                    );
                                  },
                                  decoration: InputDecoration(
                                    labelText: 'Current Miles *',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: kIsWeb
                                        ? EdgeInsets.all(2)
                                        : const EdgeInsets.all(8),
                                    labelStyle: kIsWeb
                                        ? TextStyle()
                                        : appStyle(
                                            14, kPrimary, FontWeight.bold),
                                  ),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ],

                            if (_selectedVehicleType == 'Trailer') ...[
                              SizedBox(height: 16.h),
                              // _selectedCompany == "DRY VAN"
                              //     ? SizedBox()
                              //     : GestureDetector(
                              //         onTap: () =>
                              //             _selectOilChangeDate(context),
                              //         child: AbsorbPointer(
                              //           child: Container(
                              //             margin: kIsWeb
                              //                 ? EdgeInsets.symmetric(
                              //                     vertical: 4.0.h)
                              //                 : EdgeInsets.symmetric(
                              //                     vertical: 4.0.h),
                              //             decoration: BoxDecoration(
                              //               color: Colors.white,
                              //               borderRadius: kIsWeb
                              //                   ? BorderRadius.circular(12.r)
                              //                   : BorderRadius.circular(12.0.r),
                              //             ),
                              //             child: TextField(
                              //               decoration: InputDecoration(
                              //                 labelText: 'Oil Change Date *',
                              //                 border: OutlineInputBorder(
                              //                   borderRadius:
                              //                       BorderRadius.circular(12.0),
                              //                   borderSide: BorderSide(
                              //                     color: Colors.grey.shade300,
                              //                     width: 1.0,
                              //                   ),
                              //                 ),
                              //                 focusedBorder: OutlineInputBorder(
                              //                   borderRadius:
                              //                       BorderRadius.circular(12.0),
                              //                   borderSide: BorderSide(
                              //                     color: Colors.grey.shade300,
                              //                     width: 1.0,
                              //                   ),
                              //                 ),
                              //                 enabledBorder: OutlineInputBorder(
                              //                   borderRadius:
                              //                       BorderRadius.circular(12.0),
                              //                   borderSide: BorderSide(
                              //                     color: Colors.grey.shade300,
                              //                     width: 1.0,
                              //                   ),
                              //                 ),
                              //                 filled: true,
                              //                 fillColor: Colors.white,
                              //                 contentPadding: kIsWeb
                              //                     ? EdgeInsets.all(2)
                              //                     : const EdgeInsets.all(8),
                              //                 labelStyle: kIsWeb
                              //                     ? TextStyle()
                              //                     : appStyle(14, kPrimary,
                              //                         FontWeight.bold),
                              //               ),
                              //               controller: TextEditingController(
                              //                 text: _oilChangeDate == null
                              //                     ? ''
                              //                     : DateFormat('yyyy-MM-dd')
                              //                         .format(_oilChangeDate!),
                              //               ),
                              //             ),
                              //           ),
                              //         ),
                              //       ),
                              // _selectedCompany == "DRY VAN"
                              //     ? SizedBox()
                              //     : SizedBox(height: 16.h),
                              // _selectedCompany == "DRY VAN"
                              //     ? SizedBox()
                              //     : Container(
                              //         margin: kIsWeb
                              //             ? EdgeInsets.symmetric(
                              //                 vertical: 4.0.h)
                              //             : EdgeInsets.symmetric(
                              //                 vertical: 4.0.h),
                              //         decoration: BoxDecoration(
                              //           color: Colors.white,
                              //           borderRadius: kIsWeb
                              //               ? BorderRadius.circular(12.r)
                              //               : BorderRadius.circular(12.0.r),
                              //         ),
                              //         child: TextField(
                              //           controller: _hoursReadingController,
                              //           onChanged: (value) {
                              //             _hoursReadingController.value =
                              //                 TextEditingValue(
                              //               text: value.toUpperCase(),
                              //               selection: _hoursReadingController
                              //                   .selection,
                              //             );
                              //           },
                              //           decoration: InputDecoration(
                              //             labelText: 'Hours Reading (optional)',
                              //             border: OutlineInputBorder(
                              //               borderRadius:
                              //                   BorderRadius.circular(12.0),
                              //               borderSide: BorderSide(
                              //                 color: Colors.grey.shade300,
                              //                 width: 1.0,
                              //               ),
                              //             ),
                              //             focusedBorder: OutlineInputBorder(
                              //               borderRadius:
                              //                   BorderRadius.circular(12.0),
                              //               borderSide: BorderSide(
                              //                 color: Colors.grey.shade300,
                              //                 width: 1.0,
                              //               ),
                              //             ),
                              //             enabledBorder: OutlineInputBorder(
                              //               borderRadius:
                              //                   BorderRadius.circular(12.0),
                              //               borderSide: BorderSide(
                              //                 color: Colors.grey.shade300,
                              //                 width: 1.0,
                              //               ),
                              //             ),
                              //             filled: true,
                              //             fillColor: Colors.white,
                              //             contentPadding: kIsWeb
                              //                 ? EdgeInsets.all(2)
                              //                 : const EdgeInsets.all(8),
                              //             labelStyle: kIsWeb
                              //                 ? TextStyle()
                              //                 : appStyle(14, kPrimary,
                              //                     FontWeight.bold),
                              //           ),
                              //           keyboardType: TextInputType.number,
                              //         ),
                              //       ),
                            ],

                            // Common fields
                            _selectedCompany == "DRY VAN"
                                ? SizedBox()
                                : SizedBox(height: 16.h),
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: TextField(
                                onChanged: (value) {
                                  _vehicleNumberController.value =
                                      TextEditingValue(
                                    text: value.toUpperCase(),
                                    selection:
                                        _vehicleNumberController.selection,
                                  );
                                },
                                controller: _vehicleNumberController,
                                decoration: InputDecoration(
                                  labelText: 'Vehicle Number *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
                                ),
                              ),
                            ),

                            SizedBox(height: 16.h),
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: TextField(
                                controller: _vinController,
                                onChanged: (value) {
                                  _vinController.value = TextEditingValue(
                                    text: value.toUpperCase(),
                                    selection: _vinController.selection,
                                  );
                                },
                                decoration: InputDecoration(
                                  labelText: 'VIN *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
                                ),
                              ),
                            ),

                            if (_selectedVehicleType == 'Truck') ...[
                              SizedBox(height: 16.h),
                              Container(
                                margin: kIsWeb
                                    ? EdgeInsets.symmetric(vertical: 4.0.h)
                                    : EdgeInsets.symmetric(vertical: 4.0.h),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: kIsWeb
                                      ? BorderRadius.circular(12.r)
                                      : BorderRadius.circular(12.0.r),
                                ),
                                child: TextField(
                                  controller: _dotController,
                                  onChanged: (value) {
                                    _dotController.value = TextEditingValue(
                                      text: value.toUpperCase(),
                                      selection: _dotController.selection,
                                    );
                                  },
                                  decoration: InputDecoration(
                                    labelText: 'DOT (Optional)',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: kIsWeb
                                        ? EdgeInsets.all(2)
                                        : const EdgeInsets.all(8),
                                    labelStyle: kIsWeb
                                        ? TextStyle()
                                        : appStyle(
                                            14, kPrimary, FontWeight.bold),
                                  ),
                                ),
                              ),
                              SizedBox(height: 16.h),
                              Container(
                                margin: kIsWeb
                                    ? EdgeInsets.symmetric(vertical: 4.0.h)
                                    : EdgeInsets.symmetric(vertical: 4.0.h),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: kIsWeb
                                      ? BorderRadius.circular(12.r)
                                      : BorderRadius.circular(12.0.r),
                                ),
                                child: TextField(
                                  controller: _iccmsController,
                                  onChanged: (value) {
                                    _iccmsController.value = TextEditingValue(
                                      text: value.toUpperCase(),
                                      selection: _iccmsController.selection,
                                    );
                                  },
                                  decoration: InputDecoration(
                                    labelText: 'ICCMS (Optional)',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12.0),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                        width: 1.0,
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: kIsWeb
                                        ? EdgeInsets.all(2)
                                        : const EdgeInsets.all(8),
                                    labelStyle: kIsWeb
                                        ? TextStyle()
                                        : appStyle(
                                            14, kPrimary, FontWeight.bold),
                                  ),
                                ),
                              ),
                            ],
                            SizedBox(height: 16.h),
                            Container(
                              margin: kIsWeb
                                  ? EdgeInsets.symmetric(vertical: 4.0.h)
                                  : EdgeInsets.symmetric(vertical: 4.0.h),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: kIsWeb
                                    ? BorderRadius.circular(12.r)
                                    : BorderRadius.circular(12.0.r),
                              ),
                              child: TextField(
                                controller: _licensePlateController,
                                onChanged: (value) {
                                  _licensePlateController.value =
                                      TextEditingValue(
                                    text: value.toUpperCase(),
                                    selection:
                                        _licensePlateController.selection,
                                  );
                                },
                                decoration: InputDecoration(
                                  labelText: 'License Plate *',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.0),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                      width: 1.0,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: kIsWeb
                                      ? EdgeInsets.all(2)
                                      : const EdgeInsets.all(8),
                                  labelStyle: kIsWeb
                                      ? TextStyle()
                                      : appStyle(14, kPrimary, FontWeight.bold),
                                ),
                              ),
                            ),
                            SizedBox(height: 16.h),
                            GestureDetector(
                              onTap: () => _selectYear(context),
                              child: AbsorbPointer(
                                child: Container(
                                  margin: kIsWeb
                                      ? EdgeInsets.symmetric(vertical: 4.0.h)
                                      : EdgeInsets.symmetric(vertical: 4.0.h),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: kIsWeb
                                        ? BorderRadius.circular(12.r)
                                        : BorderRadius.circular(12.0.r),
                                  ),
                                  child: TextField(
                                    decoration: InputDecoration(
                                      labelText: 'Year *',
                                      border: OutlineInputBorder(
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                        borderSide: BorderSide(
                                          color: Colors.grey.shade300,
                                          width: 1.0,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                        borderSide: BorderSide(
                                          color: Colors.grey.shade300,
                                          width: 1.0,
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                        borderSide: BorderSide(
                                          color: Colors.grey.shade300,
                                          width: 1.0,
                                        ),
                                      ),
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: kIsWeb
                                          ? EdgeInsets.all(2)
                                          : const EdgeInsets.all(8),
                                      labelStyle: kIsWeb
                                          ? TextStyle()
                                          : appStyle(
                                              14, kPrimary, FontWeight.bold),
                                    ),
                                    controller: TextEditingController(
                                      text: _selectedYear == null
                                          ? ''
                                          : DateFormat('yyyy')
                                              .format(_selectedYear!),
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            SizedBox(height: 24.h),
                            CustomButton(
                              text: "Update Vehicle",
                              onPress: () {
                                if (_selectedVehicleType != null &&
                                    _selectedCompany != null &&
                                    _selectedEngineName != null &&
                                    _vehicleNumberController.text.isNotEmpty &&
                                    _vinController.text.isNotEmpty &&
                                    _licensePlateController.text.isNotEmpty &&
                                    _selectedYear != null) {
                                  _updateVehicleData();
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Please fill all required fields (*)'),
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
