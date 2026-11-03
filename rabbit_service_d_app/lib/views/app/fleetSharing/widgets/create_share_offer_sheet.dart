import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import '../models/fleet_share_model.dart';

class CreateShareOfferSheet extends StatefulWidget {
  final String effectiveUserId;
  final String currentUId;
  final String ownerName;
  final String ownerCompanyName;
  final List<LocalFleetVehicle>? preloadedVehicles;

  const CreateShareOfferSheet({
    super.key,
    required this.effectiveUserId,
    required this.currentUId,
    required this.ownerName,
    required this.ownerCompanyName,
    this.preloadedVehicles,
  });

  @override
  State<CreateShareOfferSheet> createState() => _CreateShareOfferSheetState();
}

class _CreateShareOfferSheetState extends State<CreateShareOfferSheet> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _durationController =
      TextEditingController(text: "30");
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _leaseTermsController = TextEditingController(
    text:
        "Standard inter-fleet sharing agreement. Borrower cannot update master odometer readings.",
  );

  bool _isCheckingEmail = false;
  Map<String, dynamic>? _verifiedBorrower;
  String? _emailError;

  bool _isLoadingVehicles = true;
  List<Map<String, dynamic>> _myAvailableVehicles = [];
  List<Map<String, dynamic>> _allFleetVehicles = [];
  final Set<String> _selectedVehicleIds = {};

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.preloadedVehicles != null &&
        widget.preloadedVehicles!.isNotEmpty) {
      _applyPreloaded(widget.preloadedVehicles!);
      _isLoadingVehicles = false;
    }
    _fetchAvailableVehicles();
  }

  void _applyPreloaded(List<LocalFleetVehicle> list) {
    final all = list
        .map((v) => {
              'id': v.id,
              'vehicleNumber': v.vehicleNumber,
              'vehicleType': v.vehicleType,
              'companyName': v.companyName,
              'vin': v.vin,
              'currentMiles': v.currentMiles,
              'isAvailable': v.isAvailable,
              'statusTag': v.isAssignedToOther
                  ? (v.borrowerName.isNotEmpty
                      ? 'Lent to ${v.borrowerName}'
                      : 'Lent Out')
                  : (v.sharingPending ? 'Pending' : ''),
            })
        .toList();

    _allFleetVehicles = all;
    _myAvailableVehicles = all.where((v) => v['isAvailable'] == true).toList();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _durationController.dispose();
    _descriptionController.dispose();
    _leaseTermsController.dispose();
    super.dispose();
  }

  Future<void> _fetchAvailableVehicles() async {
    try {
      final List<String> targetUids = [];
      if (widget.effectiveUserId.trim().isNotEmpty) {
        targetUids.add(widget.effectiveUserId.trim());
      }
      if (widget.currentUId.trim().isNotEmpty &&
          !targetUids.contains(widget.currentUId.trim())) {
        targetUids.add(widget.currentUId.trim());
      }
      final authUid = FirebaseAuth.instance.currentUser?.uid;
      if (authUid != null &&
          authUid.isNotEmpty &&
          !targetUids.contains(authUid)) {
        targetUids.add(authUid);
      }

      // Also check if current user doc has createdBy (e.g. SubOwner)
      try {
        final currentDoc = await FirebaseFirestore.instance
            .collection('Users')
            .doc(authUid ?? widget.currentUId)
            .get();
        if (currentDoc.exists) {
          final createdBy =
              (currentDoc.data()?['createdBy'] ?? '').toString().trim();
          if (createdBy.isNotEmpty && !targetUids.contains(createdBy)) {
            targetUids.add(createdBy);
          }
        }
      } catch (_) {}

      debugPrint("FS_DEBUG: targetUids to fetch vehicles = $targetUids");

      final Map<String, Map<String, dynamic>> allVehiclesMap = {};

      for (final uid in targetUids) {
        final snap = await FirebaseFirestore.instance
            .collection('Users')
            .doc(uid)
            .collection('Vehicles')
            .get();

        debugPrint(
            "FS_DEBUG: Found ${snap.docs.length} vehicle docs under Users/$uid/Vehicles");

        for (var doc in snap.docs) {
          final data = doc.data();
          final id = doc.id;
          final vNum = (data['vehicleNumber'] ?? data['name'] ?? id).toString();

          final isActive = data['active'] != false;
          final isAssigned = data['isAssignedToOther'] == true ||
              data['isAssignedToOther'] == 'true';
          final isPending = data['sharingPending'] == true ||
              data['sharingPending'] == 'true';

          debugPrint(
              "FS_DEBUG: Vehicle '$vNum' ($id): active=$isActive, isAssignedToOther=$isAssigned, sharingPending=$isPending");

          final isAvail = isActive && !isAssigned && !isPending;

          final sharedWith = data['sharedWith'] as Map<String, dynamic>?;
          final borrower = (sharedWith?['borrowerCompanyName'] ??
                  sharedWith?['borrowerName'] ??
                  '')
              .toString()
              .trim();
          final statusTag = isAssigned
              ? (borrower.isNotEmpty ? 'Lent to $borrower' : 'Lent Out')
              : (isPending ? 'Pending' : '');

          if (!allVehiclesMap.containsKey(id)) {
            allVehiclesMap[id] = {
              'id': id,
              'vehicleNumber': vNum,
              'vehicleType': (data['vehicleType'] ?? 'Truck').toString(),
              'companyName': data['companyName'] ?? data['myCompany'] ?? '',
              'vin': data['vin'] ?? '',
              'currentMiles': safeParseDouble(
                  data['currentMiles'] ?? data['currentReading']),
              'isAvailable': isAvail,
              'statusTag': statusTag,
            };
          }
        }
      }

      final allList = allVehiclesMap.values.toList();
      allList.sort((a, b) => a['vehicleNumber']
          .toString()
          .toLowerCase()
          .compareTo(b['vehicleNumber'].toString().toLowerCase()));

      final availList = allList.where((v) => v['isAvailable'] == true).toList();

      debugPrint(
          "FS_DEBUG: Total fleet = ${allList.length}, Available = ${availList.length}");

      if (mounted) {
        setState(() {
          _allFleetVehicles = allList;
          _myAvailableVehicles = availList;
          _isLoadingVehicles = false;
        });
      }
    } catch (e) {
      debugPrint("FS_DEBUG: Error fetching vehicles: $e");
      if (mounted) {
        setState(() => _isLoadingVehicles = false);
      }
    }
  }

  Future<void> _verifyBorrowerEmail() async {
    final cleanEmail = _emailController.text.trim().toLowerCase();
    final myEmail =
        FirebaseAuth.instance.currentUser?.email?.trim().toLowerCase() ?? '';

    if (cleanEmail.isEmpty) {
      setState(() {
        _emailError = "Please enter partner Owner's email";
        _verifiedBorrower = null;
      });
      return;
    }

    if (cleanEmail == myEmail) {
      setState(() {
        _emailError = "You cannot share fleet with your own email";
        _verifiedBorrower = null;
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
        // Fallback: check userEmail field
        final querySnap2 = await FirebaseFirestore.instance
            .collection('Users')
            .where('userEmail', isEqualTo: cleanEmail)
            .limit(1)
            .get();

        if (querySnap2.docs.isEmpty) {
          setState(() {
            _emailError = "No registered user found with this email";
            _verifiedBorrower = null;
            _isCheckingEmail = false;
          });
          return;
        }

        final doc = querySnap2.docs.first;
        final data = doc.data();
        _setBorrowerFromData(doc.id, cleanEmail, data);
        return;
      }

      final doc = querySnap.docs.first;
      final data = doc.data();
      _setBorrowerFromData(doc.id, cleanEmail, data);
    } catch (e) {
      setState(() {
        _emailError = "Error validating email: $e";
        _verifiedBorrower = null;
        _isCheckingEmail = false;
      });
    }
  }

  void _setBorrowerFromData(
      String uid, String email, Map<String, dynamic> data) {
    final role = (data['role'] ?? '').toString();
    final isOwnerRole = role.toLowerCase() == 'owner' ||
        role.toLowerCase() == 'subowner' ||
        data['isOwner'] == true;

    if (!isOwnerRole) {
      setState(() {
        _emailError =
            'User role is "$role". Fleet sharing is only allowed between Fleet Owners.';
        _verifiedBorrower = null;
        _isCheckingEmail = false;
      });
      return;
    }

    setState(() {
      _verifiedBorrower = {
        'uid': uid,
        'email': email,
        'name': data['userName'] ?? data['name'] ?? 'Fleet Owner',
        'companyName': data['companyName'] ?? data['carrierName'] ?? '',
      };
      _emailError = null;
      _isCheckingEmail = false;
    });
  }

  Future<void> _submitOffer() async {
    if (_verifiedBorrower == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please verify the partner Owner's email first")),
      );
      return;
    }

    if (_selectedVehicleIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please select at least 1 vehicle to lend")),
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
      final currentUserEmail = FirebaseAuth.instance.currentUser?.email ?? '';

      final selectedList = _myAvailableVehicles
          .where((v) => _selectedVehicleIds.contains(v['id']))
          .toList();

      final hasUnavailable = selectedList.any((v) => v['isAvailable'] != true);
      if (hasUnavailable) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: kRed,
            content: Text(
                "One or more selected vehicles are already lent out or pending. Please select only available units."),
          ),
        );
        return;
      }

      final selectedVehicles = selectedList
          .map((v) => {
                'vehicleId': v['id'],
                'vehicleNumber': v['vehicleNumber'],
                'vehicleType': v['vehicleType'],
                'companyName': v['companyName'],
                'vin': v['vin'],
                'currentMilesAtShare': v['currentMiles'],
              })
          .toList();

      final shareCode =
          "SHR-${DateTime.now().year}-${DateTime.now().millisecondsSinceEpoch % 10000}";

      final now = DateTime.now();
      final startDateStr = DateFormat('MM-dd-yyyy').format(now);
      final endDateStr = DateFormat('MM-dd-yyyy')
          .format(now.add(Duration(days: durationDays)));

      final docData = {
        'shareCode': shareCode,
        'type': 'direct_offer',
        'status': 'pending',
        'lenderId': widget.effectiveUserId,
        'lenderEmail': currentUserEmail,
        'lenderName':
            widget.ownerName.isNotEmpty ? widget.ownerName : 'Fleet Owner',
        'lenderCompanyName': widget.ownerCompanyName,
        'borrowerId': _verifiedBorrower!['uid'],
        'borrowerEmail': _verifiedBorrower!['email'],
        'borrowerName': _verifiedBorrower!['name'],
        'borrowerCompanyName': _verifiedBorrower!['companyName'],
        'vehicles': selectedVehicles,
        'description': _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : 'Fleet sharing equipment offer.',
        'leaseTerms': _leaseTermsController.text.trim(),
        'startDate': startDateStr,
        'expectedEndDate': endDateStr,
        'createdAt': FieldValue.serverTimestamp(),
        'createdById': widget.currentUId,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      final batch = FirebaseFirestore.instance.batch();
      final shareDocRef =
          FirebaseFirestore.instance.collection('fleet_shares').doc();
      batch.set(shareDocRef, docData);

      for (final v in selectedList) {
        final vId = v['id']?.toString() ?? '';
        if (vId.isEmpty) continue;
        final vehicleRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(widget.effectiveUserId)
            .collection('Vehicles')
            .doc(vId);
        batch.update(vehicleRef, {
          'sharingPending': true,
        });
      }

      await batch.commit();

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: kSecondary,
            content: Text(
                'Sharing offer $shareCode sent to ${_verifiedBorrower!['name']}!'),
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

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
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
                  Text("Lend Equipment Offer",
                      style: appStyle(18, kDark, FontWeight.bold)),
                  SizedBox(height: 2.h),
                  Text("Offer vehicles to another fleet owner",
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
                  // 1. Borrower Email
                  Text("Partner Owner Email",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: "Enter partner fleet owner's email",
                            prefixIcon: const Icon(Icons.email_outlined),
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 10.h),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                          ),
                          onChanged: (_) {
                            if (_verifiedBorrower != null) {
                              setState(() => _verifiedBorrower = null);
                            }
                          },
                        ),
                      ),
                      SizedBox(width: 8.w),
                      ElevatedButton(
                        onPressed:
                            _isCheckingEmail ? null : _verifyBorrowerEmail,
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
                  if (_verifiedBorrower != null) ...[
                    SizedBox(height: 8.h),
                    Container(
                      padding: EdgeInsets.all(10.w),
                      decoration: BoxDecoration(
                        color: kSecondary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10.r),
                        border: Border.all(color: kSecondary.withOpacity(0.3)),
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
                                  "${_verifiedBorrower!['name']} (Verified Owner)",
                                  style:
                                      appStyle(13, kSecondary, FontWeight.bold),
                                ),
                                if ((_verifiedBorrower!['companyName'] ?? '')
                                    .isNotEmpty)
                                  Text(
                                    _verifiedBorrower!['companyName'],
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

                  // 2. Select Vehicles to Lend
                  Builder(
                    builder: (context) {
                      final displayVehicles = _myAvailableVehicles.isNotEmpty
                          ? _myAvailableVehicles
                          : _allFleetVehicles;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text("Select Vehicles to Lend",
                                  style: appStyle(13, kDark, FontWeight.bold)),
                              if (displayVehicles.isNotEmpty)
                                Text(
                                  "${_selectedVehicleIds.length} of ${displayVehicles.length} selected",
                                  style:
                                      appStyle(12, kPrimary, FontWeight.w600),
                                ),
                            ],
                          ),
                          SizedBox(height: 8.h),
                          if (_isLoadingVehicles)
                            const Center(child: CircularProgressIndicator())
                          else if (_allFleetVehicles.isEmpty)
                            Container(
                              width: double.infinity,
                              padding: EdgeInsets.all(16.w),
                              decoration: BoxDecoration(
                                color: kLightWhite,
                                borderRadius: BorderRadius.circular(10.r),
                                border: Border.all(
                                    color: kGrayLight.withOpacity(0.3)),
                              ),
                              child: Center(
                                child: Text(
                                  "No vehicles found in your fleet. Please add vehicles under My Vehicles first.",
                                  textAlign: TextAlign.center,
                                  style: appStyle(12, kGray, FontWeight.normal),
                                ),
                              ),
                            )
                          else ...[
                            if (_myAvailableVehicles.isEmpty)
                              Padding(
                                padding: EdgeInsets.only(bottom: 6.h),
                                child: Text(
                                  "All vehicles are currently marked as shared or pending. You can still select from below to assign:",
                                  style: appStyle(11, Colors.amber.shade900,
                                      FontWeight.w500),
                                ),
                              ),
                            Container(
                              constraints: BoxConstraints(maxHeight: 180.h),
                              decoration: BoxDecoration(
                                border: Border.all(
                                    color: kGrayLight.withOpacity(0.4)),
                                borderRadius: BorderRadius.circular(10.r),
                              ),
                              child: ListView.separated(
                                shrinkWrap: true,
                                itemCount: displayVehicles.length,
                                separatorBuilder: (context, index) =>
                                    const Divider(
                                        height: 1, color: Color(0xFFEEEEEE)),
                                itemBuilder: (context, index) {
                                  final v = displayVehicles[index];
                                  final isSelected =
                                      _selectedVehicleIds.contains(v['id']);
                                  final tag = (v['statusTag'] ?? '').toString();
                                  final bool isUnavailable =
                                      v['isAvailable'] != true;

                                  return Container(
                                    margin: EdgeInsets.symmetric(vertical: 2.h),
                                    child: Opacity(
                                      opacity: isUnavailable ? 0.55 : 1.0,
                                      child: Material(
                                        color: isSelected
                                            ? kPrimary.withOpacity(0.08)
                                            : (isUnavailable
                                                ? kLightWhite.withOpacity(0.7)
                                                : kWhite),
                                        borderRadius:
                                            BorderRadius.circular(8.r),
                                        child: InkWell(
                                          borderRadius:
                                              BorderRadius.circular(8.r),
                                          onTap: isUnavailable
                                              ? () {
                                                  ScaffoldMessenger.of(context)
                                                      .showSnackBar(
                                                    SnackBar(
                                                      backgroundColor: kRed,
                                                      duration: const Duration(
                                                          seconds: 2),
                                                      content: Text(
                                                        "Vehicle ${v['vehicleNumber']} is currently $tag and cannot be selected.",
                                                      ),
                                                    ),
                                                  );
                                                }
                                              : () {
                                                  setState(() {
                                                    if (isSelected) {
                                                      _selectedVehicleIds
                                                          .remove(v['id']);
                                                    } else {
                                                      _selectedVehicleIds
                                                          .add(v['id']);
                                                    }
                                                  });
                                                },
                                          child: Padding(
                                            padding: EdgeInsets.symmetric(
                                                horizontal: 8.w, vertical: 8.h),
                                            child: Row(
                                              children: [
                                                SizedBox(
                                                  width: 24.w,
                                                  height: 24.w,
                                                  child: Checkbox(
                                                    value: isSelected,
                                                    activeColor: kPrimary,
                                                    materialTapTargetSize:
                                                        MaterialTapTargetSize
                                                            .shrinkWrap,
                                                    onChanged: isUnavailable
                                                        ? null
                                                        : (checked) {
                                                            setState(() {
                                                              if (checked ==
                                                                  true) {
                                                                _selectedVehicleIds
                                                                    .add(v[
                                                                        'id']);
                                                              } else {
                                                                _selectedVehicleIds
                                                                    .remove(v[
                                                                        'id']);
                                                              }
                                                            });
                                                          },
                                                  ),
                                                ),
                                                SizedBox(width: 8.w),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Row(
                                                        children: [
                                                          Expanded(
                                                            child: Text(
                                                              "${v['vehicleNumber']} (${v['vehicleType']})",
                                                              style: appStyle(
                                                                  13,
                                                                  isSelected
                                                                      ? kPrimary
                                                                      : kDark,
                                                                  FontWeight
                                                                      .w600),
                                                              maxLines: 1,
                                                              overflow:
                                                                  TextOverflow
                                                                      .ellipsis,
                                                            ),
                                                          ),
                                                          if (tag
                                                              .isNotEmpty) ...[
                                                            SizedBox(
                                                                width: 6.w),
                                                            Container(
                                                              padding: EdgeInsets
                                                                  .symmetric(
                                                                      horizontal:
                                                                          6.w,
                                                                      vertical:
                                                                          2.h),
                                                              decoration:
                                                                  BoxDecoration(
                                                                color: Colors
                                                                    .amber
                                                                    .shade100,
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            6.r),
                                                              ),
                                                              child: Text(
                                                                tag,
                                                                style: appStyle(
                                                                    10,
                                                                    Colors.amber
                                                                        .shade900,
                                                                    FontWeight
                                                                        .bold),
                                                              ),
                                                            ),
                                                          ],
                                                        ],
                                                      ),
                                                      SizedBox(height: 2.h),
                                                      Text(
                                                        v['companyName']
                                                                .isNotEmpty
                                                            ? v['companyName']
                                                            : "VIN: ${v['vin']}",
                                                        style: appStyle(
                                                            11,
                                                            kGray,
                                                            FontWeight.normal),
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ],
                      );
                    },
                  ),
                  SizedBox(height: 18.h),

                  // 3. Duration (Days)
                  Text("Sharing Duration (Days)",
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

                  // 4. Description
                  Text("Purpose / Description (Optional)",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: "e.g. Seasonal peak overflow capacity...",
                      contentPadding: EdgeInsets.all(12.w),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                    ),
                  ),
                  SizedBox(height: 18.h),

                  // 5. Terms
                  Text("Lease Terms & Conditions",
                      style: appStyle(13, kDark, FontWeight.bold)),
                  SizedBox(height: 6.h),
                  TextFormField(
                    controller: _leaseTermsController,
                    maxLines: 2,
                    decoration: InputDecoration(
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
              onPressed: _isSubmitting ? null : _submitOffer,
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
                  : Text("Send Sharing Offer",
                      style: appStyle(15, kWhite, FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
