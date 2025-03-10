import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:excel/excel.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/download_excel_file.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:url_launcher/url_launcher.dart';

class AddVehicleViaExcelScreen extends StatefulWidget {
  const AddVehicleViaExcelScreen({super.key});

  @override
  State<AddVehicleViaExcelScreen> createState() =>
      _AddVehicleViaExcelScreenState();
}

class _AddVehicleViaExcelScreenState extends State<AddVehicleViaExcelScreen> {
  late final TextEditingController _currentMilesController;

  String? _selectedVehicleType;
  String? _selectedEngineName;
  List<Map<String, dynamic>> servicesData = [];
  bool isLoading = true;
  bool _isBtnEnable = false;
  StreamSubscription<DocumentSnapshot>? _engineNameSubscription;

  //for excel
  List<Map<String, dynamic>> excelData = [];
  bool isParsing = false;
  bool isSaving = false;
  List<String> uploadErrors = [];

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
          log("Services Data $servicesData");
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

  List<Map<String, dynamic>> calculateNextNotificationMiles(int currentMiles) {
    List<Map<String, dynamic>> nextNotificationMiles = [];
     currentMiles = int.tryParse(_currentMilesController.text) ?? 0;

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

  Future<void> saveVehicleFromData(Map<String, dynamic> data) async {
    setState(() {
      isSaving = true;
    });
    try {
      // 1. Extract and validate basic fields
      final vehicleType = data['vehicleType']?.toString().trim();
      final company = data['companyName']?.toString().trim().toUpperCase();
      final engine = data['engineName']?.toString().trim().toUpperCase();
      final vehicleNumber = data['vehicleNumber']?.toString().trim() ?? '';

      if (vehicleType == null || vehicleType.isEmpty) {
        throw 'Missing vehicle type';
      }
      if (company == null || company.isEmpty) {
        throw 'Missing company name';
      }
      if (engine == null || engine.isEmpty) {
        throw 'Missing engine name';
      }
      if (vehicleNumber.isEmpty) {
        throw 'Missing vehicle number';
      }

      // 2. Vehicle type specific validation
      if (vehicleType == 'Truck') {
        if (data['currentMiles']?.toString().isEmpty ?? true) {
          throw 'Truck requires current miles';
        }
      } else if (vehicleType == 'Trailer') {
        if (data['hoursReading']?.toString().isEmpty ?? true) {
          throw 'Trailer requires hours reading';
        }
        if (data['oilChangeDate']?.toString().isEmpty ?? true) {
          throw 'Trailer requires oil change date';
        }
      }

      // 3. Check for existing vehicle
      final duplicateQuery = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .where('vehicleNumber', isEqualTo: vehicleNumber)
          .where('vehicleType', isEqualTo: vehicleType)
          .where('companyName', isEqualTo: company)
          .where('engineName', isEqualTo: engine)
          .get();

      if (duplicateQuery.docs.isNotEmpty) {
        throw 'Vehicle already exists';
      }

      // 4. Parse dates
      DateTime? year;
      DateTime? oilChangeDate;
      final dateFormat = DateFormat('yyyy-MM-dd');

      try {
        if (data['year'] != null) {
          year = dateFormat.parse(data['year'].toString());
        }
        if (vehicleType == 'Trailer' && data['oilChangeDate'] != null) {
          oilChangeDate = dateFormat.parse(data['oilChangeDate'].toString());
        }
      } catch (e) {
        throw 'Invalid date format (use YYYY-MM-DD)';
      }

      // 5. Set class variables for service calculation
      _selectedVehicleType = vehicleType;
      _selectedEngineName = engine;
      // _currentMilesController.text = data['currentMiles']?.toString() ?? '';

      // 6. Calculate notification milestones
      final nextNotificationMiles = calculateNextNotificationMiles(int.parse(data['currentMiles']));

      // 7. Prepare base vehicle data
      final vehicleData = {
        'vehicleType': vehicleType,
        'companyName': company,
        'engineName': engine,
        'vehicleNumber': vehicleNumber,
        'vin': data['vin']?.toString().trim() ?? '',
        'dot': data['dot']?.toString().trim() ?? '',
        'iccms': data['iccms']?.toString().trim() ?? '',
        'licensePlate': data['licensePlate']?.toString().trim() ?? '',
        'year': year != null ? dateFormat.format(year) : null,
        'isSet': true,
        "uploadedDocuments": [],
        'createdAt': FieldValue.serverTimestamp(),
        'currentMilesArray': [
          {
            "miles": vehicleType == 'Truck'
                ? int.parse(data['currentMiles'].toString())
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

      // 8. Add vehicle type specific data
      if (vehicleType == 'Truck') {
        vehicleData.addAll({
          'currentMiles': data['currentMiles'].toString(),
          'prevMilesValue': data['currentMiles'].toString(),
          'firstTimeMiles': data['currentMiles'].toString(),
          'oilChangeDate': '',
          'hoursReading': '',
          'prevHoursReadingValue': '',
        });
      } else {
        vehicleData.addAll({
          'currentMiles': '',
          'prevMilesValue': '',
          'firstTimeMiles': '',
          'oilChangeDate':
              oilChangeDate != null ? dateFormat.format(oilChangeDate) : '',
          'hoursReading': data['hoursReading'].toString(),
          'prevHoursReadingValue': data['hoursReading'].toString(),
        });
      }

      // 9. Save to Firestore
      final docRef = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .add(vehicleData);

      // 10. Update with vehicle ID
      await docRef.update({'vehicleId': docRef.id});

      // 11. Trigger cloud function
      final callable = FirebaseFunctions.instance
          .httpsCallable('checkAndNotifyUserForVehicleService');

      await callable.call({
        'userId': currentUId,
        'vehicleId': docRef.id,
      });

      showToastMessage(
          "Success", "Vehicle Data Uploaded Successfully", kSecondary);
      setState(() {
        isSaving = false;
        excelData = [];
        _isBtnEnable=false;
        _currentMilesController.clear();
      });
    } catch (e) {
      throw 'Error saving vehicle data: ${e.toString()}';
    } finally {
      setState(() {
        isSaving = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchServicesData();
    _currentMilesController = TextEditingController();
  }

  @override
  void dispose() {
    _engineNameSubscription?.cancel();
    _currentMilesController.dispose();
    super.dispose();
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
                  downloadExcelFile(
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_vehicle_data_rabbit_vehicle_type_truck.xlsx?alt=media&token=c1851f45-3865-4052-89f8-0b5d0ab6e02e");
                },
              ),
              ListTile(
                title: Text('Trailer'),
                onTap: () {
                  Navigator.of(context).pop();
                  downloadExcelFile(
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_trailer_vehicle_data_rabbit.xlsx?alt=media&token=9eeed6bc-2d40-4a3d-bcd0-8df5bebaecfa");
                },
              ),
            ],
          ),
        );
      },
    );
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
      body: isSaving
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: CustomButton(
                          text: "Upload Excel File",
                          onPress: () async {
                            FilePickerResult? result =
                                await FilePicker.platform.pickFiles(
                              type: FileType.custom,
                              allowedExtensions: ['xlsx'],
                            );

                            if (result != null) {
                              setState(() => isParsing = true);
                              try {
                                String filePath = result.files.single.path!;
                                var bytes = File(filePath).readAsBytesSync();
                                var excel = Excel.decodeBytes(bytes);
                                var sheet =
                                    excel.tables[excel.tables.keys.first]!;

                                List<String?> headers = sheet.rows[0]
                                    .map((cell) => cell?.value.toString())
                                    .toList();

                                List<Map<String, dynamic>> data = [];
                                for (int i = 1; i < sheet.rows.length; i++) {
                                  var row = sheet.rows[i];
                                  Map<String, dynamic> rowData = {};
                                  for (int j = 0; j < headers.length; j++) {
                                    rowData[headers[j]!] =
                                        row[j]?.value?.toString() ?? '';
                                  }
                                  data.add(rowData);
                                }

                                setState(() {
                                  excelData = data;
                                  _isBtnEnable = data.isNotEmpty;
                                  isParsing = false;
                                });
                              } catch (e) {
                                setState(() => isParsing = false);
                                showToastMessage('Error',
                                    'Failed to parse Excel file: $e', kRed);
                              }
                            }
                          },
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
                  SizedBox(height: 20.h),
                  Expanded(
                    child: isParsing
                        ? Center(child: CircularProgressIndicator())
                        : excelData.isEmpty
                            ? Center(child: Text('No data found.'))
                            : SingleChildScrollView(
                                scrollDirection: Axis.vertical,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    buildDataRow(
                                        "Vehicle Number",
                                        excelData
                                            .map((e) => e['vehicleNumber'])
                                            .toList()),
                                    buildDataRow(
                                        "Type",
                                        excelData
                                            .map((e) => e['vehicleType'])
                                            .toList()),
                                    buildDataRow(
                                        "Company",
                                        excelData
                                            .map((e) => e['companyName'])
                                            .toList()),
                                    buildDataRow(
                                        "Engine",
                                        excelData
                                            .map((e) => e['engineName'])
                                            .toList()),
                                    buildDataRow(
                                        "Miles/Hours",
                                        excelData
                                            .map((e) =>
                                                e['vehicleType'] == 'Truck'
                                                    ? e['currentMiles']
                                                    : e['hoursReading'])
                                            .toList()),
                                    buildDataRow(
                                        "Vin",
                                        excelData
                                            .map((e) => e['vin'])
                                            .toList()),
                                    buildDataRow(
                                        "Dot",
                                        excelData
                                            .map((e) => e['dot'])
                                            .toList()),
                                    buildDataRow(
                                        "Iccms",
                                        excelData
                                            .map((e) => e['iccms'])
                                            .toList()),
                                    buildDataRow(
                                        "License Plate",
                                        excelData
                                            .map((e) => e['licensePlate'])
                                            .toList()),
                                    buildDataRow(
                                        "Year",
                                        excelData
                                            .map((e) => e['year'])
                                            .toList()),
                                  ],
                                ),
                              ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        child: _isBtnEnable
            ? CustomButton(
                text: "Upload",
                onPress: () async {
                  if (excelData.isEmpty) return;
                  setState(() {
                    isSaving = true;
                    uploadErrors.clear();
                  });

                  int successCount = 0;
                  for (var data in excelData) {
                    try {
                      await saveVehicleFromData(data);
                      successCount++;
                    } catch (e) {
                      uploadErrors.add(e.toString());
                    }
                  }

                  setState(() => isSaving = false);
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: Text('Upload Complete'),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Successfully uploaded $successCount vehicles.'),
                          if (uploadErrors.isNotEmpty) ...[
                            SizedBox(height: 16),
                            Text('Errors:',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            ...uploadErrors.map((e) => Text(e)).toList(),
                          ],
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: Navigator.of(ctx).pop,
                          child: Text('OK'),
                        ),
                      ],
                    ),
                  );
                },
                color: kPrimary,
              )
            : SizedBox(),
      ),
    );
  }

  // Function to build each row
  Widget buildDataRow(String title, List<dynamic> values) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 150,
              child:
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold))),
          Expanded(
            child: Wrap(
              spacing: 8.0,
              runSpacing: 4.0,
              children: values.map((value) => Text(value.toString())).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
