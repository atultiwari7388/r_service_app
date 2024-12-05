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
  String? selectedService;
  final TextEditingController milesController = TextEditingController();
  final TextEditingController hoursController = TextEditingController();
  final TextEditingController workshopController = TextEditingController();
  final TextEditingController invoiceController = TextEditingController();
  DateTime? selectedDate;
  late AnimationController _animationController;

  // Animation related variables
  // late AnimationController _controller;
  // late Animation<double> _scaleAnimation;
  bool showAddRecords = false;
  bool showSearchFilter = false;
  bool showAddMiles = false;

  // Data storage
  final List<Map<String, dynamic>> vehicles = [];
  final List<Map<String, dynamic>> services = [];
  final List<Map<String, dynamic>> records = [];

  // Selected data
  Map<String, dynamic>? selectedVehicleData;
  Map<String, dynamic>? selectedServiceData;

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
        return;
      }

      setState(() {
        vehicles.clear();
        vehicles.addAll(
            vehicleSnapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
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
                  'dValues': service['dValues']
                }));
          });
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
    }

    if (selectedService != null) {
      selectedServiceData = services.firstWhere(
        (service) => service['sId'] == selectedService,
        orElse: () => <String, dynamic>{},
      );
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
      if (selectedVehicle == null || selectedService == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select vehicle and service')),
        );
        return;
      }

      final dataServicesUserRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('DataServices');
      final dataServicesRef =
          FirebaseFirestore.instance.collection("DataServicesRecords");

      final recordData = {
        "userId": currentUId,
        "vehicleId": selectedVehicle,
        "serviceId": selectedService,
        "invoice": invoiceController.text,
        "vehicleDetails": selectedVehicleData,
        "miles": selectedVehicleData?['vehicleType'] == "Truck" &&
                selectedServiceData?['vType'] == "Truck"
            ? int.tryParse(milesController.text) ?? 0
            : 0,
        "hours": selectedVehicleData?['vehicleType'] == "Trailer" &&
                selectedServiceData?['vType'] == "Trailer"
            ? int.tryParse(hoursController.text) ?? 0
            : 0,
        "date": selectedDate?.toIso8601String() ?? "",
        "workshopName": workshopController.text,
        "createdAt": DateTime.now().toIso8601String(),
      };

      await dataServicesUserRef.add(recordData);
      await dataServicesRef.add(recordData);

      fetchRecords();

      setState(() {
        selectedVehicle = null;
        selectedService = null;
        milesController.clear();
        hoursController.clear();
        workshopController.clear();
        invoiceController.clear();
        selectedDate = null;
        showAddRecords = false;
        selectedVehicleData = null;
        selectedServiceData = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Record saved successfully')),
      );
    } catch (e) {
      debugPrint('Error Saving records: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving record: ${e.toString()}')),
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

                        // Service Dropdown
                        DropdownButtonFormField<String>(
                          value: selectedService,
                          hint: const Text('Select Service'),
                          items: services.map((service) {
                            return DropdownMenuItem<String>(
                              value: service['sId'],
                              child: Text(service['sName'] ?? ''),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedService = value;
                              updateSelectedVehicleAndService();
                            });
                          },
                        ),
                        SizedBox(height: 16.h),

                        // Conditional Fields based on vehicle type
                        if (selectedVehicleData?['vehicleType'] == "Truck" &&
                            selectedServiceData?['vType'] == "Truck")
                          TextField(
                            controller: milesController,
                            decoration: const InputDecoration(
                              labelText: 'Miles',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                          ),

                        if (selectedVehicleData?['vehicleType'] == "Trailer" &&
                            selectedServiceData?['vType'] == "Trailer") ...[
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

              // Records List
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
                        final service = services.firstWhere(
                          (s) => s['sId'] == record['serviceId'],
                          orElse: () => {'sName': 'Unknown Service'},
                        );

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

                                          // Icon(Icons.notifications_active)
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
                                    "Service :", " ${service['sName']}"),
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
        Text(
          vText,
          style: appStyle(15, kDarkGray, FontWeight.w400),
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
