import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';

class ReportsController extends GetxController {
  User? get currentUser => FirebaseAuth.instance.currentUser;
  String get currentUId => currentUser?.uid ?? '';

  // Effective user ID for team member functionality
  String? _effectiveUserId;
  String get effectiveUserId => _effectiveUserId ?? currentUId;

  // State variables
  String? selectedVehicle;
  Set<String> selectedPackages = {};
  String? selectedRecordsVehicle;
  Set<String> selectedServices = {};
  Map<String, List<String>> selectedSubServices = {};
  Map<String, int> serviceDefaultValues = {};
  bool isOtherServiceSelected = false;
  final TextEditingController otherServiceController = TextEditingController();
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
  final TextEditingController dateController = TextEditingController();
  DateTime? selectedDate;
  DateTime? originalRecordDate;

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
  bool isRecordSaving = false;
  String? editingRecordId;
  late String role = "";
  bool isAnonymous = true;
  bool isProfileComplete = false;
  File? image;
  File? documentFile;
  String? documentName;
  bool isPdfFile = false;
  String? existingImageUrl;

  // Workshop suggestions
  final List<String> workshopList = [];

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
  StreamSubscription? workshopSubscription;
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
  void onInit() {
    super.onInit();
    _initializeEffectiveUserId();
    initializeStreams();
    if (isAnonymous == true || isProfileComplete == false) {
      showAddRecords = true;
    }
  }

  // Initialize effective user ID based on role
  Future<void> _initializeEffectiveUserId() async {
    try {
      if (currentUId.isEmpty) return;

      final currentUserDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (currentUserDoc.exists) {
        final userData = currentUserDoc.data() as Map<String, dynamic>;
        final userRole = userData['role']?.toString() ?? '';

        // Only SubOwner uses the createdBy user ID, others use their own ID
        if (userRole == 'SubOwner' && userData['createdBy'] != null) {
          _effectiveUserId = userData['createdBy'];
          log('SubOwner detected: Using owner ID $_effectiveUserId');
        } else {
          _effectiveUserId = currentUId;
          log('User role $userRole: Using own ID $_effectiveUserId');
        }

        update();
      }
    } catch (e) {
      debugPrint('Error initializing effective user ID: $e');
      _effectiveUserId = currentUId;
    }
  }

