import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import "dart:io";
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
import 'package:regal_shop_app/widgets/custom_background_container.dart';
import 'package:regal_shop_app/widgets/custom_button.dart';
import '../../services/collection_references.dart';
import '../../utils/constants.dart';

class ProfileDetailsScreen extends StatefulWidget {
  const ProfileDetailsScreen({Key? key}) : super(key: key);

  @override
  _ProfileDetailsScreenState createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
  final TextEditingController _userNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  bool isLoading = false;
  String _selectedGender = "Male";
  final List<String> _genders = [
    'Male',
    'Female',
    'Other',
    'Prefer not to disclose'
  ];

  File? _image;

  Future<void> _uploadProfile() async {
    setState(() {
      isLoading = true;
    });
    try {
      String? imageUrl;
      if (_image != null) {
        imageUrl = await _uploadImage();
      }
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .update({
        'userName': _userNameController.text,
        'email': _emailController.text,
        'phoneNumber': _phoneNumberController.text,
        'gender': _selectedGender,
        'profilePicture': imageUrl,
        "updated_at": DateTime.now(),
      }).then((value) {
        Navigator.pop(context);
      });
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Profile updated successfully')),
      );
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update profile: $e')),
      );
    }
  }

  Future<String?> _uploadImage() async {
    try {
      // Upload image to Firebase Storage
      final ref = firebase_storage.FirebaseStorage.instance
          .ref()
          .child('profile_images')
          .child(currentUId)
          .child('profile_pic.jpg');

      await ref.putFile(_image!);

      // Get download URL
      final String downloadURL = await ref.getDownloadURL();

      return downloadURL;
    } catch (e) {
      print('Failed to upload image: $e');
      return null;
    }
  }

  void _getImage(ImageSource source) async {
    final pickedFile = await ImagePicker().pickImage(
      source: source,
      imageQuality: 50,
    );

    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    // // Fetch user data from Firestore
    // FirebaseFirestore.instance
    //     .collection("Users")
    //     .doc(currentUId)
    //     .get()
    //     .then((DocumentSnapshot snapshot) {
    //   final data = snapshot.data() as Map<String, dynamic>;
    //   // Update text fields with user data
    //   _userNameController.text = data['userName'] ?? '';
    //   _emailController.text = data['email'] ?? '';
    //   _phoneNumberController.text = data['phoneNumber'] ?? '';
    //   // Update gender if valid
    //   final gender = data['gender'];
    //   if (_genders.contains(gender)) {
    //     setState(() {
    //       _selectedGender = gender;
    //     });
    //   }
    // }).catchError((error) {
    //   print("Failed to fetch user data: $error");
    // });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile Details'),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : CustomBackgroundContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(height: 20.0.h),
                  Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20.0.r),
                        ),
                        padding: EdgeInsets.all(20.0.h),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            CircleAvatar(
                              radius: 50.r,
                              backgroundImage:
                                  AssetImage('assets/images/profile.jpg'),
                            ),
                            SizedBox(height: 20.0),
                            TextFormField(
                              controller: _userNameController,
                              decoration: InputDecoration(
                                labelText: 'Company Name',
                              ),
                            ),
                            SizedBox(height: 10.0),
                            TextFormField(
                              controller: _phoneNumberController,
                              decoration: InputDecoration(
                                labelText: 'Phone Number',
                              ),
                            ),
                            SizedBox(height: 10.0),
                              TextFormField(
                              controller: _addressController,
                              decoration: InputDecoration(
                                labelText: 'Address ',
                              ),
                            ),
                            SizedBox(height: 10.0),
                            TextFormField(
                              enabled: false,
                              controller: _emailController,
                              decoration: InputDecoration(
                                labelText: 'Email',
                              ),
                            ),
                            SizedBox(height: 10.0.h),
                            DropdownButtonFormField<String>(
                              value: _selectedGender,
                              decoration: InputDecoration(
                                labelText: 'Gender',
                              ),
                              items: _genders.map((String value) {
                                return DropdownMenuItem<String>(
                                  value: value,
                                  child: Text(value),
                                );
                              }).toList(),
                              onChanged: (String? value) {
                                setState(() {
                                  _selectedGender = value!;
                                });
                              },
                            ),
                            SizedBox(height: 20.0.h),
                          ],
                        ),
                      ),
                      Positioned(
                        top: 80.h,
                        right: 0,
                        left: 0,
                        child: CircleAvatar(
                          backgroundColor: kPrimary,
                          child: IconButton(
                            onPressed: () {
                              _getImage(ImageSource.gallery);
                            },
                            icon: Icon(Icons.upload),
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 80.0.h),
                ],
              ),
              horizontalW: 15.w,
              vertical: 10.h,
              scrollPhysics: NeverScrollableScrollPhysics(),
            ),
      bottomSheet: Container(
        margin: EdgeInsets.all(12),
        height: 60.h,
        child: CustomButton(
          text: "Upload Profile",
          onPress: _uploadProfile,
          color: kPrimary,
        ),
      ),
    );
  }
}
