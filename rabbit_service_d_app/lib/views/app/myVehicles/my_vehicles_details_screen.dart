import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:photo_view/photo_view.dart';
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
      {super.key,
      required this.vehicleData,
      required this.role,
      required this.currentUId});

  final Map<String, dynamic> vehicleData;
  final String role;
  final String currentUId;

  @override
  State<MyVehiclesDetailsScreen> createState() =>
      _MyVehiclesDetailsScreenState();
}

class _MyVehiclesDetailsScreenState extends State<MyVehiclesDetailsScreen> {
  final List<Map<String, dynamic>> uploadedFiles = [];
  final ImagePicker _imagePicker = ImagePicker();
  bool isLoading = false;
  late bool isActive;

  Future<void> _pickDocument() async {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: <Widget>[
              ListTile(
                leading: const Icon(Icons.photo_camera, color: kPrimary),
                title: const Text('Take Photo (Camera)'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final picked = await _imagePicker.pickImage(
                      source: ImageSource.camera, imageQuality: 85);
                  if (picked != null) {
                    setState(() {
                      uploadedFiles.add({
                        'file': File(picked.path),
                        'name': picked.name,
                        'isPdf': false,
                        'textController': TextEditingController(),
                      });
                    });
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: kPrimary),
                title: const Text('Choose Image (Gallery)'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final picked = await _imagePicker.pickImage(
                      source: ImageSource.gallery, imageQuality: 85);
                  if (picked != null) {
                    setState(() {
                      uploadedFiles.add({
                        'file': File(picked.path),
                        'name': picked.name,
                        'isPdf': false,
                        'textController': TextEditingController(),
                      });
                    });
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
                title: const Text('Upload PDF Document'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['pdf'],
                  );
                  if (result != null && result.files.single.path != null) {
                    final platformFile = result.files.single;
                    setState(() {
                      uploadedFiles.add({
                        'file': File(platformFile.path!),
                        'name': platformFile.name,
                        'isPdf': true,
                        'textController': TextEditingController(),
                      });
                    });
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _uploadToFirestore(String vehicleId) async {
    if (uploadedFiles.isEmpty || vehicleId == null) return;

    setState(() {
      isLoading = true;
    });
    try {
      final List<Map<String, dynamic>> uploads = [];
      for (var item in uploadedFiles) {
        final File file = item['file'];
        final bool isPdf = item['isPdf'] == true;
        final String fileUrl = await _uploadFileToStorage(file, isPdf);
        final String text = item['textController'].text;

        uploads.add({
          'imageUrl': fileUrl,
          'fileType': isPdf ? 'pdf' : 'image',
          'name': item['name'] ?? (isPdf ? 'document.pdf' : 'image.png'),
          'text': text,
        });
      }

      await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.currentUId)
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

  Future<String> _uploadFileToStorage(File file, bool isPdf) async {
    try {
      final storageRef = FirebaseStorage.instance.ref();
      final String folder = isPdf ? 'vehicle_documents' : 'vehicle_images';
      final String ext = isPdf ? 'pdf' : 'png';
      final fileRef = storageRef
          .child('$folder/${DateTime.now().millisecondsSinceEpoch}.$ext');

      final SettableMetadata metadata = SettableMetadata(
        contentType: isPdf ? 'application/pdf' : 'image/png',
      );

      await fileRef.putFile(file, metadata);
      return await fileRef.getDownloadURL();
    } catch (e) {
      throw Exception('Failed to upload file: $e');
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
          widget.role == "Owner" || widget.role == "SubOwner"
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
                          .doc(widget.currentUId)
                          .collection('Vehicles')
                          .doc(vehicleId);
                      batch.update(ownerVehicleRef, {'active': value});

                      // Update owner's DataServices
                      final ownerDataServices = await FirebaseFirestore.instance
                          .collection("Users")
                          .doc(widget.currentUId)
                          .collection('DataServices')
                          .where("vehicleId", isEqualTo: vehicleId)
                          .get();

                      for (var doc in ownerDataServices.docs) {
                        batch.update(doc.reference, {'active': value});
                      }

                      // 2. Check if owner has any team members
                      final teamCheck = await FirebaseFirestore.instance
                          .collection('Users')
                          .where('createdBy', isEqualTo: widget.currentUId)
                          .where('isTeamMember', isEqualTo: true)
                          .limit(1)
                          .get();

                      if (teamCheck.docs.isNotEmpty) {
                        // Owner has team members - get all members
                        final teamMembers = await FirebaseFirestore.instance
                            .collection('Users')
                            .where('createdBy', isEqualTo: widget.currentUId)
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
                  .doc(widget.currentUId)
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
                String formattedDate = '';
                if (rawDate != null && rawDate.toString().isNotEmpty) {
                  if (rawDate.toString().length == 4 &&
                      int.tryParse(rawDate.toString()) != null) {
                    formattedDate = rawDate.toString();
                  } else {
                    try {
                      formattedDate = DateFormat('MM-dd-yyyy')
                          .format(DateTime.parse(rawDate.toString()));
                    } catch (_) {
                      formattedDate = rawDate.toString();
                    }
                  }
                }
                final vehicleType =
                    vehicleData['vehicleType']?.toString() ?? '';
                final vehicleNumber =
                    vehicleData['vehicleNumber']?.toString() ?? '';
                final licensePlate =
                    vehicleData['licensePlate']?.toString() ?? '';
                final companyName =
                    vehicleData['companyName']?.toString() ?? '';
                final engineName = vehicleData['engineName']?.toString() ?? '';
                final currentMiles =
                    vehicleData['currentMiles']?.toString() ?? '';
                final vin = vehicleData['vin']?.toString() ?? '';
                final dot = vehicleData['dot']?.toString() ?? '';
                final iccms = vehicleData['iccms']?.toString() ?? '';

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
                                _buildInfoRow('Vehicle Number:', vehicleNumber),
                                formattedDate.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('Year:', formattedDate),
                                vehicleType == "Trailer" || currentMiles.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow(
                                        'Current Miles:', currentMiles),
                                licensePlate.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow(
                                        'License Plate:', licensePlate),
                                _buildInfoRow('Company Name:', companyName),
                                vehicleType == "Trailer" || dot.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('DOT:', dot),
                                vehicleType == "Trailer" || iccms.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('ICCMS:', iccms),
                                vin.isEmpty
                                    ? SizedBox()
                                    : _buildInfoRow('VIN:', vin),
                                _buildInfoRow("Engine Name:", engineName),
                                _buildInfoRow("Vehicle Type:", vehicleType),
                                SizedBox(height: 10.h),
                                widget.role == "Owner" ||
                                        widget.role == "SubOwner"
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

                        widget.role == "Owner" || widget.role == "SubOwner"
                            ? _buildSection(
                                title: 'Uploaded Documents',
                                content: uploadedDocuments.isNotEmpty
                                    ? uploadedDocuments.map<Widget>((doc) {
                                        final String? docUrl = doc['imageUrl'];
                                        final bool isPdfDoc = docUrl != null &&
                                            (docUrl.toLowerCase().contains('.pdf') ||
                                                doc['fileType'] == 'pdf');

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
                                                if (isPdfDoc)
                                                  InkWell(
                                                    onTap: () async {
                                                      if (docUrl != null &&
                                                          docUrl.isNotEmpty) {
                                                        final uri =
                                                            Uri.parse(docUrl);
                                                        if (await canLaunchUrl(
                                                            uri)) {
                                                          await launchUrl(uri,
                                                              mode: LaunchMode
                                                                  .externalApplication);
                                                        }
                                                      }
                                                    },
                                                    child: Container(
                                                      height: 120,
                                                      width: double.infinity,
                                                      decoration: BoxDecoration(
                                                        color: Colors.red.shade50,
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                                10),
                                                        border: Border.all(
                                                            color: Colors.red
                                                                .shade200),
                                                      ),
                                                      child: Column(
                                                        mainAxisAlignment:
                                                            MainAxisAlignment
                                                                .center,
                                                        children: [
                                                          const Icon(
                                                              Icons
                                                                  .picture_as_pdf,
                                                              color: Colors.red,
                                                              size: 48),
                                                          const SizedBox(
                                                              height: 8),
                                                          Text(
                                                            doc['name'] ??
                                                                'PDF Document',
                                                            maxLines: 1,
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis,
                                                            style:
                                                                const TextStyle(
                                                              color: Colors.red,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize: 14,
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              height: 4),
                                                          const Text(
                                                            'Tap to View / Open PDF',
                                                            style: TextStyle(
                                                                color: Colors
                                                                    .grey,
                                                                fontSize: 12),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  )
                                                else if (docUrl != null &&
                                                    docUrl.isNotEmpty)
                                                  GestureDetector(
                                                    onTap: () {
                                                      showDialog(
                                                        context: context,
                                                        builder: (context) =>
                                                            Dialog(
                                                          child: Container(
                                                            width: MediaQuery.of(
                                                                        context)
                                                                    .size
                                                                    .width *
                                                                0.9,
                                                            height: MediaQuery.of(
                                                                        context)
                                                                    .size
                                                                    .height *
                                                                0.7,
                                                            child: PhotoView(
                                                              imageProvider:
                                                                  NetworkImage(
                                                                      docUrl),
                                                              minScale:
                                                                  PhotoViewComputedScale
                                                                      .contained,
                                                              maxScale:
                                                                  PhotoViewComputedScale
                                                                          .covered *
                                                                      2,
                                                            ),
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                    child: ClipRRect(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              10),
                                                      child: Image.network(
                                                        docUrl,
                                                        height: 150,
                                                        width: double.infinity,
                                                        fit: BoxFit.cover,
                                                      ),
                                                    ),
                                                  ),
                                                const SizedBox(height: 10),
                                                Row(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment
                                                          .spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        doc['text'] ??
                                                            'No description provided',
                                                        maxLines: 2,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
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
                                                            if (isPdfDoc &&
                                                                docUrl != null) {
                                                              final uri =
                                                                  Uri.parse(
                                                                      docUrl);
                                                              if (await canLaunchUrl(
                                                                  uri)) {
                                                                await launchUrl(
                                                                    uri,
                                                                    mode: LaunchMode
                                                                        .externalApplication);
                                                              }
                                                            } else {
                                                              await _generatePdfForDocument(
                                                                  doc['imageUrl'],
                                                                  doc['text']);
                                                            }
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

                        widget.role == "Owner" || widget.role == "SubOwner"
                            ? Column(
                                children: [
                                  const SizedBox(height: 20),
                                  ElevatedButton.icon(
                                    onPressed: _pickDocument,
                                    icon: const Icon(Icons.add_photo_alternate,
                                        color: Colors.white),
                                    label: const Text(
                                      'Upload Document (PDF / Image)',
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
                                    final bool isPdf = file['isPdf'] == true;
                                    final File itemFile = file['file'];

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
                                            if (isPdf)
                                              Container(
                                                height: 100,
                                                width: double.infinity,
                                                decoration: BoxDecoration(
                                                  color: Colors.red.shade50,
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                  border: Border.all(
                                                      color:
                                                          Colors.red.shade200),
                                                ),
                                                child: Column(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment.center,
                                                  children: [
                                                    const Icon(
                                                        Icons.picture_as_pdf,
                                                        color: Colors.red,
                                                        size: 40),
                                                    const SizedBox(height: 6),
                                                    Text(
                                                      file['name'] ??
                                                          'document.pdf',
                                                      maxLines: 1,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                        color: Colors.red,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              )
                                            else
                                              ClipRRect(
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                                child: Image.file(
                                                  itemFile,
                                                  height: 200,
                                                  width: double.infinity,
                                                  fit: BoxFit.cover,
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

                        widget.role == "Owner" || widget.role == "SubOwner"
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
                                    _buildServicesTable(context, services,
                                        vehicleId, vehicleType),
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
          .doc(widget.currentUId)
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

  Widget _buildServicesTable(BuildContext context, List services,
      String vehicleId, String vehicleType) {
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
            0: FixedColumnWidth(35),
            1: FlexColumnWidth(),
            2: FixedColumnWidth(70),
            3: FixedColumnWidth(50),
            4: FixedColumnWidth(38),
          },
          children: [
            TableRow(
              decoration: const BoxDecoration(
                color: kPrimary,
              ),
              children: [
                _buildTableHeader('Sr.'),
                _buildTableHeader('Service Name'),
                _buildTableHeader("D'Value"),
                Container(
                  padding:
                      const EdgeInsets.symmetric(vertical: 7, horizontal: 2),
                  child: const Center(
                    child: Text(
                      'Notif',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding:
                      const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                  child: Icon(Icons.edit, color: kWhite, size: 18),
                ),
              ],
            ),
            ...filteredServices.asMap().entries.map((entry) {
              final index = entry.key + 1;
              final service = entry.value;
              final bool isEven = index.isEven;
              final bool isNotificationActive =
                  service['isNotification'] != false;

              return TableRow(
                decoration: BoxDecoration(
                  color: isEven ? Colors.grey[100] : Colors.white,
                ),
                children: [
                  _buildTableCell(index.toString()), // Serial Number
                  _buildTableCell(service['serviceName'] ?? 'Unknown'),

                  _buildTableCell(
                    service['type'] == 'day'
                        ? (service['defaultNotificationValue']?.toString() ??
                                '') +
                            ' (Day)'
                        : (service['defaultNotificationValue']?.toString() ??
                                '') +
                            ' (' +
                            (service['type'] == 'reading'
                                ? 'Miles'
                                : service['type'] == 'hours'
                                    ? 'Hours'
                                    : '') +
                            ')',
                  ),

                  TableCell(
                    verticalAlignment: TableCellVerticalAlignment.middle,
                    child: Center(
                      child: SizedBox(
                        height: 28,
                        child: FittedBox(
                          fit: BoxFit.contain,
                          child: Switch(
                            value: isNotificationActive,
                            activeColor: kSecondary,
                            onChanged: (val) {
                              _showNotificationToggleDialog(context, service,
                                  vehicleId, vehicleType, val);
                            },
                          ),
                        ),
                      ),
                    ),
                  ),

                  TableCell(
                    verticalAlignment: TableCellVerticalAlignment.middle,
                    child: Center(
                      child: (service['type'] == 'hours' ||
                              service['type'] == 'reading' ||
                              service['type'] == 'day')
                          ? IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.edit,
                                  color: kPrimary, size: 18),
                              onPressed: () {
                                _showEditDialog(
                                    context, service, vehicleId, vehicleType);
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

  Widget _buildTableHeader(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
      child: Text(
        text,
        maxLines: 1,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 14,
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

  void _showEditDialog(BuildContext context, Map<String, dynamic> service,
      String vehicleId, String vehicleType) {
    final TextEditingController controller = TextEditingController(
      text: service['defaultNotificationValue'].toString(),
    );
    String syncScope = "all";

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              title: Text(
                'Edit ${service['serviceName'] ?? 'Service'}',
                style: const TextStyle(
                    color: kPrimary, fontWeight: FontWeight.bold),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: controller,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText:
                            'Default Value (${service['type'] == 'reading' ? 'Miles' : service['type'] == 'hours' ? 'Hours' : 'Days'})',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: kPrimary, width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Update Option:',
                      style:
                          TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: syncScope == 'all'
                              ? kSecondary
                              : Colors.grey.shade300,
                          width: syncScope == 'all' ? 1.5 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: RadioListTile<String>(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 0),
                        title: Text(
                          'Apply to all ${vehicleType}s in fleet & sync team members',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          'Updates this service interval across all your ${vehicleType}s.',
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey.shade600),
                        ),
                        value: 'all',
                        groupValue: syncScope,
                        activeColor: kSecondary,
                        onChanged: (val) {
                          setDialogState(() {
                            syncScope = val ?? 'all';
                          });
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: syncScope == 'single'
                              ? kSecondary
                              : Colors.grey.shade300,
                          width: syncScope == 'single' ? 1.5 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: RadioListTile<String>(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 0),
                        title: Text(
                          'Apply only to this $vehicleType',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        value: 'single',
                        groupValue: syncScope,
                        activeColor: kSecondary,
                        onChanged: (val) {
                          setDialogState(() {
                            syncScope = val ?? 'single';
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: Text('Cancel',
                      style: appStyle(
                          16, Colors.grey.shade700, FontWeight.normal)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kSecondary,
                    foregroundColor: kWhite,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () async {
                    final newValue = int.tryParse(controller.text.trim());
                    if (newValue == null || newValue <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content:
                                Text('Please enter a valid positive number')),
                      );
                      return;
                    }

                    Navigator.pop(context);
                    await _saveServiceValue(
                        vehicleId, vehicleType, service, newValue, syncScope);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showNotificationToggleDialog(
      BuildContext context,
      Map<String, dynamic> service,
      String vehicleId,
      String vehicleType,
      bool targetState) {
    String syncScope = "all";

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              title: Text(
                targetState ? 'Enable Notification' : 'Disable Notification',
                style: const TextStyle(
                    color: kPrimary, fontWeight: FontWeight.bold),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service: ${service['serviceName'] ?? 'Service'}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: targetState
                            ? Colors.green.shade50
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: targetState
                              ? Colors.green.shade300
                              : Colors.grey.shade400,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Target Status:',
                              style: TextStyle(fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: targetState
                                  ? Colors.green.shade600
                                  : Colors.grey.shade600,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              targetState ? 'ON (Enabled)' : 'OFF (Disabled)',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Update Option:',
                      style:
                          TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: syncScope == 'all'
                              ? kSecondary
                              : Colors.grey.shade300,
                          width: syncScope == 'all' ? 1.5 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: RadioListTile<String>(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 0),
                        title: Text(
                          'Apply to all ${vehicleType}s in fleet & sync team members',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          'Sets notification status across all your ${vehicleType}s.',
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey.shade600),
                        ),
                        value: 'all',
                        groupValue: syncScope,
                        activeColor: kSecondary,
                        onChanged: (val) {
                          setDialogState(() {
                            syncScope = val ?? 'all';
                          });
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: syncScope == 'single'
                              ? kSecondary
                              : Colors.grey.shade300,
                          width: syncScope == 'single' ? 1.5 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: RadioListTile<String>(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 0),
                        title: Text(
                          'Apply only to this $vehicleType',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        value: 'single',
                        groupValue: syncScope,
                        activeColor: kSecondary,
                        onChanged: (val) {
                          setDialogState(() {
                            syncScope = val ?? 'single';
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: Text('Cancel',
                      style: appStyle(
                          16, Colors.grey.shade700, FontWeight.normal)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kSecondary,
                    foregroundColor: kWhite,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () async {
                    Navigator.pop(context);
                    await _saveNotificationToggle(vehicleId, vehicleType,
                        service, targetState, syncScope);
                  },
                  child: const Text('Confirm & Update'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<String> _getEffectiveOwnerId() async {
    String ownerId = widget.currentUId;
    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.currentUId)
          .get();
      if (userDoc.exists) {
        final data = userDoc.data();
        if (data?['role'] == 'SubOwner' && data?['createdBy'] != null) {
          ownerId = data!['createdBy'];
        } else if (data?['isTeamMember'] == true &&
            data?['createdBy'] != null) {
          ownerId = data!['createdBy'];
        }
      }
    } catch (e) {
      log('Error getting owner id: $e');
    }
    return ownerId;
  }

  Map<String, dynamic> _calculateUpdatedService(
    Map<String, dynamic> currentService,
    int newValueNum,
    int vehicleCurrentReading,
  ) {
    dynamic currentDefault = currentService['defaultNotificationValue'];
    dynamic currentNext = currentService['nextNotificationValue'];
    dynamic type = currentService['type'];

    int currentDefaultInt = int.tryParse(currentDefault.toString()) ?? 0;
    dynamic newNextValue;

    if (type == 'day') {
      if (currentNext is String && _isDateString(currentNext)) {
        DateTime currentNextDate = _parseDateString(currentNext);
        int daysDelta = newValueNum - currentDefaultInt;
        DateTime newNextDate = currentNextDate.add(Duration(days: daysDelta));
        newNextValue = _formatDateToString(newNextDate);
      } else {
        DateTime baseDate = DateTime.now();
        DateTime newNextDate = baseDate.add(Duration(days: newValueNum));
        newNextValue = _formatDateToString(newNextDate);
      }
    } else {
      int currentNextInt = int.tryParse(currentNext.toString()) ?? 0;
      if (currentNextInt > 0 && currentDefaultInt > 0) {
        int delta = newValueNum - currentDefaultInt;
        newNextValue = currentNextInt + delta;
        if (newNextValue < newValueNum) {
          newNextValue = newValueNum;
        }
      } else {
        newNextValue = vehicleCurrentReading + newValueNum;
      }
    }

    Map<String, dynamic> updated = Map<String, dynamic>.from(currentService);
    updated['defaultNotificationValue'] = newValueNum;
    updated['nextNotificationValue'] = newNextValue;
    updated['preValue'] = currentDefaultInt;
    updated['isNotification'] = currentService['isNotification'] != false;
    return updated;
  }

  List<dynamic> _getUpdatedServicesList(
    List<dynamic> existingList,
    Map<String, dynamic> targetService,
    int newValueNum,
    int vehicleCurrentReading,
  ) {
    return existingList.map((item) {
      final s = Map<String, dynamic>.from(item);
      final isTarget = (s['serviceId'] != null &&
              s['serviceId'] == targetService['serviceId']) ||
          (s['sId'] != null && s['sId'] == targetService['serviceId']) ||
          (s['serviceName']?.toString().toLowerCase() ==
              targetService['serviceName']?.toString().toLowerCase()) ||
          (s['sName']?.toString().toLowerCase() ==
              targetService['serviceName']?.toString().toLowerCase());

      if (!isTarget) return s;
      return _calculateUpdatedService(s, newValueNum, vehicleCurrentReading);
    }).toList();
  }

  List<dynamic> _getNotificationToggledList(
    List<dynamic> existingList,
    Map<String, dynamic> targetService,
    bool newNotificationState,
  ) {
    return existingList.map((item) {
      final s = Map<String, dynamic>.from(item);
      final isTarget = (s['serviceId'] != null &&
              s['serviceId'] == targetService['serviceId']) ||
          (s['sId'] != null && s['sId'] == targetService['serviceId']) ||
          (s['serviceName']?.toString().toLowerCase() ==
              targetService['serviceName']?.toString().toLowerCase()) ||
          (s['sName']?.toString().toLowerCase() ==
              targetService['serviceName']?.toString().toLowerCase());

      if (!isTarget) return s;
      s['isNotification'] = newNotificationState;
      return s;
    }).toList();
  }

  Future<void> _saveServiceValue(
    String vehicleId,
    String vehicleType,
    Map<String, dynamic> service,
    int newValueNum,
    String syncScope,
  ) async {
    setState(() {
      isLoading = true;
    });

    try {
      final ownerId = await _getEffectiveOwnerId();
      final batch = FirebaseFirestore.instance.batch();

      List<Map<String, dynamic>> targetVehicles = [];

      if (syncScope == 'all') {
        final fleetSnap = await FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .where('active', isEqualTo: true)
            .get();

        targetVehicles = fleetSnap.docs
            .where((d) =>
                (d.data()['vehicleType'] ?? 'Truck').toString().toLowerCase() ==
                vehicleType.toLowerCase())
            .map((d) => {
                  'id': d.id,
                  'currentMiles': d.data()['currentMiles'],
                  'hoursReading': d.data()['hoursReading'],
                  'services': d.data()['services'] ?? [],
                  'nextNotificationMiles':
                      d.data()['nextNotificationMiles'] ?? [],
                })
            .toList();
      } else {
        final vehDoc = await FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .doc(vehicleId)
            .get();

        if (vehDoc.exists) {
          targetVehicles = [
            {
              'id': vehicleId,
              'currentMiles': vehDoc.data()?['currentMiles'],
              'hoursReading': vehDoc.data()?['hoursReading'],
              'services': vehDoc.data()?['services'] ?? [],
              'nextNotificationMiles':
                  vehDoc.data()?['nextNotificationMiles'] ?? [],
            }
          ];
        }
      }

      // Fetch team members
      final teamMembersSnap = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: ownerId)
          .where('isTeamMember', isEqualTo: true)
          .get();
      final memberIds = teamMembersSnap.docs.map((d) => d.id).toList();

      final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

      for (var veh in targetVehicles) {
        final vehId = veh['id'] as String;
        final isTrailer = vehicleType.toLowerCase() == 'trailer';
        final reading = isTrailer
            ? int.tryParse(veh['hoursReading']?.toString() ?? '0') ?? 0
            : int.tryParse(veh['currentMiles']?.toString() ?? '0') ?? 0;

        final updatedServices = _getUpdatedServicesList(
            veh['services'] as List<dynamic>, service, newValueNum, reading);

        final updateData = <String, dynamic>{
          'services': updatedServices,
          'updatedAt': todayStr,
        };

        if (veh['nextNotificationMiles'] != null &&
            (veh['nextNotificationMiles'] as List).isNotEmpty) {
          updateData['nextNotificationMiles'] = _getUpdatedServicesList(
              veh['nextNotificationMiles'] as List<dynamic>,
              service,
              newValueNum,
              reading);
        }

        final ownerVehRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .doc(vehId);
        batch.update(ownerVehRef, updateData);

        for (var memberId in memberIds) {
          final memberVehRef = FirebaseFirestore.instance
              .collection('Users')
              .doc(memberId)
              .collection('Vehicles')
              .doc(vehId);
          final memberDocSnap = await memberVehRef.get();
          if (memberDocSnap.exists) {
            final memberData = memberDocSnap.data() as Map<String, dynamic>;
            final memberUpdateData = <String, dynamic>{
              'services': updatedServices,
              'updatedAt': todayStr,
            };
            if (memberData['nextNotificationMiles'] != null &&
                (memberData['nextNotificationMiles'] as List).isNotEmpty) {
              memberUpdateData['nextNotificationMiles'] =
                  _getUpdatedServicesList(
                      memberData['nextNotificationMiles'] as List<dynamic>,
                      service,
                      newValueNum,
                      reading);
            }
            batch.update(memberVehRef, memberUpdateData);
          }
        }
      }

      await batch.commit();

      if (syncScope == 'all') {
        showToastMessage(
            "Success",
            'Updated "${service['serviceName']}" across all ${targetVehicles.length} $vehicleType(s)!',
            kSecondary);
      } else {
        showToastMessage(
            "Success", 'Service value updated successfully!', kSecondary);
      }
    } catch (e) {
      log('Error saving service value: $e');
      showToastMessage(
          "Error", "Failed to update service value: $e", Colors.red);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _saveNotificationToggle(
    String vehicleId,
    String vehicleType,
    Map<String, dynamic> service,
    bool targetNotificationState,
    String syncScope,
  ) async {
    setState(() {
      isLoading = true;
    });

    try {
      final ownerId = await _getEffectiveOwnerId();
      final batch = FirebaseFirestore.instance.batch();

      List<Map<String, dynamic>> targetVehicles = [];

      if (syncScope == 'all') {
        final fleetSnap = await FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .where('active', isEqualTo: true)
            .get();

        targetVehicles = fleetSnap.docs
            .where((d) =>
                (d.data()['vehicleType'] ?? 'Truck').toString().toLowerCase() ==
                vehicleType.toLowerCase())
            .map((d) => {
                  'id': d.id,
                  'services': d.data()['services'] ?? [],
                  'nextNotificationMiles':
                      d.data()['nextNotificationMiles'] ?? [],
                })
            .toList();
      } else {
        final vehDoc = await FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .doc(vehicleId)
            .get();

        if (vehDoc.exists) {
          targetVehicles = [
            {
              'id': vehicleId,
              'services': vehDoc.data()?['services'] ?? [],
              'nextNotificationMiles':
                  vehDoc.data()?['nextNotificationMiles'] ?? [],
            }
          ];
        }
      }

      // Fetch team members
      final teamMembersSnap = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: ownerId)
          .where('isTeamMember', isEqualTo: true)
          .get();
      final memberIds = teamMembersSnap.docs.map((d) => d.id).toList();

      final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

      for (var veh in targetVehicles) {
        final vehId = veh['id'] as String;

        final updatedServices = _getNotificationToggledList(
            veh['services'] as List<dynamic>, service, targetNotificationState);

        final updateData = <String, dynamic>{
          'services': updatedServices,
          'updatedAt': todayStr,
        };

        if (veh['nextNotificationMiles'] != null &&
            (veh['nextNotificationMiles'] as List).isNotEmpty) {
          updateData['nextNotificationMiles'] = _getNotificationToggledList(
              veh['nextNotificationMiles'] as List<dynamic>,
              service,
              targetNotificationState);
        }

        final ownerVehRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(ownerId)
            .collection('Vehicles')
            .doc(vehId);
        batch.update(ownerVehRef, updateData);

        for (var memberId in memberIds) {
          final memberVehRef = FirebaseFirestore.instance
              .collection('Users')
              .doc(memberId)
              .collection('Vehicles')
              .doc(vehId);
          final memberDocSnap = await memberVehRef.get();
          if (memberDocSnap.exists) {
            final memberData = memberDocSnap.data() as Map<String, dynamic>;
            final memberUpdateData = <String, dynamic>{
              'services': updatedServices,
              'updatedAt': todayStr,
            };
            if (memberData['nextNotificationMiles'] != null &&
                (memberData['nextNotificationMiles'] as List).isNotEmpty) {
              memberUpdateData['nextNotificationMiles'] =
                  _getNotificationToggledList(
                      memberData['nextNotificationMiles'] as List<dynamic>,
                      service,
                      targetNotificationState);
            }
            batch.update(memberVehRef, memberUpdateData);
          }
        }
      }

      await batch.commit();

      final statusText = targetNotificationState ? 'ON' : 'OFF';
      if (syncScope == 'all') {
        showToastMessage(
            "Success",
            'Notification turned $statusText for "${service['serviceName']}" across all ${targetVehicles.length} $vehicleType(s)!',
            kSecondary);
      } else {
        showToastMessage(
            "Success",
            'Notification turned $statusText for "${service['serviceName']}"!',
            kSecondary);
      }
    } catch (e) {
      log('Error saving notification toggle: $e');
      showToastMessage(
          "Error", "Failed to update notification: $e", Colors.red);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

// Helper function to check if a string is a date in the expected format
  bool _isDateString(String value) {
    try {
      final parts = value.split('/');
      if (parts.length == 3) {
        final day = int.tryParse(parts[0]);
        final month = int.tryParse(parts[1]);
        final year = int.tryParse(parts[2]);
        return day != null && month != null && year != null;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

// Helper function to parse date string (dd/MM/yyyy)
  DateTime _parseDateString(String dateString) {
    final parts = dateString.split('/');
    final day = int.parse(parts[0]);
    final month = int.parse(parts[1]);
    final year = int.parse(parts[2]);
    return DateTime(year, month, day);
  }

// Helper function to format DateTime to string (dd/MM/yyyy)
  String _formatDateToString(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
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
