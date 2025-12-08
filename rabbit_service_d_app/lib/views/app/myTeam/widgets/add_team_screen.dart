import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/myTeam/my_team_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import '../../../../utils/show_toast_msg.dart';
import '../../../../widgets/text_field.dart';

class AddTeamMember extends StatefulWidget {
  const AddTeamMember({super.key, required this.currentUId});
  final String currentUId;

  @override
  State<AddTeamMember> createState() => _AddTeamMemberState();
}

class _AddTeamMemberState extends State<AddTeamMember> {
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  TextEditingController nameController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController telephoneController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController email2Controller = TextEditingController();
  // TextEditingController companyController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  TextEditingController cityController = TextEditingController();
  TextEditingController stateController = TextEditingController();
  TextEditingController countryController = TextEditingController();
  TextEditingController postalController = TextEditingController();
  TextEditingController licenseNumController = TextEditingController();
  TextEditingController socialSecurityController = TextEditingController();
  TextEditingController passController =
      TextEditingController(text: "12345678");
  TextEditingController perMileChargeController = TextEditingController();

  DateTime? licExpiryDate;
  DateTime? dob;
  DateTime? lastDrugTest;
  DateTime? dateOfHire;
  DateTime? dateOfTermination;
  bool areAllVehiclesSelected = false;

  var isUserAcCreated = false;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<Map<String, dynamic>> vehicles = [];
  List<String> selectedVehicles = [];
  String? selectedRole;
  String? selectedPayType;
  List<String> selectedRecordAccess = [];
  List<String> selectedChequeAccess = [];
  List<String> recordAccessCheckBox = [
    "View",
    "Edit",
    "Add",
  ];
  List<String> chequeAccessCheckBox = [
    "Cheque",
  ];

  // UI display names
  List<String> roleDisplayNames = [
    "Co-Owner",
    "Manager",
    "Driver",
    "Vendor",
    "Accountant",
    "Other Staff"
  ];

  // Database storage values
  List<String> roleDatabaseValues = [
    "SubOwner",
    "Manager",
    "Driver",
    "Vendor",
    "Accountant",
    "Other Staff"
  ];

  List<String> payTypeModes = [];

  @override
  void initState() {
    super.initState();
    payTypeModes = [
      "Per Mile",
      "Per Trip",
      "Per Hour",
      "Per Month",
    ];
    fetchOwnerVehiclesDetails();
  }

