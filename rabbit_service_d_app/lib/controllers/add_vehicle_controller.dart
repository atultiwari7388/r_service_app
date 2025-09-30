import "dart:async";
import "dart:developer";
import "package:cloud_firestore/cloud_firestore.dart";
import "package:cloud_functions/cloud_functions.dart";
import "package:firebase_auth/firebase_auth.dart";
import "package:flutter/material.dart";
import "package:get/get.dart";
import "package:intl/intl.dart";
import "package:regal_service_d_app/utils/constants.dart";
import "package:regal_service_d_app/utils/show_toast_msg.dart";

class AddVehicleController extends GetxController {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final vehicleNumberController = TextEditingController();
  final vinController = TextEditingController();
  final licensePlateController = TextEditingController();
  final currentMilesController = TextEditingController();
  final hoursReadingController = TextEditingController();
  final dotController = TextEditingController();
  final iccmsController = TextEditingController();

  DateTime? selectedYear;
  DateTime? oilChangeDate;
  String? selectedCompany;
  String? selectedVehicleType;
  String? selectedEngineName;
  List<String> companies = [];
  List<String> vehicleTypes = [];
  List<String> engineNameList = [];
  List<Map<String, dynamic>> servicesData = [];
  bool isLoading = true;
  bool isSaving = false;
  StreamSubscription<DocumentSnapshot>? engineNameSubscription;

  Future<void> selectYear(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedYear ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != selectedYear) {
      selectedYear = picked;
      update();
    }
  }

  Future<void> selectOilChangeDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: oilChangeDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != oilChangeDate) {
      oilChangeDate = picked;
      update();
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

        servicesData = servicesList.cast<Map<String, dynamic>>();
        isLoading = false;
        update();
      } else {
        print("No services data found.");
        isLoading = false;
        update();
      }
    } catch (e) {
      print("Error fetching services data: $e");

      isLoading = false;
      update();
    }
  }

  List<Map<String, dynamic>> calculateNextNotificationMiles() {
    List<Map<String, dynamic>> nextNotificationMiles = [];
    int currentMiles = int.tryParse(currentMilesController.text) ?? 0;

    log('Current Miles: $currentMiles');
    log('Selected Engine: $selectedEngineName');
    log('Selected Vehicle Type: $selectedVehicleType');

    for (var service in servicesData) {
      log('\nChecking service: ${service['sName']}');

      if (service['vType'] == selectedVehicleType) {
        String serviceName = service['sName'];
        String serviceId = service['sId'] ?? '';
        List<dynamic> subServices = service['subServices'] ?? [];
        List<dynamic> defaultValues = service['dValues'] ?? [];

        // Track if we found any matches for this service
        bool foundMatch = false;

        // Check all default values for brand matches
        for (var defaultValue in defaultValues) {
          if (defaultValue['brand'].toString().toLowerCase() ==
              selectedEngineName?.toLowerCase()) {
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

        vehicleTypes = List<String>.from(vehicleTypeList);
        update();
      }
    } catch (e) {
      print('Error fetching vehicle types: $e');
    }
  }

  Future<void> fetchCompanyNames() async {
    try {
      if (selectedVehicleType == null) return;

      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('companyNameL')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> companyList = metadataSnapshot.data()?['data'] ?? [];

        // Filter companies based on vehicle type
        List<String> filteredCompanies = companyList
            .where((company) => company['type'] == selectedVehicleType)
            .map((company) => company['cName'].toString().toUpperCase())
            .toList();

        companies = filteredCompanies;
        // Reset company selection when vehicle type changes
        selectedCompany = null;
        selectedEngineName = null;
        update();
      }
    } catch (e) {
      print('Error fetching company names: $e');
    }
  }

  void setupEngineNameListener() {
    print('Setting up engine name listener');
    engineNameSubscription?.cancel();

    if (selectedVehicleType == null || selectedCompany == null) {
      print('Vehicle type or company not selected');
      engineNameList = [];
      selectedEngineName = null;
      update();
      return;
    }

    print('Subscribing to engine name list updates');
    engineNameSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('engineNameList')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        print('Received engine name list snapshot');
        List<dynamic> engineNameList = snapshot.data()?['data'] ?? [];
        print('Raw engine name list: $engineNameList');

        String selectedCompanyUpper = selectedCompany!.toUpperCase().trim();
        String selectedType = selectedVehicleType!.trim();
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

        engineNameList = filteredList;
        if (!engineNameList.contains(selectedEngineName)) {
          print(
              'Previously selected engine name no longer valid, resetting selection');
          selectedEngineName = null;
        }
        update();
      } else {
        print('Engine name list snapshot does not exist');
      }
    });
  }

  Future<void> saveVehicleData(BuildContext context) async {
    isSaving = true;
    update();
    try {
      CollectionReference vehiclesRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles');

      // Check if the vehicle already exists based on vehicle number, vehicleType, companyName, and engineName
      QuerySnapshot existingVehicles = await vehiclesRef
          .where('vehicleNumber',
              isEqualTo: vehicleNumberController.text.toString())
          .where('vehicleType', isEqualTo: selectedVehicleType)
          .where('companyName', isEqualTo: selectedCompany?.toUpperCase())
          .where('engineName', isEqualTo: selectedEngineName?.toUpperCase())
          .get();

      if (existingVehicles.docs.isNotEmpty) {
        isSaving = false;
        update();
        showToastMessage('Already', 'Vehicle already added', kRed);

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
        'vehicleType': selectedVehicleType,
        'companyName': selectedCompany?.toUpperCase(),
        'engineName': selectedEngineName?.toUpperCase(),
        'vehicleNumber': vehicleNumberController.text.toString(),
        'vin': vinController.text.toString(),
        'dot': dotController.text.toString(),
        'iccms': iccmsController.text.toString(),
        'licensePlate': licensePlateController.text.toString(),
        'year': selectedYear != null
            ? DateFormat('yyyy-MM-dd').format(selectedYear!)
            : null,
        'isSet': true,
        "uploadedDocuments": [],
        'createdAt': FieldValue.serverTimestamp(),
        'currentMilesArray': [
          {
            "miles": currentMilesController.text.isNotEmpty
                ? int.parse(currentMilesController.text)
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

      if (selectedVehicleType == 'Truck') {
        vehicleData['currentMiles'] = currentMilesController.text.toString();
        vehicleData['prevMilesValue'] = currentMilesController.text.toString();
        vehicleData['firstTimeMiles'] = currentMilesController.text.toString();
        vehicleData['oilChangeDate'] = '';
        vehicleData['hoursReading'] = '';
        vehicleData['prevHoursReadingValue'] = '';
      }

      if (selectedVehicleType == 'Trailer') {
        vehicleData['currentMiles'] = '';
        vehicleData['prevMilesValue'] = '';
        vehicleData['firstTimeMiles'] = '';
        vehicleData['oilChangeDate'] = oilChangeDate != null
            ? DateFormat('yyyy-MM-dd').format(oilChangeDate!)
            : null;
        vehicleData['hoursReading'] = hoursReadingController.text.toString();
        vehicleData['prevHoursReadingValue'] =
            hoursReadingController.text.toString();
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

      isSaving = false;
      update();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle added successfully')),
      );
      Navigator.pop(context);
    } catch (e) {
      isSaving = false;
      update();

      print('Error adding vehicle: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding vehicle: $e')),
      );
    } finally {
      isSaving = false;
      update();
    }
  }

  @override
  void onInit() {
    super.onInit();
    _fetchVehicleTypes();
    _fetchServicesData();
  }

  @override
  void dispose() {
    engineNameSubscription?.cancel();
    super.dispose();
  }
}
