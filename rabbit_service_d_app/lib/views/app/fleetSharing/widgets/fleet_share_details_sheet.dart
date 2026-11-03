import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import '../models/fleet_share_model.dart';

class FleetShareDetailsSheet extends StatelessWidget {
  final FleetShareDoc share;
  final String effectiveUserId;

  const FleetShareDetailsSheet({
    super.key,
    required this.share,
    required this.effectiveUserId,
  });

  Widget _buildInfoRow(String label, String value, [Color? valueColor]) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110.w,
            child: Text(label, style: appStyle(12, kGray, FontWeight.normal)),
          ),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : "—",
              style: appStyle(13, valueColor ?? kDark, FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      padding: EdgeInsets.only(
        top: 16.h,
        left: 16.w,
        right: 16.w,
        bottom: 16.h,
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

          // Header: Share code & Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(share.shareCode,
                      style: appStyle(18, kDark, FontWeight.bold)),
                  SizedBox(height: 2.h),
                  Text(
                    share.isDirectOffer ? "Direct Lending Offer" : "Borrow Request",
                    style: appStyle(12, kPrimary, FontWeight.w500),
                  ),
                ],
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: share.statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Text(
                  share.statusLabel,
                  style: appStyle(12, share.statusColor, FontWeight.bold),
                ),
              ),
            ],
          ),
          const Divider(color: Color(0xFFEEEEEE)),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Parties Card
                  Container(
                    padding: EdgeInsets.all(12.w),
                    decoration: BoxDecoration(
                      color: kLightWhite,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(color: kGrayLight.withOpacity(0.25)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow(
                          "Lender Owner",
                          "${share.lenderName}${share.lenderCompanyName.isNotEmpty ? ' (${share.lenderCompanyName})' : ''}",
                        ),
                        _buildInfoRow("Lender Email", share.lenderEmail),
                        const Divider(height: 10, color: Color(0xFFEEEEEE)),
                        _buildInfoRow(
                          "Borrower",
                          "${share.borrowerName}${share.borrowerCompanyName.isNotEmpty ? ' (${share.borrowerCompanyName})' : ''}",
                        ),
                        _buildInfoRow("Borrower Email", share.borrowerEmail),
                      ],
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // Dates & Terms Card
                  Container(
                    padding: EdgeInsets.all(12.w),
                    decoration: BoxDecoration(
                      color: kLightWhite,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(color: kGrayLight.withOpacity(0.25)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow("Start Date", share.formattedStartDate),
                        _buildInfoRow("Expected Return", share.formattedExpectedEndDate),
                        if (share.actualEndDate.isNotEmpty)
                          _buildInfoRow("Actual Return", share.formattedActualEndDate, kSecondary),
                        if (share.description.isNotEmpty) ...[
                          const Divider(height: 10, color: Color(0xFFEEEEEE)),
                          _buildInfoRow("Purpose / Note", share.description),
                        ],
                        if (share.leaseTerms.isNotEmpty) ...[
                          const Divider(height: 10, color: Color(0xFFEEEEEE)),
                          _buildInfoRow("Lease Terms", share.leaseTerms),
                        ],
                      ],
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // Vehicles List
                  Text(
                    "Equipment Allocation (${share.vehicles.length})",
                    style: appStyle(14, kDark, FontWeight.bold),
                  ),
                  SizedBox(height: 8.h),

                  if (share.vehicles.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(12.w),
                      decoration: BoxDecoration(
                        color: kLightWhite,
                        borderRadius: BorderRadius.circular(10.r),
                        border: Border.all(color: kGrayLight.withOpacity(0.3)),
                      ),
                      child: Text(
                        share.isBorrowRequest
                            ? "Pending Assignment: ${share.requestedTrucks} Truck(s), ${share.requestedTrailers} Trailer(s)"
                            : "No vehicles allocated.",
                        style: appStyle(12, kGray, FontWeight.normal),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: share.vehicles.length,
                      separatorBuilder: (context, index) => SizedBox(height: 8.h),
                      itemBuilder: (context, index) {
                        final v = share.vehicles[index];
                        return Container(
                          padding: EdgeInsets.all(10.w),
                          decoration: BoxDecoration(
                            color: kWhite,
                            borderRadius: BorderRadius.circular(10.r),
                            border: Border.all(color: kGrayLight.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                v.vehicleType.toLowerCase() == 'trailer'
                                    ? Icons.rv_hookup_rounded
                                    : Icons.local_shipping_rounded,
                                color: kPrimary,
                                size: 22.sp,
                              ),
                              SizedBox(width: 10.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "${v.vehicleNumber} (${v.vehicleType})",
                                      style: appStyle(13, kDark, FontWeight.bold),
                                    ),
                                    Text(
                                      v.companyName.isNotEmpty
                                          ? v.companyName
                                          : (v.vin.isNotEmpty ? "VIN: ${v.vin}" : "Allocated Equipment"),
                                      style: appStyle(11, kGray, FontWeight.normal),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    "${v.currentMilesAtShare.toInt()} mi",
                                    style: appStyle(13, kSecondary, FontWeight.bold),
                                  ),
                                  Text("Start Miles",
                                      style: appStyle(10, kGray, FontWeight.normal)),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  SizedBox(height: 18.h),

                  // Event Audit Log
                  Text("Audit History", style: appStyle(14, kDark, FontWeight.bold)),
                  SizedBox(height: 8.h),
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('fleet_shares')
                        .doc(share.id)
                        .collection('history')
                        .orderBy('timestamp', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final docs = snapshot.data?.docs ?? [];
                      if (docs.isEmpty) {
                        return Container(
                          padding: EdgeInsets.all(10.w),
                          child: Text("No history events logged yet.",
                              style: appStyle(12, kGray, FontWeight.normal)),
                        );
                      }
                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: docs.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 10, color: Color(0xFFEEEEEE)),
                        itemBuilder: (context, index) {
                          final hData = docs[index].data() as Map<String, dynamic>;
                          final action = (hData['action'] ?? 'UPDATE').toString();
                          final notes = (hData['notes'] ?? '').toString();
                          final ts = hData['timestamp'];
                          String timeStr = '';
                          if (ts is Timestamp) {
                            timeStr = DateFormat('MM-dd-yyyy hh:mm a').format(ts.toDate());
                          } else if (ts is DateTime) {
                            timeStr = DateFormat('MM-dd-yyyy hh:mm a').format(ts);
                          } else if (ts != null) {
                            final dt = parseFleetDate(ts);
                            if (dt != null) {
                              timeStr = DateFormat('MM-dd-yyyy hh:mm a').format(dt);
                            }
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.circle, size: 8.sp, color: kPrimary),
                              SizedBox(width: 8.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(action,
                                            style: appStyle(12, kDark, FontWeight.bold)),
                                        Text(timeStr,
                                            style: appStyle(10, kGray, FontWeight.normal)),
                                      ],
                                    ),
                                    if (notes.isNotEmpty) ...[
                                      SizedBox(height: 2.h),
                                      Text(notes,
                                          style: appStyle(11, kDarkGray, FontWeight.normal)),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      );
                    },
                  ),
                  SizedBox(height: 20.h),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
