import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class CreateBorrowRequestSheet extends StatefulWidget {
  final String effectiveUserId;
  final String currentUId;
  final String ownerName;
  final String ownerCompanyName;

  const CreateBorrowRequestSheet({
    super.key,
    required this.effectiveUserId,
    required this.currentUId,
    required this.ownerName,
    required this.ownerCompanyName,
  });

  @override
  State<CreateBorrowRequestSheet> createState() =>
      _CreateBorrowRequestSheetState();
}

class _CreateBorrowRequestSheetState extends State<CreateBorrowRequestSheet> {
  final TextEditingController _lenderEmailController = TextEditingController();
  final TextEditingController _durationController =
      TextEditingController(text: "30");
  final TextEditingController _descriptionController = TextEditingController();

  int _truckCount = 1;
  int _trailerCount = 0;

  bool _isCheckingEmail = false;
  Map<String, dynamic>? _verifiedLender;
  String? _emailError;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _lenderEmailController.dispose();
    _durationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _verifyLenderEmail() async {
    final cleanEmail = _lenderEmailController.text.trim().toLowerCase();
    final myEmail =
        FirebaseAuth.instance.currentUser?.email?.trim().toLowerCase() ?? '';

    if (cleanEmail.isEmpty) {
      setState(() {
        _emailError = "Please enter lender Owner's email";
        _verifiedLender = null;
      });
      return;
    }

    if (cleanEmail == myEmail) {
      setState(() {
        _emailError = "You cannot request equipment from your own email";
        _verifiedLender = null;
      });
      return;
    }

    setState(() {
      _isCheckingEmail = true;
      _emailError = null;
    });

    try {
      final querySnap = await FirebaseFirestore.instance
          .collection('Users')
          .where('email', isEqualTo: cleanEmail)
          .limit(1)
          .get();

      if (querySnap.docs.isEmpty) {
        final querySnap2 = await FirebaseFirestore.instance
            .collection('Users')
            .where('userEmail', isEqualTo: cleanEmail)
            .limit(1)
            .get();

        if (querySnap2.docs.isEmpty) {
          setState(() {
            _emailError = "No registered user found with this email";
            _verifiedLender = null;
            _isCheckingEmail = false;
          });
          return;
        }

        final doc = querySnap2.docs.first;
        _setLenderFromData(doc.id, cleanEmail, doc.data());
        return;
      }

      final doc = querySnap.docs.first;
      _setLenderFromData(doc.id, cleanEmail, doc.data());
    } catch (e) {
      setState(() {
        _emailError = "Error validating email: $e";
        _verifiedLender = null;
        _isCheckingEmail = false;
      });
    }
  }

  void _setLenderFromData(
      String uid, String email, Map<String, dynamic> data) {
    final role = (data['role'] ?? '').toString();
    final isOwnerRole = role.toLowerCase() == 'owner' ||
        role.toLowerCase() == 'subowner' ||
        data['isOwner'] == true;

    if (!isOwnerRole) {
      setState(() {
        _emailError =
            'User role is "$role". You can only request equipment from users having the "Owner" role.';
        _verifiedLender = null;
        _isCheckingEmail = false;
      });
      return;
    }

    setState(() {
      _verifiedLender = {
        'uid': uid,
        'email': email,
        'name': data['userName'] ?? data['name'] ?? 'Fleet Owner',
        'companyName': data['companyName'] ?? data['carrierName'] ?? '',
      };
      _emailError = null;
      _isCheckingEmail = false;
    });
  }

  Future<void> _submitRequest() async {
    if (_verifiedLender == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please verify the target Owner's email first")),
      );
      return;
    }

