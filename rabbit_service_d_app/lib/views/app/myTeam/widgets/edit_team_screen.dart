import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../../utils/show_toast_msg.dart';
import '../../../../widgets/text_field.dart';

class EditTeamMember extends StatefulWidget {
  final String memberId;

  const EditTeamMember({super.key, required this.memberId});

  @override
  State<EditTeamMember> createState() => _EditTeamMemberState();
}

class _EditTeamMemberState extends State<EditTeamMember> {
  TextEditingController nameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController perMileChargeController = TextEditingController();
  String originalEmail = '';

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  bool _isLoading = true;

  List<Map<String, dynamic>> ownerVehicles = [];
  List<Map<String, dynamic>> memberVehicles = [];
  List<dynamic> selectedVehicles = [];
  List<String> roles = ["Manager", "Driver"];
  String? selectedRole;
  List<String> recordAccessCheckBox = ["View", "Edit", "Add"];
  List<String> selectedRecordAccess = [];

  @override
  void initState() {
    super.initState();
    _loadMemberData();
    fetchOwnerVehiclesDetails();
  }

  Future<void> _loadMemberData() async {
    try {
      DocumentSnapshot memberDoc =
          await _firestore.collection('Users').doc(widget.memberId).get();

      if (memberDoc.exists) {
        nameController.text = memberDoc['userName'];
        emailController.text = memberDoc['email'];
        originalEmail = memberDoc['email'];
        phoneController.text = memberDoc['phoneNumber'];
        selectedRole = memberDoc['role'];
        perMileChargeController.text = memberDoc['perMileCharge'] ?? '';

        if (memberDoc['isView'] == true) selectedRecordAccess.add('View');
        if (memberDoc['isEdit'] == true) selectedRecordAccess.add('Edit');
        if (memberDoc['isDelete'] == true) selectedRecordAccess.add('Delete');
        if (memberDoc['isAdd'] == true) selectedRecordAccess.add('Add');

        QuerySnapshot vehiclesSnapshot = await _firestore
            .collection('Users')
            .doc(widget.memberId)
            .collection('Vehicles')
            .get();

        memberVehicles = vehiclesSnapshot.docs.map((doc) {
          return {
            'id': doc.id,
            'companyName': doc['companyName'],
            'vehicleNumber': doc['vehicleNumber'],
          };
        }).toList();

        selectedVehicles = memberVehicles.map((v) => v['id']).toList();
      }

      setState(() => _isLoading = false);
    } catch (e) {
      log("Error loading member data: $e");
      showToastMessage("Error", "Failed to load member data", Colors.red);
      Navigator.pop(context);
    }
  }

