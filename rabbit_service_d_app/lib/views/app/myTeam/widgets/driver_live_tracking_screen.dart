import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:url_launcher/url_launcher.dart';

class DriverLiveTrackingScreen extends StatefulWidget {
  final String driverId;
  final String driverName;
  final String? driverPhone;
  final String? loadNumber;
  final String? vehicleNumber;

  const DriverLiveTrackingScreen({
    super.key,
    required this.driverId,
    required this.driverName,
    this.driverPhone,
    this.loadNumber,
    this.vehicleNumber,
  });

  @override
  State<DriverLiveTrackingScreen> createState() =>
      _DriverLiveTrackingScreenState();
}

class _DriverLiveTrackingScreenState extends State<DriverLiveTrackingScreen> {
  final Completer<GoogleMapController> _mapController = Completer();
  LatLng? _currentLatLng;
  double _currentHeading = 0.0;
  double _currentSpeed = 0.0;
  DateTime? _lastUpdated;
  bool _isTrackingActive = false;
  String? _activeLoadId;
  String? _currentLoadNumber;
  String? _currentVehicleNumber;

  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  List<LatLng> _historyPoints = [];
  StreamSubscription? _historySubscription;

  @override
  void initState() {
    super.initState();
    _currentVehicleNumber = widget.vehicleNumber;
    _currentLoadNumber = widget.loadNumber;
    _resolveDriverDetails();
  }

