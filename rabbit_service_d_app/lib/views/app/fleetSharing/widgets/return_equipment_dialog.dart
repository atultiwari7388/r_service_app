import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import '../models/fleet_share_model.dart';
import '../services/fleet_sharing_team_sync.dart';

class ReturnEquipmentDialog extends StatefulWidget {
  final FleetShareDoc share;
  final bool isLender;

  const ReturnEquipmentDialog({
    super.key,
    required this.share,
    this.isLender = false,
  });

  @override
  State<ReturnEquipmentDialog> createState() => _ReturnEquipmentDialogState();
}

class _ReturnEquipmentDialogState extends State<ReturnEquipmentDialog> {
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _confirmReturn() async {
    setState(() => _isSubmitting = true);

    try {
      final currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
      final nowStr = DateFormat('MM-dd-yyyy').format(DateTime.now());
      final defaultNotes = widget.isLender
          ? 'Equipment recalled by owner. Normal fleet operations restored.'
          : 'Equipment returned to original owner. Normal fleet operations restored.';

      final batch = FirebaseFirestore.instance.batch();
      final shareRef = FirebaseFirestore.instance
          .collection('fleet_shares')
          .doc(widget.share.id);

      batch.update(shareRef, {
        'status': 'completed',
        'actualEndDate': nowStr,
        'returnNotes': _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : defaultNotes,
        'completedAt': FieldValue.serverTimestamp(),
        'lastUpdatedById': currentUid,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Reset lender's vehicles back to normal fleet status and sync across team
      final Map<String, dynamic> resetData = {
        'isAssignedToOther': false,
        'sharingPending': false,
        'sharedWith': FieldValue.delete(),
      };

      final lenderVehicleIds = widget.share.vehicles
          .map((v) => v.vehicleId)
          .where((id) => id.isNotEmpty)
          .toList();

      await FleetSharingTeamSync.syncMultipleVehiclesAcrossTeam(
        ownerUid: widget.share.lenderId,
        vehicleIds: lenderVehicleIds,
        statusData: resetData,
        existingBatch: batch,
      );

      await batch.commit();

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: kSecondary,
            content: Text(widget.isLender
                ? "Agreement ${widget.share.shareCode} recalled. Vehicles returned to your fleet."
                : "Agreement ${widget.share.shareCode} marked as Completed. Vehicles returned."),
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

  @override
  Widget build(BuildContext context) {
    final title =
        widget.isLender ? "Recall / Reclaim Equipment" : "Return to Owner";
    final message = widget.isLender
        ? "Are you sure you want to end agreement ${widget.share.shareCode} and recall your vehicles back to your fleet?"
        : "Are you sure you want to complete agreement ${widget.share.shareCode} and return the vehicles to owner?";
    final vehiclesLabel = widget.isLender
        ? "Vehicles being recalled:"
        : "Vehicles being returned:";
    final notesLabel = widget.isLender
        ? "Recall / Return Notes (Optional):"
        : "Return Notes / Inspection Note (Optional):";
    final confirmButtonText =
        widget.isLender ? "Confirm Recall" : "Confirm Return";

    return AlertDialog(
      title: Row(
        children: [
          Icon(
            widget.isLender
                ? Icons.replay_rounded
                : Icons.assignment_return_rounded,
            color: kPrimary,
            size: 24.sp,
          ),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(title, style: appStyle(16, kDark, FontWeight.bold)),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              style: appStyle(13, kDark, FontWeight.normal),
            ),
            SizedBox(height: 12.h),
            if (widget.share.vehicles.isNotEmpty) ...[
              Text(vehiclesLabel, style: appStyle(12, kDark, FontWeight.bold)),
              SizedBox(height: 6.h),
              Wrap(
                spacing: 6.w,
                runSpacing: 6.h,
                children: widget.share.vehicles.map((v) {
                  return Chip(
                    backgroundColor: kLightWhite,
                    side: BorderSide(color: kGrayLight.withOpacity(0.3)),
                    label: Text(
                      "${v.vehicleNumber} (${v.vehicleType})",
                      style: appStyle(11, kDark, FontWeight.w500),
                    ),
                  );
                }).toList(),
              ),
              SizedBox(height: 12.h),
            ],
            Text(notesLabel, style: appStyle(12, kDark, FontWeight.bold)),
            SizedBox(height: 6.h),
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: widget.isLender
                    ? "e.g. Recalling for urgent loads, regular maintenance..."
                    : "e.g. Return inspection complete, no damages, keys handed over...",
                contentPadding: EdgeInsets.all(10.w),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.r),
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
          child: Text("Cancel", style: appStyle(14, kGray, FontWeight.normal)),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _confirmReturn,
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          child: _isSubmitting
              ? SizedBox(
                  width: 16.w,
                  height: 16.w,
                  child: const CircularProgressIndicator(
                      strokeWidth: 2, color: kWhite),
                )
              : Text(confirmButtonText,
                  style: appStyle(14, kWhite, FontWeight.bold)),
        ),
      ],
    );
  }
}
