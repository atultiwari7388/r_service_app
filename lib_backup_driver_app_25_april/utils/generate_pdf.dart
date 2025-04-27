import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

Future<Uint8List> generateRecordPdf(List<dynamic> records) async {
  final pdf = pw.Document();
  final dateFormat = DateFormat('dd-MM-yy');

  pdf.addPage(
    pw.MultiPage(
      build: (context) => [
        pw.Header(
          level: 0,
          child: pw.Text('Service Records Report',
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
        ),
        ...records.map((record) {
          final services = record['services'] as List<dynamic>;
          final vehicle = record['vehicleDetails'];
          final date = dateFormat.format(DateTime.parse(record['createdAt']));

          return pw.Container(
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            margin: const pw.EdgeInsets.only(bottom: 12),
            padding: const pw.EdgeInsets.all(12),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Invoice & Date
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Invoice #${record['invoice']}',
                        style:  pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                    pw.Text(date),
                  ],
                ),
                pw.Divider(),

                // Vehicle Details
                pw.Text('Vehicle: ${vehicle['vehicleNumber']} (${vehicle['companyName']})'),

                // Services
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 4),
                  child: pw.Text('Services: ${services.map((s) => s['serviceName']).join(", ")}'),
                ),

                // Workshop & Description
                pw.Text('Workshop: ${record['workshopName'] ?? 'N/A'}'),
                if (record['description'].isNotEmpty)
                  pw.Text('Description: ${record['description']}'),

                // Financial & Usage Data
                pw.Divider(),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    if (record['invoiceAmount'].isNotEmpty)
                      pw.Text('Amount: ${record['invoiceAmount']}'),
                    if (record['miles'] != 0)
                      pw.Text('Miles: ${record['miles']}'),
                    if (record['hours'] != 0)
                      pw.Text('Hours: ${record['hours']}'),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ],
    ),
  );

  return pdf.save();
}