  Future<void> _resolveDriverDetails() async {
    try {
      // 1. If vehicle is still not set, fetch from Driver's Vehicles collection
      if (_currentVehicleNumber == null ||
          _currentVehicleNumber!.isEmpty ||
          _currentVehicleNumber == 'Not specified') {
        final vehSnap = await FirebaseFirestore.instance
            .collection('Users')
            .doc(widget.driverId)
            .collection('Vehicles')
            .get();

        if (vehSnap.docs.isNotEmpty) {
          final vehData = vehSnap.docs.first.data();
          final vehNum =
              (vehData['vehicleNumber'] ?? vehData['companyName'] ?? '')
                  .toString();
          if (vehNum.isNotEmpty && mounted) {
            setState(() {
              _currentVehicleNumber = vehNum;
            });
          }
        }
      }

      // 2. Check if driver has an active load in dispatch_loads
      final loadsSnap = await FirebaseFirestore.instance
          .collection('dispatch_loads')
          .where('driverId', isEqualTo: widget.driverId)
          .where('status', whereIn: ['Assigned', 'In Transit', 'Accepted'])
          .limit(1)
          .get();

      if (loadsSnap.docs.isNotEmpty) {
        final loadData = loadsSnap.docs.first.data();
        final loadNum = (loadData['loadNumber'] ?? '').toString();
        final vehNum =
            (loadData['vehicleNumber'] ?? loadData['truckNumber'] ?? '')
                .toString();
        if (mounted) {
          setState(() {
            if (loadNum.isNotEmpty) _currentLoadNumber = loadNum;
            if (vehNum.isNotEmpty &&
                (_currentVehicleNumber == null ||
                    _currentVehicleNumber!.isEmpty ||
                    _currentVehicleNumber == 'Not specified')) {
              _currentVehicleNumber = vehNum;
            }
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _historySubscription?.cancel();
    super.dispose();
  }

  void _updateDriverLocation(Map<String, dynamic> data) {
    final lat = (data['latitude'] as num?)?.toDouble();
    final lng = (data['longitude'] as num?)?.toDouble();
    if (lat == null || lng == null) return;

    final newLatLng = LatLng(lat, lng);
    final heading = (data['heading'] as num?)?.toDouble() ?? 0.0;
    final speed = (data['speedKmph'] as num?)?.toDouble() ?? 0.0;
    final isActive = data['isTrackingActive'] == true;
    final loadId = data['activeLoadId']?.toString();
    final loadNum = data['loadNumber']?.toString() ?? widget.loadNumber;
    final vehNum = data['vehicleNumber']?.toString() ?? widget.vehicleNumber;

    DateTime? lastUpdate;
    if (data['lastUpdated'] is Timestamp) {
      lastUpdate = (data['lastUpdated'] as Timestamp).toDate();
    }

    setState(() {
      _currentLatLng = newLatLng;
      _currentHeading = heading;
      _currentSpeed = speed;
      _isTrackingActive = isActive;
      _lastUpdated = lastUpdate;
      _activeLoadId = loadId;
      _currentLoadNumber = loadNum;
      _currentVehicleNumber = vehNum;

      _markers.removeWhere((m) => m.markerId.value == 'driver_live_marker');
      _markers.add(
        Marker(
          markerId: const MarkerId('driver_live_marker'),
          position: newLatLng,
          rotation: heading,
          anchor: const Offset(0.5, 0.5),
          infoWindow: InfoWindow(
            title: widget.driverName,
            snippet:
                'Speed: ${speed.toStringAsFixed(1)} km/h | Load: ${loadNum ?? "N/A"}',
          ),
          icon:
              BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        ),
      );
    });

    _animateCameraTo(newLatLng);

    // Listen to breadcrumbs history if activeLoadId is present
    if (loadId != null && loadId.isNotEmpty && _historySubscription == null) {
      _listenToLocationHistory(loadId);
    }
  }

  void _listenToLocationHistory(String loadId) {
    _historySubscription?.cancel();
    _historySubscription = FirebaseFirestore.instance
        .collection('ActiveLoadLocations')
        .doc(loadId)
        .collection('History')
        .orderBy('recordedAt', descending: false)
        .snapshots()
        .listen((snapshot) {
      final points = <LatLng>[];
      for (final doc in snapshot.docs) {
        final d = doc.data();
        final lat = (d['latitude'] as num?)?.toDouble();
        final lng = (d['longitude'] as num?)?.toDouble();
        if (lat != null && lng != null) {
          points.add(LatLng(lat, lng));
        }
      }

      if (mounted && points.isNotEmpty) {
        setState(() {
          _historyPoints = points;
          _polylines.clear();
          _polylines.add(
            Polyline(
              polylineId: const PolylineId('driver_route_history'),
              points: points,
              color: const Color(0xFF58BB87),
              width: 5,
            ),
          );
        });
      }
    });
  }

  Future<void> _animateCameraTo(LatLng target) async {
    try {
      final controller = await _mapController.future;
      await controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: 15.0),
        ),
      );
    } catch (_) {}
  }

  Future<void> _callDriver(String? phone) async {
    if (phone == null || phone.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Driver phone number not available')),
      );
      return;
    }
    final uri = Uri.parse('tel:${phone.replaceAll(RegExp(r'[^0-9+]'), '')}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _formatLastPing(DateTime? dt) {
    if (dt == null) return 'No ping recorded';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24)
      return '${diff.inHours}h ${diff.inMinutes % 60}m ago';
    return DateFormat('dd MMM, hh:mm a').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        iconTheme: IconThemeData(color: kWhite),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Live Tracking: ${widget.driverName}',
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: kWhite),
            ),
            if (_currentLoadNumber != null && _currentLoadNumber!.isNotEmpty)
              Text(
                'Load: $_currentLoadNumber',
                style: const TextStyle(fontSize: 12, color: Colors.white70),
              ),
          ],
        ),
        backgroundColor: const Color(0xFF58BB87),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Center on Driver',
            onPressed: () {
              if (_currentLatLng != null) {
                _animateCameraTo(_currentLatLng!);
              }
            },
          ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('DriverLocations')
            .doc(widget.driverId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasData && snapshot.data?.exists == true) {
            final data = snapshot.data!.data() ?? {};
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _updateDriverLocation(data);
            });
          }

          final initialPos = _currentLatLng ?? const LatLng(20.5937, 78.9629);

          return Stack(
            children: [
              // 1. Google Map
              GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: initialPos,
                  zoom: _currentLatLng != null ? 15.0 : 5.0,
                ),
                markers: _markers,
                polylines: _polylines,
                myLocationEnabled: false,
                compassEnabled: true,
                zoomControlsEnabled: false,
                onMapCreated: (controller) {
                  if (!_mapController.isCompleted) {
                    _mapController.complete(controller);
                  }
                },
              ),

              // 2. Offline / No Data Overlay
              if (_currentLatLng == null && !snapshot.hasError)
                Positioned(
                  top: 16,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF58BB87),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Waiting for driver GPS location signal...',
                            style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // 3. Bottom Driver Telemetry Card
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 20,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Status and Ping Time
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _isTrackingActive
                                  ? const Color(0xFF58BB87).withOpacity(0.15)
                                  : Colors.orange.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: _isTrackingActive
                                        ? const Color(0xFF58BB87)
                                        : Colors.orange,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _isTrackingActive
                                      ? 'Live Tracking (5m Sync)'
                                      : 'Tracking Inactive',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _isTrackingActive
                                        ? const Color(0xFF2E724F)
                                        : Colors.orange[800],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.access_time,
                                  size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                _formatLastPing(_lastUpdated),
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Driver Info and Speed
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor:
                                const Color(0xFF58BB87).withOpacity(0.2),
                            child: const Icon(
                              Icons.person,
                              color: Color(0xFF58BB87),
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.driverName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Vehicle: ${_currentVehicleNumber?.isNotEmpty == true ? _currentVehicleNumber : (widget.vehicleNumber ?? "Not specified")}',
                                  style: const TextStyle(
                                      fontSize: 13, color: Colors.black54),
                                ),
                              ],
                            ),
                          ),

                          // Speedometer Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.grey[300]!),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  '${_currentSpeed.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF58BB87),
                                  ),
                                ),
                                const Text(
                                  'km/h',
                                  style: TextStyle(
                                      fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Action Buttons
                      Row(
                        children: [
                          if (widget.driverPhone != null &&
                              widget.driverPhone!.trim().isNotEmpty)
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () =>
                                    _callDriver(widget.driverPhone),
                                icon: const Icon(Icons.phone, size: 18),
                                label: const Text('Call Driver'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF58BB87),
                                  foregroundColor: Colors.white,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