  Future<void> fetchOwnerVehiclesDetails() async {
    try {
      QuerySnapshot vehiclesSnapshot = await _firestore
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .get();

      ownerVehicles = vehiclesSnapshot.docs.map((doc) {
        return {
          'id': doc.id,
          'companyName': doc['companyName'],
          'vehicleNumber': doc['vehicleNumber'],
        };
      }).toList();

      setState(() {});
    } catch (e) {
      log("Error fetching owner vehicles: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: ReusableText(
            text: "Edit Member", style: appStyle(20, kDark, FontWeight.normal)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 24.h),
                    _buildEditableField(
                      "Name",
                      TextInputType.text,
                      nameController,
                      MaterialCommunityIcons.account,
                    ),
                    SizedBox(height: 15.h),
                    _buildEditableField(
                      "Email",
                      TextInputType.emailAddress,
                      emailController,
                      MaterialCommunityIcons.email,
                    ),
                    SizedBox(height: 15.h),
                    _buildEditableField(
                      "Phone Number",
                      TextInputType.phone,
                      phoneController,
                      MaterialCommunityIcons.phone,
                    ),
                    SizedBox(height: 24.h),
                    Text("Assigned Vehicles",
                        style: appStyle(16, Colors.black, FontWeight.bold)),
                    SizedBox(height: 10.h),
                    Divider(),
                    ownerVehicles.isEmpty
                        ? const CircularProgressIndicator()
                        : Column(
                            children: ownerVehicles.map((vehicle) {
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
                    _buildRoleDropdown(),
                    SizedBox(height: 24.h),
                    Text("Record Access",
                        style: appStyle(16, Colors.black, FontWeight.bold)),
                    SizedBox(height: 10.h),
                    Divider(),
                    Column(
                      children: recordAccessCheckBox.map((access) {
                        return CheckboxListTile(
                          title: Text(access),
                          value: selectedRecordAccess.contains(access),
                          onChanged: (bool? selected) {
                            setState(() {
                              if (selected == true) {
                                selectedRecordAccess.add(access);
                              } else {
                                selectedRecordAccess.remove(access);
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                    SizedBox(height: 24.h),
                    if (selectedRole == "Driver")
                      _buildEditableField(
                        "Per mile charge",
                        TextInputType.number,
                        perMileChargeController,
                        Icons.money,
                      ),
                    SizedBox(height: 24.h),
                    CustomButton(
                      text: "Update Member",
                      onPress: () => _updateMember(),
                      color: kPrimary,
                    ),
                    SizedBox(height: 24.h),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildEditableField(
    String hint,
    TextInputType type,
    TextEditingController controller,
    IconData icon,
  ) {
    return TextFieldInputWidget(
      hintText: hint,
      textInputType: type,
      textEditingController: controller,
      icon: icon,
    );
  }

  Widget _buildRoleDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Role", style: appStyle(16, Colors.black, FontWeight.bold)),
        SizedBox(height: 10.h),
        Divider(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: DropdownButtonFormField<String>(
            value: selectedRole,
            onChanged: (String? newValue) {
              setState(() => selectedRole = newValue);
            },
            items: roles.map((String role) {
              return DropdownMenuItem<String>(
                value: role,
                child: Text(role),
              );
            }).toList(),
            decoration: InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 10),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _updateMember() async {
    if (nameController.text.isEmpty ||
        phoneController.text.isEmpty ||
        emailController.text.isEmpty) {
      showToastMessage("Error", "Required fields are missing", Colors.red);
      return;
    }

    try {
      // Update email in Firebase Auth
      if (emailController.text != originalEmail) {
        await _callUpdateEmailFunction(
          userId: widget.memberId,
          newEmail: emailController.text.trim(),
        );
      }

      // Update Firestore document
      await _firestore.collection('Users').doc(widget.memberId).update({
        "userName": nameController.text,
        "email": emailController.text,
        "phoneNumber": phoneController.text,
        "role": selectedRole,
        "isManager": selectedRole == "Manager",
        "isDriver": selectedRole == "Driver",
        "perMileCharge":
            selectedRole == "Driver" ? perMileChargeController.text : "",
        "isView": selectedRecordAccess.contains("View"),
        "isEdit": selectedRecordAccess.contains("Edit"),
        "isDelete": selectedRecordAccess.contains("Delete"),
        "isAdd": selectedRecordAccess.contains("Add"),
        "updated_at": DateTime.now(),
      });

      // Update vehicle assignments
      await _updateVehicleAssignments();

      showToastMessage("Success", "Member updated successfully", Colors.green);
      Navigator.pop(context);
    } on FirebaseAuthException catch (e) {
      log("Auth Error: ${e.message}");
      showToastMessage("Error", e.message ?? "Update failed", Colors.red);
    } catch (e) {
      log("Update Error: $e");
      showToastMessage("Error", "Failed to update member", Colors.red);
    }
  }

  Future<void> _callUpdateEmailFunction({
    required String userId,
    required String newEmail,
  }) async {
    try {
      final HttpsCallable callable =
          FirebaseFunctions.instanceFor(region: 'your-region')
              .httpsCallable('updateUserEmail');

      final result = await callable.call(<String, dynamic>{
        'userId': userId,
        'newEmail': newEmail,
      });

      if (result.data['success'] != true) {
        throw FirebaseException(
          plugin: 'emailUpdate',
          message: 'Failed to update email through Cloud Function',
        );
      }
    } on FirebaseFunctionsException catch (e) {
      log('Cloud Function Error: ${e.code} ${e.message}');
      rethrow;
    }
  }

  Future<void> _updateVehicleAssignments() async {
    List<dynamic> currentVehicleIds =
        memberVehicles.map((v) => v['id']).toList();
    List<dynamic> toRemove = currentVehicleIds
        .where((id) => !selectedVehicles.contains(id))
        .toList();
    List<dynamic> toAdd = selectedVehicles
        .where((id) => !currentVehicleIds.contains(id))
        .toList();

    for (String vehicleId in toRemove) {
      await _firestore
          .collection('Users')
          .doc(widget.memberId)
          .collection('Vehicles')
          .doc(vehicleId)
          .delete();
    }

    for (String vehicleId in toAdd) {
      DocumentSnapshot vehicleDoc = await _firestore
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .doc(vehicleId)
          .get();

      if (vehicleDoc.exists) {
        await _firestore
            .collection('Users')
            .doc(widget.memberId)
            .collection('Vehicles')
            .doc(vehicleId)
            .set({
          'companyName': vehicleDoc['companyName'],
          'vehicleNumber': vehicleDoc['vehicleNumber'],
          'assigned_at': DateTime.now(),
        });
      }
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    perMileChargeController.dispose();
    super.dispose();
  }
}

// import 'dart:developer';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:flutter_vector_icons/flutter_vector_icons.dart';
// import 'package:regal_service_d_app/services/collection_references.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/widgets/custom_button.dart';
// import 'package:regal_service_d_app/widgets/reusable_text.dart';
// import '../../../../utils/show_toast_msg.dart';
// import '../../../../widgets/text_field.dart';

// class EditTeamMember extends StatefulWidget {
//   final String memberId;

//   const EditTeamMember({super.key, required this.memberId});

//   @override
//   State<EditTeamMember> createState() => _EditTeamMemberState();
// }

// class _EditTeamMemberState extends State<EditTeamMember> {
//   TextEditingController nameController = TextEditingController();
//   TextEditingController emailController = TextEditingController();
//   TextEditingController phoneController = TextEditingController();
//   TextEditingController perMileChargeController = TextEditingController();

//   final FirebaseFirestore _firestore = FirebaseFirestore.instance;
//   bool _isLoading = true;

//   List<Map<String, dynamic>> ownerVehicles = [];
//   List<Map<String, dynamic>> memberVehicles = [];
//   List<dynamic> selectedVehicles = [];
//   List<String> roles = ["Manager", "Driver"];
//   String? selectedRole;
//   List<String> recordAccessCheckBox = [
//     "View",
//     "Edit",
//     // "Delete",
//     "Add",
//   ];
//   List<String> selectedRecordAccess = [];

//   @override
//   void initState() {
//     super.initState();
//     _loadMemberData();
//     fetchOwnerVehiclesDetails();
//   }

//   Future<void> _loadMemberData() async {
//     try {
//       // Fetch member document
//       DocumentSnapshot memberDoc =
//           await _firestore.collection('Users').doc(widget.memberId).get();

//       if (memberDoc.exists) {
//         // Set basic info
//         nameController.text = memberDoc['userName'];
//         emailController.text = memberDoc['email'];
//         phoneController.text = memberDoc['phoneNumber'];
//         selectedRole = memberDoc['role'];
//         perMileChargeController.text = memberDoc['perMileCharge'] ?? '';

//         // Set record access
//         if (memberDoc['isView'] == true) selectedRecordAccess.add('View');
//         if (memberDoc['isEdit'] == true) selectedRecordAccess.add('Edit');
//         if (memberDoc['isDelete'] == true) selectedRecordAccess.add('Delete');
//         if (memberDoc['isAdd'] == true) selectedRecordAccess.add('Add');

//         // Fetch member's assigned vehicles
//         QuerySnapshot vehiclesSnapshot = await _firestore
//             .collection('Users')
//             .doc(widget.memberId)
//             .collection('Vehicles')
//             .get();

//         memberVehicles = vehiclesSnapshot.docs.map((doc) {
//           return {
//             'id': doc.id,
//             'companyName': doc['companyName'],
//             'vehicleNumber': doc['vehicleNumber'],
//           };
//         }).toList();

//         // Get vehicle IDs for preselection
//         // selectedVehicles = memberVehicles.map((v) => v['id']).toList();
//         selectedVehicles = memberVehicles.map((v) => v['id']).toList();
//       }

//       setState(() => _isLoading = false);
//     } catch (e) {
//       log("Error loading member data: $e");
//       showToastMessage("Error", "Failed to load member data", Colors.red);
//       Navigator.pop(context);
//     }
//   }

//   Future<void> fetchOwnerVehiclesDetails() async {
//     try {
//       QuerySnapshot vehiclesSnapshot = await _firestore
//           .collection('Users')
//           .doc(currentUId)
//           .collection('Vehicles')
//           .get();

//       ownerVehicles = vehiclesSnapshot.docs.map((doc) {
//         return {
//           'id': doc.id,
//           'companyName': doc['companyName'],
//           'vehicleNumber': doc['vehicleNumber'],
//         };
//       }).toList();

//       setState(() {});
//     } catch (e) {
//       log("Error fetching owner vehicles: $e");
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       resizeToAvoidBottomInset: true,
//       appBar: AppBar(
//         title: ReusableText(
//           text: "Edit Member",
//           style: appStyle(20, kDark, FontWeight.normal),
//         ),
//       ),
//       body: _isLoading
//           ? const Center(child: CircularProgressIndicator())
//           : SingleChildScrollView(
//               child: Padding(
//                 padding:
//                     const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     SizedBox(height: 24.h),
//                     _buildReadOnlyField("Name", nameController),
//                     SizedBox(height: 15.h),
//                     _buildReadOnlyField("Email", emailController),
//                     SizedBox(height: 15.h),
//                     _buildEditableField(
//                       "Phone Number",
//                       TextInputType.phone,
//                       phoneController,
//                       MaterialCommunityIcons.phone,
//                     ),
//                     SizedBox(height: 24.h),
//                     Text("Assigned Vehicles",
//                         style: appStyle(16, Colors.black, FontWeight.bold)),
//                     SizedBox(height: 10.h),
//                     Divider(),
//                     ownerVehicles.isEmpty
//                         ? const CircularProgressIndicator()
//                         : Column(
//                             children: ownerVehicles.map((vehicle) {
//                               return CheckboxListTile(
//                                 title: Text(
//                                     "${vehicle['companyName']} (${vehicle['vehicleNumber']})"),
//                                 value: selectedVehicles.contains(vehicle['id']),
//                                 onChanged: (bool? selected) {
//                                   setState(() {
//                                     if (selected == true) {
//                                       selectedVehicles.add(vehicle['id']);
//                                     } else {
//                                       selectedVehicles.remove(vehicle['id']);
//                                     }
//                                   });
//                                 },
//                               );
//                             }).toList(),
//                           ),
//                     SizedBox(height: 24.h),
//                     _buildRoleDropdown(),
//                     SizedBox(height: 24.h),
//                     Text("Record Access",
//                         style: appStyle(16, Colors.black, FontWeight.bold)),
//                     SizedBox(height: 10.h),
//                     Divider(),
//                     Column(
//                       children: recordAccessCheckBox.map((access) {
//                         return CheckboxListTile(
//                           title: Text(access),
//                           value: selectedRecordAccess.contains(access),
//                           onChanged: (bool? selected) {
//                             setState(() {
//                               if (selected == true) {
//                                 selectedRecordAccess.add(access);
//                               } else {
//                                 selectedRecordAccess.remove(access);
//                               }
//                             });
//                           },
//                         );
//                       }).toList(),
//                     ),
//                     SizedBox(height: 24.h),
//                     if (selectedRole == "Driver")
//                       _buildEditableField(
//                         "Per mile charge",
//                         TextInputType.number,
//                         perMileChargeController,
//                         Icons.money,
//                       ),
//                     SizedBox(height: 24.h),
//                     CustomButton(
//                       text: "Update Member",
//                       onPress: () => _updateMember(),
//                       color: kPrimary,
//                     ),
//                     SizedBox(height: 24.h),
//                   ],
//                 ),
//               ),
//             ),
//     );
//   }

//   Widget _buildReadOnlyField(String label, TextEditingController controller) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text(label, style: appStyle(14, Colors.grey, FontWeight.normal)),
//         TextFormField(
//           controller: controller,
//           enabled: false,
//           decoration: InputDecoration(
//             disabledBorder: UnderlineInputBorder(
//               borderSide: BorderSide(color: Colors.grey.shade300),
//             ),
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _buildEditableField(
//     String hint,
//     TextInputType type,
//     TextEditingController controller,
//     IconData icon,
//   ) {
//     return TextFieldInputWidget(
//       hintText: hint,
//       textInputType: type,
//       textEditingController: controller,
//       icon: icon,
//     );
//   }

//   Widget _buildRoleDropdown() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text("Role", style: appStyle(16, Colors.black, FontWeight.bold)),
//         SizedBox(height: 10.h),
//         Divider(),
//         Padding(
//           padding: const EdgeInsets.symmetric(horizontal: 10),
//           child: DropdownButtonFormField<String>(
//             value: selectedRole,
//             onChanged: (String? newValue) {
//               setState(() => selectedRole = newValue);
//             },
//             items: roles.map((String role) {
//               return DropdownMenuItem<String>(
//                 value: role,
//                 child: Text(role),
//               );
//             }).toList(),
//             decoration: InputDecoration(
//               border: OutlineInputBorder(),
//               contentPadding: EdgeInsets.symmetric(horizontal: 10),
//             ),
//           ),
//         ),
//       ],
//     );
//   }

//   Future<void> _updateMember() async {
//     if (nameController.text.isEmpty || phoneController.text.isEmpty) {
//       showToastMessage("Error", "Required fields are missing", Colors.red);
//       return;
//     }

//     try {
//       // Update user document
//       await _firestore.collection('Users').doc(widget.memberId).update({
//         "userName": nameController.text,
//         "phoneNumber": phoneController.text,
//         "role": selectedRole,
//         "isManager": selectedRole == "Manager",
//         "isDriver": selectedRole == "Driver",
//         "perMileCharge":
//             selectedRole == "Driver" ? perMileChargeController.text : "",
//         "isView": selectedRecordAccess.contains("View"),
//         "isEdit": selectedRecordAccess.contains("Edit"),
//         "isDelete": selectedRecordAccess.contains("Delete"),
//         "isAdd": selectedRecordAccess.contains("Add"),
//         "updated_at": DateTime.now(),
//       });

//       // Update vehicle assignments
//       await _updateVehicleAssignments();

//       showToastMessage("Success", "Member updated successfully", Colors.green);
//       Navigator.pop(context);
//     } catch (e) {
//       log("Error updating member: $e");
//       showToastMessage("Error", "Failed to update member", Colors.red);
//     }
//   }

//   Future<void> _updateVehicleAssignments() async {
//     // Get current assignments
//     List<dynamic> currentVehicleIds =
//         memberVehicles.map((v) => v['id']).toList();

//     // Vehicles to remove
//     List<dynamic> toRemove = currentVehicleIds
//         .where((id) => !selectedVehicles.contains(id))
//         .toList();

//     // Vehicles to add
//     List<dynamic> toAdd = selectedVehicles
//         .where((id) => !currentVehicleIds.contains(id))
//         .toList();

//     // Remove unselected vehicles
//     for (String vehicleId in toRemove) {
//       await _firestore
//           .collection('Users')
//           .doc(widget.memberId)
//           .collection('Vehicles')
//           .doc(vehicleId)
//           .delete();
//     }

//     // Add new vehicles
//     for (String vehicleId in toAdd) {
//       DocumentSnapshot vehicleDoc = await _firestore
//           .collection('Users')
//           .doc(currentUId)
//           .collection('Vehicles')
//           .doc(vehicleId)
//           .get();

//       if (vehicleDoc.exists) {
//         await _firestore
//             .collection('Users')
//             .doc(widget.memberId)
//             .collection('Vehicles')
//             .doc(vehicleId)
//             .set({
//           'companyName': vehicleDoc['companyName'],
//           'vehicleNumber': vehicleDoc['vehicleNumber'],
//           'assigned_at': DateTime.now(),
//         });
//       }
//     }
//   }

//   @override
//   void dispose() {
//     nameController.dispose();
//     emailController.dispose();
//     phoneController.dispose();
//     perMileChargeController.dispose();
//     super.dispose();
//   }
// }
