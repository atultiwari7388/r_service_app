import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
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
  Set<String> selectedServices = {};
  Map<String, List<String>> selectedSubServices = {};
  Map<String, int> serviceDefaultValues =
      {}; // Added to store per-service default values
  final TextEditingController milesController = TextEditingController();
  final TextEditingController hoursController = TextEditingController();
  final TextEditingController workshopController = TextEditingController();
  final TextEditingController invoiceController = TextEditingController();
  DateTime? selectedDate;
  late AnimationController _animationController;

  bool showAddRecords = false;
  bool showSearchFilter = false;
  bool showAddMiles = false;

  // Data storage
  final List<Map<String, dynamic>> vehicles = [];
  final List<Map<String, dynamic>> services = [];
  final List<Map<String, dynamic>> records = [];

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
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat();

    fetchVehicles();
    fetchServices();
    fetchRecords();
  }

  void fetchVehicles() async {
    try {
      final vehicleSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection("Vehicles")
          .get();

      if (vehicleSnapshot.docs.isEmpty) {
        debugPrint('No vehicles found for user');
        return;
      }

      setState(() {
        vehicles.clear();
        vehicles.addAll(
            vehicleSnapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
      debugPrint('Fetched ${vehicles.length} vehicles');
    } catch (e) {
      debugPrint('Error fetching vehicles: ${e.toString()}');
    }
  }

  void fetchServices() async {
    try {
      final serviceSnapshot = await FirebaseFirestore.instance
          .collection('metadata')
          .doc('servicesData')
          .get();

      if (serviceSnapshot.exists) {
        final servicesData = serviceSnapshot.data()?['data'] as List<dynamic>?;
        if (servicesData != null) {
          setState(() {
            services.clear();
            services.addAll(servicesData.map((service) => {
                  'sId': service['sId'],
                  'sName': service['sName'],
                  'vType': service['vType'],
                  'dValues': service['dValues'],
                  'subServices': service['subServices'] ?? []
                }));

            // Update default values for each selected service
            if (selectedVehicle != null && selectedServices.isNotEmpty) {
              for (var serviceId in selectedServices) {
                final selectedService = services.firstWhere(
                  (service) => service['sId'] == serviceId,
                  orElse: () => <String, dynamic>{},
                );

                final dValues = selectedService['dValues'] as List<dynamic>?;
                if (dValues != null) {
                  for (var dValue in dValues) {
                    if (dValue['brand'].toString().toUpperCase() ==
                        selectedVehicleData?['companyName']
                            .toString()
                            .toUpperCase()) {
                      serviceDefaultValues[serviceId] =
                          int.parse(dValue['value'].toString().split(',')[0]) *
                              1000;
                      debugPrint(
                          'Set default notification value for service $serviceId to: ${serviceDefaultValues[serviceId]}');
                      break;
                    }
                  }
                }
              }
            }
          });
          debugPrint('Fetched ${services.length} services');
        }
      }
    } catch (e) {
      debugPrint('Error fetching services: ${e.toString()}');
    }
  }

  void fetchRecords() async {
    try {
      final recordSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('DataServices')
          .get();

      setState(() {
        records.clear();
        records.addAll(
            recordSnapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
      debugPrint('Fetched ${records.length} records');
    } catch (e) {
      debugPrint('Error fetching records: ${e.toString()}');
    }
  }

  void updateSelectedVehicleAndService() {
    if (selectedVehicle != null) {
      selectedVehicleData = vehicles.firstWhere(
        (vehicle) => vehicle['id'] == selectedVehicle,
        orElse: () => <String, dynamic>{},
      );
      log('Selected vehicle: ${selectedVehicleData?['companyName']}');
    }

    selectedServiceData = services
        .where((service) => selectedServices.contains(service['sId']))
        .toList();
    log('Selected services: ${selectedServiceData.map((s) => s['sName']).join(', ')}');

    // Update default values for each service
    serviceDefaultValues.clear(); // Reset default values
    for (var service in selectedServiceData) {
      final dValues = service['dValues'] as List<dynamic>?;
      if (dValues != null) {
        for (var dValue in dValues) {
          log('Checking dValue: ${dValue.toString()}');
          log('Comparing brands: ${dValue['brand'].toString().toUpperCase()} == ${selectedVehicleData?['companyName'].toString().toUpperCase()}');

          if (dValue['brand'].toString().toUpperCase() ==
              selectedVehicleData?['companyName'].toString().toUpperCase()) {
            serviceDefaultValues[service['sId']] =
                int.parse(dValue['value'].toString().split(',')[0]) * 1000;
            log('Updated default notification value for service ${service['sId']} to: ${serviceDefaultValues[service['sId']]}');
            break;
          }
        }
      } else {
        log('dValues is null for service: ${service['sName']}');
      }
    }

    setState(() {});
  }

  List<Map<String, dynamic>> getFilteredRecords() {
    return records.where((record) {
      final matchesVehicle = filterVehicle.isEmpty ||
          record['vehicleDetails']['vehicleNumber'] == filterVehicle;
      final matchesService =
          filterService.isEmpty || record['serviceId'] == filterService;
      final matchesMiles = filterMiles.isEmpty ||
          record['miles'] >= (int.tryParse(filterMiles) ?? 0);
      final matchesDateRange = startDate == null ||
          endDate == null ||
          (DateTime.parse(record['date']).isAfter(startDate!) &&
              DateTime.parse(record['date']).isBefore(endDate!));

      return matchesVehicle &&
          matchesService &&
          matchesMiles &&
          matchesDateRange;
    }).toList();
  }

  void handleSaveRecords() async {
    try {
      if (selectedVehicle == null || selectedServices.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please select vehicle and at least one service')),
        );
        return;
      }

      final dataServicesUserRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('DataServices');
      final dataServicesRef =
          FirebaseFirestore.instance.collection("DataServicesRecords");

      // Calculate notification values for all services
      List<Map<String, dynamic>> servicesData = [];
      List<int> allNextNotificationValues = [];

      for (var serviceId in selectedServices) {
        final service = services.firstWhere((s) => s['sId'] == serviceId);

        final dValues = service['dValues'] as List<dynamic>?;
        List<int> nextNotificationValues = [];

        if (dValues != null) {
          for (var dValue in dValues) {
            if (dValue['brand'] == selectedVehicleData?['companyName']) {
              final values = dValue['value'].toString().split(',');
              nextNotificationValues =
                  values.map((v) => int.parse(v.trim()) * 1000).toList();
              allNextNotificationValues.addAll(nextNotificationValues);
              break;
            }
          }
        }

        servicesData.add({
          "serviceId": serviceId,
          "serviceName": service['sName'],
          "defaultNotificationValue": serviceDefaultValues[serviceId] ??
              0, // Added default value per service
          "subServices": selectedSubServices[serviceId]
                  ?.map((subService) => {
                        "name": subService,
                        "id": "${serviceId}_${subService.replaceAll(' ', '_')}"
                      })
                  .toList() ??
              [],
          "nextNotificationValues": nextNotificationValues,
        });
      }

      // Create single record with all services
      final recordData = {
        "userId": currentUId,
        "vehicleId": selectedVehicle,
        "vehicleDetails": selectedVehicleData,
        "services": servicesData,
        "invoice": invoiceController.text,
        "currentMilesArray": [
          {
            "miles": int.tryParse(milesController.text) ?? 0,
            "date": DateTime.now().toIso8601String()
          }
        ],
        "allNextNotificationValues": allNextNotificationValues,
        "miles": selectedVehicleData?['vehicleType'] == "Truck" &&
                selectedServiceData.any((s) => s['vType'] == "Truck")
            ? int.tryParse(milesController.text) ?? 0
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

      // Save single record
      await dataServicesUserRef.add(recordData);
      await dataServicesRef.add(recordData);

      fetchRecords();

      setState(() {
        selectedVehicle = null;
        selectedServices.clear();
        selectedSubServices.clear();
        serviceDefaultValues.clear(); // Clear service default values
        milesController.clear();
        hoursController.clear();
        workshopController.clear();
        invoiceController.clear();
        selectedDate = null;
        showAddRecords = false;
        selectedVehicleData = null;
        selectedServiceData.clear();
      });

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

  @override
  void dispose() {
    milesController.dispose();
    hoursController.dispose();
    workshopController.dispose();
    invoiceController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredRecords = getFilteredRecords();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Records',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.2, end: 0),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(10.0.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  buildCustomRowButton(Icons.search, "Search", kPrimary, () {
                    setState(() {
                      showSearchFilter = !showSearchFilter;
                      showAddRecords = false;
                      showAddMiles = false;
                    });
                  }),
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
              SizedBox(height: 10.h),

              // Search & Filter Section
              if (showSearchFilter) ...[
                Card(
                  elevation: 4,
                  child: Padding(
                    padding: EdgeInsets.all(16.0.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Search & Filter',
                          style: TextStyle(
                            fontSize: 18.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 16.h),
                        // Vehicle Filter
                        DropdownButtonFormField<String>(
                          value: filterVehicle.isEmpty ? null : filterVehicle,
                          hint: const Text('Filter by Vehicle'),
                          items: [
                            const DropdownMenuItem(
                              value: '',
                              child: Text('All'),
                            ),
                            ...vehicles.map((vehicle) {
                              return DropdownMenuItem<String>(
                                value: vehicle['vehicleNumber'],
                                child: Text(vehicle['vehicleNumber'] ?? ''),
                              );
                            }).toList(),
                          ],
                          onChanged: (value) {
                            setState(() {
                              filterVehicle = value ?? '';
                            });
                          },
                        ),
                        SizedBox(height: 16.h),
                        // Service Filter
                        DropdownButtonFormField<String>(
                          value: filterService.isEmpty ? null : filterService,
                          hint: const Text('Filter by Service'),
                          items: [
                            const DropdownMenuItem(
                              value: '',
                              child: Text('All'),
                            ),
                            ...services.map((service) {
                              return DropdownMenuItem<String>(
                                value: service['sId'],
                                child: Text(service['sName'] ?? ''),
                              );
                            }).toList(),
                          ],
                          onChanged: (value) {
                            setState(() {
                              filterService = value ?? '';
                            });
                          },
                        ),
                        SizedBox(height: 16.h),
                        // Miles Filter
                        TextField(
                          decoration: const InputDecoration(
                            labelText: 'Minimum Miles',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (value) {
                            setState(() {
                              filterMiles = value;
                            });
                          },
                        ),
                        SizedBox(height: 16.h),
                        // Date Range Filter
                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () async {
                                  final DateTime? picked = await showDatePicker(
                                    context: context,
                                    initialDate: startDate ?? DateTime.now(),
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
                                  decoration: const InputDecoration(
                                    labelText: 'Start Date',
                                    border: OutlineInputBorder(),
                                  ),
                                  child: Text(
                                    startDate != null
                                        ? startDate!
                                            .toLocal()
                                            .toString()
                                            .split(' ')[0]
                                        : 'Select Start Date',
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: InkWell(
                                onTap: () async {
                                  final DateTime? picked = await showDatePicker(
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
                                  decoration: const InputDecoration(
                                    labelText: 'End Date',
                                    border: OutlineInputBorder(),
                                  ),
                                  child: Text(
                                    endDate != null
                                        ? endDate!
                                            .toLocal()
                                            .toString()
                                            .split(' ')[0]
                                        : 'Select End Date',
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
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
                                  '${vehicle['vehicleNumber']} (${vehicle['companyName']})'),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedVehicle = value;
                              updateSelectedVehicleAndService();
                            });
                          },
                        ),
                        SizedBox(height: 16.h),

                        // Services Selection
                        Text('Select Services',
                            style: appStyle(16, kDark, FontWeight.w500)),
                        SizedBox(height: 8.h),
                        Wrap(
                          spacing: 8.w,
                          runSpacing: 8.h,
                          children: services.map((service) {
                            bool isSelected =
                                selectedServices.contains(service['sId']);
                            List<dynamic> subServices =
                                service['subServices'] as List<dynamic>? ?? [];

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FilterChip(
                                  label: Text(service['sName']),
                                  selected: isSelected,
                                  onSelected: (bool selected) {
                                    setState(() {
                                      if (selected) {
                                        selectedServices.add(service['sId']);
                                        selectedSubServices[service['sId']] =
                                            [];
                                      } else {
                                        selectedServices.remove(service['sId']);
                                        selectedSubServices
                                            .remove(service['sId']);
                                      }
                                      updateSelectedVehicleAndService();
                                    });
                                  },
                                ),
                                if (isSelected && subServices.isNotEmpty)
                                  Padding(
                                    padding:
                                        EdgeInsets.only(left: 16.w, top: 4.h),
                                    child: Wrap(
                                      spacing: 8.w,
                                      runSpacing: 4.h,
                                      children: subServices.map((subService) {
                                        List<String> sNames = List<String>.from(
                                            subService['sName'] ?? []);
                                        return Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children:
                                              sNames.map((subServiceName) {
                                            if (subServiceName.isEmpty)
                                              return Container();
                                            return FilterChip(
                                              label: Text(subServiceName),
                                              selected: selectedSubServices[
                                                          service['sId']]
                                                      ?.contains(
                                                          subServiceName) ??
                                                  false,
                                              onSelected: (bool selected) {
                                                setState(() {
                                                  if (selected) {
                                                    selectedSubServices[
                                                        service['sId']] ??= [];
                                                    selectedSubServices[
                                                            service['sId']]!
                                                        .add(subServiceName);
                                                  } else {
                                                    selectedSubServices[
                                                            service['sId']]
                                                        ?.remove(
                                                            subServiceName);
                                                  }
                                                });
                                              },
                                            );
                                          }).toList(),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                              ],
                            );
                          }).toList(),
                        ),
                        SizedBox(height: 16.h),

                        // Conditional Fields based on vehicle type
                        if (selectedVehicleData?['vehicleType'] == "Truck" &&
                            selectedServiceData
                                .any((s) => s['vType'] == "Truck"))
                          TextField(
                            controller: milesController,
                            decoration: const InputDecoration(
                              labelText: 'Miles',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                          ),

                        if (selectedVehicleData?['vehicleType'] == "Trailer" &&
                            selectedServiceData
                                .any((s) => s['vType'] == "Trailer")) ...[
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
                          decoration: const InputDecoration(
                            labelText: 'Workshop Name',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        SizedBox(height: 10.h),
                        TextField(
                          controller: invoiceController,
                          decoration: const InputDecoration(
                            labelText: 'Invoice (Optional)',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
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
                        Text(
                          'Add Miles',
                          style: TextStyle(
                            fontSize: 18.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 16.h),
                        // Add your miles form widgets here
                      ],
                    ),
                  ),
                ),
              ],

              SizedBox(height: 20.h),

              Text("My Records", style: appStyle(20, kDark, FontWeight.w500)),
              SizedBox(height: 20.h),

              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (filteredRecords.isEmpty)
                    const Center(child: Text('No records found'))
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredRecords.length,
                      itemBuilder: (context, index) {
                        final record = filteredRecords[index];
                        final services = record['services'] as List<dynamic>;
                        final serviceNames = services
                            .map((s) => s['serviceName'].toString())
                            .join(', ');

                        final date =
                            "${DateTime.parse(record['createdAt']).toString().split('.')[0]}";

                        return Card(
                          elevation: 2,
                          child: Padding(
                            padding: const EdgeInsets.only(
                                left: 8.0, top: 8.0, right: 8.0, bottom: 5),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                        padding: EdgeInsets.all(1),
                                        decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(8.r),
                                            color: kSecondary.withOpacity(0.2)),
                                        child: Text(date,
                                            style: appStyle(
                                                18, kDark, FontWeight.normal))),
                                    Container(
                                      padding: EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        borderRadius:
                                            BorderRadius.circular(12.r),
                                        color: kPrimary.withOpacity(0.2),
                                      ),
                                      child: Row(
                                        children: [
                                          Text("1,70,000",
                                              style: appStyle(
                                                  14, kDark, FontWeight.w500)),
                                          SizedBox(width: 5.w),
                                          AnimatedBuilder(
                                            animation: _animationController,
                                            builder: (context, child) {
                                              return Icon(
                                                  Icons.notifications_active,
                                                  color: Color.lerp(
                                                      kPrimary,
                                                      kSecondary,
                                                      _animationController
                                                          .value));
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 6.h),
                                buildReusableRowTextWidget("Vehicle :",
                                    ' ${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})'),
                                SizedBox(height: 6.h),
                                buildReusableRowTextWidget(
                                    "Services :", " $serviceNames"),
                                for (var service in services) ...[
                                  if ((service['subServices'] as List?)
                                          ?.isNotEmpty ??
                                      false) ...[
                                    SizedBox(height: 6.h),
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: buildReusableRowTextWidget(
                                          "${service['serviceName']} Sub Services :",
                                          " ${(service['subServices'] as List).map((s) => s['name']).join(', ')}"),
                                    ),
                                  ],
                                ],
                                SizedBox(height: 6.h),
                                buildReusableRowTextWidget("Workshop :",
                                    "${record['workshopName'] ?? 'N/A'}"),
                                SizedBox(height: 6.h),
                                if (record['miles'] > 0)
                                  buildReusableRowTextWidget(
                                      "Miles :", "${record['miles']}"),
                                SizedBox(height: 6.h),
                                if (record['hours'] > 0)
                                  buildReusableRowTextWidget(
                                      "Hours :", "${record["hours"]}"),
                                if (record['invoice'].isEmpty) SizedBox(),
                                buildReusableRowTextWidget(
                                    "Invoice :", "${record["invoice"]}"),
                                SizedBox(height: 6.h),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildReusableRowTextWidget(String hText, String vText) {
    return Row(
      children: [
        Text(hText, style: appStyle(15, kDark, FontWeight.w500)),
        SizedBox(
          width: 250.w,
          child: Text(
            vText,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: appStyle(15, kDarkGray, FontWeight.w400),
          ),
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
            Text(text, style: appStyle(14, kWhite, FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
