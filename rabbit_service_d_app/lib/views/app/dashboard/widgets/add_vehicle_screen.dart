import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'package:csv/csv.dart';

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
  List<Map<String, dynamic>> servicesData = [];
  bool isLoading = true;
  bool isSaving = false;
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

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  // Fetch services data
  Future<void> _fetchServicesData() async {
    try {
      DocumentSnapshot doc = await metadataCollection.doc('servicesData').get();
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

        // Track if we found any matches for this service
        bool foundMatch = false;

        // Check all default values for brand matches
        for (var defaultValue in defaultValues) {
          if (defaultValue['brand'].toString().toLowerCase() ==
              _selectedEngineName?.toLowerCase()) {
            foundMatch = true;
            int notificationValue =
                (int.tryParse(defaultValue['value'].toString()) ?? 0) * 1000;
            // int nextMiles =
            //     notificationValue == 0 ? 0 : currentMiles + notificationValue;
            int nextMiles = notificationValue;
            int defaultNotificationvalues = notificationValue;

            log('Matched dValue - Brand: ${defaultValue['brand']}, Notification Value: $notificationValue, Next Miles: $nextMiles');

            nextNotificationMiles.add({
              'serviceId': serviceId,
              'serviceName': serviceName,
              'defaultNotificationValue': defaultNotificationvalues,
              'nextNotificationValue': nextMiles,
              'subServices':
                  subServices.map((s) => s['sName'].toString()).toList(),
            });
          }
        }

        // If no brand match was found, log it
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
    setState(() {
      isSaving = true;
    });

    try {
      CollectionReference vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
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
        'isSet': true,
        "uploadedDocuments": [],
        'createdAt': FieldValue.serverTimestamp(),
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
                  'serviceId': service['serviceId'],
                  'serviceName': service['serviceName'],
                  'subServices': service['subServices'],
                })
            .toList(),
      };

      if (_selectedVehicleType == 'Truck') {
        vehicleData['currentMiles'] = _currentMilesController.text.toString();
        vehicleData['prevMilesValue'] = _currentMilesController.text.toString();
        vehicleData['firstTimeMiles'] = _currentMilesController.text.toString();
        vehicleData['oilChangeDate'] = '';
        vehicleData['hoursReading'] = '';
        vehicleData['prevHoursReadingValue'] = '';
      }

      if (_selectedVehicleType == 'Trailer') {
        vehicleData['currentMiles'] = '';
        vehicleData['prevMilesValue'] = '';
        vehicleData['firstTimeMiles'] = '';
        vehicleData['oilChangeDate'] = _oilChangeDate != null
            ? DateFormat('yyyy-MM-dd').format(_oilChangeDate!)
            : null;
        vehicleData['hoursReading'] = _hoursReadingController.text.toString();
        vehicleData['prevHoursReadingValue'] =
            _hoursReadingController.text.toString();
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
        'userId': currentUId, // Pass userId
        'vehicleId': vehicleDocRef.id, // Pass the vehicleId
      });

      log("Cloud function called successfully with vehicleId: ${vehicleDocRef.id} and userId: $currentUId");

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

  Future<void> _uploadExcelFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'csv'],
    );

    if (result != null) {
      PlatformFile file = result.files.first;
      var bytes = file.bytes;
      if (bytes != null) {
        var excel = Excel.decodeBytes(bytes);
        for (var table in excel.tables.keys) {
          var sheet = excel.tables[table]!;
          for (var row in sheet.rows) {
            // Assuming the first row contains headers
            if (row[0]?.value.toString() == 'Vehicle Type') {
              setState(() {
                _selectedVehicleType = row[1]?.value.toString();
                _fetchCompanyNames();
              });
            } else if (row[0]?.value.toString() == 'Company Name') {
              setState(() {
                _selectedCompany = row[1]?.value.toString();
                _setupEngineNameListener();
              });
            } else if (row[0]?.value.toString() == 'Engine Name') {
              setState(() {
                _selectedEngineName = row[1]?.value.toString();
              });
            } else if (row[0]?.value.toString() == 'Vehicle Number') {
              _vehicleNumberController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'VIN') {
              _vinController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'DOT') {
              _dotController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'ICCMS') {
              _iccmsController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'License Plate') {
              _licensePlateController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'Year') {
              String year = row[1]!.value.toString();
              if (year.isNotEmpty) {
                _selectedYear = DateTime(int.parse(year), 1, 1);
              }
            } else if (row[0]?.value.toString() == 'Current Miles') {
              _currentMilesController.text = row[1]!.value.toString();
            } else if (row[0]?.value.toString() == 'Oil Change Date') {
              String date = row[1]!.value.toString();
              if (date.isNotEmpty) {
                _oilChangeDate = DateFormat('yyyy-MM-dd').parse(date);
              }
            } else if (row[0]?.value.toString() == 'Hours Reading') {
              _hoursReadingController.text = row[1]!.value.toString();
            }
          }
        }
      }
    } else {
      // User canceled the picker
      showToastMessage('Error', 'No file selected', kRed);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchVehicleTypes();
    _fetchServicesData();
  }

  @override
  void dispose() {
    _engineNameSubscription?.cancel();
    super.dispose();
  }

  // void _showInstructions() {
  //   ScaffoldMessenger.of(context).showSnackBar(
  //     SnackBar(
  //       content: Text('Tap the upload icon to select an Excel file. '
  //           'Ensure the file contains the following fields: '
  //           'Vehicle Type, Company Name, Engine Name, Vehicle Number, '
  //           'VIN, DOT, ICCMS, License Plate, Year, Current Miles, '
  //           'Oil Change Date, Hours Reading.'),
  //       duration: Duration(seconds: 5),
  //     ),
  //   );
  // }

  void _showInstructions(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Select Vehicle Type'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text('Truck'),
                onTap: () {
                  Navigator.of(context).pop();
                  createSampleDocument('Truck');
                },
              ),
              ListTile(
                title: Text('Trailer'),
                onTap: () {
                  Navigator.of(context).pop();
                  createSampleDocument('Trailer');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> createSampleDocument(String vehicleType) async {
    try {
      Directory tempDir = await getTemporaryDirectory();
      String filePath = '${tempDir.path}/sample_${vehicleType.toLowerCase()}.';
      String fileExtension = '';
      List<List<String>> data = [];

      if (vehicleType.toLowerCase() == 'truck') {
        filePath += 'xlsx';
        fileExtension = 'xlsx';
        data = [
          [
            'CompanyName',
            'Engine name',
            'Current Miles*',
            'Vehicle Number*',
            'VIN*',
            'DOT',
            'ICCMS',
            'License Plate*',
            'Year*'
          ],
          [
            'Sample Company',
            'Sample Engine',
            '1000',
            'ABC-1234',
            '1234567890',
            'DOT-123',
            'ICCMS-456',
            'XYZ-5678',
            '2023'
          ],
        ];
        _createExcelFile(filePath, data);
      } else if (vehicleType.toLowerCase() == 'trailer') {
        filePath += 'csv';
        fileExtension = 'csv';
        data = [
          [
            'CompanyName',
            'Engine name',
            'Oil Change Date*',
            'Hours Reading*',
            'Vehicle Number*',
            'VIN*',
            'DOT',
            'ICCMS',
            'License Plate*',
            'Year*'
          ],
          [
            'Sample Trailer Company',
            'Trailer Engine',
            '2023-12-01',
            '500',
            'DEF-5678',
            '0987654321',
            'DOT-789',
            'ICCMS-012',
            'UVW-9012',
            '2022'
          ],
        ];
        _createCsvFile(filePath, data);
      }

      OpenFile.open(filePath);
    } catch (e) {
      print("Error creating sample document: $e");
      // Handle the error (e.g., show a snackbar)
    }
  }

  Future<void> _createExcelFile(
      String filePath, List<List<String>> data) async {
    var excel = Excel.createExcel();
    var sheet = excel.sheets[excel.sheets.keys.first];

    for (int i = 0; i < data.length; i++) {
      for (int j = 0; j < data[i].length; j++) {
        sheet
            ?.cell(CellIndex.indexByColumnRow(columnIndex: j, rowIndex: i))
            .value = data[i][j];
      }
    }

    var fileBytes = excel.save();
    if (fileBytes != null) {
      File(filePath).writeAsBytes(fileBytes);
    }
  }

  Future<void> _createCsvFile(String filePath, List<List<String>> data) async {
    String csv = const ListToCsvConverter().convert(data);
    File(filePath).writeAsString(csv);
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
                            Row(
                              children: [
                                Expanded(
                                  child: CustomButton(
                                    text: "Upload Excel File",
                                    onPress: _uploadExcelFile,
                                    color: kSecondary,
                                  ),
                                ),
                                Container(
                                  margin: EdgeInsets.only(left: 10.w),
                                  decoration: BoxDecoration(
                                    color: kPrimary,
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  child: IconButton(
                                    onPressed: () {
                                      _showInstructions(context);
                                    },
                                    icon: Icon(Icons.question_mark,
                                        color: kWhite),
                                  ),
                                )
                              ],
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
                                        : appStyle(
                                            14, kPrimary, FontWeight.bold),
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
                                        : appStyle(
                                            14, kPrimary, FontWeight.bold),
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
