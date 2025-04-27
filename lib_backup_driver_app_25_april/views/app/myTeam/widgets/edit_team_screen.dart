import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:intl/intl.dart';
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
  // Controllers
  TextEditingController nameController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController telephoneController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController email2Controller = TextEditingController();
  TextEditingController companyController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  TextEditingController cityController = TextEditingController();
  TextEditingController stateController = TextEditingController();
  TextEditingController countryController = TextEditingController();
  TextEditingController postalController = TextEditingController();
  TextEditingController licenseNumController = TextEditingController();
  TextEditingController socialSecurityController = TextEditingController();
  TextEditingController perMileChargeController = TextEditingController();

  // Dates
  DateTime? licExpiryDate;
  DateTime? dob;
  DateTime? lastDrugTest;
  DateTime? dateOfHire;
  DateTime? dateOfTermination;

  String originalEmail = '';
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  bool _isLoading = true;

  // Vehicle and role data
  List<Map<String, dynamic>> ownerVehicles = [];
  List<Map<String, dynamic>> memberVehicles = [];
  List<dynamic> selectedVehicles = [];
  List<String> roles = ["Manager", "Driver", "Vendor", "Accountant"];
  String? selectedRole;
  List<String> selectedRecordAccess = [];
  List<String> selectedChequeAccess = [];
  List<String> recordAccessCheckBox = ["View", "Edit", "Add"];
  List<String> chequeAccessCheckBox = [
    "Cheque",
  ];

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
        // Basic info
        nameController.text = memberDoc['userName'];
        emailController.text = memberDoc['email'];
        email2Controller.text = memberDoc['email2'] ?? '';
        companyController.text = memberDoc['companyName'] ?? '';
        originalEmail = memberDoc['email'];
        phoneController.text = memberDoc['phoneNumber'];
        telephoneController.text = memberDoc['telephone'] ?? '';
        addressController.text = memberDoc['address'] ?? '';
        cityController.text = memberDoc['city'] ?? '';
        stateController.text = memberDoc['state'] ?? '';
        countryController.text = memberDoc['country'] ?? '';
        postalController.text = memberDoc['postalCode'] ?? '';
        licenseNumController.text = memberDoc['licenseNumber'] ?? '';
        socialSecurityController.text = memberDoc['socialSecurityNumber'] ?? '';
        perMileChargeController.text = memberDoc['perMileCharge'] ?? '';

        // Dates
        licExpiryDate = memberDoc['licenseExpiryDate']?.toDate();
        dob = memberDoc['dateOfBirth']?.toDate();
        lastDrugTest = memberDoc['lastDrugTestDate']?.toDate();
        dateOfHire = memberDoc['dateOfHire']?.toDate();
        dateOfTermination = memberDoc['dateOfTermination']?.toDate();

        // Role and permissions
        selectedRole = memberDoc['role'];
        if (memberDoc['isView'] == true) selectedRecordAccess.add('View');
        if (memberDoc['isEdit'] == true) selectedRecordAccess.add('Edit');
        if (memberDoc['isAdd'] == true) selectedRecordAccess.add('Add');
        if (memberDoc['isCheque'] == true) selectedChequeAccess.add('Cheque');

        // Fetch member's vehicles
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

  Future<void> _selectDate(BuildContext context, DateTime? selectedDate,
      Function(DateTime?) onDateSelected) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != selectedDate) {
      onDateSelected(picked);
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
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Assign Role",
                      style: appStyle(16, Colors.black, FontWeight.bold),
                    ),
                    SizedBox(height: 10.h),
                    Divider(),
                    Padding(
                      padding: const EdgeInsets.only(left: 10, right: 10),
                      child: DropdownButtonFormField<String>(
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

                    if (selectedRole == "Vendor")
                      _buildVendorForm()
                    else if (selectedRole != null)
                      Column(
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
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "Telephone",
                            TextInputType.phone,
                            telephoneController,
                            MaterialCommunityIcons.phone,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "Address",
                            TextInputType.streetAddress,
                            addressController,
                            MaterialCommunityIcons.home,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "City",
                            TextInputType.text,
                            cityController,
                            MaterialCommunityIcons.city,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "State",
                            TextInputType.text,
                            stateController,
                            MaterialCommunityIcons.city,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "Country",
                            TextInputType.text,
                            countryController,
                            MaterialCommunityIcons.earth,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "Postal/Zip",
                            TextInputType.number,
                            postalController,
                            MaterialCommunityIcons.numeric,
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "License Number",
                            TextInputType.text,
                            licenseNumController,
                            MaterialCommunityIcons.card_account_details,
                          ),
                          SizedBox(height: 15.h),
                          _buildDatePickerField(
                            "License Expiry Date",
                            licExpiryDate,
                            (date) => setState(() => licExpiryDate = date),
                          ),
                          SizedBox(height: 15.h),
                          _buildDatePickerField(
                            "Date of Birth",
                            dob,
                            (date) => setState(() => dob = date),
                          ),
                          SizedBox(height: 15.h),
                          _buildDatePickerField(
                            "Last Drug Test",
                            lastDrugTest,
                            (date) => setState(() => lastDrugTest = date),
                          ),
                          SizedBox(height: 15.h),
                          _buildDatePickerField(
                            "Date of Hire",
                            dateOfHire,
                            (date) => setState(() => dateOfHire = date),
                          ),
                          SizedBox(height: 15.h),
                          _buildDatePickerField(
                            "Date of Termination",
                            dateOfTermination,
                            (date) => setState(() => dateOfTermination = date),
                          ),
                          SizedBox(height: 15.h),
                          _buildEditableField(
                            "Social Security Number",
                            TextInputType.number,
                            socialSecurityController,
                            MaterialCommunityIcons.shield_account,
                          ),
                        ],
                      ),
                    // Vehicle assignment section
                    if (selectedRole != null && selectedRole != "Vendor") ...[
                      SizedBox(height: 24.h),
                      Text(
                        "Assigned Vehicles",
                        style: appStyle(16, Colors.black, FontWeight.bold),
                      ),
                      SizedBox(height: 10.h),
                      Divider(),
                      ownerVehicles.isEmpty
                          ? Text("No vehicles available")
                          : Column(
                              children: ownerVehicles.map((vehicle) {
                                return CheckboxListTile(
                                  title: Text(
                                      "${vehicle['companyName']} (${vehicle['vehicleNumber']})"),
                                  value:
                                      selectedVehicles.contains(vehicle['id']),
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

                      // Record access section
                      SizedBox(height: 24.h),
                      Text(
                        "Record Access",
                        style: appStyle(16, Colors.black, FontWeight.bold),
                      ),
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
                    ],

                    SizedBox(height: 15.h),

                    //record access
                    Text(
                      "Assign Cheque Access",
                      style: appStyle(16, Colors.black, FontWeight.bold),
                    ),
                    SizedBox(height: 10.h),
                    Divider(),

                    Column(
                      children: chequeAccessCheckBox.map((chequeAccess) {
                        return CheckboxListTile(
                          title: Text(chequeAccess),
                          value: selectedChequeAccess
                              .contains(chequeAccess), // Check if selected
                          onChanged: (bool? selected) {
                            setState(() {
                              if (selected == true) {
                                selectedChequeAccess
                                    .add(chequeAccess); // Add to list
                                print(selectedRecordAccess);
                              } else {
                                selectedChequeAccess
                                    .remove(chequeAccess); // Remove from list
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                    SizedBox(height: 15.h),
                    // Per mile charge (only for drivers)
                    if (selectedRole == "Driver") ...[
                      SizedBox(height: 24.h),
                      _buildEditableField(
                        "Per mile charge",
                        TextInputType.number,
                        perMileChargeController,
                        Icons.money,
                      ),
                    ],

                    // Update button
                    SizedBox(height: 24.h),
                    CustomButton(
                      text: "Update Member",
                      onPress: _updateMember,
                      color: kPrimary,
                    ),
                    SizedBox(height: 24.h),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildVendorForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: 15.h),
        _buildEditableField(
          "Company Name*",
          TextInputType.text,
          companyController,
          MaterialCommunityIcons.office_building,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Name*",
          TextInputType.text,
          nameController,
          MaterialCommunityIcons.account,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Cell Phone*",
          TextInputType.phone,
          phoneController,
          MaterialCommunityIcons.phone,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Telephone",
          TextInputType.phone,
          telephoneController,
          MaterialCommunityIcons.phone,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Email*",
          TextInputType.emailAddress,
          emailController,
          MaterialCommunityIcons.email,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Email 2",
          TextInputType.emailAddress,
          email2Controller,
          MaterialCommunityIcons.email,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Address*",
          TextInputType.streetAddress,
          addressController,
          MaterialCommunityIcons.home,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "City*",
          TextInputType.text,
          cityController,
          MaterialCommunityIcons.city,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "State*",
          TextInputType.text,
          stateController,
          MaterialCommunityIcons.city,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Country*",
          TextInputType.text,
          countryController,
          MaterialCommunityIcons.earth,
        ),
        SizedBox(height: 15.h),
        _buildEditableField(
          "Postal/Zip",
          TextInputType.number,
          postalController,
          MaterialCommunityIcons.numeric,
        ),
        SizedBox(height: 15.h),
      ],
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

  Widget _buildDatePickerField(
    String label,
    DateTime? selectedDate,
    Function(DateTime?) onDateSelected,
  ) {
    return GestureDetector(
      onTap: () => _selectDate(context, selectedDate, onDateSelected),
      child: AbsorbPointer(
        child: Container(
          margin: EdgeInsets.symmetric(vertical: 4.0.h),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12.0.r),
          ),
          child: TextField(
            decoration: InputDecoration(
              labelText: label,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: BorderSide(
                  color: Colors.grey.shade300,
                  width: 1.0,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: BorderSide(
                  color: Colors.grey.shade300,
                  width: 1.0,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.0),
                borderSide: BorderSide(
                  color: Colors.grey.shade300,
                  width: 1.0,
                ),
              ),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.all(8),
              labelStyle: appStyle(14, kPrimary, FontWeight.bold),
              suffixIcon: Icon(Icons.calendar_today, size: 20),
            ),
            controller: TextEditingController(
              text: selectedDate == null
                  ? ''
                  : DateFormat('MM-dd-yyyy').format(selectedDate),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _updateMember() async {
    if (nameController.text.isEmpty ||
        phoneController.text.isEmpty ||
        emailController.text.isEmpty ||
        selectedRole == null) {
      showToastMessage("Error", "Required fields are missing", Colors.red);
      return;
    }

    try {
      // Update email in Firebase Auth if changed
      if (emailController.text != originalEmail) {
        await _callUpdateEmailFunction(
          userId: widget.memberId,
          newEmail: emailController.text.trim(),
        );
      }

      // Prepare update data
      Map<String, dynamic> updateData = {
        "userName": nameController.text,
        "email": emailController.text,
        "email2": email2Controller.text,
        "companyName": companyController.text,
        "phoneNumber": phoneController.text,
        "telephone": telephoneController.text,
        "address": addressController.text,
        "city": cityController.text,
        "state": stateController.text,
        "country": countryController.text,
        "postalCode": postalController.text,
        "licenseNumber": licenseNumController.text,
        "socialSecurityNumber": socialSecurityController.text,
        "licenseExpiryDate": licExpiryDate,
        "dateOfBirth": dob,
        "lastDrugTestDate": lastDrugTest,
        "dateOfHire": dateOfHire,
        "dateOfTermination": dateOfTermination,
        "role": selectedRole,
        "isManager": selectedRole == "Manager",
        "isDriver": selectedRole == "Driver",
        "isVendor": selectedRole == "Vendor",
        "isAccountant": selectedRole == "Accountant",
        "perMileCharge":
            selectedRole == "Driver" ? perMileChargeController.text : "0",
        "isView": selectedRecordAccess.contains("View"),
        "isEdit": selectedRecordAccess.contains("Edit"),
        "isAdd": selectedRecordAccess.contains("Add"),
        "isCheque": selectedChequeAccess.contains("Cheque"),
        "updated_at": FieldValue.serverTimestamp(),
      };

      // Remove null dates
      updateData.removeWhere((key, value) => value == null);

      // Update Firestore document
      await _firestore
          .collection('Users')
          .doc(widget.memberId)
          .update(updateData);

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
          FirebaseFunctions.instance.httpsCallable('updateUserEmail');

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

    // Remove unselected vehicles
    for (String vehicleId in toRemove) {
      // First delete the DataServices documents
      await _deleteVehicleDataServices(vehicleId);
      await _firestore
          .collection('Users')
          .doc(widget.memberId)
          .collection('Vehicles')
          .doc(vehicleId)
          .delete();
    }

    // Add new vehicles
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

  Future<void> _deleteVehicleDataServices(String vehicleId) async {
    try {
      // Get all DataServices documents for this vehicle
      QuerySnapshot dataServicesSnapshot = await _firestore
          .collection('Users')
          .doc(widget.memberId)
          .collection('DataServices')
          .where('vehicleId', isEqualTo: vehicleId)
          .get();

      // Delete all matching documents in a batch
      WriteBatch batch = _firestore.batch();
      for (var doc in dataServicesSnapshot.docs) {
        batch.delete(doc.reference);
      }

      await batch.commit();
      log('Deleted ${dataServicesSnapshot.docs.length} DataServices documents for vehicle $vehicleId');
    } catch (e) {
      log('Error deleting DataServices for vehicle $vehicleId: $e');
      throw Exception('Failed to clean up vehicle data');
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    telephoneController.dispose();
    emailController.dispose();
    addressController.dispose();
    cityController.dispose();
    stateController.dispose();
    countryController.dispose();
    postalController.dispose();
    licenseNumController.dispose();
    socialSecurityController.dispose();
    perMileChargeController.dispose();
    super.dispose();
  }
}
