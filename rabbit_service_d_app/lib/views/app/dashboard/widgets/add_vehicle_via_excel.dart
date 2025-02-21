import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:csv/csv.dart';
import 'dart:io';
import 'package:open_file/open_file.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class AddVehicleViaExcelScreen extends StatefulWidget {
  const AddVehicleViaExcelScreen({super.key});

  @override
  State<AddVehicleViaExcelScreen> createState() =>
      _AddVehicleViaExcelScreenState();
}

class _AddVehicleViaExcelScreenState extends State<AddVehicleViaExcelScreen> {
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
  bool _isProcessing = false; //
  StreamSubscription<DocumentSnapshot>? _engineNameSubscription;
  Map<String, dynamic>? _uploadedData;

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

  Future<void> createSampleDocument(String vehicleType) async {
    try {
      Directory tempDir = await getTemporaryDirectory();
      String filePath =
          '${tempDir.path}/sample_${vehicleType.toLowerCase()}.xlsx';
      List<List<String>> data = [];

      // Common headers for both vehicle types
      List<String> baseHeaders = [
        'Vehicle Type',
        'Company Name',
        'Engine Name',
        'Vehicle Number',
        'VIN',
        'DOT',
        'ICCMS',
        'License Plate',
        'Year'
      ];

      if (vehicleType == 'Truck') {
        data = [
          [...baseHeaders, 'Current Miles'],
          [
            'Truck',
            'Sample Company',
            'Sample Engine',
            'ABC-1234',
            '1234567890',
            'DOT-123',
            'ICCMS-456',
            'XYZ-5678',
            '2023',
            '1000' // Current Miles
          ],
        ];
      } else {
        data = [
          [...baseHeaders, 'Oil Change Date', 'Hours Reading'],
          [
            'Trailer',
            'Sample Trailer Co',
            'Trailer Engine',
            'DEF-5678',
            '0987654321',
            'DOT-789',
            'ICCMS-012',
            'UVW-9012',
            '2022',
            '2023-12-01', // Oil Change Date
            '500' // Hours Reading
          ],
        ];
      }

      await _createExcelFile(filePath, data);
      OpenFile.open(filePath);
    } catch (e) {
      print("Error creating sample: $e");
      showToastMessage(
          'Error', 'Failed to create sample: ${e.toString()}', kRed);
    }
  }

  Future<void> _createExcelFile(
      String filePath, List<List<String>> data) async {
    try {
      var excel = Excel.createExcel();
      var sheet = excel.sheets[excel.sheets.keys.first]!;

      for (int rowIdx = 0; rowIdx < data.length; rowIdx++) {
        final row = data[rowIdx];
        for (int colIdx = 0; colIdx < row.length; colIdx++) {
          sheet
              .cell(CellIndex.indexByColumnRow(
                  columnIndex: colIdx, rowIndex: rowIdx))
              .value = row[colIdx];
        }
      }

      final fileBytes = excel.save();
      if (fileBytes != null) {
        await File(filePath).writeAsBytes(fileBytes);
        log('Sample file created at: $filePath');
      }
    } catch (e) {
      throw Exception('Excel creation failed: ${e.toString()}');
    }
  }

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

  // Replace the existing _uploadExcelFile with this enhanced version
  Future<void> _uploadExcelFile() async {
    setState(() => _isProcessing = true);

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx'], // 🔥 CSV support removed
        allowCompression: true,
      );

      if (result == null) {
        showToastMessage('Cancelled', 'File selection cancelled', kSecondary);
        return;
      }

      final file = result.files.first;
      if (file.extension != 'xlsx') {
        showToastMessage('Invalid File', 'Only XLSX files supported', kRed);
        return;
      }

      final bytes = file.bytes;
      if (bytes == null || bytes.isEmpty) {
        showToastMessage('Error', 'Empty file content', kRed);
        return;
      }

      final excel = Excel.decodeBytes(bytes);
      if (excel.tables.isEmpty) {
        showToastMessage('Error', 'No sheets found in Excel file', kRed);
        return;
      }

      final sheet = excel.tables.values.first;
      final processedData =
          _processExcelSheet(sheet); // 🔥 New processing method

      setState(() {
        _uploadedData = processedData;
        _updateControllersFromData(
            processedData); // 🔥 Centralized data handling
      });

