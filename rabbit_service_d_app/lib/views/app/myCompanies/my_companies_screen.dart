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
  const MyCompaniesScreen({super.key, this.currentUId});

  @override
  State<MyCompaniesScreen> createState() => _MyCompaniesScreenState();
}

class _MyCompaniesScreenState extends State<MyCompaniesScreen> {
  late String currentUId;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Form Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dotController = TextEditingController();
  final TextEditingController _mcController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
  final GlobalKey<FormState> _dialogFormKey = GlobalKey<FormState>();

  bool _isDefaultCompany = false;
  bool _isActiveCompany = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    currentUId = widget.currentUId ??
        FirebaseAuth.instance.currentUser?.uid ??
        '';
    _resolveEffectiveUserId();
  }

  Future<void> _resolveEffectiveUserId() async {
    try {
      DocumentSnapshot userDoc =
          await _firestore.collection('Users').doc(currentUId).get();
      if (userDoc.exists) {
        final data = userDoc.data() as Map<String, dynamic>?;
        if (data != null &&
            data.containsKey('createdBy') &&
            data['createdBy'] != null &&
            data['createdBy'].toString().trim().isNotEmpty) {
          if (mounted) {
            setState(() {
              currentUId = data['createdBy'].toString().trim();
            });
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
    _addressController.clear();
    _cityController.clear();
    _stateController.clear();
    _countryController.clear();
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
          initialData["companyName"] ?? initialData["name"] ?? "";
      _dotController.text = initialData["dot"] ?? "";
      _mcController.text = initialData["mc"] ?? "";
      _addressController.text = initialData["address"] ?? "";
      _cityController.text = initialData["city"] ?? "";
      _stateController.text = initialData["state"] ?? "";
      _countryController.text = initialData["country"] ?? "";
      _isDefaultCompany = initialData["isDefault"] ?? false;
      _isActiveCompany = initialData["isActive"] ?? true;
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
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
              ),
              child: Padding(
                padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
                child: Form(
                  key: _dialogFormKey,
                  child: SingleChildScrollView(
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

                        // DOT & MC Fields in Row
                        Row(
                          children: [
                            Expanded(
                              child: _buildInputField(
                                controller: _dotController,
                                label: "DOT (Optional)",
                                hint: "e.g. 1234567",
                                icon: MaterialCommunityIcons
                                    .card_bulleted_outline,
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
                        SizedBox(height: 12.h),

                        // Country Field
                        _buildInputField(
                          controller: _countryController,
                          label: "Country*",
                          hint: "Enter country",
                          icon: MaterialCommunityIcons.earth,
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return "Country is required";
                            }
                            return null;
                          },
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
                                    style: appStyle(14, kDark, FontWeight.w600),
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
                                    style: appStyle(14, kDark, FontWeight.w600),
                                  ),
                                  Text(
                                    "Use for primary dispatch & profile",
                                    style:
                                        appStyle(11, kGray, FontWeight.normal),
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
                              : (isEditing ? "Update Company" : "Save Company"),
                          onPress: _isSubmitting
                              ? null
                              : () async {
                                  if (_dialogFormKey.currentState!.validate()) {
                                    setModalState(() => _isSubmitting = true);
                                    await _saveCompanyToFirestore(
                                      companyId: companyId,
                                      isEditing: isEditing,
                                    );
                                    setModalState(() => _isSubmitting = false);
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
    final String address = _addressController.text.trim();
    final String city = _cityController.text.trim();
    final String state = _stateController.text.trim();
    final String country = _countryController.text.trim();

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

  // Delete Company
  void _confirmDeleteCompany(
      String companyId, String companyName, bool isDefault) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
          title: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: kRed),
              SizedBox(width: 8.w),
              Text("Delete Company",
                  style: appStyle(18, kDark, FontWeight.bold)),
            ],
          ),
          content: Text(
            "Are you sure you want to delete '$companyName'? This action cannot be undone.",
            style: appStyle(14, kDark, FontWeight.normal),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child:
                  Text("Cancel", style: appStyle(14, kGray, FontWeight.w500)),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await _firestore
                      .collection("Users")
                      .doc(currentUId)
                      .collection("myCompanies")
                      .doc(companyId)
                      .delete();
                  showToastMessage(
                      "Success", "Company deleted successfully", kPrimary);
                } catch (e) {
                  log("Error deleting company: $e");
                  showToastMessage(
                      "Error", "Failed to delete company", Colors.red);
                }
              },
              child: Text("Delete", style: appStyle(14, kRed, FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    String? Function(String?)? validator,
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
          text: "My Companies",
          style: appStyle(18, kDark, FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle, color: kPrimary, size: 28),
            onPressed: () => _openCompanyFormDialog(),
            tooltip: "Add Company",
          ),
          SizedBox(width: 8.w),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
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
                    SizedBox(height: 24.h),
                    ElevatedButton.icon(
                      onPressed: () => _openCompanyFormDialog(),
                      icon: const Icon(Icons.add, color: Colors.white),
                      label: Text(
                        "Add Company",
                        style: appStyle(14, Colors.white, FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        padding: EdgeInsets.symmetric(
                            horizontal: 24.w, vertical: 12.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                      ),
                    ),
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
              final String name =
                  data["companyName"] ?? data["name"] ?? "Unnamed Company";
              final String dot = data["dot"] ?? "";
              final String mc = data["mc"] ?? "";
              final String address = data["address"] ?? "";
              final String city = data["city"] ?? "";
              final String state = data["state"] ?? "";
              final String country = data["country"] ?? "";
              final bool isDefault = data["isDefault"] ?? false;
              final bool isActive = data["isActive"] ?? true;

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
                    color: isDefault
                        ? kPrimary.withOpacity(0.6)
                        : Colors.grey.shade200,
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
                                        style: appStyle(
                                            16, kDark, FontWeight.bold),
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 8.w, vertical: 3.h),
                                      decoration: BoxDecoration(
                                        color: isActive
                                            ? Colors.green.withOpacity(0.12)
                                            : Colors.orange.withOpacity(0.12),
                                        borderRadius:
                                            BorderRadius.circular(20.r),
                                        border: Border.all(
                                            color: isActive
                                                ? Colors.green.withOpacity(0.4)
                                                : Colors.orange
                                                    .withOpacity(0.4)),
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
                                          borderRadius:
                                              BorderRadius.circular(20.r),
                                          border: Border.all(
                                              color:
                                                  kPrimary.withOpacity(0.4)),
                                        ),
                                        child: Text(
                                          "Default",
                                          style: appStyle(
                                              11, kPrimary, FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (dot.isNotEmpty || mc.isNotEmpty) ...[
                                  SizedBox(height: 6.h),
                                  Wrap(
                                    spacing: 8.w,
                                    runSpacing: 4.h,
                                    children: [
                                      if (dot.isNotEmpty)
                                        _buildInfoBadge("DOT: $dot"),
                                      if (mc.isNotEmpty)
                                        _buildInfoBadge("MC: $mc"),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          // Actions Popup Menu
                          PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert, color: kGray),
                            onSelected: (value) {
                              if (value == "default") {
                                _setAsDefault(doc.id, data);
                              } else if (value == "toggle_status") {
                                _toggleCompanyStatus(doc.id, isActive);
                              } else if (value == "edit") {
                                _openCompanyFormDialog(
                                  companyId: doc.id,
                                  initialData: data,
                                );
                              } else if (value == "delete") {
                                _confirmDeleteCompany(doc.id, name, isDefault);
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
                                      color: isActive
                                          ? Colors.orange
                                          : Colors.green,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(isActive
                                        ? "Mark as Closed"
                                        : "Mark as Active"),
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
                                    Icon(Icons.edit_outlined,
                                        color: kDark, size: 18),
                                    SizedBox(width: 8),
                                    Text("Edit"),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: "delete",
                                child: Row(
                                  children: [
                                    Icon(Icons.delete_outline,
                                        color: kRed, size: 18),
                                    SizedBox(width: 8),
                                    Text("Delete",
                                        style: TextStyle(color: kRed)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

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
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openCompanyFormDialog(),
        backgroundColor: kPrimary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(
          "Add Company",
          style: appStyle(14, Colors.white, FontWeight.bold),
        ),
      ),
    );
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
}
