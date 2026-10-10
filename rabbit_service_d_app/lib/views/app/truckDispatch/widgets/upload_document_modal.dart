import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/truck_disptach_screen.dart';

class ComplianceDocumentType {
  final String key;
  final String label;
  final String description;
  final IconData icon;
  final Color color;

  const ComplianceDocumentType({
    required this.key,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
  });
}

const List<ComplianceDocumentType> kComplianceDocumentTypes = [
  ComplianceDocumentType(
    key: 'bol',
    label: 'Bill of Lading (BOL)',
    description: 'Signed pickup or delivery BOL document',
    icon: Icons.article_outlined,
    color: Color(0xFF4F46E5), // Indigo
  ),
  ComplianceDocumentType(
    key: 'pod',
    label: 'Proof of Delivery (POD)',
    description: 'Signed delivery receipt / consignee stamp',
    icon: Icons.local_shipping_outlined,
    color: Color(0xFF10B981), // Emerald Green
  ),
  ComplianceDocumentType(
    key: 'damage-photos',
    label: 'Damage Photos',
    description: 'Cargo damage, seal issues, or truck inspection',
    icon: Icons.camera_alt_outlined,
    color: Color(0xFFF59E0B), // Amber
  ),
  ComplianceDocumentType(
    key: 'scale-ticket',
    label: 'Scale Ticket',
    description: 'Weight ticket (Gross, Tare, Net)',
    icon: Icons.scale_outlined,
    color: Color(0xFF8B5CF6), // Purple
  ),
  ComplianceDocumentType(
    key: 'lumper',
    label: 'Lumper Receipt',
    description: 'Loading / Unloading payment receipt',
    icon: Icons.receipt_long_outlined,
    color: Color(0xFF06B6D4), // Cyan
  ),
  ComplianceDocumentType(
    key: 'rate-confirmation',
    label: 'Rate Confirmation',
    description: 'Rate con & broker confirmation',
    icon: Icons.request_quote_outlined,
    color: Color(0xFF2563EB), // Blue
  ),
  ComplianceDocumentType(
    key: 'other',
    label: 'Other Attachment',
    description: 'Toll receipts, permits, or misc files',
    icon: Icons.folder_open_outlined,
    color: Color(0xFF64748B), // Slate
  ),
];

class UploadDocumentModal extends StatefulWidget {
  final LoadData load;
  final VoidCallback? onUploaded;

  const UploadDocumentModal({
    super.key,
    required this.load,
    this.onUploaded,
  });

  static Future<void> show(
    BuildContext context, {
    required LoadData load,
    VoidCallback? onUploaded,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UploadDocumentModal(
        load: load,
        onUploaded: onUploaded,
      ),
    );
  }

  @override
  State<UploadDocumentModal> createState() => _UploadDocumentModalState();
}

class _UploadDocumentModalState extends State<UploadDocumentModal> {
  String _selectedTypeKey = 'bol';
  bool _isUploading = false;
  String _uploadStatusText = '';
  final String _currentUId = FirebaseAuth.instance.currentUser?.uid ?? '';
  final ImagePicker _imagePicker = ImagePicker();

  ComplianceDocumentType get _selectedDocType {
    return kComplianceDocumentTypes.firstWhere(
      (type) => type.key == _selectedTypeKey,
      orElse: () => kComplianceDocumentTypes.first,
    );
  }

  Future<void> _pickFromCamera() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (photo == null) return;

