import 'dart:developer';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:http/http.dart' as http;
import 'package:firebase_storage/firebase_storage.dart';

class TripDetailsScreen extends StatefulWidget {
  const TripDetailsScreen({
    super.key,
    required this.docId,
    required this.tripName,
    required this.userId,
  });

  final String docId;
  final String tripName;
  final String userId;

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  final GlobalKey _globalKey = GlobalKey();
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  bool _isEditing = false;
  String? _editingDocId;
  TextEditingController _amountController = TextEditingController();
  TextEditingController _descriptionController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  Future<String> _uploadImage(File image) async {
    String fileName =
        "trip_images/${DateTime.now().millisecondsSinceEpoch}.jpg";
    Reference ref = FirebaseStorage.instance.ref().child(fileName);
    UploadTask uploadTask = ref.putFile(image);
    TaskSnapshot taskSnapshot = await uploadTask;
    return await taskSnapshot.ref.getDownloadURL();
  }

  Future<void> _updateTripDetail(String docId) async {
    if (_amountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Amount cannot be empty")),
      );
      return;
    }

    try {
      String? imageUrl;
      if (_selectedImage != null) {
        imageUrl = await _uploadImage(_selectedImage!);
      }

      await FirebaseFirestore.instance
          .collection("Users")
          .doc(widget.userId)
          .collection('trips')
          .doc(widget.docId)
          .collection('tripDetails')
          .doc(docId)
          .update({
        'amount': double.parse(_amountController.text),
        'description': _descriptionController.text,
        if (imageUrl != null) 'imageUrl': imageUrl,
        'updatedAt': Timestamp.now(),
      });

      // // Also update in the global trips collection if needed
      // await FirebaseFirestore.instance
      //     .collection('trips')
      //     .doc(widget.docId)
      //     .collection('tripDetails')
      //     .doc(docId)
      //     .update({
      //   'amount': double.parse(_amountController.text),
      //   'description': _descriptionController.text,
      //   if (imageUrl != null) 'imageUrl': imageUrl,
      //   'updatedAt': Timestamp.now(),
      // });

      setState(() {
        _isEditing = false;
        _editingDocId = null;
        _selectedImage = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Trip detail updated successfully")),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error updating trip detail: $e")),
      );
      log(e.toString());
    }
  }

  void _startEditing(DocumentSnapshot doc) {
    setState(() {
      _isEditing = true;
      _editingDocId = doc.id;
      _amountController.text = doc['amount'].toString();
      _descriptionController.text = doc['description'] ?? '';
    });
  }

  void _cancelEditing() {
    setState(() {
      _isEditing = false;
      _editingDocId = null;
      _selectedImage = null;
      _amountController.clear();
      _descriptionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text('Trip Details', style: appStyle(18, kWhite, FontWeight.w500)),
        backgroundColor: kPrimary,
        iconTheme: IconThemeData(color: kWhite),
        actions: [
          if (_isEditing)
            IconButton(
              icon: Icon(Icons.close, color: kWhite),
              onPressed: _cancelEditing,
            ),
        ],
      ),
      body: RepaintBoundary(
        key: _globalKey,
        child: StreamBuilder(
          stream: FirebaseFirestore.instance
              .collection("Users")
              .doc(widget.userId)
              .collection('trips')
              .doc(widget.docId)
              .collection('tripDetails')
              .orderBy('createdAt', descending: true)
              .snapshots(),
          builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(child: CircularProgressIndicator());
            }

            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
              return Center(
                child: Text("No trip details found.",
                    style: TextStyle(fontSize: 18.sp, color: Colors.grey)),
              );
            }

            return ListView(
              padding: EdgeInsets.all(10),
              children: snapshot.data!.docs.map((doc) {
                String docId = doc.id;
                String description = doc['description'];
                String imageUrl = doc['imageUrl'];
                String type = doc['type'];
                num amount = doc['amount'];
                String formattedDate =
                    DateFormat('dd MMM yyyy').format(doc['createdAt'].toDate());

                // If this is the document being edited, show edit UI
                if (_isEditing && _editingDocId == docId) {
                  return Card(
                    elevation: 1,
                    margin: EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Editing ${type.toLowerCase()}",
                              style: TextStyle(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold)),
                          SizedBox(height: 15),

                          // Amount Field
                          TextFormField(
                            controller: _amountController,
                            keyboardType:
                                TextInputType.numberWithOptions(decimal: true),
                            decoration: InputDecoration(
                              labelText: 'Amount',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          SizedBox(height: 15),

                          // Description Field
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              labelText: 'Description',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          SizedBox(height: 15),

                          // Image Section
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Image",
                                  style: TextStyle(
                                      fontSize: 14.sp,
                                      fontWeight: FontWeight.bold)),
                              SizedBox(height: 8),
                              _selectedImage != null
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: Image.file(
                                        _selectedImage!,
                                        height: 150.h,
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  : imageUrl.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          child: Image.network(
                                            imageUrl,
                                            height: 150.h,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                          ),
                                        )
                                      : Container(
                                          height: 150.h,
                                          width: double.infinity,
                                          color: Colors.grey[200],
                                          child: Center(
                                            child: Text("No image available"),
                                          ),
                                        ),
                              SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: _pickImage,
                                child: Text("Change Image"),
                              ),
                            ],
                          ),
                          SizedBox(height: 15),

                          // Save Button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              ElevatedButton(
                                onPressed: () => _updateTripDetail(docId),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kPrimary,
                                  foregroundColor: kWhite,
                                ),
                                child: Text("Save Changes"),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Normal view (not editing)
                return Card(
                  elevation: 1,
                  margin: EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text("Type: $type",
                                style: TextStyle(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.bold)),
                            Spacer(),
                            Text("Date: $formattedDate",
                                style: TextStyle(
                                    fontSize: 12.sp, color: Colors.grey)),
                          ],
                        ),
                        SizedBox(height: 5),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Amount: \$${amount.toStringAsFixed(2)}",
                                style: TextStyle(
                                    fontSize: 16.sp, color: Colors.green)),
                            if (!_isEditing)
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(Icons.edit, color: kPrimary),
                                    onPressed: () => _startEditing(doc),
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.visibility,
                                        color: kSecondary),
                                    onPressed: () {
                                      if (imageUrl.isNotEmpty) {
                                        showDialog(
                                          context: context,
                                          builder: (context) {
                                            return Dialog(
                                              backgroundColor:
                                                  Colors.transparent,
                                              child: GestureDetector(
                                                onTap: () =>
                                                    Navigator.pop(context),
                                                child: InteractiveViewer(
                                                  child:
                                                      Image.network(imageUrl),
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      }
                                    },
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.print, color: kPrimary),
                                    onPressed: () async {
                                      await _generatePdfForDocument(
                                          imageUrl, description);
                                    },
                                  ),
                                ],
                              ),
                          ],
                        ),
                        SizedBox(height: 5),
                        Text("Description: $description",
                            style: TextStyle(fontSize: 14.sp)),
                        SizedBox(height: 10),
                        imageUrl.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  imageUrl,
                                  height: 150.h,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Container(),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _printScreen,
        child: Icon(Icons.print, color: kWhite),
        backgroundColor: kPrimary,
      ),
    );
  }

  // [Keep your existing _printScreen and _generatePdfForDocument methods]
  Future<void> _printScreen() async {
    try {
      RenderRepaintBoundary boundary = _globalKey.currentContext!
          .findRenderObject() as RenderRepaintBoundary;
      var image = await boundary.toImage();
      ByteData? byteData = await image.toByteData(format: ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          build: (pw.Context context) {
            return pw.Center(
              child: pw.Image(pw.MemoryImage(pngBytes)),
            );
          },
        ),
      );

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      print('Error capturing screen: $e');
    }
  }

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

      // Add page with cropped image and text
      if (imageBytes != null) {
        pdf.addPage(
          pw.Page(
            build: (pw.Context context) {
              return pw.Stack(
                children: [
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
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Container(
                          height: 500,
                          width: double.infinity,
                          child: pw.Center(
                            child: pw.ClipRect(
                              child: pw.Image(
                                pw.MemoryImage(imageBytes!),
                                fit: pw.BoxFit.contain,
                              ),
                            ),
                          )),
                      pw.SizedBox(height: 20),
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

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e, stackTrace) {
      print('Error generating PDF: $e');
      print(stackTrace);
    }
  }
}



// import 'dart:ui';

// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/foundation.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter/rendering.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:intl/intl.dart';
// import 'package:pdf/pdf.dart';
// import 'package:printing/printing.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:pdf/widgets.dart' as pw;
// import 'package:http/http.dart' as http;

// class TripDetailsScreen extends StatefulWidget {
//   const TripDetailsScreen(
//       {super.key,
//       required this.docId,
//       required this.tripName,
//       required this.userId});

//   final String docId;
//   final String tripName;
//   final String userId;

//   @override
//   State<TripDetailsScreen> createState() => _TripDetailsScreenState();
// }

// class _TripDetailsScreenState extends State<TripDetailsScreen> {

//   final GlobalKey _globalKey = GlobalKey();

  
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title:
//             Text('Trip Details', style: appStyle(18, kWhite, FontWeight.w500)),
//         backgroundColor: kPrimary,
//         iconTheme: IconThemeData(color: kWhite),
//       ),
//       body: RepaintBoundary(
//         key: _globalKey,
//         child: StreamBuilder(
//           stream: FirebaseFirestore.instance
//               .collection("Users")
//               .doc(widget.userId)
//               .collection('trips')
//               .doc(widget.docId)
//               .collection('tripDetails')
//               .snapshots(),
//           builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
//             if (snapshot.connectionState == ConnectionState.waiting) {
//               return Center(child: CircularProgressIndicator());
//             }
        
//             if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
//               return Center(
//                   child: Text("No trip details found.",
//                       style: TextStyle(fontSize: 18.sp, color: Colors.grey)));
//             }
        
//             return ListView(
//               padding: EdgeInsets.all(10),
//               children: snapshot.data!.docs.map((doc) {
//                 String tripId = doc['tripId'];
//                 String description = doc['description'];
//                 String imageUrl = doc['imageUrl'];
//                 String type = doc['type'];
//                 num amount = doc['amount'];
//                 String formattedDate =
//                     DateFormat('dd MMM yyyy').format(doc['createdAt'].toDate());
        
//                 return Card(
//                   elevation: 1,
//                   margin: EdgeInsets.symmetric(vertical: 10),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(15),
//                   ),
//                   child: Padding(
//                     padding: EdgeInsets.all(16),
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         Row(
//                           children: [
//                             Text("Type: $type",
//                                 style: TextStyle(
//                                     fontSize: 16.sp,
//                                     fontWeight: FontWeight.bold)),
//                             Spacer(),
//                             Text("Date: $formattedDate",
//                                 style: TextStyle(
//                                     fontSize: 12.sp, color: Colors.grey)),
//                           ],
//                         ),
//                         SizedBox(height: 5),
        
//                         Row(
//                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                           children: [
//                             Text("Amount: \$${amount.toStringAsFixed(2)}",
//                                 style:
//                                     TextStyle(fontSize: 16.sp, color: Colors.green)),
        
//                             Row(
//                               children: [
//                                 IconButton(
//                                   icon: Icon(Icons.visibility, color: kSecondary),
        
//                                   onPressed: () {
//                                     if (imageUrl.isNotEmpty) {
//                                       showDialog(
//                                         context: context,
//                                         builder: (context) {
//                                           return Dialog(
//                                             backgroundColor: Colors.transparent,
//                                             child: GestureDetector(
//                                               onTap: () => Navigator.pop(context),
//                                               child: InteractiveViewer(
//                                                 child: Image.network(imageUrl),
//                                               ),
//                                             ),
//                                           );
//                                         },
//                                       );
//                                     }
//                                   },
//                                 ),
//                                 IconButton(
//                                   icon: Icon(Icons.print, color: kPrimary),
//                                   onPressed: () async {
//                                     await _generatePdfForDocument(imageUrl, "");
//                                   },
//                                 ),
//                               ],
//                             ),
//                           ],
//                         ),
//                         SizedBox(height: 5),
//                         Text("Description: $description",
//                             style: TextStyle(fontSize: 14.sp)),
//                         SizedBox(height: 10),
//                         imageUrl.isNotEmpty
//                             ? ClipRRect(
//                                 borderRadius: BorderRadius.circular(10),
//                                 child: Image.network(imageUrl,
//                                     height: 150.h,
//                                     width: double.infinity,
//                                     fit: BoxFit.cover),
//                               )
//                             : Container(),
//                       ],
//                     ),
//                   ),
//                 );
//               }).toList(),
//             );
//           },
//         ),
//       ),
//       floatingActionButton: FloatingActionButton(
//         onPressed: _printScreen, // Call function to print screen
//         child: Icon(Icons.print,color: kWhite),
//         backgroundColor: kPrimary,
//       ),
//     );
//   }


//   Future<void> _printScreen() async {
//     try {
//       RenderRepaintBoundary boundary = _globalKey.currentContext!
//           .findRenderObject() as RenderRepaintBoundary;
//       var image = await boundary.toImage();
//       ByteData? byteData = await image.toByteData(format: ImageByteFormat.png);
//       Uint8List pngBytes = byteData!.buffer.asUint8List();

//       final pdf = pw.Document();

//       pdf.addPage(
//         pw.Page(
//           build: (pw.Context context) {
//             return pw.Center(
//               child: pw.Image(pw.MemoryImage(pngBytes)),
//             );
//           },
//         ),
//       );

//       await Printing.layoutPdf(
//         onLayout: (PdfPageFormat format) async => pdf.save(),
//       );
//     } catch (e) {
//       print('Error capturing screen: $e');
//     }
//   }

//   //generate pdf for image
//   Future<void> _generatePdfForDocument(String? imageUrl, String? text) async {
//     try {
//       final pdf = pw.Document();

//       // Download the image
//       Uint8List? imageBytes;
//       if (imageUrl != null) {
//         try {
//           final response = await http.get(Uri.parse(imageUrl));
//           if (response.statusCode == 200) {
//             imageBytes = response.bodyBytes;
//           }
//         } catch (e) {
//           print('Error downloading image: $e');
//         }
//       }

//       // Debugging logs
//       print('Image Bytes: ${imageBytes?.length ?? 0}');
//       print('Text: ${text ?? 'No description provided'}');

//       // Add page with cropped image and text
//       if (imageBytes != null) {
//         pdf.addPage(
//           pw.Page(
//             build: (pw.Context context) {
//               return pw.Stack(
//                 children: [
//                   // Watermark in the background
//                   pw.Center(
//                     child: pw.Opacity(
//                       opacity: 0.1,
//                       child: pw.Text(
//                         'Rabbit Mechanic',
//                         style: pw.TextStyle(
//                           fontSize: 80,
//                           fontWeight: pw.FontWeight.bold,
//                           color: PdfColors.grey,
//                         ),
//                         textAlign: pw.TextAlign.center,
//                       ),
//                     ),
//                   ),
//                   // Main content
//                   pw.Column(
//                     crossAxisAlignment: pw.CrossAxisAlignment.start,
//                     children: [
//                       // Cropped image
//                       pw.Container(
//                           height: 500,
//                           width: double.infinity, // Make it full width
//                           child: pw.Center(
//                             child: pw.ClipRect(
//                               child: pw.Image(
//                                 pw.MemoryImage(imageBytes!),
//                                 fit: pw.BoxFit.contain, // Crop the image
//                               ),
//                             ),
//                           )),
//                       pw.SizedBox(height: 20),
//                       // Text description
//                       pw.Text(
//                         text?.trim().isNotEmpty == true
//                             ? text!
//                             : 'No description provided',
//                         style: pw.TextStyle(fontSize: 14),
//                       ),
//                     ],
//                   ),
//                 ],
//               );
//             },
//           ),
//         );
//       } else {
//         // Error handling if image cannot be loaded
//         pdf.addPage(
//           pw.Page(
//             build: (pw.Context context) {
//               return pw.Center(
//                 child: pw.Text(
//                   'Image could not be loaded.',
//                   style: pw.TextStyle(fontSize: 18, color: PdfColors.red),
//                 ),
//               );
//             },
//           ),
//         );
//       }

//       // Show PDF preview and allow download
//       await Printing.layoutPdf(
//         onLayout: (PdfPageFormat format) async => pdf.save(),
//       );
//     } catch (e, stackTrace) {
//       print('Error generating PDF: $e');
//       print(stackTrace);
//     }
//   }
// }
