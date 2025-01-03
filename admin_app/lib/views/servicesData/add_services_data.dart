import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AddServiceDataScreen extends StatefulWidget {
  const AddServiceDataScreen({Key? key}) : super(key: key);

  @override
  State<AddServiceDataScreen> createState() => _AddServiceDataScreenState();
}

class _AddServiceDataScreenState extends State<AddServiceDataScreen> {
  final TextEditingController _sIdController = TextEditingController();
  final TextEditingController _sNameController = TextEditingController();
  String _selectedVType = 'Truck';

  List<Map<String, dynamic>> engineData = [];
  List<Map<String, dynamic>> vehicleDetails = [];
  List<Map<String, dynamic>> subServices = [];
  bool isLoading = true;

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  // Fetch engine name list
  Future<void> _fetchEngineNames() async {
    try {
      DocumentSnapshot doc =
          await metadataCollection.doc('engineNameList').get();
      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        List<dynamic> engineList = data['data'] ?? [];
        Set<String> uniqueEngineNames = engineList
            .cast<Map<String, dynamic>>()
            .map((e) => e['eName'] as String)
            .toSet();
        setState(() {
          engineData = uniqueEngineNames.map((e) => {'eName': e}).toList();
          isLoading = false;
        });
      } else {
        log("No engine name list found.");
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      log("Error fetching engine names: $e");
      setState(() {
        isLoading = false;
      });
    }
  }

  // Add a new vehicle card
  void _addVehicle() {
    setState(() {
      vehicleDetails.add({
        'brand': '',
        'type': 'Reading',
        'value': '',
      });
    });
  }

  // Add a new subservice
  void _addSubService() {
    setState(() {
      subServices.add({
        'sName': List.generate(6, (index) => ""), // Default 6 empty fields
      });
    });
  }

  // Save service data
  Future<void> _saveServiceData() async {
    try {
      final newServiceData = {
        'sId': _sIdController.text,
        'sName': _sNameController.text,
        'vType': _selectedVType,
        'dValues': vehicleDetails,
        // 'package': '',
        'subServices': subServices.isEmpty ? [] : subServices,
      };
      await metadataCollection.doc('servicesData').update({
        'data': FieldValue.arrayUnion([newServiceData]),
      });
      log("Service data added successfully.");
      Navigator.pop(context);
    } catch (e) {
      log("Error saving service data: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchEngineNames();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Add Service Data"),
        actions: [
          // IconButton(
          //   icon: Icon(Icons.save),
          //   onPressed: _saveServiceData,
          // ),
          ElevatedButton(onPressed: _saveServiceData, child: Text("Save")),
          SizedBox(width: 10.w),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Add Service Data",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: _sIdController,
                    decoration: InputDecoration(
                      labelText: "Service ID",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: _sNameController,
                    decoration: InputDecoration(
                      labelText: "Service Name",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: _selectedVType,
                    onChanged: (value) {
                      setState(() {
                        _selectedVType = value!;
                      });
                    },
                    items: ['Truck', 'Trailer']
                        .map((type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ))
                        .toList(),
                    decoration: InputDecoration(
                      labelText: "Vehicle Type",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Vehicle Details",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      ElevatedButton(
                        onPressed: _addVehicle,
                        child: Text("Add Vehicle"),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  ...vehicleDetails.asMap().entries.map((entry) {
                    final index = entry.key;
                    final vehicle = entry.value;
                    return Card(
                      margin: EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Vehicle ${index + 1}",
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 10),
                            DropdownButtonFormField<String>(
                              value: engineData.any((engine) =>
                                      engine['eName'] == vehicle['brand'])
                                  ? vehicle['brand']
                                  : null, // Ensure valid or null value
                              onChanged: (value) {
                                setState(() {
                                  vehicleDetails[index]['brand'] = value!;
                                });
                              },
                              items: engineData
                                  .map((engine) => DropdownMenuItem<String>(
                                        value: engine['eName'] as String,
                                        child: Text(engine['eName'] as String),
                                      ))
                                  .toList(),
                              decoration: InputDecoration(
                                labelText: "Select Brand/Engine Name",
                                border: OutlineInputBorder(),
                              ),
                            ),
                            SizedBox(height: 10),
                            DropdownButtonFormField<String>(
                              value: ['Reading', 'Time', 'Date']
                                      .contains(vehicle['type'])
                                  ? vehicle['type']
                                  : null, // Ensure valid or null value
                              onChanged: (value) {
                                setState(() {
                                  vehicleDetails[index]['type'] = value!;
                                });
                              },
                              items: ['Reading', 'Time', 'Date']
                                  .map((type) => DropdownMenuItem(
                                        value: type,
                                        child: Text(type),
                                      ))
                                  .toList(),
                              decoration: InputDecoration(
                                labelText: "Select Type",
                                border: OutlineInputBorder(),
                              ),
                            ),
                            SizedBox(height: 10),
                            TextField(
                              onChanged: (value) {
                                setState(() {
                                  vehicleDetails[index]['value'] = value;
                                });
                              },
                              decoration: InputDecoration(
                                labelText: "Value",
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "SubServices",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      ElevatedButton(
                        onPressed: _addSubService,
                        child: Text("Add SubService"),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  ...subServices.asMap().entries.map((entry) {
                    final index = entry.key;
                    final subService = entry.value;
                    return Card(
                      margin: EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "SubService ${index + 1}",
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 10),
                            ...subService['sName'].asMap().entries.map((e) {
                              final sIndex = e.key;
                              final sName = e.value;
                              return TextField(
                                onChanged: (value) {
                                  setState(() {
                                    subServices[index]['sName'][sIndex] = value;
                                  });
                                },
                                decoration: InputDecoration(
                                  labelText: "SubService Name ${sIndex + 1}",
                                  border: OutlineInputBorder(),
                                ),
                                controller: TextEditingController(text: sName),
                              );
                            }).toList(),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
    );
  }
}
