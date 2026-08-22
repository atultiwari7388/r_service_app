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
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:regal_service_d_app/views/app/myCompanies/my_companies_screen.dart';

class AddVehicleScreen extends StatefulWidget {
  AddVehicleScreen({required this.currentUId});

  final String currentUId;

  @override
  _AddVehicleScreenState createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _vehicleNumberController = TextEditingController();
  final _vinController = TextEditingController();
  final _licensePlateController = TextEditingController();
  final _currentMilesController = TextEditingController();
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

  String effectiveUserId = '';
  List<Map<String, dynamic>> _myCompaniesList = [];
  String? _selectedMyCompanyId;
  String? _selectedMyCompanyName;
  bool _isLoadingCompanies = false;

  bool isLoading = true;
  bool isSaving = false;
  StreamSubscription<DocumentSnapshot>? _engineNameSubscription;

  Future<void> _selectYear(BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text("Select Year"),
          content: Container(
            width: 300.w,
            height: 300.h,
            child: YearPicker(
              firstDate: DateTime(1980),
              lastDate: DateTime(DateTime.now().year + 1),
              selectedDate: _selectedYear ?? DateTime.now(),
              onChanged: (DateTime dateTime) {
                setState(() {
                  _selectedYear = dateTime;
                });
                Navigator.pop(context);
              },
            ),
          ),
        );
      },
    );
  }

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  // Fetch services data
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

  Future<void> _fetchEffectiveUserIdAndCompanies() async {
    setState(() {
      _isLoadingCompanies = true;
    });

    try {
      String uid = widget.currentUId;
      DocumentSnapshot userDoc =
          await FirebaseFirestore.instance.collection('Users').doc(uid).get();

      if (userDoc.exists) {
        final data = userDoc.data() as Map<String, dynamic>?;
        if (data != null &&
            data.containsKey('createdBy') &&
            data['createdBy'] != null &&
            data['createdBy'].toString().trim().isNotEmpty) {
          effectiveUserId = data['createdBy'].toString().trim();
        } else {
          effectiveUserId = uid;
        }
      } else {
        effectiveUserId = uid;
      }

      // Fetch ALL companies from Users/{effectiveUserId}/myCompanies
      final companiesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(effectiveUserId)
          .collection('myCompanies')
          .get();

      List<Map<String, dynamic>> loadedCompanies = [];

      for (var doc in companiesSnapshot.docs) {
        final cData = doc.data();
        final cName =
            (cData['companyName'] ?? cData['name'] ?? '').toString().trim();
        final bool isActive = cData['isActive'] != false;
        if (cName.isNotEmpty && isActive) {
          loadedCompanies.add({
            'id': doc.id,
            'companyName': cName,
            'dot': cData['dot'] ?? '',
            'mc': cData['mc'] ?? '',
            'isActive': isActive,
          });
        }
      }

      // Fallback: If no subcollection items found, check root user document
      if (loadedCompanies.isEmpty && userDoc.exists) {
        final data = userDoc.data() as Map<String, dynamic>?;
        final rootCompanyName = (data?['companyName'] ?? '').toString().trim();
        if (rootCompanyName.isNotEmpty) {
          loadedCompanies.add({
            'id': 'default',
            'companyName': rootCompanyName,
            'dot': data?['dot'] ?? '',
            'mc': data?['mc'] ?? '',
          });
        }
      }

      // Sort companies alphabetically from A to Z
      loadedCompanies.sort((a, b) {
        final nameA = (a['companyName'] ?? '').toString().toLowerCase();
        final nameB = (b['companyName'] ?? '').toString().toLowerCase();
        return nameA.compareTo(nameB);
      });

      setState(() {
        _myCompaniesList = loadedCompanies;
        if (loadedCompanies.isNotEmpty) {
          if (_selectedMyCompanyId == null ||
              !loadedCompanies.any((c) => c['id'] == _selectedMyCompanyId)) {
            _selectedMyCompanyId = loadedCompanies.first['id'];
            _selectedMyCompanyName = loadedCompanies.first['companyName'];
          }
        } else {
          _selectedMyCompanyId = null;
          _selectedMyCompanyName = null;
        }
        _isLoadingCompanies = false;
      });
    } catch (e) {
      print('Error fetching myCompanies in AddVehicleScreen: $e');
      setState(() {
        _isLoadingCompanies = false;
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

  List<Map<String, dynamic>> calculateNextNotificationMiles() {
    List<Map<String, dynamic>> nextNotificationMiles = [];
    int currentMiles = int.tryParse(_currentMilesController.text) ?? 0;

    log('Current Miles: $currentMiles');
    log('Selected Engine: $_selectedEngineName');
    log('Selected Vehicle Type: $_selectedVehicleType');

    for (var service in servicesData) {
      log('\nChecking service: ${service['sName']}');

      if (service['vType'] == _selectedVehicleType) {
        String serviceName = service['sName'];
        String serviceId = service['sId'] ?? '';
        List<dynamic> subServices = service['subServices'] ?? [];
        List<dynamic> defaultValues = service['dValues'] ?? [];

        bool foundMatch = false;

        for (var defaultValue in defaultValues) {
          if (defaultValue['brand'].toString().toLowerCase() ==
              _selectedEngineName?.toLowerCase()) {
            foundMatch = true;

            String type = defaultValue['type'].toString().toLowerCase();
            int value = int.tryParse(defaultValue['value'].toString()) ?? 0;
            int notificationValue;

            if (type == "reading") {
              notificationValue = value * 1000;
            } else if (type == "day") {
              notificationValue = value;
            } else if (type == "hours") {
              notificationValue = value;
            } else {
              notificationValue = value;
            }

            log('Matched dValue - Brand: ${defaultValue['brand']}, Type: $type, Notification Value: $notificationValue');

            nextNotificationMiles.add({
              'serviceId': serviceId,
              'serviceName': serviceName,
              'defaultNotificationValue': notificationValue,
              'nextNotificationValue': notificationValue,
              'type': type,
              'subServices':
                  subServices.map((s) => s['sName'].toString()).toList(),
            });
          }
        }

        if (!foundMatch) {
          log('No brand match found for service: $serviceName');
        }
      } else {
        log('Skipping service: ${service['sName']} due to unmatched vehicle type.');
      }
    }

    log('\nFinal nextNotificationMiles: $nextNotificationMiles');
    return nextNotificationMiles;
  }

  Future<void> _saveVehicleData() async {
    setState(() {
      isSaving = true;
    });

    try {
      String targetUserId =
          effectiveUserId.isNotEmpty ? effectiveUserId : widget.currentUId;
      CollectionReference vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(targetUserId)
          .collection('Vehicles');

      // Check if the vehicle already exists based on vehicle number, vehicleType, companyName, and engineName
      QuerySnapshot existingVehicles = await vehiclesRef
          .where('vehicleNumber',
              isEqualTo: _vehicleNumberController.text.toString())
          .where('vehicleType', isEqualTo: _selectedVehicleType)
          .where('companyName', isEqualTo: _selectedCompany?.toUpperCase())
          .where('engineName', isEqualTo: _selectedEngineName?.toUpperCase())
          .get();

      if (existingVehicles.docs.isNotEmpty) {
        setState(() {
          isSaving = false;
        });
        showToastMessage('Already', 'Vehicle already added', kRed);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Vehicle already added')),
        );
        return;
      }

      QuerySnapshot vehiclesSnapshot = await vehiclesRef.get();
      for (QueryDocumentSnapshot vehicleDoc in vehiclesSnapshot.docs) {
        await vehicleDoc.reference.update({
          'isSet': false,
        });
      }

      List<Map<String, dynamic>> nextNotificationMiles =
          calculateNextNotificationMiles();

      Map<String, dynamic> vehicleData = {
        'active': true,
        'firstTimeVehicle': true,
        'tripAssign': false,
        'vehicleType': _selectedVehicleType,
        'companyName': _selectedCompany?.toUpperCase(),
        'engineName': _selectedEngineName?.toUpperCase(),
        'myCompany': _selectedMyCompanyName ?? '',
        'mycomId': _selectedMyCompanyId ?? '',
        'vehicleNumber': _vehicleNumberController.text.toString(),
        'vin': _vinController.text.toString(),
        // 'dot': _dotController.text.toString(),
        // 'iccms': _iccmsController.text.toString(),
        'licensePlate': _licensePlateController.text.toString(),
        'year': _selectedYear != null
            ? DateFormat('yyyy').format(_selectedYear!)
            : '',
        'isSet': true,
        "uploadedDocuments": [],
        'createdAt': FieldValue.serverTimestamp(),
        'hoursReadingArray': [
          {"hours": "1000", "date": DateTime.now().toIso8601String()}
        ],
        'currentMilesArray': [
          {
            "miles": _currentMilesController.text.isNotEmpty
                ? int.parse(_currentMilesController.text)
                : 0,
            "date": DateTime.now().toIso8601String()
          }
        ],
        'nextNotificationMiles': nextNotificationMiles,
        'services': nextNotificationMiles
            .map((service) => {
                  'defaultNotificationValue':
                      service['defaultNotificationValue'],
                  'nextNotificationValue': service['nextNotificationValue'],
                  'preValue': service['defaultNotificationValue'],
                  'serviceId': service['serviceId'],
                  'serviceName': service['serviceName'],
                  'type': service['type'],
                  'subServices': service['subServices'],
                })
            .toList(),
      };

      if (_selectedVehicleType == 'Truck') {
        vehicleData['hoursReadingArray'] = [];
        vehicleData['currentMiles'] = _currentMilesController.text.toString();
        vehicleData['prevMilesValue'] = _currentMilesController.text.toString();
        vehicleData['firstTimeMiles'] = _currentMilesController.text.toString();
        vehicleData['oilChangeDate'] = '2025-04-12';
        vehicleData['hoursReading'] = '';
        vehicleData['prevHoursReadingValue'] = '';
      }

      if (_selectedVehicleType == 'Trailer') {
        vehicleData['currentMiles'] = '';
        vehicleData['prevMilesValue'] = '';
        vehicleData['firstTimeMiles'] = '';
        vehicleData['oilChangeDate'] = '2025-04-12';
        vehicleData['hoursReading'] = '1000';
        vehicleData['prevHoursReadingValue'] = "1000";
      }

      DocumentReference vehicleDocRef = await vehiclesRef.add(vehicleData);

      // Update the vehicle data with the vehicleId
      await vehicleDocRef.update({'vehicleId': vehicleDocRef.id});

      log('Vehicle added successfully with id: ${vehicleDocRef.id}');

      // After the vehicle is added, call the cloud function to check and notify the user
      final HttpsCallable callable = FirebaseFunctions.instance
          .httpsCallable('checkAndNotifyUserForVehicleService');

      // Call the function with necessary data
      await callable.call({
        'userId': targetUserId, // Pass targetUserId
        'vehicleId': vehicleDocRef.id, // Pass the vehicleId
      });

      log("Cloud function called successfully with vehicleId: ${vehicleDocRef.id} and userId: $targetUserId");

      setState(() {
        isSaving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle added successfully')),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() {
        isSaving = false;
      });

      print('Error adding vehicle: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding vehicle: $e')),
      );
    } finally {
      setState(() {
        isSaving = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchEffectiveUserIdAndCompanies();
    _fetchVehicleTypes();
    _fetchServicesData();
  }

  @override
  void dispose() {
    _engineNameSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Your Vehicle',
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
                                hint: Text(_selectedVehicleType == 'Truck'
                                    ? 'Select Truck Company Name'
                                    : _selectedVehicleType == 'Trailer'
                                        ? 'Select Trailer Company Name'
                                        : 'Select Company Name'),
                                decoration: InputDecoration(
                                  labelText: _selectedVehicleType == 'Truck'
                                      ? 'Truck Company Name *'
                                      : _selectedVehicleType == 'Trailer'
                                          ? 'Trailer Company Name *'
                                          : 'Company Name *',
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
                            SizedBox(height: 16.h),

                            // ================= MY COMPANIES DROPDOWN WITH ADD BUTTON =================
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Container(
                                    margin:
                                        EdgeInsets.symmetric(vertical: 4.0.h),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius:
                                          BorderRadius.circular(12.0.r),
                                    ),
                                    child: _isLoadingCompanies
                                        ? const Padding(
                                            padding: EdgeInsets.all(12.0),
                                            child: Center(
                                              child: SizedBox(
                                                height: 20,
                                                width: 20,
                                                child:
                                                    CircularProgressIndicator(
                                                        strokeWidth: 2),
                                              ),
                                            ),
                                          )
                                        : DropdownButtonFormField<String>(
                                            isExpanded: true,
                                            value: _selectedMyCompanyId,
                                            hint: const Text(
                                              'Select My Company',
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            decoration: InputDecoration(
                                              isDense: true,
                                              labelText: 'My Company *',
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
                                                borderSide: const BorderSide(
                                                  color: kPrimary,
                                                  width: 1.5,
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
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 12),
                                              labelStyle: appStyle(14, kPrimary,
                                                  FontWeight.bold),
                                            ),
                                            items:
                                                _myCompaniesList.map((company) {
                                              final String cName =
                                                  company['companyName'] ?? '';
                                              return DropdownMenuItem<String>(
                                                value: company['id'] as String,
                                                child: Text(
                                                  cName,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: appStyle(14, kDark,
                                                      FontWeight.normal),
                                                ),
                                              );
                                            }).toList(),
                                            onChanged: (String? newId) {
                                              if (newId != null) {
                                                final selected =
                                                    _myCompaniesList.firstWhere(
                                                  (c) => c['id'] == newId,
                                                  orElse: () => {},
                                                );
                                                setState(() {
                                                  _selectedMyCompanyId = newId;
                                                  _selectedMyCompanyName =
                                                      selected['companyName'];
                                                });
                                              }
                                            },
                                          ),
                                  ),
                                ),
                                SizedBox(width: 8.w),
                                Tooltip(
                                  message: "Manage / Add Companies",
                                  child: InkWell(
                                    onTap: () async {
                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              MyCompaniesScreen(
                                            currentUId:
                                                effectiveUserId.isNotEmpty
                                                    ? effectiveUserId
                                                    : widget.currentUId,
                                          ),
                                        ),
                                      );
                                      // Refresh companies list upon returning
                                      await _fetchEffectiveUserIdAndCompanies();
                                    },
                                    borderRadius: BorderRadius.circular(21),
                                    child: Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        color: kPrimary,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: kPrimary.withOpacity(0.3),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.add,
                                        color: Colors.white,
                                        size: 22,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (_selectedVehicleType == 'Truck') ...[
                              // SizedBox(height: 16.h),
                              // Container(
                              //   margin: kIsWeb
                              //       ? EdgeInsets.symmetric(vertical: 4.0.h)
                              //       : EdgeInsets.symmetric(vertical: 4.0.h),
                              //   decoration: BoxDecoration(
                              //     color: Colors.white,
                              //     borderRadius: kIsWeb
                              //         ? BorderRadius.circular(12.r)
                              //         : BorderRadius.circular(12.0.r),
                              //   ),
                              //   child: TextField(
                              //     controller: _currentMilesController,
                              //     onChanged: (value) {
                              //       _currentMilesController.value =
                              //           TextEditingValue(
                              //         text: value.toUpperCase(),
                              //         selection:
                              //             _currentMilesController.selection,
                              //       );
                              //     },
                              //     decoration: InputDecoration(
                              //       labelText: 'Current Miles (Optional)',
                              //       border: OutlineInputBorder(
                              //         borderRadius: BorderRadius.circular(12.0),
                              //         borderSide: BorderSide(
                              //           color: Colors.grey.shade300,
                              //           width: 1.0,
                              //         ),
                              //       ),
                              //       focusedBorder: OutlineInputBorder(
                              //         borderRadius: BorderRadius.circular(12.0),
                              //         borderSide: BorderSide(
                              //           color: Colors.grey.shade300,
                              //           width: 1.0,
                              //         ),
                              //       ),
                              //       enabledBorder: OutlineInputBorder(
                              //         borderRadius: BorderRadius.circular(12.0),
                              //         borderSide: BorderSide(
                              //           color: Colors.grey.shade300,
                              //           width: 1.0,
                              //         ),
                              //       ),
                              //       filled: true,
                              //       fillColor: Colors.white,
                              //       contentPadding: kIsWeb
                              //           ? EdgeInsets.all(2)
                              //           : const EdgeInsets.all(8),
                              //       labelStyle: kIsWeb
                              //           ? TextStyle()
                              //           : appStyle(
                              //               14, kPrimary, FontWeight.bold),
                              //     ),
                              //     keyboardType: TextInputType.number,
                              //   ),
                              // ),
                            ],
                            if (_selectedVehicleType == 'Trailer') ...[
                              SizedBox(height: 16.h),
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
                                  labelText: (_selectedVehicleType == 'Truck' ||
                                          _selectedVehicleType == 'Trailer')
                                      ? 'VIN (Optional)'
                                      : 'VIN (Optional)',
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
                            // SizedBox(height: 16.h),
                            // if (_selectedVehicleType == 'Truck') ...[
                            //   SizedBox(height: 16.h),
                            //   Container(
                            //     margin: kIsWeb
                            //         ? EdgeInsets.symmetric(vertical: 4.0.h)
                            //         : EdgeInsets.symmetric(vertical: 4.0.h),
                            //     decoration: BoxDecoration(
                            //       color: Colors.white,
                            //       borderRadius: kIsWeb
                            //           ? BorderRadius.circular(12.r)
                            //           : BorderRadius.circular(12.0.r),
                            //     ),
                            //     child: TextField(
                            //       controller: _dotController,
                            //       onChanged: (value) {
                            //         _dotController.value = TextEditingValue(
                            //           text: value.toUpperCase(),
                            //           selection: _dotController.selection,
                            //         );
                            //       },
                            //       decoration: InputDecoration(
                            //         labelText: 'DOT (Optional)',
                            //         border: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         focusedBorder: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         enabledBorder: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         filled: true,
                            //         fillColor: Colors.white,
                            //         contentPadding: kIsWeb
                            //             ? EdgeInsets.all(2)
                            //             : const EdgeInsets.all(8),
                            //         labelStyle: kIsWeb
                            //             ? TextStyle()
                            //             : appStyle(
                            //                 14, kPrimary, FontWeight.bold),
                            //       ),
                            //     ),
                            //   ),
                            //   SizedBox(height: 16.h),
                            //   Container(
                            //     margin: kIsWeb
                            //         ? EdgeInsets.symmetric(vertical: 4.0.h)
                            //         : EdgeInsets.symmetric(vertical: 4.0.h),
                            //     decoration: BoxDecoration(
                            //       color: Colors.white,
                            //       borderRadius: kIsWeb
                            //           ? BorderRadius.circular(12.r)
                            //           : BorderRadius.circular(12.0.r),
                            //     ),
                            //     child: TextField(
                            //       controller: _iccmsController,
                            //       onChanged: (value) {
                            //         _iccmsController.value = TextEditingValue(
                            //           text: value.toUpperCase(),
                            //           selection: _iccmsController.selection,
                            //         );
                            //       },
                            //       decoration: InputDecoration(
                            //         labelText: 'ICCMS (Optional)',
                            //         border: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         focusedBorder: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         enabledBorder: OutlineInputBorder(
                            //           borderRadius: BorderRadius.circular(12.0),
                            //           borderSide: BorderSide(
                            //             color: Colors.grey.shade300,
                            //             width: 1.0,
                            //           ),
                            //         ),
                            //         filled: true,
                            //         fillColor: Colors.white,
                            //         contentPadding: kIsWeb
                            //             ? EdgeInsets.all(2)
                            //             : const EdgeInsets.all(8),
                            //         labelStyle: kIsWeb
                            //             ? TextStyle()
                            //             : appStyle(
                            //                 14, kPrimary, FontWeight.bold),
                            //       ),
                            //     ),
                            //   ),
                            // ],
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
                                  labelText: 'License Plate (Optional)',
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
                            if (_selectedVehicleType == 'Truck' ||
                                _selectedVehicleType == 'Trailer') ...[
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
                                        labelText:
                                            'Your Vehicle Year (Optional)',
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
                            ],

                            SizedBox(height: 24.h),
                            CustomButton(
                              text: "Save Vehicle",
                              onPress: () {
                                bool isVinRequired =
                                    _selectedVehicleType != 'Truck' &&
                                        _selectedVehicleType != 'Trailer';
                                bool isYearRequired =
                                    _selectedVehicleType != 'Truck' &&
                                        _selectedVehicleType != 'Trailer';
                                bool isMyCompanyRequired =
                                    _myCompaniesList.isNotEmpty;

                                if (_selectedVehicleType != null &&
                                    _selectedCompany != null &&
                                    _selectedEngineName != null &&
                                    (!isMyCompanyRequired ||
                                        _selectedMyCompanyId != null) &&
                                    _vehicleNumberController.text.isNotEmpty &&
                                    (!isVinRequired ||
                                        _vinController.text.isNotEmpty) &&
                                    (!isYearRequired ||
                                        _selectedYear != null)) {
                                  _saveVehicleData();
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
