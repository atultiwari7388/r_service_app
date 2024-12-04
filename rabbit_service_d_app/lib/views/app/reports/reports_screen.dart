import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
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
  final TextEditingController milesController =
      TextEditingController(); // Controls miles input
  final TextEditingController hoursController =
      TextEditingController(); // Controls hours input
  final TextEditingController workshopController =
      TextEditingController(); // Controls workshop input
  DateTime? selectedDate; // Tracks selected date, nullable

  // Animation related variables
  late AnimationController _controller; // Controls animation timing
  late Animation<double> _scaleAnimation; // Defines scale animation values
  bool showAddRecords = false; // Controls visibility of add records UI

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
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();
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
      if (selectedVehicle == null) {
        debugPrint('No vehicle selected');
        return;
      }

      selectedVehicleData = vehicles.firstWhere(
        (vehicle) => vehicle['id'] == selectedVehicle,
        orElse: () => <String, dynamic>{},
      );

      selectedServiceData = services.firstWhere(
        (service) => service['sId'] == selectedService,
        orElse: () => <String, dynamic>{},
      );

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
        "vehicleDetails": {
          "companyName": selectedVehicleData?['companyName'],
          "createdAt": selectedVehicleData?['createdAt'],
          "currentReading": selectedVehicleData?['currentReading'],
          "dot": selectedVehicleData?['dot'],
          "engineNumber": selectedVehicleData?['engineNumber'],
          "iccms": selectedVehicleData?['iccms'],
          "isSet": selectedVehicleData?['isSet'],
          "licensePlate": selectedVehicleData?['licensePlate'],
          "vehicleNumber": selectedVehicleData?['vehicleNumber'],
          "vin": selectedVehicleData?['vin'],
          "year": selectedVehicleData?['year'],
          "vehicleType": selectedVehicleData?['vehicleType'],
        },
        "miles": selectedVehicleData?['vehicleType'] == "Truck" &&
                selectedServiceData?['vType'] == "Truck"
            ? int.tryParse(milesController.text) ?? 0
            : 0,
        "hours": selectedVehicleData?['vehicleType'] == "Trailer" &&
                selectedServiceData?['vType'] == "Trailer"
            ? int.tryParse(hoursController.text) ?? 0
            : 0,
        "date": selectedVehicleData?['vehicleType'] == "Trailer" &&
                selectedServiceData?['vType'] == "Trailer"
            ? selectedDate?.toIso8601String() ?? ""
            : "",
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
        selectedDate = null;
        showAddRecords = false;
      });
    } catch (e) {
      debugPrint('Error Saving records: ${e.toString()}');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    milesController.dispose();
    hoursController.dispose();
    workshopController.dispose();
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
          padding: EdgeInsets.all(16.0.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search & Filter Section
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
              SizedBox(height: 20.h),

              // Add Records Button
              CustomButton(
                color: kPrimary,
                onPress: () {
                  setState(() {
                    showAddRecords = !showAddRecords;
                  });
                  if (showAddRecords) {
                    _controller.forward();
                  } else {
                    _controller.reverse();
                  }
                },
                text: showAddRecords ? 'Hide Form' : 'Add Records',
              ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0),

              if (showAddRecords) ...[
                SizedBox(height: 20.h),
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Card(
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
                                child: Text(vehicle['companyName'] ?? ''),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                selectedVehicle = value;
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

                          if (selectedVehicleData?['vehicleType'] ==
                                  "Trailer" &&
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
                ),
              ],

              SizedBox(height: 20.h),

              // Records List
              Card(
                elevation: 4,
                child: Padding(
                  padding: EdgeInsets.all(16.0.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Service Records',
                        style: TextStyle(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 16.h),
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
                            return Card(
                              margin: EdgeInsets.only(bottom: 8.h),
                              child: ListTile(
                                title: Text(
                                  'Vehicle: ${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Service: ${service['sName']}'),
                                    Text(
                                        'Workshop: ${record['workshopName'] ?? 'N/A'}'),
                                    if (record['miles'] > 0)
                                      Text('Miles: ${record['miles']}'),
                                    if (record['hours'] > 0)
                                      Text('Hours: ${record['hours']}'),
                                    if (record['date'].isNotEmpty)
                                      Text('Date: ${record['date']}'),
                                    Text(
                                        'Created: ${DateTime.parse(record['createdAt']).toString().split('.')[0]}'),
                                  ],
                                ),
                              ),
                            );
                          },
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
