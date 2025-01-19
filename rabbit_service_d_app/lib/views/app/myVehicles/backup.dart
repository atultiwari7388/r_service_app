// import 'dart:io';

// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/material.dart';
// import 'package:image_picker/image_picker.dart';
// import 'package:pdf/widgets.dart' as pw;
// import 'package:pdf/pdf.dart';
// import 'package:printing/printing.dart';
// import 'package:regal_service_d_app/services/collection_references.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:share_plus/share_plus.dart';
// import 'package:intl/intl.dart';

// class MyVehiclesDetailsScreen extends StatefulWidget {
//   const MyVehiclesDetailsScreen({super.key, required this.vehicleData});
//   final Map<String, dynamic> vehicleData;

//   @override
//   State<MyVehiclesDetailsScreen> createState() =>
//       _MyVehiclesDetailsScreenState();
// }

// class _MyVehiclesDetailsScreenState extends State<MyVehiclesDetailsScreen> {
//   final List<Map<String, dynamic>> uploadedFiles = [];
//   final ImagePicker _imagePicker = ImagePicker();

//   Future<void> _pickImage() async {
//     final pickedFile =
//         await _imagePicker.pickImage(source: ImageSource.gallery);
//     if (pickedFile != null) {
//       setState(() {
//         uploadedFiles.add({
//           'image': File(pickedFile.path),
//           'textController': TextEditingController(),
//         });
//       });
//     }
//   }

//   Future<void> _uploadToFirestore() async {
//     final String vehicleId = widget.vehicleData['vehicleId'];
//     if (uploadedFiles.isEmpty || vehicleId == null) return;

//     try {
//       final List<Map<String, dynamic>> uploads = [];
//       for (var file in uploadedFiles) {
//         final imageUrl = await _uploadImageToStorage(file['image']);
//         final text = file['textController'].text;

//         uploads.add({
//           'imageUrl': imageUrl,
//           'text': text,
//         });
//       }

//       await FirebaseFirestore.instance
//           .collection('Users')
//           .doc(currentUId)
//           .collection("Vehicles")
//           .doc(vehicleId)
//           .update({
//         'uploadedDocuments': FieldValue.arrayUnion(uploads),
//       });

//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(content: Text('Documents uploaded successfully!')),
//       );

//       setState(() {
//         uploadedFiles.clear();
//       });
//     } catch (e) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Error uploading documents: $e')),
//       );
//     }
//   }

//   Future<String> _uploadImageToStorage(File image) async {
//     // Implement image upload to Firebase Storage here
//     // and return the download URL
//     return "";
//   }

//   @override
//   Widget build(BuildContext context) {
//     final vehicleName = widget.vehicleData['companyName'] ?? "Unknown Company";
//     final vehicleNumber =
//         widget.vehicleData['vehicleNumber'] ?? "Unknown Number";
//     final year = widget.vehicleData['year'] ?? "Unknown Year";
//     final currentMiles = widget.vehicleData['currentMiles'] ?? "Unknown Miles";
//     final licensePlate =
//         widget.vehicleData['licensePlate'] ?? "Unknown License Plate";
//     final services = widget.vehicleData['services'] ?? [];
//     final currentMilesArray = widget.vehicleData['currentMilesArray'] ?? [];

