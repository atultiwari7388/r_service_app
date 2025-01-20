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
// import 'package:firebase_storage/firebase_storage.dart';

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
//   bool isLoading = false;

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

//   Future<void> _uploadToFirestore(String vehicleId) async {
//     if (uploadedFiles.isEmpty || vehicleId == null) return;

//     setState(() {
//       isLoading = true;
//     });
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
//         const SnackBar(
//           content: Text('Documents uploaded successfully!'),
//           backgroundColor: Colors.green,
//         ),
//       );

//       setState(() {
//         uploadedFiles.clear();
//       });
//     } catch (e) {
//       setState(() {
//         isLoading = false;
//       });
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(
//           content: Text('Error uploading documents: $e'),
//           backgroundColor: Colors.red,
//         ),
//       );
//     } finally {
//       setState(() {
//         isLoading = false;
//       });
//     }
//   }

//   Future<String> _uploadImageToStorage(File image) async {
//     try {
//       final storageRef = FirebaseStorage.instance.ref();
//       final imageRef = storageRef
//           .child('vehicle_images/${DateTime.now().millisecondsSinceEpoch}.png');
//       await imageRef.putFile(image);
//       return await imageRef.getDownloadURL();
//     } catch (e) {
//       throw Exception('Failed to upload image: $e');
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final String vehicleId = widget.vehicleData['vehicleId'];

//     return Scaffold(
//       appBar: AppBar(
//         title: Text("Vehicle Details",
//             style: appStyle(20, kWhite, FontWeight.normal)),
//         elevation: 0,
//         iconTheme: IconThemeData(color: kWhite),
//         backgroundColor: kPrimary,
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
//       body: isLoading
//           ? Center(child: CircularProgressIndicator())
//           : StreamBuilder<DocumentSnapshot>(
//               stream: FirebaseFirestore.instance
//                   .collection('Users')
//                   .doc(currentUId)
//                   .collection("Vehicles")
//                   .doc(vehicleId)
//                   .snapshots(),
//               builder: (context, snapshot) {
//                 if (snapshot.connectionState == ConnectionState.waiting) {
//                   return const Center(child: CircularProgressIndicator());
//                 }

//                 if (!snapshot.hasData || snapshot.data == null) {
//                   return const Center(child: Text("No data found."));
//                 }

//                 final vehicleData =
//                     snapshot.data!.data() as Map<String, dynamic>;
//                 final uploadedDocuments =
//                     vehicleData['uploadedDocuments'] ?? [];
//                 final services = vehicleData['services'] ?? [];
//                 final currentMilesArray =
//                     vehicleData['currentMilesArray'] ?? [];

//                 return SingleChildScrollView(
//                   child: Padding(
//                     padding: const EdgeInsets.all(16.0),
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         // Display vehicle details
//                         Card(
//                           elevation: 1,
//                           shape: RoundedRectangleBorder(
//                             borderRadius: BorderRadius.circular(15),
//                           ),
//                           child: Padding(
//                             padding: const EdgeInsets.all(16.0),
//                             child: Column(
//                               children: [
//                                 _buildInfoRow('Vehicle Number:',
//                                     vehicleData['vehicleNumber']),
//                                 _buildInfoRow('Year:', vehicleData['year']),
//                                 _buildInfoRow('Current Miles:',
//                                     vehicleData['currentMiles']),
//                                 _buildInfoRow('License Plate:',
//                                     vehicleData['licensePlate']),
//                               ],
//                             ),
//                           ),
//                         ),
//                         const SizedBox(height: 20),

//                         // Services
//                         Container(
//                           padding: const EdgeInsets.all(16),
//                           decoration: BoxDecoration(
//                             color: Colors.white,
//                             borderRadius: BorderRadius.circular(15),
//                             boxShadow: [
//                               BoxShadow(
//                                 color: Colors.grey.withOpacity(0.2),
//                                 spreadRadius: 2,
//                                 blurRadius: 5,
//                                 offset: const Offset(0, 3),
//                               ),
//                             ],
//                           ),
//                           child: Column(
//                             crossAxisAlignment: CrossAxisAlignment.start,
//                             children: [
//                               const Text(
//                                 'Services',
//                                 style: TextStyle(
//                                   fontSize: 24,
//                                   fontWeight: FontWeight.bold,
//                                   color: kPrimary,
//                                 ),
//                               ),
//                               const SizedBox(height: 20),
//                               _buildServicesTable(context, services),
//                             ],
//                           ),
//                         ),
//                         const SizedBox(height: 20),

//                         // Current Miles History
//                         _buildSection(
//                           title: 'Current Miles History',
//                           content: currentMilesArray.map<Widget>((milesEntry) {
//                             final rawDate = milesEntry['date'] ?? '';
//                             final formattedDate = DateFormat('yyyy-MM-dd')
//                                 .format(DateTime.parse(rawDate));
//                             return ListTile(
//                               leading:
//                                   const Icon(Icons.timeline, color: kPrimary),
//                               title: Text('Date: $formattedDate'),
//                               trailing: Text('Miles: ${milesEntry['miles']}'),
//                             );
//                           }).toList(),
//                         ),

//                         const SizedBox(height: 20),

//                         // Uploaded Documents
//                         _buildSection(
//                           title: 'Uploaded Documents',
//                           content: uploadedDocuments.isNotEmpty
//                               ? uploadedDocuments.map<Widget>((doc) {
//                                   return Card(
//                                     elevation: 2,
//                                     shape: RoundedRectangleBorder(
//                                       borderRadius: BorderRadius.circular(10),
//                                     ),
//                                     child: Padding(
//                                       padding: const EdgeInsets.all(16.0),
//                                       child: Column(
//                                         crossAxisAlignment:
//                                             CrossAxisAlignment.start,
//                                         children: [
//                                           if (doc['imageUrl'] != null)
//                                             ClipRRect(
//                                               borderRadius:
//                                                   BorderRadius.circular(10),
//                                               child: Image.network(
//                                                 doc['imageUrl'],
//                                                 height: 150,
//                                                 width: double.infinity,
//                                                 fit: BoxFit.cover,
//                                               ),
//                                             ),
//                                           const SizedBox(height: 10),
//                                           Text(
//                                             doc['text'] ??
//                                                 'No description provided',
//                                           ),
//                                         ],
//                                       ),
//                                     ),
//                                   );
//                                 }).toList()
//                               : [
//                                   const Text(
//                                     'No documents uploaded yet.',
//                                     style: TextStyle(color: Colors.grey),
//                                   ),
//                                 ],
//                         ),

//                         const SizedBox(height: 20),
//                         ElevatedButton.icon(
//                           onPressed: _pickImage,
//                           icon: const Icon(Icons.add_photo_alternate,
//                               color: Colors.white),
//                           label: const Text(
//                             'Upload Document',
//                             style: TextStyle(
//                                 fontSize: 16, fontWeight: FontWeight.bold),
//                           ),
//                           style: ElevatedButton.styleFrom(
//                             backgroundColor: kPrimary,
//                             foregroundColor: Colors.white,
//                             padding: const EdgeInsets.symmetric(
//                                 horizontal: 20, vertical: 12),
//                             shape: RoundedRectangleBorder(
//                               borderRadius: BorderRadius.circular(10),
//                             ),
//                           ),
//                         ),
//                         const SizedBox(height: 20),
//                         ...uploadedFiles.map((file) {
//                           return Card(
//                             margin: const EdgeInsets.only(bottom: 16),
//                             shape: RoundedRectangleBorder(
//                               borderRadius: BorderRadius.circular(15),
//                             ),
//                             elevation: 4,
//                             child: Padding(
//                               padding: const EdgeInsets.all(12),
//                               child: Column(
//                                 children: [
//                                   if (file['image'] != null)
//                                     ClipRRect(
//                                       borderRadius: BorderRadius.circular(10),
//                                       child: Image.file(
//                                         file['image'],
//                                         height: 200,
//                                         width: double.infinity,
//                                         fit: BoxFit.cover,
//                                       ),
//                                     ),
//                                   const SizedBox(height: 12),
//                                   TextField(
//                                     controller: file['textController'],
//                                     decoration: InputDecoration(
//                                       labelText: 'Enter Description',
//                                       border: OutlineInputBorder(
//                                         borderRadius: BorderRadius.circular(10),
//                                       ),
//                                       filled: true,
//                                       fillColor: Colors.grey[100],
//                                     ),
//                                   ),
//                                 ],
//                               ),
//                             ),
//                           );
//                         }).toList(),
//                         const SizedBox(height: 20),
//                         uploadedFiles.isEmpty
//                             ? const SizedBox()
//                             : Center(
//                                 child: ElevatedButton(
//                                   style: ElevatedButton.styleFrom(
//                                     backgroundColor: kPrimary,
//                                     foregroundColor: Colors.white,
//                                     padding: const EdgeInsets.symmetric(
//                                         horizontal: 40, vertical: 15),
//                                     shape: RoundedRectangleBorder(
//                                       borderRadius: BorderRadius.circular(10),
//                                     ),
//                                   ),
//                                   onPressed: () =>
//                                       _uploadToFirestore(vehicleId),
//                                   child: const Text(
//                                     'Update',
//                                     style: TextStyle(
//                                         fontSize: 18,
//                                         fontWeight: FontWeight.bold),
//                                   ),
//                                 ),
//                               ),
//                         const SizedBox(height: 20),
//                       ],
//                     ),
//                   ),
//                 );
//               },
//             ),
//     );
//   }

//   Widget _buildSection({required String title, required List<Widget> content}) {
//     return Container(
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(15),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.2),
//             spreadRadius: 2,
//             blurRadius: 5,
//             offset: const Offset(0, 3),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text(
//             title,
//             style: const TextStyle(
//               fontSize: 24,
//               fontWeight: FontWeight.bold,
//               color: kPrimary,
//             ),
//           ),
//           const SizedBox(height: 10),
//           ...content,
//         ],
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
//             style: const TextStyle(
//               fontSize: 18,
//               fontWeight: FontWeight.w600,
//               color: kPrimary,
//             ),
//           ),
//           const SizedBox(width: 8),
//           Expanded(
//             child: Text(
//               value,
//               style: const TextStyle(
//                 fontSize: 18,
//                 color: Colors.black87,
//               ),
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
//       return Center(
//         child: Column(
//           children: [
//             Icon(Icons.no_sim, size: 48, color: Colors.grey[400]),
//             const SizedBox(height: 10),
//             Text(
//               'No services available.',
//               style: TextStyle(fontSize: 16, color: Colors.grey[600]),
//             ),
//           ],
//         ),
//       );
//     }

