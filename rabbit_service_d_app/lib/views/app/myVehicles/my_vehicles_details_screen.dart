import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/edit_vehicle_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'package:firebase_storage/firebase_storage.dart';

class MyVehiclesDetailsScreen extends StatefulWidget {
  const MyVehiclesDetailsScreen(
      {super.key, required this.vehicleData, required this.role});

  final Map<String, dynamic> vehicleData;
  final String role;

  @override
  State<MyVehiclesDetailsScreen> createState() =>
      _MyVehiclesDetailsScreenState();
}

class _MyVehiclesDetailsScreenState extends State<MyVehiclesDetailsScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final List<Map<String, dynamic>> uploadedFiles = [];
  final ImagePicker _imagePicker = ImagePicker();
  bool isLoading = false;
  late bool isActive;

  Future<void> _pickImage() async {
    final pickedFile =
        await _imagePicker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        uploadedFiles.add({
          'image': File(pickedFile.path),
          'textController': TextEditingController(),
        });
      });
    }
  }

  Future<void> _uploadToFirestore(String vehicleId) async {
    if (uploadedFiles.isEmpty || vehicleId == null) return;

    setState(() {
      isLoading = true;
    });
    try {
      final List<Map<String, dynamic>> uploads = [];
      for (var file in uploadedFiles) {
        final imageUrl = await _uploadImageToStorage(file['image']);
        final text = file['textController'].text;

        uploads.add({
          'imageUrl': imageUrl,
          'text': text,
        });
      }

      await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection("Vehicles")
          .doc(vehicleId)
          .update({
        'uploadedDocuments': FieldValue.arrayUnion(uploads),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Documents uploaded successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      setState(() {
        uploadedFiles.clear();
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error uploading documents: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<String> _uploadImageToStorage(File image) async {
    try {
      final storageRef = FirebaseStorage.instance.ref();
      final imageRef = storageRef
          .child('vehicle_images/${DateTime.now().millisecondsSinceEpoch}.png');
      await imageRef.putFile(image);
      return await imageRef.getDownloadURL();
    } catch (e) {
      throw Exception('Failed to upload image: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    isActive = widget.vehicleData['active'];
  }

  @override
  Widget build(BuildContext context) {
    final String vehicleId = widget.vehicleData['vehicleId'];

    return Scaffold(
      appBar: AppBar(
        title: Text("Vehicle Details",
            style: appStyle(20, kWhite, FontWeight.normal)),
        elevation: 0,
        iconTheme: IconThemeData(color: kWhite),
        backgroundColor: kPrimary,
        actions: [
          widget.role == "Owner"
              ? Switch(
                  value: isActive,
                  activeColor: kSecondary,
                  onChanged: (value) async {
                    setState(() {
                      isActive = value;
                    });

                    try {
                      final batch = FirebaseFirestore.instance.batch();

                      // 1. Always update owner's vehicle and DataServices
                      final ownerVehicleRef = FirebaseFirestore.instance
                          .collection("Users")
                          .doc(currentUId)
                          .collection('Vehicles')
                          .doc(vehicleId);
                      batch.update(ownerVehicleRef, {'active': value});

                      // Update owner's DataServices
                      final ownerDataServices = await FirebaseFirestore.instance
                          .collection("Users")
                          .doc(currentUId)
                          .collection('DataServices')
                          .where("vehicleId", isEqualTo: vehicleId)
                          .get();

                      for (var doc in ownerDataServices.docs) {
                        batch.update(doc.reference, {'active': value});
                      }

                      // 2. Check if owner has any team members
                      final teamCheck = await FirebaseFirestore.instance
                          .collection('Users')
                          .where('createdBy', isEqualTo: currentUId)
                          .where('isTeamMember', isEqualTo: true)
                          .limit(1)
                          .get();

                      if (teamCheck.docs.isNotEmpty) {
                        // Owner has team members - get all members
                        final teamMembers = await FirebaseFirestore.instance
                            .collection('Users')
                            .where('createdBy', isEqualTo: currentUId)
                            .where('isTeamMember', isEqualTo: true)
                            .get();

                        for (var member in teamMembers.docs) {
                          final memberId = member.id;

                          try {
                            // Check if team member has this specific vehicle
                            final memberVehicleRef = FirebaseFirestore.instance
                                .collection("Users")
                                .doc(memberId)
                                .collection('Vehicles')
                                .doc(vehicleId);

                            final memberVehicleDoc =
                                await memberVehicleRef.get();

                            if (memberVehicleDoc.exists) {
                              // Only update if vehicle exists for team member
                              batch.update(memberVehicleRef, {'active': value});

                              // Update team member's DataServices if they have any
                              final memberDataServices = await FirebaseFirestore
                                  .instance
                                  .collection("Users")
                                  .doc(memberId)
                                  .collection('DataServices')
                                  .where("vehicleId", isEqualTo: vehicleId)
                                  .get();

                              for (var doc in memberDataServices.docs) {
                                batch.update(doc.reference, {'active': value});
                              }
                            }
                          } catch (e) {
                            // Skip if team member has no Vehicles collection or other error
                            log("Team member $memberId has no Vehicles collection or error: $e");
                            continue;
                          }
                        }
                      }

                      await batch.commit();
                      showToastMessage(
                          "Success", "Vehicle Status Updated", kSecondary);
                      log("Vehicle status updated for owner and applicable team members");
                    } catch (e) {
                      showToastMessage("Error",
                          "Failed to update vehicle status", Colors.red);
                      setState(() {
                        isActive = !value;
                      });
                      log("Error updating vehicle status: $e");
                    }
                  },
                )
              : SizedBox(),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              _shareVehicleDetails(widget.vehicleData);
            },
          ),
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            onPressed: () {
              _generatePdf(widget.vehicleData);
            },
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('Users')
                  .doc(currentUId)
                  .collection("Vehicles")
                  .doc(vehicleId)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (!snapshot.hasData || snapshot.data == null) {
                  return const Center(child: Text("No data found."));
                }

                final vehicleData =
                    snapshot.data!.data() as Map<String, dynamic>;
                final uploadedDocuments =
                    vehicleData['uploadedDocuments'] ?? [];
                final services = vehicleData['services'] ?? [];
                final currentMilesArray =
                    vehicleData['currentMilesArray'] ?? [];

                final rawDate = vehicleData['year'] ?? '';
                final oilChangeDate = vehicleData['oilChangeDate'] ?? '';
                final formattedOilChangeDate = oilChangeDate.isNotEmpty
                    ? DateFormat('MM-dd-yyyy')
                        .format(DateTime.parse(oilChangeDate))
                    : "";

                final formattedDate =
                    DateFormat('MM-dd-yyyy').format(DateTime.parse(rawDate));
                final vehicleType = vehicleData['vehicleType'];
                final engineName = vehicleData['engineName'];

                return SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Display vehicle details
                        Card(
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                _buildInfoRow('Vehicle Number:',
                                    vehicleData['vehicleNumber']),
                                _buildInfoRow('Year:', formattedDate),
                                vehicleType == "Trailer"
                                    ? SizedBox()
                                    : _buildInfoRow('Current Miles:',
                                        vehicleData['currentMiles'].toString()),
                                _buildInfoRow('License Plate:',
                                    vehicleData['licensePlate']),
                                _buildInfoRow('Company Name:',
                                    vehicleData['companyName']),
                                vehicleData['dot'].isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('DOT:', vehicleData['dot']),
                                vehicleData['iccms'].isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow(
                                        'ICCMS:', vehicleData['iccms']),
                                vehicleData['vin'].isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('VIN:', vehicleData['vin']),
                                vehicleData['vehicleType'] == "Trailer"
                                    ? vehicleData['oilChangeDate'].isEmpty
                                        ? SizedBox()
                                        : engineName == "DRY VAN"
                                            ? SizedBox()
                                            : _buildInfoRow(
                                                'Oil Change Date:',
                                                formattedOilChangeDate
                                                    .toString())
                                    : SizedBox(),
                                vehicleData['hoursReading'].isEmpty
                                    ? SizedBox()
                                    : engineName == "DRY VAN"
                                        ? SizedBox()
                                        : _buildInfoRow('Hours Reading:',
                                            vehicleData['hoursReading']),
                                _buildInfoRow(
                                    "Engine Name:", vehicleData['engineName']),
                                _buildInfoRow("Vehicle Type:",
                                    vehicleData['vehicleType']),
                                SizedBox(height: 10.h),
                                widget.role == "Owner"
                                    ? CustomButton(
                                        text: "Edit Vehicle",
                                        onPress: () {
                                          Get.to(() => EditVehicleScreen(
                                              vehicleId: vehicleId,
                                              vehicleData: vehicleData));
                                        },
                                        color: kPrimary)
                                    : SizedBox(),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        widget.role == "Owner"
                            ? _buildSection(
                                title: 'Uploaded Documents',
                                content: uploadedDocuments.isNotEmpty
                                    ? uploadedDocuments.map<Widget>((doc) {
                                        return Card(
                                          elevation: 2,
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                          ),
                                          child: Padding(
                                            padding: const EdgeInsets.all(16.0),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                if (doc['imageUrl'] != null)
                                                  ClipRRect(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            10),
                                                    child: Image.network(
                                                      doc['imageUrl'],
                                                      height: 150,
                                                      width: double.infinity,
                                                      fit: BoxFit.cover,
                                                    ),
                                                  ),
                                                const SizedBox(height: 10),
                                                Row(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment
                                                          .spaceBetween,
                                                  children: [
                                                    Text(
                                                      doc['text'] ??
                                                          'No description provided',
                                                    ),
                                                    Row(
                                                      children: [
                                                        IconButton(
                                                          onPressed: () {
                                                            _showDeleteConfirmationDialog(
                                                                context,
                                                                vehicleId,
                                                                doc);
                                                          },
                                                          icon: const Icon(
                                                              Icons.delete,
                                                              color:
                                                                  Colors.red),
                                                        ),
                                                        IconButton(
                                                          onPressed: () async {
                                                            await _generatePdfForDocument(
                                                                doc['imageUrl'],
                                                                doc['text']);
                                                          },
                                                          icon: const Icon(
                                                              Icons.download),
                                                        ),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      }).toList()
                                    : [
                                        const Text(
                                          'No documents uploaded yet.',
                                          style: TextStyle(color: Colors.grey),
                                        ),
                                      ],
                              )
                            : SizedBox(),

                        widget.role == "Owner"
                            ? Column(
                                children: [
                                  const SizedBox(height: 20),
                                  ElevatedButton.icon(
                                    onPressed: _pickImage,
                                    icon: const Icon(Icons.add_photo_alternate,
                                        color: Colors.white),
                                    label: const Text(
                                      'Upload Document',
                                      style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: kPrimary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 20, vertical: 12),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  ...uploadedFiles.map((file) {
                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 16),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(15),
                                      ),
                                      elevation: 4,
                                      child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          children: [
                                            if (file['image'] != null)
                                              GestureDetector(
                                                onTap: () {
                                                  showDialog(
                                                    context: context,
                                                    builder: (_) => Dialog(
                                                      backgroundColor:
                                                          Colors.black,
                                                      insetPadding:
                                                          EdgeInsets.all(10),
                                                      child: InteractiveViewer(
                                                        child: ClipRRect(
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(10),
                                                          child: Image.file(
                                                            file['image'],
                                                            fit: BoxFit.contain,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                },
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                  child: Image.file(
                                                    file['image'],
                                                    height: 200,
                                                    width: double.infinity,
                                                    fit: BoxFit.cover,
                                                  ),
                                                ),
                                              ),
                                            const SizedBox(height: 12),
                                            TextField(
                                              controller:
                                                  file['textController'],
                                              decoration: InputDecoration(
                                                labelText: 'Enter Description',
                                                border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                filled: true,
                                                fillColor: Colors.grey[100],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                  const SizedBox(height: 20),
                                  uploadedFiles.isEmpty
                                      ? const SizedBox()
                                      : Center(
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: kPrimary,
                                              foregroundColor: Colors.white,
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 40,
                                                      vertical: 15),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                              ),
                                            ),
                                            onPressed: () =>
                                                _uploadToFirestore(vehicleId),
                                            child: const Text(
                                              'Update',
                                              style: TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ),
                                  const SizedBox(height: 20),
                                ],
                              )
                            : SizedBox(),
//========================= Services ================================================

                        widget.role == "Owner"
                            ? Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(15),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.grey.withOpacity(0.2),
                                      spreadRadius: 2,
                                      blurRadius: 5,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Services',
                                      style: TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: kPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                    _buildServicesTable(
                                        context, services, vehicleId),
                                  ],
                                ),
                              )
                            : SizedBox(),
                        const SizedBox(height: 20),

                        // Current Miles History
                        vehicleData['vehicleType'] == "Truck"
                            ? _buildSection(
                                title: 'Current Miles History',
                                content:
                                    currentMilesArray.map<Widget>((milesEntry) {
                                  final rawDate = milesEntry['date'] ?? '';
                                  final formattedDate = DateFormat('MM-dd-yyyy')
                                      .format(DateTime.parse(rawDate));
                                  return ListTile(
                                    leading: const Icon(Icons.timeline,
                                        color: kPrimary),
                                    title: Text('$formattedDate',
                                        style: appStyle(
                                            13, kDark, FontWeight.normal)),
                                    trailing: Text(
                                        'Miles: ${milesEntry['miles']}',
                                        style: appStyle(
                                            13, kDark, FontWeight.normal)),
                                  );
                                }).toList(),
                              )
                            : SizedBox(),

                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showDeleteConfirmationDialog(
      BuildContext context, String vehicleId, Map<String, dynamic> doc) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Delete Document"),
          content: const Text("Are you sure you want to delete this document?"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
              },
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context); // Close dialog
                await _deleteDocument(vehicleId, doc);
              },
              child: const Text("Yes", style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteDocument(
      String vehicleId, Map<String, dynamic> doc) async {
    try {
      final userDocRef = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection("Vehicles")
          .doc(vehicleId);

      final snapshot = await userDocRef.get();

      if (snapshot.exists) {
        final vehicleData = snapshot.data() as Map<String, dynamic>;
        List<dynamic> uploadedDocuments =
            vehicleData['uploadedDocuments'] ?? [];

        // Remove the selected document
        uploadedDocuments
            .removeWhere((element) => element['imageUrl'] == doc['imageUrl']);

        // Update Firestore with the new list
        await userDocRef.update({'uploadedDocuments': uploadedDocuments});

        // Optionally delete image from Firebase Storage if needed
        await FirebaseStorage.instance.refFromURL(doc['imageUrl']).delete();
      }
    } catch (e) {
      print("Error deleting document: $e");
    }
  }

  Widget _buildSection({required String title, required List<Widget> content}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 2,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: kPrimary,
            ),
          ),
          const SizedBox(height: 10),
          ...content,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: kPrimary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                color: Colors.black87,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesTable(
      BuildContext context, List services, String vehicleId) {
    final filteredServices = services
        .where((service) => service['defaultNotificationValue'] != 0)
        .toList()
      ..sort((a, b) => (a['serviceName'] ?? '')
          .toString()
          .toLowerCase()
          .compareTo((b['serviceName'] ?? '').toString().toLowerCase()));

    if (filteredServices.isEmpty) {
      return Center(
        child: Column(
          children: [
            Icon(Icons.no_sim, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 10),
            Text(
              'No services available.',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Table(
          columnWidths: const {
            0: FixedColumnWidth(40),
            1: FlexColumnWidth(),
            2: FixedColumnWidth(80),
            3: FixedColumnWidth(40),
          },
          children: [
            TableRow(
              decoration: const BoxDecoration(
                color: kPrimary,
              ),
              children: [
                _buildTableHeader('Sr. No.'),
                _buildTableHeader('Service Name'),
                _buildTableHeader("D'Value"),
                Padding(
                  padding:
                      const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
                  child: Icon(Icons.edit, color: kWhite, size: 20),
                ),
              ],
            ),
            ...filteredServices.asMap().entries.map((entry) {
              final index = entry.key + 1;
              final service = entry.value;
              final bool isEven = index.isEven;

              return TableRow(
                decoration: BoxDecoration(
                  color: isEven ? Colors.grey[100] : Colors.white,
                ),
                children: [
                  _buildTableCell(index.toString()), // Serial Number
                  _buildTableCell(service['serviceName'] ?? 'Unknown'),

                  _buildTableCell(
                    service['type'] == 'day'
                        ? _isDate(service['defaultNotificationValue'])
                            ? service['defaultNotificationValue'].toString() +
                                ' (Day)'
                            : service['defaultNotificationValue'].toString() +
                                ' (Day)'
                        : service['defaultNotificationValue'].toString() +
                            ' (' +
                            (service['type'] == 'reading'
                                ? 'Miles'
                                : service['type'] == 'hours'
                                    ? 'Hours'
                                    : '') +
                            ')',
                  ),

                  TableCell(
                    child: Container(
                      padding: const EdgeInsets.all(2.0),
                      child: (service['type'] == 'hours' ||
                              service['type'] == 'reading')
                          ? IconButton(
                              icon: const Icon(Icons.edit,
                                  color: kPrimary, size: 20),
                              onPressed: () {
                                _showEditDialog(context, service, vehicleId);
                              },
                            )
                          : const SizedBox(),
                    ),
                  ),
                ],
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  bool _isDate(dynamic value) {
    if (value is String) {
      try {
        // Try to parse dd/MM/yyyy format
        final parts = value.split('/');
        if (parts.length == 3) {
          final day = int.tryParse(parts[0]);
          final month = int.tryParse(parts[1]);
          final year = int.tryParse(parts[2]);
          if (day != null && month != null && year != null) {
            DateTime parsedDate = DateTime(year, month, day);
            return true;
          }
        }
      } catch (_) {}
    }
    return false;
  }

  Widget _buildTableHeader(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
      child: Text(
        text,
        maxLines: 1,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 15,
        ),
      ),
    );
  }

  Widget _buildTableCell(String text) {
    return Container(
      padding: const EdgeInsets.all(5),
      child: Text(
        text,
        style: appStyle(13, kDark, FontWeight.normal),
      ),
    );
  }

  // void _showEditDialog(
  //     BuildContext context, Map<String, dynamic> service, String vehicleId) {
  //   final TextEditingController controller = TextEditingController(
  //     text: service['defaultNotificationValue'].toString(),
  //   );

  //   showDialog(
  //     context: context,
  //     builder: (context) {
  //       return AlertDialog(
  //         shape: RoundedRectangleBorder(
  //           borderRadius: BorderRadius.circular(15),
  //         ),
  //         title: const Text(
  //           'Edit Default Notification Value',
  //           style: TextStyle(color: kPrimary),
  //         ),
  //         content: TextField(
  //           controller: controller,
  //           keyboardType: TextInputType.number,
  //           decoration: InputDecoration(
  //             labelText: 'Enter New Value',
  //             border: OutlineInputBorder(
  //               borderRadius: BorderRadius.circular(10),
  //             ),
  //             focusedBorder: OutlineInputBorder(
  //               borderRadius: BorderRadius.circular(10),
  //               borderSide: const BorderSide(color: kPrimary, width: 2),
  //             ),
  //           ),
  //         ),
  //         actions: [
  //           TextButton(
  //             onPressed: () {
  //               Navigator.pop(context);
  //             },
  //             child: Text('Cancel',
  //                 style: appStyle(17, kPrimary, FontWeight.normal)),
  //           ),
  //           ElevatedButton(
  //             style: ElevatedButton.styleFrom(
  //               backgroundColor: kSecondary,
  //               foregroundColor: kWhite,
  //               shape: RoundedRectangleBorder(
  //                 borderRadius: BorderRadius.circular(8),
  //               ),
  //             ),
  //             onPressed: () async {
  //               final newValue = int.tryParse(controller.text);
  //               if (newValue == null) {
  //                 ScaffoldMessenger.of(context).showSnackBar(
  //                   const SnackBar(
  //                       content: Text('Please enter a valid number')),
  //                 );
  //                 return;
  //               }

  //               try {
  //                 final vehicleDocRef = FirebaseFirestore.instance
  //                     .collection('Users')
  //                     .doc(currentUId)
  //                     .collection('Vehicles')
  //                     .doc(vehicleId);

  //                 await FirebaseFirestore.instance
  //                     .runTransaction((transaction) async {
  //                   final docSnapshot = await transaction.get(vehicleDocRef);
  //                   if (!docSnapshot.exists)
  //                     throw Exception('Document not found');

  //                   List<dynamic> services = List.from(docSnapshot['services']);
  //                   int index = services.indexWhere(
  //                     (s) => s['serviceName'] == service['serviceName'],
  //                   );

  //                   if (index == -1) throw Exception('Service not found');

  //                   // Get current values
  //                   Map<String, dynamic> currentService =
  //                       Map.from(services[index]);
  //                   int currentDefault =
  //                       currentService['defaultNotificationValue'];
  //                   int currentNext = currentService['nextNotificationValue'];

  //                   // Calculate the difference between current values
  //                   int difference = currentNext - currentDefault;

  //                   // Calculate new next value based on the difference
  //                   int newNextValue = newValue + difference;

  //                   // Ensure the new next value is not less than the new default
  //                   if (newNextValue < newValue) {
  //                     newNextValue = newValue;
  //                   }

  //                   // Update the service
  //                   Map<String, dynamic> updatedService =
  //                       Map.from(currentService);
  //                   updatedService['defaultNotificationValue'] = newValue;
  //                   updatedService['nextNotificationValue'] = newNextValue;
  //                   updatedService['preValue'] =
  //                       currentDefault; // Store previous value

  //                   services[index] = updatedService;

  //                   transaction.update(vehicleDocRef, {'services': services});
  //                 });

  //                 Navigator.pop(context); // Close dialog on success
  //               } catch (e) {
  //                 ScaffoldMessenger.of(context).showSnackBar(
  //                   SnackBar(content: Text('Error updating service: $e')),
  //                 );
  //               }
  //             },
  //             child: const Text('Update'),
  //           ),
  //         ],
  //       );
  //     },
  //   );
  // }

  void _showEditDialog(
      BuildContext context, Map<String, dynamic> service, String vehicleId) {
    final TextEditingController controller = TextEditingController(
      text: service['defaultNotificationValue'].toString(),
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: const Text(
            'Edit Default Notification Value',
            style: TextStyle(color: kPrimary),
          ),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Enter New Value',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: kPrimary, width: 2),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text('Cancel',
                  style: appStyle(17, kPrimary, FontWeight.normal)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kSecondary,
                foregroundColor: kWhite,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              // onPressed: () async {
              //   final newValue = int.tryParse(controller.text);
              //   if (newValue == null) {
              //     ScaffoldMessenger.of(context).showSnackBar(
              //       const SnackBar(
              //           content: Text('Please enter a valid number')),
              //     );
              //     return;
              //   }

              //   try {
              //     // First update the owner's vehicle
              //     await _updateServiceValue(
              //         currentUId, vehicleId, service, newValue);

              //     // Check if owner has any team members
              //     final teamCheck = await FirebaseFirestore.instance
              //         .collection('Users')
              //         .where('createdBy', isEqualTo: currentUId)
              //         .where('isTeamMember', isEqualTo: true)
              //         .limit(1)
              //         .get();

              //     if (teamCheck.docs.isNotEmpty) {
              //       // Owner has team members - get all members
              //       final teamMembers = await FirebaseFirestore.instance
              //           .collection('Users')
              //           .where('createdBy', isEqualTo: currentUId)
              //           .where('isTeamMember', isEqualTo: true)
              //           .get();

              //       for (var member in teamMembers.docs) {
              //         final memberId = member.id;
              //         try {
              //           // Check if team member has this specific vehicle
              //           final memberVehicleRef = FirebaseFirestore.instance
              //               .collection("Users")
              //               .doc(memberId)
              //               .collection('Vehicles')
              //               .doc(vehicleId);

              //           final memberVehicleDoc = await memberVehicleRef.get();

              //           if (memberVehicleDoc.exists) {
              //             // Only update if vehicle exists for team member
              //             await _updateServiceValue(
              //                 memberId, vehicleId, service, newValue);
              //           }
              //         } catch (e) {
              //           // Skip if team member has no Vehicles collection or other error
              //           log("Team member $memberId has no Vehicles collection or error: $e");
              //           continue;
              //         }
              //       }
              //     }

              //     Navigator.pop(context); // Close dialog on success
              //     showToastMessage(
              //         "Success", "Service value updated", kSecondary);
              //   } catch (e) {
              //     ScaffoldMessenger.of(context).showSnackBar(
              //       SnackBar(content: Text('Error updating service: $e')),
              //     );
              //   }
              // },

              onPressed: () async {
                final newValue = int.tryParse(controller.text);
                if (newValue == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Please enter a valid number')),
                  );
                  return;
                }

                try {
                  // First update the current user's vehicle (whether owner or team member)
                  await _updateServiceValue(
                      currentUId, vehicleId, service, newValue);

                  if (widget.role == "Owner") {
                    // If current user is owner, update all team members with this vehicle
                    await _updateTeamMembers(
                        currentUId, vehicleId, service, newValue);
                  } else {
                    // If current user is team member, update owner's vehicle
                    final userDoc = await FirebaseFirestore.instance
                        .collection('Users')
                        .doc(currentUId)
                        .get();

                    final createdBy = userDoc['createdBy'];
                    if (createdBy != null) {
                      // Check if owner has this vehicle
                      final ownerVehicleRef = FirebaseFirestore.instance
                          .collection("Users")
                          .doc(createdBy)
                          .collection('Vehicles')
                          .doc(vehicleId);

                      final ownerVehicleDoc = await ownerVehicleRef.get();
                      if (ownerVehicleDoc.exists) {
                        await _updateServiceValue(
                            createdBy, vehicleId, service, newValue);
                      }
                    }
                  }

                  Navigator.pop(context); // Close dialog on success
                  showToastMessage(
                      "Success", "Service value updated", kSecondary);
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error updating service: $e')),
                  );
                }
              },
              child: const Text('Update'),
            ),
          ],
        );
      },
    );
  }

  // Add this helper function
  Future<void> _updateTeamMembers(String ownerId, String vehicleId,
      Map<String, dynamic> service, int newValue) async {
    // Check if owner has any team members
    final teamCheck = await FirebaseFirestore.instance
        .collection('Users')
        .where('createdBy', isEqualTo: ownerId)
        .where('isTeamMember', isEqualTo: true)
        .limit(1)
        .get();

    if (teamCheck.docs.isNotEmpty) {
      // Owner has team members - get all members
      final teamMembers = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: ownerId)
          .where('isTeamMember', isEqualTo: true)
          .get();

      for (var member in teamMembers.docs) {
        final memberId = member.id;
        try {
          // Check if team member has this specific vehicle
          final memberVehicleRef = FirebaseFirestore.instance
              .collection("Users")
              .doc(memberId)
              .collection('Vehicles')
              .doc(vehicleId);

          final memberVehicleDoc = await memberVehicleRef.get();

          if (memberVehicleDoc.exists) {
            // Only update if vehicle exists for team member
            await _updateServiceValue(memberId, vehicleId, service, newValue);
          }
        } catch (e) {
          // Skip if team member has no Vehicles collection or other error
          log("Team member $memberId has no Vehicles collection or error: $e");
          continue;
        }
      }
    }
  }

  Future<void> _updateServiceValue(String userId, String vehicleId,
      Map<String, dynamic> service, int newValue) async {
    final vehicleDocRef = FirebaseFirestore.instance
        .collection('Users')
        .doc(userId)
        .collection('Vehicles')
        .doc(vehicleId);

    await FirebaseFirestore.instance.runTransaction((transaction) async {
      final docSnapshot = await transaction.get(vehicleDocRef);
      if (!docSnapshot.exists) throw Exception('Document not found');

      List<dynamic> services = List.from(docSnapshot['services']);
      int index = services.indexWhere(
        (s) => s['serviceName'] == service['serviceName'],
      );

      if (index == -1) throw Exception('Service not found');

      // Get current values
      Map<String, dynamic> currentService = Map.from(services[index]);
      int currentDefault = currentService['defaultNotificationValue'];
      int currentNext = currentService['nextNotificationValue'];

      // Calculate the difference between current values
      int difference = currentNext - currentDefault;

      // Calculate new next value based on the difference
      int newNextValue = newValue + difference;

      // Ensure the new next value is not less than the new default
      if (newNextValue < newValue) {
        newNextValue = newValue;
      }

      // Update the service
      Map<String, dynamic> updatedService = Map.from(currentService);
      updatedService['defaultNotificationValue'] = newValue;
      updatedService['nextNotificationValue'] = newNextValue;
      updatedService['preValue'] = currentDefault; // Store previous value

      services[index] = updatedService;

      transaction.update(vehicleDocRef, {'services': services});
    });
  }

  void _shareVehicleDetails(Map<String, dynamic> vehicleData) {
    // Build the details string with enhanced message and URLs
    final String details = '''
  🚗 Hey! Check out my vehicle details managed with Rabbit Mechanic! 🔧

  📱 Get the Rabbit Mechanic App:
  • Android: [Play Store URL]
  • iOS: [App Store URL]
  • Web: www.rabbitmechanic.com

  Vehicle Details:
  -----------------------------------
  Vehicle Number: ${vehicleData['vehicleNumber']}
  Year: ${vehicleData['year']}
  Current Miles: ${vehicleData['currentMiles']}
  License Plate: ${vehicleData['licensePlate']}
  Company Name: ${vehicleData['companyName']}
  ${vehicleData['dot'].isNotEmpty ? 'DOT: ${vehicleData['dot']}' : ''}
  ${vehicleData['iccms'].isNotEmpty ? 'ICCMS: ${vehicleData['iccms']}' : ''}
  ${vehicleData['vin'].isNotEmpty ? 'VIN: ${vehicleData['vin']}' : ''}
  ${vehicleData['oilChangeDate'].isNotEmpty ? 'Oil Change Date: ${vehicleData['oilChangeDate']}' : ''}
  ${vehicleData['hoursReading'].isNotEmpty ? 'Hours Reading: ${vehicleData['hoursReading']}' : ''}
  
  -----------------------------------

  🌟 Why Rabbit Mechanic?
  • Track vehicle maintenance
  • Service reminders
  • Document management
  • Digital records
  • And much more!

  Join thousands of smart vehicle owners using Rabbit Mechanic! 🚀
  #RabbitMechanic #VehicleManagement
  ''';

    // Share the enhanced message
    Share.share(details);
  }

//generate vehicle details pdf
  void _generatePdf(Map<String, dynamic> vehicleData) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Stack(
            children: [
              // Background watermark
              pw.Center(
                child: pw.Text(
                  // vehicleData['companyName']?.toUpperCase() ?? "COMPANY NAME",
                  "Rabbit Mechanic",
                  style: pw.TextStyle(
                    fontSize: 100,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.grey300,
                  ),
                  textAlign: pw.TextAlign.center,
                ),
              ),
              // Foreground content
              pw.Padding(
                padding: const pw.EdgeInsets.all(16.0),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Vehicle Details',
                      style: pw.TextStyle(
                        fontSize: 24,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
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
                    if (vehicleData['dot']?.isNotEmpty ?? false)
                      pw.Text('DOT: ${vehicleData['dot']}'),
                    if (vehicleData['iccms']?.isNotEmpty ?? false)
                      pw.Text('ICCMS: ${vehicleData['iccms']}'),
                    if (vehicleData['vin']?.isNotEmpty ?? false)
                      pw.Text('VIN: ${vehicleData['vin']}'),
                    if (vehicleData['oilChangeDate']?.isNotEmpty ?? false)
                      pw.Text(
                          'Oil Change Date: ${vehicleData['oilChangeDate']}'),
                    if (vehicleData['hoursReading']?.isNotEmpty ?? false)
                      pw.Text('Hours Reading: ${vehicleData['hoursReading']}'),
                    pw.Text(
                        'Engine Name: ${vehicleData['engineName'] ?? "Unknown Engine Name"}'),
                    pw.Text(
                        'Vehicle Type: ${vehicleData['vehicleType'] ?? "Unknown Vehicle Type"}'),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

//generate pdf for image

  Future<void> _generatePdfForDocument(String? imageUrl, String? text) async {
    try {
      final pdf = pw.Document();

      // Download the image
      Uint8List? imageBytes;
      if (imageUrl != null) {
        try {
          final response = await http.get(Uri.parse(imageUrl));
          if (response.statusCode == 200) {
            imageBytes = response.bodyBytes;
          }
        } catch (e) {
          print('Error downloading image: $e');
        }
      }

      // Debugging logs
      print('Image Bytes: ${imageBytes?.length ?? 0}');
      print('Text: ${text ?? 'No description provided'}');

      // Add page with cropped image and text
      if (imageBytes != null) {
        pdf.addPage(
          pw.Page(
            build: (pw.Context context) {
              return pw.Stack(
                children: [
                  // Watermark in the background
                  pw.Center(
                    child: pw.Opacity(
                      opacity: 0.1,
                      child: pw.Text(
                        'Rabbit Mechanic',
                        style: pw.TextStyle(
                          fontSize: 80,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.grey,
                        ),
                        textAlign: pw.TextAlign.center,
                      ),
                    ),
                  ),
                  // Main content
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      // Cropped image
                      pw.Container(
                          height: 500,
                          width: double.infinity, // Make it full width
                          child: pw.Center(
                            child: pw.ClipRect(
                              child: pw.Image(
                                pw.MemoryImage(imageBytes!),
                                fit: pw.BoxFit.contain, // Crop the image
                              ),
                            ),
                          )),
                      pw.SizedBox(height: 20),
                      // Text description
                      pw.Text(
                        text?.trim().isNotEmpty == true
                            ? text!
                            : 'No description provided',
                        style: pw.TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        );
      } else {
        // Error handling if image cannot be loaded
        pdf.addPage(
          pw.Page(
            build: (pw.Context context) {
              return pw.Center(
                child: pw.Text(
                  'Image could not be loaded.',
                  style: pw.TextStyle(fontSize: 18, color: PdfColors.red),
                ),
              );
            },
          ),
        );
      }

      // Show PDF preview and allow download
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e, stackTrace) {
      print('Error generating PDF: $e');
      print(stackTrace);
    }
  }
}
