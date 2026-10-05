import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:excel/excel.dart' as excel_pkg;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../utils/show_toast_msg.dart';
import 'models/other_expense_model.dart';
import 'widgets/add_other_expense_sheet.dart';

class OtherExpensesScreen extends StatefulWidget {
  const OtherExpensesScreen({super.key});

  @override
  State<OtherExpensesScreen> createState() => _OtherExpensesScreenState();
}

class _OtherExpensesScreenState extends State<OtherExpensesScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  String _effectiveUserId = '';
  String _userRole = '';
  bool _isLoadingUser = true;

  // Search and Filters
  final TextEditingController _searchController = TextEditingController();
  bool _isSearchVisible = false;
  String _selectedTypeFilter = "All"; // "All", "Credit", "Debit"
  DateTimeRange? _selectedDateRange;
  String _selectedCompanyFilter = "All";
  String _selectedVehicleFilter = "All";

  @override
  void initState() {
    super.initState();
    _resolveEffectiveUserId();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _resolveEffectiveUserId() async {
    setState(() => _isLoadingUser = true);
    final user = _auth.currentUser;
    if (user == null) {
      setState(() => _isLoadingUser = false);
      return;
    }

    try {
      final doc = await _firestore.collection('Users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        _userRole = data['role']?.toString() ?? '';

        if (_userRole == 'SubOwner' &&
            data['createdBy'] != null &&
            data['createdBy'].toString().trim().isNotEmpty) {
          _effectiveUserId = data['createdBy'].toString().trim();
        } else {
          _effectiveUserId = user.uid;
        }
      } else {
        _effectiveUserId = user.uid;
      }
    } catch (e) {
      log("Error resolving effective user ID: $e");
      _effectiveUserId = user.uid;
    } finally {
      setState(() => _isLoadingUser = false);
    }
  }

  void _openAddExpenseModal({OtherExpenseModel? expenseToEdit}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddOtherExpenseSheet(
        effectiveUserId: _effectiveUserId,
        editingExpense: expenseToEdit,
      ),
    );

    if (result == true) {
      setState(() {});
    }
  }

  Future<void> _deleteExpense(OtherExpenseModel expense) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: kRed, size: 22.sp),
            SizedBox(width: 8.w),
            Text("Delete Expense", style: appStyle(16, kDark, FontWeight.bold)),
          ],
        ),
        content: Text(
          "Are you sure you want to delete this ${expense.serviceName} expense of \$${expense.amount.toStringAsFixed(2)}?",
          style: appStyle(13, kDark, FontWeight.normal),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(result: false),
            child: Text("Cancel", style: appStyle(13, kGray, FontWeight.w500)),
          ),
          ElevatedButton(
            onPressed: () => Get.back(result: true),
            style: ElevatedButton.styleFrom(
              backgroundColor: kRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
            ),
            child: Text("Delete", style: appStyle(13, Colors.white, FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _firestore
            .collection('Users')
            .doc(_effectiveUserId)
            .collection('record_otherExpenses')
            .doc(expense.id)
            .update({
          'active': false,
          'updatedAt': DateTime.now().toIso8601String(),
        });
        showToastMessage("Success", "Expense deleted successfully", Colors.green);
      } catch (e) {
        log("Error deleting expense: $e");
        showToastMessage("Error", "Failed to delete expense", Colors.red);
      }
    }
  }

  Future<void> _pickDateRange() async {
    final initialRange = _selectedDateRange ??
        DateTimeRange(
          start: DateTime.now().subtract(const Duration(days: 30)),
          end: DateTime.now(),
        );

    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      initialDateRange: initialRange,
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
      setState(() => _selectedDateRange = picked);
    }
  }

  List<OtherExpenseModel> _filterExpenses(List<OtherExpenseModel> allExpenses) {
    return allExpenses.where((exp) {
      // 1. Type Filter
      if (_selectedTypeFilter != "All" && exp.type != _selectedTypeFilter) {
        return false;
      }

      // 2. Company Filter
      if (_selectedCompanyFilter != "All" &&
          exp.companyName.toLowerCase() != _selectedCompanyFilter.toLowerCase()) {
        return false;
      }

      // 3. Vehicle Filter
      if (_selectedVehicleFilter != "All" &&
          exp.vehicleNumber.toLowerCase() != _selectedVehicleFilter.toLowerCase()) {
        return false;
      }

      // 4. Date Range Filter
      if (_selectedDateRange != null) {
        final d = exp.parsedDate;
        if (d != null) {
          final start = DateTime(
              _selectedDateRange!.start.year, _selectedDateRange!.start.month, _selectedDateRange!.start.day);
          final end = DateTime(
              _selectedDateRange!.end.year, _selectedDateRange!.end.month, _selectedDateRange!.end.day, 23, 59, 59);
          if (d.isBefore(start) || d.isAfter(end)) {
            return false;
          }
        }
      }

      // 5. Search query
      final query = _searchController.text.trim().toLowerCase();
      if (query.isNotEmpty) {
        final matchService = exp.serviceName.toLowerCase().contains(query);
        final matchDesc = exp.description.toLowerCase().contains(query);
        final matchAmount = exp.amount.toString().contains(query);
        final matchCompany = exp.companyName.toLowerCase().contains(query);
        final matchVehicle = exp.vehicleNumber.toLowerCase().contains(query);
        final matchTeamName = exp.teamMemberName.toLowerCase().contains(query);
        final matchTeamRole = exp.teamMemberRole.toLowerCase().contains(query);

        if (!matchService &&
            !matchDesc &&
            !matchAmount &&
            !matchCompany &&
            !matchVehicle &&
            !matchTeamName &&
            !matchTeamRole) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  // Export to Excel file
  Future<void> _exportToExcel(List<OtherExpenseModel> records) async {
    if (records.isEmpty) {
      showToastMessage("Info", "No records to export", Colors.orange);
      return;
    }

    try {
      final excel = excel_pkg.Excel.createExcel();
      final sheet = excel['Other Expenses'];
      excel.delete('Sheet1');

      // Headers
      final headers = [
        'S.No',
        'Date',
        'Service / Expense',
        'Team Member',
        'Role',
        'Company',
        'Vehicle',
        'Type',
        'Amount (\$)',
        'Description / Notes',
      ];

      sheet.appendRow(headers.map((h) => excel_pkg.TextCellValue(h)).toList());

      // Rows
      for (int i = 0; i < records.length; i++) {
        final r = records[i];
        sheet.appendRow([
          excel_pkg.IntCellValue(i + 1),
          excel_pkg.TextCellValue(r.date),
          excel_pkg.TextCellValue(r.serviceName),
          excel_pkg.TextCellValue(r.teamMemberName.isNotEmpty ? r.teamMemberName : '-'),
          excel_pkg.TextCellValue(r.teamMemberRole.isNotEmpty ? r.teamMemberRole : '-'),
          excel_pkg.TextCellValue(r.companyName.isNotEmpty ? r.companyName : '-'),
          excel_pkg.TextCellValue(r.vehicleNumber.isNotEmpty ? r.vehicleNumber : '-'),
          excel_pkg.TextCellValue(r.type == 'Credit' ? 'Credit (Cash In)' : 'Debit (Cash Out)'),
          excel_pkg.DoubleCellValue(r.amount),
          excel_pkg.TextCellValue(r.description.isNotEmpty ? r.description : '-'),
        ]);
      }

      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/other_expenses_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.xlsx');
      final bytes = excel.encode();
      if (bytes != null) {
        await file.writeAsBytes(bytes);
        await Share.shareXFiles([XFile(file.path)], text: 'Other Expenses Report');
      }
    } catch (e) {
      log("Error exporting excel: $e");
      showToastMessage("Error", "Failed to export Excel", Colors.red);
    }
  }

  // Export & Print PDF Report
  Future<void> _exportToPdf(List<OtherExpenseModel> records) async {
    if (records.isEmpty) {
      showToastMessage("Info", "No records to export", Colors.orange);
      return;
    }

    try {
      final doc = pw.Document();

      // Calculate totals
      double totalCredit = 0.0;
      double totalDebit = 0.0;
      for (var r in records) {
        if (r.type == 'Credit') {
          totalCredit += r.amount;
        } else {
          totalDebit += r.amount;
        }
      }
      final netBalance = totalCredit - totalDebit;

      doc.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (context) => [
            // Title Header
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('TRENOOPS', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: PdfColors.red800)),
                    pw.Text('Other Expenses & Income Statement', style: pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
                  ],
                ),
                pw.Text(
                  'Generated: ${DateFormat('dd MMM yyyy').format(DateTime.now())}',
                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                ),
              ],
            ),
            pw.Divider(thickness: 1, color: PdfColors.grey300),
            pw.SizedBox(height: 10),

            // Summary Box
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: pw.BorderRadius.circular(6),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                children: [
                  pw.Column(children: [
                    pw.Text('Total Cash In', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                    pw.Text('+\$${totalCredit.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: PdfColors.green800)),
                  ]),
                  pw.Column(children: [
                    pw.Text('Total Cash Out', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                    pw.Text('-\$${totalDebit.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: PdfColors.red800)),
                  ]),
                  pw.Column(children: [
                    pw.Text('Net Balance', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                    pw.Text(
                      '${netBalance >= 0 ? '+' : '-'}\$${netBalance.abs().toStringAsFixed(2)}',
                      style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: netBalance >= 0 ? PdfColors.green800 : PdfColors.red800),
                    ),
                  ]),
                ],
              ),
            ),
            pw.SizedBox(height: 14),

            // Table
            pw.Table.fromTextArray(
              headers: ['Date', 'Service / Remark', 'Team / Info', 'Mode', 'Cash In', 'Cash Out'],
              data: records.map((r) {
                final isCredit = r.type == 'Credit';
                String teamInfo = '';
                if (r.teamMemberName.isNotEmpty) {
                  teamInfo = '${r.teamMemberName} (${r.teamMemberRole})';
                }
                if (r.vehicleNumber.isNotEmpty) {
                  teamInfo += teamInfo.isNotEmpty ? ' | Veh: ${r.vehicleNumber}' : 'Veh: ${r.vehicleNumber}';
                }

                return [
                  r.date,
                  r.serviceName,
                  teamInfo.isNotEmpty ? teamInfo : '-',
                  'Cash',
                  isCredit ? '\$${r.amount.toStringAsFixed(2)}' : '',
                  !isCredit ? '\$${r.amount.toStringAsFixed(2)}' : '',
                ];
              }).toList(),
              headerStyle: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.red700),
              cellStyle: const pw.TextStyle(fontSize: 8),
              cellAlignment: pw.Alignment.centerLeft,
              cellPadding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
            ),
          ],
        ),
      );

      await Printing.layoutPdf(
        onLayout: (format) async => doc.save(),
        name: 'other_expenses_report_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf',
      );
    } catch (e) {
      log("Error generating PDF: $e");
      showToastMessage("Error", "Failed to generate PDF", Colors.red);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingUser) {
      return Scaffold(
        backgroundColor: kLightWhite,
        appBar: AppBar(
          backgroundColor: kLightWhite,
          elevation: 0,
          title: Text("Other Expenses", style: appStyle(18, kDark, FontWeight.bold)),
        ),
        body: const Center(child: CircularProgressIndicator(color: kPrimary)),
      );
    }

    return Scaffold(
      backgroundColor: kLightWhite,
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18.sp, color: kDark),
          onPressed: () => Get.back(),
        ),
        title: _isSearchVisible
            ? Container(
                height: 38.h,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8.r),
                  border: Border.all(color: kGrayLight.withOpacity(0.5)),
                ),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  onChanged: (_) => setState(() {}),
                  style: appStyle(13, kDark, FontWeight.normal),
                  decoration: InputDecoration(
                    hintText: "Search expenses, vehicle, team...",
                    hintStyle: appStyle(12, kGray, FontWeight.normal),
                    prefixIcon: Icon(Icons.search, color: kGray, size: 18.sp),
                    suffixIcon: IconButton(
                      icon: Icon(Icons.clear, color: kGray, size: 16.sp),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _isSearchVisible = false);
                      },
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 8.h),
                  ),
                ),
              )
            : Text("Other Expenses", style: appStyle(18, kDark, FontWeight.bold)),
        actions: [
          if (!_isSearchVisible)
            IconButton(
              icon: Icon(Icons.search_rounded, size: 22.sp, color: kDark),
              onPressed: () => setState(() => _isSearchVisible = true),
            ),
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert_rounded, size: 22.sp, color: kDark),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
            onSelected: (val) {
              // Handled below via Stream data
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'date_filter',
                child: Row(
                  children: [
                    Icon(Icons.date_range_rounded, size: 18.sp, color: kPrimary),
                    SizedBox(width: 8.w),
                    Text("Filter by Date", style: appStyle(13, kDark, FontWeight.normal)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddExpenseModal(),
        backgroundColor: kPrimary,
        icon: Icon(Icons.add_rounded, size: 20.sp, color: Colors.white),
        label: Text("Add Expense", style: appStyle(13, Colors.white, FontWeight.bold)),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore
            .collection('Users')
            .doc(_effectiveUserId)
            .collection('record_otherExpenses')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: kPrimary));
          }

          if (snapshot.hasError) {
            return Center(
              child: Text("Error loading expenses", style: appStyle(14, kRed, FontWeight.w500)),
            );
          }

          final List<OtherExpenseModel> allExpenses = [];
          if (snapshot.hasData) {
            for (var doc in snapshot.data!.docs) {
              final data = doc.data() as Map<String, dynamic>;
              if (data['active'] != false) {
                allExpenses.add(OtherExpenseModel.fromMap(data, doc.id));
              }
            }
          }

          // Sort descending by date
          allExpenses.sort((a, b) {
            final dateA = a.parsedDate?.millisecondsSinceEpoch ?? 0;
            final dateB = b.parsedDate?.millisecondsSinceEpoch ?? 0;
            return dateB.compareTo(dateA);
          });

          final filteredExpenses = _filterExpenses(allExpenses);

          // Calculate summary totals
          double totalCredit = 0.0;
          double totalDebit = 0.0;
          for (var exp in filteredExpenses) {
            if (exp.type == 'Credit') {
              totalCredit += exp.amount;
            } else {
              totalDebit += exp.amount;
            }
          }
          final netBalance = totalCredit - totalDebit;

          return Column(
            children: [
              // 1. Summary Cards Header
              Container(
                margin: EdgeInsets.fromLTRB(14.w, 4.h, 14.w, 8.h),
                padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      kPrimary.withOpacity(0.08),
                      Colors.orange.withOpacity(0.04),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(color: kPrimary.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    // Cash In (Credit)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.arrow_downward_rounded, size: 14.sp, color: Colors.green),
                              SizedBox(width: 4.w),
                              Text("Cash In", style: appStyle(11, Colors.green.shade700, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            "+\$${totalCredit.toStringAsFixed(2)}",
                            style: appStyle(14, Colors.green.shade800, FontWeight.bold),
                          ),
                        ],
                      ),
                    ),

                    Container(width: 1, height: 35.h, color: kGrayLight.withOpacity(0.5)),
                    SizedBox(width: 10.w),

                    // Cash Out (Debit)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.arrow_upward_rounded, size: 14.sp, color: kPrimary),
                              SizedBox(width: 4.w),
                              Text("Cash Out", style: appStyle(11, kPrimary, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            "-\$${totalDebit.toStringAsFixed(2)}",
                            style: appStyle(14, kPrimary, FontWeight.bold),
                          ),
                        ],
                      ),
                    ),

                    Container(width: 1, height: 35.h, color: kGrayLight.withOpacity(0.5)),
                    SizedBox(width: 10.w),

                    // Net Balance
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.account_balance_wallet_rounded, size: 14.sp, color: kDark),
                              SizedBox(width: 4.w),
                              Text("Net Balance", style: appStyle(11, kDark, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            "${netBalance >= 0 ? '+' : '-'}\$${netBalance.abs().toStringAsFixed(2)}",
                            style: appStyle(
                              14,
                              netBalance >= 0 ? Colors.green.shade800 : kPrimary,
                              FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Filter Tabs & Date indicator
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 14.w),
                child: Row(
                  children: [
                    // Type selector chips
                    ...["All", "Credit", "Debit"].map((type) {
                      final isSelected = _selectedTypeFilter == type;
                      return Padding(
                        padding: EdgeInsets.only(right: 6.w),
                        child: ChoiceChip(
                          label: Text(
                            type == "Credit"
                                ? "Cash In"
                                : (type == "Debit" ? "Cash Out" : "All"),
                            style: appStyle(
                              11,
                              isSelected ? Colors.white : kDark,
                              isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: type == "Credit"
                              ? Colors.green
                              : (type == "Debit" ? kPrimary : kDark),
                          backgroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(horizontal: 2.w),
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedTypeFilter = type);
                            }
                          },
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16.r),
                            side: BorderSide(
                              color: isSelected ? Colors.transparent : kGrayLight.withOpacity(0.5),
                              width: 0.8,
                            ),
                          ),
                        ),
                      );
                    }),

                    const Spacer(),

                    // Date range picker button
                    InkWell(
                      onTap: _pickDateRange,
                      borderRadius: BorderRadius.circular(8.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 6.h),
                        decoration: BoxDecoration(
                          color: _selectedDateRange != null ? kPrimary.withOpacity(0.1) : Colors.white,
                          borderRadius: BorderRadius.circular(8.r),
                          border: Border.all(
                            color: _selectedDateRange != null ? kPrimary : kGrayLight.withOpacity(0.5),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_month_rounded, size: 14.sp, color: _selectedDateRange != null ? kPrimary : kGray),
                            if (_selectedDateRange != null) ...[
                              SizedBox(width: 4.w),
                              Text(
                                "${DateFormat('dd/MM').format(_selectedDateRange!.start)} - ${DateFormat('dd/MM').format(_selectedDateRange!.end)}",
                                style: appStyle(10, kPrimary, FontWeight.bold),
                              ),
                              SizedBox(width: 4.w),
                              GestureDetector(
                                onTap: () => setState(() => _selectedDateRange = null),
                                child: Icon(Icons.close, size: 14.sp, color: kPrimary),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),

                    SizedBox(width: 6.w),

                    // Export menu (Excel & PDF)
                    PopupMenuButton<String>(
                      icon: Container(
                        padding: EdgeInsets.all(6.w),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8.r),
                          border: Border.all(color: kGrayLight.withOpacity(0.5)),
                        ),
                        child: Icon(Icons.download_rounded, size: 16.sp, color: kDark),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                      onSelected: (val) {
                        if (val == 'excel') {
                          _exportToExcel(filteredExpenses);
                        } else if (val == 'pdf') {
                          _exportToPdf(filteredExpenses);
                        }
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'excel',
                          child: Row(
                            children: [
                              Icon(Icons.table_chart_rounded, size: 18.sp, color: Colors.green),
                              SizedBox(width: 8.w),
                              Text("Export Excel (.xlsx)", style: appStyle(12, kDark, FontWeight.w500)),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'pdf',
                          child: Row(
                            children: [
                              Icon(Icons.picture_as_pdf_rounded, size: 18.sp, color: kRed),
                              SizedBox(width: 8.w),
                              Text("Print / Share PDF", style: appStyle(12, kDark, FontWeight.w500)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              SizedBox(height: 6.h),

              // 3. Transactions List
              Expanded(
                child: filteredExpenses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_rounded, size: 48.sp, color: kGrayLight),
                            SizedBox(height: 10.h),
                            Text("No expense records found", style: appStyle(14, kGray, FontWeight.bold)),
                            SizedBox(height: 4.h),
                            Text("Tap '+ Add Expense' to record a transaction", style: appStyle(12, kGrayLight, FontWeight.normal)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: EdgeInsets.fromLTRB(14.w, 4.h, 14.w, 80.h),
                        itemCount: filteredExpenses.length,
                        separatorBuilder: (_, __) => SizedBox(height: 10.h),
                        itemBuilder: (context, index) {
                          final item = filteredExpenses[index];
                          final isCredit = item.type == 'Credit';

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14.r),
                              border: Border.all(color: kGrayLight.withOpacity(0.35)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: InkWell(
                              onTap: () => _openAddExpenseModal(expenseToEdit: item),
                              borderRadius: BorderRadius.circular(14.r),
                              child: Padding(
                                padding: EdgeInsets.all(12.w),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Row 1: Date & Type Badge + Amount
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            // Date tag
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                                              decoration: BoxDecoration(
                                                color: kOffWhite,
                                                borderRadius: BorderRadius.circular(6.r),
                                              ),
                                              child: Text(
                                                item.formattedDisplayDate,
                                                style: appStyle(10, kDark, FontWeight.w500),
                                              ),
                                            ),
                                            SizedBox(width: 6.w),
                                            // Type tag
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.5.h),
                                              decoration: BoxDecoration(
                                                color: isCredit ? Colors.green.withOpacity(0.1) : kPrimary.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(6.r),
                                              ),
                                              child: Text(
                                                isCredit ? "Credit (Cash In)" : "Debit (Cash Out)",
                                                style: appStyle(9, isCredit ? Colors.green.shade700 : kPrimary, FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ),

                                        // Amount
                                        Text(
                                          "${isCredit ? '+' : '-'}\$${item.amount.toStringAsFixed(2)}",
                                          style: appStyle(
                                            15,
                                            isCredit ? Colors.green.shade700 : kPrimary,
                                            FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),

                                    SizedBox(height: 8.h),

                                    // Row 2: Service Name & Actions
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  item.serviceName,
                                                  style: appStyle(14, kDark, FontWeight.bold),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (item.isCustomService) ...[
                                                SizedBox(width: 6.w),
                                                Container(
                                                  padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 1.h),
                                                  decoration: BoxDecoration(
                                                    color: Colors.amber.withOpacity(0.15),
                                                    borderRadius: BorderRadius.circular(4.r),
                                                    border: Border.all(color: Colors.amber.shade400, width: 0.5),
                                                  ),
                                                  child: Text("Custom", style: appStyle(8, Colors.amber.shade900, FontWeight.bold)),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),

                                        // Edit & Delete actions
                                        PopupMenuButton<String>(
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          icon: Icon(Icons.more_horiz_rounded, color: kGray, size: 18.sp),
                                          onSelected: (action) {
                                            if (action == 'edit') {
                                              _openAddExpenseModal(expenseToEdit: item);
                                            } else if (action == 'delete') {
                                              _deleteExpense(item);
                                            }
                                          },
                                          itemBuilder: (context) => [
                                            PopupMenuItem(
                                              value: 'edit',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.edit_outlined, size: 16.sp, color: kPrimary),
                                                  SizedBox(width: 6.w),
                                                  Text("Edit", style: appStyle(12, kDark, FontWeight.normal)),
                                                ],
                                              ),
                                            ),
                                            PopupMenuItem(
                                              value: 'delete',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.delete_outline_rounded, size: 16.sp, color: kRed),
                                                  SizedBox(width: 6.w),
                                                  Text("Delete", style: appStyle(12, kRed, FontWeight.normal)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),

                                    // Row 3: Team, Vehicle & Company Chips
                                    if (item.teamMemberName.isNotEmpty ||
                                        item.vehicleNumber.isNotEmpty ||
                                        item.companyName.isNotEmpty) ...[
                                      SizedBox(height: 6.h),
                                      Wrap(
                                        spacing: 6.w,
                                        runSpacing: 4.h,
                                        children: [
                                          // Assigned Team Member Badge
                                          if (item.teamMemberName.isNotEmpty)
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 7.w, vertical: 2.5.h),
                                              decoration: BoxDecoration(
                                                color: Colors.green.withOpacity(0.08),
                                                borderRadius: BorderRadius.circular(6.r),
                                                border: Border.all(color: Colors.green.withOpacity(0.3), width: 0.6),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.person_rounded, size: 11.sp, color: Colors.green.shade700),
                                                  SizedBox(width: 3.w),
                                                  Text(
                                                    "${item.teamMemberName}${item.teamMemberRole.isNotEmpty ? ' (${item.teamMemberRole})' : ''}",
                                                    style: appStyle(10, Colors.green.shade800, FontWeight.bold),
                                                  ),
                                                ],
                                              ),
                                            ),

                                          // Vehicle Chip
                                          if (item.vehicleNumber.isNotEmpty)
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.5.h),
                                              decoration: BoxDecoration(
                                                color: Colors.blue.withOpacity(0.08),
                                                borderRadius: BorderRadius.circular(6.r),
                                                border: Border.all(color: Colors.blue.withOpacity(0.3), width: 0.6),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.directions_car_rounded, size: 11.sp, color: Colors.blue.shade700),
                                                  SizedBox(width: 3.w),
                                                  Text(item.vehicleNumber, style: appStyle(10, Colors.blue.shade800, FontWeight.w500)),
                                                ],
                                              ),
                                            ),

                                          // Company Chip
                                          if (item.companyName.isNotEmpty)
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.5.h),
                                              decoration: BoxDecoration(
                                                color: Colors.purple.withOpacity(0.08),
                                                borderRadius: BorderRadius.circular(6.r),
                                                border: Border.all(color: Colors.purple.withOpacity(0.3), width: 0.6),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.business_rounded, size: 11.sp, color: Colors.purple.shade700),
                                                  SizedBox(width: 3.w),
                                                  Text(item.companyName, style: appStyle(10, Colors.purple.shade800, FontWeight.w500)),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],

                                    // Row 4: Description / Notes
                                    if (item.description.isNotEmpty) ...[
                                      SizedBox(height: 6.h),
                                      Text(
                                        item.description,
                                        style: appStyle(11, kGray, FontWeight.normal),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
