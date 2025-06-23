// import 'package:flutter/material.dart';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:intl/intl.dart';
// import 'package:pdf/pdf.dart';
// import 'package:printing/printing.dart';
// import 'package:pdf/widgets.dart' as pw;
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/widgets/custom_button.dart';

// class ManageCheckScreen extends StatefulWidget {
//   const ManageCheckScreen({super.key});

//   @override
//   State<ManageCheckScreen> createState() => _ManageCheckScreenState();
// }

// class _ManageCheckScreenState extends State<ManageCheckScreen> {
//   final String currentUId = FirebaseAuth.instance.currentUser!.uid;
//   List<Map<String, dynamic>> _allMembers = [];
//   bool _isLoading = true;
//   String _errorMessage = '';
//   late String role = "";

//   // Add Check Dialog variables
//   String? _selectedType;
//   String? _selectedUserId;
//   String? _selectedUserName;
//   final List<Map<String, dynamic>> _serviceDetails = [];
//   final TextEditingController _memoNumberController = TextEditingController();
//   DateTime _selectedDate = DateTime.now();
//   double _totalAmount = 0.0;

//   // For displaying checks
//   List<Map<String, dynamic>> _checks = [];
//   bool _loadingChecks = true;
//   String? _filterType;
//   DateTimeRange? _dateRange;

//   @override
//   void initState() {
//     super.initState();
//     fetchUserDetails();
//     fetchTeamMembersWithVehicles();
//     fetchChecks();
//   }

//   Future<void> fetchChecks() async {
//     try {
//       Query query = FirebaseFirestore.instance
//           .collection('Checks')
//           .where('createdBy', isEqualTo: currentUId)
//           .orderBy('date', descending: true);

//       // Apply filters if they exist
//       if (_filterType != null) {
//         query = query.where('type', isEqualTo: _filterType);
//       }

//       if (_dateRange != null) {
//         query = query
//             .where('date', isGreaterThanOrEqualTo: _dateRange!.start)
//             .where('date', isLessThanOrEqualTo: _dateRange!.end);
//       }

//       QuerySnapshot snapshot = await query.get();

//       setState(() {
//         _checks = snapshot.docs.map((doc) {
//           Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
//           return {
//             'id': doc.id,
//             ...data,
//             'date': (data['date'] as Timestamp).toDate(),
//           };
//         }).toList();
//         _loadingChecks = false;
//       });
//     } catch (e) {
//       setState(() {
//         _errorMessage = 'Error loading checks: $e';
//         _loadingChecks = false;
//       });
//     }
//   }

//   Future<void> _showDateRangePicker() async {
//     final DateTimeRange? picked = await showDateRangePicker(
//       context: context,
//       firstDate: DateTime(2000),
//       lastDate: DateTime(2100),
//       initialDateRange: _dateRange ??
//           DateTimeRange(
//             start: DateTime.now().subtract(Duration(days: 30)),
//             end: DateTime.now(),
//           ),
//     );

//     if (picked != null) {
//       setState(() {
//         _dateRange = picked;
//       });
//       await fetchChecks();
//     }
//   }

//   Future<void> _printCheck(Map<String, dynamic> check) async {
//     final pdf = pw.Document();

//     pdf.addPage(
//       pw.Page(
//         build: (pw.Context context) {
//           return pw.Column(
//             crossAxisAlignment: pw.CrossAxisAlignment.start,
//             children: [
//               pw.Center(
//                 child: pw.Text('CHECK RECEIPT',
//                     style: pw.TextStyle(
//                         fontSize: 24, fontWeight: pw.FontWeight.bold)),
//               ),
//               pw.SizedBox(height: 20),
//               pw.Row(
//                 mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
//                 children: [
//                   pw.Text(
//                       'Date: ${DateFormat('MM/dd/yyyy').format(check['date'])}'),
//                   if (check['memoNumber'] != null)
//                     pw.Text('Memo: ${check['memoNumber']}'),
//                 ],
//               ),
//               pw.Divider(),
//               pw.Text('Paid To: ${check['userName']} (${check['type']})',
//                   style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//               pw.SizedBox(height: 20),
//               pw.Text('Details:',
//                   style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//               pw.SizedBox(height: 10),
//               ...check['serviceDetails'].map<pw.Widget>((detail) {
//                 return pw.Padding(
//                   padding: const pw.EdgeInsets.symmetric(vertical: 4),
//                   child: pw.Row(
//                     mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
//                     children: [
//                       pw.Text(detail['serviceName']),
//                       pw.Text('\$${detail['amount'].toStringAsFixed(2)}'),
//                     ],
//                   ),
//                 );
//               }).toList(),
//               pw.Divider(),
//               pw.Row(
//                 mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
//                 children: [
//                   pw.Text('TOTAL:',
//                       style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//                   pw.Text('\$${check['totalAmount'].toStringAsFixed(2)}',
//                       style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
//                 ],
//               ),
//               pw.SizedBox(height: 30),
//               pw.Center(child: pw.Text('Thank You!')),
//             ],
//           );
//         },
//       ),
//     );

//     await Printing.layoutPdf(
//       onLayout: (PdfPageFormat format) async => pdf.save(),
//     );
//   }

