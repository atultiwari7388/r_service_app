import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import '../models/fleet_share_model.dart';

class FulfillRequestDialog extends StatefulWidget {
  final FleetShareDoc share;
  final String effectiveUserId;
  final List<LocalFleetVehicle>? preloadedVehicles;

  const FulfillRequestDialog({
    super.key,
    required this.share,
    required this.effectiveUserId,
    this.preloadedVehicles,
  });

  @override
  State<FulfillRequestDialog> createState() => _FulfillRequestDialogState();
}

class _FulfillRequestDialogState extends State<FulfillRequestDialog> {
  bool _isLoadingVehicles = true;
  List<LocalFleetVehicle> _allFleetVehicles = [];
  List<LocalFleetVehicle> _availableVehicles = [];
  List<LocalFleetVehicle> _inUseVehicles = [];
  final Set<String> _selectedVehicleIds = {};
  final TextEditingController _termsController = TextEditingController();
  bool _isSubmitting = false;
  StreamSubscription? _vehiclesSub1;
  StreamSubscription? _vehiclesSub2;

  @override
  void initState() {
    super.initState();
    _termsController.text = widget.share.leaseTerms.isNotEmpty
        ? widget.share.leaseTerms
        : "Standard inter-fleet sharing agreement. Borrower cannot update master odometer readings.";

    if (widget.preloadedVehicles != null &&
        widget.preloadedVehicles!.isNotEmpty) {
      _applyVehicles(widget.preloadedVehicles!);
      _isLoadingVehicles = false;
    }

    _listenToVehicles();
  }

  @override
  void dispose() {
    _termsController.dispose();
    _vehiclesSub1?.cancel();
    _vehiclesSub2?.cancel();
    super.dispose();
  }

  void _applyVehicles(List<LocalFleetVehicle> list) {
    final dedup = <String, LocalFleetVehicle>{};
    for (var v in list) {
      dedup[v.id] = v;
    }
    final sorted = dedup.values.toList()
      ..sort((a, b) => a.vehicleNumber
          .toLowerCase()
          .compareTo(b.vehicleNumber.toLowerCase()));

    _allFleetVehicles = sorted;
    _availableVehicles = sorted.where((v) => v.isAvailable).toList();
    _inUseVehicles = sorted.where((v) => !v.isAvailable).toList();
  }

