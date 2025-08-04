import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:excel/excel.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/download_excel_file.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/custom_container.dart';

class AddVehicleViaExcelScreen extends StatefulWidget {
  const AddVehicleViaExcelScreen({super.key});

  @override
  State<AddVehicleViaExcelScreen> createState() =>
      _AddVehicleViaExcelScreenState();
}

class _AddVehicleViaExcelScreenState extends State<AddVehicleViaExcelScreen> {
  late final TextEditingController _currentMilesController;
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

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

        bool foundMatch = false;

        for (var defaultValue in defaultValues) {
          if (defaultValue['brand'].toString().toLowerCase() ==
              _selectedEngineName?.toLowerCase()) {
            foundMatch = true;

            String type = defaultValue['type']
                .toString()
                .toLowerCase(); // Get type (reading, day, hour)
            int value = int.tryParse(defaultValue['value'].toString()) ?? 0;
            int notificationValue;

            if (type == "reading") {
              notificationValue = value * 1000;
            } else if (type == "day") {
              notificationValue = value;
            } else if (type == "hour") {
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

  // Future<void> saveVehicleFromData(Map<String, dynamic> data) async {
  //   setState(() {
  //     isSaving = true;
  //   });
  //   try {
  //     // 1. Extract and validate basic fields
  //     final vehicleType = data['vehicleType']?.toString().trim();
  //     final company = data['companyName']?.toString().trim().toUpperCase();
  //     final engine = data['engineName']?.toString().trim().toUpperCase();
  //     final vehicleNumber = data['vehicleNumber']?.toString().trim() ?? '';

  //     if (vehicleType == null || vehicleType.isEmpty) {
  //       throw 'Missing vehicle type';
  //     }
  //     if (company == null || company.isEmpty) {
  //       throw 'Missing company name';
  //     }
  //     if (engine == null || engine.isEmpty) {
  //       throw 'Missing engine name';
  //     }
  //     if (vehicleNumber.isEmpty) {
  //       throw 'Missing vehicle number';
  //     }

  //     // 2. Vehicle type specific validation
  //     if (vehicleType == 'Truck') {
  //       if (data['currentMiles']?.toString().isEmpty ?? true) {
  //         throw 'Truck requires current miles';
  //       }
  //     } else if (vehicleType == 'Trailer') {
  //       if (data['hoursReading']?.toString().isEmpty ?? true) {
  //         throw 'Trailer requires hours reading';
  //       }
  //       if (data['oilChangeDate']?.toString().isEmpty ?? true) {
  //         throw 'Trailer requires oil change date';
  //       }
  //     }

  //     // 3. Check for existing vehicle
  //     final duplicateQuery = await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .collection('Vehicles')
  //         .where('vehicleNumber', isEqualTo: vehicleNumber)
  //         .where('vehicleType', isEqualTo: vehicleType)
  //         .where('companyName', isEqualTo: company)
  //         .where('engineName', isEqualTo: engine)
  //         .get();

  //     if (duplicateQuery.docs.isNotEmpty) {
  //       throw 'Vehicle already exists';
  //     }

  //     // 4. Parse dates
  //     DateTime? year;
  //     DateTime? oilChangeDate;
  //     final dateFormat = DateFormat('yyyy-MM-dd');

  //     try {
  //       if (data['year'] != null) {
  //         year = dateFormat.parse(data['year'].toString());
  //       }
  //       if (vehicleType == 'Trailer' && data['oilChangeDate'] != null) {
  //         oilChangeDate = dateFormat.parse(data['oilChangeDate'].toString());
  //       }
  //     } catch (e) {
  //       throw 'Invalid date format (use YYYY-MM-DD)';
  //     }

  //     // 5. Set class variables for service calculation
  //     _selectedVehicleType = vehicleType;
  //     _selectedEngineName = engine;
  //     // _currentMilesController.text = data['currentMiles']?.toString() ?? '';

  //     final nextNotificationMiles = vehicleType == "Truck"
  //         ? calculateNextNotificationMiles(int.parse(data['currentMiles']))
  //         : calculateNextNotificationMiles(int.parse(data['hoursReading']));

  //     // 7. Prepare base vehicle data
  //     final vehicleData = {
  //       'active': true,
  //       'firstTimeVehicle': true,
  //       'tripAssign': false,
  //       'vehicleType': vehicleType,
  //       'companyName': company,
  //       'engineName': engine,
  //       'vehicleNumber': vehicleNumber,
  //       'vin': data['vin']?.toString().trim() ?? '',
  //       'dot': data['dot']?.toString().trim() ?? 'RB123',
  //       'iccms': data['iccms']?.toString().trim() ?? 'RB123',
  //       'licensePlate': data['licensePlate']?.toString().trim() ?? '',
  //       'year': year != null ? dateFormat.format(year) : null,
  //       'isSet': true,
  //       "uploadedDocuments": [],
  //       'createdAt': FieldValue.serverTimestamp(),
  //       'currentMilesArray': [
  //         {
  //           "miles": vehicleType == 'Truck'
  //               ? int.parse(data['currentMiles'].toString())
  //               : 0,
  //           "date": DateTime.now().toIso8601String()
  //         }
  //       ],
  //       'nextNotificationMiles': nextNotificationMiles,
  //       'services': nextNotificationMiles
  //           .map((service) => {
  //                 'defaultNotificationValue':
  //                     service['defaultNotificationValue'],
  //                 'nextNotificationValue': service['nextNotificationValue'],
  //                 'preValue': service['defaultNotificationValue'],
  //                 'serviceId': service['serviceId'],
  //                 'serviceName': service['serviceName'],
  //                 'type': service['type'],
  //                 'subServices': service['subServices'],
  //               })
  //           .toList(),
  //     };

  //     // 8. Add vehicle type specific data
  //     if (vehicleType == 'Truck') {
  //       vehicleData.addAll({
  //         'currentMiles': data['currentMiles'].toString(),
  //         'prevMilesValue': data['currentMiles'].toString(),
  //         'firstTimeMiles': data['currentMiles'].toString(),
  //         'oilChangeDate': '2025-04-12',
  //         'hoursReading': '',
  //         'prevHoursReadingValue': '',
  //         'hoursReadingArray': [],
  //       });
  //     } else {
  //       vehicleData.addAll({
  //         'currentMiles': '',
  //         'prevMilesValue': '',
  //         'firstTimeMiles': '',
  //         'oilChangeDate':
  //             oilChangeDate != null ? dateFormat.format(oilChangeDate) : '',
  //         'hoursReading': data['hoursReading'] != null
  //             ? data['hoursReading'].toString()
  //             : '',
  //         'prevHoursReadingValue': data['hoursReading'] != null
  //             ? data['hoursReading'].toString()
  //             : '',
  //       });
  //     }

  //     // 9. Save to Firestore
  //     final docRef = await FirebaseFirestore.instance
  //         .collection('Users')
  //         .doc(currentUId)
  //         .collection('Vehicles')
  //         .add(vehicleData);

  //     // 10. Update with vehicle ID
  //     await docRef.update({'vehicleId': docRef.id});

  //     // 11. Trigger cloud function
  //     final callable = FirebaseFunctions.instance
  //         .httpsCallable('checkAndNotifyUserForVehicleService');

  //     await callable.call({
  //       'userId': currentUId,
  //       'vehicleId': docRef.id,
  //     });

  //     setState(() {
  //       isSaving = false;
  //       excelData = [];
  //       _isBtnEnable = false;
  //       _currentMilesController.clear();
  //     });
  //   } catch (e, stackTrace) {
  //     print('❌ Error saving vehicle data: $e');
  //     print('🔍 Stack Trace: $stackTrace');
  //     throw 'Error saving vehicle data: ${e.toString()}';
  //   } finally {
  //     setState(() {
  //       isSaving = false;
  //     });
  //   }
  // }

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
        // Set default values for trailer if not provided
        data['hoursReading'] = data['hoursReading']?.toString() ?? '1000';
        data['dot'] = data['dot']?.toString() ?? 'RB123';
        data['iccms'] = data['iccms']?.toString() ?? 'RB123';

        // Set oil change date to current date if not provided
        final currentDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
        data['oilChangeDate'] =
            data['oilChangeDate']?.toString() ?? currentDate;
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

      final nextNotificationMiles = vehicleType == "Truck"
          ? calculateNextNotificationMiles(int.parse(data['currentMiles']))
          : calculateNextNotificationMiles(int.parse(data['hoursReading']));

      // 7. Prepare base vehicle data
      final vehicleData = {
        'active': true,
        'firstTimeVehicle': true,
        'tripAssign': false,
        'vehicleType': vehicleType,
        'companyName': company,
        'engineName': engine,
        'vehicleNumber': vehicleNumber,
        'vin': data['vin']?.toString().trim() ?? '',
        'dot': data['dot']?.toString().trim() ?? 'RB123', // Default for trailer
        'iccms':
            data['iccms']?.toString().trim() ?? 'RB123', // Default for trailer
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
                  'preValue': service['defaultNotificationValue'],
                  'serviceId': service['serviceId'],
                  'serviceName': service['serviceName'],
                  'type': service['type'],
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
          'oilChangeDate': '2025-04-12',
          'hoursReading': '',
          'prevHoursReadingValue': '',
          'hoursReadingArray': [],
        });
      } else {
        // For trailer
        final oilChangeDateStr = oilChangeDate != null
            ? dateFormat.format(oilChangeDate)
            : DateFormat('yyyy-MM-dd').format(DateTime.now());

        vehicleData.addAll({
          'currentMiles': '',
          'prevMilesValue': '',
          'firstTimeMiles': '',
          'oilChangeDate': oilChangeDateStr,
          'hoursReading': data['hoursReading']?.toString() ?? '1000',
          'prevHoursReadingValue': data['hoursReading']?.toString() ?? '1000',
          'hoursReadingArray': [
            {
              "hours": int.parse(
                  data['hoursReading']?.toString() ?? 1000.toString()),
              "date": DateTime.now().toIso8601String()
            }
          ],
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

      setState(() {
        isSaving = false;
        excelData = [];
        _isBtnEnable = false;
        _currentMilesController.clear();
      });
    } catch (e, stackTrace) {
      print('❌ Error saving vehicle data: $e');
      print('🔍 Stack Trace: $stackTrace');
      throw 'Error saving vehicle data: ${e.toString()}';
    } finally {
      setState(() {
        isSaving = false;
      });
    }
  }

  Future<void> uploadMultipleVehicles(
      List<Map<String, dynamic>> vehiclesData) async {
    setState(() {
      isSaving = true;
      uploadErrors.clear();
    });

    int successCount = 0;

    for (var vehicleData in vehiclesData) {
      try {
        await saveVehicleFromData(vehicleData);
        successCount++;
      } catch (e) {
        uploadErrors.add(
            'Failed to upload vehicle ${vehicleData['vehicleNumber']}: $e');
        log('Error uploading vehicle: $e');
      }
    }

    setState(() => isSaving = false);

    if (uploadErrors.isEmpty) {
      showToastMessage(
        "Success",
        "$successCount vehicle(s) uploaded successfully",
        kSecondary,
      );
    } else {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(uploadErrors.length == vehiclesData.length
              ? 'Upload Failed'
              : 'Partial Success'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                  'Successfully uploaded $successCount out of ${vehiclesData.length} vehicles.'),
              if (uploadErrors.isNotEmpty) ...[
                SizedBox(height: 16),
                Text('Errors:', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(
                  height: 150,
                  child: SingleChildScrollView(
                    child: Column(
                      children: uploadErrors
                          .map((e) => Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 4),
                                child: Text(e,
                                    style: TextStyle(color: Colors.red)),
                              ))
                          .toList(),
                    ),
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('OK'),
            ),
          ],
        ),
      );
    }

    if (successCount > 0) {
      setState(() {
        excelData = [];
        _isBtnEnable = false;
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
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_vehicle_data_rabbit_vehicle_type_truck.xlsx?alt=media&token=01e2f94e-6f57-45c4-a32c-64b9c8856a3f");
                },
              ),
              ListTile(
                title: Text('Trailer'),
                onTap: () {
                  Navigator.of(context).pop();
                  downloadExcelFile(
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_trailer_vehicle_data_rabbit.xlsx?alt=media&token=e76d4dce-31fa-4051-9f3a-7bf851ce8d9c");
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
        title: Text("Import Vehicle",
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
                  CustomContainerBox(
                    color: kLightWhite,
                    borderColor: kPrimary.withOpacity(0.3),
                    height: 120,
                    child: Column(
                      children: [
                        Text("Upload Excel File",
                            style: appStyle(17, kDark, FontWeight.normal)),
                        SizedBox(height: 5.h),
                        Divider(),
                        SizedBox(height: 5.h),
                        CustomButton(
                          text: "Select Excel File",
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
                      ],
                    ),
                  ),
                  SizedBox(height: 20.h),

                  //Download Sample Excel Files
                  _isBtnEnable
                      ? SizedBox()
                      : CustomContainerBox(
                          color: kLightWhite,
                          borderColor: kPrimary.withOpacity(0.3),
                          child: Column(
                            children: [
                              Text("Sample Excel Files",
                                  style:
                                      appStyle(17, kDark, FontWeight.normal)),
                              SizedBox(height: 5.h),
                              Divider(),
                              SizedBox(height: 5.h),
                              buildTextAndBtnRow("Vehicles Excel",
                                  () => _showInstructions(context)),
                              buildTextAndBtnRow(
                                  "Truck Companies and Engine names", () {
                                downloadExcelFile(
                                    "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/truck_company_name_and_engine_name_1_may.xlsx?alt=media&token=49408842-98d9-4ecf-9761-22e7aac16fe1");
                              }),
                              buildTextAndBtnRow(
                                  "Trailer Companies and Engine names", () {
                                downloadExcelFile(
                                    "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/trailer_company_name_and_engine_name_1_may.xlsx?alt=media&token=0593d7e7-24bd-4b57-b85c-4f6543e8d564");
                              }),
                            ],
                          ),
                        ),

                  SizedBox(height: 20.h),

                  Expanded(
                    child: isParsing
                        ? Center(child: CircularProgressIndicator())
                        : excelData.isEmpty
                            ? Center(child: Text(''))
                            : SingleChildScrollView(
                                scrollDirection: Axis.vertical,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    buildDataRow(
                                        "Vehicle Number",
                                        excelData
                                            .map(
                                                (e) => e['vehicleNumber'] ?? '')
                                            .toList()),
                                    buildDataRow(
                                        "Type",
                                        excelData
                                            .map((e) => e['vehicleType'] ?? '')
                                            .toList()),
                                    buildDataRow(
                                        "Company",
                                        excelData
                                            .map((e) => e['companyName'] ?? '')
                                            .toList()),
                                    buildDataRow(
                                        "Engine",
                                        excelData
                                            .map((e) => e['engineName'] ?? '')
                                            .toList()),
                                    // Only show Miles/Hours for trucks
                                    if (excelData.any(
                                        (e) => e['vehicleType'] == 'Truck'))
                                      buildDataRow(
                                          "Miles",
                                          excelData
                                              .map((e) =>
                                                  e['currentMiles'] ?? '')
                                              .toList()),
                                    buildDataRow(
                                        "Vin",
                                        excelData
                                            .map((e) => e['vin'] ?? '')
                                            .toList()),
                                    // Only show Dot for trucks
                                    if (excelData.any(
                                        (e) => e['vehicleType'] == 'Truck'))
                                      buildDataRow(
                                          "Dot",
                                          excelData
                                              .map((e) => e['dot'] ?? '')
                                              .toList()),
                                    // Only show Iccms for trucks
                                    if (excelData.any(
                                        (e) => e['vehicleType'] == 'Truck'))
                                      buildDataRow(
                                          "Iccms",
                                          excelData
                                              .map((e) => e['iccms'] ?? '')
                                              .toList()),
                                    buildDataRow(
                                        "License Plate",
                                        excelData
                                            .map((e) => e['licensePlate'] ?? '')
                                            .toList()),
                                    buildDataRow(
                                        "Year",
                                        excelData
                                            .map((e) => e['year'] ?? '')
                                            .toList()),
                                  ],
                                ),
                              ),
                  ),

                  Container(
                    child: _isBtnEnable
                        ? CustomButton(
                            text: "Upload",
                            onPress: () async {
                              if (excelData.isEmpty) return;
                              await uploadMultipleVehicles(excelData);
                            },
                            color: kPrimary,
                          )
                        : SizedBox(),
                  ),
                  SizedBox(height: MediaQuery.of(context).size.height * 0.10),
                ],
              ),
            ),
      // bottomNavigationBar: Container(
      //   child: _isBtnEnable
      //       ? CustomButton(
      //           text: "Upload",
      //           onPress: () async {
      //             if (excelData.isEmpty) return;
      //             await uploadMultipleVehicles(excelData);
      //           },
      //           color: kPrimary,
      //         )
      //       : SizedBox(),
      // ),
    );
  }

  Widget buildTextAndBtnRow(String text, void Function()? onPressed) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SizedBox(
            width: 200.w,
            child: Text(
              text,
              maxLines: 2,
              style: appStyle(12, kDark, FontWeight.w500),
            ),
          ),
          ElevatedButton.icon(
            onPressed: onPressed,
            label: Text("Download"),
            icon: Icon(Icons.download, color: kWhite),
            style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: kPrimary,
                foregroundColor: kWhite,
                minimumSize: Size(50.w, 35)),
          ),
        ],
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
