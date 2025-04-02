import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen(
      {super.key, required this.notification, required this.vehicleData});
  final Map<String, dynamic> notification;
  final Map<String, dynamic> vehicleData;

  @override
  Widget build(BuildContext context) {
    final services = notification['notifications'] as List;

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
                    buildInfoRow(
                      Icons.gas_meter,
                      notification['currentMiles'].toString() +
                          " (current miles)",
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
                                // if (subServices.isNotEmpty)
                                //   Padding(
                                //     padding:
                                //         EdgeInsets.only(left: 28.w, top: 4.h),
                                //     child: Text(
                                //       "Subservices: ${subServices.join(', ')}",
                                //       style: appStyleUniverse(
                                //           14, kDarkGray, FontWeight.w400),
                                //     ),
                                //   ),
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
