import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';

class RecordsDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const RecordsDetailsScreen({Key? key, required this.record})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final currentMiles = record['currentMilesArray'] as List<dynamic>? ?? [];

    final services = record['services'] as List<dynamic>;
    final date =
        DateFormat('dd-MM-yy').format(DateTime.parse(record['createdAt']));

    return Scaffold(
      appBar: AppBar(
        title: Text('Record Details',
            style: appStyleUniverse(25, kDark, FontWeight.normal)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),

        child: Container(
          margin: EdgeInsets.symmetric(vertical: 8.h),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15.r),
              side: BorderSide(
                color: kPrimary.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15.r),
              ),
              child: Padding(
                padding: EdgeInsets.all(16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (record['invoice'].isNotEmpty)
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 12.w,
                              vertical: 6.h,
                            ),
                            decoration: BoxDecoration(
                              color: kPrimary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20.r),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.receipt_outlined,
                                    size: 20, color: kPrimary),
                                SizedBox(width: 8.w),
                                Text("#${record['invoice']}",
                                    style: appStyleUniverse(
                                        16, kDark, FontWeight.w500)),
                              ],
                            ),
                          ),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12.w,
                            vertical: 6.h,
                          ),
                          decoration: BoxDecoration(
                            color: kSecondary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today,
                                  size: 18, color: kSecondary),
                              SizedBox(width: 8.w),
                              Text(date,
                                  style: appStyleUniverse(
                                      16, kDark, FontWeight.w500)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),
                    buildInfoRow(
                      Icons.directions_car_outlined,
                      '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                    ),
                    Divider(height: 24.h),
                    buildInfoRow(
                      Icons.store_outlined,
                      record['workshopName'] ?? 'N/A',
                    ),
                    Divider(height: 24.h),

                    buildInfoRow(Icons.tire_repair, record['miles'].toString(),)
,

                    SizedBox(height: 10.h),
                    // Replace the services section with this
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Services:",
                          style: appStyleUniverse(18, kDark, FontWeight.bold),
                        ),
                        SizedBox(height: 8.h),
                        ListView.separated(
                          physics: const NeverScrollableScrollPhysics(),
                          shrinkWrap: true,
                          itemCount: services.length,
                          separatorBuilder: (context, index) =>
                              Divider(height: 24.h),
                          itemBuilder: (context, index) {
                            final service = services[index];
                            final serviceName = service['serviceName'];
                            final nextNotificationValue =
                                service['nextNotificationValue'];
                            final subServices =
                                (service['subServices'] as List?)
                                        ?.map((s) => s['name'])
                                        .toList() ??
                                    [];

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.build_outlined,
                                        size: 20, color: kSecondary),
                                    SizedBox(width: 8.w),
                                    Expanded(
                                      child: Text(
                                        "$serviceName ",
                                        style: appStyleUniverse(
                                            16, kDark, FontWeight.w500),
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.only(
                                          left: 6.w, right: 6.w),
                                      decoration: nextNotificationValue == 0
                                          ? BoxDecoration()
                                          : BoxDecoration(
                                              color: kPrimary.withOpacity(0.1),
                                              borderRadius:
                                                  BorderRadius.circular(12.r),
                                            ),
                                      child: Row(
                                        children: [
                                          nextNotificationValue == 0
                                              ? Container()
                                              : Icon(
                                                  Icons
                                                      .notifications_active_outlined,
                                                  size: 20,
                                                  color: kPrimary),
                                          SizedBox(width: 2.w),
                                          nextNotificationValue == 0
                                              ? Text("")
                                              : Text("${nextNotificationValue}",
                                                  style: appStyleUniverse(16,
                                                      kDark, FontWeight.w500)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (subServices.isNotEmpty)
                                  Padding(
                                    padding:
                                        EdgeInsets.only(left: 28.w, top: 4.h),
                                    child: Text(
                                      "Subservices: ${subServices.join(', ')}",
                                      style: appStyleUniverse(
                                          14, kDarkGray, FontWeight.w400),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),

                    if (record["description"].isNotEmpty) ...[
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.description_outlined,
                        record['description'],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),

      ),
    );
  }

  Widget buildInfoRow(IconData icon, String vText) {
    return Row(
      children: [
        Icon(icon, size: 20, color: kSecondary),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(
            vText,
            style: appStyleUniverse(16, kDarkGray, FontWeight.w400),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget buildReusableRowTextWidget(String hText, String vText) {
    return Row(
      children: [
        Text(hText, style: appStyle(15, kDark, FontWeight.w500)),
        SizedBox(
          width: 250.w,
          child: Text(
            vText,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: appStyle(15, kDarkGray, FontWeight.w400),
          ),
        ),
      ],
    );
  }
}
