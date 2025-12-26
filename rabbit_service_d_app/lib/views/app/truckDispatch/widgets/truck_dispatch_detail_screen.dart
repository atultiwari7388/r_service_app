import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/truck_disptach_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:file_picker/file_picker.dart'; // Add this to pubspec.yaml

class DispatchDetailsScreen extends StatefulWidget {
  final LoadData load;

  const DispatchDetailsScreen({super.key, required this.load});

  @override
  State<DispatchDetailsScreen> createState() => _DispatchDetailsScreenState();
}

class _DispatchDetailsScreenState extends State<DispatchDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, String>> _documents = [];
  List<Map<String, dynamic>> _notes = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);

    // Initialize with default documents
    _documents = [
      {
        'name': 'Rate Confirmation',
        'type': 'PDF',
        'size': '1.2 MB',
        'path': ''
      },
      {'name': 'Bill of Lading', 'type': 'PDF', 'size': '2.4 MB', 'path': ''},
      {'name': 'Insurance Cert', 'type': 'JPG', 'size': '3.1 MB', 'path': ''},
    ];

    // Initialize with default notes
    _notes = [
      {
        'title': 'Gate Code',
        'content':
            'The gate code for entry is #9921. Please call security if it does not work.',
        'time': 'Today, 9:00 AM',
        'date': DateTime.now(),
      },
      {
        'title': 'Handling Inst.',
        'content': 'Fragile contents. Do not double stack pallets.',
        'time': 'Yesterday',
        'date': DateTime.now().subtract(const Duration(days: 1)),
      },
    ];
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Opens the external map application (Google Maps or Apple Maps)
  Future<void> _openMap(String address) async {
    final query = Uri.encodeComponent(address);
    final googleMapsUrl =
        Uri.parse("https://www.google.com/maps/search/?api=1&query=$query");
    final appleMapsUrl = Uri.parse("https://maps.apple.com/?q=$query");

    try {
      if (await canLaunchUrl(googleMapsUrl)) {
        await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(appleMapsUrl)) {
        await launchUrl(appleMapsUrl, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open maps application')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error launching map: $e');
    }
  }

  /// Helper to decide which address to navigate to based on load status
  void _handleNavigationPress() {
    final fullAddress =
        "${widget.load.pickupAddress}, ${widget.load.pickupLocation}";
    _openMap(fullAddress);
  }

  /// Handle file selection
  Future<void> _browseFiles() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        allowMultiple: true,
      );

      if (result != null) {
        List<File> files = result.paths.map((path) => File(path!)).toList();

        // Convert files to document format
        List<Map<String, String>> newDocs = files.map((file) {
          String fileName = file.path.split('/').last;
          String fileExtension = fileName.split('.').last.toUpperCase();
          String fileSize = _formatFileSize(file.lengthSync());

          return {
            'name': fileName,
            'type': fileExtension,
            'size': fileSize,
            'path': file.path,
          };
        }).toList();

        setState(() {
          _documents.addAll(newDocs);
        });

        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${files.length} file(s) added successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error picking files: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error selecting files'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Format file size
  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1048576) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / 1048576).toStringAsFixed(1)} MB';
  }

  /// Show dialog to add new note
  Future<void> _showAddNoteDialog() async {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Add New Note'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    border: OutlineInputBorder(),
                  ),
                  maxLength: 50,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: contentController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  maxLines: 5,
                  maxLength: 500,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (titleController.text.trim().isNotEmpty &&
                    contentController.text.trim().isNotEmpty) {
                  _addNote(
                    titleController.text.trim(),
                    contentController.text.trim(),
                  );
                  Navigator.of(context).pop();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please fill in all fields'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  /// Add new note
  void _addNote(String title, String content) {
    final now = DateTime.now();
    final formattedTime = _formatDateTime(now);

    setState(() {
      _notes.insert(0, {
        'title': title,
        'content': content,
        'time': formattedTime,
        'date': now,
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Note added successfully'),
        backgroundColor: Colors.green,
      ),
    );
  }

  /// Format date time for display
  String _formatDateTime(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final noteDate = DateTime(date.year, date.month, date.day);

    if (noteDate == today) {
      return 'Today, ${_formatTime(date)}';
    } else if (noteDate == yesterday) {
      return 'Yesterday';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour % 12;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  /// Handle document download
  void _downloadDocument(Map<String, String> doc) {
    if (doc['path']?.isEmpty ?? true) {
      // For demo purposes - simulate download
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Downloading ${doc['name']}...'),
          backgroundColor: kPrimary,
        ),
      );
    } else {
      // In real app, you would implement actual file handling here
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Opening ${doc['name']}...'),
          backgroundColor: kPrimary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kLightWhite,
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 16, color: kDark),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        title: const Text(
          'Load Details',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: kDark,
            fontSize: 20,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: kPrimary,
              unselectedLabelColor: Colors.grey[500],
              indicatorColor: kPrimary,
              indicatorWeight: 3,
              labelStyle:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              unselectedLabelStyle:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Docs'),
                Tab(text: 'Info'),
                Tab(text: 'Notes'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDetailsTab(),
          _buildDocumentsTab(),
          _buildLoadInfoTab(),
          _buildNotesTab(),
        ],
      ),
    );
  }

  // --- TABS ---

  Widget _buildDetailsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.load.loadNumber,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: kDark,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.business,
                                size: 16, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              widget.load.company,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    _buildStatusChip(widget.load.status),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade200),
            ),
            clipBehavior: Clip.hardEdge,
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(
                      34.0522,
                      -118.2437,
                    ),
                    zoom: 6,
                  ),
                  markers: {
                    Marker(
                      markerId: const MarkerId('pickup'),
                      position: LatLng(
                        34.0522,
                        -118.2437,
                      ),
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueRed),
                    ),
                    Marker(
                      markerId: const MarkerId('drop'),
                      position: LatLng(
                        34.0522,
                        -118.2437,
                      ),
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueBlue),
                    ),
                  },
                  zoomGesturesEnabled: false,
                  scrollGesturesEnabled: false,
                  rotateGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  zoomControlsEnabled: false,
                  myLocationButtonEnabled: false,
                  mapToolbarEnabled: false,
                  compassEnabled: false,
                ),

                // 🔘 Open Navigation Button
                Center(
                  child: ElevatedButton.icon(
                    onPressed: _handleNavigationPress,
                    icon: const Icon(Icons.map, size: 18),
                    label: const Text('Open Navigation'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kDark,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                  ),
                ),

                // 🚗 Distance / Time chip
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.speed, size: 16, color: kPrimary),
                        const SizedBox(width: 6),
                        Text(
                          '${widget.load.miles} • ~14h 20m',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Route Timeline
          const Text(
            'Routes',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: kDark,
            ),
          ),
          const SizedBox(height: 16),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Column(
                  children: [
                    const Icon(Icons.circle, size: 16, color: kPrimary),
                    Expanded(
                      child: Container(
                        width: 2,
                        color: Colors.grey.shade200,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                      ),
                    ),
                    const Icon(Icons.location_on, size: 20, color: Colors.red),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTimelineItem(
                        title: 'PICKUP',
                        building: widget.load.pickupBuilding,
                        address: widget.load.pickupAddress,
                        location: widget.load.pickupLocation,
                        date: widget.load.pickupDate,
                        isStart: true,
                        onTap: () => _openMap(
                            "${widget.load.pickupAddress}, ${widget.load.pickupLocation}"),
                      ),
                      const SizedBox(height: 30),
                      _buildTimelineItem(
                        title: 'DROP-OFF',
                        building: widget.load.dropBuilding,
                        address: widget.load.dropAddress,
                        location: widget.load.dropLocation,
                        date: widget.load.dropDate,
                        isStart: false,
                        onTap: () => _openMap(
                            "${widget.load.dropAddress}, ${widget.load.dropLocation}"),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 30),
          const Divider(),
          const SizedBox(height: 20),

          // Contact
          const Text(
            'Contact Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: kDark,
            ),
          ),
          const SizedBox(height: 16),
          _buildContactTile(
              Icons.person_outline, 'Broker Contact', 'Michael Scott'),
          const SizedBox(height: 12),
          _buildContactTile(
              Icons.phone_outlined, 'Phone Number', '+1 (555) 019-2834'),
        ],
      ),
    );
  }

  Widget _buildDocumentsTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Upload Card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: Colors.grey.shade200, style: BorderStyle.none),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]),
          child: Column(
            children: [
              const Icon(Icons.cloud_upload_outlined,
                  size: 48, color: kPrimary),
              const SizedBox(height: 16),
              const Text(
                'Upload POD or Receipts',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Text(
                'Supports PDF, JPG, PNG, DOC',
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _browseFiles,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Browse Files'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Attached Files Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Attached Files',
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: kDark),
            ),
            if (_documents.isNotEmpty)
              Text(
                '${_documents.length} files',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),

        if (_documents.isEmpty)
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 1.5),
              color: Colors.grey.shade50,
            ),
            child: Column(
              children: [
                Icon(
                  Icons.folder_open,
                  size: 48,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No documents added yet',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Click "Browse Files" to add documents',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          )
        else
          ..._documents.asMap().entries.map((entry) {
            final doc = entry.value;
            final index = entry.key;
            final isUploadedByUser = doc['path']?.isNotEmpty ?? false;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade200),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _getFileTypeColor(doc['type'] ?? ''),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: _getFileTypeIcon(doc['type'] ?? ''),
                ),
                title: Text(
                  doc['name']!,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${doc['type']} • ${doc['size']}',
                  style: TextStyle(
                    color: Colors.grey[600],
                  ),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isUploadedByUser)
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'NEW',
                            style: TextStyle(
                              color: Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    IconButton(
                      icon: const Icon(Icons.download_rounded, color: kPrimary),
                      onPressed: () => _downloadDocument(doc),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildLoadInfoTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildInfoSection('Load Specs', [
          {'label': 'Weight', 'value': '42,500 lbs'},
          {'label': 'Commodity', 'value': 'General Freight'},
          {'label': 'Type', 'value': 'Full Truckload (FTL)'},
          {'label': 'Temp', 'value': 'Dry Van'},
        ]),
        const SizedBox(height: 20),
        _buildInfoSection('Equipment', [
          {'label': 'Truck ID', 'value': 'TRK-8821'},
          {'label': 'Trailer ID', 'value': 'TRL-5502'},
          {'label': 'Driver', 'value': 'James Anderson'},
        ]),
        const SizedBox(height: 20),
        _buildInfoSection('Financials', [
          {'label': 'Rate', 'value': '\$2,450.00'},
          {'label': 'Detention', 'value': '\$50/hr'},
          {'label': 'Lumper', 'value': 'Reimbursed'},
        ]),
      ],
    );
  }

  Widget _buildNotesTab() {
    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_notes.isEmpty)
              Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200, width: 1.5),
                  color: Colors.grey.shade50,
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.note_add,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No notes yet',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Click "Add New Note" to create your first note',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              )
            else
              ..._notes.map((note) => _buildNoteItem(
                    note['title'] as String,
                    note['content'] as String,
                    note['time'] as String,
                  )),
            const SizedBox(height: 80), // Space for the FAB
          ],
        ),
        Positioned(
          bottom: 20,
          left: 20,
          right: 20,
          child: ElevatedButton(
            onPressed: _showAddNoteDialog,
            style: ElevatedButton.styleFrom(
              backgroundColor: kDark,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text('Add New Note'),
          ),
        ),
      ],
    );
  }

  // --- HELPERS ---

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'active':
        color = kPrimary;
        break;
      case 'completed':
        color = Colors.green;
        break;
      default:
        color = Colors.orange;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildTimelineItem({
    required String title,
    required String building,
    required String address,
    required String location,
    required String date,
    required bool isStart,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                const Spacer(),
                const Icon(Icons.navigation, size: 14, color: kPrimary),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              building,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: kDark,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              address,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            Text(
              location,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isStart
                    ? kPrimary.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                date,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isStart ? kPrimary : Colors.red,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactTile(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: kDark, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                Text(subtitle,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: kDark)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.phone, color: Colors.green, size: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Map<String, String>> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item['label']!,
                            style: TextStyle(color: Colors.grey[600])),
                        Text(item['value']!,
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  if (idx != items.length - 1)
                    Divider(height: 1, color: Colors.grey.shade100),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildNoteItem(String title, String content, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFEF3C7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Color(0xFF92400E),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                time,
                style: const TextStyle(fontSize: 12, color: Color(0xFFB45309)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(color: Color(0xFF92400E), height: 1.5),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                // Show full content in dialog
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: Text(title),
                    content: SingleChildScrollView(
                      child: Text(content),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              },
              child: const Text(
                'Read More',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFFB45309),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper for file type icons
  Icon _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return const Icon(Icons.picture_as_pdf, color: Colors.red, size: 20);
      case 'jpg':
      case 'jpeg':
      case 'png':
        return const Icon(Icons.image, color: Colors.green, size: 20);
      case 'doc':
      case 'docx':
        return const Icon(Icons.description, color: Colors.blue, size: 20);
      default:
        return const Icon(Icons.insert_drive_file,
            color: Colors.grey, size: 20);
    }
  }

  // Helper for file type colors
  Color _getFileTypeColor(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Colors.red.withOpacity(0.1);
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Colors.green.withOpacity(0.1);
      case 'doc':
      case 'docx':
        return Colors.blue.withOpacity(0.1);
      default:
        return Colors.grey.withOpacity(0.1);
    }
  }
}