//     return Container(
//       decoration: BoxDecoration(
//         borderRadius: BorderRadius.circular(10),
//         border: Border.all(color: Colors.grey.shade300),
//       ),
//       child: ClipRRect(
//         borderRadius: BorderRadius.circular(10),
//         child: Table(
//           columnWidths: const {
//             0: FixedColumnWidth(40),
//             1: FlexColumnWidth(),
//             2: FixedColumnWidth(100),
//             3: FixedColumnWidth(60),
//           },
//           children: [
//             TableRow(
//               decoration: const BoxDecoration(
//                 color: kPrimary,
//               ),
//               children: [
//                 _buildTableHeader('Sr. No.'),
//                 _buildTableHeader('Service Name'),
//                 _buildTableHeader("D'Value"),
//                 _buildTableHeader('Action'),
//               ],
//             ),
//             ...filteredServices.asMap().entries.map((entry) {
//               final index = entry.key + 1;
//               final service = entry.value;
//               final bool isEven = index.isEven;

//               return TableRow(
//                 decoration: BoxDecoration(
//                   color: isEven ? Colors.grey[100] : Colors.white,
//                 ),
//                 children: [
//                   _buildTableCell(index.toString()), // Serial Number
//                   _buildTableCell(service['serviceName'] ?? 'Unknown'),
//                   _buildTableCell(
//                       service['defaultNotificationValue'].toString()),
//                   TableCell(
//                     child: Container(
//                       padding: const EdgeInsets.all(8.0),
//                       child: IconButton(
//                         icon: const Icon(Icons.edit, color: kPrimary, size: 20),
//                         onPressed: () {
//                           _showEditDialog(context, service);
//                         },
//                       ),
//                     ),
//                   ),
//                 ],
//               );
//             }).toList(),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildTableHeader(String text) {
//     return Container(
//       padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
//       child: Text(
//         text,
//         style: const TextStyle(
//           color: Colors.white,
//           fontWeight: FontWeight.bold,
//           fontSize: 15,
//         ),
//       ),
//     );
//   }

//   Widget _buildTableCell(String text) {
//     return Container(
//       padding: const EdgeInsets.all(12),
//       child: Text(
//         text,
//         style: const TextStyle(fontSize: 14),
//       ),
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
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(15),
//           ),
//           title: const Text(
//             'Edit Default Notification Value',
//             style: TextStyle(color: kPrimary),
//           ),
//           content: TextField(
//             controller: controller,
//             keyboardType: TextInputType.number,
//             decoration: InputDecoration(
//               labelText: 'Enter New Value',
//               border: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//               ),
//               focusedBorder: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: const BorderSide(color: kPrimary, width: 2),
//               ),
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
//                 backgroundColor: kSecondary,
//                 foregroundColor: kWhite,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//               ),
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