      showToastMessage('Success', 'File processed successfully', kSecondary);
    } catch (e) {
      log('Excel Processing Error: $e');
      showToastMessage(
          'Error', 'Failed to process file: ${e.toString()}', kRed);
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  // 🔥 Add these new helper methods to your state class
  Map<String, dynamic> _processExcelSheet(Sheet sheet) {
    if (sheet.rows.length < 2) {
      throw Exception('Excel file must contain at least one data row');
    }

    final headers = _getSanitizedHeaders(sheet.rows[0]);
    final dataRow = sheet.rows[1];
    final vehicleType = _getVehicleType(dataRow, headers);

    _validateHeaders(headers, vehicleType);
    return _extractVehicleData(dataRow, headers, vehicleType);
  }

  List<String> _getSanitizedHeaders(List<Data?> headerRow) {
    return headerRow
        .map((cell) => cell?.value.toString().trim() ?? '')
        .where((header) => header.isNotEmpty)
        .toList();
  }

  String _getVehicleType(List<Data?> dataRow, List<String> headers) {
    final typeIndex = headers.indexOf('Vehicle Type');
    if (typeIndex == -1 || dataRow.length <= typeIndex) {
      throw Exception('Missing "Vehicle Type" column');
    }
    return dataRow[typeIndex]?.value.toString().trim() ?? '';
  }

  void _validateHeaders(List<String> headers, String vehicleType) {
    final requiredHeaders = {
      'Vehicle Type',
      'Company Name',
      'Engine Name',
      'Vehicle Number',
      'VIN',
      'DOT',
      'ICCMS',
      'License Plate',
      'Year',
      if (vehicleType == 'Truck') 'Current Miles',
      if (vehicleType == 'Trailer') ...['Oil Change Date', 'Hours Reading'],
    };

    final missingHeaders = requiredHeaders.difference(headers.toSet());
    if (missingHeaders.isNotEmpty) {
      throw Exception('Missing required columns: ${missingHeaders.join(', ')}');
    }
  }

  Map<String, dynamic> _extractVehicleData(
    List<Data?> dataRow,
    List<String> headers,
    String vehicleType,
  ) {
    final data = <String, dynamic>{};

    try {
      for (int i = 0; i < headers.length; i++) {
        final header = headers[i];
        final value = dataRow[i]?.value?.toString().trim() ?? '';
        data[header] = value;
      }

      // Special handling for vehicle type-specific fields
      if (vehicleType == 'Truck') {
        data['Current Miles'] = _parseNumber(data['Current Miles']);
      } else if (vehicleType == 'Trailer') {
        data['Oil Change Date'] = _parseDate(data['Oil Change Date']);
        data['Hours Reading'] = _parseNumber(data['Hours Reading']);
      }

      data['Year'] = data['Year'].toString(); // Store year as string
      return data;
    } catch (e) {
      throw Exception('Data extraction failed: ${e.toString()}');
    }
  }

  void _updateControllersFromData(Map<String, dynamic> data) {
    _selectedVehicleType = data['Vehicle Type'];
    _selectedCompany = data['Company Name']?.toString().toUpperCase();
    _selectedEngineName = data['Engine Name']?.toString().toUpperCase();
    _vehicleNumberController.text = data['Vehicle Number'] ?? '';
    _vinController.text = data['VIN'] ?? '';
    _dotController.text = data['DOT'] ?? '';
    _iccmsController.text = data['ICCMS'] ?? '';
    _licensePlateController.text = data['License Plate'] ?? '';

    // Handle year as string instead of DateTime
    final yearString = data['Year']?.toString() ?? '';
    _selectedYear = DateTime.tryParse(yearString);

    if (_selectedVehicleType == 'Truck') {
      _currentMilesController.text = data['Current Miles']?.toString() ?? '';
    } else {
      final oilChangeDate = data['Oil Change Date']?.toString() ?? '';
      _oilChangeDate = DateTime.tryParse(oilChangeDate);
      _hoursReadingController.text = data['Hours Reading']?.toString() ?? '';
    }
  }

  DateTime? _parseDate(String dateString) {
    try {
      return DateFormat('yyyy-MM-dd').parse(dateString);
    } catch (e) {
      log('Invalid date format: $dateString');
      return null;
    }
  }

  int? _parseNumber(String value) {
    try {
      return int.parse(value);
    } catch (e) {
      log('Invalid number format: $value');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Add Vehicle Via Excel",
            style: appStyle(18, kWhite, FontWeight.w500)),
        backgroundColor: kPrimary,
        iconTheme: IconThemeData(color: kWhite),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
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
                    onPressed: () => _showInstructions(context),
                    icon: Icon(Icons.question_mark, color: kWhite),
                  ),
                )
              ],
            ),
            SizedBox(height: 16.h),
            if (_uploadedData != null)
              Expanded(
                child: ListView(
                  padding: EdgeInsets.all(16.w),
                  children: [
                    _buildDataRow(
                        'Vehicle Type', _uploadedData!['Vehicle Type']),
                    _buildDataRow(
                        'Company Name', _uploadedData!['Company Name']),
                    _buildDataRow('Engine Name', _uploadedData!['Engine Name']),
                    _buildDataRow(
                        'Vehicle Number', _uploadedData!['Vehicle Number']),
                    _buildDataRow('VIN', _uploadedData!['VIN']),
                    _buildDataRow('DOT', _uploadedData!['DOT']),
                    _buildDataRow('ICCMS', _uploadedData!['ICCMS']),
                    _buildDataRow(
                        'License Plate', _uploadedData!['License Plate']),
                    _buildDataRow('Year', _uploadedData!['Year']),
                    if (_selectedVehicleType == 'Truck')
                      _buildDataRow(
                          'Current Miles', _uploadedData!['Current Miles'])
                    else ...[
                      _buildDataRow(
                          'Oil Change Date', _uploadedData!['Oil Change Date']),
                      _buildDataRow(
                          'Hours Reading', _uploadedData!['Hours Reading']),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Helper widget to display data rows
  Widget _buildDataRow(String title, String? value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(title, style: appStyle(14, kDark, FontWeight.w500)),
          ),
          Expanded(
            flex: 3,
            child: Text(value ?? 'Not provided',
                style: appStyle(14, kGray, FontWeight.w400)),
          ),
        ],
      ),
    );
  }
}
