import "dart:developer";
import "package:cloud_firestore/cloud_firestore.dart";
import "package:firebase_auth/firebase_auth.dart";
import "package:flutter/material.dart";
import "package:flutter_screenutil/flutter_screenutil.dart";
import "package:flutter_vector_icons/flutter_vector_icons.dart";
import "package:get/get.dart";
import "package:regal_service_d_app/utils/app_styles.dart";
import "package:regal_service_d_app/utils/constants.dart";
import "package:regal_service_d_app/utils/show_toast_msg.dart";
import "package:regal_service_d_app/widgets/custom_button.dart";
import "package:regal_service_d_app/widgets/reusable_text.dart";

class MyCompaniesScreen extends StatefulWidget {
  final String? currentUId;
  final String? role;
  const MyCompaniesScreen({super.key, this.currentUId, this.role});

  @override
  State<MyCompaniesScreen> createState() => _MyCompaniesScreenState();
}

class _MyCompaniesScreenState extends State<MyCompaniesScreen> {
  late String currentUId;
  String? _currentUserRole;
  String? _ownerId;
  String? _actualUserUid;

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Form Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dotController = TextEditingController();
  final TextEditingController _mcController = TextEditingController();
  final TextEditingController _nscController = TextEditingController();
  final TextEditingController _cvorController = TextEditingController();
  final TextEditingController _nirController = TextEditingController();
  final TextEditingController _cbsaController = TextEditingController();
  final TextEditingController _rfcController = TextEditingController();
  final TextEditingController _ftpController = TextEditingController();
  final TextEditingController _volnController = TextEditingController();
  final TextEditingController _abnController = TextEditingController();
  final TextEditingController _hvaController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
  final GlobalKey<FormState> _dialogFormKey = GlobalKey<FormState>();

  static const List<String> _countries = [
    "USA",
    "Canada",
    "Mexico",
    "UK",
    "Australia",
  ];

  String? _normalizeCountry(String country) {
    if (country.trim().isEmpty) return null;
    final lower = country.trim().toLowerCase();
    if (lower == 'usa' || lower == 'us' || lower == 'united states')
      return 'USA';
    if (lower == 'canada' || lower == 'ca') return 'Canada';
    if (lower == 'mexico' || lower == 'mx') return 'Mexico';
    if (lower == 'uk' ||
        lower == 'england' ||
        lower == 'united kingdom' ||
        lower == 'great britain' ||
        lower == 'gb') return 'UK';
    if (lower == 'australia' || lower == 'au') return 'Australia';
    if (_countries.contains(country)) return country;
    return 'USA';
  }

