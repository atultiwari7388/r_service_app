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
  List<String> services = [];
  final TextEditingController _servicesController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchServices();
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

  @override
  void dispose() {
    _servicesController.dispose();
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
                Expanded(
                  child: ListView.builder(
                    itemCount: services.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(services[index]),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => _editLanguage(index),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteLanguage(index),
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
