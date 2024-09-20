import 'dart:developer';
import 'package:admin_app/utils/constants.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  List<String> services = [];
  List<String> filteredServices = [];
  final TextEditingController _servicesController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchServices();
    _searchController.addListener(_filterServices); // Listen to search input
  }

  Future<void> _fetchServices() async {
    FirebaseFirestore.instance
        .collection('metadata')
        .doc('servicesName')
        .get()
        .then((docSnapshot) {
      if (docSnapshot.exists) {
        setState(() {
          services = List<String>.from(docSnapshot.data()!['data']);
          filteredServices = services; // Initialize filtered list
          _isLoading = false;
        });
      }
    }).catchError((error) {
      log('Failed to load services: $error');
      setState(() {
        _isLoading = false;
      });
    });
  }

  // Future<void> _fetchServices() async {
  //   FirebaseFirestore.instance
  //       .collection('metadata')
  //       .doc('servicesName')
  //       .get()
  //       .then((docSnapshot) {
  //     if (docSnapshot.exists) {
  //       setState(() {
  //         services = List<String>.from(docSnapshot.data()!['data']);
  //         _isLoading = false;
  //       });
  //     }
  //   }).catchError((error) {
  //     log('Failed to load services: $error');
  //     setState(() {
  //       _isLoading = false;
  //     });
  //   });
  // }

  Future<void> _updateLanguages() async {
    FirebaseFirestore.instance
        .collection('metadata')
        .doc('servicesName')
        .update({
      'data': services,
    }).then((value) {
      log('Languages updated');
    }).catchError((error) {
      log('Failed to update languages: $error');
    });
  }

  void _addLanguage() {
    if (_servicesController.text.isNotEmpty) {
      setState(() {
        services.add(_servicesController.text);
      });
      _updateLanguages();
      _servicesController.clear();
    }
  }

  void _editLanguage(int index) {
    _servicesController.text = services[index];
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Service'),
          content: TextField(
            controller: _servicesController,
            decoration: InputDecoration(hintText: 'Enter new Service'),
          ),
          actions: [
            TextButton(
              onPressed: () {
                setState(() {
                  services[index] = _servicesController.text;
                });
                _updateLanguages();
                _servicesController.clear();
                Navigator.pop(context);
              },
              child: Text('Save'),
            ),
            TextButton(
              onPressed: () {
                _servicesController.clear();
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  void _deleteLanguage(int index) {
    setState(() {
      services.removeAt(index);
    });
    _updateLanguages();
  }

  // Method to filter services based on search query
  void _filterServices() {
    setState(() {
      filteredServices = services
          .where((service) => service
              .toLowerCase()
              .contains(_searchController.text.toLowerCase()))
          .toList();
    });
  }

  @override
  void dispose() {
    _servicesController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Services"),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search bar
                // Padding(
                //   padding: const EdgeInsets.all(16.0),
                //   child: TextField(
                //     controller: _searchController,
                //     decoration: InputDecoration(
                //       labelText: 'Search services',
                //       border: OutlineInputBorder(),
                //       prefixIcon: Icon(Icons.search),
                //     ),
                //   ),
                // ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search services...',
                      prefixIcon: Icon(Icons.search, color: Colors.grey),
                      filled: true,
                      // Adds background color
                      fillColor: Colors.grey[200],
                      // Light background color
                      contentPadding: EdgeInsets.symmetric(
                          vertical: 12.0, horizontal: 20.0),
                      // Padding inside the text field
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(30.0), // Rounded corners
                        borderSide: BorderSide.none, // Removes border line
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide:
                            BorderSide(color: kPrimary), // Border when focused
                      ),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear, color: Colors.grey),
                              onPressed: () {
                                _searchController.clear();
                                _filterServices(); // Clear search results when "X" is pressed
                              },
                            )
                          : null,
                    ),
                    onChanged: (value) {
                      _filterServices(); // Filter results based on input
                    },
                  ),
                ),

                Expanded(
                  child: ListView.builder(
                    // itemCount: services.length,
                    itemCount: filteredServices.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(filteredServices[index]),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => _editLanguage(index),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              // onPressed: () => _deleteLanguage(index),
                              onPressed: () {
                                Get.defaultDialog(
                                  title: "Delete Service",
                                  content: Text(
                                      "Are you sure you want to delete this service"),
                                  textCancel: "No",
                                  textConfirm: "Yes",
                                  cancel: OutlinedButton(
                                    onPressed: () {
                                      Get.back(); // Close the dialog if "Cancel" is pressed
                                    },
                                    child: Text("No",
                                        style: TextStyle(color: Colors.red)),
                                  ),
                                  confirm: ElevatedButton(
                                    onPressed: () {
                                      _deleteLanguage(index);
                                      Get.back();
                                    },
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green),
                                    child: Text("Yes",
                                        style: TextStyle(color: Colors.white)),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _servicesController,
                          decoration: InputDecoration(
                            labelText: 'Add a service',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      SizedBox(width: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary, foregroundColor: kWhite),
                        onPressed: _addLanguage,
                        child: Text('Add'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
