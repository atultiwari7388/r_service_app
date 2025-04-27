import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/text_field.dart';
import '../../../services/collection_references.dart';
import '../../../utils/constants.dart';

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
  final TextEditingController _companyNameController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  String profilePictureUrl = "";
  String selectedVehicleRange = '';
  String role = "";

  bool isLoading = false;
  bool _isPersonalDetailsExpanded = false;
  bool _isVehicleDetailsExpanded = false;
  bool _isChangePasswordExpanded = false;

  final List<String> vehicleRanges = [
    '1 to 5',
    '1 to 10',
    '1 to 20',
    '1 to 30',
    '1 to 50',
    '1 to 100',
    '1 to 200',
    '1 to 500',
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
      } else if (_image == null) {
        imageUrl = profilePictureUrl;
      }
      // Uncomment below for Firebase functionality
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .update({
        'userName': _userNameController.text,
        'email': _emailController.text,
        'phoneNumber': _phoneNumberController.text,
        'address': _addressController.text,
        'profilePicture': imageUrl,
        'companyName': _companyNameController.text,
        "vehicleRange": selectedVehicleRange,
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
  void initState() {
    super.initState();
    // Fetch user data from Firestore
    FirebaseFirestore.instance
        .collection("Users")
        .doc(currentUId)
        .get()
        .then((DocumentSnapshot snapshot) {
      final data = snapshot.data() as Map<String, dynamic>;
      // Update text fields with user data
      _userNameController.text = data['userName'] ?? '';
      _emailController.text = data['email'] ?? '';
      _phoneNumberController.text = data['phoneNumber'] ?? '';
      _addressController.text = data['address'] ?? '';
      _companyNameController.text = data['companyName'] ?? '';
      selectedVehicleRange = data['vehicleRange'] ?? '';
      profilePictureUrl = data['profilePicture'] ?? '';
      role = data['role'] ?? '';
    }).catchError((error) {
      print("Failed to fetch user data: $error");
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
          : StreamBuilder(
              stream: FirebaseFirestore.instance
                  .collection("Users")
                  .doc(currentUId)
                  .snapshots(),
              builder: (BuildContext context,
                  AsyncSnapshot<DocumentSnapshot<Object?>> snapshot) {
                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return CircularProgressIndicator();
                }
                final data = snapshot.data!.data() as Map<String, dynamic>;
                profilePictureUrl = data['profilePicture'] ?? '';
                _userNameController.text = data['userName'] ?? '';
                _emailController.text = data['email'] ?? '';
                _phoneNumberController.text = data['phoneNumber'] ?? '';
                _addressController.text = data['address'] ?? '';
                _companyNameController.text = data['companyName'] ?? '';
                selectedVehicleRange = data['vehicleRange'] ?? '';
                role = data['role'] ?? '';

                return data.isNotEmpty
                    ? SingleChildScrollView(
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
                                      ? FileImage(
                                          _image!) // Show selected image
                                      : profilePictureUrl.isNotEmpty
                                          ? NetworkImage(
                                              profilePictureUrl) // Show Firebase image
                                          : AssetImage(
                                                  'assets/placeholder_image.png')
                                              as ImageProvider<Object>,
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
                              onTap: () {},
                              isAddIconEnabled: false,
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
                                  textInputType: TextInputType.streetAddress,
                                  icon: Icons.abc,
                                  isIconApply: false,
                                ),
                                role == "Owner"
                                    ? TextFieldInputWidget(
                                        hintText: "Company Name",
                                        textEditingController:
                                            _companyNameController,
                                        textInputType: TextInputType.text,
                                        icon: Icons.abc,
                                        isIconApply: false,
                                      )
                                    : SizedBox(),
                                SizedBox(height: 10.0.h),
                                role == "Owner"
                                    ? DropdownButtonFormField<String>(
                                        decoration: InputDecoration(
                                          labelText: "Number of Vehicles",
                                          labelStyle: appStyle(
                                              15, kPrimary, FontWeight.normal),
                                          fillColor: Colors.white,
                                          filled: true,
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                                12.0), // Rounded corners
                                            borderSide: BorderSide(
                                              color: Colors.grey
                                                  .shade300, // Border color
                                              width: 1.0,
                                            ),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                                12.0), // Rounded corners
                                            borderSide: BorderSide(
                                              color: Colors.grey
                                                  .shade300, // Border color
                                              width: 1.0,
                                            ),
                                          ),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                                12.0), // Rounded corners
                                            borderSide: BorderSide(
                                              color: Colors.grey
                                                  .shade300, // Border color
                                              width: 1.0,
                                            ),
                                          ),
                                          contentPadding:
                                              const EdgeInsets.all(8),
                                        ),
                                        value: selectedVehicleRange,
                                        icon: const Icon(Icons.arrow_drop_down),
                                        items:
                                            vehicleRanges.map((String range) {
                                          return DropdownMenuItem<String>(
                                            value: range,
                                            child: Text(range),
                                          );
                                        }).toList(),
                                        onChanged: (value) {
                                          if (value != null) {
                                            selectedVehicleRange = value;
                                          }
                                        },
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return "Please select a vehicle range";
                                          }
                                          return null;
                                        },
                                      )
                                    : SizedBox(),
                              ],
                            ),
                            SizedBox(height: 20.0.h),

                            _buildSectionCard(
                              context,
                              title: "Vehicle Details",
                              icon: Icons.directions_car,
                              isExpanded: _isVehicleDetailsExpanded,
                              onToggle: () => _toggleSection('vehicle'),
                              onTap: () async {
                                var result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => AddVehicleScreen(),
                                  ),
                                );
                                if (result != null) {
                                  String? company = result['company'];
                                  String? vehicleNumber =
                                      result['vehicleNumber'];
                                  log("Company: $company, Vehicle Number: $vehicleNumber");

                                  // Save the vehicle details in Firestore
                                  // await _saveVehicleDetails(
                                  //     company, vehicleNumber);
                                }
                              },
                              isAddIconEnabled: true,
                              children: [
                                StreamBuilder(
                                  stream: FirebaseFirestore.instance
                                      .collection("Users")
                                      .doc(currentUId)
                                      .collection('Vehicles')
                                      .snapshots(),
                                  builder: (BuildContext context,
                                      AsyncSnapshot<
                                              QuerySnapshot<
                                                  Map<String, dynamic>>>
                                          snapshot) {
                                    if (snapshot.hasError) {
                                      return Text('Error: ${snapshot.error}');
                                    }
                                    if (snapshot.connectionState ==
                                        ConnectionState.waiting) {
                                      return CircularProgressIndicator();
                                    }
                                    if (!snapshot.hasData ||
                                        snapshot.data!.docs.isEmpty) {
                                      return Text("No Vehicles Added");
                                    }

                                    final vehicles = snapshot.data!.docs;
                                    return ListView.builder(
                                      shrinkWrap: true,
                                      itemCount: vehicles.length,
                                      itemBuilder: (context, index) {
                                        final vehicle = vehicles[index];
                                        final bool isActive = vehicle['active'];
                                        return buildVehicleNameEditDeleteSection(
                                          vehicle['vehicleNumber'],
                                          () => _editVehicle(
                                              vehicle.id,
                                              vehicle['company'],
                                              vehicle['vehicleNumber']),
                                          () => _deleteVehicle(vehicle.id),
                                          isActive,
                                          (value) async {
                                            final vehicleId = vehicle.id;

                                            // Update the vehicle status
                                            await FirebaseFirestore.instance
                                                .collection("Users")
                                                .doc(currentUId)
                                                .collection('Vehicles')
                                                .doc(vehicleId)
                                                .update({'active': value}).then(
                                                    (_) async {
                                              showToastMessage(
                                                  "Msg",
                                                  "Vehicle Status Updated",
                                                  kSecondary);

                                              // Fetch all DataServices documents where vehicleId matches
                                              final dataServicesSnapshot =
                                                  await FirebaseFirestore
                                                      .instance
                                                      .collection("Users")
                                                      .doc(currentUId)
                                                      .collection(
                                                          'DataServices')
                                                      .where("vehicleId",
                                                          isEqualTo: vehicleId)
                                                      .get();

                                              // Check if DataServices exists
                                              if (dataServicesSnapshot
                                                  .docs.isNotEmpty) {
                                                final batch = FirebaseFirestore
                                                    .instance
                                                    .batch();

                                                for (var doc
                                                    in dataServicesSnapshot
                                                        .docs) {
                                                  batch.update(doc.reference,
                                                      {'active': value});
                                                }

                                                await batch.commit();
                                                // showToastMessage(
                                                //     "Msg",
                                                //     "DataServices Updated",
                                                //     kSecondary);
                                              }
                                            });
                                          },

                                          //     (value) async {
                                          //   await FirebaseFirestore.instance
                                          //       .collection("Users")
                                          //       .doc(currentUId)
                                          //       .collection('Vehicles')
                                          //       .doc(vehicle.id)
                                          //       .update({'active': value}).then((value){
                                          //         showToastMessage("Msg", "Vehicle Status Updated", kSecondary);
                                          //   });
                                          // },
                                          //
                                        );
                                      },
                                    );
                                  },
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
                              onTap: () {},
                              isAddIconEnabled: false,
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
                                  textEditingController:
                                      _confirmPasswordController,
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
                      )
                    : Center(child: Text("Data Not Found"));
              }),
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

  Container buildVehicleNameEditDeleteSection(
      String vehcileName,
      void Function()? onEditPress,
      void Function()? onDeletePress,
      bool isActive,
      ValueChanged<bool> onSwitchChanged) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 2.0.h),
      padding: EdgeInsets.symmetric(vertical: 1.0.h, horizontal: 2.w),
      width: double.maxFinite,
      height: 40.h,
      decoration: BoxDecoration(
        // color: kWhite.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 190.w,
            child: Text(
              vehcileName,
              textAlign: TextAlign.left,
              style: appStyle(13, kDark, FontWeight.normal),
            ),
          ),
          Expanded(child: SizedBox()),
          // IconButton(
          //     onPressed: onEditPress,
          //     icon: Icon(Icons.edit, color: kSecondary)),
          // IconButton(
          //     onPressed: onDeletePress,
          //     icon: Icon(Icons.delete, color: kPrimary))
          //
          Switch(
            value: isActive,
            activeColor: kPrimary,
            onChanged: onSwitchChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required bool isExpanded,
    required Function onToggle,
    required Function()? onTap,
    required List<Widget> children,
    required bool isAddIconEnabled,
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
                          style: kIsWeb
                              ? TextStyle()
                              : TextStyle(
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.w500,
                                ),
                        ),
                      ],
                    ),
                    isAddIconEnabled
                        ? SizedBox()
                        : Expanded(child: Container()),
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: kPrimary,
                    ),
                    isAddIconEnabled
                        ? GestureDetector(
                            onTap: onTap,
                            child: CircleAvatar(
                              backgroundColor: kPrimary,
                              radius: 15.r,
                              child: Icon(
                                Icons.add,
                                color: kWhite,
                                size: 25.r,
                              ),
                            ),
                          )
                        : SizedBox(),
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

  Future<void> _editVehicle(
      String vehicleId, String? company, String? vehicleNumber) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddVehicleScreen(),
      ),
    );

    if (result != null) {
      String? updatedCompany = result['company'];
      String? updatedVehicleNumber = result['vehicleNumber'];

      try {
        await FirebaseFirestore.instance
            .collection("Users")
            .doc(currentUId)
            .collection("Vehicles")
            .doc(vehicleId)
            .update({
          'company': updatedCompany,
          'vehicleNumber': updatedVehicleNumber,
          'updatedAt': DateTime.now(),
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Vehicle updated successfully')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update vehicle: $e')),
        );
      }
    }
  }

  Future<void> _deleteVehicle(String vehicleId) async {
    try {
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection("Vehicles")
          .doc(vehicleId)
          .delete();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vehicle deleted successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete vehicle: $e')),
      );
    }
  }
}
