import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';
import 'package:photo_view/photo_view.dart';

class RecordsDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const RecordsDetailsScreen({Key? key, required this.record})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final services = record['services'] as List<dynamic>? ?? [];
    final date = DateFormat('MM-dd-yy').format(DateTime.parse(record['date']));
    final vehicleType = record['vehicleDetails']['vehicleType'] ?? 'N/A';
    final imageUrl = record['imageUrl'];

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
                  if (imageUrl != null && imageUrl.toString().isNotEmpty) ...[
                    GestureDetector(
                      onTap: () {
                        // Show zoomable image dialog
                        showDialog(
                          context: context,
                          builder: (context) => Dialog(
                            child: Container(
                              width: MediaQuery.of(context).size.width * 0.9,
                              height: MediaQuery.of(context).size.height * 0.7,
                              child: PhotoView(
                                imageProvider: NetworkImage(imageUrl),
                                minScale: PhotoViewComputedScale.contained,
                                maxScale: PhotoViewComputedScale.covered * 2,
                              ),
                            ),
                          ),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 200.h,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12.r),
                          image: DecorationImage(
                            image: NetworkImage(imageUrl),
                            fit: BoxFit.cover,
                          ),
                        ),
                        child: Align(
                          alignment: Alignment.bottomRight,
                          child: Container(
                            margin: EdgeInsets.all(8.w),
                            padding: EdgeInsets.all(6.w),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(20.r),
                            ),
                            child: Icon(
                              Icons.zoom_in,
                              color: Colors.white,
                              size: 20.sp,
                            ),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 16.h),
                  ],

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
                  buildInfoRow(
                    Icons.date_range,
                    date,
                  ),
                  Divider(height: 24.h),
                  vehicleType == "Truck"
                      ? buildInfoRow(
                          Icons.tire_repair, record['miles'].toString())
                      : buildInfoRow(
                          Icons.tire_repair, record['hours'].toString()),
                  SizedBox(height: 10.h),
                  Text(
                    "Services:",
                    style: appStyleUniverse(18, kDark, FontWeight.bold),
                  ),
                  SizedBox(height: 8.h),

                  /// Sort services by name
                  Builder(builder: (context) {
                    final sortedServices = [...services];
                    sortedServices.sort((a, b) => (a['serviceName'] ?? '')
                        .toString()
                        .toLowerCase()
                        .compareTo(
                            (b['serviceName'] ?? '').toString().toLowerCase()));

                    return ListView.separated(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      itemCount: sortedServices.length,
                      separatorBuilder: (context, index) =>
                          Divider(height: 24.h),
                      itemBuilder: (context, index) {
                        final service = sortedServices[index];
                        final serviceName = service['serviceName'];
                        final serviceType = service['type'];
                        final rawNotificationValue =
                            service['nextNotificationValue'];
                        var nextNotificationValue;

                        if (rawNotificationValue != null &&
                            rawNotificationValue != 0 &&
                            rawNotificationValue != "0") {
                          if (serviceType == 'day') {
                            try {
                              final parsedDate = DateFormat('dd/MM/yyyy')
                                  .parse(rawNotificationValue);
                              nextNotificationValue =
                                  DateFormat('MM-dd-yyyy').format(parsedDate);
                            } catch (e) {
                              nextNotificationValue = "Invalid Date";
                            }
                          } else {
                            nextNotificationValue =
                                rawNotificationValue.toString();
                          }
                        }

                        final subServices = (service['subServices'] as List?)
                                ?.map((s) => s['name'])
                                .toList() ??
                            [];

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.build_outlined,
                                    size: 16, color: kSecondary),
                                SizedBox(width: 8.w),
                                Expanded(
                                  child: Text(
                                    "$serviceName ",
                                    style: appStyleUniverse(
                                        14, kDark, FontWeight.w500),
                                  ),
                                ),
                                if (nextNotificationValue != null)
                                  Container(
                                    padding:
                                        EdgeInsets.symmetric(horizontal: 6.w),
                                    decoration: BoxDecoration(
                                      color: kPrimary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12.r),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                            Icons.notifications_active_outlined,
                                            size: 15,
                                            color: kPrimary),
                                        SizedBox(width: 2.w),
                                        Text(
                                          "$nextNotificationValue",
                                          style: appStyleUniverse(
                                              14, kDark, FontWeight.w500),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                            if (subServices.isNotEmpty)
                              Padding(
                                padding: EdgeInsets.only(left: 28.w, top: 4.h),
                                child: Text(
                                  "Subservices: ${subServices.join(', ')}",
                                  style: appStyleUniverse(
                                      14, kDarkGray, FontWeight.w400),
                                ),
                              ),
                          ],
                        );
                      },
                    );
                  }),

                  if (record["description"].isNotEmpty) ...[
                    Divider(height: 24.h),
                    buildInfoRow(
                        Icons.description_outlined, record['description']),
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

  void _printRecordDetails() async {
    final pdf = pw.Document();
    final vehicle = record['vehicleDetails'];
    final services = record['services'] as List<dynamic>? ?? [];

    pdf.addPage(
      pw.MultiPage(
        build: (pw.Context context) => [
          pw.Padding(
            padding: const pw.EdgeInsets.all(16),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                _buildSectionTitle('Vehicle Details'),
                _buildDetailRow('🚗',
                    '${vehicle['vehicleNumber']} (${vehicle['companyName']})'),
                _buildSectionTitle('Workshop Details'),
                _buildDetailRow('🏭', record['workshopName'] ?? 'N/A'),
                _buildSectionTitle('Service Details'),
                _buildDetailRow('🛠️', 'Miles: ${record['miles']}'),
                pw.SizedBox(height: 2),
              ],
            ),
          ),
          ..._buildServicesList(services), // Spread the services list
          if (record["description"].isNotEmpty) ...[
            pw.Padding(
              padding: const pw.EdgeInsets.all(16),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Description'),
                  _buildDetailRow('📝', record['description']),
                ],
              ),
            ),
          ],
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  List<pw.Widget> _buildServicesList(List<dynamic> services) {
    return services.map((service) {
      final subServices = (service['subServices'] as List?)
              ?.map((s) => s['name'] as String)
              .toList() ??
          [];

      return pw.Container(
        margin: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 2),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: PdfColors.grey300),
          borderRadius: pw.BorderRadius.circular(8),
        ),
        padding: const pw.EdgeInsets.all(7),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Row(
              children: [
                pw.Expanded(
                  child: pw.Text(
                    service['serviceName'],
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromInt(kSecondary.value),
                    ),
                  ),
                ),
                if (service['nextNotificationValue'] != null &&
                    service['nextNotificationValue'] != 0)
                  _buildNotificationBadge(
                      service['nextNotificationValue'].toString()),
              ],
            ),
            if (subServices.isNotEmpty)
              pw.Padding(
                padding: const pw.EdgeInsets.only(left: 8, top: 8),
                child: pw.Text(
                  'Subservices: ${subServices.join(', ')}',
                  style: const pw.TextStyle(
                    fontSize: 11,
                    color: PdfColors.grey600,
                  ),
                ),
              ),
          ],
        ),
      );
    }).toList();
  }

  pw.Widget _buildSectionTitle(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 12,
          fontWeight: pw.FontWeight.bold,
          color: PdfColor.fromInt(kSecondary.value),
        ),
      ),
    );
  }

  pw.Widget _buildHeader() {
    return pw.Column(
      children: [
        pw.Text(
          'Service Record',
          style: pw.TextStyle(
            fontSize: 17,
            fontWeight: pw.FontWeight.bold,
            color: PdfColor.fromInt(kPrimary.value),
          ),
        ),
        pw.SizedBox(height: 1),
        pw.Text(
          DateFormat('dd-MM-yyyy').format(DateTime.parse(record['createdAt'])),
          style: pw.TextStyle(
            fontSize: 12,
            color: PdfColors.grey600,
          ),
        ),
        pw.Divider(thickness: 1, height: 24),
      ],
    );
  }

  pw.Widget _buildDetailRow(String icon, String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 6),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // pw.Text(icon, style: const pw.TextStyle(fontSize: 16)),
          pw.SizedBox(width: 1),
          pw.Expanded(
            child: pw.Text(
              text,
              style: const pw.TextStyle(
                fontSize: 11,
                color: PdfColors.grey800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _buildNotificationBadge(String text) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 2, vertical: 2),
      child: pw.Row(
        children: [
          // pw.Text('⏰', style: const pw.TextStyle(fontSize: 12)),
          pw.SizedBox(width: 1),
          pw.Text(text, style: const pw.TextStyle(fontSize: 10)),
        ],
      ),
    );
  }
}
