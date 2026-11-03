import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class MilesDetailsScreen extends StatelessWidget {
  const MilesDetailsScreen({super.key, required this.milesRecord});

  final Map<String, dynamic> milesRecord;

  DateTime? _parseDate(dynamic dateVal) {
    if (dateVal == null) return null;
    if (dateVal is DateTime) return dateVal;
    if (dateVal is Timestamp) return dateVal.toDate();
    final str = dateVal.toString().trim();
    if (str.isEmpty) return null;

    try {
      return DateTime.parse(str);
    } catch (_) {}

    // Fallback parsing for legacy formats
    final formats = [
      'yyyy-MM-dd',
      'dd-MM-yyyy',
      'MM-dd-yyyy',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'yyyy/MM/dd',
    ];
    for (final fmt in formats) {
      try {
        return DateFormat(fmt).parseStrict(str);
      } catch (_) {}
    }
    return null;
  }

  String _formatDate(dynamic dateVal) {
    final parsed = _parseDate(dateVal);
    if (parsed != null) {
      return DateFormat('MM-dd-yyyy').format(parsed);
    }
    return dateVal?.toString() ?? 'N/A';
  }

  List<Map<String, dynamic>> _getSortedRecords(bool isTruck) {
    final rawList = isTruck
        ? (milesRecord['currentMilesArray'] as List<dynamic>? ?? [])
        : ((milesRecord['hoursReadingArray'] as List<dynamic>?) ??
            (milesRecord['currentMilesArray'] as List<dynamic>? ?? []));

    final List<Map<String, dynamic>> list = [];
    for (var item in rawList) {
      if (item is Map) {
        final map = Map<String, dynamic>.from(item);
        map['_parsedDate'] =
            _parseDate(map['date'] ?? map['createdAt'] ?? map['dateTime']);
        list.add(map);
      }
    }

    // Sort latest date on top (descending)
    list.sort((a, b) {
      final DateTime? dateA = a['_parsedDate'] as DateTime?;
      final DateTime? dateB = b['_parsedDate'] as DateTime?;
      if (dateA == null && dateB == null) return 0;
      if (dateA == null) return 1; // nulls at the end
      if (dateB == null) return -1;
      return dateB.compareTo(dateA); // Latest first
    });

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final vehicleType = (milesRecord['vehicleType'] ?? 'Truck').toString();
    final isTruck = vehicleType.toLowerCase() == "truck";
    final vehicleNumber = (milesRecord['vehicleNumber'] ?? 'N/A').toString();
    final companyName = (milesRecord['companyName'] ?? '').toString();
    final engineName = (milesRecord['engineName'] ?? 'N/A').toString();
    final totalReading = isTruck
        ? (milesRecord['currentMiles'] ?? '0').toString()
        : (milesRecord['hoursReading'] ?? '0').toString();

    final sortedRecords = _getSortedRecords(isTruck);

    return Scaffold(
      backgroundColor: kLightWhite,
      appBar: AppBar(
        backgroundColor: kWhite,
        elevation: 0.5,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kDark, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          isTruck ? "Miles Record" : "Hours Record",
          style: appStyle(18, kDark, FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Vehicle Overview Card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16.w),
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.circular(16.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
                border: Border.all(color: kGrayLight.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Vehicle Number & Company
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.all(10.r),
                        decoration: BoxDecoration(
                          color: kPrimary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Icon(
                          isTruck
                              ? Icons.local_shipping_rounded
                              : Icons.build_circle_rounded,
                          color: kPrimary,
                          size: 26.sp,
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              vehicleNumber,
                              style: appStyle(18, kDark, FontWeight.bold),
                            ),
                            if (companyName.isNotEmpty) ...[
                              SizedBox(height: 2.h),
                              Text(
                                companyName,
                                style:
                                    appStyle(13, kDarkGray, FontWeight.normal),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 10.w, vertical: 4.h),
                        decoration: BoxDecoration(
                          color: kSecondary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20.r),
                        ),
                        child: Text(
                          vehicleType,
                          style: appStyle(12, kSecondary, FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 14.h),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  SizedBox(height: 14.h),

                  // Engine & Current Total KPI Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Engine info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Engine",
                              style: appStyle(12, kGray, FontWeight.w500),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              engineName,
                              style: appStyle(14, kDark, FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      // Total Miles/Hours KPI
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            isTruck ? "Total Miles" : "Total Hours",
                            style: appStyle(12, kGray, FontWeight.w500),
                          ),
                          SizedBox(height: 4.h),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.speed_rounded,
                                size: 16.sp,
                                color: kSecondary,
                              ),
                              SizedBox(width: 4.w),
                              Text(
                                totalReading,
                                style:
                                    appStyle(16, kSecondary, FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 22.h),

            // Section Header: History Entries
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      isTruck ? "Miles History" : "Hours History",
                      style: appStyle(16, kDark, FontWeight.bold),
                    ),
                    SizedBox(width: 8.w),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                      decoration: BoxDecoration(
                        color: kPrimary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Text(
                        "${sortedRecords.length}",
                        style: appStyle(12, kPrimary, FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                Text(
                  "Latest first",
                  style: appStyle(12, kGray, FontWeight.w500),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // History Records List
            if (sortedRecords.isEmpty)
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: 40.h),
                decoration: BoxDecoration(
                  color: kWhite,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: kGrayLight.withOpacity(0.3)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.history_toggle_off_rounded,
                      size: 48.sp,
                      color: kGrayLight,
                    ),
                    SizedBox(height: 10.h),
                    Text(
                      isTruck
                          ? "No miles records found"
                          : "No hours records found",
                      style: appStyle(14, kGray, FontWeight.w500),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: sortedRecords.length,
                separatorBuilder: (context, index) => SizedBox(height: 10.h),
                itemBuilder: (context, index) {
                  final record = sortedRecords[index];
                  final formattedDate = _formatDate(
                    record['date'] ?? record['createdAt'] ?? record['dateTime'],
                  );
                  final value = record['miles'] ??
                      record['hours'] ??
                      record['reading'] ??
                      record['currentMiles'] ??
                      '-';

                  final isLatest = index == 0;

                  return Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                    decoration: BoxDecoration(
                      color: kWhite,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(
                        color: isLatest
                            ? kSecondary.withOpacity(0.4)
                            : kGrayLight.withOpacity(0.25),
                        width: isLatest ? 1.2 : 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isLatest
                              ? kSecondary.withOpacity(0.06)
                              : Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Calendar Icon Indicator
                        Container(
                          padding: EdgeInsets.all(8.r),
                          decoration: BoxDecoration(
                            color: isLatest
                                ? kSecondary.withOpacity(0.12)
                                : kPrimary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: Icon(
                            Icons.calendar_month_rounded,
                            size: 18.sp,
                            color: isLatest ? kSecondary : kPrimary,
                          ),
                        ),
                        SizedBox(width: 12.w),

                        // Date & Latest Badge
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    formattedDate,
                                    style: appStyle(
                                      14,
                                      kDark,
                                      isLatest
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                    ),
                                  ),
                                  if (isLatest) ...[
                                    SizedBox(width: 8.w),
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 6.w, vertical: 2.h),
                                      decoration: BoxDecoration(
                                        color: kSecondary,
                                        borderRadius:
                                            BorderRadius.circular(6.r),
                                      ),
                                      child: Text(
                                        "LATEST",
                                        style: TextStyle(
                                          color: kWhite,
                                          fontSize: 9.sp,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              SizedBox(height: 2.h),
                              Text(
                                "Entry #${sortedRecords.length - index}",
                                style: appStyle(11, kGray, FontWeight.normal),
                              ),
                            ],
                          ),
                        ),

                        // Value (Miles / Hours)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "$value",
                              style: appStyle(
                                16,
                                isLatest ? kSecondary : kDark,
                                FontWeight.bold,
                              ),
                            ),
                            Text(
                              isTruck ? "Miles" : "Hours",
                              style: appStyle(11, kGray, FontWeight.w500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            SizedBox(height: 24.h),
          ],
        ),
      ),
    );
  }
}