//     return Scaffold(
//       appBar: AppBar(
//         title: Text("$vehicleName Vehicle Details"),
//         actions: [
//           IconButton(
//             icon: const Icon(Icons.share),
//             onPressed: () {
//               _shareVehicleDetails(widget.vehicleData);
//             },
//           ),
//           IconButton(
//             icon: const Icon(Icons.picture_as_pdf),
//             onPressed: () {
//               _generatePdf(widget.vehicleData);
//             },
//           ),
//         ],
//       ),
//       body: Padding(
//         padding: const EdgeInsets.all(16.0),
//         child: SingleChildScrollView(
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               _buildInfoRow('Vehicle Number:', vehicleNumber),
//               _buildInfoRow('Year:', year),
//               _buildInfoRow('Current Miles:', currentMiles),
//               _buildInfoRow('License Plate:', licensePlate),
//               const SizedBox(height: 20),
//               const Text(
//                 'Services:',
//                 style: TextStyle(
//                   fontSize: 22,
//                   fontWeight: FontWeight.bold,
//                   color: Colors.blue,
//                 ),
//               ),
//               const SizedBox(height: 20),
//               _buildServicesTable(context, services),
//               const SizedBox(height: 20),
//               const Text(
//                 'Current Miles History:',
//                 style: TextStyle(
//                   fontSize: 22,
//                   fontWeight: FontWeight.bold,
//                   color: kPrimary,
//                 ),
//               ),
//               const SizedBox(height: 10),
//               ...currentMilesArray.map((milesEntry) {
//                 final rawDate = milesEntry['date'] ?? '';
//                 final formattedDate =
//                     DateFormat('yyyy-MM-dd').format(DateTime.parse(rawDate));
//                 return Padding(
//                   padding: const EdgeInsets.symmetric(vertical: 4.0),
//                   child: Text(
//                     'Date: $formattedDate, Miles: ${milesEntry['miles']}',
//                     style: const TextStyle(fontSize: 16),
//                   ),
//                 );
//               }).toList(),
//               const SizedBox(height: 20),
//               ElevatedButton.icon(
//                 onPressed: _pickImage,
//                 icon: const Icon(Icons.add, color: kWhite),
//                 label: const Text('Upload Document'),
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: kPrimary,
//                   foregroundColor: kWhite,
//                 ),
//               ),
//               const SizedBox(height: 20),
//               // Display Uploaded Images and Text Fields
//               ...uploadedFiles.map((file) {
//                 return Column(
//                   children: [
//                     if (file['image'] != null)
//                       Image.file(file['image'], height: 150, width: 150),
//                     const SizedBox(height: 10),
//                     TextField(
//                       controller: file['textController'],
//                       decoration: const InputDecoration(
//                         labelText: 'Enter Description',
//                         border: OutlineInputBorder(),
//                       ),
//                     ),
//                     const SizedBox(height: 20),
//                   ],
//                 );
//               }).toList(),

