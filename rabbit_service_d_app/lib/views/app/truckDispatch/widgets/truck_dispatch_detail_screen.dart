import 'dart:async';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/truck_disptach_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class DispatchDetailsScreen extends StatefulWidget {
  final LoadData load;

  const DispatchDetailsScreen({super.key, required this.load});

  @override
  State<DispatchDetailsScreen> createState() => _DispatchDetailsScreenState();
}

class _DispatchDetailsScreenState extends State<DispatchDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final String currentUId = FirebaseAuth.instance.currentUser?.uid ?? '';
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _loadSubscription;

  Map<String, dynamic>? _loadData;
  Map<String, dynamic>? _brokerProfile;
  bool _isLoading = true;
  bool _isUploading = false;
  LatLng? _pickupLatLng;
  LatLng? _dropLatLng;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _listenToLoad();
  }

  @override
  void dispose() {
    _loadSubscription?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  void _listenToLoad() {
    _loadSubscription = FirebaseFirestore.instance
        .collection('dispatch_loads')
        .doc(widget.load.id)
        .snapshots()
        .listen((snapshot) async {
      if (!snapshot.exists) {
        if (mounted) {
          setState(() {
            _loadData = null;
            _isLoading = false;
          });
        }
        return;
      }

      final data = snapshot.data() ?? <String, dynamic>{};

      if (mounted) {
        setState(() {
          _loadData = {
            'id': snapshot.id,
            ...data,
          };
          _isLoading = false;
        });
      }

      await Future.wait([
        _loadBrokerProfile(data),
        _resolveRouteMarkers(data),
      ]);
    });
  }

  Future<void> _loadBrokerProfile(Map<String, dynamic> data) async {
    final ownerId = (data['effectiveUserId'] ?? data['currentUserId'] ?? '')
        .toString()
        .trim();
    if (ownerId.isEmpty) return;

    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(ownerId)
          .get();
      if (!snapshot.exists || !mounted) return;

      setState(() {
        _brokerProfile = snapshot.data();
      });
    } catch (_) {}
  }

  Future<void> _resolveRouteMarkers(Map<String, dynamic> data) async {
    final pickupAddress = _fullAddressForStop(_pickupStop(data));
    final dropAddress = _fullAddressForStop(_deliveryStop(data));

    try {
      LatLng? pickup;
      LatLng? drop;

      if (pickupAddress.isNotEmpty) {
        final locations = await locationFromAddress(pickupAddress);
        if (locations.isNotEmpty) {
          pickup = LatLng(locations.first.latitude, locations.first.longitude);
        }
      }

      if (dropAddress.isNotEmpty) {
        final locations = await locationFromAddress(dropAddress);
        if (locations.isNotEmpty) {
          drop = LatLng(locations.first.latitude, locations.first.longitude);
        }
      }

      if (!mounted) return;

      setState(() {
        _pickupLatLng = pickup;
        _dropLatLng = drop;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _pickupLatLng ??= const LatLng(36.7378, -119.7871);
        _dropLatLng ??= const LatLng(34.0522, -118.2437);
      });
    }
  }

  Map<String, dynamic> _pickupStop(Map<String, dynamic> data) {
    final pickups = (data['pickups'] as List<dynamic>? ?? []);
    if (pickups.isEmpty) return <String, dynamic>{};
    return Map<String, dynamic>.from(pickups.first as Map);
  }

  Map<String, dynamic> _deliveryStop(Map<String, dynamic> data) {
    final deliveries = (data['deliveries'] as List<dynamic>? ?? []);
    if (deliveries.isEmpty) return <String, dynamic>{};
    return Map<String, dynamic>.from(deliveries.last as Map);
  }

  String _fullAddressForStop(Map<String, dynamic> stop) {
    return (stop['address'] ?? '').toString().trim();
  }

  String _dateLabel(dynamic value) {
    if (value == null) return '-';
    if (value is Timestamp) {
      return DateFormat('MMM d, y').format(value.toDate());
    }

    final raw = value.toString().trim();
    if (raw.isEmpty) return '-';
    final parsed = DateTime.tryParse(raw);
    if (parsed != null) return DateFormat('MMM d, y').format(parsed);
    return raw;
  }

  String _dateTimeLabel(dynamic value) {
    if (value is Timestamp) {
      return DateFormat('MMM d, y • h:mm a').format(value.toDate());
    }
    return '-';
  }

  String _currency(dynamic value) {
    final amount = double.tryParse(value?.toString() ?? '') ?? 0;
    return NumberFormat.currency(symbol: '\$').format(amount);
  }

  String _milesLabel(dynamic value) {
    final text = value?.toString().trim() ?? '';
    if (text.isEmpty) return '-';
    return text.toLowerCase().contains('mile') ? text : '$text Miles';
  }

  (String, String) _addressParts(String address) {
    if (address.trim().isEmpty) return ('-', '-');
    final parts = address
        .split(',')
        .map((segment) => segment.trim())
        .where((segment) => segment.isNotEmpty)
        .toList();
    if (parts.length <= 1) return (address, '-');
    return (parts.first, parts.sublist(1).join(', '));
  }

  String _brokerName() {
    return (_brokerProfile?['companyName'] ??
            _brokerProfile?['userName'] ??
            'Broker Team')
        .toString();
  }

  String _brokerPhone() {
    return (_brokerProfile?['phoneNumber'] ?? '-').toString();
  }

  String _brokerEmail() {
    return (_brokerProfile?['email'] ?? '-').toString();
  }

  String _loadStatus() {
    return (_loadData?['status'] ?? widget.load.rawStatus).toString();
  }

  List<Map<String, dynamic>> _documents() {
    final docs = (_loadData?['documents'] as List<dynamic>? ?? []);
    return docs.map((item) => Map<String, dynamic>.from(item as Map)).toList()
      ..sort((a, b) {
        final aSeconds = (a['createdAt'] as Timestamp?)?.seconds ?? 0;
        final bSeconds = (b['createdAt'] as Timestamp?)?.seconds ?? 0;
        return bSeconds.compareTo(aSeconds);
      });
  }

  List<Map<String, String>> _notes() {
    final notes = <Map<String, String>>[];
    final dispatchNotes = (_loadData?['dispatchNotes'] ?? '').toString().trim();
    if (dispatchNotes.isNotEmpty) {
      notes.add({
        'title': 'Dispatch Notes',
        'content': dispatchNotes,
        'time': _dateTimeLabel(_loadData?['updatedAt']),
      });
    }

    final pickup = _pickupStop(_loadData ?? {});
    final delivery = _deliveryStop(_loadData ?? {});

    void addStopNote(String title, Map<String, dynamic> stop) {
      final instructions = (stop['instructions'] ?? '').toString().trim();
      final stopNotes = (stop['notes'] ?? '').toString().trim();
      final body = [instructions, stopNotes]
          .where((item) => item.isNotEmpty)
          .join('\n\n');
      if (body.isEmpty) return;
      notes.add({
        'title': title,
        'content': body,
        'time': _dateLabel(stop['date']),
      });
    }

    addStopNote('Pickup Instructions', pickup);
    addStopNote('Delivery Instructions', delivery);
    return notes;
  }

  Future<void> _openMap(String address) async {
    if (address.trim().isEmpty) return;
    final query = Uri.encodeComponent(address);
    final googleMapsUrl =
        Uri.parse("https://www.google.com/maps/search/?api=1&query=$query");
    final appleMapsUrl = Uri.parse("https://maps.apple.com/?q=$query");

    if (await canLaunchUrl(googleMapsUrl)) {
      await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
      return;
    }
    if (await canLaunchUrl(appleMapsUrl)) {
      await launchUrl(appleMapsUrl, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _browseFiles() async {
    if (_loadData == null || _isUploading) return;

    try {
      final result = await FilePicker.platform.pickFiles(
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

      setState(() => _isUploading = true);

      final loadRef = FirebaseFirestore.instance
          .collection('dispatch_loads')
          .doc(widget.load.id);
      final existingDocuments = _documents();
      final nextDocuments = <Map<String, dynamic>>[...existingDocuments];

      for (final file in result.files) {
        if (file.path == null) continue;
        final ioFile = File(file.path!);
        final safeName = file.name.replaceAll(' ', '_');
        final storagePath =
            'dispatch-loads/${widget.load.id}/driver-uploads/${DateTime.now().millisecondsSinceEpoch}-$safeName';
        final storageRef = FirebaseStorage.instance.ref().child(storagePath);

        await storageRef.putFile(ioFile);
        final downloadUrl = await storageRef.getDownloadURL();

        nextDocuments.add({
          'id': 'driver-${DateTime.now().microsecondsSinceEpoch}',
          'name': file.name,
          'type': 'proof-of-delivery',
          'size': file.size,
          'url': downloadUrl,
          'mimeType': file.extension ?? '',
          'source': 'uploaded',
          'storagePath': storagePath,
          'createdAt': Timestamp.now(),
          'uploadedByRole': 'driver',
          'uploadedById': currentUId,
          'uploadedByName': widget.load.driverName,
        });
      }

      await loadRef.update({
        'documents': nextDocuments,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      await loadRef.collection('history').add({
        'action': 'driver-uploaded-documents',
        'message': 'Driver uploaded documents',
        'createdBy': currentUId,
        'createdAt': FieldValue.serverTimestamp(),
        'metadata': {
          'files': result.files.length.toString(),
          'driverId': currentUId,
        },
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${result.files.length} file(s) uploaded successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to upload files: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _downloadDocument(Map<String, dynamic> doc) async {
    final url = (doc['url'] ?? '').toString().trim();
    if (url.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Document link is not available.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadData == null) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: Text('Load not found.')),
      );
    }

    final pickup = _pickupStop(_loadData!);
    final delivery = _deliveryStop(_loadData!);
    final pickupAddress = _fullAddressForStop(pickup);
    final deliveryAddress = _fullAddressForStop(delivery);
    final pickupParts = _addressParts(pickupAddress);
    final deliveryParts = _addressParts(deliveryAddress);
    final documents = _documents();
    final notes = _notes();

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
          _buildDetailsTab(pickup, delivery, pickupParts, deliveryParts),
          _buildDocumentsTab(documents),
          _buildLoadInfoTab(),
          _buildNotesTab(notes),
        ],
      ),
    );
  }

  Widget _buildDetailsTab(
    Map<String, dynamic> pickup,
    Map<String, dynamic> delivery,
    (String, String) pickupParts,
    (String, String) deliveryParts,
  ) {
    final pickupTarget = _pickupLatLng ?? const LatLng(36.7378, -119.7871);
    final dropTarget = _dropLatLng ?? const LatLng(34.0522, -118.2437);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                          (_loadData?['loadNumber'] ?? widget.load.loadNumber)
                              .toString(),
                          style: const TextStyle(
                            fontSize: 18,
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
                              (_loadData?['customerName'] ??
                                      _loadData?['customerSearch'] ??
                                      widget.load.company)
                                  .toString(),
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    _buildStatusChip(_loadStatus()),
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
                  initialCameraPosition:
                      CameraPosition(target: pickupTarget, zoom: 6),
                  markers: {
                    Marker(
                      markerId: const MarkerId('pickup'),
                      position: pickupTarget,
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                        BitmapDescriptor.hueRed,
                      ),
                    ),
                    Marker(
                      markerId: const MarkerId('drop'),
                      position: dropTarget,
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                        BitmapDescriptor.hueBlue,
                      ),
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
                Center(
                  child: ElevatedButton.icon(
                    onPressed: () => _openMap(_fullAddressForStop(delivery)),
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
                          _milesLabel(_loadData?['tenderedMiles']),
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
          const SizedBox(height: 24),
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
                        building: (pickup['company'] ?? '-').toString(),
                        address: pickupParts.$1,
                        location: pickupParts.$2,
                        date: _dateLabel(pickup['date']),
                        isStart: true,
                        onTap: () => _openMap(_fullAddressForStop(pickup)),
                      ),
                      const SizedBox(height: 30),
                      _buildTimelineItem(
                        title: 'DROP-OFF',
                        building: (delivery['company'] ?? '-').toString(),
                        address: deliveryParts.$1,
                        location: deliveryParts.$2,
                        date: _dateLabel(delivery['date']),
                        isStart: false,
                        onTap: () => _openMap(_fullAddressForStop(delivery)),
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
              Icons.person_outline, 'Broker Contact', _brokerName()),
          const SizedBox(height: 12),
          _buildContactTile(
              Icons.phone_outlined, 'Phone Number', _brokerPhone()),
          const SizedBox(height: 12),
          _buildContactTile(Icons.email_outlined, 'Email', _brokerEmail()),
        ],
      ),
    );
  }

  Widget _buildDocumentsTab(List<Map<String, dynamic>> documents) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: kLightWhite,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.grey.shade200,
              style: BorderStyle.none,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
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
                'Supports PDF, JPG, PNG, DOC, DOCX, XLS, XLSX',
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isUploading ? null : _browseFiles,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(_isUploading ? 'Uploading...' : 'Browse Files'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Attached Files',
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: kDark),
            ),
            if (documents.isNotEmpty)
              Text(
                '${documents.length} files',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (documents.isEmpty)
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
                  'Admin and driver uploads will appear here together.',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          )
        else
          ...documents.map((doc) {
            final uploaderRole = (doc['uploadedByRole'] ?? 'admin').toString();
            final uploaderLabel =
                uploaderRole == 'driver' ? 'Driver Upload' : 'Admin Upload';
            final createdAt = doc['createdAt'];
            final fileSize = (doc['size'] as num?)?.toInt() ?? 0;
            final createdAtLabel = createdAt is Timestamp
                ? DateFormat('MMM d, y • h:mm a').format(createdAt.toDate())
                : '';

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
                    color: _getFileTypeColor((doc['type'] ?? '').toString()),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: _getFileTypeIcon((doc['type'] ?? '').toString()),
                ),
                title: Text(
                  (doc['name'] ?? 'Document').toString(),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${(doc['type'] ?? 'Document').toString()} • ${_formatFileSize(fileSize)}${createdAtLabel.isNotEmpty ? '\n$createdAtLabel' : ''}',
                  style: TextStyle(
                    color: Colors.grey[600],
                  ),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: uploaderRole == 'driver'
                              ? Colors.green.withOpacity(0.1)
                              : kPrimary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          uploaderLabel,
                          style: TextStyle(
                            color: uploaderRole == 'driver'
                                ? Colors.green
                                : kPrimary,
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
          {
            'label': 'Weight',
            'value': (_loadData?['weight'] ?? '-').toString()
          },
          {
            'label': 'Commodity',
            'value': (_loadData?['commodity'] ?? '-').toString(),
          },
          {'label': 'Type', 'value': (_loadData?['type'] ?? '-').toString()},
          {
            'label': 'Equipment',
            'value': (_loadData?['vanType'] ?? _loadData?['trailerType'] ?? '-')
                .toString(),
          },
          {
            'label': 'Temp',
            'value': (_loadData?['temperature'] ?? '-').toString(),
          },
          {
            'label': 'Miles',
            'value': _milesLabel(_loadData?['tenderedMiles']),
          },
        ]),
        const SizedBox(height: 20),
        _buildInfoSection('Equipment', [
          {
            'label': 'Truck ID',
            'value': (_loadData?['truckId'] ?? '-').toString()
          },
          {
            'label': 'Trailer ID',
            'value': (_loadData?['trailerId'] ?? '-').toString(),
          },
          {
            'label': 'Driver',
            'value':
                (_loadData?['driverName'] ?? widget.load.driverName).toString(),
          },
          {
            'label': 'Dispatcher',
            'value': (_loadData?['dispatcherId'] ?? '-').toString(),
          },
        ]),
        const SizedBox(height: 20),
        _buildInfoSection('Financials', [
          {
            'label': 'Customer Rate',
            'value': _currency(_loadData?['totalCustomerRate']),
          },
          {
            'label': 'Carrier Pay',
            'value': _currency(_loadData?['totalCarrierPay']),
          },
          {'label': 'Line Haul', 'value': _currency(_loadData?['lineHaul'])},
          {
            'label': 'Fuel Surcharge',
            'value': _currency(_loadData?['fuelSurcharge']),
          },
          {'label': 'Detention', 'value': _currency(_loadData?['detention'])},
        ]),
      ],
    );
  }

  Widget _buildNotesTab(List<Map<String, String>> notes) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (notes.isEmpty)
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
                  Icons.note_alt_outlined,
                  size: 48,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No admin notes yet',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          )
        else
          ...notes.map(
            (note) => _buildNoteItem(
              note['title'] ?? 'Note',
              note['content'] ?? '-',
              note['time'] ?? '-',
            ),
          ),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'assigned':
        color = Colors.orange;
        break;
      case 'in transit':
        color = kPrimary;
        break;
      case 'completed':
      case 'completed toun':
      case 'delivered':
        color = Colors.green;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
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
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w700,
                color: isStart ? kPrimary : Colors.red,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              building,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: kDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              address,
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
            Text(
              location,
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: (isStart ? kPrimary : Colors.red).withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                date,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isStart ? kPrimary : Colors.red,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactTile(IconData icon, String label, String value) {
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
              color: kPrimary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: kPrimary, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: kDark,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Map<String, String>> infoItems) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: kDark,
            ),
          ),
          const SizedBox(height: 16),
          ...infoItems.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      item['label'] ?? '-',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item['value'] ?? '-',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        color: kDark,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoteItem(String title, String content, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
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
                    fontWeight: FontWeight.w800,
                    color: kDark,
                    fontSize: 15,
                  ),
                ),
              ),
              Text(
                time,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            content,
            style: TextStyle(
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Color _getFileTypeColor(String type) {
    final normalized = type.toLowerCase();
    if (normalized.contains('pdf')) return Colors.red.withOpacity(0.1);
    if (normalized.contains('jpg') ||
        normalized.contains('jpeg') ||
        normalized.contains('png')) {
      return Colors.green.withOpacity(0.1);
    }
    if (normalized.contains('doc')) return Colors.blue.withOpacity(0.1);
    if (normalized.contains('xls')) return Colors.teal.withOpacity(0.1);
    return kPrimary.withOpacity(0.1);
  }

  Widget _getFileTypeIcon(String type) {
    final normalized = type.toLowerCase();
    if (normalized.contains('pdf')) {
      return const Icon(Icons.picture_as_pdf, color: Colors.red);
    }
    if (normalized.contains('jpg') ||
        normalized.contains('jpeg') ||
        normalized.contains('png')) {
      return const Icon(Icons.image_outlined, color: Colors.green);
    }
    if (normalized.contains('doc')) {
      return const Icon(Icons.description_outlined, color: Colors.blue);
    }
    if (normalized.contains('xls')) {
      return const Icon(Icons.table_chart_outlined, color: Colors.teal);
    }
    return const Icon(Icons.insert_drive_file_outlined, color: kPrimary);
  }

  String _formatFileSize(int bytes) {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1048576) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / 1048576).toStringAsFixed(1)} MB';
  }
}
