import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import '../models/fleet_share_model.dart';
import '../services/fleet_sharing_team_sync.dart';
import 'fleet_share_details_sheet.dart';
import 'fulfill_request_dialog.dart';
import 'return_equipment_dialog.dart';

class FleetShareCard extends StatelessWidget {
  final FleetShareDoc share;
  final String effectiveUserId;
  final String currentUId;
  final String currentEmail;
  final List<LocalFleetVehicle>? preloadedVehicles;

  const FleetShareCard({
    super.key,
    required this.share,
    required this.effectiveUserId,
    required this.currentUId,
    required this.currentEmail,
    this.preloadedVehicles,
  });

  Future<void> _acceptShare(BuildContext context) async {
    try {
      final batch = FirebaseFirestore.instance.batch();
      final shareRef = FirebaseFirestore.instance
          .collection('fleet_shares')
          .doc(share.id);

      batch.update(shareRef, {
        'status': 'active',
        'borrowerId': effectiveUserId,
        'lastUpdatedById': currentUId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Update lender's vehicles with assigned status and sync across team
      final Map<String, dynamic> statusData = {
        'isAssignedToOther': true,
        'sharingPending': false,
        'sharedWith': {
          'borrowerId': effectiveUserId,
          'borrowerEmail': currentEmail,
          'borrowerName': share.borrowerName,
          'borrowerCompanyName': share.borrowerCompanyName,
          'shareId': share.id,
          'shareCode': share.shareCode,
          'assignedAt': FieldValue.serverTimestamp(),
        },
      };

      final lenderVehicleIds = share.vehicles
          .map((v) => v.vehicleId)
          .where((id) => id.isNotEmpty)
          .toList();

      await FleetSharingTeamSync.syncMultipleVehiclesAcrossTeam(
        ownerUid: share.lenderId,
        vehicleIds: lenderVehicleIds,
        statusData: statusData,
        existingBatch: batch,
      );

      await batch.commit();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: kSecondary,
          content: Text("Fleet sharing accepted! Equipment is now active."),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: kRed, content: Text("Failed to accept: $e")),
      );
    }
  }

  Future<void> _rejectShare(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Decline Share Offer"),
        content: Text(
            "Are you sure you want to decline offer ${share.shareCode} from ${share.lenderName}?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("No"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: kRed),
            child: const Text("Decline", style: TextStyle(color: kWhite)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final batch = FirebaseFirestore.instance.batch();
      final shareRef = FirebaseFirestore.instance
          .collection('fleet_shares')
          .doc(share.id);

      batch.update(shareRef, {
        'status': 'rejected',
        'lastUpdatedById': currentUId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Clear pending state on lender's vehicles and sync across team
      final lenderVehicleIds = share.vehicles
          .map((v) => v.vehicleId)
          .where((id) => id.isNotEmpty)
          .toList();

      await FleetSharingTeamSync.syncMultipleVehiclesAcrossTeam(
        ownerUid: share.lenderId,
        vehicleIds: lenderVehicleIds,
        statusData: {'sharingPending': false},
        existingBatch: batch,
      );

      await batch.commit();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Offer declined.")),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: kRed, content: Text("Error: $e")),
      );
    }
  }

  void _openDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FleetShareDetailsSheet(
        share: share,
        effectiveUserId: effectiveUserId,
      ),
    );
  }

