import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
import 'package:regal_service_d_app/widgets/custom_background_container.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/text_field.dart';
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
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _vehicleNameController = TextEditingController();
  final TextEditingController _vehicleNumberController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool isLoading = false;
  bool _isPersonalDetailsExpanded = false;
  bool _isVehicleDetailsExpanded = false;
  bool _isChangePasswordExpanded = false;

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
      // Uncomment below for Firebase functionality
      // await FirebaseFirestore.instance
      //     .collection("Users")
      //     .doc(currentUId)
      //     .update({
      //   'userName': _userNameController.text,
      //   'email': _emailController.text,
      //   'phoneNumber': _phoneNumberController.text,
      //   'gender': _selectedGender,
      //   'address': _addressController.text,
      //   'vehicleName': _vehicleNameController.text,
      //   'vehicleNumber': _vehicleNumberController.text,
      //   'profilePicture': imageUrl,
      //   "updated_at": DateTime.now(),
      // }).then((value) {
      //   Navigator.pop(context);
      // });
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

  void _toggleSection(String section) {
    setState(() {
      if (section == 'personal') {
        _isPersonalDetailsExpanded = !_isPersonalDetailsExpanded;
        if (_isPersonalDetailsExpanded) {
          _isVehicleDetailsExpanded = false;
          _isChangePasswordExpanded = false;
        }
      } else if (section == 'vehicle') {
        _isVehicleDetailsExpanded = !_isVehicleDetailsExpanded;
        if (_isVehicleDetailsExpanded) {
          _isPersonalDetailsExpanded = false;
          _isChangePasswordExpanded = false;
        }
      } else if (section == 'password') {
        _isChangePasswordExpanded = !_isChangePasswordExpanded;
        if (_isChangePasswordExpanded) {
          _isPersonalDetailsExpanded = false;
          _isVehicleDetailsExpanded = false;
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile Details'),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(height: 20.0.h),

                  // Profile Picture and Edit Button
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 50.r,
                        backgroundImage: _image != null
                            ? FileImage(_image!)
                            : AssetImage('assets/images/profile.jpg')
                                as ImageProvider,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: CircleAvatar(
                          backgroundColor: kPrimary,
                          child: IconButton(
                            icon: Icon(Icons.camera_alt),
                            color: Colors.white,
                            onPressed: () {
                              _getImage(ImageSource.gallery);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 30.0.h),

                  // Personal Details Section
                  _buildSectionCard(
                    context,
                    title: "Personal Details",
                    icon: Icons.person,
                    isExpanded: _isPersonalDetailsExpanded,
                    onToggle: () => _toggleSection('personal'),
                    children: [
                      TextFieldInputWidget(
                        hintText: "Username",
                        textEditingController: _userNameController,
                        textInputType: TextInputType.text,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                      TextFieldInputWidget(
                        hintText: "Email",
                        textEditingController: _emailController,
                        textInputType: TextInputType.emailAddress,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                      TextFieldInputWidget(
                        hintText: "Phone Number",
                        textEditingController: _phoneNumberController,
                        textInputType: TextInputType.number,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                      TextFieldInputWidget(
                        hintText: "Address",
                        textEditingController: _addressController,
                        textInputType: TextInputType.visiblePassword,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                    ],
                  ),
                  SizedBox(height: 20.0.h),

                  // Vehicle Details Section
                  _buildSectionCard(
                    context,
                    title: "Vehicle Details",
                    icon: Icons.directions_car,
                    isExpanded: _isVehicleDetailsExpanded,
                    onToggle: () => _toggleSection('vehicle'),
                    children: [
                      TextFieldInputWidget(
                        hintText: "Vehicle Name",
                        textEditingController: _vehicleNameController,
                        textInputType: TextInputType.text,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                      TextFieldInputWidget(
                        hintText: "Vehicle Number",
                        textEditingController: _vehicleNumberController,
                        textInputType: TextInputType.text,
                        icon: Icons.abc,
                        isIconApply: false,
                      ),
                    ],
                  ),
                  SizedBox(height: 20.0.h),

                  // Change Password Section
                  _buildSectionCard(
                    context,
                    title: "Change Password",
                    icon: Icons.lock,
                    isExpanded: _isChangePasswordExpanded,
                    onToggle: () => _toggleSection('password'),
                    children: [
                      TextFieldInputWidget(
                        hintText: "Enter New Password",
                        textEditingController: _newPasswordController,
                        textInputType: TextInputType.visiblePassword,
                        isIconApply: false,
                        icon: Icons.abc,
                        isPass: true,
                      ),
                      TextFieldInputWidget(
                        hintText: "Confirm New Password",
                        textEditingController: _confirmPasswordController,
                        textInputType: TextInputType.visiblePassword,
                        isIconApply: false,
                        isPass: false,
                        icon: Icons.abc,
                      ),
                    ],
                  ),
                  SizedBox(height: 100.0.h),
                ],
              ),
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

  Widget _buildSectionCard(
      BuildContext context, {
        required String title,
        required IconData icon,
        required bool isExpanded,
        required Function onToggle,
        required List<Widget> children,
      }) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 15.w),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: kSecondary.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(20.r),
          color: kWhite.withOpacity(0.1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: () => onToggle(),
              child: Padding(
                padding: EdgeInsets.all(15.w),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(icon, color: kPrimary),
                        SizedBox(width: 10.w),
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: kPrimary,
                    ),
                  ],
                ),
              ),
            ),
            AnimatedContainer(
              duration: Duration(milliseconds: 300),
              height: isExpanded ? null : 0.0,
              padding: EdgeInsets.symmetric(horizontal: 15.w),
              child: isExpanded ? Column(children: children) : null,
            ),
          ],
        ),
      ),
    );
  }

}

// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:image_picker/image_picker.dart';
// import 'dart:io';
// import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
// import 'package:regal_service_d_app/widgets/custom_background_container.dart';
// import 'package:regal_service_d_app/widgets/custom_button.dart';
// import 'package:regal_service_d_app/widgets/text_field.dart';
// import '../../services/collection_references.dart';
// import '../../utils/constants.dart';
//
// class ProfileDetailsScreen extends StatefulWidget {
//   const ProfileDetailsScreen({Key? key}) : super(key: key);
//
//   @override
//   _ProfileDetailsScreenState createState() => _ProfileDetailsScreenState();
// }
//
// class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
//   final TextEditingController _userNameController = TextEditingController();
//   final TextEditingController _emailController = TextEditingController();
//   final TextEditingController _phoneNumberController = TextEditingController();
//   final TextEditingController _addressController = TextEditingController();
//   final TextEditingController _vehicleNameController = TextEditingController();
//   final TextEditingController _vehicleNumberController =
//       TextEditingController();
//   bool isLoading = false;
//   String _selectedGender = "Male";
//   final List<String> _genders = [
//     'Male',
//     'Female',
//     'Other',
//     'Prefer not to disclose'
//   ];
//
//   File? _image;
//
//   Future<void> _uploadProfile() async {
//     setState(() {
//       isLoading = true;
//     });
//     try {
//       String? imageUrl;
//       if (_image != null) {
//         imageUrl = await _uploadImage();
//       }
//       // await FirebaseFirestore.instance
//       //     .collection("Users")
//       //     .doc(currentUId)
//       //     .update({
//       //   'userName': _userNameController.text,
//       //   'email': _emailController.text,
//       //   'phoneNumber': _phoneNumberController.text,
//       //   'gender': _selectedGender,
//       //   'address': _addressController.text,
//       //   'vehicleName': _vehicleNameController.text,
//       //   'vehicleNumber': _vehicleNumberController.text,
//       //   'profilePicture': imageUrl,
//       //   "updated_at": DateTime.now(),
//       // }).then((value) {
//       //   Navigator.pop(context);
//       // });
//       setState(() {
//         isLoading = false;
//       });
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Profile updated successfully')),
//       );
//     } catch (e) {
//       setState(() {
//         isLoading = false;
//       });
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Failed to update profile: $e')),
//       );
//     }
//   }
//
//   Future<String?> _uploadImage() async {
//     try {
//       // Upload image to Firebase Storage
//       final ref = firebase_storage.FirebaseStorage.instance
//           .ref()
//           .child('profile_images')
//           .child(currentUId)
//           .child('profile_pic.jpg');
//
//       await ref.putFile(_image!);
//
//       // Get download URL
//       final String downloadURL = await ref.getDownloadURL();
//
//       return downloadURL;
//     } catch (e) {
//       print('Failed to upload image: $e');
//       return null;
//     }
//   }
//
//   void _getImage(ImageSource source) async {
//     final pickedFile = await ImagePicker().pickImage(
//       source: source,
//       imageQuality: 50,
//     );
//
//     if (pickedFile != null) {
//       setState(() {
//         _image = File(pickedFile.path);
//       });
//     }
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Profile Details'),
//       ),
//       body: isLoading
//           ? Center(child: CircularProgressIndicator())
//           : SingleChildScrollView(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.center,
//                 children: [
//                   SizedBox(height: 20.0.h),
//
//                   // Profile Picture and Edit Button
//                   Stack(
//                     children: [
//                       CircleAvatar(
//                         radius: 50.r,
//                         backgroundImage: _image != null
//                             ? FileImage(_image!)
//                             : AssetImage('assets/images/profile.jpg')
//                                 as ImageProvider,
//                       ),
//                       Positioned(
//                         bottom: 0,
//                         right: 0,
//                         child: CircleAvatar(
//                           backgroundColor: kPrimary,
//                           child: IconButton(
//                             icon: Icon(Icons.camera_alt),
//                             color: Colors.white,
//                             onPressed: () {
//                               _getImage(ImageSource.gallery);
//                             },
//                           ),
//                         ),
//                       ),
//                     ],
//                   ),
//                   SizedBox(height: 30.0.h),
//
//                   // Personal Details Section
//                   _buildSectionCard(
//                     context,
//                     title: "Personal Details",
//                     icon: Icons.person,
//                     children: [
//                       TextFieldInputWidget(
//                         hintText: "Username",
//                         textEditingController: _userNameController,
//                         textInputType: TextInputType.text,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                       TextFieldInputWidget(
//                         hintText: "Email",
//                         textEditingController: _emailController,
//                         textInputType: TextInputType.emailAddress,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                       TextFieldInputWidget(
//                         hintText: "Phone Number",
//                         textEditingController: _phoneNumberController,
//                         textInputType: TextInputType.number,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                       TextFieldInputWidget(
//                         hintText: "Address",
//                         textEditingController: _addressController,
//                         textInputType: TextInputType.visiblePassword,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                     ],
//                   ),
//                   SizedBox(height: 20.0.h),
//
//                   // Vehicle Details Section
//                   _buildSectionCard(
//                     context,
//                     title: "Vehicle Details",
//                     icon: Icons.directions_car,
//                     children: [
//                       TextFieldInputWidget(
//                         hintText: "Vehicle Name",
//                         textEditingController: _vehicleNameController,
//                         textInputType: TextInputType.text,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                       TextFieldInputWidget(
//                         hintText: "Vehicle Number",
//                         textEditingController: _vehicleNumberController,
//                         textInputType: TextInputType.text,
//                         icon: Icons.abc,
//                         isIconApply: false,
//                       ),
//                     ],
//                   ),
//                   SizedBox(height: 20.0.h),
//
//                   // Change Password Button
//                   Padding(
//                     padding: EdgeInsets.symmetric(horizontal: 20.w),
//                     child: CustomButton(
//                       text: "Change Password",
//                       onPress: () {
//                         // Implement change password functionality here
//                       },
//                       color: Colors.redAccent,
//                     ),
//                   ),
//                   SizedBox(height: 30.0.h),
//                 ],
//               ),
//             ),
//       bottomSheet: Container(
//         margin: EdgeInsets.all(12),
//         height: 60.h,
//         child: CustomButton(
//           text: "Upload Profile",
//           onPress: _uploadProfile,
//           color: kPrimary,
//         ),
//       ),
//     );
//   }
//
//   Widget _buildSectionCard(
//     BuildContext context, {
//     required String title,
//     required IconData icon,
//     required List<Widget> children,
//   }) {
//     return Padding(
//       padding: EdgeInsets.symmetric(horizontal: 15.w),
//       child: Container(
//         decoration: BoxDecoration(
//           border: Border.all(color: kSecondary.withOpacity(0.1)),
//             borderRadius: BorderRadius.circular(20.r),
//             color: kWhite.withOpacity(0.1)),
//         child: Padding(
//           padding: EdgeInsets.all(15.w),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Row(
//                 children: [
//                   SizedBox(width: 10.w),
//                   Text(
//                     title,
//                     style: TextStyle(
//                       fontSize: 18.sp,
//                       fontWeight: FontWeight.w500,
//                     ),
//                   ),
//                 ],
//               ),
//               SizedBox(height: 10.h),
//               ...children,
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }

// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:image_picker/image_picker.dart';
// import "dart:io";
// import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
// import 'package:regal_service_d_app/widgets/custom_background_container.dart';
// import 'package:regal_service_d_app/widgets/custom_button.dart';
// import '../../services/collection_references.dart';
// import '../../utils/constants.dart';
//
// class ProfileDetailsScreen extends StatefulWidget {
//   const ProfileDetailsScreen({Key? key}) : super(key: key);
//
//   @override
//   _ProfileDetailsScreenState createState() => _ProfileDetailsScreenState();
// }
//
// class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
//   final TextEditingController _userNameController = TextEditingController();
//   final TextEditingController _emailController = TextEditingController();
//   final TextEditingController _phoneNumberController = TextEditingController();
//   bool isLoading = false;
//   String _selectedGender = "Male";
//   final List<String> _genders = [
//     'Male',
//     'Female',
//     'Other',
//     'Prefer not to disclose'
//   ];
//
//   File? _image;
//
//   Future<void> _uploadProfile() async {
//     setState(() {
//       isLoading = true;
//     });
//     try {
//       String? imageUrl;
//       if (_image != null) {
//         imageUrl = await _uploadImage();
//       }
//       await FirebaseFirestore.instance
//           .collection("Users")
//           .doc(currentUId)
//           .update({
//         'userName': _userNameController.text,
//         'email': _emailController.text,
//         'phoneNumber': _phoneNumberController.text,
//         'gender': _selectedGender,
//         'profilePicture': imageUrl,
//         "updated_at": DateTime.now(),
//       }).then((value) {
//         Navigator.pop(context);
//       });
//       setState(() {
//         isLoading = false;
//       });
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Profile updated successfully')),
//       );
//     } catch (e) {
//       setState(() {
//         isLoading = false;
//       });
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Failed to update profile: $e')),
//       );
//     }
//   }
//
//   Future<String?> _uploadImage() async {
//     try {
//       // Upload image to Firebase Storage
//       final ref = firebase_storage.FirebaseStorage.instance
//           .ref()
//           .child('profile_images')
//           .child(currentUId)
//           .child('profile_pic.jpg');
//
//       await ref.putFile(_image!);
//
//       // Get download URL
//       final String downloadURL = await ref.getDownloadURL();
//
//       return downloadURL;
//     } catch (e) {
//       print('Failed to upload image: $e');
//       return null;
//     }
//   }
//
//   void _getImage(ImageSource source) async {
//     final pickedFile = await ImagePicker().pickImage(
//       source: source,
//       imageQuality: 50,
//     );
//
//     if (pickedFile != null) {
//       setState(() {
//         _image = File(pickedFile.path);
//       });
//     }
//   }
//
//   @override
//   void initState() {
//     super.initState();
//     // // Fetch user data from Firestore
//     // FirebaseFirestore.instance
//     //     .collection("Users")
//     //     .doc(currentUId)
//     //     .get()
//     //     .then((DocumentSnapshot snapshot) {
//     //   final data = snapshot.data() as Map<String, dynamic>;
//     //   // Update text fields with user data
//     //   _userNameController.text = data['userName'] ?? '';
//     //   _emailController.text = data['email'] ?? '';
//     //   _phoneNumberController.text = data['phoneNumber'] ?? '';
//     //   // Update gender if valid
//     //   final gender = data['gender'];
//     //   if (_genders.contains(gender)) {
//     //     setState(() {
//     //       _selectedGender = gender;
//     //     });
//     //   }
//     // }).catchError((error) {
//     //   print("Failed to fetch user data: $error");
//     // });
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Profile Details'),
//       ),
//       body: isLoading
//           ? Center(child: CircularProgressIndicator())
//           : CustomBackgroundContainer(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.center,
//                 children: [
//                   SizedBox(height: 20.0.h),
//                   Stack(
//                     children: [
//                       Container(
//                         decoration: BoxDecoration(
//                           color: Colors.white,
//                           borderRadius: BorderRadius.circular(20.0.r),
//                         ),
//                         padding: EdgeInsets.all(20.0.h),
//                         child: Column(
//                           crossAxisAlignment: CrossAxisAlignment.stretch,
//                           children: [
//                             CircleAvatar(
//                               radius: 50.r,
//                               backgroundImage:
//                                   AssetImage('assets/images/profile.jpg'),
//                             ),
//                             SizedBox(height: 20.0),
//                             TextFormField(
//                               controller: _userNameController,
//                               decoration: InputDecoration(
//                                 labelText: 'Username',
//                               ),
//                             ),
//                             SizedBox(height: 10.0),
//                             TextFormField(
//                               controller: _phoneNumberController,
//                               decoration: InputDecoration(
//                                 labelText: 'Phone Number',
//                               ),
//                             ),
//                             SizedBox(height: 10.0),
//                             TextFormField(
//                               enabled: false,
//                               controller: _emailController,
//                               decoration: InputDecoration(
//                                 labelText: 'Email',
//                               ),
//                             ),
//                             SizedBox(height: 10.0.h),
//                             DropdownButtonFormField<String>(
//                               value: _selectedGender,
//                               decoration: InputDecoration(
//                                 labelText: 'Gender',
//                               ),
//                               items: _genders.map((String value) {
//                                 return DropdownMenuItem<String>(
//                                   value: value,
//                                   child: Text(value),
//                                 );
//                               }).toList(),
//                               onChanged: (String? value) {
//                                 setState(() {
//                                   _selectedGender = value!;
//                                 });
//                               },
//                             ),
//                             SizedBox(height: 20.0.h),
//                           ],
//                         ),
//                       ),
//                       Positioned(
//                         top: 80.h,
//                         right: 0,
//                         left: 0,
//                         child: CircleAvatar(
//                           backgroundColor: kPrimary,
//                           child: IconButton(
//                             onPressed: () {
//                               _getImage(ImageSource.gallery);
//                             },
//                             icon: Icon(Icons.upload),
//                             color: Colors.white,
//                           ),
//                         ),
//                       ),
//                     ],
//                   ),
//                   SizedBox(height: 80.0.h),
//                 ],
//               ),
//               horizontalW: 15.w,
//               vertical: 10.h,
//             ),
//       bottomSheet: Container(
//         margin: EdgeInsets.all(12),
//         height: 60.h,
//         child: CustomButton(
//           text: "Upload Profile",
//           onPress: _uploadProfile,
//           color: kPrimary,
//         ),
//       ),
//     );
//   }
// }
