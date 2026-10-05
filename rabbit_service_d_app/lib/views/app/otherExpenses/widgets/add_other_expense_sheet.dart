import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';
import '../../../../utils/show_toast_msg.dart';
import '../models/other_expense_model.dart';
import 'team_selection_dialog.dart';

const List<String> kDefaultServices = [
  "Cash Advance",
  "Detention / Layover",
  "Driver Reimbursement",
  "Equipment Rental",
  "Fuel / Gas Surcharge",
  "Insurance & Legal",
  "Loading / Unloading (Lumper)",
  "Office & Misc Supplies",
  "Safety & Inspection",
  "Tolls & Permits",
  "Other",
];

class AddOtherExpenseSheet extends StatefulWidget {
  final String effectiveUserId;
  final OtherExpenseModel? editingExpense;

  const AddOtherExpenseSheet({
    super.key,
    required this.effectiveUserId,
    this.editingExpense,
  });

  @override
  State<AddOtherExpenseSheet> createState() => _AddOtherExpenseSheetState();
}

class _AddOtherExpenseSheetState extends State<AddOtherExpenseSheet> {
  final _formKey = GlobalKey<FormState>();

  String _transactionType = "Debit"; // "Credit" or "Debit"
  DateTime _selectedDate = DateTime.now();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _customServiceController = TextEditingController();

  // Dropdown lists
  List<String> _servicesList = [];
  List<Map<String, dynamic>> _companiesList = [];
  List<Map<String, dynamic>> _allVehiclesList = [];
  List<Map<String, dynamic>> _filteredVehiclesList = [];

  // Selections
  String? _selectedService;
  String? _selectedCompanyId;
  String? _selectedCompanyName;
  String? _selectedVehicleId;
  String? _selectedVehicleNumber;
  TeamMemberOption? _selectedTeamMember;