    if (_truckCount <= 0 && _trailerCount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please request at least 1 truck or trailer")),
      );
      return;
    }

    final durationDays = int.tryParse(_durationController.text.trim()) ?? 30;
    if (durationDays <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Duration must be at least 1 day")),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final currentUserEmail =
          FirebaseAuth.instance.currentUser?.email ?? '';

      final shareCode =
          "REQ-${DateTime.now().year}-${DateTime.now().millisecondsSinceEpoch % 10000}";

      final now = DateTime.now();
      final startDateStr = DateFormat('MM-dd-yyyy').format(now);
      final endDateStr = DateFormat('MM-dd-yyyy')
          .format(now.add(Duration(days: durationDays)));

      final docData = {
        'shareCode': shareCode,
        'type': 'borrow_request',
        'status': 'pending',
        'lenderId': _verifiedLender!['uid'],
        'lenderEmail': _verifiedLender!['email'],
        'lenderName': _verifiedLender!['name'],
        'lenderCompanyName': _verifiedLender!['companyName'],
        'borrowerId': widget.effectiveUserId,
        'borrowerEmail': currentUserEmail,
        'borrowerName':
            widget.ownerName.isNotEmpty ? widget.ownerName : 'Fleet Owner',
        'borrowerCompanyName': widget.ownerCompanyName,
        'requestedCounts': {
          'trucks': _truckCount,
          'trailers': _trailerCount,
        },
        'vehicles': [],
        'description': _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : 'Equipment borrow request for fleet operations.',
        'leaseTerms':
            'Standard inter-fleet sharing agreement. Borrower cannot update master odometer readings.',
        'startDate': startDateStr,
        'expectedEndDate': endDateStr,
        'createdAt': FieldValue.serverTimestamp(),
        'createdById': widget.currentUId,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      await FirebaseFirestore.instance.collection('fleet_shares').add(docData);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: kSecondary,
            content: Text(
                'Equipment request $shareCode submitted to ${_verifiedLender!['name']}!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: kRed, content: Text('Error: $e')),
        );
      }
    }
  }

  Widget _buildCounter({
    required String label,
    required IconData icon,
    required int value,
    required VoidCallback onIncrement,
    required VoidCallback onDecrement,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
      decoration: BoxDecoration(
        color: kLightWhite,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: kGrayLight.withOpacity(0.35)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: kPrimary, size: 22.sp),
              SizedBox(width: 10.w),
              Text(label, style: appStyle(14, kDark, FontWeight.w600)),
            ],
          ),
          Row(
            children: [
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.remove_circle_outline, color: kGray),
                onPressed: value > 0 ? onDecrement : null,
              ),
              Container(
                constraints: BoxConstraints(minWidth: 32.w),
                alignment: Alignment.center,
                child: Text(
                  "$value",
                  style: appStyle(16, kDark, FontWeight.bold),
                ),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.add_circle_outline, color: kPrimary),
                onPressed: onIncrement,
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      padding: EdgeInsets.only(
        top: 16.h,
        left: 16.w,
        right: 16.w,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16.h,
      ),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40.w,
              height: 4.h,
              decoration: BoxDecoration(
                color: kGrayLight.withOpacity(0.6),
                borderRadius: BorderRadius.circular(2.r),
              ),
            ),
          ),
          SizedBox(height: 12.h),

          // Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Request Fleet Equipment",
                      style: appStyle(18, kDark, FontWeight.bold)),
                  SizedBox(height: 2.h),
                  Text("Borrow equipment from partner fleet owners",
                      style: appStyle(12, kGray, FontWeight.normal)),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: kDark),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const Divider(color: Color(0xFFEEEEEE)),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Lender Email
                  Text("Lender Owner Email",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _lenderEmailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: "Enter partner Owner's email",
                            prefixIcon: const Icon(Icons.email_outlined),
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 10.h),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                          ),
                          onChanged: (_) {
                            if (_verifiedLender != null) {
                              setState(() => _verifiedLender = null);
                            }
                          },
                        ),
                      ),
                      SizedBox(width: 8.w),
                      ElevatedButton(
                        onPressed: _isCheckingEmail ? null : _verifyLenderEmail,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kPrimary,
                          padding: EdgeInsets.symmetric(
                              horizontal: 14.w, vertical: 12.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                        ),
                        child: _isCheckingEmail
                            ? SizedBox(
                                width: 16.w,
                                height: 16.w,
                                child: const CircularProgressIndicator(
                                    strokeWidth: 2, color: kWhite),
                              )
                            : Text("Verify",
                                style: appStyle(13, kWhite, FontWeight.w600)),
                      ),
                    ],
                  ),
                  if (_emailError != null) ...[
                    SizedBox(height: 4.h),
                    Text(_emailError!,
                        style: appStyle(11, kRed, FontWeight.normal)),
                  ],
                  if (_verifiedLender != null) ...[
                    SizedBox(height: 8.h),
                    Container(
                      padding: EdgeInsets.all(10.w),
                      decoration: BoxDecoration(
                        color: kSecondary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10.r),
                        border:
                            Border.all(color: kSecondary.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle_rounded,
                              color: kSecondary, size: 20.sp),
                          SizedBox(width: 8.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "${_verifiedLender!['name']} (Verified Owner)",
                                  style: appStyle(
                                      13, kSecondary, FontWeight.bold),
                                ),
                                if ((_verifiedLender!['companyName'] ?? '')
                                    .isNotEmpty)
                                  Text(
                                    _verifiedLender!['companyName'],
                                    style: appStyle(
                                        11, kDarkGray, FontWeight.normal),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  SizedBox(height: 18.h),

                  // 2. Equipment Needed Counters
                  Text("Equipment Needed",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 8.h),
                  _buildCounter(
                    label: "Trucks Required",
                    icon: Icons.local_shipping_rounded,
                    value: _truckCount,
                    onIncrement: () => setState(() => _truckCount++),
                    onDecrement: () => setState(() => _truckCount--),
                  ),
                  SizedBox(height: 10.h),
                  _buildCounter(
                    label: "Trailers Required",
                    icon: Icons.rv_hookup_rounded,
                    value: _trailerCount,
                    onIncrement: () => setState(() => _trailerCount++),
                    onDecrement: () => setState(() => _trailerCount--),
                  ),
                  SizedBox(height: 18.h),

                  // 3. Duration
                  Text("Requested Duration (Days)",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  TextFormField(
                    controller: _durationController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: "e.g. 30",
                      prefixIcon: const Icon(Icons.date_range_outlined),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 12.w, vertical: 10.h),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                    ),
                  ),
                  SizedBox(height: 18.h),

                  // 4. Description / Reason
                  Text("Description / Operation Need",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText:
                          "Explain your operational need, route, or requirements...",
                      contentPadding: EdgeInsets.all(12.w),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                    ),
                  ),
                  SizedBox(height: 20.h),
                ],
              ),
            ),
          ),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 48.h,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitRequest,
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
              child: _isSubmitting
                  ? SizedBox(
                      width: 20.w,
                      height: 20.w,
                      child: const CircularProgressIndicator(
                          strokeWidth: 2, color: kWhite),
                    )
                  : Text("Submit Borrow Request",
                      style: appStyle(15, kWhite, FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