  Future<void> fetchOwnerVehiclesDetails() async {
    try {
      QuerySnapshot vehiclesSnapshot = await _firestore
          .collection('Users')
          .doc(widget.currentUId)
          .collection('Vehicles')
          .where('active', isEqualTo: true)
          .get();

      // Store fetched vehicle details into the list and sort alphabetically by vehicleNumber
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

      // Sort vehicles alphabetically by vehicleNumber
      vehicles.sort((a, b) => (a['vehicleNumber'] as String)
          .toLowerCase()
          .compareTo((b['vehicleNumber'] as String).toLowerCase()));

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
                      // Update payTypeModes based on selected role
                      if (newValue == "Other Staff") {
                        payTypeModes = ["Per Hour", "Per Month"];
                      } else {
                        payTypeModes = [
                          "Per Mile",
                          "Per Trip",
                          "Per Hour",
                          "Per Month",
                        ];
                      }
                      // Reset selected pay type when role changes
                      selectedPayType = null;
                    });
                  },
                  items: roleDisplayNames.asMap().entries.map((entry) {
                    int index = entry.key;
                    String displayName = entry.value;
                    String databaseValue = roleDatabaseValues[index];

                    return DropdownMenuItem<String>(
                      value: databaseValue,
                      child: Text(displayName),
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: 24.h),
              if (selectedRole == "Vendor" || selectedRole == "Other Staff")
                _buildVendorForm()
              else if (selectedRole != null)
                Column(
                  children: [
                    buildTextFieldInputWidget(
                      "Enter member name*",
                      TextInputType.text,
                      nameController,
                      MaterialCommunityIcons.account,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member cellphone*",
                      TextInputType.number,
                      phoneController,
                      MaterialCommunityIcons.phone,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member telephone number",
                      TextInputType.number,
                      telephoneController,
                      MaterialCommunityIcons.phone,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member email*",
                      TextInputType.emailAddress,
                      emailController,
                      MaterialCommunityIcons.email,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member address",
                      TextInputType.streetAddress,
                      addressController,
                      MaterialCommunityIcons.home,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member city*",
                      TextInputType.streetAddress,
                      cityController,
                      MaterialCommunityIcons.city,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member state*",
                      TextInputType.streetAddress,
                      stateController,
                      MaterialCommunityIcons.city,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member country*",
                      TextInputType.streetAddress,
                      countryController,
                      MaterialCommunityIcons.city,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member postal/zip",
                      TextInputType.number,
                      postalController,
                      MaterialCommunityIcons.numeric,
                    ),
                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter member license number",
                      TextInputType.text,
                      licenseNumController,
                      MaterialCommunityIcons.numeric,
                    ),
                    SizedBox(height: 15.h),
                    _buildDatePickerField(
                      label: 'License Expiry Date',
                      selectedDate: licExpiryDate,
                      onDateSelected: (date) {
                        setState(() {
                          licExpiryDate = date;
                        });
                      },
                    ),
                    SizedBox(height: 15.h),
                    _buildDatePickerField(
                      label: 'DOB',
                      selectedDate: dob,
                      onDateSelected: (date) {
                        setState(() {
                          dob = date;
                        });
                      },
                    ),
                    SizedBox(height: 15.h),

                    _buildDatePickerField(
                      label: 'Last drug test',
                      selectedDate: lastDrugTest,
                      onDateSelected: (date) {
                        setState(() {
                          lastDrugTest = date;
                        });
                      },
                    ),
                    SizedBox(height: 15.h),

                    _buildDatePickerField(
                      label: 'Date of hire',
                      selectedDate: dateOfHire,
                      onDateSelected: (date) {
                        setState(() {
                          dateOfHire = date;
                        });
                      },
                    ),

                    SizedBox(height: 15.h),

                    _buildDatePickerField(
                      label: 'Date of termination',
                      selectedDate: dateOfTermination,
                      onDateSelected: (date) {
                        setState(() {
                          dateOfTermination = date;
                        });
                      },
                    ),

                    SizedBox(height: 15.h),
                    buildTextFieldInputWidget(
                      "Enter social security number",
                      TextInputType.number,
                      socialSecurityController,
                      MaterialCommunityIcons.numeric,
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
                  ],
                )
              else
                Text("Firstly select a role"),
              SizedBox(height: 10.h),
              if (selectedRole != null &&
                  selectedRole != "Vendor" &&
                  selectedRole != "Other Staff" &&
                  selectedRole != "SubOwner") ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Assign Vehicles",
                      style: appStyle(16, Colors.black, FontWeight.bold),
                    ),

                    // Add the Select All/Deselect All button
                    if (vehicles.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            if (areAllVehiclesSelected) {
                              // Deselect all vehicles
                              selectedVehicles.clear();
                              areAllVehiclesSelected = false;
                            } else {
                              // Select all vehicles
                              selectedVehicles = vehicles
                                  .map((vehicle) => vehicle['id'] as String)
                                  .toList();
                              areAllVehiclesSelected = true;
                            }
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Text(
                            areAllVehiclesSelected
                                ? "Deselect All"
                                : "Select All",
                            style: appStyle(14, kPrimary, FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
                SizedBox(height: 15.h),
                Divider(),

                vehicles.isEmpty
                    ? Text("No Vehicles")
                    : Column(
                        children: vehicles.map((vehicle) {
                          return CheckboxListTile(
                            title: Text(
                                "${vehicle['vehicleNumber']} (${vehicle['companyName']})"),
                            value: selectedVehicles.contains(vehicle['id']),
                            onChanged: (bool? selected) {
                              setState(() {
                                if (selected == true) {
                                  selectedVehicles.add(vehicle['id']);
                                } else {
                                  selectedVehicles.remove(vehicle['id']);
                                }

                                // Update the "Select All" state
                                areAllVehiclesSelected =
                                    selectedVehicles.length == vehicles.length;
                              });
                            },
                          );
                        }).toList(),
                      ),

                SizedBox(height: 10.h),

                //record access
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
                            selectedRecordAccess
                                .add(recordAccess); // Add to list
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
              ],
              SizedBox(height: 15.h),
              if (selectedRole == "Manager" ||
                  selectedRole == "Accountant") ...[
                Column(
                  children: [
                    //cheque access
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
                  ],
                ),
              ],
              SizedBox(height: 10.h),
              if (selectedRole != null &&
                  selectedRole != "Vendor" &&
                  selectedRole != "Other Staff" &&
                  selectedRole != "SubOwner") ...[
                //payment type access
                Text(
                  "Assign Payment Type Access",
                  style: appStyle(16, Colors.black, FontWeight.bold),
                ),
                SizedBox(height: 10.h),
                Divider(),

                Padding(
                  padding: const EdgeInsets.only(left: 10, right: 10),
                  child: DropdownButtonFormField<String>(
                    hint: Text("Select Pay Type"),
                    value: selectedPayType,
                    onChanged: (String? newValue) {
                      setState(() {
                        selectedPayType = newValue;
                      });
                    },
                    items: payTypeModes.map((String payMode) {
                      return DropdownMenuItem<String>(
                        value: payMode,
                        child: Text(payMode),
                      );
                    }).toList(),
                  ),
                ),
              ],
              selectedRole == "Driver"
                  ? buildTextFieldInputWidget(
                      "Enter per mile charge",
                      TextInputType.streetAddress,
                      perMileChargeController,
                      Icons.money,
                    )
                  : Container(),
              SizedBox(height: 24.h),
              isUserAcCreated
                  ? CircularProgressIndicator()
                  : CustomButton(
                      text: "Add Member",
                      onPress: () async {
                        // Common required fields for all roles
                        if (nameController.text.isEmpty ||
                            emailController.text.isEmpty ||
                            phoneController.text.isEmpty ||
                            passController.text.isEmpty ||
                            selectedRole == null) {
                          showToastMessage("Error",
                              "Please fill all required fields", Colors.red);
                          return;
                        } else {
                          if (countryController.text.isEmpty ||
                              stateController.text.isEmpty ||
                              cityController.text.isEmpty) {
                            showToastMessage("Error",
                                "Please fill all required fields", Colors.red);
                            return;
                          }
                        }

                        // Additional validation for non-Vendor and non-SubOwner roles
                        if (selectedRole != "Vendor" &&
                            selectedRole != "SubOwner" &&
                            selectedRole != "Other Staff") {
                          if (selectedPayType == null) {
                            showToastMessage("Error",
                                "Please select a pay type", Colors.red);
                            return;
                          }

                          // Driver-specific validation
                          if (selectedRole == 'Driver' &&
                              selectedVehicles.isEmpty) {
                            showToastMessage(
                                "Error",
                                "Please assign at least one vehicle",
                                Colors.red);
                            return;
                          }
                        }

                        if (selectedRole == 'Driver' &&
                            selectedVehicles.isNotEmpty) {
                          List<Map<String, dynamic>> conflicts =
                              await checkVehicleConflicts(selectedVehicles);
                          if (conflicts.isNotEmpty) {
                            bool confirm = await showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title:
                                    const Text("Vehicle Assignment Conflict"),
                                content: SingleChildScrollView(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                          "The following vehicles are already assigned to other members:"),
                                      const SizedBox(height: 10),
                                      ...conflicts.map((conflict) => Padding(
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 4.0),
                                            child: Text(
                                              "- ${conflict['vehicle']['companyName']} (${conflict['vehicle']['vehicleNumber']}) is assigned to ${conflict['existingMember']}",
                                              style: const TextStyle(
                                                  color: Colors.red),
                                            ),
                                          )),
                                      const SizedBox(height: 20),
                                      const Text(
                                          "Are you sure you want to assign these vehicles to both drivers?"),
                                    ],
                                  ),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text("Cancel"),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text("Proceed"),
                                  ),
                                ],
                              ),
                            );

                            if (confirm != true) {
                              return;
                            }
                          }
                        }

                        // Show email confirmation dialog
                        bool confirmEmail = await showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text(
                              "Confirm Email Address",
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Please verify that ${emailController.text} is correct.",
                                  style: const TextStyle(fontSize: 14),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  "After creating this team member, you won't be able to change their email address. An invitation will be sent to this email for account activation.",
                                  style: TextStyle(fontSize: 14),
                                ),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text("Cancel",
                                    style: TextStyle(color: Colors.grey)),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text("Confirm",
                                    style: TextStyle(color: kPrimary)),
                              ),
                            ],
                          ),
                        );

                        if (confirmEmail == true) {
                          // Proceed with member creation
                          createMemberWithCloudFunction(
                            name: nameController.text,
                            email: emailController.text,
                            phone: phoneController.text,
                            password: passController.text,
                            currentUId: widget.currentUId,
                            selectedRole: selectedRole!,
                            selectedPayType: selectedPayType ?? "",
                            selectedVehicles: selectedVehicles,
                            perMileCharge: perMileChargeController.text,
                            selectedRecordAccess: selectedRecordAccess,
                            selectedChequeAccess: selectedChequeAccess,
                          );
                        }
                      },
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
        buildTextFieldInputWidget(
          selectedRole == "Other Staff" ? "Name*" : "Name* / company name*",
          TextInputType.text,
          nameController,
          MaterialCommunityIcons.account,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Cell Phone*",
          TextInputType.phone,
          phoneController,
          MaterialCommunityIcons.phone,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Telephone",
          TextInputType.phone,
          telephoneController,
          MaterialCommunityIcons.phone,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Email*",
          TextInputType.emailAddress,
          emailController,
          MaterialCommunityIcons.email,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Email 2",
          TextInputType.emailAddress,
          email2Controller,
          MaterialCommunityIcons.email,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Address*",
          TextInputType.streetAddress,
          addressController,
          MaterialCommunityIcons.home,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "City*",
          TextInputType.text,
          cityController,
          MaterialCommunityIcons.city,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "State*",
          TextInputType.text,
          stateController,
          MaterialCommunityIcons.city,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Country*",
          TextInputType.text,
          countryController,
          MaterialCommunityIcons.earth,
        ),
        SizedBox(height: 15.h),
        buildTextFieldInputWidget(
          "Postal/Zip*",
          TextInputType.number,
          postalController,
          MaterialCommunityIcons.numeric,
        ),
        SizedBox(height: 15.h),
      ],
    );
  }

  Widget _buildDatePickerField({
    required String label,
    required DateTime? selectedDate,
    required Function(DateTime?) onDateSelected,
  }) {
    return GestureDetector(
      onTap: () async {
        final DateTime? picked = await showDatePicker(
          context: context,
          initialDate: selectedDate ?? DateTime.now(),
          firstDate: DateTime(1900),
          lastDate: DateTime(2100),
        );
        if (picked != null && picked != selectedDate) {
          onDateSelected(picked);
        }
      },
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

  Future<void> createMemberWithCloudFunction({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String currentUId,
    required String selectedRole,
    required String selectedPayType,
    required List<String> selectedVehicles,
    required String perMileCharge,
    required List<String> selectedRecordAccess,
    required List<String> selectedChequeAccess,
  }) async {
    setState(() {
      isUserAcCreated = true;
    });

    try {
      HttpsCallable callable =
          FirebaseFunctions.instance.httpsCallable('createTeamMember');
      final result = await callable.call({
        'name': name,
        'email': email,
        "email2": email2Controller.text,
        // 'companyName': companyController.text,
        'companyName': '',
        'phone': phone,
        'telephone': telephoneController.text,
        'address': addressController.text,
        'city': cityController.text,
        'state': stateController.text,
        'country': countryController.text,
        'postal': postalController.text,
        'licenseNum': licenseNumController.text,
        'socialSecurity': socialSecurityController.text,
        'password': password,
        'currentUId': currentUId,
        'selectedRole': selectedRole,
        'selectedPayType': selectedPayType,
        'selectedVehicles': selectedVehicles,
        'perMileCharge': perMileCharge,
        'selectedRecordAccess': selectedRecordAccess,
        'selectedChequeAccess': selectedChequeAccess,
        'licExpiryDate': licExpiryDate?.toIso8601String(),
        'dob': dob?.toIso8601String(),
        'lastDrugTest': lastDrugTest?.toIso8601String(),
        'dateOfHire': dateOfHire?.toIso8601String(),
        'dateOfTermination': dateOfTermination?.toIso8601String(),
        'currentDeviceId': null,
        // 'lastLogin': FieldValue.serverTimestamp(),
        'createdFrom': Platform.isAndroid ? 'android' : 'ios',
      });

      if (result.data['success']) {
        showToastMessage("Success", "Team Member Created ", kSecondary);
        // Clear all controllers
        nameController.clear();
        emailController.clear();
        phoneController.clear();
        telephoneController.clear();
        addressController.clear();
        cityController.clear();
        stateController.clear();
        countryController.clear();
        postalController.clear();
        licenseNumController.clear();
        socialSecurityController.clear();
        passController.clear();
        perMileChargeController.clear();
        selectedVehicles.clear();
        selectedRole = "";
        selectedRecordAccess.clear();
        licExpiryDate = null;
        dob = null;
        lastDrugTest = null;
        dateOfHire = null;
        dateOfTermination = null;

        setState(() {});

        Get.off(() => MyTeamScreen());
      }
    } catch (e) {
      showToastMessage("Error", "Email Id Already exists", Colors.red);
    } finally {
      setState(() {
        isUserAcCreated = false;
      });
    }
  }

  Future<List<Map<String, dynamic>>> checkVehicleConflicts(
      List<String> selectedVehicleIds) async {
    List<Map<String, dynamic>> conflicts = [];
    String ownerId = widget.currentUId;

    // Fetch all team members
    QuerySnapshot teamMembers = await FirebaseFirestore.instance
        .collection('Users')
        .where('createdBy', isEqualTo: ownerId)
        .where('isTeamMember', isEqualTo: true)
        .get();

    for (var member in teamMembers.docs) {
      String memberId = member.id;
      String memberName = member['userName'] ?? 'Unknown';

      // Fetch vehicles assigned to this team member
      QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(memberId)
          .collection('Vehicles')
          .get();

      for (var vehicle in vehicleSnapshot.docs) {
        String vehicleId = vehicle.id;
        if (selectedVehicleIds.contains(vehicleId)) {
          conflicts.add({
            'vehicle': {
              'companyName': vehicle['companyName'] ?? 'Unknown Company',
              'vehicleNumber': vehicle['vehicleNumber'] ?? 'Unknown Number',
            },
            'existingMember': memberName,
          });
        }
      }
    }

    return conflicts; // Return conflicts if any exist
  }

  void handleError(FirebaseFunctionsException e) {
    String errorMessage = e.message ?? "An unknown error occurred.";
    if (e.code == 'already-exists') {
      errorMessage = "A user with this email already exists.";
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
    telephoneController.dispose();
    addressController.dispose();
    email2Controller.dispose();
    // companyController.dispose();
    cityController.dispose();
    stateController.dispose();
    postalController.dispose();
    countryController.dispose();
    licenseNumController.dispose();
    socialSecurityController.dispose();
    dob = null;
    lastDrugTest = null;
    dateOfHire = null;
    dateOfTermination = null;
    selectedVehicles.clear();
  }
}