//   Widget _buildCheckCard(Map<String, dynamic> check) {
//     return Card(
//       elevation: 4,
//       margin: EdgeInsets.symmetric(vertical: 8),
//       shape: RoundedRectangleBorder(
//         borderRadius: BorderRadius.circular(12),
//       ),
//       child: Padding(
//         padding: EdgeInsets.all(16),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Check #${check['id'].substring(0, 6)}',
//                   style: appStyle(16, kPrimary, FontWeight.bold),
//                 ),
//                 Text(
//                   DateFormat('MMM dd, yyyy').format(check['date']),
//                   style: appStyle(14, kGray, FontWeight.normal),
//                 ),
//               ],
//             ),
//             SizedBox(height: 8),
//             Text(
//               'Paid To: ${check['userName']} (${check['type']})',
//               style: appStyle(14, kDark, FontWeight.w600),
//             ),
//             SizedBox(height: 8),
//             Divider(),
//             ...check['serviceDetails'].map<Widget>((detail) {
//               return Padding(
//                 padding: EdgeInsets.symmetric(vertical: 4),
//                 child: Row(
//                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                   children: [
//                     Text(
//                       detail['serviceName'],
//                       style: appStyle(14, kDark, FontWeight.normal),
//                     ),
//                     Text(
//                       '\$${detail['amount'].toStringAsFixed(2)}',
//                       style: appStyle(14, kDark, FontWeight.normal),
//                     ),
//                   ],
//                 ),
//               );
//             }).toList(),
//             Divider(),
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'TOTAL:',
//                   style: appStyle(16, kDark, FontWeight.bold),
//                 ),
//                 Text(
//                   '\$${check['totalAmount'].toStringAsFixed(2)}',
//                   style: appStyle(16, kPrimary, FontWeight.bold),
//                 ),
//               ],
//             ),
//             SizedBox(height: 8),
//             if (check['memoNumber'] != null)
//               Text(
//                 'Memo: ${check['memoNumber']}',
//                 style: appStyle(12, kGray, FontWeight.normal),
//               ),
//             SizedBox(height: 8),
//             Row(
//               mainAxisAlignment: MainAxisAlignment.end,
//               children: [
//                 IconButton(
//                   icon: Icon(Icons.print, color: kPrimary),
//                   onPressed: () => _printCheck(check),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildFilterRow() {
//     return Padding(
//       padding: EdgeInsets.symmetric(vertical: 8),
//       child: Row(
//         children: [
//           Expanded(
//             child: DropdownButtonFormField<String>(
//               decoration: InputDecoration(
//                 labelText: 'Filter by Type',
//                 labelStyle: appStyle(14, kDark, FontWeight.normal),
//                 border: OutlineInputBorder(),
//                 contentPadding:
//                     EdgeInsets.symmetric(horizontal: 12, vertical: 12),
//               ),
//               value: _filterType,
//               items: [
//                 DropdownMenuItem(value: null, child: Text('All Types')),
//                 ...['Manager', 'Accountant', 'Driver', 'Vendor', 'Other Staff']
//                     .map((type) => DropdownMenuItem(
//                           value: type,
//                           child: Text(type),
//                         ))
//                     .toList(),
//               ],
//               onChanged: (value) async {
//                 setState(() {
//                   _filterType = value;
//                 });
//                 await fetchChecks();
//               },
//             ),
//           ),
//           SizedBox(width: 8),
//           IconButton(
//             icon: Icon(Icons.calendar_today, color: kPrimary),
//             onPressed: _showDateRangePicker,
//           ),
//           if (_dateRange != null)
//             IconButton(
//               icon: Icon(Icons.clear, color: Colors.red),
//               onPressed: () async {
//                 setState(() {
//                   _dateRange = null;
//                 });
//                 await fetchChecks();
//               },
//             ),
//         ],
//       ),
//     );
//   }

//   Future<void> fetchUserDetails() async {
//     try {
//       DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
//           .collection('Users')
//           .doc(currentUId)
//           .get();

//       if (userSnapshot.exists) {
//         final userData = userSnapshot.data() as Map<String, dynamic>;
//         setState(() {
//           role = userData["role"] ?? "";
//         });
//       } else {
//         setState(() {
//           _errorMessage = 'User not found';
//         });
//       }
//     } catch (e) {
//       setState(() {
//         _errorMessage = 'Error fetching user details: $e';
//       });
//     }
//   }

//   Future<void> fetchTeamMembersWithVehicles() async {
//     try {
//       List<Map<String, dynamic>> membersWithVehicles = [];

//       QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
//           .collection('Users')
//           .where('createdBy', isEqualTo: currentUId)
//           .where('uid', isNotEqualTo: currentUId)
//           .get();

//       for (var member in teamSnapshot.docs) {
//         String memberId = member['uid'];
//         String name = member['userName'] ?? 'No Name';
//         String email = member['email'] ?? 'No Email';
//         bool isActive = member['active'] ?? false;

//         QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
//             .collection('Users')
//             .doc(memberId)
//             .collection('Vehicles')
//             .get();

//         List<Map<String, dynamic>> vehicles = vehicleSnapshot.docs.map((doc) {
//           return {
//             'companyName': doc['companyName'] ?? 'No Company',
//             'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
//           };
//         }).toList();

//         vehicles.sort((a, b) => a['vehicleNumber']
//             .toString()
//             .toLowerCase()
//             .compareTo(b['vehicleNumber'].toString().toLowerCase()));

//         membersWithVehicles.add({
//           'name': name,
//           'email': email,
//           'isActive': isActive,
//           'memberId': memberId,
//           'ownerId': member['createdBy'],
//           'vehicles': vehicles,
//           'perMileCharge': member['perMileCharge'],
//           'role': member['role']
//         });
//       }

//       setState(() {
//         _allMembers = membersWithVehicles;
//         _isLoading = false;
//       });
//     } catch (e) {
//       setState(() {
//         _errorMessage = 'Error loading team members: $e';
//         _isLoading = false;
//       });
//     }
//   }

//   Future<void> _showAddCheckDialog() async {
//     _selectedType = null;
//     _selectedUserId = null;
//     _selectedUserName = null;
//     _serviceDetails.clear();
//     _memoNumberController.clear();
//     _selectedDate = DateTime.now();
//     _totalAmount = 0.0;