  bool _isDefaultCompany = false;
  bool _isActiveCompany = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final loggedUid = FirebaseAuth.instance.currentUser?.uid ?? '';
    _actualUserUid = loggedUid;
    currentUId = widget.currentUId ?? loggedUid;
    _currentUserRole = widget.role;
    _resolveEffectiveUserId();
  }

  Future<void> _resolveEffectiveUserId() async {
    try {
      final loggedUid =
          _actualUserUid ?? FirebaseAuth.instance.currentUser?.uid ?? '';
      if (loggedUid.isEmpty) return;

      DocumentSnapshot userDoc =
          await _firestore.collection('Users').doc(loggedUid).get();
      if (userDoc.exists) {
        final data = userDoc.data() as Map<String, dynamic>?;
        if (data != null) {
          final fetchedRole = data['role']?.toString();
          final createdBy = data['createdBy']?.toString().trim();

          if (mounted) {
            setState(() {
              if (_currentUserRole == null || _currentUserRole!.isEmpty) {
                _currentUserRole = fetchedRole;
              }
              if (createdBy != null && createdBy.isNotEmpty) {
                _ownerId = createdBy;
                currentUId = createdBy;
              } else {
                _ownerId = loggedUid;
                currentUId = loggedUid;
              }
            });
          } else {
            if (_currentUserRole == null || _currentUserRole!.isEmpty) {
              _currentUserRole = fetchedRole;
            }
            if (createdBy != null && createdBy.isNotEmpty) {
              _ownerId = createdBy;
              currentUId = createdBy;
            } else {
              _ownerId = loggedUid;
              currentUId = loggedUid;
            }
          }
        }
      }
    } catch (e) {
      log("Error resolving effective user in MyCompaniesScreen: $e");
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dotController.dispose();
    _mcController.dispose();
    _nscController.dispose();
    _cvorController.dispose();
    _nirController.dispose();
    _cbsaController.dispose();
    _rfcController.dispose();
    _ftpController.dispose();
    _volnController.dispose();
    _abnController.dispose();
    _hvaController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  void _clearControllers() {
    _nameController.clear();
    _dotController.clear();
    _mcController.clear();
    _nscController.clear();
    _cvorController.clear();
    _nirController.clear();
    _cbsaController.clear();
    _rfcController.clear();
    _ftpController.clear();
    _volnController.clear();
    _abnController.clear();
    _hvaController.clear();
    _addressController.clear();
    _cityController.clear();
    _stateController.clear();
    _countryController.text = "USA";
    _isDefaultCompany = false;
    _isActiveCompany = true;
  }

  // Open Bottom Sheet Form to Add or Edit Company
  void _openCompanyFormDialog({
    String? companyId,
    Map<String, dynamic>? initialData,
  }) {
    final bool isEditing = companyId != null && initialData != null;

    if (isEditing) {
      _nameController.text =
          (initialData["companyName"] ?? initialData["name"] ?? "").toString();
      _dotController.text = (initialData["dot"] ?? "").toString();
      _mcController.text = (initialData["mc"] ?? "").toString();
      _nscController.text = (initialData["nsc"] ?? "").toString();
      _cvorController.text = (initialData["cvor"] ?? "").toString();
      _nirController.text = (initialData["nir"] ?? "").toString();
      _cbsaController.text = (initialData["cbsa"] ?? "").toString();
      _rfcController.text = (initialData["rfc"] ?? "").toString();
      _ftpController.text = (initialData["ftp"] ?? "").toString();
      _volnController.text = (initialData["voln"] ?? "").toString();
      _abnController.text = (initialData["abn"] ?? "").toString();
      _hvaController.text = (initialData["hva"] ?? "").toString();
      _addressController.text = (initialData["address"] ?? "").toString();
      _cityController.text = (initialData["city"] ?? "").toString();
      _stateController.text = (initialData["state"] ?? "").toString();
      final rawCountry = (initialData["country"] ?? "USA").toString();
      _countryController.text = _normalizeCountry(rawCountry) ?? "USA";
      _isDefaultCompany = initialData["isDefault"] == true;
      _isActiveCompany = initialData["isActive"] != false;
    } else {
      _clearControllers();
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.88,
              ),
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
                  child: Form(
                    key: _dialogFormKey,
                    child: SingleChildScrollView(
                      physics: const ClampingScrollPhysics(),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Drag Handle
                          Center(
                            child: Container(
                              width: 40.w,
                              height: 4.h,
                              margin: EdgeInsets.only(bottom: 16.h),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),

                          // Title
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                isEditing ? "Edit Company" : "Add New Company",
                                style: appStyle(18, kDark, FontWeight.bold),
                              ),
                              IconButton(
                                onPressed: () => Navigator.pop(context),
                                icon: const Icon(Icons.close, color: kGray),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ),
                          SizedBox(height: 16.h),

                          // Company Name Field
                          _buildInputField(
                            controller: _nameController,
                            label: "Company Name*",
                            hint: "Enter company name",
                            icon: MaterialCommunityIcons.office_building,
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return "Company name is required";
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 12.h),

                          // Country Dropdown
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Country*",
                                style: appStyle(13, kDark, FontWeight.w600),
                              ),
                              SizedBox(height: 6.h),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                value: _normalizeCountry(
                                        _countryController.text) ??
                                    "USA",
                                hint: Text(
                                  "Select country",
                                  style: appStyle(13, kGray, FontWeight.normal),
                                ),
                                decoration: InputDecoration(
                                  prefixIcon: Icon(MaterialCommunityIcons.earth,
                                      size: 18.sp, color: kPrimary),
                                  filled: true,
                                  fillColor: kLightWhite,
                                  contentPadding: EdgeInsets.symmetric(
                                      horizontal: 12.w, vertical: 10.h),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.r),
                                    borderSide:
                                        BorderSide(color: Colors.grey.shade200),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.r),
                                    borderSide:
                                        BorderSide(color: Colors.grey.shade200),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12.r),
                                    borderSide: const BorderSide(
                                        color: kPrimary, width: 1.5),
                                  ),
                                ),
                                items: _countries.map((String country) {
                                  return DropdownMenuItem<String>(
                                    value: country,
                                    child: Text(
                                      country,
                                      style: appStyle(
                                          14, kDark, FontWeight.normal),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (String? val) {
                                  setModalState(() {
                                    _countryController.text = val ?? "USA";
                                  });
                                },
                                validator: (val) {
                                  if (val == null || val.trim().isEmpty) {
                                    return "Country is required";
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                          SizedBox(height: 12.h),

                          // Country-Specific Registration Fields
                          _buildDialogCountryFields(),

                          // Address Field
                          _buildInputField(
                            controller: _addressController,
                            label: "Address*",
                            hint: "Enter street address",
                            icon: MaterialCommunityIcons.home_outline,
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return "Address is required";
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 12.h),

                          // City & State in Row
                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _cityController,
                                  label: "City*",
                                  hint: "Enter city",
                                  icon: MaterialCommunityIcons.city,
                                  validator: (val) {
                                    if (val == null || val.trim().isEmpty) {
                                      return "City is required";
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: _buildInputField(
                                  controller: _stateController,
                                  label: "State*",
                                  hint: "Enter state",
                                  icon: MaterialCommunityIcons.home_account,
                                  validator: (val) {
                                    if (val == null || val.trim().isEmpty) {
                                      return "State is required";
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 14.h),

                          // Active / Inactive Switch
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 8.h),
                            decoration: BoxDecoration(
                              color: kLightWhite,
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Active Status",
                                      style:
                                          appStyle(14, kDark, FontWeight.w600),
                                    ),
                                    Text(
                                      _isActiveCompany
                                          ? "Company is operational & active"
                                          : "Company is closed / inactive",
                                      style: appStyle(
                                          11,
                                          _isActiveCompany
                                              ? Colors.green.shade700
                                              : kGray,
                                          FontWeight.normal),
                                    ),
                                  ],
                                ),
                                Switch(
                                  value: _isActiveCompany,
                                  activeColor: Colors.green,
                                  onChanged: (val) {
                                    setModalState(() {
                                      _isActiveCompany = val;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 10.h),

                          // Default Switch
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 8.h),
                            decoration: BoxDecoration(
                              color: kLightWhite,
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Set as Default Company",
                                      style:
                                          appStyle(14, kDark, FontWeight.w600),
                                    ),
                                    Text(
                                      "Use for primary dispatch & profile",
                                      style: appStyle(
                                          11, kGray, FontWeight.normal),
                                    ),
                                  ],
                                ),
                                Switch(
                                  value: _isDefaultCompany,
                                  activeColor: kPrimary,
                                  onChanged: (val) {
                                    setModalState(() {
                                      _isDefaultCompany = val;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 20.h),

                          // Save Button
                          CustomButton(
                            text: _isSubmitting
                                ? "Saving..."
                                : (isEditing
                                    ? "Update Company"
                                    : "Save Company"),
                            onPress: _isSubmitting
                                ? null
                                : () async {
                                    if (_dialogFormKey.currentState!
                                        .validate()) {
                                      setModalState(() => _isSubmitting = true);
                                      await _saveCompanyToFirestore(
                                        companyId: companyId,
                                        isEditing: isEditing,
                                      );
                                      setModalState(
                                          () => _isSubmitting = false);
                                      if (mounted) Navigator.pop(context);
                                    }
                                  },
                            color: kPrimary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // Save / Update Firestore
  Future<void> _saveCompanyToFirestore({
    String? companyId,
    required bool isEditing,
  }) async {
    final String name = _nameController.text.trim();
    final String dot = _dotController.text.trim();
    final String mc = _mcController.text.trim();
    final String nsc = _nscController.text.trim();
    final String cvor = _cvorController.text.trim();
    final String nir = _nirController.text.trim();
    final String cbsa = _cbsaController.text.trim();
    final String rfc = _rfcController.text.trim();
    final String ftp = _ftpController.text.trim();
    final String voln = _volnController.text.trim();
    final String abn = _abnController.text.trim();
    final String hva = _hvaController.text.trim();
    final String address = _addressController.text.trim();
    final String city = _cityController.text.trim();
    final String state = _stateController.text.trim();
    final String country = _normalizeCountry(_countryController.text) ??
        _countryController.text.trim();

    try {
      final companiesRef = _firestore
          .collection("Users")
          .doc(currentUId)
          .collection("myCompanies");

      // Check if this is the first company being added
      final existingCompanies = await companiesRef.get();
      final bool isFirstCompany = existingCompanies.docs.isEmpty;
      final bool makeDefault = _isDefaultCompany || isFirstCompany;

      // If this company is default, unmark other companies
      if (makeDefault) {
        final batch = _firestore.batch();
        for (var doc in existingCompanies.docs) {
          if (doc.id != companyId) {
            batch.update(doc.reference, {"isDefault": false});
          }
        }
        await batch.commit();
      }

      final Map<String, dynamic> companyData = {
        "companyName": name,
        "dot": dot,
        "mc": mc,
        "nsc": nsc,
        "cvor": cvor,
        "nir": nir,
        "cbsa": cbsa,
        "rfc": rfc,
        "ftp": ftp,
        "voln": voln,
        "abn": abn,
        "hva": hva,
        "address": address,
        "city": city,
        "state": state,
        "country": country,
        "isDefault": makeDefault,
        "isActive": _isActiveCompany,
        "updated_at": FieldValue.serverTimestamp(),
      };

      if (isEditing && companyId != null) {
        await companiesRef.doc(companyId).update(companyData);
        showToastMessage("Success", "Company updated successfully", kPrimary);
      } else {
        companyData["created_at"] = FieldValue.serverTimestamp();
        await companiesRef.add(companyData);
        showToastMessage("Success", "Company added successfully", kPrimary);
      }

      // If this is the default company, also sync with main Users document
      if (makeDefault) {
        await _firestore.collection("Users").doc(currentUId).update({
          "companyName": name,
          "dot": dot,
          "mc": mc,
          "nsc": nsc,
          "cvor": cvor,
          "nir": nir,
          "cbsa": cbsa,
          "rfc": rfc,
          "ftp": ftp,
          "voln": voln,
          "abn": abn,
          "hva": hva,
          "address": address,
          "city": city,
          "state": state,
          "country": country,
          "updated_at": DateTime.now(),
        });
      }
    } catch (e) {
      log("Error saving company: $e");
      showToastMessage("Error", "Failed to save company: $e", Colors.red);
    }
  }

  // Toggle Company Active / Closed Status
  Future<void> _toggleCompanyStatus(
      String companyId, bool currentStatus) async {
    try {
      final bool newStatus = !currentStatus;
      await _firestore
          .collection("Users")
          .doc(currentUId)
          .collection("myCompanies")
          .doc(companyId)
          .update({
        "isActive": newStatus,
        "updated_at": FieldValue.serverTimestamp(),
      });

      showToastMessage(
          "Success",
          newStatus
              ? "Company marked as Active"
              : "Company marked as Closed / Inactive",
          newStatus ? kPrimary : kGray);
    } catch (e) {
      log("Error toggling company status: $e");
      showToastMessage("Error", "Failed to update company status", Colors.red);
    }
  }

  // Set Company as Default
  Future<void> _setAsDefault(
      String companyId, Map<String, dynamic> companyData) async {
    try {
      final companiesRef = _firestore
          .collection("Users")
          .doc(currentUId)
          .collection("myCompanies");

      final allDocs = await companiesRef.get();
      final batch = _firestore.batch();

      for (var doc in allDocs.docs) {
        batch.update(doc.reference, {"isDefault": doc.id == companyId});
      }
      await batch.commit();

      // Sync with main Users document
      await _firestore.collection("Users").doc(currentUId).update({
        "companyName": companyData["companyName"] ?? "",
        "dot": companyData["dot"] ?? "",
        "mc": companyData["mc"] ?? "",
        "nsc": companyData["nsc"] ?? "",
        "cvor": companyData["cvor"] ?? "",
        "nir": companyData["nir"] ?? "",
        "cbsa": companyData["cbsa"] ?? "",
        "rfc": companyData["rfc"] ?? "",
        "ftp": companyData["ftp"] ?? "",
        "voln": companyData["voln"] ?? "",
        "abn": companyData["abn"] ?? "",
        "hva": companyData["hva"] ?? "",
        "address": companyData["address"] ?? "",
        "city": companyData["city"] ?? "",
        "state": companyData["state"] ?? "",
        "country": companyData["country"] ?? "",
        "updated_at": DateTime.now(),
      });

      showToastMessage("Success",
          "${companyData["companyName"]} set as default company", kPrimary);
    } catch (e) {
      log("Error setting default company: $e");
      showToastMessage("Error", "Failed to set default company", Colors.red);
    }
  }

  Widget _buildDialogCountryFields() {
    final String normalized =
        _normalizeCountry(_countryController.text) ?? "USA";

    if (normalized == "Canada") {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _nscController,
                  label: "NSC (Optional)",
                  hint: "e.g. 123456789",
                  icon: MaterialCommunityIcons.card_bulleted_outline,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildInputField(
                  controller: _cvorController,
                  label: "CVOR (Optional)",
                  hint: "e.g. 123-456-789",
                  icon: MaterialCommunityIcons.card_text_outline,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _nirController,
                  label: "NIR (Optional)",
                  hint: "e.g. R-123456-7",
                  icon: MaterialCommunityIcons.card_account_details_outline,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildInputField(
                  controller: _cbsaController,
                  label: "CBSA (Optional)",
                  hint: "e.g. 12345",
                  icon: MaterialCommunityIcons.shield_check_outline,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
        ],
      );
    } else if (normalized == "Mexico") {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _rfcController,
                  label: "RFC (Optional)",
                  hint: "e.g. ABCD123456XYZ",
                  icon: MaterialCommunityIcons.card_bulleted_outline,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildInputField(
                  controller: _ftpController,
                  label: "FTP (Optional)",
                  hint: "e.g. 123456",
                  icon: MaterialCommunityIcons.card_text_outline,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
        ],
      );
    } else if (normalized == "UK") {
      return Column(
        children: [
          _buildInputField(
            controller: _volnController,
            label: "VOLN (Optional)",
            hint: "e.g. OD1234567",
            icon: MaterialCommunityIcons.card_bulleted_outline,
          ),
          SizedBox(height: 12.h),
        ],
      );
    } else if (normalized == "Australia") {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _abnController,
                  label: "ABN (Optional)",
                  hint: "e.g. 12 345 678 901",
                  icon: MaterialCommunityIcons.card_bulleted_outline,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildInputField(
                  controller: _hvaController,
                  label: "HVA (Optional)",
                  hint: "e.g. 123456",
                  icon: MaterialCommunityIcons.card_text_outline,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
        ],
      );
    } else {
      // Default to USA (DOT, MC)
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _dotController,
                  label: "DOT (Optional)",
                  hint: "e.g. 1234567",
                  icon: MaterialCommunityIcons.card_bulleted_outline,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildInputField(
                  controller: _mcController,
                  label: "MC (Optional)",
                  hint: "e.g. 987654",
                  icon: MaterialCommunityIcons.card_text_outline,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
        ],
      );
    }
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    String? Function(String?)? validator,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: appStyle(13, kDark, FontWeight.w600),
        ),
        SizedBox(height: 6.h),
        TextFormField(
          controller: controller,
          validator: validator,
          textCapitalization: textCapitalization,
          style: appStyle(14, kDark, FontWeight.normal),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: appStyle(13, kGray, FontWeight.normal),
            prefixIcon: Icon(icon, size: 18.sp, color: kPrimary),
            filled: true,
            fillColor: kLightWhite,
            contentPadding:
                EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: kPrimary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveRole = _currentUserRole ?? widget.role;
    final isAllow = effectiveRole == "Owner" || effectiveRole == "SubOwner";
    final isStaff = effectiveRole == "Manager" || effectiveRole == "Accountant";

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: kDark, size: 18),
          onPressed: () => Get.back(),
        ),
        title: ReusableText(
          text: isStaff ? "Assigned Companies" : "My Companies",
          style: appStyle(18, kDark, FontWeight.bold),
        ),
        actions: isAllow
            ? [
                IconButton(
                  icon: const Icon(Icons.add_circle, color: kPrimary, size: 28),
                  onPressed: () => _openCompanyFormDialog(),
                  tooltip: "Add Company",
                ),
                SizedBox(width: 8.w),
              ]
            : [],
      ),
      body: isStaff
          ? _buildStaffCompaniesView()
          : _buildOwnerCompaniesView(isAllow),
      floatingActionButton: isAllow
          ? FloatingActionButton.extended(
              onPressed: () => _openCompanyFormDialog(),
              backgroundColor: kPrimary,
              icon: const Icon(Icons.add, color: Colors.white),
              label: Text(
                "Add Company",
                style: appStyle(14, Colors.white, FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildOwnerCompaniesView(bool isAllow) {
    return currentUId.isEmpty
        ? const Center(child: CircularProgressIndicator(color: kPrimary))
        : StreamBuilder<QuerySnapshot>(
            stream: _firestore
                .collection("Users")
                .doc(currentUId)
                .collection("myCompanies")
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                    child: CircularProgressIndicator(color: kPrimary));
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 30.w),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: EdgeInsets.all(20.w),
                          decoration: BoxDecoration(
                            color: kPrimary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            MaterialCommunityIcons.domain,
                            size: 60.sp,
                            color: kPrimary,
                          ),
                        ),
                        SizedBox(height: 20.h),
                        Text(
                          "No Companies Added Yet",
                          style: appStyle(18, kDark, FontWeight.bold),
                        ),
                        SizedBox(height: 8.h),
                        Text(
                          "Add your company profile with DOT, MC, and address details to manage them easily.",
                          textAlign: TextAlign.center,
                          style: appStyle(13, kGray, FontWeight.normal),
                        ),
                        if (isAllow) ...[
                          SizedBox(height: 24.h),
                          ElevatedButton.icon(
                            onPressed: () => _openCompanyFormDialog(),
                            icon: const Icon(Icons.add, color: Colors.white),
                            label: Text(
                              "Add Company",
                              style:
                                  appStyle(14, Colors.white, FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kPrimary,
                              padding: EdgeInsets.symmetric(
                                  horizontal: 24.w, vertical: 12.h),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }

              final companyDocs = snapshot.data!.docs;

              return ListView.separated(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
                itemCount: companyDocs.length,
                separatorBuilder: (_, __) => SizedBox(height: 12.h),
                itemBuilder: (context, index) {
                  final doc = companyDocs[index];
                  final data = doc.data() as Map<String, dynamic>;
                  return _buildCompanyCard(
                    docId: doc.id,
                    data: data,
                    isAllow: isAllow,
                  );
                },
              );
            },
          );
  }

  Widget _buildStaffCompaniesView() {
    final staffUid =
        _actualUserUid ?? FirebaseAuth.instance.currentUser?.uid ?? '';
    if (staffUid.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
    }

    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection("Users")
          .doc(staffUid)
          .collection("Vehicles")
          .snapshots(),
      builder: (context, vehicleSnapshot) {
        if (vehicleSnapshot.connectionState == ConnectionState.waiting) {
          return const Center(
              child: CircularProgressIndicator(color: kPrimary));
        }

        final vehicleDocs = vehicleSnapshot.data?.docs ?? [];
        if (vehicleDocs.isEmpty) {
          return Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 30.w),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: EdgeInsets.all(20.w),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      MaterialCommunityIcons.truck_outline,
                      size: 60.sp,
                      color: Colors.blue,
                    ),
                  ),
                  SizedBox(height: 20.h),
                  Text(
                    "No Vehicles Assigned",
                    style: appStyle(18, kDark, FontWeight.bold),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    "There are currently no vehicles assigned to your account. Companies associated with your assigned vehicles will appear here.",
                    textAlign: TextAlign.center,
                    style: appStyle(13, kGray, FontWeight.normal),
                  ),
                ],
              ),
            ),
          );
        }

        // Group assigned vehicles by company name
        // Key: Normalized company name
        // Value: Map containing companyName, companyId (if any), list of vehicle numbers
        final Map<String, Map<String, dynamic>> companyGroups = {};

        for (var vDoc in vehicleDocs) {
          final vData = vDoc.data() as Map<String, dynamic>;
          final rawMyCompany = (vData['myCompany'] ?? '').toString().trim();
          final rawComId = (vData['mycomId'] ?? '').toString().trim();
          final fallbackCompany =
              (vData['companyName'] ?? '').toString().trim();
          final vehicleNum = (vData['vehicleNumber'] ?? '').toString().trim();

          final resolvedCompName = rawMyCompany.isNotEmpty
              ? rawMyCompany
              : (fallbackCompany.isNotEmpty
                  ? fallbackCompany
                  : 'Assigned Company');

          final groupKey = resolvedCompName.toLowerCase();

          if (!companyGroups.containsKey(groupKey)) {
            companyGroups[groupKey] = {
              'companyName': resolvedCompName,
              'companyId': rawComId,
              'vehicles': <String>[],
            };
          }

          if (vehicleNum.isNotEmpty) {
            final List<String> vList = companyGroups[groupKey]!['vehicles'];
            if (!vList.contains(vehicleNum)) {
              vList.add(vehicleNum);
            }
          }
        }

        final ownerUid = _ownerId ?? currentUId;

        // Fetch owner's myCompanies to enrich details (DOT, MC, address, etc.)
        return StreamBuilder<QuerySnapshot>(
          stream: ownerUid.isNotEmpty
              ? _firestore
                  .collection("Users")
                  .doc(ownerUid)
                  .collection("myCompanies")
                  .snapshots()
              : const Stream.empty(),
          builder: (context, ownerCompSnapshot) {
            final ownerCompanies = ownerCompSnapshot.data?.docs ?? [];
            final groupsList = companyGroups.values.toList();

            return ListView.separated(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
              itemCount: groupsList.length,
              separatorBuilder: (_, __) => SizedBox(height: 12.h),
              itemBuilder: (context, index) {
                final group = groupsList[index];
                final String compName = group['companyName'];
                final String compId = group['companyId'] ?? '';
                final List<String> assignedVehicles =
                    List<String>.from(group['vehicles'] ?? []);

                // Find matching company document from owner if available
                Map<String, dynamic> enrichedData = {
                  'companyName': compName,
                  'isActive': true,
                };

                for (var oDoc in ownerCompanies) {
                  final oData = oDoc.data() as Map<String, dynamic>;
                  final oName =
                      (oData['companyName'] ?? oData['name'] ?? '').toString();
                  if ((compId.isNotEmpty && oDoc.id == compId) ||
                      oName.trim().toLowerCase() ==
                          compName.trim().toLowerCase()) {
                    enrichedData = Map<String, dynamic>.from(oData);
                    enrichedData['companyName'] =
                        oName.isNotEmpty ? oName : compName;
                    break;
                  }
                }

                return _buildCompanyCard(
                  docId: compId.isNotEmpty ? compId : 'staff_$index',
                  data: enrichedData,
                  isAllow: false, // Read-only for staff
                  assignedVehicles: assignedVehicles,
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildCompanyCard({
    required String docId,
    required Map<String, dynamic> data,
    required bool isAllow,
    List<String> assignedVehicles = const [],
  }) {
    final String name =
        (data["companyName"] ?? data["name"] ?? "Unnamed Company").toString();
    final String dot = (data["dot"] ?? "").toString();
    final String mc = (data["mc"] ?? "").toString();
    final String nsc = (data["nsc"] ?? "").toString();
    final String cvor = (data["cvor"] ?? "").toString();
    final String nir = (data["nir"] ?? "").toString();
    final String cbsa = (data["cbsa"] ?? "").toString();
    final String rfc = (data["rfc"] ?? "").toString();
    final String ftp = (data["ftp"] ?? "").toString();
    final String voln = (data["voln"] ?? "").toString();
    final String abn = (data["abn"] ?? "").toString();
    final String hva = (data["hva"] ?? "").toString();
    final String address = (data["address"] ?? "").toString();
    final String city = (data["city"] ?? "").toString();
    final String state = (data["state"] ?? "").toString();
    final String country = (data["country"] ?? "").toString();
    final bool isDefault = data["isDefault"] == true;
    final bool isActive = data["isActive"] != false;

    // Build address string
    final List<String> addressParts = [
      if (address.isNotEmpty) address,
      if (city.isNotEmpty) city,
      if (state.isNotEmpty) state,
      if (country.isNotEmpty) country,
    ];
    final String fullAddress = addressParts.join(", ");

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(
          color: isDefault ? kPrimary.withOpacity(0.6) : Colors.grey.shade200,
          width: isDefault ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Icon + Name + Default/Active Badges + Menu
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: EdgeInsets.all(10.w),
                  decoration: BoxDecoration(
                    color: isDefault
                        ? kPrimary.withOpacity(0.12)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(
                    MaterialCommunityIcons.office_building,
                    color: isDefault ? kPrimary : kDark,
                    size: 24.sp,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: appStyle(16, kDark, FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 8.w, vertical: 3.h),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? Colors.green.withOpacity(0.12)
                                  : Colors.orange.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20.r),
                              border: Border.all(
                                  color: isActive
                                      ? Colors.green.withOpacity(0.4)
                                      : Colors.orange.withOpacity(0.4)),
                            ),
                            child: Text(
                              isActive ? "Active" : "Closed",
                              style: appStyle(
                                  11,
                                  isActive
                                      ? Colors.green.shade700
                                      : Colors.orange.shade800,
                                  FontWeight.bold),
                            ),
                          ),
                          if (isDefault) ...[
                            SizedBox(width: 6.w),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8.w, vertical: 3.h),
                              decoration: BoxDecoration(
                                color: kPrimary.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(20.r),
                                border: Border.all(
                                    color: kPrimary.withOpacity(0.4)),
                              ),
                              child: Text(
                                "Default",
                                style: appStyle(11, kPrimary, FontWeight.bold),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (country.isNotEmpty ||
                          dot.isNotEmpty ||
                          mc.isNotEmpty ||
                          nsc.isNotEmpty ||
                          cvor.isNotEmpty ||
                          nir.isNotEmpty ||
                          cbsa.isNotEmpty ||
                          rfc.isNotEmpty ||
                          ftp.isNotEmpty ||
                          voln.isNotEmpty ||
                          abn.isNotEmpty ||
                          hva.isNotEmpty) ...[
                        SizedBox(height: 6.h),
                        Wrap(
                          spacing: 8.w,
                          runSpacing: 4.h,
                          children: [
                            if (country.isNotEmpty) _buildInfoBadge(country),
                            if (dot.isNotEmpty) _buildInfoBadge("DOT: $dot"),
                            if (mc.isNotEmpty) _buildInfoBadge("MC: $mc"),
                            if (nsc.isNotEmpty) _buildInfoBadge("NSC: $nsc"),
                            if (cvor.isNotEmpty) _buildInfoBadge("CVOR: $cvor"),
                            if (nir.isNotEmpty) _buildInfoBadge("NIR: $nir"),
                            if (cbsa.isNotEmpty) _buildInfoBadge("CBSA: $cbsa"),
                            if (rfc.isNotEmpty) _buildInfoBadge("RFC: $rfc"),
                            if (ftp.isNotEmpty) _buildInfoBadge("FTP: $ftp"),
                            if (voln.isNotEmpty) _buildInfoBadge("VOLN: $voln"),
                            if (abn.isNotEmpty) _buildInfoBadge("ABN: $abn"),
                            if (hva.isNotEmpty) _buildInfoBadge("HVA: $hva"),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                // Actions Popup Menu (Only for Owner/SubOwner)
                if (isAllow)
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, color: kGray),
                    onSelected: (value) {
                      if (value == "default") {
                        _setAsDefault(docId, data);
                      } else if (value == "toggle_status") {
                        _toggleCompanyStatus(docId, isActive);
                      } else if (value == "edit") {
                        _openCompanyFormDialog(
                          companyId: docId,
                          initialData: data,
                        );
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: "toggle_status",
                        child: Row(
                          children: [
                            Icon(
                              isActive
                                  ? Icons.pause_circle_outline
                                  : Icons.play_circle_outline,
                              color: isActive ? Colors.orange : Colors.green,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                                isActive ? "Mark as Closed" : "Mark as Active"),
                          ],
                        ),
                      ),
                      if (!isDefault)
                        const PopupMenuItem(
                          value: "default",
                          child: Row(
                            children: [
                              Icon(Icons.check_circle_outline,
                                  color: kPrimary, size: 18),
                              SizedBox(width: 8),
                              Text("Set as Default"),
                            ],
                          ),
                        ),
                      const PopupMenuItem(
                        value: "edit",
                        child: Row(
                          children: [
                            Icon(Icons.edit_outlined, color: kDark, size: 18),
                            SizedBox(width: 8),
                            Text("Edit"),
                          ],
                        ),
                      ),
                    ],
                  ),
              ],
            ),

            // Assigned Vehicles Chips Section (Shown for Staff or when vehicles available)
            if (assignedVehicles.isNotEmpty) ...[
              SizedBox(height: 12.h),
              Divider(height: 1, color: Colors.grey.shade100),
              SizedBox(height: 10.h),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    MaterialCommunityIcons.truck,
                    size: 16.sp,
                    color: kPrimary,
                  ),
                  SizedBox(width: 6.w),
                  Text(
                    "Assigned Vehicles:",
                    style: appStyle(12, kDark, FontWeight.bold),
                  ),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Wrap(
                      spacing: 6.w,
                      runSpacing: 4.h,
                      children: assignedVehicles.map((vNum) {
                        return Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 8.w, vertical: 2.h),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(6.r),
                            border: Border.all(
                              color: Colors.blue.withOpacity(0.25),
                            ),
                          ),
                          child: Text(
                            vNum,
                            style: appStyle(
                              11,
                              Colors.blue.shade800,
                              FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ],

            // Address Row
            if (fullAddress.isNotEmpty) ...[
              SizedBox(height: 12.h),
              Divider(height: 1, color: Colors.grey.shade100),
              SizedBox(height: 10.h),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 16.sp,
                    color: kGray,
                  ),
                  SizedBox(width: 6.w),
                  Expanded(
                    child: Text(
                      fullAddress,
                      style: appStyle(12, kGray, FontWeight.normal),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

Widget _buildInfoBadge(String text) {
  return Container(
    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
    decoration: BoxDecoration(
      color: Colors.grey.shade100,
      borderRadius: BorderRadius.circular(6.r),
      border: Border.all(color: Colors.grey.shade300),
    ),
    child: Text(
      text,
      style: appStyle(11, kDark, FontWeight.w600),
    ),
  );
}
