import 'dart:developer';
import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/views/services/add_services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  List<Map<String, dynamic>> services = [];
  List<Map<String, dynamic>> filteredServices = [];
  final TextEditingController _titleController = TextEditingController();
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
        .doc('servicesList')
        .get()
        .then((docSnapshot) {
      if (docSnapshot.exists) {
        setState(() {
          services =
              List<Map<String, dynamic>>.from(docSnapshot.data()!['data']);
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

  Future<void> _updateServices() async {
    FirebaseFirestore.instance
        .collection('metadata')
        .doc('servicesList')
        .update({
      'data': services,
    }).then((value) {
      log('Services updated');
    }).catchError((error) {
      log('Failed to update services: $error');
    });
  }

  void _deleteService(int index) {
    setState(() {
      services.removeAt(index);
    });
    _updateServices();
  }

  void _filterServices() {
    setState(() {
      filteredServices = services
          .where((service) => service['title']
              .toLowerCase()
              .contains(_searchController.text.toLowerCase()))
          .toList();
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Services"),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            // onPressed: _addService,
            onPressed: () => Get.to(() => AddEditServices()),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search services...',
                      prefixIcon: Icon(Icons.search, color: Colors.grey),
                      filled: true,
                      fillColor: Colors.grey[200],
                      contentPadding: EdgeInsets.symmetric(
                          vertical: 12.0, horizontal: 20.0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide(color: kPrimary),
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
                    itemCount: filteredServices.length,
                    itemBuilder: (context, index) {
                      final service = filteredServices[index];
                      return ListTile(
                        title: Text(service['title']),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => Get.to(
                                  () => AddEditServices(service: service)),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteService(index),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
