import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/miles_details_screen.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/records_details_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  // State variables
  String? selectedVehicle;
  String? selectedPackage;
  String? selectedRecordsVehicle;
  Set<String> selectedServices = {};
  Map<String, List<String>> selectedSubServices = {};
  Map<String, int> serviceDefaultValues = {};
  final TextEditingController milesController = TextEditingController();
  final TextEditingController todayMilesController = TextEditingController();
  final TextEditingController hoursController = TextEditingController();
  final TextEditingController workshopController = TextEditingController();
  final TextEditingController invoiceController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController serviceSearchController = TextEditingController();
  final TextEditingController vehicleSearchController = TextEditingController();
  final TextEditingController dateSearchController = TextEditingController();
  DateTime? selectedDate;
  late TabController _tabController;

  bool showAddRecords = false;
  bool showSearchFilter = false;
  bool showAddMiles = false;
  bool showVehicleSearch = false;
  bool showServiceSearch = false;
  bool showDateSearch = false;
  bool showCombinedSearch = false;

  // Data storage
  final List<Map<String, dynamic>> vehicles = [];
  final List<Map<String, dynamic>> services = [];
  final List<Map<String, dynamic>> records = [];
  final List<Map<String, dynamic>> milesToAddInRecords = [];
  final List<String> packages = [];

  // Stream subscriptions
  late StreamSubscription vehiclesSubscription;
  late StreamSubscription recordsSubscription;
  late StreamSubscription servicesSubscription;
  late StreamSubscription milesSubscription;
  late StreamSubscription packagesSubscription;
  String selectedVehicleType = 'Truck';

  // Selected data
  Map<String, dynamic>? selectedVehicleData;
  List<Map<String, dynamic>> selectedServiceData = [];

  // Search and filter variables
  String filterVehicle = '';
  String filterService = '';
  String filterMiles = '';
  DateTime? startDate;
  DateTime? endDate;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    initializeStreams();
  }

  void initializeStreams() {
    // Setup vehicle stream
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection("Vehicles")
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
        .doc('servicesData')
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
                      'pName': service['pName'] ??
                          [], // Handle empty or missing pName
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
        .snapshots()
        .listen((snapshot) {
      setState(() {
        records.clear();
        records.addAll(snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
              'vehicle': doc['vehicleDetails']['companyName']
            }));
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
        .doc('servicePackages')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final packagesData = snapshot.data()?['data']
            as List<dynamic>?; // Fetch data as List<dynamic>
        if (packagesData != null) {
          setState(() {
            packages.clear();
            packages
                .addAll(packagesData.cast<String>()); // Convert to List<String>
            log("message: $packages");
          });
        }
      }
    });
  }

  void updateServiceDefaultValues() {
    if (selectedVehicle != null && selectedServices.isNotEmpty) {
      for (var serviceId in selectedServices) {
        final selectedService = services.firstWhere(
          (service) => service['sId'] == serviceId,
          orElse: () => <String, dynamic>{},
        );

        final dValues = selectedService['dValues'] as List<dynamic>?;
        if (dValues != null) {
          // for (var dValue in dValues) {

          for (var dValue in dValues) {
            //now here we comparing the value of the brand with the engine name
            if (dValue['brand'].toString().toUpperCase() ==
                selectedVehicleData?['engineName'].toString().toUpperCase()) {
              serviceDefaultValues[serviceId] =
                  int.parse(dValue['value'].toString().split(',')[0]) * 1000;
              break;
            }
          }
        }
      }
    }
  }

  void updateSelectedVehicleAndService() {
    if (selectedVehicle != null) {
      selectedVehicleData = vehicles.firstWhere(
        (vehicle) => vehicle['id'] == selectedVehicle,
        orElse: () => <String, dynamic>{},
      );
    }

    selectedServiceData = reorderServicesBasedOnPackage()
        .where((service) => selectedServices.contains(service['sId']))
        .toList();

    serviceDefaultValues.clear();
    for (var service in selectedServiceData) {
      final dValues = service['dValues'] as List<dynamic>?;
      if (dValues != null) {
        for (var dValue in dValues) {
          if (dValue['brand'].toString().toUpperCase() ==
              selectedVehicleData?['engineName'].toString().toUpperCase()) {
            serviceDefaultValues[service['sId']] =
                int.parse(dValue['value'].toString().split(',')[0]) * 1000;
            break;
          }
        }
      }
    }

    setState(() {}); // Refresh the UI with updated data
  }

  List<Map<String, dynamic>> reorderServicesBasedOnPackage() {
    if (selectedPackage == null || selectedPackage!.isEmpty) {
      return services; // No package selected, return original order.
    }

    // Separate selected package services from remaining services
    final selectedPackageServices = services.where((service) {
      return (service['pName'] as List).contains(selectedPackage);
    }).toList();

    final remainingServices = services.where((service) {
      return !(service['pName'] as List).contains(selectedPackage);
    }).toList();

    // Combine selected and remaining services
    return [...selectedPackageServices, ...remainingServices];
  }

  List<Map<String, dynamic>> getFilteredRecords() {
    final filteredRecords = records.where((record) {
      final matchesVehicle = filterVehicle.isEmpty ||
          record['vehicleDetails']['vehicleNumber']
              .toString()
              .toLowerCase()
              .contains(filterVehicle.toLowerCase());

      final matchesService = filterService.isEmpty ||
          (record['services'] as List).any((service) => service['serviceName']
              .toString()
              .toLowerCase()
              .contains(filterService.toLowerCase()));

      final matchesDateRange = startDate == null ||
          endDate == null ||
          (DateTime.parse(record['date']).isAfter(startDate!) &&
              DateTime.parse(record['date']).isBefore(endDate!));

      return matchesVehicle && matchesService && matchesDateRange;
    }).toList();

    filteredRecords.sort((a, b) {
      final dateA = DateTime.parse(a['createdAt']);
      final dateB = DateTime.parse(b['createdAt']);
      return dateB.compareTo(dateA); // Sort in descending order
    });

    return filteredRecords;
  }

  Future<void> handleSaveRecords() async {
    try {
      if (selectedVehicle == null || selectedServices.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please select vehicle and at least one service')),
        );
        return;
      }

      final batch = FirebaseFirestore.instance.batch();
      final dataServicesUserRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('DataServices');
      final dataServicesRef =
          FirebaseFirestore.instance.collection("DataServicesRecords");
      final vehicleRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .doc(selectedVehicle);

      final docId = dataServicesUserRef.doc().id;
      final currentMiles = int.tryParse(milesController.text) ?? 0;

      List<Map<String, dynamic>> servicesData = [];
      List<Map<String, dynamic>> notificationData = [];
      List<int> allNextNotificationValues = [];

      for (var serviceId in selectedServices) {
        final service = services.firstWhere((s) => s['sId'] == serviceId);
        final defaultValue = serviceDefaultValues[serviceId] ?? 0;
        //if the default value is 0 then the next notification value will be 0
        final nextNotificationValue =
            defaultValue == 0 ? 0 : currentMiles + defaultValue;

        servicesData.add({
          "serviceId": serviceId,
          "serviceName": service['sName'],
          "defaultNotificationValue": defaultValue,
          "nextNotificationValue": nextNotificationValue,
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
          "nextNotificationValue": nextNotificationValue,
          "subServices": selectedSubServices[serviceId] ?? [],
        });
      }

      final recordData = {
        "userId": currentUId,
        "vehicleId": selectedVehicle,
        "vehicleDetails": {
          ...selectedVehicleData!,
          "currentMiles": currentMiles.toString(),
          "nextNotificationMiles": notificationData,
        },
        "services": servicesData,
        "invoice": invoiceController.text,
        "description": descriptionController.text.toString(),
        'currentMilesArray': FieldValue.arrayUnion([
          {
            "miles": int.parse(currentMiles.toString()),
            "date": DateTime.now().toIso8601String()
          }
        ]),
        "allNextNotificationValues": allNextNotificationValues,
        "totalMiles": currentMiles,
        "miles": selectedVehicleData?['vehicleType'] == "Truck" &&
                selectedServiceData.any((s) => s['vType'] == "Truck")
            ? currentMiles
            : 0,
        "hours": selectedVehicleData?['vehicleType'] == "Trailer" &&
                selectedServiceData.any((s) => s['vType'] == "Trailer")
            ? int.tryParse(hoursController.text) ?? 0
            : 0,
        "date":
            selectedDate?.toIso8601String() ?? DateTime.now().toIso8601String(),
        "workshopName": workshopController.text,
        "createdAt": DateTime.now().toIso8601String(),
      };

      batch.set(dataServicesUserRef.doc(docId), recordData);
      batch.set(dataServicesRef.doc(docId), recordData);
      batch.update(vehicleRef, {
        'currentMiles': currentMiles.toString(),
        'currentMilesArray': FieldValue.arrayUnion([
          {
            "miles": int.parse(currentMiles.toString()),
            "date": DateTime.now().toIso8601String()
          }
        ]),
        'nextNotificationMiles': notificationData,
      });

      await batch.commit();

      resetForm();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Records saved successfully')),
      );
    } catch (e) {
      debugPrint('Error Saving records: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving records: ${e.toString()}')),
      );
    }
  }

  void resetForm() {
    setState(() {
      selectedVehicle = null;
      selectedServices.clear();
      selectedSubServices.clear();
      serviceDefaultValues.clear();
      milesController.clear();
      hoursController.clear();
      workshopController.clear();
      invoiceController.clear();
      descriptionController.clear();
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
    await Future.delayed(Duration(seconds: 2));
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
    serviceSearchController.dispose();
    vehicleSearchController.dispose();
    dateSearchController.dispose();
    _tabController.dispose();
    packagesSubscription.cancel();
    super.dispose();
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
        title: Text('Records',
                style: appStyleUniverse(28, kDark, FontWeight.normal))
            .animate()
            .fadeIn(duration: 600.ms)
            .slideX(begin: -0.2, end: 0),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshPage,
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(10.0.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        setState(() {
                          showSearchFilter = true;
                          showAddRecords = false;
                          showAddMiles = false;
                          showVehicleSearch = value == 'vehicle';
                          showServiceSearch = value == 'service';
                          showDateSearch = value == 'date';
                          showCombinedSearch = value == 'combined';
                        });
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'vehicle',
                          child: Text('Search by Vehicle',
                              style: appStyleUniverse(
                                  15, kDark, FontWeight.normal)),
                        ),
                        PopupMenuItem(
                          value: 'service',
                          child: Text('Search by Service',
                              style: appStyleUniverse(
                                  15, kDark, FontWeight.normal)),
                        ),
                        PopupMenuItem(
                          value: 'date',
                          child: Text('Search by Date',
                              style: appStyleUniverse(
                                  15, kDark, FontWeight.normal)),
                        ),
                        PopupMenuItem(
                          value: 'combined',
                          child: Text('Search All',
                              style: appStyleUniverse(
                                  15, kDark, FontWeight.normal)),
                        ),
                      ],
                      child: Container(
                        height: 45.h,
                        width: 93.w,
                        decoration: BoxDecoration(
                          color: kPrimary,
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search, color: Colors.white),
                            Text('Search',
                                style: appStyleUniverse(
                                    14, Colors.white, FontWeight.w500)),
                          ],
                        ),
                      ),
                    ),
                    buildCustomRowButton(Icons.add, "Records", kSecondary, () {
                      setState(() {
                        showAddRecords = !showAddRecords;
                        showSearchFilter = false;
                        showAddMiles = false;
                      });
                    }),
                    buildCustomRowButton(Icons.add, "Add Miles", kPrimary, () {
                      setState(() {
                        showAddMiles = !showAddMiles;
                        showSearchFilter = false;
                        showAddRecords = false;
                      });
                    }),
                  ],
                ),
                SizedBox(height: 20.h),

                // Search & Filter Section
                if (showSearchFilter) ...[
                  Card(
                    elevation: 4,
                    child: Padding(
                      padding: EdgeInsets.all(16.0.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Search & Filter',
                              style: appStyleUniverse(
                                  18, kDark, FontWeight.normal)),
                          SizedBox(height: 16.h),
                          if (showVehicleSearch || showCombinedSearch)
                            DropdownButtonFormField<String>(
                              decoration: InputDecoration(
                                labelText: 'Search by Vehicle',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                prefixIcon:
                                    Icon(Icons.directions_car, color: kPrimary),
                              ),
                              items: vehicles.map((vehicle) {
                                return DropdownMenuItem<String>(
                                  value: vehicle['vehicleNumber'],
                                  child: Text(
                                    "${vehicle['vehicleNumber']} (${vehicle['companyName']}) ",
                                    style: appStyleUniverse(
                                        14, kDark, FontWeight.normal),
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  filterVehicle = value ?? '';
                                });
                              },
                              value:
                                  filterVehicle.isEmpty ? null : filterVehicle,
                              hint: Text(
                                'Select Vehicle',
                                style: appStyleUniverse(
                                    14, kDark, FontWeight.normal),
                              ),
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
                                prefixIcon: Icon(Icons.build, color: kPrimary),
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
                              value:
                                  filterService.isEmpty ? null : filterService,
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
                                        prefixIcon: Icon(Icons.calendar_today,
                                            color: kPrimary),
                                      ),
                                      child: Text(
                                        startDate != null
                                            ? DateFormat('dd-MM-yyyy')
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
                                        initialDate: endDate ?? DateTime.now(),
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
                                        prefixIcon: Icon(Icons.calendar_today,
                                            color: kPrimary),
                                      ),
                                      child: Text(
                                        endDate != null
                                            ? DateFormat('dd-MM-yyyy')
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
                              text: "Reset",
                              onPress: resetFilters,
                              color: kPrimary),
                          SizedBox(height: 16.h),
                        ],
                      ),
                    ),
                  ),
                ],

                if (showAddRecords) ...[
                  SizedBox(height: 20.h),
                  Card(
                    elevation: 4,
                    child: Padding(
                      padding: EdgeInsets.all(8.0.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Vehicle Dropdown
                          DropdownButtonFormField<String>(
                            value: selectedVehicle,
                            hint: const Text('Select Vehicle'),
                            items: vehicles.map((vehicle) {
                              return DropdownMenuItem<String>(
                                value: vehicle['id'],
                                child: Text(
                                  '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                  style: appStyleUniverse(
                                      17, kDark, FontWeight.normal),
                                ),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                selectedVehicle = value;
                                selectedServices
                                    .clear(); // Clear selected services when vehicle changes
                                updateSelectedVehicleAndService();
                              });
                            },
                          ),

                          SizedBox(height: 16.h),

                          // Select Package (Optional)
                          if (selectedVehicle != null)
                            // Package Dropdown

                            DropdownButtonFormField<String>(
                              value: selectedPackage,
                              hint: const Text('Select Package (Optional)'),
                              items: packages.map((package) {
                                return DropdownMenuItem<String>(
                                  value: package,
                                  child: Text(
                                    package,
                                    style: appStyleUniverse(
                                        16, kDark, FontWeight.normal),
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedPackage = value;

                                  // Clear selected services before adding new ones
                                  selectedServices.clear();

                                  // Normalize selected package name
                                  String normalizedPackage =
                                      normalizeString(value ?? '');

                                  // Find the matching services based on the normalized package name
                                  for (var service in services) {
                                    // Ensure the pName array is not null and contains the selected package
                                    if (service['pName'] != null &&
                                        service['pName'].isNotEmpty) {
                                      // Check if any value in pName matches the normalized package name
                                      for (var packageName
                                          in service['pName']) {
                                        if (normalizeString(packageName) ==
                                            normalizedPackage) {
                                          // Add the service to selectedServices
                                          selectedServices.add(service['sId']);

                                          // Automatically select subservices if they exist
                                          if (service['subServices'] != null) {
                                            for (var subService
                                                in service['subServices']) {
                                              List<String> subServiceNames =
                                                  List<String>.from(
                                                      subService['sName'] ??
                                                          []);
                                              for (var subServiceName
                                                  in subServiceNames) {
                                                if (subServiceName.isNotEmpty) {
                                                  selectedSubServices[
                                                      service['sId']] ??= [];
                                                  selectedSubServices[
                                                          service['sId']]!
                                                      .add(subServiceName);
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }

                                  // Update the selected services after selection
                                  updateSelectedVehicleAndService();
                                });
                              },
                            ),

                          SizedBox(height: 16.h),

                          // Services Selection with Search
                          Text('Select Services',
                              style:
                                  appStyleUniverse(16, kDark, FontWeight.w500)),
                          SizedBox(height: 8.h),

                          // Search Bar for Services
                          TextField(
                            controller: serviceSearchController,
                            decoration: InputDecoration(
                              labelText: 'Search Services',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(15),
                                borderSide:
                                    BorderSide(color: Colors.grey.shade400),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(15),
                                borderSide:
                                    BorderSide(color: kPrimary, width: 1),
                              ),
                              prefixIcon: Icon(Icons.search, color: kPrimary),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            onChanged: (value) {
                              setState(() {});
                            },
                          ),
                          SizedBox(height: 8.h),

                          Wrap(
                            spacing: 4.w,
                            runSpacing: 4.h,
                            children: [
                              ...services.where((service) {
                                // Show selected services first
                                return selectedServices
                                    .contains(service['sId']);
                              }).map(
                                  (service) => buildServiceChip(service, true)),
                              ...services.where((service) {
                                // Show non-selected services next
                                final searchTerm =
                                    serviceSearchController.text.toLowerCase();
                                final matchesSearch = searchTerm.isEmpty ||
                                    service['sName']
                                        .toString()
                                        .toLowerCase()
                                        .contains(searchTerm);

                                final matchesVehicleType =
                                    selectedVehicleData == null ||
                                        service['vType'] ==
                                            selectedVehicleData?['vehicleType'];

                                return matchesSearch &&
                                    matchesVehicleType &&
                                    !selectedServices.contains(service['sId']);
                              }).map((service) =>
                                  buildServiceChip(service, false)),
                            ],
                          ),

                          SizedBox(height: 16.h),

                          if (selectedVehicleData?['vehicleType'] == "Truck")
                            TextField(
                              controller: milesController,
                              decoration: const InputDecoration(
                                labelText: 'Miles',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.number,
                            ),

                          if (selectedVehicleData?['vehicleType'] ==
                              "Trailer") ...[
                            TextField(
                              controller: hoursController,
                              decoration: const InputDecoration(
                                labelText: 'Hours',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                            SizedBox(height: 16.h),
                            InkWell(
                              onTap: () async {
                                final DateTime? picked = await showDatePicker(
                                  context: context,
                                  initialDate: selectedDate ?? DateTime.now(),
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
                          ],
                          SizedBox(height: 16.h),

                          // Workshop Name
                          TextField(
                            controller: workshopController,
                            decoration: InputDecoration(
                              labelText: 'Workshop Name',
                              labelStyle: appStyleUniverse(
                                  14, kDark, FontWeight.normal),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          SizedBox(height: 10.h),
                          TextField(
                            controller: invoiceController,
                            decoration: InputDecoration(
                              labelText: 'Invoice (Optional)',
                              labelStyle: appStyleUniverse(
                                  14, kDark, FontWeight.normal),
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.streetAddress,
                          ),
                          SizedBox(height: 16.h),
                          TextField(
                            controller: descriptionController,
                            decoration: InputDecoration(
                              labelText: 'Description (Optional)',
                              labelStyle: appStyleUniverse(
                                  14, kDark, FontWeight.normal),
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.text,
                          ),
                          SizedBox(height: 16.h),

                          // Save Button
                          CustomButton(
                            onPress: handleSaveRecords,
                            color: kPrimary,
                            text: 'Save Record',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                if (showAddMiles) ...[
                  SizedBox(height: 20.h),
                  Card(
                    elevation: 4,
                    child: Padding(
                      padding: EdgeInsets.all(16.0.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Vehicle Dropdown
                          DropdownButtonFormField<String>(
                            value: selectedVehicle,
                            hint: const Text('Select Vehicle'),
                            items: vehicles.map((vehicle) {
                              return DropdownMenuItem<String>(
                                value: vehicle['id'],
                                child: Text(
                                  '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                  style: appStyleUniverse(
                                      14, kDark, FontWeight.normal),
                                ),
                              );
                            }).toList(),
                            onChanged: (value) async {
                              setState(() {
                                selectedVehicle = value;
                                todayMilesController.clear();
                                log("Selected vehicle: $value");
                              });

                              // Fetch the selected vehicle type from Firestore
                              final vehicleDoc = await FirebaseFirestore
                                  .instance
                                  .collection('Users')
                                  .doc(currentUId)
                                  .collection('Vehicles')
                                  .doc(value)
                                  .get();

                              if (vehicleDoc.exists) {
                                setState(() {
                                  selectedVehicleType =
                                      vehicleDoc['vehicleType'];
                                  log("Selected vehicle type: $selectedVehicleType");
                                });
                              } else {
                                log("Vehicle data not found.");
                              }
                            },
                          ),
                          SizedBox(height: 16.h),

                          // Dynamically show input field based on vehicle type
                          if (selectedVehicleType == 'Truck') ...[
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
                          ] else if (selectedVehicleType == 'Trailer') ...[
                            TextField(
                              controller: todayMilesController,
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

                          // Save Button
                          CustomButton(
                            onPress: () async {
                              if (selectedVehicle != null &&
                                  todayMilesController.text.isNotEmpty) {
                                try {
                                  final int enteredValue =
                                      int.parse(todayMilesController.text);
                                  final vehicleId = selectedVehicle;

                                  // Fetch current reading (Miles/Hours) for the selected vehicle
                                  final vehicleDoc = await FirebaseFirestore
                                      .instance
                                      .collection("Users")
                                      .doc(currentUId)
                                      .collection("Vehicles")
                                      .doc(vehicleId)
                                      .get();

                                  if (vehicleDoc.exists) {
                                    final int currentReading = int.parse(
                                      vehicleDoc[selectedVehicleType == 'Truck'
                                              ? 'currentMiles'
                                              : 'hoursReading'] ??
                                          '0',
                                    );

                                    // Validate the entered value
                                    if (enteredValue < currentReading) {
                                      showToastMessage(
                                          "Error",
                                          "${selectedVehicleType == 'Truck' ? 'Miles' : 'Hours'} cannot be less than the current value.",
                                          kRed);
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(
                                              '${selectedVehicleType == 'Truck' ? 'Miles' : 'Hours'} cannot be less than the current value.'),
                                          duration: Duration(seconds: 2),
                                        ),
                                      );
                                      return; // Exit early to prevent further execution
                                    }

                                    // Proceed with saving the data
                                    await FirebaseFirestore.instance
                                        .collection("Users")
                                        .doc(currentUId)
                                        .collection("Vehicles")
                                        .doc(vehicleId)
                                        .update({
                                      selectedVehicleType == 'Truck'
                                              ? "prevMilesValue"
                                              : "prevHoursReadingValue":
                                          currentReading.toString(),
                                      selectedVehicleType == 'Truck'
                                              ? "currentMiles"
                                              : "hoursReading":
                                          enteredValue.toString(),
                                      selectedVehicleType == 'Truck'
                                              ? 'currentMilesArray'
                                              : 'hoursReadingArray':
                                          FieldValue.arrayUnion([
                                        {
                                          selectedVehicleType == 'Truck'
                                              ? "miles"
                                              : "hours": enteredValue,
                                          "date":
                                              DateTime.now().toIso8601String(),
                                        }
                                      ]),
                                    });

                                    debugPrint(
                                        '${selectedVehicleType == 'Truck' ? 'Miles' : 'Hours'} updated successfully!');
                                    todayMilesController.clear();
                                    setState(() {
                                      selectedVehicle = null;
                                      selectedVehicleType = '';
                                    });

                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('saved successfully!'),
                                        duration: Duration(seconds: 2),
                                      ),
                                    );

                                    // Call the cloud function to check for notifications
                                    final HttpsCallable callable =
                                        FirebaseFunctions.instance.httpsCallable(
                                            'checkAndNotifyUserForVehicleService');
                                    final result = await callable.call({
                                      'userId': currentUId,
                                      'vehicleId': vehicleId,
                                    });

                                    log('Cloud function result: ${result.data} vehicle Id $vehicleId');
                                  } else {
                                    throw 'Vehicle data not found';
                                  }
                                } catch (e) {
                                  debugPrint(
                                      'Error updating ${selectedVehicleType == 'Truck' ? 'miles' : 'hours'}: $e');
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Failed to save ${selectedVehicleType == 'Truck' ? 'miles' : 'hours'}: $e'),
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                }
                              }
                            },
                            color: kPrimary,
                            text:
                                'Save ${selectedVehicleType == 'Truck' ? 'Miles' : 'Hours'}',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                TabBar(
                  controller: _tabController,
                  tabs: [
                    Tab(
                      child: Text("My Records",
                          style: appStyleUniverse(20, kDark, FontWeight.w500)),
                    ),
                    Tab(
                      child: Text("My Miles",
                          style: appStyleUniverse(20, kDark, FontWeight.w500)),
                    ),
                  ],
                ),
                SizedBox(height: 20.h),
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // My Records Tab
                      SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Filter Section

                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 16.w),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  SizedBox(height: 10.h),
                                  DropdownButtonFormField<String>(
                                    decoration: InputDecoration(
                                      labelText: 'Filter by Vehicle',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      prefixIcon: Icon(Icons.directions_car,
                                          color: kPrimary),
                                    ),
                                    items: vehicles.map((vehicle) {
                                      return DropdownMenuItem<String>(
                                        value: vehicle['vehicleNumber'],
                                        child: Text(
                                          "${vehicle['vehicleNumber']} (${vehicle['companyName']}) ",
                                          style: appStyleUniverse(
                                              14, kDark, FontWeight.normal),
                                        ),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      setState(() {
                                        filterVehicle = value ?? '';
                                      });
                                    },
                                    value: filterVehicle.isEmpty
                                        ? null
                                        : filterVehicle,
                                    hint: Text(
                                      'Select Vehicle',
                                      style: appStyleUniverse(
                                          14, kDark, FontWeight.normal),
                                    ),
                                  ),
                                  SizedBox(height: 16.h),
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
                                                  ? DateFormat('dd-MM-yyyy')
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
                                                  ? DateFormat('dd-MM-yyyy')
                                                      .format(endDate!)
                                                  : 'Select End Date',
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 16.h),
                                  CustomButton(
                                    text: "Reset Filters",
                                    onPress: resetFilters,
                                    color: kPrimary,
                                  ),
                                  SizedBox(height: 16.h),
                                ],
                              ),
                            ),
                            if (filteredRecords.isEmpty)
                              Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.note_alt_outlined,
                                        size: 80,
                                        color: kPrimary.withOpacity(0.5)),
                                    const SizedBox(height: 16),
                                    Text('No records found',
                                        style: appStyleUniverse(
                                            18, kDarkGray, FontWeight.w500)),
                                  ],
                                ),
                              )
                            else
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: filteredRecords.length,
                                itemBuilder: (context, index) {
                                  final record = filteredRecords[index];
                                  final services =
                                      record['services'] as List<dynamic>;
                                  final date = DateFormat('dd-MM-yy').format(
                                      DateTime.parse(record['createdAt']));

                                  return Container(
                                    margin: EdgeInsets.symmetric(vertical: 8.h),
                                    child: GestureDetector(
                                      onTap: () => Get.to(() =>
                                          RecordsDetailsScreen(record: record)),
                                      child: Card(
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(15.r),
                                          side: BorderSide(
                                            color: kPrimary.withOpacity(0.2),
                                            width: 1,
                                          ),
                                        ),
                                        child: Container(
                                          decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(15.r),
                                          ),
                                          child: Padding(
                                            padding: EdgeInsets.all(16.w),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment
                                                          .spaceBetween,
                                                  children: [
                                                    if (record['invoice']
                                                        .isNotEmpty)
                                                      Container(
                                                        padding: EdgeInsets
                                                            .symmetric(
                                                          horizontal: 12.w,
                                                          vertical: 6.h,
                                                        ),
                                                        decoration:
                                                            BoxDecoration(
                                                          color: kPrimary
                                                              .withOpacity(0.1),
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(
                                                                      20.r),
                                                        ),
                                                        child: Row(
                                                          children: [
                                                            Icon(
                                                                Icons
                                                                    .receipt_outlined,
                                                                size: 20,
                                                                color:
                                                                    kPrimary),
                                                            SizedBox(
                                                                width: 8.w),
                                                            Text(
                                                                "#${record['invoice']}",
                                                                style: appStyleUniverse(
                                                                    16,
                                                                    kDark,
                                                                    FontWeight
                                                                        .w500)),
                                                          ],
                                                        ),
                                                      ),
                                                    Container(
                                                      padding:
                                                          EdgeInsets.symmetric(
                                                        horizontal: 12.w,
                                                        vertical: 6.h,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: kSecondary
                                                            .withOpacity(0.1),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(20.r),
                                                      ),
                                                      child: Row(
                                                        children: [
                                                          Icon(
                                                              Icons
                                                                  .calendar_today,
                                                              size: 18,
                                                              color:
                                                                  kSecondary),
                                                          SizedBox(width: 8.w),
                                                          Text(date,
                                                              style:
                                                                  appStyleUniverse(
                                                                      16,
                                                                      kDark,
                                                                      FontWeight
                                                                          .w500)),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                SizedBox(height: 16.h),
                                                buildInfoRow(
                                                  Icons.directions_car_outlined,
                                                  '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                                                ),
                                                Divider(height: 24.h),
                                                buildInfoRow(
                                                  Icons.build_outlined,
                                                  services.map((service) {
                                                    String serviceName =
                                                        service['serviceName'];
                                                    if ((service['subServices']
                                                                as List?)
                                                            ?.isNotEmpty ??
                                                        false) {
                                                      String subServices =
                                                          (service['subServices']
                                                                  as List)
                                                              .map((s) =>
                                                                  s['name'])
                                                              .join(', ');
                                                      return "$serviceName ($subServices)";
                                                    }
                                                    return serviceName;
                                                  }).join(", "),
                                                ),
                                                Divider(height: 24.h),
                                                buildInfoRow(
                                                  Icons.store_outlined,
                                                  record['workshopName'] ??
                                                      'N/A',
                                                ),
                                                if (record["description"]
                                                    .isNotEmpty) ...[
                                                  Divider(height: 24.h),
                                                  buildInfoRow(
                                                    Icons.description_outlined,
                                                    record['description'],
                                                  ),
                                                ],
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
                                          delay: (index * 100).ms)
                                      .slideX(begin: 0.2, end: 0);
                                },
                              ),
                          ],
                        ),
                      ),
                      // My Miles Tab
                      ListView.builder(
                        itemCount: vehicles.length,
                        itemBuilder: (context, index) {
                          final vehicle = vehicles[index];
                          return GestureDetector(
                            onTap: () => Get.to(
                                () => MilesDetailsScreen(milesRecord: vehicle)),
                            child: Card(
                              margin: EdgeInsets.symmetric(vertical: 8.h),
                              child: ListTile(
                                title: Text(
                                  '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                  style: appStyleUniverse(
                                      16, kDark, FontWeight.w500),
                                ),
                                subtitle: vehicle['vehicleType'] == "Truck"
                                    ? Text(
                                        'Current Miles: ${vehicle['currentMiles'] ?? '0'}',
                                        style: appStyleUniverse(
                                            14, kDarkGray, FontWeight.normal))
                                    : Text(
                                        'Hours Reading: ${vehicle['hoursReading'] ?? '0'}',
                                        style: appStyleUniverse(
                                            14, kDarkGray, FontWeight.normal),
                                      ),
                                trailing: Icon(Icons.directions_car_outlined,
                                    color: kPrimary),
                              ),
                            ).animate().fadeIn(
                                duration: 400.ms, delay: (index * 100).ms),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 20.h),
              ],
            ),
          ),
        ),
      ),
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
          labelPadding: EdgeInsets.all(0),
          label: Text(service['sName']),
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
              spacing: 4.w,
              children: subServices.expand((subService) {
                List<String> sNames =
                    List<String>.from(subService['sName'] ?? []);
                return sNames.map((subServiceName) {
                  if (subServiceName.isEmpty) return Container();
                  return FilterChip(
                    backgroundColor: kSecondary.withOpacity(0.1),
                    labelPadding: EdgeInsets.all(0),
                    label: Text(subServiceName),
                    labelStyle: appStyle(13, kDark, FontWeight.normal),
                    selected: selectedSubServices[service['sId']]
                            ?.contains(subServiceName) ??
                        false,
                    onSelected: (bool selected) {
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
        height: 45.h,
        width: 93.w,
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
}
