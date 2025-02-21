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
import 'package:regal_service_d_app/views/app/myTeam/my_team_screen.dart';
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
  TextEditingController perMileChargeController = TextEditingController();

  var isUserAcCreated = false;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<Map<String, dynamic>> vehicles = []; // To store vehicle details
  List<String> selectedVehicles = []; // To store selected vehicles' IDs
  List<String> roles = ["Manager", "Driver"];
  String? selectedRole;
  List<String> recordAccessCheckBox = [
    "View",
    // "Edit",
    // "Delete",
    "Add",
  ];
  List<String> selectedRecordAccess = [];

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
            crossAxisAlignment: CrossAxisAlignment.start,
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
              // Vehicle selection with checkboxes
              SizedBox(height: 10.h),
              Text(
                "Assign Vehicles",
                style: appStyle(16, Colors.black, FontWeight.bold),
              ),
              SizedBox(height: 15.h),
              Divider(),
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
              SizedBox(height: 10.h),
              Text(
                "Assign Role",
                style: appStyle(16, Colors.black, FontWeight.bold),
              ),
              SizedBox(height: 10.h),
              Divider(),
              Padding(
                padding: const EdgeInsets.only(left: 10, right: 10),
                child: DropdownButtonFormField<String>(
                  hint: Text("Select Role"),
                  value: selectedRole,
                  onChanged: (String? newValue) {
                    setState(() {
                      selectedRole = newValue;
                    });
                  },
                  items: roles.map((String role) {
                    return DropdownMenuItem<String>(
                      value: role,
                      child: Text(role),
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: 24.h),
              Text(
                "Assign Record Access",
                style: appStyle(16, Colors.black, FontWeight.bold),
              ),
              SizedBox(height: 10.h),
              Divider(),

              Column(
                children: recordAccessCheckBox.map((recordAccess) {
                  return CheckboxListTile(
                    title: Text(recordAccess),
                    value: selectedRecordAccess
                        .contains(recordAccess), // Check if selected
                    onChanged: (bool? selected) {
                      setState(() {
                        if (selected == true) {
                          selectedRecordAccess.add(recordAccess); // Add to list
                          print(selectedRecordAccess);
                        } else {
                          selectedRecordAccess
                              .remove(recordAccess); // Remove from list
                        }
                      });
                    },
                  );
                }).toList(),
              ),

              SizedBox(height: 15.h),

              selectedRole == "Driver"
                  ? buildTextFieldInputWidget(
                      "Enter per mile charge",
                      TextInputType.number,
                      perMileChargeController,
                      Icons.money,
                    )
                  : Container(),
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

  // Future<void> createMemberWithEmailAndPassword() async {
  //   if (nameController.text.isEmpty ||
  //       emailController.text.isEmpty ||
  //       phoneController.text.isEmpty ||
  //       passController.text.isEmpty ||
  //       selectedVehicles.isEmpty) {
  //     showToastMessage(
  //         "Error", "All fields and vehicle selection are required", Colors.red);
  //     return;
  //   }

  //   final emailValid = RegExp(
  //       r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+\.[a-zA-Z]+");
  //   if (!emailValid.hasMatch(emailController.text)) {
  //     showToastMessage("Error", "Please enter a valid email", Colors.red);
  //     return;
  //   }

  //   isUserAcCreated = true;
  //   setState(() {});

  //   try {
  //     // Create the team member's account
  //     var user = await _auth.createUserWithEmailAndPassword(
  //       email: emailController.text,
  //       password: passController.text,
  //     );

  //     // Store the new team member in Firestore under 'Users'
  //     await _firestore.collection('Users').doc(user.user!.uid).set({
  //       "uid": user.user!.uid,
  //       "email": emailController.text,
  //       "active": true,
  //       "userName": nameController.text,
  //       "phoneNumber": phoneController.text,
  //       "createdBy": currentUId,
  //       "profilePicture":
  //           "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
  //       "role": selectedRole,
  //       "isManager": selectedRole == "Manager" ? true : false,
  //       "isDriver": selectedRole == "Driver" ? true : false,
  //       "perMileCharge":
  //           selectedRole == "Driver" ? perMileChargeController.text : "",
  //       "isView": selectedRecordAccess.contains("View"),
  //       "isEdit": selectedRecordAccess.contains("Edit"),
  //       "isDelete": selectedRecordAccess.contains("Delete"),
  //       "isAdd": selectedRecordAccess.contains("Add"),
  //       "isOwner": false,
  //       "isTeamMember": true,
  //       "created_at": DateTime.now(),
  //       "updated_at": DateTime.now(),
  //     });

  //     // Fetch and store selected vehicles in the team member's subcollection
  //     for (String vehicleId in selectedVehicles) {
  //       DocumentSnapshot vehicleDoc = await _firestore
  //           .collection('Users')
  //           .doc(currentUId) // Fetching from the owner's vehicles collection
  //           .collection('Vehicles')
  //           .doc(vehicleId)
  //           .get();

  //       if (vehicleDoc.exists) {
  //         await _firestore
  //             .collection('Users')
  //             .doc(user.user!.uid) // New team member's document
  //             .collection('Vehicles')
  //             .doc(vehicleId)
  //             .set(vehicleDoc.data()
  //                 as Map<String, dynamic>); // Copy the whole document
  //       }

  //       // **Fetch and assign DataServices based on vehicleId**
  //       QuerySnapshot dataServicesSnapshot = await _firestore
  //           .collection('Users')
  //           .doc(currentUId)
  //           .collection('DataServices')
  //           .where('vehicleId', isEqualTo: vehicleId)
  //           .get();

  //       for (var doc in dataServicesSnapshot.docs) {
  //         await _firestore
  //             .collection('Users')
  //             .doc(user.user!.uid)
  //             .collection('DataServices')
  //             .doc(doc.id)
  //             .set(doc.data()
  //                 as Map<String, dynamic>); // Copy the entire document
  //       }
  //     }

  //     // Send email verification
  //     await user.user!.sendEmailVerification();
  //     showToastMessage(
  //       "Verification Sent",
  //       "A verification email has been sent to ${emailController.text}.",
  //       Colors.orange,
  //     );

  //     // Sign out the newly created user immediately after account creation
  //     await _auth.signOut();
  //     Get.offAll(() => const LoginScreen());
  //   } on FirebaseAuthException catch (e) {
  //     handleError(e);
  //   } finally {
  //     isUserAcCreated = false;
  //     setState(() {});
  //   }
  // }

  Future<void> createMemberWithEmailAndPassword() async {
    if (nameController.text.isEmpty ||
        emailController.text.isEmpty ||
        phoneController.text.isEmpty ||
        passController.text.isEmpty ||
        selectedVehicles.isEmpty ||
        selectedRole == null) {
      showToastMessage("Error",
          "All fields, role, and vehicle selection are required", Colors.red);
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
      var user = await _auth.createUserWithEmailAndPassword(
        email: emailController.text,
        password: passController.text,
      );

      await _firestore.collection('Users').doc(user.user!.uid).set({
        "uid": user.user!.uid,
        "email": emailController.text,
        "active": true,
        "userName": nameController.text,
        "phoneNumber": phoneController.text,
        "createdBy": currentUId,
        "profilePicture":
            "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        "role": selectedRole,
        "isManager": selectedRole == "Manager" ? true : false,
        "isDriver": selectedRole == "Driver" ? true : false,
        "perMileCharge":
            selectedRole == "Driver" ? perMileChargeController.text : "",
        "isView": selectedRecordAccess.contains("View"),
        "isEdit": selectedRecordAccess.contains("Edit"),
        "isDelete": selectedRecordAccess.contains("Delete"),
        "isAdd": selectedRecordAccess.contains("Add"),
        "isOwner": false,
        "isTeamMember": true,
        "created_at": DateTime.now(),
        "updated_at": DateTime.now(),
      });

      for (String vehicleId in selectedVehicles) {
        DocumentSnapshot vehicleDoc = await _firestore
            .collection('Users')
            .doc(currentUId)
            .collection('Vehicles')
            .doc(vehicleId)
            .get();

        if (vehicleDoc.exists) {
          await _firestore
              .collection('Users')
              .doc(user.user!.uid)
              .collection('Vehicles')
              .doc(vehicleId)
              .set(vehicleDoc.data() as Map<String, dynamic>);

          QuerySnapshot dataServicesSnapshot = await _firestore
              .collection('Users')
              .doc(currentUId)
              .collection('DataServices')
              .where('vehicleId', isEqualTo: vehicleId)
              .get();

          for (var doc in dataServicesSnapshot.docs) {
            await _firestore
                .collection('Users')
                .doc(user.user!.uid)
                .collection('DataServices')
                .doc(doc.id)
                .set(doc.data() as Map<String, dynamic>);
          }
        }
      }

      await user.user!.sendEmailVerification();
      showToastMessage(
        "Verification Sent",
        "A verification email has been sent to ${emailController.text}.",
        Colors.orange,
      );

      nameController.clear();
      emailController.clear();
      phoneController.clear();
      passController.clear();
      perMileChargeController.clear();
      selectedVehicles.clear();
      selectedRole = null;
      selectedRecordAccess.clear();

      setState(() {});

      Get.off(() => MyTeamScreen());
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

  @override
  void dispose() {
    super.dispose();
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passController.dispose();
    perMileChargeController.dispose();
  }
}