//     await showDialog(
//       context: context,
//       builder: (BuildContext context) {
//         return StatefulBuilder(
//           builder: (context, setState) {
//             return AlertDialog(
//               title: Text('Write  Check',
//                   style: appStyle(18, kDark, FontWeight.bold)),
//               content: SingleChildScrollView(
//                 child: Column(
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     // Select Type Dropdown
//                     DropdownButtonFormField<String>(
//                       decoration: InputDecoration(
//                         labelText: 'Select Type',
//                         labelStyle: appStyle(14, kDark, FontWeight.normal),
//                         border: OutlineInputBorder(),
//                       ),
//                       value: _selectedType,
//                       items: <String>[
//                         'Manager',
//                         'Accountant',
//                         'Driver',
//                         'Vendor',
//                         'Other Staff'
//                       ]
//                           .map<DropdownMenuItem<String>>(
//                               (String type) => DropdownMenuItem<String>(
//                                     value: type,
//                                     child: Text(type),
//                                   ))
//                           .toList(),
//                       onChanged: (value) {
//                         setState(() {
//                           _selectedType = value;
//                           _selectedUserId = null;
//                           _selectedUserName = null;
//                         });
//                       },
//                       validator: (value) => value == null ? 'Required' : null,
//                     ),
//                     SizedBox(height: 16),

//                     // Select Name Dropdown (only shows when type is selected)
//                     if (_selectedType != null)
//                       DropdownButtonFormField<String>(
//                         decoration: InputDecoration(
//                           labelText: 'Select Name',
//                           labelStyle: appStyle(14, kDark, FontWeight.normal),
//                           border: OutlineInputBorder(),
//                         ),
//                         value: _selectedUserId,
//                         items: _allMembers
//                             .where((member) => member['role'] == _selectedType)
//                             .map<DropdownMenuItem<String>>(
//                                 (member) => DropdownMenuItem<String>(
//                                       value: member['memberId'],
//                                       child: Text(member['name']),
//                                     ))
//                             .toList(),
//                         onChanged: (value) {
//                           setState(() {
//                             _selectedUserId = value;
//                             _selectedUserName = _allMembers.firstWhere(
//                                 (member) =>
//                                     member['memberId'] == value)['name'];
//                           });
//                         },
//                         validator: (value) => value == null ? 'Required' : null,
//                       ),
//                     SizedBox(height: 16),

//                     // Add Detail Button (only shows when name is selected)
//                     if (_selectedUserId != null)
//                       Column(
//                         children: [
//                           CustomButton(
//                             text: "Add Detail",
//                             onPress: () {
//                               _showAddDetailDialog(context, setState);
//                             },
//                             color: kPrimary,
//                           ),
//                           SizedBox(height: 16),
//                         ],
//                       ),

//                     // Service Details List
//                     if (_serviceDetails.isNotEmpty)
//                       Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         children: [
//                           Text('Service Details:',
//                               style: appStyle(14, kDark, FontWeight.bold)),
//                           SizedBox(height: 8),
//                           ..._serviceDetails.map((detail) {
//                             return Padding(
//                               padding: const EdgeInsets.symmetric(vertical: 4),
//                               child: Row(
//                                 children: [
//                                   Expanded(
//                                     child: Text(
//                                       '${detail['serviceName']}: \$${detail['amount']}',
//                                       style: appStyle(
//                                           12, kDark, FontWeight.normal),
//                                     ),
//                                   ),
//                                   IconButton(
//                                     icon: Icon(Icons.delete, color: Colors.red),
//                                     onPressed: () {
//                                       setState(() {
//                                         _serviceDetails.remove(detail);
//                                         _calculateTotal();
//                                       });
//                                     },
//                                   ),
//                                 ],
//                               ),
//                             );
//                           }),
//                           SizedBox(height: 8),
//                           Divider(),
//                           Text('Total: \$$_totalAmount',
//                               style: appStyle(14, kDark, FontWeight.bold)),
//                           SizedBox(height: 16),
//                         ],
//                       ),

//                     // Memo Number
//                     TextField(
//                       controller: _memoNumberController,
//                       decoration: InputDecoration(
//                         labelText: 'Memo Number (Optional)',
//                         labelStyle: appStyle(14, kDark, FontWeight.normal),
//                         border: OutlineInputBorder(),
//                       ),
//                     ),
//                     SizedBox(height: 16),

//                     // Date Picker
//                     Row(
//                       children: [
//                         Text('Date: ',
//                             style: appStyle(14, kDark, FontWeight.normal)),
//                         TextButton(
//                           onPressed: () async {
//                             final DateTime? picked = await showDatePicker(
//                               context: context,
//                               initialDate: _selectedDate,
//                               firstDate: DateTime(2000),
//                               lastDate: DateTime(2100),
//                             );
//                             if (picked != null && picked != _selectedDate) {
//                               setState(() {
//                                 _selectedDate = picked;
//                               });
//                             }
//                           },
//                           child: Text(
//                             DateFormat('MM/dd/yyyy').format(_selectedDate),
//                             style: appStyle(14, kPrimary, FontWeight.normal),
//                           ),
//                         ),
//                       ],
//                     ),
//                   ],
//                 ),
//               ),
//               actions: [
//                 TextButton(
//                   onPressed: () => Navigator.of(context).pop(),
//                   child: Text('Cancel',
//                       style: appStyle(14, kDark, FontWeight.normal)),
//                 ),
//                 ElevatedButton(
//                   onPressed: _serviceDetails.isEmpty ? null : _saveCheck,
//                   style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
//                   child: Text('Save',
//                       style: appStyle(14, kWhite, FontWeight.normal)),
//                 ),
//               ],
//             );
//           },
//         );
//       },
//     );
//   }

