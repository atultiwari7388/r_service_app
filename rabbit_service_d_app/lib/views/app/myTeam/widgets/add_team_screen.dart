import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../../utils/show_toast_msg.dart';
import '../../../../widgets/text_field.dart';
import '../../auth/login_screen.dart';

class AddTeamMember extends StatefulWidget {
  const AddTeamMember({super.key});

  @override
  State<AddTeamMember> createState() => _AddTeamMemberState();
}

class _AddTeamMemberState extends State<AddTeamMember> {
  TextEditingController nameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController passController = TextEditingController();

  var isUserAcCreated = false;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<Map<String, dynamic>> vehicles = []; // To store vehicle details
  List<String> selectedVehicles = []; // To store selected vehicles' IDs

  @override
  void initState() {
    super.initState();
    fetchOwnerVehiclesDetails();
  }

  Future<void> fetchOwnerVehiclesDetails() async {
    try {
      QuerySnapshot vehiclesSnapshot = await _firestore
          .collection('Users')
          .doc(currentUId) // Replace with the owner's UID
          .collection('Vehicles')
          .get();

      // Store fetched vehicle details into the list
      vehicles = vehiclesSnapshot.docs.map((doc) {
        return {
          'id': doc.id,
          'companyName': doc['companyName'],
          'licensePlate': doc['licensePlate'],
          'vehicleNumber': doc['vehicleNumber'],
          'year': doc['year'],
          'vin': doc['vin'],
          'isSet': doc['isSet']
        };
      }).toList();

      setState(() {}); // Update the UI after fetching vehicles
    } catch (e) {
      log("Error fetching user vehicles: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: ReusableText(
          text: "Add Member",
          style: appStyle(20, kDark, FontWeight.normal),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(height: 24.h),
              buildTextFieldInputWidget(
                "Enter member name",
                TextInputType.text,
                nameController,
                MaterialCommunityIcons.account,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member email",
                TextInputType.emailAddress,
                emailController,
                MaterialCommunityIcons.email,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member phone number",
                TextInputType.number,
                phoneController,
                MaterialCommunityIcons.phone,
              ),
              SizedBox(height: 15.h),
              buildTextFieldInputWidget(
                "Enter member password",
                TextInputType.visiblePassword,
                passController,
                MaterialCommunityIcons.security,
                isPass: true,
              ),
              SizedBox(height: 15.h),

              // Vehicle selection with checkboxes
              SizedBox(height: 24.h),
              Text(
                "Assign Vehicles",
                style: appStyle(16, Colors.black, FontWeight.bold),
              ),
              SizedBox(height: 15.h),
              vehicles.isEmpty
                  ? CircularProgressIndicator()
                  : Column(
                      children: vehicles.map((vehicle) {
                        return CheckboxListTile(
                          title: Text(
                              "${vehicle['companyName']} (${vehicle['vehicleNumber']})"),
                          value: selectedVehicles.contains(vehicle['id']),
                          onChanged: (bool? selected) {
                            setState(() {
                              if (selected == true) {
                                selectedVehicles.add(vehicle['id']);
                              } else {
                                selectedVehicles.remove(vehicle['id']);
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),

              SizedBox(height: 24.h),
              isUserAcCreated
                  ? CircularProgressIndicator()
                  : CustomButton(
                      text: "Add Member",
                      onPress: () => createMemberWithEmailAndPassword(),
                      color: kPrimary,
                    ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }

  TextFieldInputWidget buildTextFieldInputWidget(
    String hintText,
    TextInputType type,
    TextEditingController controller,
    IconData icon, {
    bool isPass = false,
  }) {
    return TextFieldInputWidget(
      hintText: hintText,
      textInputType: type,
      textEditingController: controller,
      icon: icon,
      isPass: isPass,
    );
  }

  Future<void> createMemberWithEmailAndPassword() async {
    if (nameController.text.isEmpty ||
        emailController.text.isEmpty ||
        phoneController.text.isEmpty ||
        passController.text.isEmpty ||
        selectedVehicles.isEmpty) {
      showToastMessage(
          "Error", "All fields and vehicle selection are required", Colors.red);
      return;
    }

    final emailValid = RegExp(
        r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+\.[a-zA-Z]+");
    if (!emailValid.hasMatch(emailController.text)) {
      showToastMessage("Error", "Please enter a valid email", Colors.red);
      return;
    }

    isUserAcCreated = true;
    setState(() {});

    try {
      // Create the team member's account
      var user = await _auth.createUserWithEmailAndPassword(
        email: emailController.text,
        password: passController.text,
      );

      // Store the new team member in Firestore under 'Users'
      await _firestore.collection('Users').doc(user.user!.uid).set({
        "uid": user.user!.uid,
        "email": emailController.text,
        "active": true,
        "isTeamMember": true,
        "userName": nameController.text,
        "phoneNumber": phoneController.text,
        "createdBy": currentUId,
        "profilePicture": "",
        "role": "TMember",
        "created_at": DateTime.now(),
        "updated_at": DateTime.now(),
      });

      // Fetch and store selected vehicles in the team member's subcollection
      for (String vehicleId in selectedVehicles) {
        DocumentSnapshot vehicleDoc = await _firestore
            .collection('Users')
            .doc(currentUId) // Fetching from the owner's vehicles collection
            .collection('Vehicles')
            .doc(vehicleId)
            .get();

        if (vehicleDoc.exists) {
          // Store the selected vehicle details in the new team member's Vehicles subcollection
          await _firestore
              .collection('Users')
              .doc(user.user!.uid) // New team member's document
              .collection('Vehicles')
              .doc(vehicleId)
              .set({
            'companyName': vehicleDoc['companyName'],
            'licensePlate': vehicleDoc['licensePlate'],
            'vehicleNumber': vehicleDoc['vehicleNumber'],
            'year': vehicleDoc['year'],
            'vin': vehicleDoc['vin'],
            'isSet': vehicleDoc['isSet'],
            'assigned_at': DateTime.now(),
            "createdAt": DateTime.now(),
          });
        }
      }

      // Send email verification
      await user.user!.sendEmailVerification();
      showToastMessage(
        "Verification Sent",
        "A verification email has been sent to ${emailController.text}.",
        Colors.orange,
      );

      // Sign out the newly created user immediately after account creation
      await _auth.signOut();
      Get.offAll(() => const LoginScreen());
    } on FirebaseAuthException catch (e) {
      handleError(e);
    } finally {
      isUserAcCreated = false;
      setState(() {});
    }
  }

  void handleError(FirebaseAuthException e) {
    String errorMessage;
    switch (e.code) {
      case 'email-already-in-use':
        errorMessage = "The email is already in use by another account.";
        break;
      case 'invalid-email':
        errorMessage = "The email address is invalid.";
        break;
      case 'weak-password':
        errorMessage = "The password is too weak.";
        break;
      default:
        errorMessage = e.message ?? "An unknown error occurred.";
    }
    showToastMessage("Error", errorMessage, Colors.red);
  }
}
