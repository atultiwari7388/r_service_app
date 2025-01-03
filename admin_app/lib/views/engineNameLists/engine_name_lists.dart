import 'dart:developer';
import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/widgets/custom_button.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class EngineNameLists extends StatefulWidget {
  const EngineNameLists({super.key});

  @override
  State<EngineNameLists> createState() => _EngineNameListsState();
}

class _EngineNameListsState extends State<EngineNameLists> {
  bool isLoading = true;
  List<Map<String, dynamic>> engineData = [];
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
        setState(() {
          engineData = engineList.cast<Map<String, dynamic>>();
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

  // Add new engine data
  Future<void> _addEngineData(
      String engineName, String companyName, String type) async {
    try {
      engineData.add({'eName': engineName, 'cName': companyName, 'type': type});
      await metadataCollection.doc('engineNameList').update({
        'data': engineData,
      });
      setState(() {});
      Navigator.pop(context); // Close the bottom sheet
    } catch (e) {
      log("Error adding engine data: $e");
    }
  }

  // Delete engine data
  Future<void> _deleteEngineData(int index) async {
    try {
      engineData.removeAt(index);
      await metadataCollection.doc('engineNameList').update({
        'data': engineData,
      });
      setState(() {});
    } catch (e) {
      log("Error deleting engine data: $e");
    }
  }

  // Show bottom sheet for adding new engine data

  void _showAddEngineModal() {
    String engineName = '';
    String companyName = '';
    String selectedType = 'Truck';

    showModalBottomSheet(
      context: context,
      isScrollControlled:
          true, // Allows the bottom sheet to expand based on content
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 16.0,
          right: 16.0,
          top: 16.0,
          bottom: MediaQuery.of(context).viewInsets.bottom +
              16.0, // Adjust for keyboard
        ),
        child: Wrap(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  decoration: InputDecoration(labelText: 'Engine Name'),
                  onChanged: (value) => engineName = value,
                ),
                TextField(
                  decoration: InputDecoration(labelText: 'Company Name'),
                  onChanged: (value) => companyName = value,
                ),
                DropdownButtonFormField<String>(
                  value: selectedType,
                  items: ['Truck', 'Trailer']
                      .map((type) => DropdownMenuItem(
                            value: type,
                            child: Text(type),
                          ))
                      .toList(),
                  onChanged: (value) => selectedType = value!,
                  decoration: InputDecoration(labelText: 'Type'),
                ),
                SizedBox(height: 20),
                CustomButton(
                  text: 'Add Engine',
                  color: kPrimary,
                  onPress: () {
                    if (engineName.isNotEmpty && companyName.isNotEmpty) {
                      _addEngineData(engineName, companyName, selectedType);
                    } else {
                      log("All fields are required.");
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
        title: Text("Engine Name List"),
        actions: [
          InkWell(
            onTap: _showAddEngineModal,
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
          : engineData.isEmpty
              ? Center(child: Text("No data available."))
              : ListView.builder(
                  itemCount: engineData.length,
                  itemBuilder: (context, index) {
                    final engine = engineData[index];
                    return ListTile(
                      title: Text("Engine: ${engine['eName']}"),
                      subtitle: Text(
                          "C'Name: ${engine['cName']} | Type: ${engine['type']}"),
                      trailing: IconButton(
                        icon: Icon(Icons.delete, color: Colors.red),
                        onPressed: () {
                          showDialog(
                              context: context,
                              builder: (context) {
                                return AlertDialog(
                                  title: Text("Delete Engine"),
                                  content: Text(
                                      "Are you sure you want to delete this engine?"),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: Text("Cancel",
                                          style: appStyle(
                                              16, kPrimary, FontWeight.normal)),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        _deleteEngineData(index);
                                        Navigator.pop(context);
                                      },
                                      child: Text("Delete",
                                          style: appStyle(16, kSecondary,
                                              FontWeight.normal)),
                                    ),
                                  ],
                                );
                              });
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
