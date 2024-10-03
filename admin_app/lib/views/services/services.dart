import 'dart:developer';
import 'package:admin_app/utils/constants.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  List<Map<String, dynamic>> services = [];
  List<Map<String, dynamic>> filteredServices = [];
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _imageTypeController = TextEditingController();
  final TextEditingController _priceTypeController = TextEditingController();
  final TextEditingController _priorityController = TextEditingController();
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

  void _addService() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add Service'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _titleController,
                decoration: InputDecoration(labelText: 'Service Title'),
              ),
              TextField(
                controller: _imageTypeController,
                decoration: InputDecoration(labelText: 'Image Type'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: _priceTypeController,
                decoration: InputDecoration(labelText: 'Price Type'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: _priorityController,
                decoration: InputDecoration(labelText: 'Priority'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                _titleController.clear();
                _imageTypeController.clear();
                _priceTypeController.clear();
                _priorityController.clear();
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (_titleController.text.isNotEmpty) {
                  setState(() {
                    services.add({
                      'title': _titleController.text,
                      'image_type': int.parse(_imageTypeController.text),
                      'price_type': int.parse(_priceTypeController.text),
                      'priority': int.parse(_priorityController.text),
                      'image': "", // Assuming image is left empty for now
                    });
                  });
                  _updateServices();
                  _titleController.clear();
                  _imageTypeController.clear();
                  _priceTypeController.clear();
                  _priorityController.clear();
                  Navigator.pop(context);
                }
              },
              child: Text('Add'),
            ),
          ],
        );
      },
    );
  }

  void _editService(int index) {
    _titleController.text = services[index]['title'];
    _imageTypeController.text = services[index]['image_type'].toString();
    _priceTypeController.text = services[index]['price_type'].toString();
    _priorityController.text = services[index]['priority'].toString();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Service'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _titleController,
                decoration: InputDecoration(labelText: 'Service Title'),
              ),
              TextField(
                controller: _imageTypeController,
                decoration: InputDecoration(labelText: 'Image Type'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: _priceTypeController,
                decoration: InputDecoration(labelText: 'Price Type'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: _priorityController,
                decoration: InputDecoration(labelText: 'Priority'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                _titleController.clear();
                _imageTypeController.clear();
                _priceTypeController.clear();
                _priorityController.clear();
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  services[index] = {
                    'title': _titleController.text,
                    'image_type': int.parse(_imageTypeController.text),
                    'price_type': int.parse(_priceTypeController.text),
                    'priority': int.parse(_priorityController.text),
                    'image': "", // Assuming image is left empty for now
                  };
                });
                _updateServices();
                _titleController.clear();
                _imageTypeController.clear();
                _priceTypeController.clear();
                _priorityController.clear();
                Navigator.pop(context);
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }

  void _deleteService(int index) {
    setState(() {
      services.removeAt(index);
    });
    _updateServices();
  }

  // Method to filter services based on search query
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
    _imageTypeController.dispose();
    _priceTypeController.dispose();
    _priorityController.dispose();
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
            onPressed: _addService, // Opens the dialog to add a service
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
                      return ListTile(
                        title: Text(filteredServices[index]['title']),
                        // subtitle: Text(
                        //     'Image Type: ${filteredServices[index]['image_type']}, Price Type: ${filteredServices[index]['price_type']}, Priority: ${filteredServices[index]['priority']}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              onPressed: () {
                                _editService(index);
                              },
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              onPressed: () {
                                _deleteService(index);
                              },
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