      await _uploadFiles([
        _UploadItem(
          file: File(photo.path),
          name: photo.name,
          extension: photo.name.split('.').last,
          size: await photo.length(),
        )
      ]);
    } catch (e) {
      _showError('Failed to capture image: $e');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final List<XFile> images = await _imagePicker.pickMultiImage(
        imageQuality: 85,
      );
      if (images.isEmpty) return;

      final List<_UploadItem> items = [];
      for (final img in images) {
        items.add(_UploadItem(
          file: File(img.path),
          name: img.name,
          extension: img.name.split('.').last,
          size: await img.length(),
        ));
      }

      await _uploadFiles(items);
    } catch (e) {
      _showError('Failed to select photos: $e');
    }
  }

  Future<void> _pickFiles() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: [
          'pdf',
          'jpg',
          'jpeg',
          'png',
          'doc',
          'docx',
          'xls',
          'xlsx'
        ],
        allowMultiple: true,
      );

      if (result == null || result.files.isEmpty) return;

      final List<_UploadItem> items = [];
      for (final f in result.files) {
        if (f.path != null) {
          items.add(_UploadItem(
            file: File(f.path!),
            name: f.name,
            extension: f.extension ?? f.name.split('.').last,
            size: f.size,
          ));
        }
      }

      if (items.isNotEmpty) {
        await _uploadFiles(items);
      }
    } catch (e) {
      _showError('Failed to select files: $e');
    }
  }

  Future<void> _uploadFiles(List<_UploadItem> items) async {
    if (items.isEmpty) return;

    setState(() {
      _isUploading = true;
      _uploadStatusText = 'Uploading ${items.length} document(s)...';
    });

    try {
      final loadRef = FirebaseFirestore.instance
          .collection('dispatch_loads')
          .doc(widget.load.id);

      final snapshot = await loadRef.get();
      final existingDocs = List<Map<String, dynamic>>.from(
        snapshot.data()?['documents'] ?? [],
      );

      int count = 0;
      for (final item in items) {
        count++;
        setState(() {
          _uploadStatusText =
              'Uploading ($count/${items.length}): ${item.name}';
        });

        final safeName = item.name.replaceAll(RegExp(r'[^\w\.-]'), '_');
        final storagePath =
            'dispatch-loads/${widget.load.id}/driver-uploads/${DateTime.now().millisecondsSinceEpoch}_$safeName';

        final storageRef = FirebaseStorage.instance.ref().child(storagePath);
        await storageRef.putFile(item.file);
        final downloadUrl = await storageRef.getDownloadURL();

        existingDocs.add({
          'id': 'driver-${DateTime.now().microsecondsSinceEpoch}',
          'name': item.name,
          'type': _selectedTypeKey,
          'size': item.size,
          'url': downloadUrl,
          'mimeType': item.extension,
          'source': 'uploaded',
          'storagePath': storagePath,
          'createdAt': Timestamp.now(),
          'uploadedByRole': 'driver',
          'uploadedById': _currentUId,
          'uploadedByName': widget.load.driverName,
        });
      }

      await loadRef.update({
        'documents': existingDocs,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      await loadRef.collection('history').add({
        'action': 'driver-uploaded-documents',
        'message':
            'Driver uploaded ${items.length} ${_selectedDocType.label} document(s)',
        'createdBy': _currentUId,
        'createdAt': FieldValue.serverTimestamp(),
        'metadata': {
          'documentType': _selectedTypeKey,
          'count': items.length.toString(),
          'driverId': _currentUId,
          'driverName': widget.load.driverName,
          'loadNumber': widget.load.loadNumber,
        },
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_outline,
                  color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '${items.length} ${_selectedDocType.label} uploaded successfully!',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );

      widget.onUploaded?.call();
      Navigator.of(context).pop();
    } catch (e) {
      _showError('Upload failed: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _uploadStatusText = '';
        });
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: kPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.cloud_upload_outlined,
                  color: kPrimary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Upload Document',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: kDark,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Load #${widget.load.loadNumber} • ${widget.load.company}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _isUploading ? null : () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Section 1: Choose Document Type
          const Text(
            'SELECT DOCUMENT CATEGORY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Colors.grey,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),

          // Document Category Chips / Grid
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: kComplianceDocumentTypes.map((type) {
              final isSelected = type.key == _selectedTypeKey;
              return InkWell(
                onTap: _isUploading
                    ? null
                    : () {
                        setState(() => _selectedTypeKey = type.key);
                      },
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? type.color.withOpacity(0.12)
                        : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? type.color : Colors.grey.shade200,
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        type.icon,
                        size: 16,
                        color: isSelected ? type.color : Colors.grey.shade600,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        type.label,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? type.color : Colors.grey.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Selected Type info box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _selectedDocType.color.withOpacity(0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _selectedDocType.color.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 15,
                  color: _selectedDocType.color,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _selectedDocType.description,
                    style: TextStyle(
                      fontSize: 11,
                      color: _selectedDocType.color.withOpacity(0.9),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),

          // Section 2: Choose Upload Method
          if (_isUploading)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const LinearProgressIndicator(
                    color: kPrimary,
                    backgroundColor: Colors.white,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _uploadStatusText,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: kDark,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Please wait while your files are being uploaded securely...',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                ],
              ),
            )
          else ...[
            const Text(
              'SELECT INPUT METHOD',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Colors.grey,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                // Camera Button
                Expanded(
                  child: _buildUploadMethodCard(
                    icon: Icons.camera_alt_rounded,
                    title: 'Camera',
                    subtitle: 'Take photo',
                    color: const Color(0xFF10B981),
                    onTap: _pickFromCamera,
                  ),
                ),
                const SizedBox(width: 10),

                // Gallery Button
                Expanded(
                  child: _buildUploadMethodCard(
                    icon: Icons.photo_library_rounded,
                    title: 'Gallery',
                    subtitle: 'Photos/Images',
                    color: const Color(0xFF3B82F6),
                    onTap: _pickFromGallery,
                  ),
                ),
                const SizedBox(width: 10),

                // Files / PDF Button
                Expanded(
                  child: _buildUploadMethodCard(
                    icon: Icons.attach_file_rounded,
                    title: 'Files',
                    subtitle: 'PDF / Docs',
                    color: const Color(0xFF8B5CF6),
                    onTap: _pickFiles,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUploadMethodCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: kDark,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[500],
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _UploadItem {
  final File file;
  final String name;
  final String extension;
  final int size;

  _UploadItem({
    required this.file,
    required this.name,
    required this.extension,
    required this.size,
  });
}