//               const SizedBox(height: 20),
//               // Final Update Button
//               Center(
//                 child: ElevatedButton(
//                   style: ElevatedButton.styleFrom(
//                     backgroundColor: kPrimary,
//                     foregroundColor: kWhite,
//                   ),
//                   onPressed: _uploadToFirestore,
//                   child: const Text('Update'),
//                 ),
//               ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   Widget _buildInfoRow(String label, String value) {
//     return Padding(
//       padding: const EdgeInsets.symmetric(vertical: 8.0),
//       child: Row(
//         children: [
//           Text(
//             label,
//             style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
//           ),
//           const SizedBox(width: 8),
//           Expanded(
//             child: Text(
//               value,
//               style: const TextStyle(fontSize: 18),
//               overflow: TextOverflow.ellipsis,
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildServicesTable(BuildContext context, List services) {
//     final filteredServices = services
//         .where((service) => service['defaultNotificationValue'] != 0)
//         .toList();

//     if (filteredServices.isEmpty) {
//       return const Center(
//         child: Text(
//           'No services available.',
//           style: TextStyle(fontSize: 16, color: Colors.grey),
//         ),
//       );
//     }

//     return Table(
//       columnWidths: const {
//         0: FixedColumnWidth(40),
//         1: FlexColumnWidth(),
//         2: FixedColumnWidth(100),
//         3: FixedColumnWidth(60),
//       },
//       border: TableBorder.all(color: Colors.grey),
//       children: [
//         const TableRow(
//           decoration: BoxDecoration(color: kPrimary),
//           children: [
//             Padding(
//               padding: EdgeInsets.all(8.0),
//               child: Text('Sr. No.',
//                   style: TextStyle(
//                       color: Colors.white, fontWeight: FontWeight.bold)),
//             ),
//             Padding(
//               padding: EdgeInsets.all(8.0),
//               child: Text('Service Name',
//                   style: TextStyle(
//                       color: Colors.white, fontWeight: FontWeight.bold)),
//             ),
//             Padding(
//               padding: EdgeInsets.all(8.0),
//               child: Text("D'Value",
//                   style: TextStyle(
//                       color: Colors.white, fontWeight: FontWeight.bold)),
//             ),
//             Padding(
//               padding: EdgeInsets.all(8.0),
//               child: Text('Action',
//                   style: TextStyle(
//                       color: Colors.white, fontWeight: FontWeight.bold)),
//             ),
//           ],
//         ),
//         ...filteredServices.asMap().entries.map((entry) {
//           final index = entry.key + 1;
//           final service = entry.value;
//           return TableRow(
//             children: [
//               Padding(
//                 padding: const EdgeInsets.all(8.0),
//                 child: Text(index.toString()),
//               ),
//               Padding(
//                 padding: const EdgeInsets.all(8.0),
//                 child: Text(service['serviceName'] ?? 'Unknown'),
//               ),
//               Padding(
//                 padding: const EdgeInsets.all(8.0),
//                 child: Text(service['defaultNotificationValue'].toString()),
//               ),
//               Padding(
//                 padding: const EdgeInsets.all(8.0),
//                 child: IconButton(
//                   icon: const Icon(Icons.edit, color: kPrimary),
//                   onPressed: () {
//                     _showEditDialog(context, service);
//                   },
//                 ),
//               ),
//             ],
//           );
//         }).toList(),
//       ],
//     );
//   }

//   void _showEditDialog(BuildContext context, Map<String, dynamic> service) {
//     final TextEditingController controller = TextEditingController(
//       text: service['defaultNotificationValue'].toString(),
//     );

//     showDialog(
//       context: context,
//       builder: (context) {
//         return AlertDialog(
//           title: const Text('Edit Default Notification Value'),
//           content: TextField(
//             controller: controller,
//             keyboardType: TextInputType.number,
//             decoration: const InputDecoration(
//               labelText: 'Enter New Value',
//               border: OutlineInputBorder(),
//             ),
//           ),
//           actions: [
//             TextButton(
//               onPressed: () {
//                 Navigator.pop(context);
//               },
//               child: Text('Cancel',
//                   style: appStyle(17, kPrimary, FontWeight.normal)),
//             ),
//             ElevatedButton(
//               style: ElevatedButton.styleFrom(
//                   backgroundColor: kSecondary, foregroundColor: kWhite),
//               onPressed: () {
//                 final newValue = int.tryParse(controller.text);
//                 if (newValue != null) {
//                   service['defaultNotificationValue'] = newValue;
//                   Navigator.pop(context);
//                 }
//               },
//               child: const Text('Update'),
//             ),
//           ],
//         );
//       },
//     );
//   }

//   void _shareVehicleDetails(Map<String, dynamic> vehicleData) {
//     final String details = '''
//     Vehicle Details:
//     Company Name: ${vehicleData['companyName']}
//     Vehicle Number: ${vehicleData['vehicleNumber']}
//     Year: ${vehicleData['year']}
//     Current Miles: ${vehicleData['currentMiles']}
//     License Plate: ${vehicleData['licensePlate']}
//     ''';
//     Share.share(details);
//   }

//   void _generatePdf(Map<String, dynamic> vehicleData) async {
//     final pdf = pw.Document();

//     pdf.addPage(
//       pw.Page(
//         build: (pw.Context context) {
//           return pw.Column(
//             crossAxisAlignment: pw.CrossAxisAlignment.start,
//             children: [
//               pw.Text('Vehicle Details',
//                   style: pw.TextStyle(
//                       fontSize: 24, fontWeight: pw.FontWeight.bold)),
//               pw.SizedBox(height: 20),
//               pw.Text(
//                   'Company Name: ${vehicleData['companyName'] ?? "Unknown Company"}'),
//               pw.Text(
//                   'Vehicle Number: ${vehicleData['vehicleNumber'] ?? "Unknown Number"}'),
//               pw.Text('Year: ${vehicleData['year'] ?? "Unknown Year"}'),
//               pw.Text(
//                   'Current Miles: ${vehicleData['currentMiles'] ?? "Unknown Miles"}'),
//               pw.Text(
//                   'License Plate: ${vehicleData['licensePlate'] ?? "Unknown License Plate"}'),
//               pw.SizedBox(height: 20),
//               pw.Text('Current Miles History:',
//                   style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//               ...vehicleData['currentMilesArray'].map<pw.Widget>((milesEntry) {
//                 return pw.Text(
//                     'Date: ${milesEntry['date']}, Miles: ${milesEntry['miles']}');
//               }).toList(),
//               pw.SizedBox(height: 20),
//               pw.Text('Services:',
//                   style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//               ...vehicleData['services'].map<pw.Widget>((service) {
//                 return pw.Text('Service Name: ${service['serviceName']}');
//               }).toList(),
//             ],
//           );
//         },
//       ),
//     );

//     await Printing.layoutPdf(
//         onLayout: (PdfPageFormat format) async => pdf.save());
//   }
// }
