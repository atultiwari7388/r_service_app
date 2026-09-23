import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:shimmer/shimmer.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/manageCheck/manage_check_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class PayInvoiceScreen extends StatefulWidget {
  const PayInvoiceScreen({super.key});

  @override
  State<PayInvoiceScreen> createState() => _PayInvoiceScreenState();
}

class _PayInvoiceScreenState extends State<PayInvoiceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final String currentUId = FirebaseAuth.instance.currentUser?.uid ?? '';

  String role = "";
  String? _ownerId;
  bool _isLoadingUser = true;

  String get _effectiveUserId {
    final rolesThatUseOwnerId = ['SubOwner', 'Manager', 'Accountant'];
    return (rolesThatUseOwnerId.contains(role) && _ownerId != null)
        ? _ownerId!
        : currentUId;
  }

  // Search and filter state
  final TextEditingController _searchController = TextEditingController();
  String _selectedVendor = 'All Vendors';

  // Selection state for unpaid invoices (recordId -> amount to pay)
  final Map<String, double> _selectedInvoices = {};
  final Map<String, TextEditingController> _customAmountControllers = {};

  // Direct payment state
  bool _isProcessingPayment = false;

  // Pagination - Invoices (Unpaid & Paid)
  static const int _pageSize = 20;
  final List<Map<String, dynamic>> _invoices = [];
  DocumentSnapshot? _lastInvoiceDoc;
  bool _isInitialLoadingInvoices = true;
  bool _isLoadingMoreInvoices = false;
  bool _hasMoreInvoices = true;
  String? _invoicesError;

  // Pagination - Payment History
  final List<Map<String, dynamic>> _historyPayments = [];
  DocumentSnapshot? _lastHistoryDoc;
  bool _isInitialLoadingHistory = true;
  bool _isLoadingMoreHistory = false;
  bool _hasMoreHistory = true;
  String? _historyError;

  // Scroll Controllers
  final ScrollController _unpaidScrollController = ScrollController();
  final ScrollController _paidScrollController = ScrollController();
  final ScrollController _historyScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    _searchController.addListener(() {
      if (mounted) setState(() {});
    });
    _setupScrollListeners();
    _fetchUserDetails();
  }

  void _setupScrollListeners() {
    _unpaidScrollController.addListener(() {
      if (_unpaidScrollController.hasClients) {
        final threshold =
            _unpaidScrollController.position.maxScrollExtent - 200;
        if (_unpaidScrollController.position.pixels >= threshold) {
          _fetchMoreInvoices();
        }
      }
    });

    _paidScrollController.addListener(() {
      if (_paidScrollController.hasClients) {
        final threshold = _paidScrollController.position.maxScrollExtent - 200;
        if (_paidScrollController.position.pixels >= threshold) {
          _fetchMoreInvoices();
        }
      }
    });

    _historyScrollController.addListener(() {
      if (_historyScrollController.hasClients) {
        final threshold =
            _historyScrollController.position.maxScrollExtent - 200;
        if (_historyScrollController.position.pixels >= threshold) {
          _fetchMoreHistory();
        }
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _unpaidScrollController.dispose();
    _paidScrollController.dispose();
    _historyScrollController.dispose();
    for (var controller in _customAmountControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchUserDetails() async {
    try {
      if (currentUId.isEmpty) return;
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            role = userData["role"] ?? "";
            _ownerId = userData["createdBy"];
            _isLoadingUser = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoadingUser = false);
      }

      // Trigger initial paginated fetches
      _fetchInitialInvoices();
      _fetchInitialHistory();
    } catch (e) {
      log("Error fetching user details: $e");
      if (mounted) setState(() => _isLoadingUser = false);
    }
  }

  // ==========================================
  // PAGINATED FIRESTORE FETCH METHODS
  // ==========================================

  // 1. Initial Invoices Fetch
  Future<void> _fetchInitialInvoices() async {
    if (!mounted) return;
    setState(() {
      _isInitialLoadingInvoices = true;
      _invoicesError = null;
      _hasMoreInvoices = true;
      _lastInvoiceDoc = null;
    });

    try {
      final query = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('DataServices')
          .limit(_pageSize);

      final querySnapshot = await query.get();
      final docs = querySnapshot.docs;

      if (!mounted) return;
      setState(() {
        _invoices.clear();
        for (var doc in docs) {
          final data = doc.data();
          _invoices.add({...data, 'id': doc.id});
        }
        _lastInvoiceDoc = docs.isNotEmpty ? docs.last : null;
        _hasMoreInvoices = docs.length == _pageSize;
        _isInitialLoadingInvoices = false;
      });
    } catch (e) {
      log("Error fetching initial invoices: $e");
      if (mounted) {
        setState(() {
          _invoicesError = e.toString();
          _isInitialLoadingInvoices = false;
        });
      }
    }
  }

  // 2. Fetch More Invoices (Pagination)
  Future<void> _fetchMoreInvoices() async {
    if (_isInitialLoadingInvoices ||
        _isLoadingMoreInvoices ||
        !_hasMoreInvoices ||
        _lastInvoiceDoc == null) {
      return;
    }

    setState(() => _isLoadingMoreInvoices = true);

    try {
      final query = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('DataServices')
          .startAfterDocument(_lastInvoiceDoc!)
          .limit(_pageSize);

      final querySnapshot = await query.get();
      final docs = querySnapshot.docs;

      if (!mounted) return;
      setState(() {
        for (var doc in docs) {
          final data = doc.data();
          _invoices.add({...data, 'id': doc.id});
        }
        _lastInvoiceDoc = docs.isNotEmpty ? docs.last : _lastInvoiceDoc;
        _hasMoreInvoices = docs.length == _pageSize;
        _isLoadingMoreInvoices = false;
      });
    } catch (e) {
      log("Error fetching more invoices: $e");
      if (mounted) {
        setState(() => _isLoadingMoreInvoices = false);
      }
    }
  }

  // 3. Initial Payment History Fetch
  Future<void> _fetchInitialHistory() async {
    if (!mounted) return;
    setState(() {
      _isInitialLoadingHistory = true;
      _historyError = null;
      _hasMoreHistory = true;
      _lastHistoryDoc = null;
    });

    try {
      final query = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('InvoicePayments')
          .orderBy('createdAt', descending: true)
          .limit(_pageSize);

      final querySnapshot = await query.get();
      final docs = querySnapshot.docs;

      if (!mounted) return;
      setState(() {
        _historyPayments.clear();
        for (var doc in docs) {
          final data = doc.data();
          _historyPayments.add({...data, 'id': doc.id});
        }
        _lastHistoryDoc = docs.isNotEmpty ? docs.last : null;
        _hasMoreHistory = docs.length == _pageSize;
        _isInitialLoadingHistory = false;
      });
    } catch (e) {
      log("Error fetching initial payment history: $e");
      if (mounted) {
        setState(() {
          _historyError = e.toString();
          _isInitialLoadingHistory = false;
        });
      }
    }
  }

  // 4. Fetch More Payment History (Pagination)
  Future<void> _fetchMoreHistory() async {
    if (_isInitialLoadingHistory ||
        _isLoadingMoreHistory ||
        !_hasMoreHistory ||
        _lastHistoryDoc == null) {
      return;
    }

    setState(() => _isLoadingMoreHistory = true);

    try {
      final query = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('InvoicePayments')
          .orderBy('createdAt', descending: true)
          .startAfterDocument(_lastHistoryDoc!)
          .limit(_pageSize);

      final querySnapshot = await query.get();
      final docs = querySnapshot.docs;

      if (!mounted) return;
      setState(() {
        for (var doc in docs) {
          final data = doc.data();
          _historyPayments.add({...data, 'id': doc.id});
        }
        _lastHistoryDoc = docs.isNotEmpty ? docs.last : _lastHistoryDoc;
        _hasMoreHistory = docs.length == _pageSize;
        _isLoadingMoreHistory = false;
      });
    } catch (e) {
      log("Error fetching more payment history: $e");
      if (mounted) {
        setState(() => _isLoadingMoreHistory = false);
      }
    }
  }

  // Parse numeric amount safely from dynamic field
  double _parseAmount(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final str = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(str) ?? 0.0;
  }

  // Parse date safely from Firestore (Timestamp or String)
  DateTime _parseDate(dynamic val) {
    if (val == null) return DateTime(1970);
    if (val is Timestamp) return val.toDate();
    if (val is String) {
      try {
        return DateTime.parse(val);
      } catch (_) {
        try {
          return DateFormat("MM/dd/yyyy").parse(val);
        } catch (_) {}
      }
    }
    return DateTime(1970);
  }

  // Extract workshop/vendor name from record
  String _getVendorName(Map<String, dynamic> record) {
    final ws = record['workshop']?.toString().trim();
    if (ws != null && ws.isNotEmpty && ws.toLowerCase() != 'n/a') return ws;
    final vn = record['vendorName']?.toString().trim();
    if (vn != null && vn.isNotEmpty && vn.toLowerCase() != 'n/a') return vn;
    return 'Other Vendor';
  }

  // Extract vehicle number
  String _getVehicleNumber(Map<String, dynamic> record) {
    final vNum = record['vehicleNumber']?.toString().trim();
    if (vNum != null && vNum.isNotEmpty) return vNum;
    final vDetails = record['vehicleDetails'];
    if (vDetails is Map && vDetails['vehicleNumber'] != null) {
      return vDetails['vehicleNumber'].toString();
    }
    return 'N/A';
  }

  // Extract invoice number
  String _getInvoiceNumber(Map<String, dynamic> record) {
    final inv = record['invoice']?.toString().trim();
    if (inv != null && inv.isNotEmpty) return inv;
    final invNum = record['invoiceNumber']?.toString().trim();
    if (invNum != null && invNum.isNotEmpty) return invNum;
    return 'N/A';
  }

  // Compute total selected amount
  double get _totalSelectedAmount {
    return _selectedInvoices.values.fold(0.0, (sum, val) => sum + val);
  }

  // Helper to get custom controller for an invoice
  TextEditingController _getAmountController(String id, double initialAmount) {
    if (!_customAmountControllers.containsKey(id)) {
      _customAmountControllers[id] = TextEditingController(
        text: initialAmount.toStringAsFixed(2),
      );
    }
    return _customAmountControllers[id]!;
  }

  // Navigate to ManageCheckScreen with prefilled invoice data
  void _proceedToWriteCheck(List<Map<String, dynamic>> allUnpaidRecords) {
    if (_selectedInvoices.isEmpty) {
      showToastMessage("Notice",
          "Please select at least one invoice to write a check", Colors.orange);
      return;
    }

    final selectedRecords = allUnpaidRecords
        .where((r) => _selectedInvoices.containsKey(r['id']))
        .toList();

    if (selectedRecords.isEmpty) return;

    // Use vendor name of selected invoices
    String payee = _selectedVendor != 'All Vendors'
        ? _selectedVendor
        : _getVendorName(selectedRecords.first);

    // Map each invoice into serviceDetails
    final List<Map<String, dynamic>> serviceDetails = selectedRecords.map((r) {
      final invNum = _getInvoiceNumber(r);
      final vNum = _getVehicleNumber(r);
      final desc = r['description']?.toString().trim();
      final displayDesc =
          (desc != null && desc.isNotEmpty) ? desc : 'Inv #$invNum ($vNum)';
      final payAmt = _selectedInvoices[r['id']] ?? 0.0;
      return <String, dynamic>{
        'serviceName': displayDesc,
        'amount': payAmt,
      };
    }).toList();

    while (serviceDetails.length < 5) {
      serviceDetails.add(<String, dynamic>{'serviceName': '', 'amount': 0.0});
    }

    // Attach invoice records for post-save Firestore updates
    final List<Map<String, dynamic>> attachedInvoices =
        selectedRecords.map((r) {
      return <String, dynamic>{
        'recordId': r['id']?.toString() ?? '',
        'invoiceNumber': _getInvoiceNumber(r),
        'vehicleNumber': _getVehicleNumber(r),
        'amount': _selectedInvoices[r['id']] ?? 0.0,
        'description':
            r['description']?.toString() ?? 'Inv #${_getInvoiceNumber(r)}',
      };
    }).toList();

    Get.to(() => ManageCheckScreen(
          initialType: 'Vendor',
          initialPayee: payee,
          initialUserId:
              'vendor_${payee.replaceAll(RegExp(r'\s+'), '_').toLowerCase()}',
          initialTotalAmount: _totalSelectedAmount,
          initialServiceDetails: serviceDetails,
          attachedInvoices: attachedInvoices,
          autoOpenWriteCheck: true,
        ))?.then((_) {
      // Refresh list on return in case checks were saved
      _fetchInitialInvoices();
      _fetchInitialHistory();
    });
  }

  // Show Direct Payment Bottom Sheet (Card, Bank, Cash, Zelle, Other)
  void _showDirectPaymentSheet(List<Map<String, dynamic>> allUnpaidRecords) {
    if (_selectedInvoices.isEmpty) {
      showToastMessage(
          "Notice", "Please select at least one invoice to pay", Colors.orange);
      return;
    }

    final selectedRecords = allUnpaidRecords
        .where((r) => _selectedInvoices.containsKey(r['id']))
        .toList();

    String selectedMethod = 'Other';
    final txIdController = TextEditingController();
    final notesController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: EdgeInsets.only(
                top: 20.h,
                left: 16.w,
                right: 16.w,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20.h,
              ),
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
              ),
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40.w,
                          height: 4.h,
                          decoration: BoxDecoration(
                            color: kGrayLight,
                            borderRadius: BorderRadius.circular(2.r),
                          ),
                        ),
                      ),
                      SizedBox(height: 15.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Record Payment",
                            style: appStyle(18, kDark, FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: kGray),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                      const Divider(color: kGrayLight),
                      SizedBox(height: 10.h),
                      Container(
                        padding: EdgeInsets.all(12.w),
                        decoration: BoxDecoration(
                          color: kPrimary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10.r),
                          border: Border.all(color: kPrimary.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "${_selectedInvoices.length} Invoices Selected",
                                  style:
                                      appStyle(13, kDarkGray, FontWeight.w500),
                                ),
                                SizedBox(height: 4.h),
                                Text(
                                  "Vendor: ${_selectedVendor != 'All Vendors' ? _selectedVendor : _getVendorName(selectedRecords.first)}",
                                  style: appStyle(12, kGray, FontWeight.normal),
                                ),
                              ],
                            ),
                            Text(
                              "\$${_totalSelectedAmount.toStringAsFixed(2)}",
                              style: appStyle(20, kPrimary, FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 16.h),
                      Text("Payment Method",
                          style: appStyle(14, kDark, FontWeight.w600)),
                      SizedBox(height: 6.h),
                      DropdownButtonFormField<String>(
                        value: selectedMethod,
                        decoration: InputDecoration(
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12.w, vertical: 12.h),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                        ),
                        items: [
                          'Check',
                          'Credit Card',
                          'Debit Card',
                          'Bank Transfer',
                          'Cash',
                          'Zelle',
                          'Other'
                        ]
                            .map((m) =>
                                DropdownMenuItem(value: m, child: Text(m)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setSheetState(() => selectedMethod = val);
                          }
                        },
                      ),
                      SizedBox(height: 14.h),
                      Text("Transaction / Reference ID (Optional)",
                          style: appStyle(14, kDark, FontWeight.w600)),
                      SizedBox(height: 6.h),
                      TextFormField(
                        controller: txIdController,
                        decoration: InputDecoration(
                          hintText: "e.g. TXN-984723",
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12.w, vertical: 12.h),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                        ),
                      ),
                      SizedBox(height: 14.h),
                      Text("Notes / Description (Optional)",
                          style: appStyle(14, kDark, FontWeight.w600)),
                      SizedBox(height: 6.h),
                      TextFormField(
                        controller: notesController,
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: "Optional payment notes...",
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12.w, vertical: 12.h),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                        ),
                      ),
                      SizedBox(height: 20.h),
                      CustomButton(
                        text: _isProcessingPayment
                            ? "Processing..."
                            : "Confirm Payment (\$${_totalSelectedAmount.toStringAsFixed(2)})",
                        color: kSecondary,
                        height: 48.h,
                        onPress: _isProcessingPayment
                            ? null
                            : () async {
                                Navigator.pop(context);
                                await _executeDirectPayment(
                                  selectedRecords: selectedRecords,
                                  paymentMethod: selectedMethod,
                                  transactionId: txIdController.text.trim(),
                                  description: notesController.text.trim(),
                                );
                              },
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // Execute Direct Payment in Firestore
  Future<void> _executeDirectPayment({
    required List<Map<String, dynamic>> selectedRecords,
    required String paymentMethod,
    required String transactionId,
    required String description,
  }) async {
    setState(() => _isProcessingPayment = true);

    try {
      final batch = FirebaseFirestore.instance.batch();
      final now = DateTime.now();
      final nowIso = now.toIso8601String();
      final paymentId =
          "PAY-${now.millisecondsSinceEpoch.toString().substring(7)}";

      // Fetch team members under effective user for synchronization
      final teamMembersSnap = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: _effectiveUserId)
          .where('isTeamMember', isEqualTo: true)
          .get();
      final memberIds = teamMembersSnap.docs.map((d) => d.id).toList();

      final List<Map<String, dynamic>> invoiceLedgerDetails = [];

      for (var record in selectedRecords) {
        final recId = record['id']?.toString() ?? '';
        if (recId.isEmpty) continue;

        final invTotal = _parseAmount(record['invoiceAmount']);
        final prevPaid = _parseAmount(record['paidAmount']);
        final payAmt = _selectedInvoices[recId] ?? 0.0;
        final newPaid = prevPaid + payAmt;
        final newBalance = (invTotal - newPaid).clamp(0.0, double.infinity);
        final newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

        final existingHistory = (record['paymentHistory'] is List)
            ? List<Map<String, dynamic>>.from(record['paymentHistory'])
            : <Map<String, dynamic>>[];

        existingHistory.add({
          'paymentId': paymentId,
          'amount': payAmt,
          'date': nowIso,
          'method': paymentMethod,
          'transactionId': transactionId,
          'description': description,
          'recordedBy': currentUId,
        });

        final updatePayload = {
          'paidAmount': newPaid,
          'balanceAmount': newBalance,
          'paymentStatus': newStatus,
          'paymentMethod': paymentMethod,
          'lastPaidDate': nowIso,
          'paymentHistory': existingHistory,
          'updatedAt': FieldValue.serverTimestamp(),
        };

        // 1. Update under Owner/Effective User
        final ownerRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(_effectiveUserId)
            .collection('DataServices')
            .doc(recId);
        final ownerSnap = await ownerRef.get();
        if (ownerSnap.exists) {
          batch.set(ownerRef, updatePayload, SetOptions(merge: true));
        }

        // 2. Sync with each team member
        for (final mId in memberIds) {
          final memberRef = FirebaseFirestore.instance
              .collection('Users')
              .doc(mId)
              .collection('DataServices')
              .doc(recId);
          final mSnap = await memberRef.get();
          if (mSnap.exists) {
            batch.set(memberRef, updatePayload, SetOptions(merge: true));
          }
        }

        invoiceLedgerDetails.add({
          'recordId': recId,
          'invoiceNumber': _getInvoiceNumber(record),
          'vehicleNumber': _getVehicleNumber(record),
          'amountPaid': payAmt,
          'remainingBalance': newBalance,
        });
      }

      // Master Payment Ledger Entry
      final ledgerRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .collection('InvoicePayments')
          .doc();

      final payeeName = _selectedVendor != 'All Vendors'
          ? _selectedVendor
          : _getVendorName(selectedRecords.first);

      final ledgerData = {
        'id': ledgerRef.id,
        'paymentId': paymentId,
        'ownerId': _effectiveUserId,
        'vendorName': payeeName,
        'totalAmount': _totalSelectedAmount,
        'paymentMethod': paymentMethod,
        if (transactionId.isNotEmpty) 'transactionId': transactionId,
        if (description.isNotEmpty) 'description': description,
        'invoices': invoiceLedgerDetails,
        'createdAt': FieldValue.serverTimestamp(),
        'createdBy': currentUId,
      };

      batch.set(ledgerRef, ledgerData);

      await batch.commit();

      setState(() {
        _selectedInvoices.clear();
        _isProcessingPayment = false;
      });

      showToastMessage(
        "Success",
        "Payment of \$${ledgerData['totalAmount']} recorded successfully!",
        Colors.green,
      );

      // Refresh list to reflect updated balances
      _fetchInitialInvoices();
      _fetchInitialHistory();
    } catch (e) {
      log("Error processing payment: $e");
      setState(() => _isProcessingPayment = false);
      showToastMessage("Error", "Failed to record payment: $e", Colors.red);
    }
  }

  // Print / Share PDF Receipt for a Payment Ledger Item
  Future<void> _printPaymentReceipt(Map<String, dynamic> payment) async {
    final pdf = pw.Document();
    final paymentId = payment['paymentId'] ?? payment['id'] ?? 'N/A';
    final vendorName = payment['vendorName'] ?? 'Vendor';
    final totalAmount = _parseAmount(payment['totalAmount']);
    final paymentMethod = payment['paymentMethod'] ?? 'N/A';
    final transactionId =
        payment['transactionId'] ?? payment['checkNumber'] ?? '';
    final createdAt = _parseDate(payment['createdAt']);
    final formattedDate = DateFormat("MM/dd/yyyy hh:mm a").format(createdAt);
    final invoices =
        (payment['invoices'] is List) ? payment['invoices'] as List : [];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        "PAYMENT RECEIPT",
                        style: pw.TextStyle(
                          fontSize: 22,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.pink700,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        "Receipt ID: $paymentId",
                        style: const pw.TextStyle(
                            fontSize: 12, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        "Date: $formattedDate",
                        style: const pw.TextStyle(
                            fontSize: 11, color: PdfColors.grey700),
                      ),
                      pw.Text(
                        "Method: $paymentMethod",
                        style: pw.TextStyle(
                            fontSize: 11, fontWeight: pw.FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 20),
              pw.Divider(color: PdfColors.grey400),
              pw.SizedBox(height: 10),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text("Paid To:",
                          style: const pw.TextStyle(
                              fontSize: 10, color: PdfColors.grey600)),
                      pw.Text(vendorName.toUpperCase(),
                          style: pw.TextStyle(
                              fontSize: 14, fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                  if (transactionId.isNotEmpty)
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text("Reference / Check #:",
                            style: const pw.TextStyle(
                                fontSize: 10, color: PdfColors.grey600)),
                        pw.Text(transactionId,
                            style: pw.TextStyle(
                                fontSize: 12, fontWeight: pw.FontWeight.bold)),
                      ],
                    ),
                ],
              ),
              pw.SizedBox(height: 20),
              pw.Text(
                "Settled Invoices",
                style:
                    pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 8),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300),
                children: [
                  pw.TableRow(
                    decoration:
                        const pw.BoxDecoration(color: PdfColors.grey100),
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text("Invoice #",
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 10)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text("Vehicle",
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 10)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text("Amount Paid",
                            textAlign: pw.TextAlign.right,
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 10)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text("Remaining Balance",
                            textAlign: pw.TextAlign.right,
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 10)),
                      ),
                    ],
                  ),
                  ...invoices.map((inv) {
                    final invNum = inv['invoiceNumber'] ?? 'N/A';
                    final vNum = inv['vehicleNumber'] ?? 'N/A';
                    final amt = _parseAmount(inv['amountPaid']);
                    final rem = _parseAmount(inv['remainingBalance']);
                    return pw.TableRow(
                      children: [
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text(invNum.toString(),
                              style: const pw.TextStyle(fontSize: 10)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text(vNum.toString(),
                              style: const pw.TextStyle(fontSize: 10)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text("\$${amt.toStringAsFixed(2)}",
                              textAlign: pw.TextAlign.right,
                              style: const pw.TextStyle(fontSize: 10)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text("\$${rem.toStringAsFixed(2)}",
                              textAlign: pw.TextAlign.right,
                              style: const pw.TextStyle(fontSize: 10)),
                        ),
                      ],
                    );
                  }).toList(),
                ],
              ),
              pw.SizedBox(height: 20),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Text("Total Paid:  ",
                      style: pw.TextStyle(
                          fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.Text(
                    "\$${totalAmount.toStringAsFixed(2)}",
                    style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.pink700),
                  ),
                ],
              ),
              pw.Spacer(),
              pw.Divider(color: PdfColors.grey400),
              pw.Center(
                child: pw.Text(
                  "Thank you for your business! - $appName",
                  style: const pw.TextStyle(
                      fontSize: 10, color: PdfColors.grey600),
                ),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  Widget _buildCustomTab({required String title, required int index}) {
    final isSelected = _tabController.index == index;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 7.h),
      decoration: BoxDecoration(
        color: isSelected ? Colors.transparent : kWhite,
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(
          color: isSelected ? Colors.transparent : kGrayLight.withOpacity(0.5),
        ),
      ),
      child: Center(
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12.sp,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? kWhite : kDark,
          ),
        ),
      ),
    );
  }

  // Skeleton / Shimmer placeholder loader
  Widget _buildSkeletonLoading() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Container(
          margin: EdgeInsets.only(bottom: 10.h),
          padding: EdgeInsets.all(12.w),
          decoration: BoxDecoration(
            color: kWhite,
            borderRadius: BorderRadius.circular(10.r),
            border: Border.all(color: kGrayLight.withOpacity(0.4)),
          ),
          child: Shimmer.fromColors(
            baseColor: Colors.grey.shade300,
            highlightColor: Colors.grey.shade100,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 110.w,
                      height: 16.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    Container(
                      width: 70.w,
                      height: 14.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 10.h),
                Row(
                  children: [
                    Container(
                      width: 80.w,
                      height: 12.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    SizedBox(width: 14.w),
                    Container(
                      width: 120.w,
                      height: 12.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 60.w,
                      height: 14.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    Container(
                      width: 60.w,
                      height: 14.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    Container(
                      width: 80.w,
                      height: 16.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Error UI with Retry
  Widget _buildErrorState(String error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(20.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Feather.alert_circle, size: 48, color: Colors.redAccent),
            SizedBox(height: 12.h),
            Text("Failed to load invoices",
                style: appStyle(16, kDark, FontWeight.bold)),
            SizedBox(height: 6.h),
            Text(
              error,
              textAlign: TextAlign.center,
              style: appStyle(12, kGray, FontWeight.normal),
            ),
            SizedBox(height: 16.h),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text("Retry"),
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary,
                foregroundColor: kWhite,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.r),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingUser) {
      return Scaffold(
        backgroundColor: kLightWhite,
        appBar: AppBar(
          backgroundColor: kLightWhite,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: kDark),
            onPressed: () => Get.back(),
          ),
          title:
              Text("Pay Invoice", style: appStyle(18, kDark, FontWeight.bold)),
        ),
        body: const Center(child: CircularProgressIndicator(color: kPrimary)),
      );
    }

    // 1. Separate Unpaid and Paid from loaded _invoices
    final unpaidRecords = _invoices.where((r) {
      final total = _parseAmount(r['invoiceAmount']);
      final paid = _parseAmount(r['paidAmount']);
      final balance = r['balanceAmount'] != null
          ? _parseAmount(r['balanceAmount'])
          : (total - paid);
      final status = r['paymentStatus']?.toString().toLowerCase() ?? '';
      return status != 'paid' && balance > 0;
    }).toList();

    // Sort Unpaid records from OLDEST to NEWEST
    unpaidRecords.sort((a, b) {
      final dateA = _parseDate(a['date'] ?? a['createdAt']);
      final dateB = _parseDate(b['date'] ?? b['createdAt']);
      return dateA.compareTo(dateB);
    });

    final paidRecords = _invoices.where((r) {
      final total = _parseAmount(r['invoiceAmount']);
      final paid = _parseAmount(r['paidAmount']);
      final balance = r['balanceAmount'] != null
          ? _parseAmount(r['balanceAmount'])
          : (total - paid);
      final status = r['paymentStatus']?.toString().toLowerCase() ?? '';
      return status == 'paid' || (total > 0 && balance <= 0);
    }).toList();

    // Sort Paid records from NEWEST to OLDEST
    paidRecords.sort((a, b) {
      final dateA = _parseDate(a['date'] ?? a['createdAt']);
      final dateB = _parseDate(b['date'] ?? b['createdAt']);
      return dateB.compareTo(dateA);
    });

    // Extract unique vendors from unpaid records
    final Set<String> vendorSet = {'All Vendors'};
    for (var r in unpaidRecords) {
      vendorSet.add(_getVendorName(r));
    }
    final vendorList = vendorSet.toList();

    return Scaffold(
      backgroundColor: kLightWhite,
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: kDark),
          onPressed: () => Get.back(),
        ),
        title: Text("Pay Invoice", style: appStyle(20, kDark, FontWeight.bold)),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(56.h),
          child: Container(
            width: double.infinity,
            alignment: Alignment.centerLeft,
            padding: EdgeInsets.only(left: 12.w, right: 12.w, bottom: 8.h),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              padding: EdgeInsets.zero,
              labelPadding: EdgeInsets.symmetric(horizontal: 4.w),
              indicatorSize: TabBarIndicatorSize.label,
              dividerColor: Colors.transparent,
              indicator: BoxDecoration(
                borderRadius: BorderRadius.circular(24.r),
                color: kPrimary,
                boxShadow: [
                  BoxShadow(
                    color: kPrimary.withOpacity(0.35),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              labelColor: kWhite,
              unselectedLabelColor: kDarkGray,
              labelStyle: appStyle(13, kWhite, FontWeight.bold),
              unselectedLabelStyle: appStyle(13, kDarkGray, FontWeight.w500),
              tabs: [
                _buildCustomTab(title: "Unpaid Invoices", index: 0),
                _buildCustomTab(title: "Paid Invoices", index: 1),
                _buildCustomTab(title: "Payment History", index: 2),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: UNPAID INVOICES
          _isInitialLoadingInvoices
              ? _buildSkeletonLoading()
              : _invoicesError != null
                  ? _buildErrorState(_invoicesError!, _fetchInitialInvoices)
                  : _buildUnpaidInvoicesTab(unpaidRecords, vendorList),

          // TAB 2: PAID INVOICES
          _isInitialLoadingInvoices
              ? _buildSkeletonLoading()
              : _invoicesError != null
                  ? _buildErrorState(_invoicesError!, _fetchInitialInvoices)
                  : _buildPaidInvoicesTab(paidRecords),

          // TAB 3: PAYMENT HISTORY
          _isInitialLoadingHistory
              ? _buildSkeletonLoading()
              : _historyError != null
                  ? _buildErrorState(_historyError!, _fetchInitialHistory)
                  : _buildPaymentHistoryTab(),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: UNPAID INVOICES
  // ==========================================
  Widget _buildUnpaidInvoicesTab(
    List<Map<String, dynamic>> unpaidRecords,
    List<String> vendorList,
  ) {
    // Filter by Search and Vendor
    final filtered = unpaidRecords.where((r) {
      final vendorName = _getVendorName(r);
      if (_selectedVendor != 'All Vendors' && vendorName != _selectedVendor) {
        return false;
      }
      final q = _searchController.text.trim().toLowerCase();
      if (q.isNotEmpty) {
        final invNum = _getInvoiceNumber(r).toLowerCase();
        final vNum = _getVehicleNumber(r).toLowerCase();
        final desc = (r['description'] ?? '').toString().toLowerCase();
        final ws = vendorName.toLowerCase();
        return invNum.contains(q) ||
            vNum.contains(q) ||
            desc.contains(q) ||
            ws.contains(q);
      }
      return true;
    }).toList();

    final allFilteredSelected = filtered.isNotEmpty &&
        filtered.every((r) => _selectedInvoices.containsKey(r['id']));

    return Column(
      children: [
        // Top Filter & Search Controls
        Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
          color: kWhite,
          child: Column(
            children: [
              // Search Input
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: "Search invoice #, vehicle, vendor...",
                  hintStyle: appStyle(13, kGray, FontWeight.normal),
                  prefixIcon:
                      const Icon(Feather.search, color: kGray, size: 18),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: kGray, size: 18),
                          onPressed: () => _searchController.clear(),
                        )
                      : null,
                  contentPadding: EdgeInsets.symmetric(vertical: 8.h),
                  filled: true,
                  fillColor: kOffWhite,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8.r),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              SizedBox(height: 8.h),
              // Vendor Dropdown & Select All Row
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 38.h,
                      padding: EdgeInsets.symmetric(horizontal: 10.w),
                      decoration: BoxDecoration(
                        color: kOffWhite,
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(color: kGrayLight.withOpacity(0.5)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: vendorList.contains(_selectedVendor)
                              ? _selectedVendor
                              : 'All Vendors',
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down, color: kDark),
                          style: appStyle(12, kDark, FontWeight.w500),
                          items: vendorList.map<DropdownMenuItem<String>>((v) {
                            return DropdownMenuItem<String>(
                              value: v,
                              child: Text(v, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedVendor = val);
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 8.w),
                  // Select All Button
                  InkWell(
                    onTap: () {
                      setState(() {
                        if (allFilteredSelected) {
                          // Deselect all filtered
                          for (var r in filtered) {
                            _selectedInvoices.remove(r['id']);
                          }
                        } else {
                          // Select all filtered
                          for (var r in filtered) {
                            final total = _parseAmount(r['invoiceAmount']);
                            final paid = _parseAmount(r['paidAmount']);
                            final bal = r['balanceAmount'] != null
                                ? _parseAmount(r['balanceAmount'])
                                : (total - paid);
                            _selectedInvoices[r['id']] = bal;
                            final c = _getAmountController(r['id'], bal);
                            c.text = bal.toStringAsFixed(2);
                          }
                        }
                      });
                    },
                    child: Container(
                      height: 38.h,
                      padding: EdgeInsets.symmetric(horizontal: 10.w),
                      decoration: BoxDecoration(
                        color: allFilteredSelected ? kPrimary : kOffWhite,
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(
                            color: allFilteredSelected
                                ? kPrimary
                                : kGrayLight.withOpacity(0.5)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            allFilteredSelected
                                ? Icons.check_box
                                : Icons.check_box_outline_blank,
                            size: 16,
                            color: allFilteredSelected ? kWhite : kDark,
                          ),
                          SizedBox(width: 4.w),
                          Text(
                            allFilteredSelected ? "Deselect All" : "Select All",
                            style: appStyle(
                              12,
                              allFilteredSelected ? kWhite : kDark,
                              FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // List of Unpaid Invoices with Pagination and Pull to Refresh
        Expanded(
          child: RefreshIndicator(
            color: kPrimary,
            onRefresh: _fetchInitialInvoices,
            child: filtered.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: 120.h),
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Feather.check_circle,
                                size: 48, color: kSecondary),
                            SizedBox(height: 12.h),
                            Text("No unpaid invoices found!",
                                style: appStyle(15, kDark, FontWeight.w600)),
                            SizedBox(height: 4.h),
                            Text("All invoices are settled up.",
                                style: appStyle(12, kGray, FontWeight.normal)),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _unpaidScrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.only(
                      left: 12.w,
                      right: 12.w,
                      top: 10.h,
                      bottom: _selectedInvoices.isNotEmpty ? 90.h : 20.h,
                    ),
                    itemCount: filtered.length + (_hasMoreInvoices ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == filtered.length) {
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          child: Center(
                            child: _isLoadingMoreInvoices
                                ? SizedBox(
                                    width: 24.w,
                                    height: 24.w,
                                    child: const CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: kPrimary,
                                    ),
                                  )
                                : const SizedBox.shrink(),
                          ),
                        );
                      }

                      final record = filtered[index];
                      final recId = record['id'] ?? '';
                      final isSelected = _selectedInvoices.containsKey(recId);
                      final total = _parseAmount(record['invoiceAmount']);
                      final paid = _parseAmount(record['paidAmount']);
                      final balance = record['balanceAmount'] != null
                          ? _parseAmount(record['balanceAmount'])
                          : (total - paid);
                      final invNum = _getInvoiceNumber(record);
                      final vNum = _getVehicleNumber(record);
                      final vendor = _getVendorName(record);
                      final date =
                          _parseDate(record['date'] ?? record['createdAt']);
                      final formattedDate =
                          DateFormat("MM/dd/yyyy").format(date);
                      final isPartiallyPaid = paid > 0 && balance > 0;

                      return Container(
                        margin: EdgeInsets.only(bottom: 10.h),
                        decoration: BoxDecoration(
                          color: kWhite,
                          borderRadius: BorderRadius.circular(10.r),
                          border: Border.all(
                            color: isSelected
                                ? kPrimary
                                : kGrayLight.withOpacity(0.4),
                            width: isSelected ? 1.5 : 1.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            ListTile(
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 10.w, vertical: 4.h),
                              leading: Checkbox(
                                value: isSelected,
                                activeColor: kPrimary,
                                onChanged: (val) {
                                  setState(() {
                                    if (val == true) {
                                      _selectedInvoices[recId] = balance;
                                      final c =
                                          _getAmountController(recId, balance);
                                      c.text = balance.toStringAsFixed(2);
                                    } else {
                                      _selectedInvoices.remove(recId);
                                    }
                                  });
                                },
                              ),
                              title: Row(
                                children: [
                                  Text(
                                    "Inv #$invNum",
                                    style: appStyle(14, kDark, FontWeight.bold),
                                  ),
                                  SizedBox(width: 6.w),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 6.w, vertical: 2.h),
                                    decoration: BoxDecoration(
                                      color: isPartiallyPaid
                                          ? Colors.blue.withOpacity(0.12)
                                          : Colors.amber.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(4.r),
                                    ),
                                    child: Text(
                                      isPartiallyPaid
                                          ? "Partially Paid"
                                          : "Unpaid",
                                      style: appStyle(
                                        10,
                                        isPartiallyPaid
                                            ? Colors.blue.shade700
                                            : Colors.amber.shade900,
                                        FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    formattedDate,
                                    style:
                                        appStyle(11, kGray, FontWeight.normal),
                                  ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: EdgeInsets.only(top: 6.h),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                            MaterialCommunityIcons
                                                .truck_outline,
                                            size: 14,
                                            color: kGray),
                                        SizedBox(width: 4.w),
                                        Text(vNum,
                                            style: appStyle(12, kDarkGray,
                                                FontWeight.w500)),
                                        SizedBox(width: 12.w),
                                        Icon(
                                            MaterialCommunityIcons
                                                .store_outline,
                                            size: 14,
                                            color: kGray),
                                        SizedBox(width: 4.w),
                                        Expanded(
                                          child: Text(
                                            vendor,
                                            style: appStyle(
                                                12, kDarkGray, FontWeight.w500),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 8.h),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text("Total",
                                                style: appStyle(10, kGray,
                                                    FontWeight.normal)),
                                            Text(
                                                "\$${total.toStringAsFixed(2)}",
                                                style: appStyle(12, kDark,
                                                    FontWeight.w600)),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text("Paid",
                                                style: appStyle(10, kGray,
                                                    FontWeight.normal)),
                                            Text("\$${paid.toStringAsFixed(2)}",
                                                style: appStyle(12, kSecondary,
                                                    FontWeight.w600)),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.end,
                                          children: [
                                            Text("Balance Due",
                                                style: appStyle(10, kGray,
                                                    FontWeight.normal)),
                                            Text(
                                                "\$${balance.toStringAsFixed(2)}",
                                                style: appStyle(14, kPrimary,
                                                    FontWeight.bold)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Custom partial payment amount row if selected
                            if (isSelected) ...[
                              const Divider(height: 1, color: kOffWhite),
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 14.w, vertical: 8.h),
                                color: kPrimary.withOpacity(0.03),
                                child: Row(
                                  children: [
                                    Text(
                                      "Amount to Pay:",
                                      style:
                                          appStyle(12, kDark, FontWeight.w600),
                                    ),
                                    SizedBox(width: 8.w),
                                    Expanded(
                                      child: SizedBox(
                                        height: 32.h,
                                        child: TextField(
                                          controller: _getAmountController(
                                              recId, balance),
                                          keyboardType: const TextInputType
                                              .numberWithOptions(decimal: true),
                                          style: appStyle(
                                              12, kDark, FontWeight.w600),
                                          decoration: InputDecoration(
                                            prefixText: "\$ ",
                                            contentPadding:
                                                EdgeInsets.symmetric(
                                                    horizontal: 8.w,
                                                    vertical: 4.h),
                                            filled: true,
                                            fillColor: kWhite,
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(6.r),
                                              borderSide: const BorderSide(
                                                  color: kGrayLight),
                                            ),
                                          ),
                                          onChanged: (val) {
                                            final parsed =
                                                double.tryParse(val) ?? 0.0;
                                            setState(() {
                                              _selectedInvoices[recId] = parsed;
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                    SizedBox(width: 6.w),
                                    InkWell(
                                      onTap: () {
                                        setState(() {
                                          _selectedInvoices[recId] = balance;
                                          final c = _getAmountController(
                                              recId, balance);
                                          c.text = balance.toStringAsFixed(2);
                                        });
                                      },
                                      child: Container(
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 8.w, vertical: 6.h),
                                        decoration: BoxDecoration(
                                          color: kOffWhite,
                                          borderRadius:
                                              BorderRadius.circular(6.r),
                                          border: Border.all(color: kGrayLight),
                                        ),
                                        child: Text(
                                          "Full",
                                          style: appStyle(
                                              11, kPrimary, FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ),

        // Bottom Sticky Payment Summary Bar
        if (_selectedInvoices.isNotEmpty)
          Container(
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
            decoration: BoxDecoration(
              color: kWhite,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "${_selectedInvoices.length} Invoice(s) Selected",
                            style: appStyle(12, kGray, FontWeight.normal),
                          ),
                          Text(
                            "Total: \$${_totalSelectedAmount.toStringAsFixed(2)}",
                            style: appStyle(18, kPrimary, FontWeight.bold),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.clear, color: kGray, size: 20),
                        onPressed: () =>
                            setState(() => _selectedInvoices.clear()),
                      ),
                    ],
                  ),
                  SizedBox(height: 10.h),
                  Row(
                    children: [
                      Expanded(
                        child: CustomButton(
                          text: "Write Check",
                          color: kPrimary,
                          height: 44.h,
                          onPress: () => _proceedToWriteCheck(unpaidRecords),
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Expanded(
                        child: CustomButton(
                          text: "Other Payment",
                          color: kSecondary,
                          height: 44.h,
                          onPress: () => _showDirectPaymentSheet(unpaidRecords),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // ==========================================
  // TAB 2: PAID INVOICES
  // ==========================================
  Widget _buildPaidInvoicesTab(List<Map<String, dynamic>> paidRecords) {
    final q = _searchController.text.trim().toLowerCase();
    final filtered = paidRecords.where((r) {
      if (q.isNotEmpty) {
        final invNum = _getInvoiceNumber(r).toLowerCase();
        final vNum = _getVehicleNumber(r).toLowerCase();
        final desc = (r['description'] ?? '').toString().toLowerCase();
        final ws = _getVendorName(r).toLowerCase();
        return invNum.contains(q) ||
            vNum.contains(q) ||
            desc.contains(q) ||
            ws.contains(q);
      }
      return true;
    }).toList();

    return Column(
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
          color: kWhite,
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: "Search paid invoices...",
              hintStyle: appStyle(13, kGray, FontWeight.normal),
              prefixIcon: const Icon(Feather.search, color: kGray, size: 18),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: kGray, size: 18),
                      onPressed: () => _searchController.clear(),
                    )
                  : null,
              contentPadding: EdgeInsets.symmetric(vertical: 8.h),
              filled: true,
              fillColor: kOffWhite,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: kPrimary,
            onRefresh: _fetchInitialInvoices,
            child: filtered.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: 120.h),
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Feather.file_text,
                                size: 48, color: kGrayLight),
                            SizedBox(height: 12.h),
                            Text("No paid invoices recorded yet",
                                style: appStyle(15, kDark, FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _paidScrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding:
                        EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                    itemCount: filtered.length + (_hasMoreInvoices ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == filtered.length) {
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          child: Center(
                            child: _isLoadingMoreInvoices
                                ? SizedBox(
                                    width: 24.w,
                                    height: 24.w,
                                    child: const CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: kPrimary,
                                    ),
                                  )
                                : const SizedBox.shrink(),
                          ),
                        );
                      }

                      final record = filtered[index];
                      final total = _parseAmount(record['invoiceAmount']);
                      final paid = _parseAmount(record['paidAmount']);
                      final invNum = _getInvoiceNumber(record);
                      final vNum = _getVehicleNumber(record);
                      final vendor = _getVendorName(record);
                      final date =
                          _parseDate(record['date'] ?? record['createdAt']);
                      final formattedDate =
                          DateFormat("MM/dd/yyyy").format(date);
                      final history = (record['paymentHistory'] is List)
                          ? record['paymentHistory'] as List
                          : [];

                      return Container(
                        margin: EdgeInsets.only(bottom: 10.h),
                        padding: EdgeInsets.all(12.w),
                        decoration: BoxDecoration(
                          color: kWhite,
                          borderRadius: BorderRadius.circular(10.r),
                          border:
                              Border.all(color: kGrayLight.withOpacity(0.4)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  "Inv #$invNum",
                                  style: appStyle(14, kDark, FontWeight.bold),
                                ),
                                SizedBox(width: 6.w),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 6.w, vertical: 2.h),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(4.r),
                                  ),
                                  child: Text(
                                    "Paid",
                                    style: appStyle(10, Colors.green.shade800,
                                        FontWeight.bold),
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  formattedDate,
                                  style: appStyle(11, kGray, FontWeight.normal),
                                ),
                              ],
                            ),
                            SizedBox(height: 6.h),
                            Row(
                              children: [
                                Icon(MaterialCommunityIcons.truck_outline,
                                    size: 14, color: kGray),
                                SizedBox(width: 4.w),
                                Text(vNum,
                                    style: appStyle(
                                        12, kDarkGray, FontWeight.w500)),
                                SizedBox(width: 12.w),
                                Icon(MaterialCommunityIcons.store_outline,
                                    size: 14, color: kGray),
                                SizedBox(width: 4.w),
                                Expanded(
                                  child: Text(
                                    vendor,
                                    style: appStyle(
                                        12, kDarkGray, FontWeight.w500),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8.h),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Amount Paid: \$${(paid > 0 ? paid : total).toStringAsFixed(2)}",
                                  style:
                                      appStyle(13, kSecondary, FontWeight.bold),
                                ),
                                if (history.isNotEmpty)
                                  Text(
                                    "${history.length} Payment(s)",
                                    style:
                                        appStyle(11, kGray, FontWeight.normal),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // TAB 3: PAYMENT HISTORY (MASTER LEDGER)
  // ==========================================
  Widget _buildPaymentHistoryTab() {
    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _fetchInitialHistory,
      child: _historyPayments.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(height: 120.h),
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Feather.clock, size: 48, color: kGrayLight),
                      SizedBox(height: 12.h),
                      Text("No payment transactions recorded yet",
                          style: appStyle(15, kDark, FontWeight.w600)),
                      SizedBox(height: 4.h),
                      Text(
                          "Payments settled via check or other methods will appear here.",
                          style: appStyle(12, kGray, FontWeight.normal)),
                    ],
                  ),
                ),
              ],
            )
          : ListView.builder(
              controller: _historyScrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
              itemCount: _historyPayments.length + (_hasMoreHistory ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _historyPayments.length) {
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    child: Center(
                      child: _isLoadingMoreHistory
                          ? SizedBox(
                              width: 24.w,
                              height: 24.w,
                              child: const CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: kPrimary,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                  );
                }

                final payment = _historyPayments[index];
                final paymentId = payment['paymentId'] ?? payment['id'];
                final vendorName = payment['vendorName'] ?? 'Vendor';
                final totalAmount = _parseAmount(payment['totalAmount']);
                final paymentMethod = payment['paymentMethod'] ?? 'Other';
                final transactionId =
                    payment['transactionId'] ?? payment['checkNumber'] ?? '';
                final date = _parseDate(payment['createdAt']);
                final formattedDate =
                    DateFormat("MM/dd/yyyy hh:mm a").format(date);
                final invoices = (payment['invoices'] is List)
                    ? payment['invoices'] as List
                    : [];

                return Container(
                  margin: EdgeInsets.only(bottom: 12.h),
                  decoration: BoxDecoration(
                    color: kWhite,
                    borderRadius: BorderRadius.circular(10.r),
                    border: Border.all(color: kGrayLight.withOpacity(0.4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ExpansionTile(
                    tilePadding:
                        EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                    childrenPadding:
                        EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                    leading: Container(
                      padding: EdgeInsets.all(8.w),
                      decoration: BoxDecoration(
                        color: paymentMethod == 'Check'
                            ? kPrimary.withOpacity(0.1)
                            : kSecondary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        paymentMethod == 'Check'
                            ? MaterialCommunityIcons.checkbook
                            : Feather.dollar_sign,
                        color: paymentMethod == 'Check' ? kPrimary : kSecondary,
                        size: 20,
                      ),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          vendorName,
                          style: appStyle(14, kDark, FontWeight.bold),
                        ),
                        Text(
                          "\$${totalAmount.toStringAsFixed(2)}",
                          style: appStyle(15, kPrimary, FontWeight.bold),
                        ),
                      ],
                    ),
                    subtitle: Padding(
                      padding: EdgeInsets.only(top: 4.h),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "$paymentMethod ${transactionId.isNotEmpty ? '(#$transactionId)' : ''}",
                            style: appStyle(11, kDarkGray, FontWeight.w500),
                          ),
                          Text(
                            formattedDate,
                            style: appStyle(11, kGray, FontWeight.normal),
                          ),
                        ],
                      ),
                    ),
                    children: [
                      const Divider(color: kOffWhite),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "Settled Invoices (${invoices.length}):",
                          style: appStyle(12, kDark, FontWeight.w600),
                        ),
                      ),
                      SizedBox(height: 6.h),
                      ...invoices.map((inv) {
                        final invNum = inv['invoiceNumber'] ?? 'N/A';
                        final vNum = inv['vehicleNumber'] ?? 'N/A';
                        final amt = _parseAmount(inv['amountPaid']);
                        final rem = _parseAmount(inv['remainingBalance']);
                        return Container(
                          padding: EdgeInsets.symmetric(vertical: 4.h),
                          child: Row(
                            children: [
                              Text("Inv #$invNum",
                                  style:
                                      appStyle(12, kDarkGray, FontWeight.w500)),
                              SizedBox(width: 8.w),
                              Text("($vNum)",
                                  style:
                                      appStyle(11, kGray, FontWeight.normal)),
                              const Spacer(),
                              Text(
                                "\$${amt.toStringAsFixed(2)}",
                                style:
                                    appStyle(12, kSecondary, FontWeight.bold),
                              ),
                              if (rem > 0) ...[
                                SizedBox(width: 6.w),
                                Text(
                                  "(Rem: \$${rem.toStringAsFixed(2)})",
                                  style: appStyle(10, kGray, FontWeight.normal),
                                ),
                              ],
                            ],
                          ),
                        );
                      }).toList(),
                      SizedBox(height: 10.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton.icon(
                            icon: const Icon(Feather.printer,
                                size: 14, color: kDark),
                            label: Text("Receipt",
                                style: appStyle(12, kDark, FontWeight.w600)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: kGrayLight),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6.r),
                              ),
                            ),
                            onPressed: () => _printPaymentReceipt(payment),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