  Future<void> _listenToVehicles() async {
    final currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final targetUids = <String>{};

    if (widget.effectiveUserId.trim().isNotEmpty) {
      targetUids.add(widget.effectiveUserId.trim());
    }
    if (currentUid.isNotEmpty) {
      targetUids.add(currentUid);
    }

    // Resolve owner's createdBy if subowner
    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUid)
          .get();
      if (userDoc.exists) {
        final createdBy =
            (userDoc.data()?['createdBy'] ?? '').toString().trim();
        if (createdBy.isNotEmpty) {
          targetUids.add(createdBy);
        }
      }
    } catch (_) {}

    final loadedMap = <String, LocalFleetVehicle>{};

    for (final uid in targetUids) {
      try {
        final snap = await FirebaseFirestore.instance
            .collection('Users')
            .doc(uid)
            .collection('Vehicles')
            .get();

        for (var doc in snap.docs) {
          final veh = LocalFleetVehicle.fromFirestore(doc);
          if (!loadedMap.containsKey(veh.id)) {
            loadedMap[veh.id] = veh;
          }
        }
      } catch (_) {}
    }

    if (mounted) {
      setState(() {
        _applyVehicles(loadedMap.values.toList());
        _isLoadingVehicles = false;
      });
    }
  }

  Future<void> _fulfillRequest() async {
    if (_selectedVehicleIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please select at least 1 vehicle to assign")),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
      final selectedList = _allFleetVehicles
          .where((v) => _selectedVehicleIds.contains(v.id))
          .toList();

      final hasUnavailable =
          selectedList.any((v) => v.isAssignedToOther || v.sharingPending);
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
                'vehicleId': v.id,
                'vehicleNumber': v.vehicleNumber,
                'vehicleType': v.vehicleType,
                'companyName': v.companyName,
                'vin': v.vin,
                'currentMilesAtShare': v.currentMiles,
              })
          .toList();

      final now = DateTime.now();
      final startDateStr = DateFormat('MM-dd-yyyy').format(now);

      final batch = FirebaseFirestore.instance.batch();
      final shareRef = FirebaseFirestore.instance
          .collection('fleet_shares')
          .doc(widget.share.id);

      batch.update(shareRef, {
        'status': 'active',
        'vehicles': selectedVehicles,
        'leaseTerms': _termsController.text.trim(),
        'startDate': startDateStr,
        'lastUpdatedById': currentUid,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Update lender's vehicles: isAssignedToOther: true & sharedWith metadata
      final targetLenderUid = widget.effectiveUserId.isNotEmpty
          ? widget.effectiveUserId
          : currentUid;

      for (final v in selectedList) {
        final vehicleRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(targetLenderUid)
            .collection('Vehicles')
            .doc(v.id);

        batch.update(vehicleRef, {
          'isAssignedToOther': true,
          'sharingPending': false,
          'sharedWith': {
            'borrowerId': widget.share.borrowerId,
            'borrowerEmail': widget.share.borrowerEmail,
            'borrowerName': widget.share.borrowerName,
            'borrowerCompanyName': widget.share.borrowerCompanyName,
            'shareId': widget.share.id,
            'shareCode': widget.share.shareCode,
            'assignedAt': FieldValue.serverTimestamp(),
          },
        });
      }

      await batch.commit();

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
                "Vehicles successfully assigned to ${widget.share.borrowerCompanyName.isNotEmpty ? widget.share.borrowerCompanyName : widget.share.borrowerName}! Agreement is now Active."),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: kRed, content: Text("Error: $e")),
        );
      }
    }
  }

  Widget _buildVehicleTile(LocalFleetVehicle veh, {bool isInUse = false}) {
    final isChecked = _selectedVehicleIds.contains(veh.id);
    final isTrailer = veh.vehicleType.toLowerCase() == 'trailer';
    final borrower = veh.borrowerName;
    final statusText = veh.isAssignedToOther
        ? (borrower.isNotEmpty ? "Lent to $borrower" : "Lent Out")
        : "Pending";

    return Container(
      margin: EdgeInsets.symmetric(vertical: 3.h),
      child: Opacity(
        opacity: isInUse ? 0.55 : 1.0,
        child: Material(
          color: isChecked
              ? const Color(0xFF10B981).withOpacity(0.08)
              : (isInUse ? kLightWhite.withOpacity(0.7) : kWhite),
          borderRadius: BorderRadius.circular(10.r),
          child: InkWell(
            borderRadius: BorderRadius.circular(10.r),
            onTap: isInUse
                ? () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: kRed,
                        duration: const Duration(seconds: 2),
                        content: Text(
                          veh.isAssignedToOther
                              ? "Vehicle ${veh.vehicleNumber} is already lent out${borrower.isNotEmpty ? ' to $borrower' : ''} and cannot be assigned."
                              : "Vehicle ${veh.vehicleNumber} has a pending sharing offer and cannot be assigned.",
                        ),
                      ),
                    );
                  }
                : () {
                    setState(() {
                      if (isChecked) {
                        _selectedVehicleIds.remove(veh.id);
                      } else {
                        _selectedVehicleIds.add(veh.id);
                      }
                    });
                  },
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10.r),
                border: Border.all(
                  color: isChecked
                      ? const Color(0xFF10B981)
                      : (isInUse
                          ? kGrayLight.withOpacity(0.4)
                          : kGrayLight.withOpacity(0.6)),
                ),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 24.w,
                    height: 24.w,
                    child: Checkbox(
                      value: isChecked,
                      activeColor: const Color(0xFF10B981),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      onChanged: isInUse
                          ? null
                          : (val) {
                              setState(() {
                                if (val == true) {
                                  _selectedVehicleIds.add(veh.id);
                                } else {
                                  _selectedVehicleIds.remove(veh.id);
                                }
                              });
                            },
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Icon(
                    isTrailer
                        ? Icons.rv_hookup_rounded
                        : Icons.local_shipping_rounded,
                    size: 18.sp,
                    color: isChecked ? const Color(0xFF10B981) : (isInUse ? kGray : kDark),
                  ),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                veh.vehicleNumber,
                                style: appStyle(
                                    14,
                                    isChecked
                                        ? const Color(0xFF10B981)
                                        : (isInUse ? kGray : kDark),
                                    FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isInUse) ...[
                              SizedBox(width: 6.w),
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 6.w, vertical: 2.h),
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade100,
                                  borderRadius: BorderRadius.circular(6.r),
                                ),
                                child: Text(
                                  statusText,
                                  style: appStyle(
                                      10, Colors.amber.shade900, FontWeight.bold),
                                ),
                              ),
                            ],
                          ],
                        ),
                        SizedBox(height: 2.h),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                "${veh.vehicleType} • ${veh.companyName}",
                                style: appStyle(11, kDarkGray, FontWeight.normal),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            SizedBox(width: 6.w),
                            Text(
                              "${NumberFormat('#,###').format(veh.currentMiles)} mi",
                              style: appStyle(11, kGray, FontWeight.w500),
                            ),
                          ],
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
  }

  @override
  Widget build(BuildContext context) {
    final trucksCount = widget.share.requestedTrucks;
    final trailersCount = widget.share.requestedTrailers;
    final borrowerDisplay = widget.share.borrowerCompanyName.isNotEmpty
        ? widget.share.borrowerCompanyName
        : (widget.share.borrowerName.isNotEmpty
            ? widget.share.borrowerName
            : "Partner Carrier");

    // Display vehicles list: prefer available, but if available is empty, show all fleet vehicles so user is never blocked
    final displayVehicles =
        _availableVehicles.isNotEmpty ? _availableVehicles : _allFleetVehicles;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      padding: EdgeInsets.only(
        top: 14.h,
        left: 16.w,
        right: 16.w,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16.h,
      ),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22.r)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44.w,
              height: 4.h,
              decoration: BoxDecoration(
                color: kGrayLight.withOpacity(0.6),
                borderRadius: BorderRadius.circular(2.r),
              ),
            ),
          ),
          SizedBox(height: 12.h),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Fulfill Request • ${widget.share.shareCode}",
                    style:
                        appStyle(11, const Color(0xFF10B981), FontWeight.bold),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    "Assign Vehicles to Partner",
                    style: appStyle(18, kDark, FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: kDark),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Request Summary Card
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(12.w),
                    decoration: BoxDecoration(
                      color: kLightWhite,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(color: kGrayLight.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                borrowerDisplay,
                                style: appStyle(14, kDark, FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Text(
                              widget.share.borrowerEmail,
                              style: appStyle(11, kDarkGray, FontWeight.w500),
                            ),
                          ],
                        ),
                        SizedBox(height: 8.h),
                        Wrap(
                          spacing: 8.w,
                          runSpacing: 6.h,
                          children: [
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8.w, vertical: 4.h),
                              decoration: BoxDecoration(
                                color: kWhite,
                                borderRadius: BorderRadius.circular(8.r),
                                border: Border.all(
                                    color: kPrimary.withOpacity(0.35)),
                              ),
                              child: Text(
                                "🚛 Requested: $trucksCount Truck(s)",
                                style: appStyle(11, kPrimary, FontWeight.bold),
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8.w, vertical: 4.h),
                              decoration: BoxDecoration(
                                color: kWhite,
                                borderRadius: BorderRadius.circular(8.r),
                                border: Border.all(
                                    color: kSecondary.withOpacity(0.35)),
                              ),
                              child: Text(
                                "📦 Requested: $trailersCount Trailer(s)",
                                style:
                                    appStyle(11, kSecondary, FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        if (widget.share.description.isNotEmpty) ...[
                          SizedBox(height: 8.h),
                          RichText(
                            text: TextSpan(
                              style: appStyle(11, kDarkGray, FontWeight.normal),
                              children: [
                                const TextSpan(
                                    text: "Need / Load Notes: ",
                                    style:
                                        TextStyle(fontWeight: FontWeight.bold)),
                                TextSpan(text: widget.share.description),
                              ],
                            ),
                          ),
                        ],
                        SizedBox(height: 6.h),
                        Text(
                          "Period: ${widget.share.formattedStartDate} → ${widget.share.formattedExpectedEndDate}",
                          style: appStyle(11, kGray, FontWeight.normal),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 18.h),

                  // 2. Select Vehicles Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Select Vehicles (${_selectedVehicleIds.length} Selected)",
                          style: appStyle(13, kDark, FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        "Fleet: ${_allFleetVehicles.length} units",
                        style: appStyle(11, kGray, FontWeight.w600),
                      ),
                    ],
                  ),
                  SizedBox(height: 8.h),

                  if (_isLoadingVehicles)
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.h),
                      child: const Center(child: CircularProgressIndicator()),
                    )
                  else if (_allFleetVehicles.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(16.w),
                      decoration: BoxDecoration(
                        color: kLightWhite,
                        borderRadius: BorderRadius.circular(10.r),
                        border: Border.all(color: kGrayLight.withOpacity(0.3)),
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
                    // Available list
                    if (_availableVehicles.isNotEmpty) ...[
                      ..._availableVehicles
                          .map((v) => _buildVehicleTile(v, isInUse: false)),
                    ],

                    // In use / shared list (if available is empty OR as a secondary section)
                    if (_availableVehicles.isEmpty) ...[
                      Padding(
                        padding: EdgeInsets.symmetric(vertical: 4.h),
                        child: Text(
                          "All vehicles in your fleet are currently in active/pending shares. You can still select from below to assign:",
                          style: appStyle(
                              11, Colors.amber.shade900, FontWeight.w500),
                        ),
                      ),
                      ..._allFleetVehicles
                          .map((v) => _buildVehicleTile(v, isInUse: true)),
                    ] else if (_inUseVehicles.isNotEmpty) ...[
                      SizedBox(height: 6.h),
                      ExpansionTile(
                        tilePadding: EdgeInsets.zero,
                        title: Text(
                          "Vehicles currently in other shares (${_inUseVehicles.length})",
                          style: appStyle(12, kGray, FontWeight.w500),
                        ),
                        children: _inUseVehicles
                            .map((v) => _buildVehicleTile(v, isInUse: true))
                            .toList(),
                      ),
                    ],
                  ],

                  SizedBox(height: 18.h),

                  // 3. Lease Terms & Allocation Notes
                  Text(
                    "Sharing Agreement Terms / Allocation Notes (Optional)",
                    style: appStyle(12, kDark, FontWeight.bold),
                  ),
                  SizedBox(height: 6.h),
                  TextField(
                    controller: _termsController,
                    maxLines: 2,
                    style: appStyle(12, kDark, FontWeight.normal),
                    decoration: InputDecoration(
                      hintText:
                          "e.g. Standard equipment allocation for designated freight route...",
                      hintStyle: appStyle(11, kGray, FontWeight.normal),
                      filled: true,
                      fillColor: kLightWhite,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.r),
                        borderSide:
                            BorderSide(color: kGrayLight.withOpacity(0.4)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10.r),
                        borderSide: const BorderSide(color: Color(0xFF10B981)),
                      ),
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // 4. Protected Mileage Assignment Banner
                  Container(
                    padding: EdgeInsets.all(10.w),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5), // Emerald-50
                      borderRadius: BorderRadius.circular(10.r),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.verified_user_rounded,
                            color: const Color(0xFF10B981), size: 18.sp),
                        SizedBox(width: 8.w),
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: appStyle(11, const Color(0xFF064E3B),
                                  FontWeight.normal),
                              children: [
                                const TextSpan(
                                    text: "Protected Assignment: ",
                                    style:
                                        TextStyle(fontWeight: FontWeight.bold)),
                                TextSpan(
                                  text:
                                      "These vehicles will appear in $borrowerDisplay's fleet with service record permissions, but master odometer miles cannot be changed.",
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 20.h),

                  // 5. Action Buttons (Cancel & Confirm)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          style: OutlinedButton.styleFrom(
                            padding: EdgeInsets.symmetric(vertical: 12.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            side:
                                BorderSide(color: kGrayLight.withOpacity(0.6)),
                          ),
                          child: Text(
                            "Cancel",
                            style: appStyle(13, kDarkGray, FontWeight.w600),
                          ),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed:
                              (_isSubmitting || _selectedVehicleIds.isEmpty)
                                  ? null
                                  : _fulfillRequest,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            disabledBackgroundColor:
                                const Color(0xFF10B981).withOpacity(0.4),
                            padding: EdgeInsets.symmetric(vertical: 12.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                          ),
                          child: _isSubmitting
                              ? SizedBox(
                                  width: 18.w,
                                  height: 18.w,
                                  child: const CircularProgressIndicator(
                                      strokeWidth: 2, color: kWhite),
                                )
                              : Text(
                                  "Confirm & Assign Vehicles",
                                  style: appStyle(13, kWhite, FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 10.h),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