//   void _showAddDetailDialog(BuildContext context, StateSetter setState) {
//     final TextEditingController serviceNameController = TextEditingController();
//     final TextEditingController amountController = TextEditingController();

//     // For drivers, we'll fetch unpaid trips
//     bool isDriver = _selectedType == 'Driver';
//     List<Map<String, dynamic>> unpaidTrips = [];
//     double driverUnpaidTotal = 0.0;

//     if (isDriver) {
//       // Fetch unpaid trips for the selected driver
//       FirebaseFirestore.instance
//           .collection('Users')
//           .doc(_selectedUserId)
//           .collection('trips')
//           .where('isPaid', isEqualTo: false)
//           .get()
//           .then((querySnapshot) {
//         unpaidTrips = querySnapshot.docs.map((doc) {
//           return {
//             'id': doc.id,
//             'tripName': doc['tripName'] ?? 'Unnamed Trip',
//             'oEarnings': doc['oEarnings'] ?? 0.0,
//           };
//         }).toList();

//         driverUnpaidTotal = unpaidTrips.fold(
//             0.0, (sum, trip) => sum + (trip['oEarnings'] as num).toDouble());

//         setState(() {
//           // Update the amount controller with the calculated total
//           amountController.text = driverUnpaidTotal.toStringAsFixed(2);
//         });
//       });
//     }

//     showDialog(
//       context: context,
//       builder: (BuildContext context) {
//         return AlertDialog(
//           title: Text('Add Service Detail',
//               style: appStyle(16, kDark, FontWeight.bold)),
//           content: SingleChildScrollView(
//             child: Column(
//               mainAxisSize: MainAxisSize.min,
//               children: [
//                 // Service Name
//                 TextField(
//                   controller: serviceNameController,
//                   decoration: InputDecoration(
//                     labelText: 'Enter Service Name',
//                     labelStyle: appStyle(14, kDark, FontWeight.normal),
//                     border: OutlineInputBorder(),
//                   ),
//                 ),
//                 SizedBox(height: 16),

//                 // Amount (for non-drivers) or calculated amount (for drivers)
//                 if (isDriver)
//                   Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     children: [
//                       Text('Unpaid Trips:',
//                           style: appStyle(12, kDark, FontWeight.bold)),
//                       ...unpaidTrips.map((trip) => Padding(
//                             padding: const EdgeInsets.symmetric(vertical: 2),
//                             child: Text(
//                               '${trip['tripName']}: \$${(trip['oEarnings'] as num).toStringAsFixed(2)}',
//                               style: appStyle(12, kDark, FontWeight.normal),
//                             ),
//                           )),
//                       SizedBox(height: 8),
//                       Text(
//                           'Total Unpaid Amount: \$${driverUnpaidTotal.toStringAsFixed(2)}',
//                           style: appStyle(12, kDark, FontWeight.bold)),
//                       SizedBox(height: 16),
//                     ],
//                   ),

//                 TextField(
//                   controller: amountController,
//                   decoration: InputDecoration(
//                     labelText: 'Enter Amount',
//                     labelStyle: appStyle(14, kDark, FontWeight.normal),
//                     border: OutlineInputBorder(),
//                   ),
//                   keyboardType: TextInputType.number,
//                   enabled:
//                       !isDriver, // Disable for drivers since we calculate it
//                 ),
//               ],
//             ),
//           ),
//           actions: [
//             TextButton(
//               onPressed: () => Navigator.of(context).pop(),
//               child:
//                   Text('Cancel', style: appStyle(14, kDark, FontWeight.normal)),
//             ),
//             ElevatedButton(
//               onPressed: () {
//                 if (serviceNameController.text.isEmpty ||
//                     amountController.text.isEmpty) {
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     SnackBar(content: Text('Please fill all fields')),
//                   );
//                   return;
//                 }

//                 setState(() {
//                   _serviceDetails.add({
//                     'serviceName': serviceNameController.text,
//                     'amount': double.parse(amountController.text),
//                   });
//                   _calculateTotal();
//                 });

//                 Navigator.of(context).pop();
//               },
//               style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
//               child:
//                   Text('Add', style: appStyle(14, kWhite, FontWeight.normal)),
//             ),
//           ],
//         );
//       },
//     );
//   }

//   void _calculateTotal() {
//     _totalAmount = _serviceDetails.fold(
//         0.0, (sum, detail) => sum + (detail['amount'] as num).toDouble());
//   }

//   Future<void> _saveCheck() async {
//     if (_selectedUserId == null || _serviceDetails.isEmpty) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Please fill all required fields')),
//       );
//       return;
//     }

//     try {
//       // Create a new check document
//       await FirebaseFirestore.instance.collection('Checks').add({
//         'type': _selectedType,
//         'userId': _selectedUserId,
//         'userName': _selectedUserName,
//         'serviceDetails': _serviceDetails,
//         'totalAmount': _totalAmount,
//         'memoNumber': _memoNumberController.text.isEmpty
//             ? null
//             : _memoNumberController.text,
//         'date': _selectedDate,
//         'createdBy': currentUId,
//         'createdAt': FieldValue.serverTimestamp(),
//       });

//       // If this is for a driver, mark the trips as paid
//       if (_selectedType == 'Driver') {
//         // Get all unpaid trips for this driver
//         final querySnapshot = await FirebaseFirestore.instance
//             .collection('Users')
//             .doc(_selectedUserId)
//             .collection('trips')
//             .where('isPaid', isEqualTo: false)
//             .get();

//         // Update each trip to mark as paid
//         final batch = FirebaseFirestore.instance.batch();
//         for (final doc in querySnapshot.docs) {
//           batch.update(doc.reference, {'isPaid': true});
//         }
//         await batch.commit();
//       }