  void _openFulfillDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FulfillRequestDialog(
        share: share,
        effectiveUserId: effectiveUserId,
        preloadedVehicles: preloadedVehicles,
      ),
    );
  }

  void _openReturnDialog(BuildContext context) {
    final isLender = share.isLender(effectiveUserId, currentEmail) ||
        share.isLender(currentUId);
    showDialog(
      context: context,
      builder: (context) => ReturnEquipmentDialog(
        share: share,
        isLender: isLender,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLender = share.isLender(effectiveUserId, currentEmail);
    final isBorrower = share.isBorrower(effectiveUserId, currentEmail);

    final partnerTitle = isLender
        ? "Borrower: ${share.borrowerName}${share.borrowerCompanyName.isNotEmpty ? ' (${share.borrowerCompanyName})' : ''}"
        : "Lender: ${share.lenderName}${share.lenderCompanyName.isNotEmpty ? ' (${share.lenderCompanyName})' : ''}";

    return GestureDetector(
      onTap: () => _openDetails(context),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: kWhite,
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(
            color: share.isActive
                ? kSecondary.withOpacity(0.4)
                : kGrayLight.withOpacity(0.25),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Share Code, Type & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                      decoration: BoxDecoration(
                        color: kPrimary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Text(
                        share.shareCode,
                        style: appStyle(12, kPrimary, FontWeight.bold),
                      ),
                    ),
                    SizedBox(width: 8.w),
                    Text(
                      share.isDirectOffer ? "Lending Offer" : "Borrow Request",
                      style: appStyle(12, kDarkGray, FontWeight.w500),
                    ),
                  ],
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                  decoration: BoxDecoration(
                    color: share.statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    share.statusLabel,
                    style: appStyle(11, share.statusColor, FontWeight.bold),
                  ),
                ),
              ],
            ),
            SizedBox(height: 10.h),

            // Partner Name & Company
            Text(
              partnerTitle,
              style: appStyle(14, kDark, FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: 4.h),

            // Equipment Info
            if (share.vehicles.isNotEmpty) ...[
              Wrap(
                spacing: 6.w,
                runSpacing: 4.h,
                children: share.vehicles.take(3).map((v) {
                  return Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: kLightWhite,
                      borderRadius: BorderRadius.circular(6.r),
                      border: Border.all(color: kGrayLight.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          v.vehicleType.toLowerCase() == 'trailer'
                              ? Icons.rv_hookup_rounded
                              : Icons.local_shipping_rounded,
                          size: 13.sp,
                          color: kPrimary,
                        ),
                        SizedBox(width: 4.w),
                        Text(
                          v.vehicleNumber,
                          style: appStyle(11, kDark, FontWeight.w500),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              if (share.vehicles.length > 3)
                Padding(
                  padding: EdgeInsets.only(top: 4.h),
                  child: Text(
                    "+${share.vehicles.length - 3} more vehicles",
                    style: appStyle(11, kGray, FontWeight.normal),
                  ),
                ),
            ] else if (share.isBorrowRequest) ...[
              Text(
                "Requested: ${share.requestedTrucks} Truck(s), ${share.requestedTrailers} Trailer(s)",
                style: appStyle(12, kPrimary, FontWeight.w500),
              ),
            ],
            SizedBox(height: 8.h),

            // Dates Row
            Row(
              children: [
                Icon(Icons.calendar_today_outlined,
                    size: 13.sp, color: kGray),
                SizedBox(width: 4.w),
                Text(
                  "${share.formattedStartDate} → ${share.formattedExpectedEndDate}",
                  style: appStyle(11, kGray, FontWeight.normal),
                ),
              ],
            ),
            if (share.actualEndDate.isNotEmpty) ...[
              SizedBox(height: 4.h),
              Row(
                children: [
                  Icon(Icons.assignment_turned_in_outlined,
                      size: 13.sp, color: kSecondary),
                  SizedBox(width: 4.w),
                  Text(
                    "Returned: ${share.formattedActualEndDate}",
                    style: appStyle(11, kSecondary, FontWeight.w500),
                  ),
                ],
              ),
            ],

            // Action Buttons
            if (share.isPending) ...[
              SizedBox(height: 10.h),
              const Divider(height: 1, color: Color(0xFFEEEEEE)),
              SizedBox(height: 8.h),

              // Borrower received a direct lending offer
              if (isBorrower && share.isDirectOffer) ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _rejectShare(context),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: kRed),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.r)),
                        ),
                        child: Text("Decline",
                            style: appStyle(12, kRed, FontWeight.w600)),
                      ),
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _acceptShare(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kSecondary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.r)),
                        ),
                        child: Text("Accept Offer",
                            style: appStyle(12, kWhite, FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],

              // Lender received a borrow request
              if (isLender && share.isBorrowRequest) ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _rejectShare(context),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: kRed),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.r)),
                        ),
                        child: Text("Decline",
                            style: appStyle(12, kRed, FontWeight.w600)),
                      ),
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _openFulfillDialog(context),
                        icon: Icon(Icons.check_circle_outline_rounded,
                            size: 16.sp, color: kWhite),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.r)),
                        ),
                        label: Text("Accept & Assign",
                            style: appStyle(12, kWhite, FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ],

            // Active Share: Recall (Lender) / Return (Borrower) button
            if (share.isActive) ...[
              SizedBox(height: 10.h),
              const Divider(height: 1, color: Color(0xFFEEEEEE)),
              SizedBox(height: 8.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _openReturnDialog(context),
                    icon: Icon(
                      isLender
                          ? Icons.replay_rounded
                          : Icons.assignment_return_outlined,
                      size: 15.sp,
                      color: isLender ? kPrimary : kDark,
                    ),
                    label: Text(
                      isLender ? "Recall / Reclaim" : "Return to Owner",
                      style: appStyle(
                          12, isLender ? kPrimary : kDark, FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: isLender
                            ? kPrimary.withOpacity(0.5)
                            : kGrayLight.withOpacity(0.6),
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8.r)),
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
