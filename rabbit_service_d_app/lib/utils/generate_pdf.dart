import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

String _formatPdfDate(dynamic val) {
  if (val == null) return 'N/A';
  if (val is DateTime) return DateFormat('MM-dd-yyyy').format(val);
  if (val is Timestamp) return DateFormat('MM-dd-yyyy').format(val.toDate());
  final str = val.toString().trim();
  if (str.isEmpty || str == '—' || str == '-' || str == 'null' || str == 'N/A') {
    return 'N/A';
  }

  final cleanStr = str.split(' ')[0];
  final match =
      RegExp(r'^(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})$').firstMatch(cleanStr);
  if (match != null) {
    final p1 = int.tryParse(match.group(1)!) ?? 0;
    final p2 = int.tryParse(match.group(2)!) ?? 0;
    final p3 = int.tryParse(match.group(3)!) ?? 0;

    if (p1 >= 1000) {
      return DateFormat('MM-dd-yyyy')
          .format(DateTime(p1, p2.clamp(1, 12), p3.clamp(1, 31)));
    } else if (p3 >= 1000 || (p3 >= 20 && p3 <= 99)) {
      final year = p3 < 100 ? (2000 + p3) : p3;
      int month = p1;
      int day = p2;
      if (month > 12 && day <= 12) {
        final temp = month;
        month = day;
        day = temp;
      }
      return DateFormat('MM-dd-yyyy')
          .format(DateTime(year, month.clamp(1, 12), day.clamp(1, 31)));
    }
  }

  try {
    final dt = DateTime.tryParse(str);
    if (dt != null) {
      return DateFormat('MM-dd-yyyy').format(dt);
    }
  } catch (_) {}

  final formats = [
    'MM-dd-yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'MMM dd, yyyy',
  ];
  for (final fmt in formats) {
    try {
      return DateFormat('MM-dd-yyyy').format(DateFormat(fmt).parseLoose(str));
    } catch (_) {}
  }
  return str;
}

Future<Uint8List> generateRecordPdf(List<dynamic> records) async {
  final pdf = pw.Document();

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
          final date = _formatPdfDate(record['date'] ?? record['createdAt']);

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