import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/generate_pdf.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/cloud_noti_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_via_excel.dart';
import 'package:regal_service_d_app/views/app/profile/profile_screen.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/miles_details_screen.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/records_details_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:multi_select_flutter/multi_select_flutter.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  User? get currentUser => FirebaseAuth.instance.currentUser;
  String get currentUId => currentUser?.uid ?? '';

  // State variables
  String? selectedVehicle;
  Set<String> selectedPackages = {};
  String? selectedRecordsVehicle;
  Set<String> selectedServices = {};
  Map<String, List<String>> selectedSubServices = {};
  Map<String, int> serviceDefaultValues = {};
  final TextEditingController milesController = TextEditingController();
  final TextEditingController todayMilesController = TextEditingController();
  final TextEditingController hoursController = TextEditingController();
  final TextEditingController workshopController = TextEditingController();
  final TextEditingController invoiceController = TextEditingController();
  final TextEditingController invoiceAmountController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController serviceSearchController = TextEditingController();
  final TextEditingController vehicleSearchController = TextEditingController();
  final TextEditingController dateSearchController = TextEditingController();
  DateTime? selectedDate;
  DateTime? _originalRecordDate;
  late TabController _tabController;

  bool showAddRecords = false;
  bool showSearchFilter = false;
  bool showAddMiles = false;
  bool showVehicleSearch = false;
  bool showServiceSearch = false;
  bool showDateSearch = false;
  bool showCombinedSearch = false;
  bool showRecordFilter = false;
  bool showInvoiceSearch = false;

  //for records access
  bool? isView;
  bool? isEdit;
  bool? isAdd;
  bool? isDelete;
  bool isEditing = false;
  String? editingRecordId;
  late String role = "";
  bool isAnonymous = true;
  bool isProfileComplete = false;
  File? image;
  String? _existingImageUrl;

  // Define a new variable to track the selected filter option
  String? selectedFilterOption;

  // Data storage
  final List<Map<String, dynamic>> vehicles = [];
  final List<Map<String, dynamic>> services = [];
  final List<Map<String, dynamic>> records = [];
  final List<Map<String, dynamic>> milesToAddInRecords = [];
  final List<Map<String, dynamic>> packages = [];

  // Stream subscriptions
  late StreamSubscription vehiclesSubscription;
  late StreamSubscription recordsSubscription;
  late StreamSubscription servicesSubscription;
  late StreamSubscription milesSubscription;
  late StreamSubscription packagesSubscription;
  late StreamSubscription usersSubscription;
  String selectedVehicleType = 'Truck';

  // Selected data
  Map<String, dynamic>? selectedVehicleData;
  List<Map<String, dynamic>> selectedServiceData = [];

  // Search and filter variables
  String filterVehicle = '';
  String filterService = '';
  String filterMiles = '';
  String filterInvoice = '';
  DateTime? startDate;
  DateTime? endDate;

  // For invoice summary
  DateTime? summaryStartDate;
  DateTime? summaryEndDate;

  // For Vehicle wise invoice summary
  bool showVehicleFilter = false;
  Set<String> selectedSummaryVehicles = {};
  String summaryVehicleTypeFilter = 'All'; // 'All', 'Truck', or 'Trailer'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    initializeStreams();
    if (isAnonymous == true || isProfileComplete == false) {
      showAddRecords = true;
    }
  }

  void initializeStreams() {
    //setup users stream
    usersSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final userData = snapshot.data();
        if (userData != null) {
          setState(() {
            isView = userData['isView'];
            isEdit = userData['isEdit'];
            isAdd = userData['isAdd'];
            isDelete = userData['isDelete'];
            role = userData['role'];
            isAnonymous = userData['isAnonymous'] ?? true;
            isProfileComplete = userData['isProfileComplete'] ?? false;
          });
        }
      }
    });

    // Setup vehicle stream
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection("Vehicles")
        .where("active", isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        debugPrint('No vehicles found for user');
        return;
      }

      setState(() {
        vehicles.clear();
        vehicles
            .addAll(snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
      debugPrint('Fetched ${vehicles.length} vehicles');
    });

    // Setup services stream
    servicesSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('serviceData')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final servicesData = snapshot.data()?['data'] as List<dynamic>?;
        if (servicesData != null) {
          setState(() {
            services.clear();
            List<Map<String, dynamic>> sortedServices = servicesData
                .map((service) => {
                      'sId': service['sId'],
                      'sName': service['sName'],
                      'vType': service['vType'],
                      'dValues': service['dValues'],
                      'subServices': service['subServices'] ?? [],
                      'pName': service['pName'] ?? [],
                    })
                .toList();

            sortedServices.sort((a, b) =>
                (a['sName'] as String).compareTo(b['sName'] as String));

            services.addAll(sortedServices);
            updateServiceDefaultValues();
          });
        }
      }
    });

    // Setup records stream
    recordsSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('DataServices')
        .where('active', isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      setState(() {
        records.clear();
        records.addAll(snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
              'vehicle': doc['vehicleDetails']['companyName']
            }));

        // Update showAddRecords based on whether we have any records
        showAddRecords = snapshot.docs.isEmpty;
      });
      debugPrint('Fetched ${records.length} records');
    });

    // Setup miles stream
    milesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('DataServices')
        .snapshots()
        .listen((snapshot) {
      setState(() {
        milesToAddInRecords.clear();
        milesToAddInRecords.addAll(snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
            }));
      });
    });

    // Listen to the servicePackages stream
    packagesSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('nServicesPackages')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final List<dynamic>? packagesData =
            snapshot.data()?['data']; // Fetch data
        if (packagesData != null) {
          setState(() {
            packages.clear();
            for (var package in packagesData) {
              if (package is Map<String, dynamic>) {
                packages.add({
                  'name': package['name'] ?? '',
                  'type': package['type'] ?? [],
                });
              }
            }
            log("Updated Packages: $packages");
          });
        }
      }
    });
  }

  List<Map<String, dynamic>> reorderServicesBasedOnPackages() {
    if (selectedPackages.isEmpty) {
      return services; // No packages selected, return original order
    }

    // Separate services that belong to any selected package from remaining services
    final selectedPackageServices = services.where((service) {
      // Check if any of the package names in the 'pName' list match the selected packages
      return (service['pName'] as List)
          .any((packageName) => selectedPackages.contains(packageName));
    }).toList();

    final remainingServices = services.where((service) {
      // Check if none of the package names in the 'pName' list match the selected packages
      return !(service['pName'] as List)
          .any((packageName) => selectedPackages.contains(packageName));
    }).toList();

    // Combine selected and remaining services
    return [...selectedPackageServices, ...remainingServices];
  }

  List<Map<String, dynamic>> getFilteredRecords() {
    return records.where((record) {
      // Vehicle filter
      final vehicleMatch =
          selectedVehicle == null || record['vehicleId'] == selectedVehicle;

      // Service filter
      final serviceMatch = filterService.isEmpty ||
          (record['services'] as List).any((service) => service['serviceName']
              .toString()
              .toLowerCase()
              .contains(filterService.toLowerCase()));

      // Date range filter
      final recordDate = DateTime.parse(record['date']);
      final dateMatch = startDate == null ||
          endDate == null ||
          (recordDate.isAfter(startDate!) &&
              recordDate.isBefore(
                  endDate!.add(Duration(days: 1)))); // Include end date

      // Invoice filter
      final invoiceMatch = filterInvoice.isEmpty ||
          (record['invoice']?.toString().toLowerCase() ?? '')
              .contains(filterInvoice.toLowerCase());

      return vehicleMatch && serviceMatch && dateMatch && invoiceMatch;
    }).toList()
      ..sort((a, b) {
        final dateA = DateTime.parse(a['date']);
        final dateB = DateTime.parse(b['date']);
        return dateB.compareTo(dateA); // Newest first
      });
  }

  void updateServiceDefaultValues() {
    if (selectedVehicle == null || selectedServices.isEmpty) return;

    // Get vehicle document to check for service-specific defaults
    FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('Vehicles')
        .doc(selectedVehicle)
        .get()
        .then((vehicleDoc) {
      final vehicleServices =
          List<Map<String, dynamic>>.from(vehicleDoc.data()?['services'] ?? []);

      setState(() {
        serviceDefaultValues.clear();

        for (var serviceId in selectedServices) {
          // Check if vehicle has a default for this service
          final vehicleService = vehicleServices.firstWhere(
            (vs) => vs['serviceId'] == serviceId,
            orElse: () => {},
          );

          if (vehicleService.isNotEmpty &&
              vehicleService['defaultNotificationValue'] != null) {
            // Use vehicle-specific default value directly (don't multiply by 1000)
            serviceDefaultValues[serviceId] =
                vehicleService['defaultNotificationValue'] is int
                    ? vehicleService['defaultNotificationValue']
                    : int.tryParse(vehicleService['defaultNotificationValue']
                            .toString()) ??
                        0;
            continue;
          }

          // Fall back to metadata default calculation
          final selectedService = services.firstWhere(
            (service) => service['sId'] == serviceId,
            orElse: () => <String, dynamic>{},
          );

          if (selectedService.isEmpty) continue;

          final dValues = selectedService['dValues'] as List<dynamic>?;
          if (dValues != null) {
            for (var dValue in dValues) {
              if (dValue['brand'].toString().toUpperCase() ==
                  selectedVehicleData?['engineName'].toString().toUpperCase()) {
                String type = dValue['type'].toString().toLowerCase();
                int value =
                    int.tryParse(dValue['value'].toString().split(',')[0]) ?? 0;
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

                serviceDefaultValues[serviceId] = notificationValue;
                break;
              }
            }
          }
        }
      });
    }).catchError((error) {
      debugPrint('Error fetching vehicle document: $error');
    });
  }

  void updateSelectedVehicleAndService() {
    if (selectedVehicle != null) {
      selectedVehicleData = vehicles.firstWhere(
        (vehicle) => vehicle['id'] == selectedVehicle,
        orElse: () => <String, dynamic>{},
      );
    }

    selectedServiceData = reorderServicesBasedOnPackages()
        .where((service) => selectedServices.contains(service['sId']))
        .toList();

    serviceDefaultValues.clear();

    for (var service in selectedServiceData) {
      final dValues = service['dValues'] as List<dynamic>?;

      if (dValues != null) {
        for (var dValue in dValues) {
          if (dValue['brand'].toString().toUpperCase() ==
              selectedVehicleData?['engineName'].toString().toUpperCase()) {
            String type = dValue['type'].toString().toLowerCase();
            int value =
                int.tryParse(dValue['value'].toString().split(',')[0]) ?? 0;
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

            serviceDefaultValues[service['sId']] = notificationValue;
            break;
          }
        }
      }
    }

    setState(() {});
  }

  void getImage(ImageSource source, BuildContext context) async {
    final pickedFile = await ImagePicker().pickImage(
      source: source,
      imageQuality: 50,
    );

    setState(() {
      image = pickedFile != null ? File(pickedFile.path) : null;
    });
  }

  //=============================== Image Uploader =====================================
  void showImageSourceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Select Image Source'),
          actions: <Widget>[
            TextButton(
              child: Text('Camera'),
              onPressed: () {
                Navigator.of(context).pop();
                getImage(ImageSource.camera, context);
              },
            ),
            TextButton(
              child: Text('Gallery'),
              onPressed: () {
                Navigator.of(context).pop();
                getImage(ImageSource.gallery, context);
              },
            ),
            TextButton(
              child: Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> handleSaveRecords() async {
    try {
      if (!_validateMandatoryFields()) {
        return;
      }

      String? imageUrl;

      // Upload images to Firebase Storage
      if (image != null) {
        String fileName =
            DateTime.now().millisecondsSinceEpoch.toString() + '.jpg';
        Reference storageRef = FirebaseStorage.instance
            .ref()
            .child('service_images')
            .child(fileName);

        UploadTask uploadTask = storageRef.putFile(image!);
        imageUrl = await (await uploadTask).ref.getDownloadURL();
      } else if (isEditing && _existingImageUrl != null) {
        imageUrl = _existingImageUrl;
      }

      // Subservice validation check
      for (var serviceId in selectedServices) {
        final service = services.firstWhere(
          (s) => s['sId'] == serviceId,
          orElse: () => {},
        );

        if (service.isNotEmpty) {
          final hasSubServices = service.containsKey('subServices') &&
              (service['subServices'] as List).isNotEmpty;

          final selectedSubServiceList = selectedSubServices[serviceId] ?? [];

          if (hasSubServices && selectedSubServiceList.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    'Please select at least one subservice for ${service['sName']}'),
              ),
            );
            return;
          }
        }
      }

      final dataServicesRef =
          FirebaseFirestore.instance.collection("DataServicesRecords");
      final docId = isEditing ? editingRecordId! : dataServicesRef.doc().id;

      final currentMiles = int.tryParse(milesController.text) ?? 0;
      final currentHours = int.tryParse(hoursController.text) ?? 0;

      // Get vehicle document to check for service-specific defaults
      final vehicleDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .doc(selectedVehicle)
          .get();

      final vehicleServices =
          List<Map<String, dynamic>>.from(vehicleDoc.data()?['services'] ?? []);

      List<Map<String, dynamic>> servicesData = [];
      List<Map<String, dynamic>> notificationData = [];
      Map<String, dynamic> serviceDetailsMap = {};

      for (var serviceId in selectedServices) {
        final service = services.firstWhere(
          (s) => s['sId'] == serviceId,
          orElse: () => {},
        );

        if (service.isEmpty) continue;

        // Check if vehicle has a default value for this service
        final vehicleService = vehicleServices.firstWhere(
          (vs) => vs['serviceId'] == serviceId,
          orElse: () => {},
        );

        String type = "reading";
        int defaultValue = 0;
        DateTime? nextNotificationDate;

        // Priority 1: Use vehicle-specific default if available
        if (vehicleService.isNotEmpty &&
            vehicleService['defaultNotificationValue'] != null) {
          type = vehicleService['type']?.toString().toLowerCase() ?? "reading";
          defaultValue = vehicleService['defaultNotificationValue'] is int
              ? vehicleService['defaultNotificationValue']
              : int.tryParse(
                      vehicleService['defaultNotificationValue'].toString()) ??
                  0;
        }
        // Priority 2: Fall back to metadata defaults
        else {
          final engineName =
              selectedVehicleData?['engineName'].toString().toUpperCase();
          final dValues = service['dValues'] as List<dynamic>;
          final matchingDValue = dValues.firstWhere(
            (dv) => dv['brand'].toString().toUpperCase() == engineName,
            orElse: () => null,
          );

          if (matchingDValue != null) {
            type =
                (matchingDValue['type'] ?? 'reading').toString().toLowerCase();
            defaultValue = serviceDefaultValues[serviceId] ?? 0;
          }
        }

        String formattedDate = '';
        int nextNotificationValue = 0;

        if (defaultValue > 0) {
          if (type == 'reading') {
            nextNotificationValue = currentMiles + defaultValue;
          } else if (type == 'day') {
            final baseDate = selectedDate ?? DateTime.now();
            final nextDate = baseDate.add(Duration(days: defaultValue));
            formattedDate = DateFormat('dd/MM/yyyy').format(nextDate);
            nextNotificationValue = nextDate.millisecondsSinceEpoch;
          } else if (type == 'hours') {
            //hour to hours because in database we store hours
            nextNotificationValue = currentHours + defaultValue;
          }
        }

        // Store details for vehicle update
        serviceDetailsMap[serviceId] = {
          'type': type,
          'defaultValue': defaultValue,
          "nextNotificationValue":
              type == 'day' ? formattedDate : nextNotificationValue,
          'formattedDate': formattedDate,
          'serviceName': service['sName'],
          'subServices': selectedSubServices[serviceId],
        };

        servicesData.add({
          "serviceId": serviceId,
          "serviceName": service['sName'],
          "type": type,
          "defaultNotificationValue": defaultValue,
          "nextNotificationValue":
              type == 'day' ? formattedDate : nextNotificationValue,
          "subServices": selectedSubServices[serviceId]
                  ?.map((subService) => {
                        "name": subService,
                        "id": "${serviceId}_${subService.replaceAll(' ', '_')}"
                      })
                  .toList() ??
              [],
        });

        notificationData.add({
          "serviceName": service['sName'],
          "type": type,
          "nextNotificationValue":
              type == 'day' ? formattedDate : nextNotificationValue,
          "subServices": selectedSubServices[serviceId] ?? [],
        });
      }

      final formattedDate = selectedDate != null
          ? DateFormat('yyyy-MM-dd').format(selectedDate!)
          : null;
      final recordData = {
        "active": true,
        "userId": currentUId,
        "vehicleId": selectedVehicle,
        "imageUrl": imageUrl,
        "vehicleDetails": {
          ...selectedVehicleData!,
          "currentMiles": currentMiles.toString(),
          "nextNotificationMiles": notificationData,
        },
        "services": servicesData,
        "invoice": invoiceController.text,
        "invoiceAmount": invoiceAmountController.text,
        "description": descriptionController.text.toString(),
        "miles": isEditing
            ? currentMiles
            : selectedVehicleData?['vehicleType'] == "Truck" &&
                    selectedServiceData.any((s) => s['vType'] == "Truck")
                ? int.parse(currentMiles.toString())
                : 0,
        "hours": isEditing
            ? int.tryParse(hoursController.text) ?? 0
            : selectedVehicleData?['vehicleType'] == "Trailer" &&
                    selectedServiceData.any((s) => s['vType'] == "Trailer")
                ? int.tryParse(hoursController.text) ?? 0
                : 0,
        "date": formattedDate,
        "workshopName": workshopController.text,
        "createdAt": DateTime.now().toIso8601String(),
        "updatedAt": DateFormat('yyyy-MM-dd').format(DateTime.now()),
        "addedFrom": Platform.isAndroid
            ? "Android"
            : Platform.isIOS
                ? "iOS"
                : "N/A",
      };

      // Get current user data to determine if we're a team member
      final currentUserDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      final isTeamMember = currentUserDoc.data()?['isTeamMember'] == true;
      final ownerUid =
          (isTeamMember == true && currentUserDoc.data()?['createdBy'] != null)
              ? currentUserDoc.data()!['createdBy']
              : currentUId;

      final batch = FirebaseFirestore.instance.batch();

      // Save to owner's DataServices collection
      final ownerDataServicesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(ownerUid)
          .collection('DataServices');
      batch.set(ownerDataServicesRef.doc(docId), recordData);

      // Query all team members under this owner
      final teamMembersSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: ownerUid)
          .where('isTeamMember', isEqualTo: true)
          .get();

      // Save to all team members who have this vehicle
      for (final doc in teamMembersSnapshot.docs) {
        final teamMemberUid = doc.id;
        final vehicleSnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(teamMemberUid)
            .collection('Vehicles')
            .doc(selectedVehicle)
            .get();

        if (vehicleSnapshot.exists) {
          final teamMemberDataServicesRef = FirebaseFirestore.instance
              .collection('Users')
              .doc(teamMemberUid)
              .collection('DataServices');
          batch.set(teamMemberDataServicesRef.doc(docId), recordData);
        }
      }

      // If current user is team member, also save to their own collection
      if (isTeamMember && currentUId != ownerUid) {
        final currentUserDataServicesRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('DataServices');
        batch.set(currentUserDataServicesRef.doc(docId), recordData);
      }

      // Prepare list of user IDs whose vehicles need updating
      List<String> userIdsToUpdate = [ownerUid];

      // Add current user if they're a team member
      if (isTeamMember && currentUId != ownerUid) {
        userIdsToUpdate.add(currentUId);
      }

      // Add all team members who have this vehicle
      for (final doc in teamMembersSnapshot.docs) {
        final teamMemberUid = doc.id;
        if (teamMemberUid != currentUId) {
          // already added current user if needed
          final vehicleSnapshot = await FirebaseFirestore.instance
              .collection('Users')
              .doc(teamMemberUid)
              .collection('Vehicles')
              .doc(selectedVehicle)
              .get();
          if (vehicleSnapshot.exists) {
            userIdsToUpdate.add(teamMemberUid);
          }
        }
      }

      // Update vehicles for all relevant users
      for (final userId in userIdsToUpdate) {
        final userVehicleRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(userId)
            .collection('Vehicles')
            .doc(selectedVehicle);

        final vehicleSnapshot = await userVehicleRef.get();
        if (vehicleSnapshot.exists) {
          Map<String, dynamic> vehicleData = vehicleSnapshot.data() ?? {};
          List<dynamic> updatedVehicleServices =
              List.from(vehicleData['services'] ?? []);

          for (var serviceId in selectedServices) {
            final serviceInfo = serviceDetailsMap[serviceId];
            if (serviceInfo == null) continue;

            final type = serviceInfo['type'];
            final defaultValue = serviceInfo['defaultValue'];
            final nextNotificationValue = serviceInfo['nextNotificationValue'];
            final formattedDate = serviceInfo['formattedDate'];
            final serviceName = serviceInfo['serviceName'];
            final subServices = serviceInfo['subServices'];

            int index = updatedVehicleServices
                .indexWhere((s) => s['serviceId'] == serviceId);

            if (index != -1) {
              // Update existing service
              updatedVehicleServices[index] = {
                ...updatedVehicleServices[index],
                'nextNotificationValue':
                    type == 'day' ? formattedDate : nextNotificationValue,
                'type': type,
                'defaultNotificationValue': defaultValue,
                'subServices': (subServices as List<dynamic>?)
                        ?.map((subService) => {
                              "name": subService.toString(),
                              "id":
                                  "${serviceId}_${subService.toString().replaceAll(' ', '_')}"
                            })
                        .toList() ??
                    [],
              };
            } else {
              // Add new service
              updatedVehicleServices.add({
                'serviceId': serviceId,
                'serviceName': serviceName,
                'nextNotificationValue':
                    type == 'day' ? formattedDate : nextNotificationValue,
                'type': type,
                'defaultNotificationValue': defaultValue,
                'subServices': (subServices as List<dynamic>?)
                        ?.map((subService) => {
                              "name": subService.toString(),
                              "id":
                                  "${serviceId}_${subService.toString().replaceAll(' ', '_')}"
                            })
                        .toList() ??
                    [],
              });
            }
          }

          batch.update(userVehicleRef, {
            'updatedAt': FieldValue.serverTimestamp(),
            'services': updatedVehicleServices,
            'currentMiles': currentMiles.toString(),
            'currentMilesArray': FieldValue.arrayUnion([
              {"miles": currentMiles, "date": DateTime.now().toIso8601String()}
            ]),
            'nextNotificationMiles': notificationData,
          });
        }
      }

      await batch.commit();
      resetForm();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isEditing
              ? 'Record updated successfully'
              : 'Record saved successfully'),
        ),
      );
    } catch (e, stackTrace) {
      debugPrint('Error Saving records: ${e.toString()}');
      debugPrint(stackTrace.toString());

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving records: ${e.toString()}')),
      );
    }
  }

  void _handleEditRecord(Map<String, dynamic> record) {
    setState(() {
      isEditing = true;
      editingRecordId = record['id'];
      _originalRecordDate = DateTime.parse(record['date']);
      selectedVehicle = record['vehicleId'];
      selectedVehicleData = record['vehicleDetails'];

      // Initialize serviceDefaultValues from vehicle services first
      if (record['vehicleDetails']['services'] != null) {
        final vehicleServices = List<Map<String, dynamic>>.from(
            record['vehicleDetails']['services']);

        serviceDefaultValues.clear();
        for (var service in record['services']) {
          String serviceId = service['serviceId'];
          final vehicleService = vehicleServices.firstWhere(
            (vs) => vs['serviceId'] == serviceId,
            orElse: () => {},
          );

          if (vehicleService.isNotEmpty &&
              vehicleService['defaultNotificationValue'] != null) {
            serviceDefaultValues[serviceId] =
                vehicleService['defaultNotificationValue'] is int
                    ? vehicleService['defaultNotificationValue']
                    : int.tryParse(vehicleService['defaultNotificationValue']
                            .toString()) ??
                        0;
          } else {
            serviceDefaultValues[serviceId] =
                service['defaultNotificationValue'] ?? 0;
          }
        }
      }

      selectedServices.clear();
      selectedSubServices.clear();
      for (var service in record['services']) {
        String serviceId = service['serviceId'];
        selectedServices.add(serviceId);
        if (service['subServices'] != null) {
          selectedSubServices[serviceId] = (service['subServices'] as List)
              .map<String>((sub) => sub['name'].toString())
              .toList();
        }
      }

      if (record['imageUrl'] != null) {
        if (record['imageUrl'] is String) {
          image = null; // Clear the File object
          _existingImageUrl = record['imageUrl']; // Store the URL separately
        } else if (record['imageUrl'] is File) {
          // It's a new File that hasn't been uploaded yet
          image = record['imageUrl'] as File;
          _existingImageUrl = null;
        }
      } else {
        image = null;
        _existingImageUrl = null;
      }

      milesController.text = record['miles'].toString();
      hoursController.text = record['hours'].toString();
      workshopController.text = record['workshopName'] ?? '';
      invoiceController.text = record['invoice'] ?? '';
      invoiceAmountController.text = record['invoiceAmount']?.toString() ?? '';
      descriptionController.text = record['description'] ?? '';
      selectedDate = DateTime.parse(record['date']);
      showAddRecords = true;
    });
  }

  Map<String, double> calculateInvoiceTotals() {
    double totalInvoiceAmount = 0;
    double truckTotal = 0;
    double trailerTotal = 0;
    double otherTotal = 0;

    final filteredRecords = getFilteredRecords();

    for (final record in filteredRecords) {
      final recordDate = DateTime.parse(record['date']);
      final amount =
          double.tryParse(record['invoiceAmount']?.toString() ?? '0') ?? 0;
      final vehicleId = record['vehicleId'];
      final vehicleType = record['vehicleDetails']['vehicleType'];

      // Check date range if filters are set
      final isWithinDateRange =
          (summaryStartDate == null || recordDate.isAfter(summaryStartDate!)) &&
              (summaryEndDate == null ||
                  recordDate.isBefore(summaryEndDate!.add(Duration(days: 1))));

      // Check vehicle type filter
      final matchesVehicleType = summaryVehicleTypeFilter == 'All' ||
          vehicleType == summaryVehicleTypeFilter;

      // Check specific vehicle selection
      final matchesVehicleSelection = selectedSummaryVehicles.isEmpty ||
          selectedSummaryVehicles.contains(vehicleId);

      if (isWithinDateRange &&
          amount > 0 &&
          matchesVehicleType &&
          matchesVehicleSelection) {
        totalInvoiceAmount += amount;

        if (vehicleType == 'Truck') {
          truckTotal += amount;
        } else if (vehicleType == 'Trailer') {
          trailerTotal += amount;
        } else {
          otherTotal += amount;
        }
      }
    }

    return {
      'total': totalInvoiceAmount,
      'truck': truckTotal,
      'trailer': trailerTotal,
      'other': otherTotal,
    };
  }

  bool _validateMandatoryFields() {
    if (selectedVehicle == null) {
      showToastMessage("Error", "Please select a vehicle", kRed);
      return false;
    }

    if (selectedServices.isEmpty) {
      showToastMessage("Error", "Please select at least one service", kRed);
      return false;
    }

    if (milesController.text.isEmpty &&
        selectedVehicleData?['vehicleType'] == "Truck") {
      showToastMessage("Error", "Please enter miles", kRed);
      return false;
    }

    if (hoursController.text.isEmpty &&
        selectedVehicleData?['vehicleType'] == "Trailer") {
      showToastMessage("Error", "Please enter hours", kRed);
      return false;
    }

    if (selectedDate == null) {
      showToastMessage("Error", "Please select a date", kRed);
      return false;
    }

    return true;
  }

  String normalizeString(String value) {
    // Convert to lowercase and remove spaces
    return value.toLowerCase().replaceAll(RegExp(r'\s+'), '');
  }

  @override
  Widget build(BuildContext context) {
    final filteredRecords = getFilteredRecords();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: kWhite,
        elevation: 1,
        centerTitle: true,
        title: Image.asset(
          'assets/new_rabbit_logo.png',
          height: 50.h,
        ),
        actions: [
          if (currentUser != null) buildNotificationBadge(),
          if (currentUser != null) SizedBox(width: 10.w),
          currentUser == null
              ? CircleAvatar(
                  radius: 19.r,
                  backgroundColor: kPrimary,
                  child: Icon(Icons.person, color: kWhite),
                )
              : buildProfileAvatar(),
          SizedBox(width: 20.w),
        ],
      ),
      body: isView == true
          ? RefreshIndicator(
              onRefresh: _refreshPage,
              child: SingleChildScrollView(
                child: Padding(
                  padding: EdgeInsets.all(10.0.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Search Record Add Miles Button Section

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          // Removed PopupMenuButton
                          buildCustomRowButton(Icons.search, "Search", kPrimary,
                              () {
                            if (currentUser == null) {
                              showLoginPrompt();
                              return;
                            }

                            setState(() {
                              showSearchFilter = !showSearchFilter;
                              showAddRecords = false;
                              showAddMiles = false;
                              showVehicleSearch = true;
                            });
                          }),
                          buildCustomRowButton(Icons.add, "Records", kSecondary,
                              () {
                            if (currentUser == null) {
                              showLoginPrompt();
                              return;
                            }
                            //firstly clear the filters if any are applied
                            resetFilters();

                            if (isAdd == true) {
                              setState(() {
                                showAddRecords = !showAddRecords;
                                showSearchFilter = false;
                                showAddMiles = false;
                              });
                            } else {
                              showToastMessage("Alert!",
                                  "Sorry you don't have access", kPrimary);
                            }
                          }),
                          buildCustomRowButton(Icons.add, "Miles", kPrimary,
                              () {
                            if (currentUser == null) {
                              showLoginPrompt();
                              return;
                            }

                            if (isAdd == true || isView == true) {
                              setState(() {
                                showAddMiles = !showAddMiles;
                                showSearchFilter = false;
                                showAddRecords = false;
                              });
                            } else {
                              showToastMessage("Alert!",
                                  "Sorry you don't have access", kPrimary);
                            }
                          }),
                        ],
                      ),

                      // Search & Filter Section
                      if (showSearchFilter) ...[
                        SizedBox(height: 10.h),
                        Card(
                          elevation: 4,
                          child: Padding(
                            padding: EdgeInsets.all(16.0.w),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Search & Filter',
                                        style: appStyleUniverse(
                                            18, kDark, FontWeight.normal)),

                                    // Filter Icon
                                    IconButton(
                                      icon: Icon(Icons.filter_list,
                                          color: kPrimary),
                                      onPressed: () {
                                        // Show popup with options for filtering
                                        showDialog(
                                          context: context,
                                          builder: (context) {
                                            return AlertDialog(
                                              title: Text('Filter Options'),
                                              content: Column(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  ListTile(
                                                    title: Text(
                                                        'Search by Vehicle'),
                                                    onTap: () {
                                                      // Handle search by vehicle

                                                      setState(() {
                                                        showCombinedSearch =
                                                            false;
                                                        showVehicleSearch =
                                                            true;
                                                        showServiceSearch =
                                                            false;
                                                        showDateSearch = false;
                                                        showInvoiceSearch =
                                                            false;
                                                        filterService = '';
                                                        startDate = null;
                                                        endDate = null;
                                                      });
                                                      Navigator.of(context)
                                                          .pop();
                                                    },
                                                  ),
                                                  ListTile(
                                                    title: Text(
                                                        'Search by Service'),
                                                    onTap: () {
                                                      setState(() {});
                                                      // Handle search by service
                                                      setState(() {
                                                        showCombinedSearch =
                                                            false;
                                                        showVehicleSearch =
                                                            false;
                                                        showServiceSearch =
                                                            true;
                                                        showDateSearch = false;
                                                        showInvoiceSearch =
                                                            false;
                                                        filterVehicle = '';
                                                        startDate = null;
                                                        endDate = null;
                                                      });
                                                      Navigator.of(context)
                                                          .pop();
                                                    },
                                                  ),
                                                  ListTile(
                                                    title:
                                                        Text('Search by Date'),
                                                    onTap: () {
                                                      setState(() {
                                                        showCombinedSearch =
                                                            false;
                                                        showVehicleSearch =
                                                            false;
                                                        showServiceSearch =
                                                            false;
                                                        showDateSearch = true;
                                                        showInvoiceSearch =
                                                            false;
                                                        filterVehicle = '';
                                                        filterService = '';
                                                      });
                                                      // Handle search by date
                                                      Navigator.of(context)
                                                          .pop();
                                                    },
                                                  ),
                                                  ListTile(
                                                      title: Text(
                                                          'Search by Invoice'),
                                                      onTap: () {
                                                        setState(() {
                                                          showCombinedSearch =
                                                              false;
                                                          showVehicleSearch =
                                                              false;
                                                          showServiceSearch =
                                                              false;
                                                          showDateSearch =
                                                              false;
                                                          showInvoiceSearch =
                                                              true;
                                                          filterVehicle = '';
                                                          filterService = '';
                                                          startDate = null;
                                                          endDate = null;
                                                        });
                                                        Navigator.of(context)
                                                            .pop();
                                                      }),
                                                  ListTile(
                                                      title: Text('Search All'),
                                                      onTap: () {
                                                        setState(() {
                                                          showCombinedSearch =
                                                              true;
                                                          showVehicleSearch =
                                                              false;
                                                          showServiceSearch =
                                                              false;
                                                          showDateSearch =
                                                              false;
                                                          showInvoiceSearch =
                                                              false;
                                                          filterVehicle = '';
                                                          filterService = '';
                                                          startDate = null;
                                                          endDate = null;
                                                        });
                                                        Navigator.of(context)
                                                            .pop();
                                                      }),
                                                ],
                                              ),
                                              actions: [
                                                TextButton(
                                                  onPressed: () {
                                                    Navigator.of(context).pop();
                                                  },
                                                  child: Text('Close'),
                                                ),
                                              ],
                                            );
                                          },
                                        );
                                      },
                                    ),
                                  ],
                                ),
                                SizedBox(height: 16.h),
                                if (showVehicleSearch || showCombinedSearch)
                                  DropdownButtonFormField<String>(
                                    hint: const Text('Select Vehicle'),
                                    items: (vehicles
                                          ..sort((a, b) => a['vehicleNumber']
                                              .toString()
                                              .toLowerCase()
                                              .compareTo(b['vehicleNumber']
                                                  .toString()
                                                  .toLowerCase())))
                                        .map((vehicle) {
                                      return DropdownMenuItem<String>(
                                        value: vehicle['id'],
                                        child: Text(
                                          '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                          style: appStyleUniverse(
                                              13, kDark, FontWeight.normal),
                                        ),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      setState(() {
                                        selectedVehicle = value;
                                        selectedServices.clear();
                                        updateSelectedVehicleAndService();
                                      });
                                    },
                                  ),
                                SizedBox(height: 16.h),
                                if (showInvoiceSearch || showCombinedSearch)
                                  TextField(
                                    decoration: InputDecoration(
                                      labelText: 'Search by Invoice',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      prefixIcon:
                                          Icon(Icons.receipt, color: kPrimary),
                                    ),
                                    onChanged: (value) {
                                      setState(() {
                                        filterInvoice = value;
                                      });
                                    },
                                  ),
                                SizedBox(height: 16.h),
                                if ((showVehicleSearch || showCombinedSearch) &&
                                    (showServiceSearch || showDateSearch))
                                  SizedBox(height: 16.h),
                                if (showServiceSearch || showCombinedSearch)
                                  DropdownButtonFormField<String>(
                                    decoration: InputDecoration(
                                      labelText: 'Search by Service',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      prefixIcon:
                                          Icon(Icons.build, color: kPrimary),
                                    ),
                                    items: services.map((service) {
                                      return DropdownMenuItem<String>(
                                        value: service['sName'],
                                        child: Text(
                                          service['sName'],
                                          style: appStyleUniverse(
                                              14, kDark, FontWeight.normal),
                                        ),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      setState(() {
                                        filterService = value ?? '';
                                      });
                                    },
                                    value: filterService.isEmpty
                                        ? null
                                        : filterService,
                                    hint: Text(
                                      'Select Service',
                                      style: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                    ),
                                  ),
                                SizedBox(height: 16.h),
                                if ((showServiceSearch || showCombinedSearch) &&
                                    showDateSearch)
                                  SizedBox(height: 16.h),
                                if (showDateSearch || showCombinedSearch) ...[
                                  Row(
                                    children: [
                                      Expanded(
                                        child: InkWell(
                                          onTap: () async {
                                            final DateTime? picked =
                                                await showDatePicker(
                                              context: context,
                                              initialDate:
                                                  startDate ?? DateTime.now(),
                                              firstDate: DateTime(2000),
                                              lastDate: DateTime(2100),
                                            );
                                            if (picked != null) {
                                              setState(() {
                                                startDate = picked;
                                              });
                                            }
                                          },
                                          child: InputDecorator(
                                            decoration: InputDecoration(
                                              labelText: 'Start Date',
                                              labelStyle: appStyleUniverse(
                                                  14, kDark, FontWeight.normal),
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                              prefixIcon: Icon(
                                                  Icons.calendar_today,
                                                  color: kPrimary),
                                            ),
                                            child: Text(
                                              startDate != null
                                                  ? DateFormat('MM-dd-yyyy')
                                                      .format(startDate!)
                                                  : 'Select Start Date',
                                            ),
                                          ),
                                        ),
                                      ),
                                      SizedBox(width: 16.w),
                                      Expanded(
                                        child: InkWell(
                                          onTap: () async {
                                            final DateTime? picked =
                                                await showDatePicker(
                                              context: context,
                                              initialDate:
                                                  endDate ?? DateTime.now(),
                                              firstDate: DateTime(2000),
                                              lastDate: DateTime(2100),
                                            );
                                            if (picked != null) {
                                              setState(() {
                                                endDate = picked;
                                              });
                                            }
                                          },
                                          child: InputDecorator(
                                            decoration: InputDecoration(
                                              labelText: 'End Date',
                                              labelStyle: appStyleUniverse(
                                                  14, kDark, FontWeight.normal),
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                              prefixIcon: Icon(
                                                  Icons.calendar_today,
                                                  color: kPrimary),
                                            ),
                                            child: Text(
                                              endDate != null
                                                  ? DateFormat('MM-dd-yyyy')
                                                      .format(endDate!)
                                                  : 'Select End Date',
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                SizedBox(height: 16.h),
                                CustomButton(
                                    text: "Clear",
                                    onPress: resetFilters,
                                    color: kPrimary),
                                SizedBox(height: 16.h),
                              ],
                            ),
                          ),
                        ),
                      ],

                      if (showAddRecords) ...[
                        SizedBox(height: 10.h),
                        Card(
                          elevation: 4,
                          child: Padding(
                            padding: EdgeInsets.all(8.0.w),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Vehicle Dropdown
                                Row(
                                  children: [
                                    Expanded(
                                      child: DropdownButtonFormField<String>(
                                        value: selectedVehicle,
                                        hint: const Text('Select Vehicle'),
                                        items: (vehicles
                                              ..sort((a, b) =>
                                                  a['vehicleNumber']
                                                      .toString()
                                                      .toLowerCase()
                                                      .compareTo(
                                                          b['vehicleNumber']
                                                              .toString()
                                                              .toLowerCase())))
                                            .map((vehicle) {
                                          return DropdownMenuItem<String>(
                                            value: vehicle['id'],
                                            child: Text(
                                              '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                              style: appStyleUniverse(
                                                  14, kDark, FontWeight.normal),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          );
                                        }).toList(),
                                        onChanged: (value) {
                                          setState(() {
                                            selectedVehicle = value;
                                            selectedServices.clear();
                                            selectedPackages.clear();
                                            updateSelectedVehicleAndService();
                                          });
                                        },
                                      ),
                                    ),
                                    if (role == "Owner")
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(left: 8.0),
                                        child: InkWell(
                                          onTap: () {
                                            if (isAnonymous == true ||
                                                isProfileComplete == false) {
                                              showToastMessage(
                                                  "Incomplete Profile",
                                                  "Please Create an account or login with existing account",
                                                  kRed);
                                            } else {
                                              showDialog(
                                                context: context,
                                                builder:
                                                    (BuildContext context) {
                                                  return AlertDialog(
                                                    title: Text(
                                                        "Choose an option"),
                                                    content: Column(
                                                      mainAxisSize:
                                                          MainAxisSize.min,
                                                      children: [
                                                        ListTile(
                                                          leading: Icon(Icons
                                                              .directions_car),
                                                          title: Text(
                                                              "Add Vehicle"),
                                                          onTap: () {
                                                            Navigator.push(
                                                              context,
                                                              MaterialPageRoute(
                                                                builder:
                                                                    (context) =>
                                                                        AddVehicleScreen(),
                                                              ),
                                                            );
                                                          },
                                                        ),
                                                        ListTile(
                                                          leading: Icon(Icons
                                                              .upload_file),
                                                          title: Text(
                                                              "Import Vehicle"),
                                                          onTap: () {
                                                            Navigator.pop(
                                                                context);
                                                            Navigator.push(
                                                              context,
                                                              MaterialPageRoute(
                                                                builder:
                                                                    (context) =>
                                                                        AddVehicleViaExcelScreen(),
                                                              ),
                                                            );
                                                          },
                                                        ),
                                                      ],
                                                    ),
                                                  );
                                                },
                                              );
                                            }
                                          },
                                          child: CircleAvatar(
                                            backgroundColor: kWhite,
                                            child: Icon(Icons.add,
                                                color: kPrimary),
                                          ),
                                        ),
                                      )
                                  ],
                                ),

                                SizedBox(height: 10.h),
                                // Select Package (Multiple Selection)

                                if (selectedVehicle != null &&
                                    selectedVehicleData?['vehicleType'] ==
                                        'Truck') ...[
                                  Text("Select Packages",
                                      style: appStyleUniverse(
                                          16, kDark, FontWeight.normal)),
                                  MultiSelectDialogField(
                                    dialogHeight: 300,
                                    items: packages.where((package) {
                                      List<String>? vehicleTypes =
                                          selectedVehicleData?['vehicleType']
                                              .toString()
                                              .toLowerCase()
                                              .split('/');

                                      List<String> packageTypes = List<
                                              String>.from(package['type'])
                                          .map((t) => t.toLowerCase())
                                          .toList(); // Convert package types to lowercase

                                      return packageTypes.any((type) =>
                                          vehicleTypes!.contains(
                                              type)); // Check if any type matches
                                    }).map((package) {
                                      return MultiSelectItem<String>(
                                        package[
                                            'name'], // Display the package name
                                        package['name'], // Label in dropdown
                                      );
                                    }).toList(),
                                    initialValue: selectedPackages.toList(),
                                    title: Text("Select Packages"),
                                    selectedColor: kSecondary,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.grey),
                                    ),
                                    buttonIcon: Icon(Icons.arrow_drop_down),
                                    buttonText: Text("Choose Packages"),
                                    separateSelectedItems: false,
                                    onConfirm: (values) {
                                      setState(() {
                                        selectedPackages =
                                            Set<String>.from(values);
                                        selectedServices.clear();

                                        for (var selectedPackage
                                            in selectedPackages) {
                                          String normalizedPackage =
                                              normalizeString(selectedPackage);

                                          for (var service in services) {
                                            if (service['pName'] != null &&
                                                service['pName'].isNotEmpty) {
                                              for (var packageName
                                                  in service['pName']) {
                                                if (normalizeString(
                                                        packageName) ==
                                                    normalizedPackage) {
                                                  selectedServices
                                                      .add(service['sId']);

                                                  // Automatically select subservices if they exist
                                                  if (service['subServices'] !=
                                                      null) {
                                                    for (var subService
                                                        in service[
                                                            'subServices']) {
                                                      List<String>
                                                          subServiceNames =
                                                          List<String>.from(
                                                              subService[
                                                                      'sName'] ??
                                                                  []);
                                                      for (var subServiceName
                                                          in subServiceNames) {
                                                        if (subServiceName
                                                            .isNotEmpty) {
                                                          selectedSubServices[
                                                              service[
                                                                  'sId']] ??= [];
                                                          selectedSubServices[
                                                                  service[
                                                                      'sId']]!
                                                              .add(
                                                                  subServiceName);
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                        updateSelectedVehicleAndService();
                                      });
                                    },
                                  ),
                                ],

                                SizedBox(height: 10.h),

                                // Services Selection with Search
                                Text('Select Services',
                                    style: appStyleUniverse(
                                        16, kDark, FontWeight.w500)),
                                SizedBox(height: 8.h),

                                // Search Bar for Services
                                SizedBox(
                                  height: 40.h,
                                  child: TextField(
                                    controller: serviceSearchController,
                                    decoration: InputDecoration(
                                      labelText: 'Search Services',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                            color: Colors.grey.shade400),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                        borderSide: BorderSide(
                                            color: kPrimary, width: 1),
                                      ),
                                      prefixIcon:
                                          Icon(Icons.search, color: kPrimary),
                                      filled: true,
                                      fillColor: Colors.grey.shade50,
                                    ),
                                    onChanged: (value) {
                                      setState(() {});
                                    },
                                  ),
                                ),
                                SizedBox(height: 8.h),

                                Wrap(
                                  spacing: 4.w,
                                  runSpacing: 4.h,
                                  children: services.where((service) {
                                    final searchTerm = serviceSearchController
                                        .text
                                        .toLowerCase();
                                    final matchesSearch = searchTerm.isEmpty ||
                                        service['sName']
                                            .toString()
                                            .toLowerCase()
                                            .contains(searchTerm);
                                    final matchesVehicleType =
                                        selectedVehicleData == null ||
                                            service['vType'] ==
                                                selectedVehicleData?[
                                                    'vehicleType'];

                                    return matchesSearch && matchesVehicleType;
                                  }).map((service) {
                                    bool isSelected = selectedServices
                                        .contains(service['sId']);
                                    return buildServiceChip(
                                        service, isSelected);
                                  }).toList(),
                                ),

                                SizedBox(height: 10.h),

                                if (selectedVehicleData?['vehicleType'] ==
                                    "Truck")
                                  SizedBox(
                                    height: 40.h,
                                    child: TextField(
                                      controller: milesController,
                                      decoration: const InputDecoration(
                                        labelText: 'Miles',
                                        border: OutlineInputBorder(),
                                      ),
                                      keyboardType: TextInputType.number,
                                    ),
                                  ),

                                if (selectedVehicleData?['vehicleType'] ==
                                    "Trailer") ...[
                                  SizedBox(
                                    height: 40.h,
                                    child: TextField(
                                      controller: hoursController,
                                      decoration: const InputDecoration(
                                        labelText: 'Hours',
                                        border: OutlineInputBorder(),
                                      ),
                                      keyboardType: TextInputType.number,
                                    ),
                                  ),
                                  SizedBox(height: 10.h),
                                ],
                                SizedBox(height: 10.h),

                                InkWell(
                                  onTap: () async {
                                    final DateTime? picked =
                                        await showDatePicker(
                                      context: context,
                                      initialDate:
                                          selectedDate ?? DateTime.now(),
                                      firstDate: DateTime(2000),
                                      lastDate: DateTime(2100),
                                    );
                                    if (picked != null) {
                                      setState(() {
                                        selectedDate = picked;
                                      });
                                    }
                                  },
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
                                          : 'Select Date',
                                    ),
                                  ),
                                ),

                                SizedBox(height: 10.h),

                                // Workshop Name
                                SizedBox(
                                  height: 40.h,
                                  child: TextField(
                                    controller: workshopController,
                                    decoration: InputDecoration(
                                      labelText: 'Workshop Name',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                SizedBox(height: 10.h),
                                // SizedBox(
                                //   height: 40.h,
                                //   child: TextField(
                                //     controller: invoiceController,
                                //     decoration: InputDecoration(
                                //       labelText: 'Invoice Number (Optional)',
                                //       labelStyle: appStyleUniverse(
                                //           14, kDark, FontWeight.normal),
                                //       border: OutlineInputBorder(),
                                //     ),
                                //     keyboardType: TextInputType.streetAddress,
                                //   ),
                                // ),

                                SizedBox(
                                  height: 60.h,
                                  child: TextField(
                                    controller: invoiceController,
                                    decoration: InputDecoration(
                                      labelText: 'Invoice Number (Optional)',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(),
                                      // counterText:
                                      //     '${invoiceController.text.length}/10',
                                    ),
                                    maxLength: 10,
                                    keyboardType: TextInputType.text,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.allow(
                                          RegExp(r'[a-zA-Z0-9]')),
                                    ],
                                    onChanged: (value) {
                                      setState(
                                          () {}); // Refresh to update counter
                                    },
                                  ),
                                ),
                                // Text(
                                //   'Max 10 characters (letters and numbers only)',
                                //   style: appStyleUniverse(
                                //       12, kDarkGray, FontWeight.normal),
                                // ),
                                SizedBox(height: 10.h),

                                SizedBox(
                                  height: 40.h,
                                  child: TextField(
                                    controller: invoiceAmountController,
                                    decoration: InputDecoration(
                                      labelText: 'Invoice Amount (Optional)',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                                SizedBox(height: 10.h),
                                SizedBox(
                                  height: 40.h,
                                  child: TextField(
                                    controller: descriptionController,
                                    decoration: InputDecoration(
                                      labelText: 'Description (Optional)',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.text,
                                  ),
                                ),
                                SizedBox(height: 10.h),
                                GestureDetector(
                                  onTap: () => showImageSourceDialog(context),
                                  child: Container(
                                    height: 40.h,
                                    width: double.maxFinite,
                                    alignment: Alignment.centerLeft,
                                    decoration: BoxDecoration(
                                        border: Border.all(
                                            color: kSecondary.withOpacity(0.1)),
                                        color: kWhite,
                                        borderRadius:
                                            BorderRadius.circular(12.r)),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text("Upload Images"),
                                        SizedBox(width: 20.w),
                                        Icon(Icons.upload_file, color: kDark),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(height: 10.h),

                                // image section
                                // if (image != null)
                                //   Container(
                                //     width: 80.w,
                                //     height: 80.h,
                                //     decoration: BoxDecoration(
                                //       borderRadius: BorderRadius.circular(12.r),
                                //       image: DecorationImage(
                                //         image: FileImage(image!),
                                //         fit: BoxFit.cover,
                                //       ),
                                //     ),
                                //   ),

                                // image section
                                if (image != null)
                                  Container(
                                    width: 80.w,
                                    height: 80.h,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12.r),
                                      image: DecorationImage(
                                        image: FileImage(image!),
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  )
                                else if (_existingImageUrl != null)
                                  Container(
                                    width: 80.w,
                                    height: 80.h,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12.r),
                                      image: DecorationImage(
                                        image: NetworkImage(_existingImageUrl!),
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),

                                // Save Button
                                Row(
                                  mainAxisAlignment: isEditing
                                      ? MainAxisAlignment.spaceBetween
                                      : MainAxisAlignment.center,
                                  children: [
                                    CustomButton(
                                      height: isEditing ? 45 : 45,
                                      width: isEditing ? 100 : 220.w,
                                      onPress: () {
                                        if (isAdd == true) {
                                          handleSaveRecords();
                                        } else {
                                          showToastMessage(
                                              "Alert!",
                                              "Sorry you don't have access",
                                              kPrimary);
                                        }
                                      },
                                      color: kSecondary,
                                      text: isEditing
                                          ? 'Update Record'
                                          : 'Save Record',
                                    ),
                                    isEditing
                                        ? CustomButton(
                                            width: 80,
                                            text: "Cancel",
                                            onPress: () => resetForm(),
                                            color: kPrimary)
                                        : SizedBox(),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      if (showAddMiles) ...[
                        SizedBox(height: 10.h),
                        Card(
                          elevation: 4,
                          child: Padding(
                            padding: EdgeInsets.all(16.0.w),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Vehicle Dropdown
                                currentUser == null
                                    ? AbsorbPointer(
                                        child: DropdownButtonFormField<String>(
                                          hint: Text('Login to select vehicle'),
                                          items: [],
                                          onChanged: null,
                                        ),
                                      )
                                    : DropdownButtonFormField<String>(
                                        value: selectedVehicle,
                                        hint: const Text('Select Vehicle'),
                                        items: (vehicles
                                              ..sort((a, b) =>
                                                  a['vehicleNumber']
                                                      .toString()
                                                      .toLowerCase()
                                                      .compareTo(
                                                          b['vehicleNumber']
                                                              .toString()
                                                              .toLowerCase())))
                                            .map((vehicle) {
                                          return DropdownMenuItem<String>(
                                            value: vehicle['id'],
                                            child: Text(
                                              '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                              style: appStyleUniverse(
                                                  13, kDark, FontWeight.normal),
                                            ),
                                          );
                                        }).toList(),
                                        onChanged: (value) {
                                          setState(() {
                                            selectedVehicle = value;
                                            selectedServices.clear();
                                            updateSelectedVehicleAndService();
                                            selectedVehicleType =
                                                selectedVehicleData?[
                                                    'vehicleType'];
                                          });
                                        },
                                      ),

                                SizedBox(height: 16.h),

                                // Dynamically show input field based on vehicle type
                                if (selectedVehicle != null &&
                                    selectedVehicleData?['vehicleType'] ==
                                        'Truck') ...[
                                  TextField(
                                    controller: todayMilesController,
                                    decoration: InputDecoration(
                                      labelText: 'Enter Miles',
                                      labelStyle: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ] else if (selectedVehicle != null &&
                                    selectedVehicleData?['vehicleType'] ==
                                        'Trailer') ...[
                                  if (selectedVehicleData?['companyName'] !=
                                      "DRY VAN")
                                    TextField(
                                      controller: hoursController,
                                      decoration: InputDecoration(
                                        labelText: 'Enter Hours',
                                        labelStyle: appStyleUniverse(
                                            14, kDark, FontWeight.normal),
                                        border: OutlineInputBorder(),
                                      ),
                                      keyboardType: TextInputType.number,
                                    ),
                                ],

                                SizedBox(height: 16.h),
                                //Save Miles Button

                                if (selectedVehicleData != null) ...[
                                  if (selectedVehicleData?['vehicleType'] ==
                                          'Truck' ||
                                      (selectedVehicleData?['vehicleType'] ==
                                              'Trailer' &&
                                          selectedVehicleData?['companyName'] !=
                                              'DRY VAN'))
                                    CustomButton(
                                      onPress: () async {
                                        // Check which controller to use based on vehicle type
                                        final isTruck = selectedVehicleData?[
                                                'vehicleType'] ==
                                            'Truck';
                                        final controller = isTruck
                                            ? todayMilesController
                                            : hoursController;
                                        final value = controller.text.trim();

                                        if (selectedVehicle != null &&
                                            value.isNotEmpty) {
                                          try {
                                            final int enteredValue =
                                                int.parse(value);
                                            final vehicleId = selectedVehicle;

                                            // Check if DataServices subcollection exists and is not empty
                                            final dataServicesSnapshot =
                                                await FirebaseFirestore.instance
                                                    .collection("Users")
                                                    .doc(currentUId)
                                                    .collection("DataServices")
                                                    .where("vehicleId",
                                                        isEqualTo: vehicleId)
                                                    .get();

                                            // Fetch current reading (Miles/Hours) for the selected vehicle
                                            final vehicleDoc =
                                                await FirebaseFirestore.instance
                                                    .collection("Users")
                                                    .doc(currentUId)
                                                    .collection("Vehicles")
                                                    .doc(vehicleId)
                                                    .get();

                                            if (vehicleDoc.exists) {
                                              final int currentReading =
                                                  int.parse(
                                                vehicleDoc[isTruck
                                                        ? 'currentMiles'
                                                        : 'hoursReading'] ??
                                                    '0',
                                              );

                                              final data = {
                                                "updatedAt":
                                                    DateFormat('yyyy-MM-dd')
                                                        .format(DateTime.now()),
                                                isTruck
                                                        ? "prevMilesValue"
                                                        : "prevHoursReadingValue":
                                                    currentReading.toString(),
                                                isTruck
                                                        ? "currentMiles"
                                                        : "hoursReading":
                                                    enteredValue.toString(),
                                                isTruck
                                                        ? "miles"
                                                        : "hoursReading":
                                                    enteredValue.toString(),
                                                isTruck
                                                        ? 'currentMilesArray'
                                                        : 'hoursReadingArray':
                                                    FieldValue.arrayUnion([
                                                  {
                                                    isTruck ? "miles" : "hours":
                                                        enteredValue,
                                                    "date": DateTime.now()
                                                        .toIso8601String(),
                                                  }
                                                ]),
                                              };

                                              // Get current user data to determine if we're a team member
                                              final currentUserDoc =
                                                  await FirebaseFirestore
                                                      .instance
                                                      .collection('Users')
                                                      .doc(currentUId)
                                                      .get();

                                              final isTeamMember =
                                                  currentUserDoc.data()?[
                                                          'isTeamMember'] ==
                                                      true;
                                              final ownerUid = isTeamMember
                                                  ? (currentUserDoc.data()?[
                                                          'createdBy'] ??
                                                      currentUId)
                                                  : currentUId;

                                              // Update owner's vehicle first
                                              await FirebaseFirestore.instance
                                                  .collection("Users")
                                                  .doc(ownerUid)
                                                  .collection("Vehicles")
                                                  .doc(vehicleId)
                                                  .update(data);

                                              // Query all team members under this owner (including the current user if they're a team member)
                                              final teamMembersSnapshot =
                                                  await FirebaseFirestore
                                                      .instance
                                                      .collection('Users')
                                                      .where('createdBy',
                                                          isEqualTo: ownerUid)
                                                      .where('isTeamMember',
                                                          isEqualTo: true)
                                                      .get();

                                              // Save to all team members who have this vehicle
                                              for (final doc
                                                  in teamMembersSnapshot.docs) {
                                                final teamMemberUid = doc.id;

                                                // Check if this team member has this vehicle
                                                final teamMemberVehicleDoc =
                                                    await FirebaseFirestore
                                                        .instance
                                                        .collection('Users')
                                                        .doc(teamMemberUid)
                                                        .collection('Vehicles')
                                                        .doc(vehicleId)
                                                        .get();

                                                if (teamMemberVehicleDoc
                                                    .exists) {
                                                  await FirebaseFirestore
                                                      .instance
                                                      .collection('Users')
                                                      .doc(teamMemberUid)
                                                      .collection("Vehicles")
                                                      .doc(vehicleId)
                                                      .update(data);
                                                }
                                              }

                                              // If current user is team member, also update their own vehicle
                                              if (isTeamMember &&
                                                  currentUId != ownerUid) {
                                                final currentUserVehicleDoc =
                                                    await FirebaseFirestore
                                                        .instance
                                                        .collection('Users')
                                                        .doc(currentUId)
                                                        .collection('Vehicles')
                                                        .doc(vehicleId)
                                                        .get();

                                                if (currentUserVehicleDoc
                                                    .exists) {
                                                  await FirebaseFirestore
                                                      .instance
                                                      .collection('Users')
                                                      .doc(currentUId)
                                                      .collection("Vehicles")
                                                      .doc(vehicleId)
                                                      .update(data);
                                                }
                                              }

                                              debugPrint(
                                                  '${isTruck ? 'Miles' : 'Hours'} updated successfully!');
                                              todayMilesController.clear();
                                              hoursController.clear();
                                              setState(() {
                                                selectedVehicle = null;
                                                selectedVehicleType = '';
                                              });

                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                      'Saved successfully!'),
                                                  duration:
                                                      Duration(seconds: 2),
                                                ),
                                              );

                                              if (dataServicesSnapshot
                                                  .docs.isEmpty) {
                                                // Call cloud function to notify about missing services
                                                final HttpsCallable callable =
                                                    FirebaseFunctions.instance
                                                        .httpsCallable(
                                                            'checkAndNotifyUserForVehicleService');

                                                await callable.call({
                                                  'userId': currentUId,
                                                  'vehicleId': vehicleId,
                                                });

                                                log('Called checkAndNotifyUserForVehicleService for $vehicleId');
                                              } else {
                                                // Call the cloud function to check for notifications
                                                final HttpsCallable callable =
                                                    FirebaseFunctions.instance
                                                        .httpsCallable(
                                                            'checkDataServicesAndNotify');

                                                final result = await callable
                                                    .call({
                                                  'userId': currentUId,
                                                  'vehicleId': vehicleId
                                                });

                                                log('Check Data Services Cloud function result: ${result.data} vehicle Id $vehicleId');
                                              }
                                            } else {
                                              throw 'Vehicle data not found';
                                            }
                                          } catch (e) {
                                            debugPrint(
                                                'Error updating ${isTruck ? 'miles' : 'hours'}: $e');
                                            // ScaffoldMessenger.of(context)
                                            //     .showSnackBar(
                                            //   SnackBar(
                                            //     content: Text(
                                            //         'Failed to save ${isTruck ? 'miles' : 'hours'}: $e'),
                                            //     duration: Duration(seconds: 2),
                                            //   ),
                                            // );
                                          }
                                        } else {
                                          // ScaffoldMessenger.of(context)
                                          //     .showSnackBar(
                                          //   SnackBar(
                                          //     content: Text(
                                          //         'Please select a vehicle and enter a value'),
                                          //     duration: Duration(seconds: 2),
                                          //   ),
                                          // );
                                        }
                                      },
                                      color: kPrimary,
                                      text:
                                          'Save ${selectedVehicleData?['vehicleType'] == 'Truck' ? 'Miles' : 'Hours'}',
                                    ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],

                      // Invoice Summary Box
                      // Invoice Summary Box
                      (role == "Owner" || role == "Admin")
                          ? Card(
                              elevation: 4,
                              margin: EdgeInsets.symmetric(vertical: 8),
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Invoice Summary',
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: kDark,
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            IconButton(
                                              icon: Icon(Icons.filter_alt,
                                                  color: kPrimary),
                                              onPressed: () {
                                                setState(() {
                                                  showVehicleFilter =
                                                      !showVehicleFilter;
                                                });
                                              },
                                            ),
                                            IconButton(
                                              icon: Icon(Icons.date_range,
                                                  color: kPrimary),
                                              onPressed: () async {
                                                final DateTimeRange? picked =
                                                    await showDateRangePicker(
                                                  context: context,
                                                  firstDate: DateTime(2000),
                                                  lastDate: DateTime(2100),
                                                  initialDateRange:
                                                      summaryStartDate !=
                                                                  null &&
                                                              summaryEndDate !=
                                                                  null
                                                          ? DateTimeRange(
                                                              start:
                                                                  summaryStartDate!,
                                                              end:
                                                                  summaryEndDate!)
                                                          : null,
                                                );
                                                if (picked != null) {
                                                  setState(() {
                                                    summaryStartDate =
                                                        picked.start;
                                                    summaryEndDate = picked.end;
                                                  });
                                                }
                                              },
                                            ),
                                            if (summaryStartDate != null ||
                                                summaryEndDate != null)
                                              IconButton(
                                                icon: Icon(Icons.clear,
                                                    color: Colors.red),
                                                onPressed: () {
                                                  setState(() {
                                                    summaryStartDate = null;
                                                    summaryEndDate = null;
                                                  });
                                                },
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),

                                    // Show vehicle type filter only when showVehicleFilter is true
                                    if (showVehicleFilter) ...[
                                      SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Expanded(
                                            child:
                                                DropdownButtonFormField<String>(
                                              value: summaryVehicleTypeFilter,
                                              items: ['All', 'Truck', 'Trailer']
                                                  .map((String value) {
                                                return DropdownMenuItem<String>(
                                                  value: value,
                                                  child: Text(value),
                                                );
                                              }).toList(),
                                              onChanged: (value) {
                                                setState(() {
                                                  summaryVehicleTypeFilter =
                                                      value!;
                                                  selectedSummaryVehicles
                                                      .clear();
                                                });
                                              },
                                              decoration: InputDecoration(
                                                labelText: 'Vehicle Type',
                                                border: OutlineInputBorder(),
                                              ),
                                            ),
                                          ),
                                          SizedBox(width: 10),
                                          IconButton(
                                            icon: Icon(Icons.refresh,
                                                color: kPrimary),
                                            onPressed: () {
                                              setState(() {
                                                selectedSummaryVehicles.clear();
                                                summaryVehicleTypeFilter =
                                                    'All';
                                              });
                                            },
                                            tooltip: 'Clear Filters',
                                          ),
                                        ],
                                      ),

                                      // Vehicle Selection (only show if not 'All')
                                      if (summaryVehicleTypeFilter != 'All')
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            SizedBox(height: 8),
                                            Text('Select Vehicles:',
                                                style: TextStyle(
                                                    fontWeight:
                                                        FontWeight.bold)),
                                            SizedBox(height: 8),
                                            Container(
                                              height: 150,
                                              child: ListView.builder(
                                                shrinkWrap: true,
                                                itemCount:
                                                    vehicles.where((vehicle) {
                                                  return summaryVehicleTypeFilter ==
                                                          'All' ||
                                                      vehicle['vehicleType'] ==
                                                          summaryVehicleTypeFilter;
                                                }).length,
                                                itemBuilder: (context, index) {
                                                  final filteredVehicles =
                                                      vehicles.where((vehicle) {
                                                    return summaryVehicleTypeFilter ==
                                                            'All' ||
                                                        vehicle['vehicleType'] ==
                                                            summaryVehicleTypeFilter;
                                                  }).toList();

                                                  final vehicle =
                                                      filteredVehicles[index];
                                                  final isSelected =
                                                      selectedSummaryVehicles
                                                          .contains(
                                                              vehicle['id']);

                                                  return CheckboxListTile(
                                                    title: Text(
                                                        '${vehicle['vehicleNumber']} (${vehicle['companyName']})'),
                                                    value: isSelected,
                                                    onChanged: (bool? value) {
                                                      setState(() {
                                                        if (value == true) {
                                                          selectedSummaryVehicles
                                                              .add(vehicle[
                                                                  'id']);
                                                        } else {
                                                          selectedSummaryVehicles
                                                              .remove(vehicle[
                                                                  'id']);
                                                        }
                                                      });
                                                    },
                                                  );
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                      SizedBox(height: 8),
                                    ],

                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        _buildSummaryItem('Total',
                                            calculateInvoiceTotals()['total']!),
                                        _buildSummaryItem('Trucks',
                                            calculateInvoiceTotals()['truck']!),
                                        _buildSummaryItem(
                                            'Trailers',
                                            calculateInvoiceTotals()[
                                                'trailer']!),
                                        _buildSummaryItem('Others',
                                            calculateInvoiceTotals()['other']!),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : SizedBox(),

                      currentUser == null
                          ? AbsorbPointer(
                              child: TabBar(
                                controller: _tabController,
                                tabs: [
                                  Tab(text: "My Records"),
                                  Tab(text: "My Miles"),
                                ],
                              ),
                            )
                          : TabBar(
                              controller: _tabController,
                              tabs: [
                                Tab(
                                  child: Text("My Records",
                                      style: appStyleUniverse(
                                          20, kDark, FontWeight.w500)),
                                ),
                                Tab(
                                  child: Text("My Miles",
                                      style: appStyleUniverse(
                                          20, kDark, FontWeight.w500)),
                                ),
                              ],
                            ),
                      // SizedBox(height: 10.h),

                      //my records section
                      Container(
                        // color: kPrimary,
                        height: MediaQuery.of(context).size.height * 0.7,
                        child: TabBarView(
                          controller: _tabController,
                          children: [
                            // My Records Tab
                            (isAnonymous == true || isProfileComplete == false)
                                ? Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(15.0),
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.lock,
                                              size: 50, color: Colors.grey),
                                          SizedBox(height: 20),
                                          Text(
                                              'Please Create an account to \nadd records and view records',
                                              style: TextStyle(
                                                  color: Colors.grey)),
                                          SizedBox(height: 20),
                                          CustomButton(
                                              text: "Register/Login",
                                              onPress: () => showLoginPrompt(),
                                              color: kSecondary)
                                        ],
                                      ),
                                    ),
                                  )
                                : SingleChildScrollView(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        if (filteredRecords.isEmpty)
                                          Center(
                                            child: Column(
                                              children: [
                                                Icon(Icons.note_alt_outlined,
                                                    size: 80,
                                                    color: kPrimary
                                                        .withOpacity(0.5)),
                                                const SizedBox(height: 16),
                                                Text('No records found',
                                                    style: appStyleUniverse(
                                                        18,
                                                        kDarkGray,
                                                        FontWeight.w500)),
                                              ],
                                            ),
                                          )
                                        else
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.end,
                                            children: [
                                              CircleAvatar(
                                                backgroundColor: kPrimary,
                                                foregroundColor: kWhite,
                                                radius: 20.r,
                                                child: IconButton(
                                                  onPressed: () async {
                                                    try {
                                                      final pdfBytes =
                                                          await generateRecordPdf(
                                                              filteredRecords);
                                                      await Printing.layoutPdf(
                                                        onLayout: (format) =>
                                                            pdfBytes,
                                                      );
                                                    } catch (e) {
                                                      print(
                                                          'Printing error: $e');
                                                    }
                                                  },
                                                  icon: Icon(Icons.print),
                                                ),
                                              ),
                                              ListView.builder(
                                                shrinkWrap: true,
                                                physics:
                                                    const NeverScrollableScrollPhysics(),
                                                itemCount:
                                                    filteredRecords.length,
                                                itemBuilder: (context, index) {
                                                  final record =
                                                      filteredRecords[index];
                                                  final services =
                                                      record['services']
                                                          as List<dynamic>;
                                                  final date = DateFormat(
                                                          'MM-dd-yy')
                                                      .format(DateTime.parse(
                                                          record['date']));

                                                  return Container(
                                                    child: GestureDetector(
                                                      onTap: () => Get.to(() =>
                                                          RecordsDetailsScreen(
                                                              record: record)),
                                                      child: Card(
                                                        elevation: 0,
                                                        shape:
                                                            RoundedRectangleBorder(
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(
                                                                      15.r),
                                                          side: BorderSide(
                                                            color: kPrimary
                                                                .withOpacity(
                                                                    0.2),
                                                            width: 1,
                                                          ),
                                                        ),
                                                        child: Container(
                                                          decoration:
                                                              BoxDecoration(
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        15.r),
                                                          ),
                                                          child: Padding(
                                                            padding:
                                                                EdgeInsets.all(
                                                                    16.w),
                                                            child: Column(
                                                              crossAxisAlignment:
                                                                  CrossAxisAlignment
                                                                      .start,
                                                              children: [
                                                                Row(
                                                                  mainAxisAlignment:
                                                                      MainAxisAlignment
                                                                          .spaceBetween,
                                                                  children: [
                                                                    if (record[
                                                                            'invoice']
                                                                        .isNotEmpty)
                                                                      Container(
                                                                        padding:
                                                                            EdgeInsets.symmetric(
                                                                          horizontal:
                                                                              12.w,
                                                                          vertical:
                                                                              6.h,
                                                                        ),
                                                                        decoration:
                                                                            BoxDecoration(
                                                                          color:
                                                                              kPrimary.withOpacity(0.1),
                                                                          borderRadius:
                                                                              BorderRadius.circular(20.r),
                                                                        ),
                                                                        child:
                                                                            Row(
                                                                          children: [
                                                                            Icon(Icons.receipt_outlined,
                                                                                size: 20,
                                                                                color: kPrimary),
                                                                            SizedBox(width: 8.w),
                                                                            SizedBox(
                                                                              width: 80.w,
                                                                              child: Text("#${record['invoice']}", overflow: TextOverflow.ellipsis, style: appStyleUniverse(13, kDark, FontWeight.w500)),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    Container(
                                                                      padding:
                                                                          EdgeInsets
                                                                              .symmetric(
                                                                        horizontal:
                                                                            12.w,
                                                                        vertical:
                                                                            6.h,
                                                                      ),
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: kSecondary
                                                                            .withOpacity(0.1),
                                                                        borderRadius:
                                                                            BorderRadius.circular(20.r),
                                                                      ),
                                                                      child:
                                                                          Row(
                                                                        children: [
                                                                          Icon(
                                                                              Icons.calendar_today,
                                                                              size: 18,
                                                                              color: kSecondary),
                                                                          SizedBox(
                                                                              width: 8.w),
                                                                          Text(
                                                                              date,
                                                                              style: appStyleUniverse(13, kDark, FontWeight.w500)),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                    //Edit Icon

                                                                    GestureDetector(
                                                                      onTap:
                                                                          () {
                                                                        if (isEdit!) {
                                                                          showDialog(
                                                                              context: context,
                                                                              builder: (_) {
                                                                                return AlertDialog(
                                                                                  title: Text("Edit Record"),
                                                                                  content: Text("Are you sure you want to edit this record?"),
                                                                                  actions: [
                                                                                    TextButton(
                                                                                      onPressed: () {
                                                                                        _handleEditRecord(record);
                                                                                        Navigator.pop(context);
                                                                                      },
                                                                                      child: Text(
                                                                                        "Yes",
                                                                                        style: appStyle(15, kSecondary, FontWeight.bold),
                                                                                      ),
                                                                                    ),
                                                                                    TextButton(
                                                                                      onPressed: () {
                                                                                        Navigator.pop(context);
                                                                                      },
                                                                                      child: Text(
                                                                                        "No",
                                                                                        style: appStyle(15, kPrimary, FontWeight.bold),
                                                                                      ),
                                                                                    ),
                                                                                  ],
                                                                                );
                                                                              });
                                                                        } else {
                                                                          showToastMessage(
                                                                              "Sorry",
                                                                              "You don't have permission to edit record",
                                                                              kPrimary);
                                                                        }
                                                                      },
                                                                      child:
                                                                          Container(
                                                                        padding:
                                                                            EdgeInsets.symmetric(
                                                                          horizontal:
                                                                              12.w,
                                                                          vertical:
                                                                              6.h,
                                                                        ),
                                                                        decoration:
                                                                            BoxDecoration(
                                                                          color:
                                                                              kPrimary,
                                                                          borderRadius:
                                                                              BorderRadius.circular(20.r),
                                                                        ),
                                                                        child: Icon(
                                                                            Icons
                                                                                .edit,
                                                                            color:
                                                                                kWhite,
                                                                            size:
                                                                                16),
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                                SizedBox(
                                                                    height:
                                                                        16.h),
                                                                buildInfoRow(
                                                                  Icons
                                                                      .directions_car_outlined,
                                                                  '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                                                                ),
                                                                Divider(
                                                                    height:
                                                                        24.h),
                                                                buildInfoRow(
                                                                  Icons
                                                                      .build_outlined,
                                                                  services
                                                                      .map((service) =>
                                                                          service[
                                                                              'serviceName'])
                                                                      .join(
                                                                          ", "),
                                                                ),
                                                                Divider(
                                                                    height:
                                                                        24.h),
                                                                buildInfoRow(
                                                                  Icons
                                                                      .store_outlined,
                                                                  record['workshopName'] ??
                                                                      'N/A',
                                                                ),
                                                                if (record[
                                                                        "description"]
                                                                    .isNotEmpty) ...[
                                                                  Divider(
                                                                      height:
                                                                          24.h),
                                                                  buildInfoRow(
                                                                    Icons
                                                                        .description_outlined,
                                                                    record[
                                                                        'description'],
                                                                  ),
                                                                ],
                                                                Divider(
                                                                    height:
                                                                        24.h),
                                                                Row(
                                                                  mainAxisAlignment:
                                                                      MainAxisAlignment
                                                                          .spaceBetween,
                                                                  children: [
                                                                    if (record[
                                                                            "invoiceAmount"]
                                                                        .isNotEmpty) ...[
                                                                      Row(
                                                                        children: [
                                                                          Text(
                                                                              "Invoice Amount :",
                                                                              style: appStyle(14, kDark, FontWeight.w500)),
                                                                          SizedBox(
                                                                              width: 8.w),
                                                                          Text(
                                                                              '${record['invoiceAmount']}',
                                                                              style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                        ],
                                                                      ),
                                                                    ],
                                                                    if (record.containsKey(
                                                                            "miles") &&
                                                                        record['miles'] !=
                                                                            0)
                                                                      Row(
                                                                        children: [
                                                                          Text(
                                                                              "Miles :",
                                                                              style: appStyle(14, kDark, FontWeight.w500)),
                                                                          SizedBox(
                                                                              width: 8.w),
                                                                          Text(
                                                                              '${record['miles']}',
                                                                              style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                        ],
                                                                      ),
                                                                    if (record.containsKey(
                                                                            "hours") &&
                                                                        record['hours'] !=
                                                                            0)
                                                                      Row(
                                                                        children: [
                                                                          Text(
                                                                              "Hours :",
                                                                              style: appStyle(14, kDark, FontWeight.w500)),
                                                                          SizedBox(
                                                                              width: 8.w),
                                                                          Text(
                                                                              '${record['hours']}',
                                                                              style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                        ],
                                                                      ),
                                                                  ],
                                                                ),
                                                              ],
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  )
                                                      .animate()
                                                      .fadeIn(
                                                          duration: 400.ms,
                                                          delay:
                                                              (index * 100).ms)
                                                      .slideX(
                                                          begin: 0.2, end: 0);
                                                },
                                              ),
                                            ],
                                          ),
                                      ],
                                    ),
                                  ),

                            // My Miles Tab
                            (isAnonymous == true || isProfileComplete == false)
                                ? Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.lock,
                                            size: 50, color: Colors.grey),
                                        SizedBox(height: 20),
                                        Text(
                                            'Please Create an account to \nadd miles and view miles',
                                            style:
                                                TextStyle(color: Colors.grey)),
                                        SizedBox(height: 20),
                                        CustomButton(
                                            text: "Register/Login",
                                            onPress: () => showLoginPrompt(),
                                            color: kPrimary)
                                      ],
                                    ),
                                  )
                                : ListView.builder(
                                    itemCount: vehicles.length,
                                    itemBuilder: (context, index) {
                                      final vehicle = vehicles[index];
                                      return GestureDetector(
                                        onTap: () => Get.to(() =>
                                            MilesDetailsScreen(
                                                milesRecord: vehicle)),
                                        child: Card(
                                          margin: EdgeInsets.symmetric(
                                              vertical: 8.h),
                                          child: ListTile(
                                            title: Text(
                                              '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                              style: appStyleUniverse(
                                                  16, kDark, FontWeight.w500),
                                            ),
                                            subtitle: vehicle['vehicleType'] ==
                                                    "Truck"
                                                ? Text(
                                                    'Current Miles: ${vehicle['currentMiles'] ?? '0'}',
                                                    style: appStyleUniverse(
                                                        14,
                                                        kDarkGray,
                                                        FontWeight.normal))
                                                : Text(
                                                    'Hours Reading: ${vehicle['hoursReading'] ?? '0'}',
                                                    style: appStyleUniverse(
                                                        14,
                                                        kDarkGray,
                                                        FontWeight.normal),
                                                  ),
                                            trailing: Icon(
                                                Icons.directions_car_outlined,
                                                color: kPrimary),
                                          ),
                                        ).animate().fadeIn(
                                            duration: 400.ms,
                                            delay: (index * 100).ms),
                                      );
                                    },
                                  ),
                          ],
                        ),
                      ),

                      // SizedBox(height: 20.h),
                    ],
                  ),
                ),
              ),
            )
          : Center(
              child: Text(
                'You don\'t have access to view this page',
                style: appStyleUniverse(18, kDark, FontWeight.w500),
              ),
            ),
    );
  }

  Widget _buildSummaryItem(String label, double amount) {
    return Column(
      children: [
        Text(
          label,
          style: appStyle(
            14,
            kDarkGray,
            FontWeight.w500,
          ),
        ),
        SizedBox(height: 4),
        Text(
          '\$${amount.toStringAsFixed(0)}',
          style: appStyle(
            12,
            kPrimary,
            FontWeight.bold,
          ),
        ),
      ],
    );
  }

  void showLoginPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirmation Required'),
        content: Text('You need to create an account to access this feature'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Get.to(() => RegistrationScreen());
            },
            child: Text('Register'),
          ),
        ],
      ),
    );
  }

  GestureDetector buildProfileAvatar() {
    return GestureDetector(
      onTap: () => Get.to(() => const ProfileScreen(),
          transition: Transition.cupertino,
          duration: const Duration(milliseconds: 900)),
      child: CircleAvatar(
        radius: 19.r,
        backgroundColor: kPrimary,
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('Users')
              .doc(currentUId)
              .snapshots(),
          builder:
              (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
            if (snapshot.hasError) {
              return Text('Error: ${snapshot.error}');
            }

            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            }

            final data = snapshot.data!.data() as Map<String, dynamic>;
            final userPhoto = data['profilePicture'] ?? '';
            final userName = data['userName'] ?? '';

            if (userPhoto.isEmpty) {
              return Text(
                userName.isNotEmpty ? userName[0] : '',
                style: kIsWeb
                    ? TextStyle(color: kWhite)
                    : appStyle(20, kWhite, FontWeight.w500),
              );
            } else {
              return ClipOval(
                child: Image.network(
                  userPhoto,
                  width: 38.r, // Set appropriate size for the image
                  height: 35.r,
                  fit: BoxFit.cover,
                ),
              );
            }
          },
        ),
      ),
    );
  }

  StreamBuilder<QuerySnapshot<Object?>> buildNotificationBadge() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('UserNotifications')
          .where('isRead', isEqualTo: false)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container();
        }
        int unreadCount = snapshot.data!.docs.length;
        return unreadCount > 0
            ? Badge(
                backgroundColor: kSecondary,
                label: Text(unreadCount.toString(),
                    style: appStyle(12, kWhite, FontWeight.normal)),
                child: GestureDetector(
                  onTap: () => Get.to(() => CloudNotificationMessageCenter()),
                  child: CircleAvatar(
                      backgroundColor: kPrimary,
                      radius: 17.r,
                      child: Icon(Icons.notifications,
                          size: 25.sp, color: kWhite)),
                ),
              )
            : Badge(
                backgroundColor: kSecondary,
                label: Text(unreadCount.toString(),
                    style: appStyle(12, kWhite, FontWeight.normal)),
                child: GestureDetector(
                  onTap: () => Get.to(() => CloudNotificationMessageCenter()),
                  child: CircleAvatar(
                      backgroundColor: kPrimary,
                      radius: 17.r,
                      child: Icon(Icons.notifications,
                          size: 25.sp, color: kWhite)),
                ),
              );
      },
    );
  }

  Widget buildServiceChip(Map<String, dynamic> service, bool isSelected) {
    List<dynamic> subServices = service['subServices'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FilterChip(
          backgroundColor: kPrimary.withOpacity(0.1),
          selectedColor: kPrimary,
          labelPadding: EdgeInsets.only(left: 2.0, right: 2.0),
          showCheckmark: false,
          label: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(service['sName']),
              if (isSelected) // Show tick only when selected
                buildCustomTickBox()
            ],
          ),
          labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
          selected: isSelected,
          onSelected: (bool selected) {
            if (selectedVehicle == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('First select the vehicle')),
              );
              return;
            }
            setState(() {
              if (selected) {
                selectedServices.add(service['sId']);
                selectedSubServices[service['sId']] = [];
              } else {
                selectedServices.remove(service['sId']);
                selectedSubServices.remove(service['sId']);
              }
              updateSelectedVehicleAndService();
            });
          },
        ),
        if (isSelected && subServices.isNotEmpty)
          Padding(
            padding: EdgeInsets.only(left: 2.w, top: 4.h),
            child: Wrap(
              direction: Axis.horizontal,
              spacing: 2.w,
              children: subServices.expand((subService) {
                List<String> sNames =
                    List<String>.from(subService['sName'] ?? []);
                return sNames.map((subServiceName) {
                  if (subServiceName.isEmpty) return Container();
                  bool isSubSelected = selectedSubServices[service['sId']]
                          ?.contains(subServiceName) ??
                      false;
                  return FilterChip(
                    backgroundColor: kSecondary.withOpacity(0.1),
                    selectedColor: kSecondary.withOpacity(0.5),
                    labelPadding: EdgeInsets.only(left: 8.0, right: 4.0),
                    showCheckmark: false,
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(subServiceName),
                        if (isSubSelected) // Show tick only when sub-service is selected
                          buildCustomTickBox()
                      ],
                    ),
                    labelStyle: appStyle(13, kDark, FontWeight.normal),
                    selected: isSubSelected,
                    onSelected: (bool selected) {
                      final serviceName =
                          service['sName'].toString().toLowerCase();
                      final isSingleSubService =
                          serviceName.contains('steer tires') ||
                              serviceName.contains('dpf percentage');

                      if (isSingleSubService) {
                        // Get current selected subservices
                        final currentSubs =
                            selectedSubServices[service['sId']] ?? [];

                        if (selected && currentSubs.isNotEmpty) {
                          // Don't allow selecting another subservice if one is already selected
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'You can only select one sub-service for ${service['sName']}',
                              ),
                            ),
                          );
                          return;
                        }
                      }

                      setState(() {
                        if (selected) {
                          selectedSubServices[service['sId']] ??= [];
                          selectedSubServices[service['sId']]!
                              .add(subServiceName);
                        } else {
                          selectedSubServices[service['sId']]
                              ?.remove(subServiceName);
                        }
                      });
                    },
                  );
                });
              }).toList(),
            ),
          ),
      ],
    );
  }

  Padding buildCustomTickBox() {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0),
      child: Container(
        height: 20.h,
        width: 20.h,
        decoration: BoxDecoration(
            color: kWhite, borderRadius: BorderRadius.circular(20)),
        child: Center(
          child: Icon(
            Icons.check,
            size: 14.sp,
            color: kPrimary,
          ),
        ),
      ),
    );
  }

  Widget buildInfoRow(IconData icon, String vText) {
    return Row(
      children: [
        Icon(icon, size: 20, color: kSecondary),
        SizedBox(width: 8.w),
        // Text(hText, style: appStyle(16, kDark, FontWeight.w500)),
        // SizedBox(width: 8.w),
        Expanded(
          child: Text(
            vText,
            style: appStyleUniverse(16, kDarkGray, FontWeight.w400),
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget buildReusableRowTextWidget(String hText, String vText) {
    return Row(
      children: [
        Text(hText, style: appStyle(15, kDark, FontWeight.w500)),
        SizedBox(
          width: 250.w,
          child: Text(vText,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: appStyle(15, kDarkGray, FontWeight.w400)),
        ),
      ],
    );
  }

  Widget buildCustomRowButton(
      IconData iconName, String text, Color boxColor, void Function()? onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 38.h,
        width: 90.w,
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

  void resetForm() {
    setState(() {
      isEditing = false;
      editingRecordId = null;
      selectedVehicle = null;
      image = null;
      _existingImageUrl = null;
      selectedServices.clear();
      selectedSubServices.clear();
      serviceDefaultValues.clear();
      milesController.clear();
      invoiceAmountController.clear();
      hoursController.clear();
      workshopController.clear();
      invoiceController.clear();
      descriptionController.clear();
      selectedPackages.clear();
      selectedDate = null;
      showAddRecords = false;
      selectedVehicleData = null;
      selectedServiceData.clear();
    });
  }

  void resetFilters() {
    setState(() {
      filterVehicle = '';
      filterService = '';
      startDate = null;
      endDate = null;
      showSearchFilter = false;
      showVehicleSearch = false;
      showServiceSearch = false;
      showDateSearch = false;
      showCombinedSearch = false;
    });
  }

  Future<void> _refreshPage() async {
    try {
      resetForm();
      resetFilters();
      initializeStreams();

      setState(() {
        showAddRecords = false;
        showSearchFilter = false;
        showAddMiles = false;
        showVehicleSearch = false;
        showServiceSearch = false;
        showDateSearch = false;
        showCombinedSearch = false;
      });

      if (mounted) setState(() {});

      await Future.delayed(Duration(milliseconds: 500));

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Page refreshed'),
          duration: Duration(seconds: 1),
        ),
      );
    } catch (e) {
      debugPrint('Refresh error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Refresh failed'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  @override
  void dispose() {
    vehiclesSubscription.cancel();
    recordsSubscription.cancel();
    servicesSubscription.cancel();
    milesSubscription.cancel();
    milesController.dispose();
    hoursController.dispose();
    workshopController.dispose();
    invoiceController.dispose();
    invoiceAmountController.dispose();
    serviceSearchController.dispose();
    vehicleSearchController.dispose();
    dateSearchController.dispose();
    _tabController.dispose();
    packagesSubscription.cancel();
    super.dispose();
  }
}
