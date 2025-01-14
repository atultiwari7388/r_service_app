import 'package:flutter/material.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

class MyVehiclesDetailsScreen extends StatelessWidget {
  const MyVehiclesDetailsScreen({super.key, required this.vehicleData});
  final Map<String, dynamic> vehicleData;

  @override
  Widget build(BuildContext context) {
    final vehicleName = vehicleData['companyName'] ?? "Unknown Company";
    final vehicleNumber = vehicleData['vehicleNumber'] ?? "Unknown Number";
    final year = vehicleData['year'] ?? "Unknown Year";
    final currentMiles = vehicleData['currentMiles'] ?? "Unknown Miles";
    final licensePlate = vehicleData['licensePlate'] ?? "Unknown License Plate";
    final services = vehicleData['services'] ?? [];
    final currentMilesArray = vehicleData['currentMilesArray'] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text("$vehicleName Vehicle Details"),
        actions: [
          IconButton(
            icon: Icon(Icons.share),
            onPressed: () {
              _shareVehicleDetails(vehicleData);
            },
          ),
          IconButton(
            icon: Icon(Icons.picture_as_pdf),
            onPressed: () {
              _generatePdf(vehicleData);
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Vehicle Number: $vehicleNumber',
                  style: TextStyle(fontSize: 18)),
              Text('Year: $year', style: TextStyle(fontSize: 18)),
              Text('Current Miles: $currentMiles',
                  style: TextStyle(fontSize: 18)),
              Text('License Plate: $licensePlate',
                  style: TextStyle(fontSize: 18)),
              SizedBox(height: 20),
              Text('Current Miles History:',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ...currentMilesArray.map((milesEntry) {
                return Text(
                    'Date: ${milesEntry['date']}, Miles: ${milesEntry['miles']}',
                    style: TextStyle(fontSize: 16));
              }).toList(),
              SizedBox(height: 20),
              Text('Services:',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ...services.map((service) {
                return Text('Service Name: ${service['serviceName']}',
                    style: TextStyle(fontSize: 16));
              }).toList(),
            ],
          ),
        ),
      ),
    );
  }

  void _shareVehicleDetails(Map<String, dynamic> vehicleData) {
    final String details = '''
    Vehicle Details:
    Company Name: ${vehicleData['companyName']}
    Vehicle Number: ${vehicleData['vehicleNumber']}
    Year: ${vehicleData['year']}
    Current Miles: ${vehicleData['currentMiles']}
    License Plate: ${vehicleData['licensePlate']}
    ''';
    Share.share(details);
  }

  void _generatePdf(Map<String, dynamic> vehicleData) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('Vehicle Details',
                  style: pw.TextStyle(
                      fontSize: 24, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 20),
              pw.Text(
                  'Company Name: ${vehicleData['companyName'] ?? "Unknown Company"}'),
              pw.Text(
                  'Vehicle Number: ${vehicleData['vehicleNumber'] ?? "Unknown Number"}'),
              pw.Text('Year: ${vehicleData['year'] ?? "Unknown Year"}'),
              pw.Text(
                  'Current Miles: ${vehicleData['currentMiles'] ?? "Unknown Miles"}'),
              pw.Text(
                  'License Plate: ${vehicleData['licensePlate'] ?? "Unknown License Plate"}'),
              pw.SizedBox(height: 20),
              pw.Text('Current Miles History:',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              ...vehicleData['currentMilesArray'].map<pw.Widget>((milesEntry) {
                return pw.Text(
                    'Date: ${milesEntry['date']}, Miles: ${milesEntry['miles']}');
              }).toList(),
              pw.SizedBox(height: 20),
              pw.Text('Services:',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              ...vehicleData['services'].map<pw.Widget>((service) {
                return pw.Text('Service Name: ${service['serviceName']}');
              }).toList(),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save());
  }
}