  void initializeStreams() {
    // Setup users stream - always use currentUId for user document (permissions and role)
    usersSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId) // FIXED: Use currentUId, not effectiveUserId
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final userData = snapshot.data();
        if (userData != null) {
          isView = userData['isView'];
          isEdit = userData['isEdit'];
          isAdd = userData['isAdd'];
          isDelete = userData['isDelete'];
          role = userData['role'];
          isAnonymous = userData['isAnonymous'] ?? true;
          isProfileComplete = userData['isProfileComplete'] ?? false;
          update();
        }
      }
    });

    // Setup vehicle stream - use effectiveUserId for vehicles
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(effectiveUserId) // Use effectiveUserId for data
        .collection("Vehicles")
        .where("active", isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        debugPrint('No vehicles found for effective user: $effectiveUserId');
        vehicles.clear();
        update();
        return;
      }

      vehicles.clear();
      vehicles
          .addAll(snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      update();
      debugPrint(
          'Fetched ${vehicles.length} vehicles for effective user: $effectiveUserId');
    });

    // Setup services stream - metadata is global
    servicesSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('serviceData')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final servicesData = snapshot.data()?['data'] as List<dynamic>?;
        if (servicesData != null) {
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

          sortedServices.sort(
              (a, b) => (a['sName'] as String).compareTo(b['sName'] as String));

          services.addAll(sortedServices);
          updateServiceDefaultValues();
          update();
        }
      }
    });

    // Setup records stream - use effectiveUserId for records
    recordsSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(effectiveUserId) // Use effectiveUserId for data
        .collection('DataServices')
        .where('active', isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      records.clear();
      records.addAll(snapshot.docs.map((doc) {
        final data = doc.data();
        return {
          ...data,
          'id': doc.id,
          'vehicle': data['vehicleDetails'] != null
              ? data['vehicleDetails']['companyName']
              : ''
        };
      }));

      records.sort((a, b) {
        DateTime? dateA =
            a['date'] != null ? DateTime.tryParse(a['date'].toString()) : null;
        DateTime? dateB =
            b['date'] != null ? DateTime.tryParse(b['date'].toString()) : null;
        if (dateA != null && dateB != null && !dateA.isAtSameMomentAs(dateB)) {
          return dateB.compareTo(dateA); // Newest date first
        }
        DateTime? createdA = a['createdAt'] != null
            ? DateTime.tryParse(a['createdAt'].toString())
            : null;
        DateTime? createdB = b['createdAt'] != null
            ? DateTime.tryParse(b['createdAt'].toString())
            : null;
        if (createdA != null && createdB != null) {
          return createdB.compareTo(createdA); // Newest created first
        }
        return 0;
      });

      // Update showAddRecords based on whether we have any records
      showAddRecords = snapshot.docs.isEmpty;
      update();
      debugPrint(
          'Fetched ${records.length} records for effective user: $effectiveUserId');
    });

    // Setup workshop names stream
    workshopSubscription?.cancel();
    workshopSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(effectiveUserId)
        .collection('recordWorkshopName')
        .snapshots()
        .listen((snapshot) {
      workshopList.clear();
      for (var doc in snapshot.docs) {
        final name = (doc.data()['workshopName'] ?? '').toString().trim();
        if (name.isNotEmpty && !workshopList.contains(name)) {
          workshopList.add(name);
        }
      }
      workshopList.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
      update();
    });

    // Setup miles stream - use effectiveUserId
    milesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(effectiveUserId) // Use effectiveUserId for data
        .collection('DataServices')
        .snapshots()
        .listen((snapshot) {
      milesToAddInRecords.clear();
      milesToAddInRecords.addAll(snapshot.docs.map((doc) => {
            ...doc.data(),
            'id': doc.id,
          }));
      update();
    });

    // Listen to the servicePackages stream - metadata is global
    packagesSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('nServicesPackages')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final List<dynamic>? packagesData = snapshot.data()?['data'];
        if (packagesData != null) {
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
          update();
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
          (record['services'] as List).any((service) => (service['serviceName'] ?? '')
              .toString()
              .toLowerCase()
              .contains(filterService.toLowerCase()));

      // Date range filter
      final recordDate = DateTime.tryParse(record['date']?.toString() ?? '');
      final dateMatch = startDate == null ||
          endDate == null ||
          (recordDate != null &&
              recordDate.isAfter(startDate!.subtract(const Duration(seconds: 1))) &&
              recordDate.isBefore(
                  endDate!.add(const Duration(days: 1)))); // Include end date

      // Invoice filter
      final invoiceMatch = filterInvoice.isEmpty ||
          (record['invoice']?.toString().toLowerCase() ?? '')
              .contains(filterInvoice.toLowerCase());

      return vehicleMatch && serviceMatch && dateMatch && invoiceMatch;
    }).toList()
      ..sort((a, b) {
        DateTime? dateA =
            a['date'] != null ? DateTime.tryParse(a['date'].toString()) : null;
        DateTime? dateB =
            b['date'] != null ? DateTime.tryParse(b['date'].toString()) : null;
        if (dateA != null && dateB != null && !dateA.isAtSameMomentAs(dateB)) {
          return dateB.compareTo(dateA); // Newest date first
        }
        DateTime? createdA = a['createdAt'] != null
            ? DateTime.tryParse(a['createdAt'].toString())
            : null;
        DateTime? createdB = b['createdAt'] != null
            ? DateTime.tryParse(b['createdAt'].toString())
            : null;
        if (createdA != null && createdB != null) {
          return createdB.compareTo(createdA); // Newest created first
        }
        return 0;
      });
  }

  void updateServiceDefaultValues() {
    if (selectedVehicle == null || selectedServices.isEmpty) return;

    // Get vehicle document to check for service-specific defaults
    FirebaseFirestore.instance
        .collection('Users')
        .doc(effectiveUserId)
        .collection('Vehicles')
        .doc(selectedVehicle)
        .get()
        .then((vehicleDoc) {
      final vehicleServices =
          List<Map<String, dynamic>>.from(vehicleDoc.data()?['services'] ?? []);

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
      update();
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
    update();
  }

  void getImage(ImageSource source, BuildContext context) async {
    final pickedFile = await ImagePicker().pickImage(
      source: source,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      image = File(pickedFile.path);
      documentFile = File(pickedFile.path);
      documentName = pickedFile.name;
      isPdfFile = false;
      existingImageUrl = null;
      update();
    }
  }

  void pickPdfFile(BuildContext context) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null && result.files.single.path != null) {
      final platformFile = result.files.single;
      documentFile = File(platformFile.path!);
      documentName = platformFile.name;
      isPdfFile = true;
      image = null;
      existingImageUrl = null;
      update();
    }
  }

  //=============================== Document / Image Uploader =====================================
  void showImageSourceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Select Document / Image Source'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(Icons.camera_alt, color: kPrimary),
                title: Text('Camera'),
                onTap: () {
                  Navigator.of(context).pop();
                  getImage(ImageSource.camera, context);
                },
              ),
              ListTile(
                leading: Icon(Icons.photo_library, color: kPrimary),
                title: Text('Gallery'),
                onTap: () {
                  Navigator.of(context).pop();
                  getImage(ImageSource.gallery, context);
                },
              ),
              ListTile(
                leading: Icon(Icons.picture_as_pdf, color: Colors.red),
                title: Text('PDF Document'),
                onTap: () {
                  Navigator.of(context).pop();
                  pickPdfFile(context);
                },
              ),
            ],
          ),
          actions: <Widget>[
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

  void _showDuplicateInvoiceDialog(
      BuildContext context, Map<String, dynamic> existingRecord, dynamic mounted) {
    final vehicleDetails = existingRecord['vehicleDetails'] is Map
        ? existingRecord['vehicleDetails'] as Map<String, dynamic>
        : <String, dynamic>{};
    final vehicleNum = (vehicleDetails['vehicleNumber'] ??
            vehicleDetails['truckNumber'] ??
            existingRecord['vehicle'] ??
            '—')
        .toString();
    final companyName = (vehicleDetails['companyName'] ?? '').toString();
    final vehicleDisplay = companyName.isNotEmpty && companyName != vehicleNum
        ? '$vehicleNum ($companyName)'
        : vehicleNum;
    final recordDate = (existingRecord['date'] ?? '—').toString();
    final workshop = (existingRecord['workshopName'] ?? '').toString();
    final amount = (existingRecord['invoiceAmount'] ?? '').toString();
    final invoiceNum = invoiceController.text.trim();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        actionsPadding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded,
                color: Color(0xFFD97706), size: 26),
            SizedBox(width: 8.w),
            Expanded(
              child: Text(
                'Duplicate Invoice Number',
                style: appStyle(16, kDark, FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RichText(
              text: TextSpan(
                style: appStyle(13, kDarkGray, FontWeight.normal),
                children: [
                  const TextSpan(text: 'A record with invoice number '),
                  TextSpan(
                    text: '"$invoiceNum"',
                    style: appStyle(13, kPrimary, FontWeight.bold),
                  ),
                  const TextSpan(text: ' already exists in your records:'),
                ],
              ),
            ),
            SizedBox(height: 12.h),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7).withOpacity(0.5),
                border: Border.all(color: const Color(0xFFFCD34D)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  _buildDuplicateInfoRow('Vehicle:', vehicleDisplay),
                  SizedBox(height: 6.h),
                  _buildDuplicateInfoRow('Date:', recordDate),
                  if (workshop.isNotEmpty) ...[
                    SizedBox(height: 6.h),
                    _buildDuplicateInfoRow('Workshop:', workshop),
                  ],
                  if (amount.isNotEmpty) ...[
                    SizedBox(height: 6.h),
                    _buildDuplicateInfoRow('Invoice Amount:', '\$$amount'),
                  ],
                ],
              ),
            ),
            SizedBox(height: 14.h),
            Text(
              'Do you want to proceed and save this record with the same invoice number?',
              style: appStyle(13, kDarkGray, FontWeight.w500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Cancel',
              style: appStyle(14, kGray, FontWeight.w600),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kSecondary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              handleSaveRecords(mounted, context, bypassDuplicateCheck: true);
            },
            child: Text(
              'Proceed',
              style: appStyle(14, kWhite, FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDuplicateInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: appStyle(12, kGray, FontWeight.normal)),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: appStyle(12, kDark, FontWeight.w600),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Future<void> handleSaveRecords(mounted, context,
      {bool bypassDuplicateCheck = false}) async {
    if (isRecordSaving) return;
    if (!_validateMandatoryFields()) {
      return;
    }

    // Check for duplicate invoice number if provided
    final trimmedInvoice = invoiceController.text.trim();
    if (trimmedInvoice.isNotEmpty && !bypassDuplicateCheck) {
      final existingMatch = records.firstWhere(
        (r) =>
            (!isEditing || r['id'] != editingRecordId) &&
            (r['invoice'] ?? '').toString().trim().toLowerCase() ==
                trimmedInvoice.toLowerCase(),
        orElse: () => <String, dynamic>{},
      );

      if (existingMatch.isNotEmpty) {
        _showDuplicateInvoiceDialog(context, existingMatch, mounted);
        return;
      }
    }

    try {
      isRecordSaving = true;
      update();

      String? imageUrl;
      String fileType = isPdfFile ? 'pdf' : 'image';

      // Upload file to Firebase Storage
      if (documentFile != null || image != null) {
        final uploadTarget = documentFile ?? image!;
        final String ext = isPdfFile ? 'pdf' : 'jpg';
        final String fileName =
            '${DateTime.now().millisecondsSinceEpoch}.$ext';
        final Reference storageRef = FirebaseStorage.instance
            .ref()
            .child(isPdfFile ? 'service_documents' : 'service_images')
            .child(fileName);

        final SettableMetadata metadata = SettableMetadata(
          contentType: isPdfFile ? 'application/pdf' : 'image/jpeg',
        );

        final UploadTask uploadTask = storageRef.putFile(uploadTarget, metadata);
        imageUrl = await (await uploadTask).ref.getDownloadURL();
      } else if (isEditing && existingImageUrl != null) {
        imageUrl = existingImageUrl;
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
            showToastMessage(
                "Info",
                "Please select at least one subservice for ${service['sName']}",
                kRed);
            isRecordSaving = false;
            update();
            return;
          }
        }
      }

      final dataServicesRef =
          FirebaseFirestore.instance.collection("DataServicesRecords");
      final docId = isEditing ? editingRecordId! : dataServicesRef.doc().id;

      final enteredMiles = int.tryParse(milesController.text.trim());
      final enteredHours = int.tryParse(hoursController.text.trim());

      // Get vehicle document to check for service-specific defaults
      final vehicleDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(effectiveUserId) // Use effectiveUserId for vehicle data
          .collection('Vehicles')
          .doc(selectedVehicle)
          .get();

      final existingVehicleMiles = int.tryParse(
              (vehicleDoc.data()?['currentMiles'] ?? '0').toString()) ??
          0;
      final existingVehicleHours = int.tryParse(
              (vehicleDoc.data()?['hoursReading'] ?? '0').toString()) ??
          0;

      final currentMiles = enteredMiles ?? existingVehicleMiles;
      final currentHours = enteredHours ?? existingVehicleHours;

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

      // If Other Service is selected, add custom service
      if (isOtherServiceSelected && otherServiceController.text.trim().isNotEmpty) {
        final customName = otherServiceController.text.trim();
        final customId =
            'custom_${customName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_')}';

        servicesData.add({
          "serviceId": customId,
          "serviceName": customName,
          "type": "reading",
          "defaultNotificationValue": 0,
          "nextNotificationValue": 0,
          "subServices": [],
        });

        notificationData.add({
          "serviceName": customName,
          "type": "reading",
          "nextNotificationValue": 0,
          "subServices": [],
        });
      }

      if (dateController.text.trim().isNotEmpty) {
        final parsed = DateTime.tryParse(dateController.text.trim());
        if (parsed != null) {
          selectedDate = parsed;
        }
      }

      final formattedDate = selectedDate != null
          ? DateFormat('yyyy-MM-dd').format(selectedDate!)
          : dateController.text.trim().isNotEmpty
              ? dateController.text.trim()
              : null;

      // Extract myCompany and mycomId from selected vehicle
      final String vehicleMyCompany = (selectedVehicleData?['myCompany'] ??
              vehicleDoc.data()?['myCompany'] ??
              '')
          .toString()
          .trim();
      final String vehicleMyComId = (selectedVehicleData?['mycomId'] ??
              vehicleDoc.data()?['mycomId'] ??
              '')
          .toString()
          .trim();

      final existingRec = isEditing
          ? records.firstWhere((r) => r['id'] == editingRecordId,
              orElse: () => {})
          : {};

      final recordData = {
        "active": true,
        "userId": effectiveUserId, // Use effectiveUserId for the record
        "vehicleId": selectedVehicle,
        "myCompany": vehicleMyCompany,
        "mycomId": vehicleMyComId,
        "imageUrl": imageUrl,
        "fileType": fileType,
        "vehicleDetails": {
          ...selectedVehicleData!,
          if (vehicleMyCompany.isNotEmpty) "myCompany": vehicleMyCompany,
          if (vehicleMyComId.isNotEmpty) "mycomId": vehicleMyComId,
          "currentMiles": currentMiles.toString(),
          "nextNotificationMiles": notificationData,
        },
        "services": servicesData,
        "invoice": invoiceController.text.trim(),
        "invoiceAmount": invoiceAmountController.text.trim(),
        "description": descriptionController.text.trim(),
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
        "workshopName": workshopController.text.trim(),
        "createdAt": isEditing
            ? (existingRec['createdAt'] ?? DateTime.now().toIso8601String())
            : DateTime.now().toIso8601String(),
        "updatedAt": DateTime.now().toIso8601String(),
        "addedFrom": Platform.isAndroid
            ? "Android"
            : Platform.isIOS
                ? "iOS"
                : "N/A",
      };

      // Auto-save new workshop to Users/{effectiveUserId}/recordWorkshopName (deduplicated)
      final String enteredWorkshop = workshopController.text.trim();
      if (enteredWorkshop.isNotEmpty) {
        if (!workshopList.any((w) => w.toLowerCase() == enteredWorkshop.toLowerCase())) {
          FirebaseFirestore.instance
              .collection('Users')
              .doc(effectiveUserId)
              .collection('recordWorkshopName')
              .add({
            'workshopName': enteredWorkshop,
            'createdAt': FieldValue.serverTimestamp(),
          });
          workshopList.add(enteredWorkshop);
          workshopList.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
        }
      }

      // Get current user data to determine the actual owner
      final currentUserDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId) // Use currentUId to check team membership
          .get();

      final isTeamMember = currentUserDoc.data()?['isTeamMember'] == true;
      final ownerUid =
          (isTeamMember == true && currentUserDoc.data()?['createdBy'] != null)
              ? currentUserDoc.data()!['createdBy']
              : currentUId; // Use currentUId for non-team members

      final batch = FirebaseFirestore.instance.batch();

      // Save to owner's DataServices collection
      final ownerDataServicesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(ownerUid) // Use the determined ownerUid
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

            final existingServiceIndex = updatedVehicleServices.indexWhere(
              (service) => service['serviceId'] == serviceId,
            );

            if (existingServiceIndex != -1) {
              updatedVehicleServices[existingServiceIndex] = {
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
              };
            } else {
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

          Map<String, dynamic> vehicleUpdateData = {
            'updatedAt': FieldValue.serverTimestamp(),
            'services': updatedVehicleServices,
            'nextNotificationMiles': notificationData,
          };
          if (enteredMiles != null && enteredMiles > 0) {
            vehicleUpdateData['currentMiles'] = enteredMiles.toString();
            vehicleUpdateData['currentMilesArray'] = FieldValue.arrayUnion([
              {"miles": enteredMiles, "date": DateTime.now().toIso8601String()}
            ]);
          }
          if (enteredHours != null && enteredHours > 0) {
            vehicleUpdateData['hoursReading'] = enteredHours.toString();
            vehicleUpdateData['hoursReadingArray'] = FieldValue.arrayUnion([
              {"hours": enteredHours, "date": DateTime.now().toIso8601String()}
            ]);
          }

          batch.update(userVehicleRef, vehicleUpdateData);
        }
      }

      await batch.commit();
      await triggerDailyDayCheck(ownerUid, selectedVehicle!);
      resetForm();

      showToastMessage(
          "Info",
          isEditing
              ? "Record updated successfully"
              : "Record saved successfully",
          kSecondary);

      refreshPage(mounted, context);
    } catch (e, stackTrace) {
      debugPrint('Error Saving records: ${e.toString()}');
      debugPrint(stackTrace.toString());
      showToastMessage("Info", "Error saving records.", kRed);
    } finally {
      isRecordSaving = false;
      update();
    }
  }

  Future<void> triggerDailyDayCheck(String ownerId, String vehicleId) async {
    try {
      final callable = FirebaseFunctions.instance.httpsCallable(
        'startDailyDayCheckForUser',
      );

      await callable.call({
        'ownerId': ownerId,
        'vehicleId': vehicleId,
      });

      print('Daily day check started for owner: $ownerId, vehicle: $vehicleId');
    } catch (e) {
      print('Error triggering daily day check: $e');
    }
  }

  void handleEditRecord(Map<String, dynamic> record) {
    isEditing = true;
    editingRecordId = record['id'];
    originalRecordDate = DateTime.tryParse(record['date']?.toString() ?? '');
    selectedVehicle = record['vehicleId'];
    selectedVehicleData = record['vehicleDetails'];

    // Initialize serviceDefaultValues from vehicle services first
    if (record['vehicleDetails'] != null &&
        record['vehicleDetails']['services'] != null) {
      final vehicleServices =
          List<Map<String, dynamic>>.from(record['vehicleDetails']['services']);

      serviceDefaultValues.clear();
      final recordServices = record['services'] as List<dynamic>? ?? [];
      for (var service in recordServices) {
        String serviceId = (service['serviceId'] ?? '').toString();
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
        } else if (service['defaultNotificationValue'] != null) {
          serviceDefaultValues[serviceId] =
              service['defaultNotificationValue'] is int
                  ? service['defaultNotificationValue']
                  : int.tryParse(service['defaultNotificationValue'].toString()) ?? 0;
        }
      }
    }

    selectedServices.clear();
    selectedSubServices.clear();
    isOtherServiceSelected = false;
    otherServiceController.clear();

    final recordServices = record['services'] as List<dynamic>? ?? [];
    for (var service in recordServices) {
      String serviceId = (service['serviceId'] ?? '').toString();
      if (serviceId.startsWith('custom_')) {
        isOtherServiceSelected = true;
        otherServiceController.text = (service['serviceName'] ?? '').toString();
      } else if (serviceId.isNotEmpty) {
        selectedServices.add(serviceId);
      }

      if (service['subServices'] != null) {
        selectedSubServices[serviceId] = (service['subServices'] as List)
            .map<String>((sub) => (sub is Map ? sub['name'] : sub).toString())
            .toList();
      }
    }

    if (record['imageUrl'] != null && record['imageUrl'].toString().isNotEmpty) {
      if (record['imageUrl'] is String) {
        image = null;
        documentFile = null;
        existingImageUrl = record['imageUrl'];
        isPdfFile = record['imageUrl'].toString().toLowerCase().contains('.pdf') ||
            record['fileType'] == 'pdf';
      } else if (record['imageUrl'] is File) {
        image = record['imageUrl'] as File;
        documentFile = record['imageUrl'] as File;
        existingImageUrl = null;
      }
    } else {
      image = null;
      documentFile = null;
      existingImageUrl = null;
      isPdfFile = false;
    }

    milesController.text = (record['miles'] ?? '').toString();
    hoursController.text = (record['hours'] ?? '').toString();
    workshopController.text = (record['workshopName'] ?? '').toString();
    invoiceController.text = (record['invoice'] ?? '').toString();
    invoiceAmountController.text = (record['invoiceAmount'] ?? '').toString();
    descriptionController.text = (record['description'] ?? '').toString();
    if (record['date'] != null) {
      selectedDate = DateTime.tryParse(record['date'].toString());
      dateController.text = record['date'].toString();
    } else {
      selectedDate = null;
      dateController.clear();
    }
    showAddRecords = true;
    update();
  }

  void handleDuplicateRecord(Map<String, dynamic> record) {
    isEditing = false;
    editingRecordId = null;
    originalRecordDate = null;
    selectedVehicle = record['vehicleId'];
    selectedVehicleData = record['vehicleDetails'];

    // Initialize serviceDefaultValues from vehicle services first
    if (record['vehicleDetails'] != null &&
        record['vehicleDetails']['services'] != null) {
      final vehicleServices =
          List<Map<String, dynamic>>.from(record['vehicleDetails']['services']);

      serviceDefaultValues.clear();
      final recordServices = record['services'] as List<dynamic>? ?? [];
      for (var service in recordServices) {
        String serviceId = (service['serviceId'] ?? '').toString();
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
        } else if (service['defaultNotificationValue'] != null) {
          serviceDefaultValues[serviceId] =
              service['defaultNotificationValue'] is int
                  ? service['defaultNotificationValue']
                  : int.tryParse(service['defaultNotificationValue'].toString()) ?? 0;
        }
      }
    }

    selectedServices.clear();
    selectedSubServices.clear();
    isOtherServiceSelected = false;
    otherServiceController.clear();

    final recordServices = record['services'] as List<dynamic>? ?? [];
    for (var service in recordServices) {
      String serviceId = (service['serviceId'] ?? '').toString();
      if (serviceId.startsWith('custom_')) {
        isOtherServiceSelected = true;
        otherServiceController.text = (service['serviceName'] ?? '').toString();
      } else if (serviceId.isNotEmpty) {
        selectedServices.add(serviceId);
      }

      if (service['subServices'] != null) {
        selectedSubServices[serviceId] = (service['subServices'] as List)
            .map<String>((sub) => (sub is Map ? sub['name'] : sub).toString())
            .toList();
      }
    }

    if (record['imageUrl'] != null && record['imageUrl'].toString().isNotEmpty) {
      if (record['imageUrl'] is String) {
        image = null;
        documentFile = null;
        existingImageUrl = record['imageUrl'];
        isPdfFile = record['imageUrl'].toString().toLowerCase().contains('.pdf') ||
            record['fileType'] == 'pdf';
      } else if (record['imageUrl'] is File) {
        image = record['imageUrl'] as File;
        documentFile = record['imageUrl'] as File;
        existingImageUrl = null;
      }
    } else {
      image = null;
      documentFile = null;
      existingImageUrl = null;
      isPdfFile = false;
    }

    milesController.text = (record['miles'] ?? '').toString();
    hoursController.text = (record['hours'] ?? '').toString();
    workshopController.text = (record['workshopName'] ?? '').toString();
    invoiceController.text = (record['invoice'] ?? '').toString();
    invoiceAmountController.text = (record['invoiceAmount'] ?? '').toString();
    descriptionController.text = (record['description'] ?? '').toString();

    if (record['date'] != null) {
      selectedDate = DateTime.tryParse(record['date'].toString());
      dateController.text = record['date'].toString();
    } else {
      selectedDate = null;
      dateController.clear();
    }

    showAddRecords = true;
    update();
    showToastMessage(
        "Success",
        "Record duplicated! Modify details and save as new record.",
        kSecondary);
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

      final isWithinDateRange =
          (summaryStartDate == null || recordDate.isAfter(summaryStartDate!)) &&
              (summaryEndDate == null ||
                  recordDate.isBefore(summaryEndDate!.add(Duration(days: 1))));

      final matchesVehicleType = summaryVehicleTypeFilter == 'All' ||
          vehicleType == summaryVehicleTypeFilter;

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

    if (selectedServices.isEmpty &&
        (!isOtherServiceSelected ||
            otherServiceController.text.trim().isEmpty)) {
      showToastMessage("Error", "Please select at least one service", kRed);
      return false;
    }

    if (isOtherServiceSelected &&
        otherServiceController.text.trim().isEmpty) {
      showToastMessage("Error", "Please enter a custom service name", kRed);
      return false;
    }

    // Miles and Hours are optional

    if (dateController.text.trim().isNotEmpty) {
      final parsed = DateTime.tryParse(dateController.text.trim());
      if (parsed != null) {
        selectedDate = parsed;
      }
    }

    if (selectedDate == null && dateController.text.trim().isEmpty) {
      showToastMessage("Error", "Please enter or select a date", kRed);
      return false;
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (selectedDate != null &&
        DateTime(selectedDate!.year, selectedDate!.month, selectedDate!.day)
            .isAfter(today)) {
      showToastMessage(
          "Error",
          "Future dates cannot be selected. Please select today or a past date.",
          kRed);
      return false;
    }

    return true;
  }

  String normalizeString(String value) {
    return value.toLowerCase().replaceAll(RegExp(r'\s+'), '');
  }

  Widget buildServiceChip(
      Map<String, dynamic> service, bool isSelected, BuildContext context) {
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
              if (isSelected) buildCustomTickBox()
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
            if (selected) {
              selectedServices.add(service['sId']);
              selectedSubServices[service['sId']] = [];
            } else {
              selectedServices.remove(service['sId']);
              selectedSubServices.remove(service['sId']);
            }
            updateSelectedVehicleAndService();
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
                        if (isSubSelected) buildCustomTickBox()
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
                        final currentSubs =
                            selectedSubServices[service['sId']] ?? [];

                        if (selected && currentSubs.isNotEmpty) {
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

                      if (selected) {
                        selectedSubServices[service['sId']] ??= [];
                        selectedSubServices[service['sId']]!
                            .add(subServiceName);
                      } else {
                        selectedSubServices[service['sId']]
                            ?.remove(subServiceName);
                      }
                      update();
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

  void resetForm() {
    isEditing = false;
    isRecordSaving = false;
    editingRecordId = null;
    selectedVehicle = null;
    image = null;
    documentFile = null;
    documentName = null;
    isPdfFile = false;
    existingImageUrl = null;
    selectedServices.clear();
    selectedSubServices.clear();
    serviceDefaultValues.clear();
    isOtherServiceSelected = false;
    otherServiceController.clear();
    milesController.clear();
    invoiceAmountController.clear();
    hoursController.clear();
    workshopController.clear();
    invoiceController.clear();
    descriptionController.clear();
    selectedPackages.clear();
    selectedDate = null;
    dateController.clear();
    showAddRecords = false;
    selectedVehicleData = null;
    selectedServiceData.clear();
    update();
  }

  void resetFilters() {
    filterVehicle = '';
    filterService = '';
    startDate = null;
    endDate = null;
    showSearchFilter = false;
    showVehicleSearch = false;
    showServiceSearch = false;
    showDateSearch = false;
    showCombinedSearch = false;
    update();
  }

  @override
  void onClose() {
    try {
      vehiclesSubscription.cancel();
      recordsSubscription.cancel();
      servicesSubscription.cancel();
      milesSubscription.cancel();
      packagesSubscription.cancel();
      usersSubscription.cancel();
      workshopSubscription?.cancel();
    } catch (e) {
      log("Error canceling streams in ReportsController onClose: $e");
    }
    super.onClose();
  }

  Future<void> refreshPage(mounted, context) async {
    try {
      resetForm();
      resetFilters();
      initializeStreams();

      // setState(() {
      showAddRecords = false;
      showSearchFilter = false;
      showAddMiles = false;
      showVehicleSearch = false;
      showServiceSearch = false;
      showDateSearch = false;
      showCombinedSearch = false;
      update();
      // });

      if (mounted) update();

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
}