  bool _isLoadingDropdowns = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _initValues();
    _fetchDropdownData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _customServiceController.dispose();
    super.dispose();
  }

  void _initValues() {
    if (widget.editingExpense != null) {
      final exp = widget.editingExpense!;
      _transactionType = exp.type == "Credit" ? "Credit" : "Debit";
      _selectedDate = exp.parsedDate ?? DateTime.now();
      _amountController.text = exp.amount > 0 ? exp.amount.toStringAsFixed(2) : '';
      _descriptionController.text = exp.description;
      _selectedCompanyId = exp.companyId.isNotEmpty ? exp.companyId : null;
      _selectedCompanyName = exp.companyName.isNotEmpty ? exp.companyName : null;
      _selectedVehicleId = exp.vehicleId.isNotEmpty ? exp.vehicleId : null;
      _selectedVehicleNumber = exp.vehicleNumber.isNotEmpty ? exp.vehicleNumber : null;

      if (exp.teamMemberId.isNotEmpty || exp.teamMemberName.isNotEmpty) {
        _selectedTeamMember = TeamMemberOption(
          uid: exp.teamMemberId,
          userName: exp.teamMemberName,
          email: exp.teamMemberEmail,
          phoneNumber: exp.teamMemberPhone,
          role: exp.teamMemberRole.isNotEmpty ? exp.teamMemberRole : 'Driver',
        );
      }

      if (exp.isCustomService) {
        _selectedService = "Other";
        _customServiceController.text = exp.serviceName;
      } else {
        _selectedService = exp.serviceName;
      }
    }
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingDropdowns = true);
    try {
      // 1. Fetch Services
      final servicesSnapshot = await FirebaseFirestore.instance
          .collection('otherExpensesServices')
          .get();

      final List<String> fetchedServices = [];
      for (var doc in servicesSnapshot.docs) {
        final data = doc.data();
        final sName = (data['sName'] ?? data['serviceName'] ?? data['name'] ?? doc.id).toString().trim();
        if (sName.isNotEmpty) {
          fetchedServices.add(sName);
        }
      }

      if (fetchedServices.isEmpty) {
        fetchedServices.addAll(kDefaultServices);
      } else {
        if (!fetchedServices.any((s) => s.toLowerCase() == "other")) {
          fetchedServices.add("Other");
        }
      }

      // Sort Alphabetically A-Z, keeping 'Other' at the end
      final nonOther = fetchedServices.where((s) => s.toLowerCase() != "other").toList();
      nonOther.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
      _servicesList = [...nonOther, "Other"];

      // Default select first service if create mode
      if (widget.editingExpense == null && _selectedService == null && _servicesList.isNotEmpty) {
        _selectedService = _servicesList.first;
      }

      // 2. Fetch Companies
      final companiesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.effectiveUserId)
          .collection('myCompanies')
          .get();

      final List<Map<String, dynamic>> companies = [];
      for (var doc in companiesSnapshot.docs) {
        final data = doc.data();
        if (data['isActive'] != false) {
          companies.add({
            'id': doc.id,
            'name': (data['companyName'] ?? data['name'] ?? 'Unnamed Company').toString().trim(),
            'isDefault': data['isDefault'] == true,
          });
        }
      }
      companies.sort((a, b) => (a['name'] as String).toLowerCase().compareTo((b['name'] as String).toLowerCase()));
      _companiesList = companies;

      // 3. Fetch Vehicles
      final vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.effectiveUserId)
          .collection('Vehicles')
          .get();

      final List<Map<String, dynamic>> vehicles = [];
      for (var doc in vehiclesSnapshot.docs) {
        final data = doc.data();
        if (data['active'] != false) {
          vehicles.add({
            'id': doc.id,
            'number': (data['vehicleNumber'] ?? data['name'] ?? doc.id).toString().trim(),
            'type': (data['vehicleType'] ?? '').toString().trim(),
            'mycomId': (data['mycomId'] ?? '').toString().trim(),
            'myCompany': (data['myCompany'] ?? data['companyName'] ?? '').toString().trim(),
          });
        }
      }
      vehicles.sort((a, b) => (a['number'] as String).toLowerCase().compareTo((b['number'] as String).toLowerCase()));
      _allVehiclesList = vehicles;

      _updateFilteredVehicles();
      setState(() => _isLoadingDropdowns = false);
    } catch (e) {
      log("Error fetching dropdowns: $e");
      _servicesList = kDefaultServices;
      setState(() => _isLoadingDropdowns = false);
    }
  }

  void _updateFilteredVehicles() {
    if (_selectedCompanyId == null || _selectedCompanyId!.isEmpty) {
      _filteredVehiclesList = _allVehiclesList;
    } else {
      final selectedComp = _companiesList.firstWhereOrNull((c) => c['id'] == _selectedCompanyId);
      final compNameLower = (selectedComp?['name'] ?? '').toString().toLowerCase();

      _filteredVehiclesList = _allVehiclesList.where((v) {
        if (v['mycomId'] == _selectedCompanyId) return true;
        if (compNameLower.isNotEmpty && (v['myCompany'] as String).toLowerCase() == compNameLower) {
          return true;
        }
        return false;
      }).toList();
    }

    // Reset vehicle selection if not in filtered list
    if (_selectedVehicleId != null && !_filteredVehiclesList.any((v) => v['id'] == _selectedVehicleId)) {
      _selectedVehicleId = null;
      _selectedVehicleNumber = null;
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: kPrimary,
              onPrimary: Colors.white,
              onSurface: kDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _openTeamSelectionModal() async {
    final result = await showDialog<TeamMemberOption>(
      context: context,
      builder: (context) => TeamSelectionDialog(
        effectiveUserId: widget.effectiveUserId,
        initialSelected: _selectedTeamMember,
      ),
    );

    if (result != null) {
      setState(() => _selectedTeamMember = result);
    }
  }

  Future<void> _saveExpense() async {
    if (!_formKey.currentState!.validate()) return;

    final parsedAmount = double.tryParse(_amountController.text.trim());
    if (parsedAmount == null || parsedAmount <= 0) {
      showToastMessage("Error", "Please enter a valid amount greater than 0", Colors.red);
      return;
    }

    final isCustom = _selectedService?.toLowerCase() == "other";
    String finalServiceName = _selectedService ?? "Other Expense";
    if (isCustom) {
      final customName = _customServiceController.text.trim();
      if (customName.isEmpty) {
        showToastMessage("Error", "Please specify custom expense name", Colors.red);
        return;
      }
      finalServiceName = customName;
    }

    setState(() => _isSaving = true);
    try {
      final collectionRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.effectiveUserId)
          .collection('record_otherExpenses');

      final dateFormatted = DateFormat('MM-dd-yyyy').format(_selectedDate);

      final payload = {
        'userId': widget.effectiveUserId,
        'serviceId': isCustom ? 'custom_other' : (_selectedService ?? ''),
        'serviceName': finalServiceName,
        'isCustomService': isCustom,
        'companyId': _selectedCompanyId ?? '',
        'companyName': _selectedCompanyName ?? '',
        'vehicleId': _selectedVehicleId ?? '',
        'vehicleNumber': _selectedVehicleNumber ?? '',
        'teamMemberId': _selectedTeamMember?.uid ?? '',
        'teamMemberName': _selectedTeamMember?.userName ?? '',
        'teamMemberRole': _selectedTeamMember?.role ?? '',
        'teamMemberEmail': _selectedTeamMember?.email ?? '',
        'teamMemberPhone': _selectedTeamMember?.phoneNumber ?? '',
        'date': dateFormatted,
        'amount': parsedAmount,
        'type': _transactionType,
        'description': _descriptionController.text.trim(),
        'updatedAt': DateTime.now().toIso8601String(),
        'active': true,
        'addedFrom': 'Mobile',
      };

      if (widget.editingExpense != null) {
        await collectionRef.doc(widget.editingExpense!.id).set(payload, SetOptions(merge: true));
        showToastMessage("Success", "Expense updated successfully", Colors.green);
      } else {
        payload['createdAt'] = DateTime.now().toIso8601String();
        await collectionRef.add(payload);
        showToastMessage("Success", "Expense recorded successfully", Colors.green);
      }

      if (mounted) {
        if (Navigator.canPop(context)) {
          Navigator.of(context).pop(true);
        } else {
          Get.back(result: true);
        }
      }
    } catch (e) {
      log("Error saving expense: $e");
      showToastMessage("Error", "Failed to save expense. Please try again.", Colors.red);
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.editingExpense != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20.r),
          topRight: Radius.circular(20.r),
        ),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      constraints: BoxConstraints(maxHeight: 0.9.sh),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 14.h),
            decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(20.r),
                topRight: Radius.circular(20.r),
              ),
              border: const Border(bottom: BorderSide(color: kGrayLight, width: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEditing ? "Edit Expense Record" : "Add Expense / Income",
                      style: appStyle(16, kDark, FontWeight.bold),
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      isEditing ? "Update transaction details" : "Record cash in or cash out entry",
                      style: appStyle(11, kGray, FontWeight.normal),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, size: 22.sp, color: kGray),
                  onPressed: () => Get.back(),
                ),
              ],
            ),
          ),

          // Scrollable Form
          Flexible(
            child: _isLoadingDropdowns
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40.0),
                      child: CircularProgressIndicator(color: kPrimary),
                    ),
                  )
                : SingleChildScrollView(
                    padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 14.h),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Transaction Type Toggle (Credit vs Debit)
                          Text("TRANSACTION TYPE", style: appStyle(11, kGray, FontWeight.bold)),
                          SizedBox(height: 6.h),
                          Row(
                            children: [
                              // Credit Button
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _transactionType = "Credit"),
                                  borderRadius: BorderRadius.circular(10.r),
                                  child: Container(
                                    padding: EdgeInsets.symmetric(vertical: 12.h),
                                    decoration: BoxDecoration(
                                      color: _transactionType == "Credit"
                                          ? Colors.green
                                          : Colors.green.withOpacity(0.06),
                                      borderRadius: BorderRadius.circular(10.r),
                                      border: Border.all(
                                        color: _transactionType == "Credit"
                                            ? Colors.green
                                            : Colors.green.withOpacity(0.3),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.arrow_downward_rounded,
                                          size: 16.sp,
                                          color: _transactionType == "Credit"
                                              ? Colors.white
                                              : Colors.green,
                                        ),
                                        SizedBox(width: 6.w),
                                        Text(
                                          "Credit (Cash In)",
                                          style: appStyle(
                                            12,
                                            _transactionType == "Credit" ? Colors.white : Colors.green,
                                            FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(width: 10.w),

                              // Debit Button
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _transactionType = "Debit"),
                                  borderRadius: BorderRadius.circular(10.r),
                                  child: Container(
                                    padding: EdgeInsets.symmetric(vertical: 12.h),
                                    decoration: BoxDecoration(
                                      color: _transactionType == "Debit"
                                          ? kPrimary
                                          : kPrimary.withOpacity(0.06),
                                      borderRadius: BorderRadius.circular(10.r),
                                      border: Border.all(
                                        color: _transactionType == "Debit"
                                            ? kPrimary
                                            : kPrimary.withOpacity(0.3),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.arrow_upward_rounded,
                                          size: 16.sp,
                                          color: _transactionType == "Debit"
                                              ? Colors.white
                                              : kPrimary,
                                        ),
                                        SizedBox(width: 6.w),
                                        Text(
                                          "Debit (Cash Out)",
                                          style: appStyle(
                                            12,
                                            _transactionType == "Debit" ? Colors.white : kPrimary,
                                            FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          SizedBox(height: 14.h),

                          // 2. Date Selection
                          Text("DATE", style: appStyle(11, kGray, FontWeight.bold)),
                          SizedBox(height: 6.h),
                          InkWell(
                            onTap: _pickDate,
                            borderRadius: BorderRadius.circular(10.r),
                            child: Container(
                              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                              decoration: BoxDecoration(
                                color: kOffWhite,
                                borderRadius: BorderRadius.circular(10.r),
                                border: Border.all(color: kGrayLight.withOpacity(0.5)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.calendar_today_rounded, size: 16.sp, color: kPrimary),
                                      SizedBox(width: 8.w),
                                      Text(
                                        DateFormat('MM-dd-yyyy').format(_selectedDate),
                                        style: appStyle(13, kDark, FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                  Text("Change", style: appStyle(11, kPrimary, FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),

                          SizedBox(height: 14.h),

                          // 3. Service / Expense Dropdown
                          Row(
                            children: [
                              Text("SERVICE / EXPENSE NAME", style: appStyle(11, kGray, FontWeight.bold)),
                              Text(" *", style: appStyle(11, kRed, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(height: 6.h),
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 12.w),
                            decoration: BoxDecoration(
                              color: kOffWhite,
                              borderRadius: BorderRadius.circular(10.r),
                              border: Border.all(color: kGrayLight.withOpacity(0.5)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _servicesList.contains(_selectedService) ? _selectedService : null,
                                isExpanded: true,
                                icon: const Icon(Icons.keyboard_arrow_down_rounded, color: kGray),
                                hint: Text("Select Service / Expense", style: appStyle(12, kGray, FontWeight.normal)),
                                items: _servicesList.map((service) {
                                  return DropdownMenuItem<String>(
                                    value: service,
                                    child: Text(service, style: appStyle(13, kDark, FontWeight.w500)),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    _selectedService = val;
                                  });
                                },
                              ),
                            ),
                          ),

                          // Custom Service Name field if "Other" is selected
                          if (_selectedService?.toLowerCase() == "other") ...[
                            SizedBox(height: 8.h),
                            Container(
                              padding: EdgeInsets.all(10.w),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(10.r),
                                border: Border.all(color: Colors.amber.shade300),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("SPECIFY CUSTOM EXPENSE NAME *",
                                      style: appStyle(10, Colors.amber.shade900, FontWeight.bold)),
                                  SizedBox(height: 4.h),
                                  TextFormField(
                                    controller: _customServiceController,
                                    style: appStyle(13, kDark, FontWeight.normal),
                                    decoration: InputDecoration(
                                      hintText: "e.g. Warehouse cleaning, Parking fee...",
                                      hintStyle: appStyle(12, kGray, FontWeight.normal),
                                      isDense: true,
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8.r),
                                        borderSide: BorderSide(color: Colors.amber.shade300),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8.r),
                                        borderSide: BorderSide(color: Colors.amber.shade300),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8.r),
                                        borderSide: const BorderSide(color: kPrimary),
                                      ),
                                    ),
                                    validator: (val) {
                                      if (_selectedService?.toLowerCase() == "other" && (val == null || val.trim().isEmpty)) {
                                        return "Please specify custom expense name";
                                      }
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],

                          SizedBox(height: 14.h),

                          // 4. Team Assignment (Optional)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text("TEAM ASSIGNMENT (OPTIONAL)", style: appStyle(11, kGray, FontWeight.bold)),
                              if (_selectedTeamMember != null)
                                GestureDetector(
                                  onTap: () => setState(() => _selectedTeamMember = null),
                                  child: Text("Clear", style: appStyle(11, kRed, FontWeight.bold)),
                                ),
                            ],
                          ),
                          SizedBox(height: 6.h),
                          if (_selectedTeamMember != null)
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                              decoration: BoxDecoration(
                                color: kPrimary.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(10.r),
                                border: Border.all(color: kPrimary.withOpacity(0.3)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18.r,
                                    backgroundColor: kPrimary,
                                    child: Text(
                                      _selectedTeamMember!.userName.isNotEmpty
                                          ? _selectedTeamMember!.userName[0].toUpperCase()
                                          : 'M',
                                      style: appStyle(13, Colors.white, FontWeight.bold),
                                    ),
                                  ),
                                  SizedBox(width: 10.w),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                _selectedTeamMember!.userName,
                                                style: appStyle(13, kDark, FontWeight.bold),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            SizedBox(width: 6.w),
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 1.5.h),
                                              decoration: BoxDecoration(
                                                color: Colors.blue.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(4.r),
                                              ),
                                              child: Text(
                                                _selectedTeamMember!.role,
                                                style: appStyle(9, Colors.blue.shade700, FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ),
                                        SizedBox(height: 2.h),
                                        Text(
                                          _selectedTeamMember!.email.isNotEmpty
                                              ? _selectedTeamMember!.email
                                              : (_selectedTeamMember!.phoneNumber.isNotEmpty
                                                  ? _selectedTeamMember!.phoneNumber
                                                  : 'Assigned member'),
                                          style: appStyle(11, kGray, FontWeight.normal),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _openTeamSelectionModal,
                                    style: TextButton.styleFrom(
                                      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                                      minimumSize: Size.zero,
                                    ),
                                    child: Text("Change", style: appStyle(11, kPrimary, FontWeight.bold)),
                                  ),
                                ],
                              ),
                            )
                          else
                            InkWell(
                              onTap: _openTeamSelectionModal,
                              borderRadius: BorderRadius.circular(10.r),
                              child: Container(
                                padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                                decoration: BoxDecoration(
                                  color: kOffWhite,
                                  borderRadius: BorderRadius.circular(10.r),
                                  border: Border.all(color: kGrayLight.withOpacity(0.5), style: BorderStyle.solid),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.person_add_alt_1_rounded, size: 16.sp, color: kPrimary),
                                    SizedBox(width: 6.w),
                                    Text("+ Assign Team Member", style: appStyle(12, kPrimary, FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),

                          SizedBox(height: 14.h),

                          // 5. Company & Vehicle Dropdowns
                          Row(
                            children: [
                              // Company Dropdown
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("COMPANY", style: appStyle(11, kGray, FontWeight.bold)),
                                    SizedBox(height: 6.h),
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 10.w),
                                      decoration: BoxDecoration(
                                        color: kOffWhite,
                                        borderRadius: BorderRadius.circular(10.r),
                                        border: Border.all(color: kGrayLight.withOpacity(0.5)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _selectedCompanyId,
                                          isExpanded: true,
                                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: kGray),
                                          hint: Text("Optional", style: appStyle(11, kGray, FontWeight.normal)),
                                          items: [
                                            DropdownMenuItem<String>(
                                              value: null,
                                              child: Text("-- None --", style: appStyle(12, kGray, FontWeight.normal)),
                                            ),
                                            ..._companiesList.map((c) {
                                              return DropdownMenuItem<String>(
                                                value: c['id'] as String,
                                                child: Text(
                                                  c['name'] as String,
                                                  style: appStyle(12, kDark, FontWeight.w500),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              );
                                            }),
                                          ],
                                          onChanged: (val) {
                                            setState(() {
                                              _selectedCompanyId = val;
                                              if (val != null) {
                                                final match = _companiesList.firstWhereOrNull((c) => c['id'] == val);
                                                _selectedCompanyName = match?['name'];
                                              } else {
                                                _selectedCompanyName = null;
                                              }
                                              _updateFilteredVehicles();
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(width: 10.w),

                              // Vehicle Dropdown
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("VEHICLE", style: appStyle(11, kGray, FontWeight.bold)),
                                    SizedBox(height: 6.h),
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 10.w),
                                      decoration: BoxDecoration(
                                        color: kOffWhite,
                                        borderRadius: BorderRadius.circular(10.r),
                                        border: Border.all(color: kGrayLight.withOpacity(0.5)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _selectedVehicleId,
                                          isExpanded: true,
                                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: kGray),
                                          hint: Text("Optional", style: appStyle(11, kGray, FontWeight.normal)),
                                          items: [
                                            DropdownMenuItem<String>(
                                              value: null,
                                              child: Text("-- None --", style: appStyle(12, kGray, FontWeight.normal)),
                                            ),
                                            ..._filteredVehiclesList.map((v) {
                                              return DropdownMenuItem<String>(
                                                value: v['id'] as String,
                                                child: Text(
                                                  v['number'] as String,
                                                  style: appStyle(12, kDark, FontWeight.w500),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              );
                                            }),
                                          ],
                                          onChanged: (val) {
                                            setState(() {
                                              _selectedVehicleId = val;
                                              if (val != null) {
                                                final match = _filteredVehiclesList.firstWhereOrNull((v) => v['id'] == val);
                                                _selectedVehicleNumber = match?['number'];
                                              } else {
                                                _selectedVehicleNumber = null;
                                              }
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          SizedBox(height: 14.h),

                          // 6. Amount Field
                          Row(
                            children: [
                              Text("AMOUNT (\$)", style: appStyle(11, kGray, FontWeight.bold)),
                              Text(" *", style: appStyle(11, kRed, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(height: 6.h),
                          TextFormField(
                            controller: _amountController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: appStyle(15, kDark, FontWeight.bold),
                            decoration: InputDecoration(
                              hintText: "0.00",
                              hintStyle: appStyle(14, kGrayLight, FontWeight.normal),
                              prefixIcon: Icon(Icons.attach_money_rounded, color: kPrimary, size: 20.sp),
                              filled: true,
                              fillColor: kOffWhite,
                              contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: BorderSide(color: kGrayLight.withOpacity(0.5)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: BorderSide(color: kGrayLight.withOpacity(0.5)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: const BorderSide(color: kPrimary, width: 1.2),
                              ),
                            ),
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return "Please enter amount";
                              }
                              final num = double.tryParse(val.trim());
                              if (num == null || num <= 0) {
                                return "Amount must be greater than 0";
                              }
                              return null;
                            },
                          ),

                          SizedBox(height: 14.h),

                          // 7. Description / Notes Field
                          Text("DESCRIPTION / NOTES", style: appStyle(11, kGray, FontWeight.bold)),
                          SizedBox(height: 6.h),
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 2,
                            style: appStyle(13, kDark, FontWeight.normal),
                            decoration: InputDecoration(
                              hintText: "Additional details, receipt notes...",
                              hintStyle: appStyle(12, kGray, FontWeight.normal),
                              filled: true,
                              fillColor: kOffWhite,
                              contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: BorderSide(color: kGrayLight.withOpacity(0.5)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: BorderSide(color: kGrayLight.withOpacity(0.5)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.r),
                                borderSide: const BorderSide(color: kPrimary, width: 1.2),
                              ),
                            ),
                          ),

                          SizedBox(height: 20.h),

                          // Submit Button
                          SizedBox(
                            width: double.infinity,
                            height: 48.h,
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _saveExpense,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kPrimary,
                                disabledBackgroundColor: kPrimary.withOpacity(0.55),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                                elevation: 0,
                              ),
                              child: _isSaving
                                  ? Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        SizedBox(
                                          width: 18.w,
                                          height: 18.w,
                                          child: const CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.2,
                                          ),
                                        ),
                                        SizedBox(width: 10.w),
                                        Text(
                                          isEditing ? "Updating Record..." : "Saving Record...",
                                          style: appStyle(14, Colors.white, FontWeight.bold),
                                        ),
                                      ],
                                    )
                                  : Text(
                                      isEditing ? "Update Expense" : "Save Expense Record",
                                      style: appStyle(14, Colors.white, FontWeight.bold),
                                    ),
                            ),
                          ),
                          SizedBox(height: 10.h),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
