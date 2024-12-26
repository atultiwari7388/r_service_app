import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
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
  StreamSubscription<DocumentSnapshot>? _engineNameSubscription;

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
    _fetchVehicleTypes();
  }

  @override
  void dispose() {
    _engineNameSubscription?.cancel();
    super.dispose();
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

        // Filter companies based on vehicle type
        List<String> filteredCompanies = companyList
            .where((company) => company['type'] == _selectedVehicleType)
            .map((company) => company['cName'].toString().toUpperCase())
            .toList();

        setState(() {
          _companies = filteredCompanies;
          // Reset company selection when vehicle type changes
          _selectedCompany = null;
          _selectedEngineName = null;
        });
      }
    } catch (e) {
      print('Error fetching company names: $e');
    }
  }

  void _setupEngineNameListener() {
    print('Setting up engine name listener');
    _engineNameSubscription?.cancel();

    if (_selectedVehicleType == null || _selectedCompany == null) {
      print('Vehicle type or company not selected');
      setState(() {
        _engineNameList = [];
        _selectedEngineName = null;
      });
      return;
    }

    print('Subscribing to engine name list updates');
    _engineNameSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('engineNameList')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        print('Received engine name list snapshot');
        List<dynamic> engineNameList = snapshot.data()?['data'] ?? [];
        print('Raw engine name list: $engineNameList');

        String selectedCompanyUpper = _selectedCompany!.toUpperCase().trim();
        String selectedType = _selectedVehicleType!.trim();
        print(
            'Filtering for company: $selectedCompanyUpper, type: $selectedType');

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

        print('Filtered engine list: $filteredList');

        setState(() {
          _engineNameList = filteredList;
          if (!_engineNameList.contains(_selectedEngineName)) {
            print(
                'Previously selected engine name no longer valid, resetting selection');
            _selectedEngineName = null;
          }
        });
      } else {
        print('Engine name list snapshot does not exist');
      }
    });
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
        'companyName': _selectedCompany?.toUpperCase(),
        'engineName': _selectedEngineName?.toUpperCase(),
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
        'currentMilesArray': FieldValue.arrayUnion([
          {
            "miles": int.parse(_currentMilesController.text),
            "date": DateTime.now().toIso8601String()
          }
        ]),
      };

      if (_selectedVehicleType == 'Truck') {
        vehicleData['currentMiles'] = _currentMilesController.text;
        vehicleData['firstTimeMiles'] = _currentMilesController.text;
        vehicleData['nextNotificationMiles'] = [];
        vehicleData['oilChangeDate'] = '';
        vehicleData['hoursReading'] = '';
      }

      if (_selectedVehicleType == 'Trailer') {
        vehicleData['currentMiles'] = '';
        vehicleData['firstTimeMiles'] = '';
        vehicleData['nextNotificationMiles'] = [];
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
                              // Fetch companies when vehicle type changes
                              _fetchCompanyNames();
                            });
                          },
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
                                  : appStyle(14, kPrimary, FontWeight.bold),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                      if (_selectedVehicleType == 'Trailer') ...[
                        SizedBox(height: 16.h),
                        GestureDetector(
                          onTap: () => _selectOilChangeDate(context),
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
                                  labelText: 'Oil Change Date *',
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
                                controller: TextEditingController(
                                  text: _oilChangeDate == null
                                      ? ''
                                      : DateFormat('yyyy-MM-dd')
                                          .format(_oilChangeDate!),
                                ),
                              ),
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
                            controller: _hoursReadingController,
                            decoration: InputDecoration(
                              labelText: 'Hours Reading *',
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
                            keyboardType: TextInputType.number,
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
                          controller: _iccmsController,
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
                          controller: _licensePlateController,
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
                              controller: TextEditingController(
                                text: _selectedYear == null
                                    ? ''
                                    : DateFormat('yyyy').format(_selectedYear!),
                              ),
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
                              _selectedEngineName != null &&
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
