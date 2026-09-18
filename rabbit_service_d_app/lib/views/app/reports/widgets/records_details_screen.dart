import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';
import 'package:photo_view/photo_view.dart';

class RecordsDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const RecordsDetailsScreen({Key? key, required this.record})
      : super(key: key);

  Future<void> _printDocumentOrImage(
      BuildContext context, String url, bool isPdf) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (c) => const Center(child: CircularProgressIndicator()),
      );

      final response = await http.get(Uri.parse(url));
      if (Navigator.canPop(context)) {
        Navigator.of(context, rootNavigator: true).pop();
      }

      if (response.statusCode == 200) {
        final bytes = response.bodyBytes;
        if (isPdf) {
          await Printing.layoutPdf(
            onLayout: (PdfPageFormat format) async => bytes,
          );
        } else {
          final doc = pw.Document();
          final image = pw.MemoryImage(bytes);
          doc.addPage(
            pw.Page(
              pageFormat: PdfPageFormat.a4,
              margin: const pw.EdgeInsets.all(10),
              build: (pw.Context ctx) {
                return pw.Center(
                  child: pw.Image(image, fit: pw.BoxFit.contain),
                );
              },
            ),
          );
          await Printing.layoutPdf(
            onLayout: (PdfPageFormat format) async => doc.save(),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load file for printing')),
        );
      }
    } catch (e) {
      if (Navigator.canPop(context)) {
        Navigator.of(context, rootNavigator: true).pop();
      }
      debugPrint('Error printing document: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error printing: $e')),
      );
    }
  }

  Future<void> _downloadDocumentOrImage(
      BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch download URL')),
        );
      }
    } catch (e) {
      debugPrint('Error downloading document: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error downloading: $e')),
      );
    }
  }

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
                  buildInfoRow(
                    Icons.directions_car_outlined,
                    '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                  ),
                  Divider(height: 24.h),
                  buildInfoRow(Icons.category_outlined, vehicleType),
                  Divider(height: 24.h),
                  buildInfoRow(Icons.calendar_month_outlined, date),
                  Divider(height: 24.h),
                  buildInfoRow(Icons.storefront_outlined,
                      record['workshopName'] ?? 'N/A'),
                  Divider(height: 24.h),
                  buildInfoRow(
                    vehicleType == "Truck"
                        ? Icons.speed
                        : Icons.access_time_outlined,
                    vehicleType == "Truck"
                        ? '${record['miles'] ?? 'N/A'} Miles'
                        : '${record['hours'] ?? 'N/A'} Hours',
                  ),
                  Divider(height: 24.h),
                  buildInfoRow(
                    Icons.receipt_outlined,
                    (record['invoice'] != null &&
                            record['invoice'].toString().trim().isNotEmpty)
                        ? record['invoice'].toString()
                        : 'N/A',
                  ),
                  if (record['invoiceAmount'] != null &&
                      record['invoiceAmount'].toString().trim().isNotEmpty) ...[
                    Divider(height: 24.h),
                    buildInfoRow(
                      Icons.attach_money_outlined,
                      '\$${record['invoiceAmount']}',
                    ),
                  ],
                  Divider(height: 24.h),
                  Text(
                    'Next Due',
                    style: appStyleUniverse(16, kDark, FontWeight.bold),
                  ),
                  SizedBox(height: 10.h),
                  ...services.map((service) {
                    final subServices = (service['subServices'] as List?)
                            ?.map((s) => s['name'] as String)
                            .toList() ??
                        [];

                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              service['serviceName'],
                              style:
                                  appStyleUniverse(14, kDark, FontWeight.w500),
                            ),
                          ),
                        ],
                      ),
                      subtitle: subServices.isNotEmpty
                          ? Padding(
                              padding: EdgeInsets.only(top: 4.h),
                              child: Text(
                                '${subServices.join(', ')}',
                                style: appStyleUniverse(
                                  12,
                                  kDark.withOpacity(0.6),
                                  FontWeight.normal,
                                ),
                              ),
                            )
                          : null,
                      trailing: service['nextNotificationValue'] != null &&
                              service['nextNotificationValue'] != 0
                          ? Text(
                              '${service['type'] == 'day' ? service['nextNotificationValue'] : '${service['nextNotificationValue']} ${service['type'] == 'reading' ? 'miles' : 'hours'}'}',
                              style: appStyleUniverse(
                                12,
                                kDark.withOpacity(0.6),
                                FontWeight.normal,
                              ),
                            )
                          : null,
                    );
                  }),
                  if (record["description"].isNotEmpty) ...[
                    Divider(height: 24.h),
                    buildInfoRow(
                        Icons.description_outlined, record['description']),
                  ],
                  if (imageUrl != null && imageUrl.toString().isNotEmpty) ...[
                    Builder(builder: (context) {
                      final bool isPdfDoc =
                          imageUrl.toString().toLowerCase().contains('.pdf') ||
                              record['fileType'] == 'pdf';

                      if (isPdfDoc) {
                        return Container(
                          width: double.infinity,
                          padding: EdgeInsets.all(16.w),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12.r),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Column(
                            children: [
                              const Icon(Icons.picture_as_pdf,
                                  color: Colors.red, size: 48),
                              SizedBox(height: 8.h),
                              Text(
                                "Invoice / Service Document (PDF)",
                                style:
                                    appStyle(15, Colors.red, FontWeight.bold),
                              ),
                              SizedBox(height: 12.h),
                              Wrap(
                                spacing: 8.w,
                                runSpacing: 8.h,
                                alignment: WrapAlignment.center,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: () async {
                                      final uri =
                                          Uri.parse(imageUrl.toString());
                                      if (await canLaunchUrl(uri)) {
                                        await launchUrl(uri,
                                            mode:
                                                LaunchMode.externalApplication);
                                      }
                                    },
                                    icon:
                                        const Icon(Icons.open_in_new, size: 16),
                                    label: const Text("View / Open"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                      foregroundColor: Colors.white,
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 14.w, vertical: 8.h),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(8.r),
                                      ),
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: () => _downloadDocumentOrImage(
                                        context, imageUrl.toString()),
                                    icon: const Icon(Icons.download, size: 16),
                                    label: const Text("Download"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.grey.shade800,
                                      foregroundColor: Colors.white,
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 14.w, vertical: 8.h),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(8.r),
                                      ),
                                    ),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: () => _printDocumentOrImage(
                                        context, imageUrl.toString(), true),
                                    icon: const Icon(Icons.print, size: 16),
                                    label: const Text("Print"),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.red.shade700,
                                      side: BorderSide(
                                          color: Colors.red.shade300),
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 14.w, vertical: 8.h),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(8.r),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }

                      void openImageViewer() {
                        showDialog(
                          context: context,
                          builder: (dialogCtx) => Dialog(
                            insetPadding: EdgeInsets.symmetric(
                                horizontal: 10.w, vertical: 20.h),
                            backgroundColor: Colors.black87,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16.r),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Top Action Bar
                                Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 12.w, vertical: 8.h),
                                  decoration: BoxDecoration(
                                    color: Colors.black,
                                    borderRadius: BorderRadius.only(
                                      topLeft: Radius.circular(16.r),
                                      topRight: Radius.circular(16.r),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Text(
                                        "Document Image",
                                        style: appStyle(
                                            14, Colors.white, FontWeight.bold),
                                      ),
                                      const Spacer(),
                                      IconButton(
                                        icon: const Icon(Icons.print,
                                            color: Colors.white, size: 20),
                                        tooltip: "Print",
                                        onPressed: () => _printDocumentOrImage(
                                            context,
                                            imageUrl.toString(),
                                            false),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.download,
                                            color: Colors.white, size: 20),
                                        tooltip: "Download",
                                        onPressed: () =>
                                            _downloadDocumentOrImage(
                                                context, imageUrl.toString()),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.close,
                                            color: Colors.white, size: 20),
                                        tooltip: "Close",
                                        onPressed: () =>
                                            Navigator.pop(dialogCtx),
                                      ),
                                    ],
                                  ),
                                ),
                                // Zoomable Image
                                SizedBox(
                                  width:
                                      MediaQuery.of(context).size.width * 0.9,
                                  height:
                                      MediaQuery.of(context).size.height * 0.65,
                                  child: PhotoView(
                                    imageProvider: NetworkImage(imageUrl),
                                    minScale: PhotoViewComputedScale.contained,
                                    maxScale:
                                        PhotoViewComputedScale.covered * 2,
                                    backgroundDecoration: const BoxDecoration(
                                      color: Colors.transparent,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GestureDetector(
                            onTap: openImageViewer,
                            child: Container(
                              width: double.infinity,
                              height: 200.h,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12.r),
                                border: Border.all(color: Colors.grey.shade300),
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
                          SizedBox(height: 10.h),
                          Wrap(
                            spacing: 8.w,
                            runSpacing: 8.h,
                            alignment: WrapAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                onPressed: openImageViewer,
                                icon: const Icon(Icons.fullscreen, size: 16),
                                label: const Text("View Fullscreen"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kPrimary,
                                  foregroundColor: Colors.white,
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 12.w, vertical: 8.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                ),
                              ),
                              ElevatedButton.icon(
                                onPressed: () => _downloadDocumentOrImage(
                                    context, imageUrl.toString()),
                                icon: const Icon(Icons.download, size: 16),
                                label: const Text("Download"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey.shade800,
                                  foregroundColor: Colors.white,
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 12.w, vertical: 8.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: () => _printDocumentOrImage(
                                    context, imageUrl.toString(), false),
                                icon: const Icon(Icons.print, size: 16),
                                label: const Text("Print"),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: kPrimary,
                                  side: BorderSide(color: kPrimary),
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 12.w, vertical: 8.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    }),
                    SizedBox(height: 16.h),
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
