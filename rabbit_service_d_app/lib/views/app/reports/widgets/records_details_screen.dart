import 'dart:convert'; // For JSON encoding
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart'; // For actual printing
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';

class RecordsDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const RecordsDetailsScreen({Key? key, required this.record})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final services = record['services'] as List<dynamic>? ?? [];
    final date = DateFormat('dd-MM-yy').format(DateTime.parse(record['createdAt']));

    return Scaffold(
      appBar: AppBar(
        title: Text('Record Details',
            style: appStyleUniverse(25, kDark, FontWeight.normal)),
        actions: [
          IconButton(
            icon: Icon(Icons.print),
            onPressed: () {
              _printRecordDetails();
            },
          ),
        ],
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
            child: Padding(
              padding: EdgeInsets.all(16.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  buildInfoRow(Icons.directions_car_outlined,
                      '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})'),
                  Divider(height: 24.h),
                  buildInfoRow(Icons.store_outlined, record['workshopName'] ?? 'N/A'),
                  Divider(height: 24.h),
                  buildInfoRow(Icons.tire_repair, record['miles'].toString()),
                  SizedBox(height: 10.h),
                  Text("Services:", style: appStyleUniverse(18, kDark, FontWeight.bold)),
                  SizedBox(height: 8.h),
                  ListView.separated(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: services.length,
                    separatorBuilder: (context, index) => Divider(height: 24.h),
                    itemBuilder: (context, index) {
                      final service = services[index];
                      final serviceName = service['serviceName'];
                      final nextNotificationValue = service['nextNotificationValue'];
                      final subServices = (service['subServices'] as List?)
                          ?.map((s) => s['name'])
                          .toList() ??
                          [];

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.build_outlined, size: 16, color: kSecondary),
                              SizedBox(width: 8.w),
                              Expanded(
                                child: Text("$serviceName ",
                                    style: appStyleUniverse(14, kDark, FontWeight.w500)),
                              ),
                              if (nextNotificationValue != 0)
                                Container(
                                  padding: EdgeInsets.symmetric(horizontal: 6.w),
                                  decoration: BoxDecoration(
                                    color: kPrimary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.notifications_active_outlined,
                                          size: 15, color: kPrimary),
                                      SizedBox(width: 2.w),
                                      Text("$nextNotificationValue",
                                          style: appStyleUniverse(14, kDark, FontWeight.w500)),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          if (subServices.isNotEmpty)
                            Padding(
                              padding: EdgeInsets.only(left: 28.w, top: 4.h),
                              child: Text("Subservices: ${subServices.join(', ')}",
                                  style: appStyleUniverse(14, kDarkGray, FontWeight.w400)),
                            ),
                        ],
                      );
                    },
                  ),
                  if (record["description"].isNotEmpty) ...[
                    Divider(height: 24.h),
                    buildInfoRow(Icons.description_outlined, record['description']),
                  ],
                ],
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

  void _printRecordDetails() {
    final vehicleNumber = record['vehicleDetails']['vehicleNumber'];
    final companyName = record['vehicleDetails']['companyName'];
    final workshopName = record['workshopName'] ?? 'N/A';
    final miles = record['miles'];
    final services = record['services'] as List<dynamic>? ?? [];

    String formattedData = "Vehicle: $vehicleNumber ($companyName)\n"
        "Workshop: $workshopName\n"
        "Miles: $miles\n"
        "Services:\n";

    for (var service in services) {
      final serviceName = service['serviceName'];
      final nextNotificationValue = service['nextNotificationValue'];
      final subServices = (service['subServices'] as List?)
          ?.map((s) => s['name'])
          .toList() ??
          [];

      formattedData += "- $serviceName\n";
      if (subServices.isNotEmpty) {
        formattedData += "  Subservices: ${subServices.join(', ')}\n";
      }
      if (nextNotificationValue != 0) {
        formattedData += "  Next Notification: $nextNotificationValue\n";
      }
    }

    if (record["description"].isNotEmpty) {
      formattedData += "Description: ${record['description']}\n";
    }

    print(formattedData); // For debugging

    // For actual printing
    Printing.layoutPdf(onLayout: (format) async {
      return await Printing.convertHtml(
          format: format, html: "<pre>$formattedData</pre>");
    });
  }
}
