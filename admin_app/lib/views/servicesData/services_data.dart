import 'dart:developer';
import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/views/servicesData/add_services_data.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';

class ServicesDataRecords extends StatefulWidget {
  const ServicesDataRecords({super.key});

  @override
  State<ServicesDataRecords> createState() => _ServicesDataRecordsState();
}

class _ServicesDataRecordsState extends State<ServicesDataRecords> {
  bool isLoading = true;
  List<Map<String, dynamic>> servicesData = [];

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  // Fetch services data
  Future<void> _fetchServicesData() async {
    try {
      DocumentSnapshot doc = await metadataCollection.doc('servicesData').get();
      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        List<dynamic> servicesList = data['data'] ?? [];
        setState(() {
          servicesData = servicesList.cast<Map<String, dynamic>>();
          isLoading = false;
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

  // Delete service
  void _deleteService(int index) {
    setState(() {
      servicesData.removeAt(index);
    });
    _updateServiceData();
  }

  // Update data in Firestore
  Future<void> _updateServiceData() async {
    try {
      await metadataCollection
          .doc('servicesData')
          .update({'data': servicesData});
      log("Data updated successfully.");
    } catch (e) {
      log("Error updating data: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchServicesData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Services Data"),
        actions: [
          InkWell(
            onTap: () => Get.to(() => AddServicesData()),
            child: CircleAvatar(
              radius: 20.r,
              backgroundColor: kPrimary,
              child: Icon(Icons.add, color: kWhite),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : servicesData.isEmpty
              ? Center(child: Text("No data available."))
              : ListView.builder(
                  itemCount: servicesData.length,
                  itemBuilder: (context, index) {
                    final service = servicesData[index];
                    final subServices = service['subServices'] ?? [];
                    final dValues = service['dValues'] ?? [];

                    return Card(
                      margin: EdgeInsets.all(10),
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                SizedBox(
                                  width: 280.w,
                                  child: Text(
                                    "Service: ${service['sName'] ?? 'N/A'}",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteService(index),
                                ),
                              ],
                            ),
                            Text("Vehicle Type: ${service['vType'] ?? 'N/A'}"),
                            SizedBox(height: 10),
                            Text(
                              "Sub Services:",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subServices.isEmpty
                                ? Text("No Sub Services available.")
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemCount: subServices.length,
                                    itemBuilder: (context, subIndex) {
                                      final subService = subServices[subIndex];
                                      final subNames = subService['sName'];
                                      return Text(
                                        "• ${subNames.join(", ")}",
                                      );
                                    },
                                  ),
                            SizedBox(height: 10),
                            Text(
                              "Values:",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            dValues.isEmpty
                                ? Text("No values available.")
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemCount: dValues.length,
                                    itemBuilder: (context, valueIndex) {
                                      final value = dValues[valueIndex];
                                      return Text(
                                          "• Brand: ${value['brand']}, Type: ${value['type']}, Value: ${value['value']}");
                                    },
                                  ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
