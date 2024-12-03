import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AddServicesData extends StatefulWidget {
  const AddServicesData({Key? key}) : super(key: key);

  @override
  State<AddServicesData> createState() => _AddServicesDataState();
}

class _AddServicesDataState extends State<AddServicesData> {
  // Initial nested data structure matching existing Firebase format
  Map<String, dynamic> serviceData = {
    "sId": "",
    "sName": "",
    "vType": "",
    "dValues": []
  };

  List<String> companyNames = [];
  bool isLoading = true;
  static const int maxVehicles = 10; // Maximum number of vehicles allowed

  // List of vehicle types
  final List<String> vehicleTypes = ["Reading", "Time", "Date"];

  final CollectionReference metadataCollection =
      FirebaseFirestore.instance.collection('metadata');

  @override
  void initState() {
    super.initState();
    fetchCompanyNames();
  }

  Future<void> fetchCompanyNames() async {
    try {
      DocumentSnapshot doc = await metadataCollection.doc('companyName').get();
      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        List<dynamic> companies = data['data'] ?? [];
        setState(() {
          companyNames = companies.cast<String>();
          isLoading = false;
        });
      }
    } catch (e) {
      print("Error fetching company names: $e");
      setState(() {
        isLoading = false;
      });
    }
  }

  void addNewVehicle() {
    if (serviceData["dValues"].length < maxVehicles) {
      setState(() {
        serviceData["dValues"].add({"brand": "", "type": "", "value": ""});
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Maximum limit of 10 vehicles reached!"),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> saveData() async {
    try {
      DocumentSnapshot doc = await metadataCollection.doc('servicesData').get();
      List<dynamic> existingData = [];

      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        existingData = data['data'] ?? [];
      }

      existingData.add(serviceData);
      await metadataCollection.doc('servicesData').set({'data': existingData});

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Service data added successfully!")),
      );

      setState(() {
        serviceData = {"sId": "", "sName": "", "vType": "", "dValues": []};
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error saving data: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Add Services Data"),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      decoration: const InputDecoration(
                        labelText: "Service ID",
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          serviceData["sId"] = value;
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: "Service Name",
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          serviceData["sName"] = value;
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: "Value Type",
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          serviceData["vType"] = value;
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Vehicle Details",
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        ElevatedButton.icon(
                          onPressed: serviceData["dValues"].length < maxVehicles
                              ? addNewVehicle
                              : null,
                          icon: const Icon(Icons.add),
                          label: const Text("Add Vehicle"),
                        ),
                      ],
                    ),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: serviceData["dValues"].length,
                      itemBuilder: (context, index) {
                        return Card(
                          elevation: 2,
                          margin: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      "Vehicle ${index + 1}",
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete),
                                      onPressed: () {
                                        setState(() {
                                          serviceData["dValues"]
                                              .removeAt(index);
                                        });
                                      },
                                    )
                                  ],
                                ),
                                const SizedBox(height: 10),
                                DropdownButtonFormField<String>(
                                  decoration: const InputDecoration(
                                    labelText: "Brand",
                                    border: OutlineInputBorder(),
                                  ),
                                  value: serviceData["dValues"][index]["brand"]
                                          .isEmpty
                                      ? null
                                      : serviceData["dValues"][index]["brand"],
                                  items: companyNames.map((String company) {
                                    return DropdownMenuItem<String>(
                                      value: company,
                                      child: Text(company),
                                    );
                                  }).toList(),
                                  onChanged: (String? value) {
                                    setState(() {
                                      serviceData["dValues"][index]["brand"] =
                                          value ?? "";
                                    });
                                  },
                                ),
                                const SizedBox(height: 10),
                                DropdownButtonFormField<String>(
                                  decoration: const InputDecoration(
                                    labelText: "Type",
                                    border: OutlineInputBorder(),
                                  ),
                                  value: serviceData["dValues"][index]["type"]
                                          .isEmpty
                                      ? null
                                      : serviceData["dValues"][index]["type"],
                                  items: vehicleTypes.map((String type) {
                                    return DropdownMenuItem<String>(
                                      value: type,
                                      child: Text(type),
                                    );
                                  }).toList(),
                                  onChanged: (String? value) {
                                    setState(() {
                                      serviceData["dValues"][index]["type"] =
                                          value ?? "";
                                    });
                                  },
                                ),
                                const SizedBox(height: 10),
                                TextField(
                                  decoration: const InputDecoration(
                                    labelText: "Value",
                                    border: OutlineInputBorder(),
                                  ),
                                  onChanged: (value) {
                                    setState(() {
                                      serviceData["dValues"][index]["value"] =
                                          value;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: ElevatedButton(
                        onPressed: saveData,
                        child: const Padding(
                          padding: EdgeInsets.symmetric(
                              horizontal: 32.0, vertical: 12.0),
                          child: Text(
                            "Save to Firebase",
                            style: TextStyle(fontSize: 16),
                          ),
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
