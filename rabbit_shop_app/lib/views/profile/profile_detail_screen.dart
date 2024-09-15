import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
import '../../services/collection_references.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/text_field.dart';

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
  final TextEditingController _perHourCharge = TextEditingController();

  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  final ScrollController scrollController = ScrollController();
  String profilePictureUrl = "";

  bool isLoading = false;
  bool _isPersonalDetailsExpanded = false;
  bool _isLanguageDetailsExpanded = false;
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
      } else if (_image == null) {
        imageUrl = profilePictureUrl;
      }
      // Uncomment below for Firebase functionality
      await FirebaseFirestore.instance
          .collection("Mechanics")
          .doc(currentUId)
          .update({
        'userName': _userNameController.text,
        'email': _emailController.text,
        'phoneNumber': _phoneNumberController.text,
        'address': _addressController.text,
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

  void _toggleSection(String section) {
    setState(() {
      if (section == 'personal') {
        _isPersonalDetailsExpanded = !_isPersonalDetailsExpanded;
        if (_isPersonalDetailsExpanded) {
          _isLanguageDetailsExpanded = false;
          _isChangePasswordExpanded = false;
        }
      } else if (section == 'languages') {
        _isLanguageDetailsExpanded = !_isLanguageDetailsExpanded;
        if (_isLanguageDetailsExpanded) {
          _isPersonalDetailsExpanded = false;
          _isChangePasswordExpanded = false;
        }
      } else if (section == 'password') {
        _isChangePasswordExpanded = !_isChangePasswordExpanded;
        if (_isChangePasswordExpanded) {
          _isPersonalDetailsExpanded = false;
          _isLanguageDetailsExpanded = false;
        }
      }
    });
  }

  Map<String, bool> languages = {};

  @override
  void initState() {
    super.initState();
    fetchLanguagesFromDatabase();
    // Initialize all languages as unchecked

    FirebaseFirestore.instance
        .collection("Mechanics")
        .doc(currentUId)
        .get()
        .then((DocumentSnapshot snapshot) {
      final data = snapshot.data() as Map<String, dynamic>;
      // Update text fields with user data
      _userNameController.text = data['userName'] ?? '';
      _emailController.text = data['email'] ?? '';
      _phoneNumberController.text = data['phoneNumber'] ?? '';
      _addressController.text = data['lastAddress'] ?? '';
      _perHourCharge.text = data["perHCharge"] ?? 0;
    }).catchError((error) {
      print("Failed to fetch user data: $error");
    });
  }

  Future<void> fetchLanguagesFromDatabase() async {
    // Fetch the document from Firestore
    DocumentSnapshot doc = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(currentUId) // replace with the actual mechanic's ID
        .get();

    if (doc.exists) {
      // Ensure the data is a Map and cast it properly
      Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

      // Extract the 'languages' field and cast it as Map<String, bool>
      Map<String, bool> languagesData =
          Map<String, bool>.from(data['languages']);

      // Update the state with the languages data
      setState(() {
        languages = languagesData;
        print(languages);
      });
    }
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
    scrollController.dispose();
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
                  .collection("Mechanics")
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
                _perHourCharge.text = data["perHCharge"].toString() ?? '';

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
                              children: [
                                TextFieldInputWidget(
                                  hintText: "Company Name",
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
                                TextFieldInputWidget(
                                  hintText: "Per hour charge",
                                  textEditingController: _perHourCharge,
                                  textInputType: TextInputType.phone,
                                  icon: Icons.abc,
                                  isIconApply: false,
                                ),
                              ],
                            ),
                            SizedBox(height: 20.0.h),
                            // _buildSectionCard(
                            //   context,
                            //   title: "Selected Languages",
                            //   icon: Icons.language,
                            //   isExpanded: _isLanguageDetailsExpanded,
                            //   onToggle: () => _toggleSection('languages'),
                            //   children: [
                            //     Container(
                            //       decoration: BoxDecoration(
                            //         borderRadius: BorderRadius.circular(8.r),
                            //       ),
                            //       child: Scrollbar(
                            //         thumbVisibility: true,
                            //         child: ListView.builder(
                            //           padding: EdgeInsets.zero,
                            //           shrinkWrap: true,
                            //           itemCount: languages.length,
                            //           itemBuilder: (context, index) {
                            //             return ListView(
                            //               children:
                            //                   languages.entries.map((entry) {
                            //                 return entry.value
                            //                     ? CheckboxListTile(
                            //                         title: Text(entry.key),
                            //                         value: entry.value,
                            //                         onChanged: (bool? value) {
                            //                           // Logic for toggling checkbox (if needed)
                            //                           setState(() {
                            //                             languages[entry.key] =
                            //                                 value!;
                            //                           });
                            //                         },
                            //                       )
                            //                     : Container(); // Don't show the checkbox if the value is false
                            //               }).toList(),
                            //             );
                            //           },
                            //         ),
                            //       ),
                            //     ),
                            //   ],
                            //
                            // ),

                            _buildSectionCard(
                              context,
                              title: "Selected Languages",
                              icon: Icons.language,
                              isExpanded: _isLanguageDetailsExpanded,
                              onToggle: () => _toggleSection('languages'),
                              children: [
                                Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                  child: Scrollbar(
                                    thumbVisibility: true,
                                    // Keep thumbVisibility as true
                                    controller: scrollController,
                                    // Provide the ScrollController
                                    child: ListView(
                                      controller: scrollController,
                                      // Use the same ScrollController
                                      shrinkWrap: true,
                                      padding: EdgeInsets.zero,
                                      children: languages.entries.map((entry) {
                                        return entry.value
                                            ? CheckboxListTile(
                                                title: Text(entry.key),
                                                value: entry.value,
                                                onChanged: (bool? value) {
                                                  setState(() {
                                                    languages[entry.key] =
                                                        value!;
                                                  });
                                                },
                                              )
                                            : Container(); // Show nothing if the value is false
                                      }).toList(),
                                    ),
                                  ),
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

  Container buildVehicleNameEditDeleteSection(String vehcileName,
      void Function()? onEditPress, void Function()? onDeletePress) {
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
          IconButton(
              onPressed: onEditPress,
              icon: Icon(Icons.edit, color: kSecondary)),
          IconButton(
              onPressed: onDeletePress,
              icon: Icon(Icons.delete, color: kPrimary))
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
