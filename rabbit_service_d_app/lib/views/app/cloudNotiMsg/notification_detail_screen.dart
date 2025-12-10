import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/convert_date_format.dart';

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen({
    super.key,
    required this.notification,
    required this.vehicleData,
  });

  final Map<String, dynamic> notification;
  final Map<String, dynamic> vehicleData;

  @override
  Widget build(BuildContext context) {
    final services = notification['notifications'] as List;

    // Sort and filter services
    final sortedServices = List.from(services)
      ..sort((a, b) => (a['serviceName'] ?? '')
          .toString()
          .toLowerCase()
          .compareTo((b['serviceName'] ?? '').toString().toLowerCase()));

    final filteredServices = sortedServices
        .where((service) => (service['nextNotificationValue'] ?? 0) != 0)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text("Service Reminder"),
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
                    buildInfoRow(
                      Icons.directions_car_outlined,
                      '${vehicleData['vehicleNumber']} (${vehicleData['companyName']})',
                    ),
                    Divider(height: 24.h),
                    notification['currentMiles'] == null
                        ? buildInfoRow(
                            Icons.gas_meter,
                            "${notification['hoursReading']} (current Hours)",
                          )
                        : buildInfoRow(
                            Icons.gas_meter,
                            "${notification['currentMiles']} (current miles)",
                          ),
                    Divider(height: 24.h),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Services:",
                          style: appStyleUniverse(18, kDark, FontWeight.bold),
                        ),
                        SizedBox(height: 8.h),
                        if (filteredServices.isEmpty)
                          Text(
                            "No services due.",
                            style: appStyleUniverse(
                                16, kDarkGray, FontWeight.w400),
                          )
                        else
                          ListView.separated(
                            physics: const NeverScrollableScrollPhysics(),
                            shrinkWrap: true,
                            itemCount: filteredServices.length,
                            separatorBuilder: (context, index) =>
                                Divider(height: 24.h),
                            itemBuilder: (context, index) {
                              final service = filteredServices[index];
                              final serviceName = service['serviceName'] ?? '';
                              final nextNotificationValue =
                                  service['nextNotificationValue'] ?? 0;
                              final serviceType = service['type'];
                              final formattedNotificationValue =
                                  serviceType == "day"
                                      ? convertDateFormat(nextNotificationValue)
                                      : nextNotificationValue.toString();

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
                                          serviceName,
                                          style: appStyleUniverse(
                                              16, kDark, FontWeight.w500),
                                        ),
                                      ),
                                      Container(
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 6.w),
                                        decoration: BoxDecoration(
                                          color: kPrimary.withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(12.r),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons
                                                  .notifications_active_outlined,
                                              size: 20,
                                              color: kPrimary,
                                            ),
                                            SizedBox(width: 2.w),
                                            Text(
                                              "$formattedNotificationValue",
                                              style: appStyleUniverse(
                                                  16, kDark, FontWeight.w500),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              );
                            },
                          ),
                      ],
                    ),
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