//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Check saved successfully')),
//       );

//       Navigator.of(context).pop();
//     } catch (e) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Error saving check: $e')),
//       );
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         backgroundColor: kPrimary,
//         iconTheme: const IconThemeData(color: kWhite),
//         title: Text('Manage Check',
//             style: appStyle(18, kWhite, FontWeight.normal)),
//       ),
//       body: SingleChildScrollView(
//         child: Padding(
//           padding: const EdgeInsets.all(16.0),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               // Add Check Button
//               CustomButton(
//                 text: "Write Check",
//                 onPress: _showAddCheckDialog,
//                 color: kPrimary,
//               ),
//               const SizedBox(height: 16),

//               // Filter Row
//               _buildFilterRow(),

//               // Date range display
//               if (_dateRange != null)
//                 Padding(
//                   padding: EdgeInsets.only(bottom: 8),
//                   child: Text(
//                     'Showing checks from ${DateFormat('MMM dd, yyyy').format(_dateRange!.start)} to ${DateFormat('MMM dd, yyyy').format(_dateRange!.end)}',
//                     style: appStyle(12, kGray, FontWeight.normal),
//                   ),
//                 ),

//               // Checks List
//               if (_loadingChecks)
//                 Center(child: CircularProgressIndicator())
//               else if (_checks.isEmpty)
//                 Center(
//                   child: Text(
//                     'No checks found',
//                     style: appStyle(16, kGray, FontWeight.normal),
//                   ),
//                 )
//               else
//                 Column(
//                   children:
//                       _checks.map((check) => _buildCheckCard(check)).toList(),
//                 ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ManageCheckScreen extends StatefulWidget {
  const ManageCheckScreen({super.key});

  @override
  State<ManageCheckScreen> createState() => _ManageCheckScreenState();
}

