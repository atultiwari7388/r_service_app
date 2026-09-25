import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
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

  bool get isDispatchLoadNotification =>
      (notification['type'] ?? notification['category'] ?? '')
          .toString()
          .toLowerCase() ==
      'dispatch_load';

  @override
  Widget build(BuildContext context) {
    final services = (notification['notifications'] as List?) ?? [];

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
        title: Text(
            isDispatchLoadNotification ? "Dispatch Load" : "Service Reminder"),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            tooltip: "PDF",
            onPressed: () => _printPdf(context),
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: "Share",
            onPressed: () => _shareDetails(),
          ),
          SizedBox(width: 8.w),
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
                color: kPrimary.withValues(alpha: 0.2),
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
                    if (isDispatchLoadNotification) ...[
                      buildInfoRow(
                        Icons.local_shipping_outlined,
                        (notification['loadNumber'] ?? 'Load').toString(),
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.business_outlined,
                        (notification['customerName'] ?? '-').toString(),
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.upload_file_outlined,
                        '${(notification['pickupCompany'] ?? '-').toString()} -> ${(notification['deliveryCompany'] ?? '-').toString()}',
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.pin_drop_outlined,
                        (notification['pickupAddress'] ?? '-').toString(),
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.location_on_outlined,
                        (notification['deliveryAddress'] ?? '-').toString(),
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.route_outlined,
                        (notification['tenderedMiles'] ?? '-').toString(),
                      ),
                      Divider(height: 24.h),
                      buildInfoRow(
                        Icons.message_outlined,
                        (notification['message'] ?? '-').toString(),
                      ),
                    ] else ...[
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
                            "Next Due:",
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
                                final serviceName =
                                    service['serviceName'] ?? '';
                                final nextNotificationValue =
                                    service['nextNotificationValue'] ?? 0;
                                final serviceType = service['type'];
                                final formattedNotificationValue =
                                    serviceType == "day"
                                        ? convertDateFormat(
                                            nextNotificationValue)
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
                                            color:
                                                kPrimary.withValues(alpha: 0.1),
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

  void _shareDetails() {
    final StringBuffer buffer = StringBuffer();

    if (isDispatchLoadNotification) {
      buffer.writeln("📦 *Dispatch Load Details*");
      buffer.writeln("----------------------------");
      buffer.writeln("• *Load Number:* ${notification['loadNumber'] ?? '-'}");
      buffer.writeln("• *Customer:* ${notification['customerName'] ?? '-'}");
      buffer.writeln(
          "• *Route:* ${notification['pickupCompany'] ?? '-'} -> ${notification['deliveryCompany'] ?? '-'}");
      buffer.writeln(
          "• *Pickup Address:* ${notification['pickupAddress'] ?? '-'}");
      buffer.writeln(
          "• *Delivery Address:* ${notification['deliveryAddress'] ?? '-'}");
      buffer.writeln(
          "• *Tendered Miles:* ${notification['tenderedMiles'] ?? '-'}");
      if (notification['message'] != null &&
          notification['message'].toString().trim().isNotEmpty) {
        buffer.writeln("• *Message:* ${notification['message']}");
      }
    } else {
      final services = (notification['notifications'] as List?) ?? [];
      final sortedServices = List.from(services)
        ..sort((a, b) => (a['serviceName'] ?? '')
            .toString()
            .toLowerCase()
            .compareTo((b['serviceName'] ?? '').toString().toLowerCase()));

      final filteredServices = sortedServices
          .where((service) => (service['nextNotificationValue'] ?? 0) != 0)
          .toList();

      buffer.writeln("🔔 *Service Reminder Details*");
      buffer.writeln("----------------------------");
      buffer.writeln(
          "• *Vehicle:* ${vehicleData['vehicleNumber'] ?? '-'} (${vehicleData['companyName'] ?? '-'})");
      if (notification['currentMiles'] != null) {
        buffer.writeln(
            "• *Current Reading:* ${notification['currentMiles']} Miles");
      } else if (notification['hoursReading'] != null) {
        buffer.writeln(
            "• *Current Reading:* ${notification['hoursReading']} Hours");
      }

      buffer.writeln("\n📋 *Next Due Services:*");
      if (filteredServices.isEmpty) {
        buffer.writeln("  No services due.");
      } else {
        for (var service in filteredServices) {
          final serviceName = service['serviceName'] ?? '';
          final nextNotificationValue = service['nextNotificationValue'] ?? 0;
          final serviceType = service['type'];
          final formattedNotificationValue = serviceType == "day"
              ? convertDateFormat(nextNotificationValue)
              : nextNotificationValue.toString();
          buffer.writeln("  • $serviceName: $formattedNotificationValue");
        }
      }
    }

    Share.share(buffer.toString().trim());
  }

  Future<void> _printPdf(BuildContext context) async {
    final pdf = pw.Document();

    final services = (notification['notifications'] as List?) ?? [];
    final sortedServices = List.from(services)
      ..sort((a, b) => (a['serviceName'] ?? '')
          .toString()
          .toLowerCase()
          .compareTo((b['serviceName'] ?? '').toString().toLowerCase()));

    final filteredServices = sortedServices
        .where((service) => (service['nextNotificationValue'] ?? 0) != 0)
        .toList();

    final vehicleNumber = (vehicleData['vehicleNumber'] ??
            notification['vehicleNumber'] ??
            'Unknown')
        .toString();
    final companyName =
        (vehicleData['companyName'] ?? notification['companyName'] ?? 'Unknown')
            .toString();

    final currentReading = notification['currentMiles'] != null
        ? "${notification['currentMiles']} (current miles)"
        : (notification['hoursReading'] != null
            ? "${notification['hoursReading']} (current Hours)"
            : "N/A");

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        build: (pw.Context context) => [
          // Header
          pw.Container(
            padding:
                const pw.EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromInt(kPrimary.value),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  isDispatchLoadNotification
                      ? "Dispatch Load Details"
                      : "Service Reminder Details",
                  style: pw.TextStyle(
                    color: PdfColors.white,
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  DateFormat('MM-dd-yyyy').format(DateTime.now()),
                  style: const pw.TextStyle(
                    color: PdfColors.white,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 16),

          // Content Card
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300, width: 1),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                if (isDispatchLoadNotification) ...[
                  _buildPdfInfoRow("Load Number",
                      (notification['loadNumber'] ?? 'Load').toString()),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Customer",
                      (notification['customerName'] ?? '-').toString()),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Route",
                      '${(notification['pickupCompany'] ?? '-').toString()} -> ${(notification['deliveryCompany'] ?? '-').toString()}'),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Pickup Address",
                      (notification['pickupAddress'] ?? '-').toString()),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Delivery Address",
                      (notification['deliveryAddress'] ?? '-').toString()),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Tendered Miles",
                      (notification['tenderedMiles'] ?? '-').toString()),
                  if (notification['message'] != null &&
                      notification['message'].toString().trim().isNotEmpty) ...[
                    pw.Divider(color: PdfColors.grey300, height: 16),
                    _buildPdfInfoRow(
                        "Message", (notification['message'] ?? '-').toString()),
                  ],
                ] else ...[
                  _buildPdfInfoRow("Vehicle", "$vehicleNumber ($companyName)"),
                  pw.Divider(color: PdfColors.grey300, height: 16),
                  _buildPdfInfoRow("Current Reading", currentReading),
                  pw.Divider(color: PdfColors.grey300, height: 20),
                  pw.Padding(
                    padding: const pw.EdgeInsets.only(bottom: 10),
                    child: pw.Text(
                      "Next Due Services:",
                      style: pw.TextStyle(
                        fontSize: 13,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromInt(kPrimary.value),
                      ),
                    ),
                  ),
                  if (filteredServices.isEmpty)
                    pw.Padding(
                      padding: const pw.EdgeInsets.symmetric(vertical: 8),
                      child: pw.Text("No services due.",
                          style: const pw.TextStyle(
                              fontSize: 11, color: PdfColors.grey600)),
                    )
                  else
                    ...filteredServices.map((service) {
                      final serviceName =
                          (service['serviceName'] ?? '').toString();
                      final nextNotificationValue =
                          service['nextNotificationValue'] ?? 0;
                      final serviceType = service['type'];
                      final formattedNotificationValue = serviceType == "day"
                          ? convertDateFormat(nextNotificationValue)
                          : nextNotificationValue.toString();

                      return pw.Container(
                        margin: const pw.EdgeInsets.only(bottom: 8),
                        padding: const pw.EdgeInsets.symmetric(
                            vertical: 8, horizontal: 10),
                        decoration: pw.BoxDecoration(
                          color: PdfColors.grey100,
                          borderRadius: pw.BorderRadius.circular(6),
                        ),
                        child: pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              serviceName,
                              style: pw.TextStyle(
                                fontSize: 11,
                                fontWeight: pw.FontWeight.bold,
                              ),
                            ),
                            pw.Container(
                              padding: const pw.EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: pw.BoxDecoration(
                                color: PdfColor.fromInt(kSecondary.value),
                                borderRadius: pw.BorderRadius.circular(4),
                              ),
                              child: pw.Text(
                                formattedNotificationValue,
                                style: pw.TextStyle(
                                  color: PdfColors.white,
                                  fontSize: 11,
                                  fontWeight: pw.FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    try {
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      debugPrint("Printing error: $e");
    }
  }

  pw.Widget _buildPdfInfoRow(String title, String value) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          "$title:",
          style: pw.TextStyle(
            fontSize: 11,
            fontWeight: pw.FontWeight.bold,
            color: PdfColors.grey700,
          ),
        ),
        pw.SizedBox(width: 16),
        pw.Text(
          value,
          style: const pw.TextStyle(
            fontSize: 11,
            color: PdfColors.black,
          ),
        ),
      ],
    );
  }
}
