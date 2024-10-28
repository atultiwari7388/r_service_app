import 'dart:developer';
import 'dart:io';

import 'package:admin_app/utils/constants.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';

class AddEditServices extends StatefulWidget {
  final Map<String, dynamic>? service; // Optional service for editing
  const AddEditServices({super.key, this.service});

  @override
  State<AddEditServices> createState() => _AddEditServicesState();
}

class _AddEditServicesState extends State<AddEditServices> {
  List<Map<String, dynamic>> services = [];
  final TextEditingController _titleController = TextEditingController();
  int _imageType = 0;
  int _priceType = 0;
  int _priority = 0;
  bool _isFeature = false;
  bool _isLoading = true;
  File? _pickedImage;
  String? _imageUrl;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchServices();

    if (widget.service != null) {
      _titleController.text = widget.service!['title'] ?? '';
      _imageType = widget.service!['image_type'] ?? 0;
      _priceType = widget.service!['price_type'] ?? 0;
      _priority = widget.service!['priority'] ?? 0;
      _isFeature = widget.service!['isFeatured'] ?? false;
      _imageUrl = widget.service!['image'] ?? null; // Set existing image URL
    }
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

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _pickedImage = File(pickedFile.path);
      });
    }
  }

  Future<String?> _uploadImage(File image) async {
    try {
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('service_images/${DateTime.now().toIso8601String()}');
      await storageRef.putFile(image);
      return await storageRef.getDownloadURL();
    } catch (error) {
      log('Failed to upload image: $error');
      return null;
    }
  }

  void _clearFormFields() {
    _titleController.clear();
    _imageType = 0;
    _priceType = 0;
    _priority = 0;
    _isFeature = false;
    _pickedImage = null;
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.service != null ? "Edit Service" : "Add Service"),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Container(
              margin: EdgeInsets.all(9.h),
              padding: EdgeInsets.all(9.h),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _titleController,
                      decoration: InputDecoration(labelText: 'Service Title'),
                    ),
                    DropdownButtonFormField<int>(
                      value: _imageType,
                      items: [0, 1]
                          .map((value) => DropdownMenuItem(
                                value: value,
                                child: Text(value.toString()),
                              ))
                          .toList(),
                      decoration: InputDecoration(labelText: 'Image Type'),
                      onChanged: (value) {
                        setState(() {
                          _imageType = value!;
                        });
                      },
                    ),
                    DropdownButtonFormField<int>(
                      value: _priceType,
                      items: [0, 1]
                          .map((value) => DropdownMenuItem(
                                value: value,
                                child: Text(value.toString()),
                              ))
                          .toList(),
                      decoration: InputDecoration(labelText: 'Price Type'),
                      onChanged: (value) {
                        setState(() {
                          _priceType = value!;
                        });
                      },
                    ),
                    DropdownButtonFormField<int>(
                      value: _priority,
                      items: List.generate(11, (index) => index)
                          .map((value) => DropdownMenuItem(
                                value: value,
                                child: Text(value.toString()),
                              ))
                          .toList(),
                      decoration: InputDecoration(labelText: 'Priority'),
                      onChanged: (value) {
                        setState(() {
                          _priority = value!;
                        });
                      },
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Is Featured'),
                        Switch(
                          value: _isFeature,
                          onChanged: (value) {
                            setState(() {
                              _isFeature = value;
                            });
                          },
                        ),
                      ],
                    ),
                    SizedBox(height: 10.h),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 200.h,
                        width: double.infinity,
                        color: Colors.grey[300],
                        child: _pickedImage != null
                            ? Image.file(_pickedImage!, fit: BoxFit.cover)
                            : (_imageUrl != null
                                ? Image.network(_imageUrl!, fit: BoxFit.cover)
                                : Icon(Icons.add_a_photo, size: 50)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Container(
              margin: EdgeInsets.all(18),
              decoration:
                  BoxDecoration(borderRadius: BorderRadius.circular(30.r)),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kSecondary,
                  foregroundColor: kWhite,
                ),
                onPressed: () async {
                  if (_titleController.text.isNotEmpty) {
                    String? imageUrl = _imageUrl;
                    if (_pickedImage != null) {
                      imageUrl = await _uploadImage(_pickedImage!);
                    }

                    final newService = {
                      'title': _titleController.text,
                      'image_type': _imageType,
                      'price_type': _priceType,
                      'priority': _priority,
                      'isFeatured': _isFeature,
                      'image': imageUrl ?? "", // Set image URL or empty
                    };

                    setState(() {
                      if (widget.service != null) {
                        int index = services.indexOf(widget.service!);
                        services[index] = newService;
                      } else {
                        services.add(newService);
                      }
                    });

                    await _updateServices();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(widget.service != null
                            ? "Service updated"
                            : "Service added"),
                      ),
                    );

                    _clearFormFields();
                    Navigator.pop(context);
                  }
                },
                child: Text(
                    widget.service != null ? "Update Service" : "Add Service"),
              ),
            ),
    );
  }
}