class _ManageCheckScreenState extends State<ManageCheckScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  List<Map<String, dynamic>> _allMembers = [];
  bool _isLoading = true;
  String _errorMessage = '';
  late String role = "";

  // Add Check Dialog variables
  String? _selectedType;
  String? _selectedUserId;
  String? _selectedUserName;
  final List<Map<String, dynamic>> _serviceDetails = [];
  final TextEditingController _memoNumberController = TextEditingController();
  final TextEditingController _checkNumberController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  double _totalAmount = 0.0;

  // For displaying checks
  List<Map<String, dynamic>> _checks = [];
  bool _loadingChecks = true;
  String? _filterType;
  DateTimeRange? _dateRange;

  // Check number management
  int? _currentCheckNumber;
  int? _nextCheckNumber;

  @override
  void initState() {
    super.initState();
    fetchUserDetails();
    fetchTeamMembersWithVehicles();
    fetchChecks();
    _fetchCurrentCheckNumber();
  }

  Future<void> _fetchCurrentCheckNumber() async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (snapshot.exists) {
        setState(() {
          _currentCheckNumber = snapshot['currentCheckNumber'];
          _nextCheckNumber = _currentCheckNumber;
          if (_nextCheckNumber != null) {
            _checkNumberController.text = _nextCheckNumber.toString();
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching current check number: $e';
      });
    }
  }

  Future<void> _incrementCheckNumber() async {
    if (_nextCheckNumber == null) return;

    try {
      await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .update({'currentCheckNumber': _nextCheckNumber! + 1});

      setState(() {
        _currentCheckNumber = _nextCheckNumber! + 1;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating check number: $e')),
      );
    }
  }

  Future<void> fetchChecks() async {
    try {
      Query query = FirebaseFirestore.instance
          .collection('Checks')
          .where('createdBy', isEqualTo: currentUId)
          .orderBy('date', descending: true);

      if (_filterType != null) {
        query = query.where('type', isEqualTo: _filterType);
      }

      if (_dateRange != null) {
        query = query
            .where('date', isGreaterThanOrEqualTo: _dateRange!.start)
            .where('date', isLessThanOrEqualTo: _dateRange!.end);
      }

      QuerySnapshot snapshot = await query.get();

      setState(() {
        _checks = snapshot.docs.map((doc) {
          Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
          return {
            'id': doc.id,
            ...data,
            'date': (data['date'] as Timestamp).toDate(),
          };
        }).toList();
        _loadingChecks = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading checks: $e';
        _loadingChecks = false;
      });
    }
  }

  Future<void> _showDateRangePicker() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      initialDateRange: _dateRange ??
          DateTimeRange(
            start: DateTime.now().subtract(Duration(days: 30)),
            end: DateTime.now(),
          ),
    );

    if (picked != null) {
      setState(() {
        _dateRange = picked;
      });
      await fetchChecks();
    }
  }

  Future<void> _printCheck(Map<String, dynamic> check) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat:
            PdfPageFormat(8.5 * PdfPageFormat.inch, 3.5 * PdfPageFormat.inch),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Check header
              pw.Text('Western Truck & Trailer Maintenance',
                  style: pw.TextStyle(fontSize: 12)),
              pw.Text('5250 N. Barcus Ave', style: pw.TextStyle(fontSize: 10)),
              pw.Text('Fresno, CA 93722', style: pw.TextStyle(fontSize: 10)),
              pw.Text('559-271-7275', style: pw.TextStyle(fontSize: 10)),
              pw.Divider(),

              // Bank information
              pw.Text('JPMORGAN CHASE BANK, NA',
                  style: pw.TextStyle(fontSize: 10)),
              pw.Text('376 W SHAW AVE', style: pw.TextStyle(fontSize: 10)),
              pw.Text('FRESNO, CA 92711', style: pw.TextStyle(fontSize: 10)),
              pw.Text('90-7162/3222', style: pw.TextStyle(fontSize: 10)),
              pw.Divider(),

              // Payee information
              pw.Text('PAY TO THE ORDER OF ${check['userName']}',
                  style: pw.TextStyle(
                      fontSize: 12, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),

              // Amount
              pw.Text('\$${check['totalAmount'].toStringAsFixed(2)}',
                  style: pw.TextStyle(fontSize: 12)),
              pw.Divider(),

              // Check number and date
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Check #${check['checkNumber']}',
                      style: pw.TextStyle(fontSize: 10)),
                  pw.Text(DateFormat('MM/dd/yyyy').format(check['date'])),
                ],
              ),

              // Memo if exists
              if (check['memoNumber'] != null)
                pw.Text('Memo: ${check['memoNumber']}',
                    style: pw.TextStyle(fontSize: 10)),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  Widget _buildCheckCard(Map<String, dynamic> check) {
    return Card(
      elevation: 4,
      margin: EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Check #${check['checkNumber']}',
                  style: appStyle(16, kPrimary, FontWeight.bold),
                ),
                Text(
                  DateFormat('MMM dd, yyyy').format(check['date']),
                  style: appStyle(14, kGray, FontWeight.normal),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Paid To: ${check['userName']} (${check['type']})',
              style: appStyle(14, kDark, FontWeight.w600),
            ),
            SizedBox(height: 8),
            Divider(),
            ...check['serviceDetails'].map<Widget>((detail) {
              return Padding(
                padding: EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      detail['serviceName'],
                      style: appStyle(14, kDark, FontWeight.normal),
                    ),
                    Text(
                      '\$${detail['amount'].toStringAsFixed(2)}',
                      style: appStyle(14, kDark, FontWeight.normal),
                    ),
                  ],
                ),
              );
            }).toList(),
            Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TOTAL:',
                  style: appStyle(16, kDark, FontWeight.bold),
                ),
                Text(
                  '\$${check['totalAmount'].toStringAsFixed(2)}',
                  style: appStyle(16, kPrimary, FontWeight.bold),
                ),
              ],
            ),
            SizedBox(height: 8),
            if (check['memoNumber'] != null)
              Text(
                'Memo: ${check['memoNumber']}',
                style: appStyle(12, kGray, FontWeight.normal),
              ),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: Icon(Icons.print, color: kPrimary),
                  onPressed: () => _printCheck(check),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: 'Filter by Type',
                labelStyle: appStyle(14, kDark, FontWeight.normal),
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              value: _filterType,
              items: [
                DropdownMenuItem(value: null, child: Text('All Types')),
                ...['Manager', 'Accountant', 'Driver', 'Vendor', 'Other Staff']
                    .map((type) => DropdownMenuItem(
                          value: type,
                          child: Text(type),
                        ))
                    .toList(),
              ],
              onChanged: (value) async {
                setState(() {
                  _filterType = value;
                });
                await fetchChecks();
              },
            ),
          ),
          SizedBox(width: 8),
          IconButton(
            icon: Icon(Icons.calendar_today, color: kPrimary),
            onPressed: _showDateRangePicker,
          ),
          if (_dateRange != null)
            IconButton(
              icon: Icon(Icons.clear, color: Colors.red),
              onPressed: () async {
                setState(() {
                  _dateRange = null;
                });
                await fetchChecks();
              },
            ),
        ],
      ),
    );
  }

  Future<void> fetchUserDetails() async {
    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        setState(() {
          role = userData["role"] ?? "";
        });
      } else {
        setState(() {
          _errorMessage = 'User not found';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching user details: $e';
      });
    }
  }

  Future<void> fetchTeamMembersWithVehicles() async {
    try {
      List<Map<String, dynamic>> membersWithVehicles = [];

      QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: currentUId)
          .where('uid', isNotEqualTo: currentUId)
          .get();

      for (var member in teamSnapshot.docs) {
        String memberId = member['uid'];
        String name = member['userName'] ?? 'No Name';
        String email = member['email'] ?? 'No Email';
        bool isActive = member['active'] ?? false;

        QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(memberId)
            .collection('Vehicles')
            .get();

        List<Map<String, dynamic>> vehicles = vehicleSnapshot.docs.map((doc) {
          return {
            'companyName': doc['companyName'] ?? 'No Company',
            'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
          };
        }).toList();

        vehicles.sort((a, b) => a['vehicleNumber']
            .toString()
            .toLowerCase()
            .compareTo(b['vehicleNumber'].toString().toLowerCase()));

        membersWithVehicles.add({
          'name': name,
          'email': email,
          'isActive': isActive,
          'memberId': memberId,
          'ownerId': member['createdBy'],
          'vehicles': vehicles,
          'perMileCharge': member['perMileCharge'],
          'role': member['role']
        });
      }

      setState(() {
        _allMembers = membersWithVehicles;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading team members: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _showAddCheckDialog() async {
    _selectedType = null;
    _selectedUserId = null;
    _selectedUserName = null;
    _serviceDetails.clear();
    _memoNumberController.clear();
    _selectedDate = DateTime.now();
    _totalAmount = 0.0;

    await showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text('Write Check',
                  style: appStyle(18, kDark, FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Check Number Field
                    TextField(
                      controller: _checkNumberController,
                      decoration: InputDecoration(
                        labelText: 'Check Number',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      readOnly: _nextCheckNumber != null,
                    ),
                    SizedBox(height: 16),

                    // Select Type Dropdown
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Select Type',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                      value: _selectedType,
                      items: <String>[
                        'Manager',
                        'Accountant',
                        'Driver',
                        'Vendor',
                        'Other Staff'
                      ]
                          .map<DropdownMenuItem<String>>(
                              (String type) => DropdownMenuItem<String>(
                                    value: type,
                                    child: Text(type),
                                  ))
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value;
                          _selectedUserId = null;
                          _selectedUserName = null;
                        });
                      },
                      validator: (value) => value == null ? 'Required' : null,
                    ),
                    SizedBox(height: 16),

                    // Select Name Dropdown
                    if (_selectedType != null)
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: 'Select Name',
                          labelStyle: appStyle(14, kDark, FontWeight.normal),
                          border: OutlineInputBorder(),
                        ),
                        value: _selectedUserId,
                        items: _allMembers
                            .where((member) => member['role'] == _selectedType)
                            .map<DropdownMenuItem<String>>(
                                (member) => DropdownMenuItem<String>(
                                      value: member['memberId'],
                                      child: Text(member['name']),
                                    ))
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedUserId = value;
                            _selectedUserName = _allMembers.firstWhere(
                                (member) =>
                                    member['memberId'] == value)['name'];
                          });
                        },
                        validator: (value) => value == null ? 'Required' : null,
                      ),
                    SizedBox(height: 16),

                    // Add Detail Button
                    if (_selectedUserId != null)
                      Column(
                        children: [
                          CustomButton(
                            text: "Add Detail",
                            onPress: () {
                              _showAddDetailDialog(context, setState);
                            },
                            color: kPrimary,
                          ),
                          SizedBox(height: 16),
                        ],
                      ),

                    // Service Details List
                    if (_serviceDetails.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Service Details:',
                              style: appStyle(14, kDark, FontWeight.bold)),
                          SizedBox(height: 8),
                          ..._serviceDetails.map((detail) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${detail['serviceName']}: \$${detail['amount']}',
                                      style: appStyle(
                                          12, kDark, FontWeight.normal),
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.delete, color: Colors.red),
                                    onPressed: () {
                                      setState(() {
                                        _serviceDetails.remove(detail);
                                        _calculateTotal();
                                      });
                                    },
                                  ),
                                ],
                              ),
                            );
                          }),
                          SizedBox(height: 8),
                          Divider(),
                          Text('Total: \$$_totalAmount',
                              style: appStyle(14, kDark, FontWeight.bold)),
                          SizedBox(height: 16),
                        ],
                      ),

                    // Memo Number
                    TextField(
                      controller: _memoNumberController,
                      decoration: InputDecoration(
                        labelText: 'Memo Number (Optional)',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),

                    // Date Picker
                    Row(
                      children: [
                        Text('Date: ',
                            style: appStyle(14, kDark, FontWeight.normal)),
                        TextButton(
                          onPressed: () async {
                            final DateTime? picked = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null && picked != _selectedDate) {
                              setState(() {
                                _selectedDate = picked;
                              });
                            }
                          },
                          child: Text(
                            DateFormat('MM/dd/yyyy').format(_selectedDate),
                            style: appStyle(14, kPrimary, FontWeight.normal),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Cancel',
                      style: appStyle(14, kDark, FontWeight.normal)),
                ),
                ElevatedButton(
                  onPressed: _serviceDetails.isEmpty ? null : _saveCheck,
                  style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
                  child: Text('Save',
                      style: appStyle(14, kWhite, FontWeight.normal)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAddDetailDialog(BuildContext context, StateSetter setState) {
    final TextEditingController serviceNameController = TextEditingController();
    final TextEditingController amountController = TextEditingController();

    bool isDriver = _selectedType == 'Driver';
    List<Map<String, dynamic>> unpaidTrips = [];
    double driverUnpaidTotal = 0.0;

    if (isDriver) {
      FirebaseFirestore.instance
          .collection('Users')
          .doc(_selectedUserId)
          .collection('trips')
          .where('isPaid', isEqualTo: false)
          .get()
          .then((querySnapshot) {
        unpaidTrips = querySnapshot.docs.map((doc) {
          return {
            'id': doc.id,
            'tripName': doc['tripName'] ?? 'Unnamed Trip',
            'oEarnings': doc['oEarnings'] ?? 0.0,
          };
        }).toList();

        driverUnpaidTotal = unpaidTrips.fold(
            0.0, (sum, trip) => sum + (trip['oEarnings'] as num).toDouble());

        setState(() {
          amountController.text = driverUnpaidTotal.toStringAsFixed(2);
        });
      });
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Add Service Detail',
              style: appStyle(16, kDark, FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: serviceNameController,
                  decoration: InputDecoration(
                    labelText: 'Enter Service Name',
                    labelStyle: appStyle(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 16),
                if (isDriver)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Unpaid Trips:',
                          style: appStyle(12, kDark, FontWeight.bold)),
                      ...unpaidTrips.map((trip) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Text(
                              '${trip['tripName']}: \$${(trip['oEarnings'] as num).toStringAsFixed(2)}',
                              style: appStyle(12, kDark, FontWeight.normal),
                            ),
                          )),
                      SizedBox(height: 8),
                      Text(
                          'Total Unpaid Amount: \$${driverUnpaidTotal.toStringAsFixed(2)}',
                          style: appStyle(12, kDark, FontWeight.bold)),
                      SizedBox(height: 16),
                    ],
                  ),
                TextField(
                  controller: amountController,
                  decoration: InputDecoration(
                    labelText: 'Enter Amount',
                    labelStyle: appStyle(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  enabled: !isDriver,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child:
                  Text('Cancel', style: appStyle(14, kDark, FontWeight.normal)),
            ),
            ElevatedButton(
              onPressed: () {
                if (serviceNameController.text.isEmpty ||
                    amountController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please fill all fields')),
                  );
                  return;
                }

                setState(() {
                  _serviceDetails.add({
                    'serviceName': serviceNameController.text,
                    'amount': double.parse(amountController.text),
                  });
                  _calculateTotal();
                });

                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
              child:
                  Text('Add', style: appStyle(14, kWhite, FontWeight.normal)),
            ),
          ],
        );
      },
    );
  }

  void _calculateTotal() {
    _totalAmount = _serviceDetails.fold(
        0.0, (sum, detail) => sum + (detail['amount'] as num).toDouble());
  }

  Future<void> _saveCheck() async {
    if (_selectedUserId == null || _serviceDetails.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    try {
      await FirebaseFirestore.instance.collection('Checks').add({
        'checkNumber': int.parse(_checkNumberController.text),
        'type': _selectedType,
        'userId': _selectedUserId,
        'userName': _selectedUserName,
        'serviceDetails': _serviceDetails,
        'totalAmount': _totalAmount,
        'memoNumber': _memoNumberController.text.isEmpty
            ? null
            : _memoNumberController.text,
        'date': _selectedDate,
        'createdBy': currentUId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      await _incrementCheckNumber();

      if (_selectedType == 'Driver') {
        final querySnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(_selectedUserId)
            .collection('trips')
            .where('isPaid', isEqualTo: false)
            .get();

        final batch = FirebaseFirestore.instance.batch();
        for (final doc in querySnapshot.docs) {
          batch.update(doc.reference, {'isPaid': true});
        }
        await batch.commit();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Check saved successfully')),
      );

      Navigator.of(context).pop();
      await fetchChecks();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving check: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: kWhite),
        title: Text('Manage Checks',
            style: appStyle(18, kWhite, FontWeight.normal)),
        actions: [
          IconButton(
            icon: Icon(Icons.numbers),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ManageCheckNumbersScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CustomButton(
                text: "Write Check",
                onPress: _showAddCheckDialog,
                color: kPrimary,
              ),
              const SizedBox(height: 16),
              _buildFilterRow(),
              if (_dateRange != null)
                Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Showing checks from ${DateFormat('MMM dd, yyyy').format(_dateRange!.start)} to ${DateFormat('MMM dd, yyyy').format(_dateRange!.end)}',
                    style: appStyle(12, kGray, FontWeight.normal),
                  ),
                ),
              if (_loadingChecks)
                Center(child: CircularProgressIndicator())
              else if (_checks.isEmpty)
                Center(
                  child: Text(
                    'No checks found',
                    style: appStyle(16, kGray, FontWeight.normal),
                  ),
                )
              else
                Column(
                  children:
                      _checks.map((check) => _buildCheckCard(check)).toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class ManageCheckNumbersScreen extends StatefulWidget {
  const ManageCheckNumbersScreen({super.key});

  @override
  State<ManageCheckNumbersScreen> createState() =>
      _ManageCheckNumbersScreenState();
}

class _ManageCheckNumbersScreenState extends State<ManageCheckNumbersScreen> {
  final TextEditingController _startNumberController = TextEditingController();
  final TextEditingController _endNumberController = TextEditingController();
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  List<Map<String, dynamic>> _checkSeries = [];
  bool _isLoading = true;
  String _errorMessage = '';
  int? _currentCheckNumber;

  @override
  void initState() {
    super.initState();
    _fetchCheckSeries();
    _fetchCurrentCheckNumber();
  }

  Future<void> _fetchCheckSeries() async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('CheckSeries')
          .where('userId', isEqualTo: currentUId)
          .orderBy('createdAt', descending: true)
          .get();

      setState(() {
        _checkSeries = snapshot.docs.map((doc) {
          Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
          return {
            'id': doc.id,
            ...data,
            'createdAt': (data['createdAt'] as Timestamp).toDate(),
          };
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading check series: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchCurrentCheckNumber() async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (snapshot.exists) {
        setState(() {
          _currentCheckNumber = snapshot['currentCheckNumber'];
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching current check number: $e';
      });
    }
  }

  Future<void> _saveCheckSeries() async {
    if (_startNumberController.text.isEmpty ||
        _endNumberController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter both start and end numbers')),
      );
      return;
    }

    final start = int.tryParse(_startNumberController.text);
    final end = int.tryParse(_endNumberController.text);

    if (start == null || end == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid numbers')),
      );
      return;
    }

    if (start >= end) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('End number must be greater than start number')),
      );
      return;
    }

    try {
      await FirebaseFirestore.instance.collection('CheckSeries').add({
        'userId': currentUId,
        'startNumber': start,
        'endNumber': end,
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (_currentCheckNumber == null) {
        await FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .update({'currentCheckNumber': start});
        setState(() {
          _currentCheckNumber = start;
        });
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Check series saved successfully')),
      );

      _startNumberController.clear();
      _endNumberController.clear();
      await _fetchCheckSeries();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving check series: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Check Numbers'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Check Number: ${_currentCheckNumber ?? 'Not set'}',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            const Text('Add New Check Series',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _startNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Start Number',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _endNumberController,
                    decoration: const InputDecoration(
                      labelText: 'End Number',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _saveCheckSeries,
              child: const Text('Save Check Series'),
            ),
            const SizedBox(height: 20),
            const Text('Check Series History',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _checkSeries.isEmpty
                    ? const Text('No check series found')
                    : Expanded(
                        child: ListView.builder(
                          itemCount: _checkSeries.length,
                          itemBuilder: (context, index) {
                            final series = _checkSeries[index];
                            return Card(
                              child: ListTile(
                                title: Text(
                                    '${series['startNumber']} - ${series['endNumber']}'),
                                subtitle: Text(DateFormat('MMM dd, yyyy')
                                    .format(series['createdAt'])),
                              ),
                            );
                          },
                        ),
                      ),
          ],
        ),
      ),
    );
  }
}
