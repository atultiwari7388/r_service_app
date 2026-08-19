import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/driver_location_service.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/widgets/truck_dispatch_detail_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class TruckDispatchDashboard extends StatefulWidget {
  const TruckDispatchDashboard({super.key});

  @override
  State<TruckDispatchDashboard> createState() => _TruckDispatchDashboardState();
}

class _TruckDispatchDashboardState extends State<TruckDispatchDashboard>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  final String currentUId = FirebaseAuth.instance.currentUser?.uid ?? '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabSelection);
    _searchController.addListener(() {
      if (mounted) setState(() {});
    });
    DriverLocationService.checkAndResumeTracking();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging && mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openMap(String address) async {
    final cleanAddress = address.replaceAll('-', '').trim();
    if (cleanAddress.isEmpty) return;
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

  Future<void> _onAccept(LoadData load) async {
    try {
      final loadRef =
          FirebaseFirestore.instance.collection('dispatch_loads').doc(load.id);
      final nextStatus = load.isTerminalStatus
          ? load.rawStatus
          : (load.rawStatus == 'Draft' ||
                  load.rawStatus == 'Posted' ||
                  load.rawStatus == 'Booked' ||
                  load.rawStatus == 'Pre-Planned')
              ? 'Assigned'
              : load.rawStatus;

      await loadRef.update({
        'driverAcceptanceStatus': 'accepted',
        'driverAcceptedAt': FieldValue.serverTimestamp(),
        'driverAcceptedById': currentUId,
        'status': nextStatus,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      await loadRef.collection('history').add({
        'action': 'driver-accepted',
        'message': 'Driver accepted the load',
        'createdBy': currentUId,
        'createdAt': FieldValue.serverTimestamp(),
        'metadata': {
          'driverId': currentUId,
          'driverName': load.driverName,
          'loadNumber': load.loadNumber,
        },
      });

      // Start 5-minute background location tracking
      final ownerId = load.ownerId.isNotEmpty
          ? load.ownerId
          : (load.rawData['effectiveUserId'] ??
                  load.rawData['currentUserId'] ??
                  '')
              .toString();
      if (ownerId.isNotEmpty) {
        await DriverLocationService.startTracking(
          loadId: load.id,
          ownerId: ownerId,
          loadNumber: load.loadNumber,
          vehicleNumber: load.vehicleNumber,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${load.loadNumber} accepted! Live tracking active (5 min interval)'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF58BB87),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to accept load: $e'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  List<LoadData> _applySearch(List<LoadData> loads) {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return loads;

    return loads.where((load) {
      return load.loadNumber.toLowerCase().contains(query) ||
          load.company.toLowerCase().contains(query) ||
          load.pickupBuilding.toLowerCase().contains(query) ||
          load.pickupAddress.toLowerCase().contains(query) ||
          load.pickupLocation.toLowerCase().contains(query) ||
          load.dropBuilding.toLowerCase().contains(query) ||
          load.dropAddress.toLowerCase().contains(query) ||
          load.dropLocation.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (currentUId.isEmpty) {
      return const Scaffold(
        backgroundColor: kLightWhite,
        body: Center(child: Text('Please sign in to view dispatch loads.')),
      );
    }

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('dispatch_loads')
          .where('driverId', isEqualTo: currentUId)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            backgroundColor: kLightWhite,
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Failed to load dispatch data.\n${snapshot.error}',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final allLoads = (snapshot.data?.docs ?? [])
            .map((doc) => LoadData.fromFirestore(doc))
            .toList()
          ..sort((a, b) => b.sortTimestamp.compareTo(a.sortTimestamp));

        final pendingLoads = _applySearch(
            allLoads.where((load) => load.tabKey == 'pending').toList());
        final activeLoads = _applySearch(
            allLoads.where((load) => load.tabKey == 'active').toList());
        final historyLoads = _applySearch(
            allLoads.where((load) => load.tabKey == 'history').toList());

        return Scaffold(
          backgroundColor: kLightWhite,
          body: Column(
            children: [
              _buildModernHeader(
                pendingCount: pendingLoads.length,
                activeCount: activeLoads.length,
                historyCount: historyLoads.length,
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLoadList(pendingLoads, showAcceptButton: true),
                    _buildLoadList(activeLoads, showProgress: true),
                    _buildLoadList(historyLoads, showCompleted: true),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModernHeader({
    required int pendingCount,
    required int activeCount,
    required int historyCount,
  }) {
    return Container(
      padding: const EdgeInsets.only(top: 50, left: 20, right: 20, bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: kLightWhite,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      size: 18, color: kDark),
                  onPressed: () {
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Truck Dispatch',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Manage your logistics',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              CircleAvatar(
                radius: 22,
                backgroundColor: kPrimary.withOpacity(0.1),
                child: Icon(Icons.notifications_outlined, color: kPrimary),
              )
            ],
          ),
          const SizedBox(height: 25),
          Container(
            height: 45,
            decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.circular(25),
            ),
            child: Row(
              children: [
                _buildCustomTab(
                    'Pending', 0, pendingCount, kPrimaryLight.withOpacity(0.8)),
                _buildCustomTab(
                    'Active', 1, activeCount, Colors.orange.withOpacity(0.8)),
                _buildCustomTab(
                    'History', 2, historyCount, kSecondary.withOpacity(0.8)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomTab(
      String text, int index, int count, Color unselectedColor) {
    final isSelected = _tabController.index == index;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: GestureDetector(
          onTap: () {
            _tabController.animateTo(index);
          },
          child: Container(
            height: 45,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              color: isSelected ? kPrimary : const Color(0xFFE5E7EB),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: kPrimary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: kGrayLight.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  text,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isSelected ? Colors.white : kDark.withOpacity(0.6),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(isSelected ? 0.25 : 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      count.toString(),
                      style: TextStyle(
                        fontSize: 10,
                        color:
                            isSelected ? Colors.white : kDark.withOpacity(0.8),
                      ),
                    ),
                  ),
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search load #, location...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              color: kPrimary,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: kPrimary.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.tune, color: Colors.white),
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadList(List<LoadData> loads,
      {bool showAcceptButton = false,
      bool showProgress = false,
      bool showCompleted = false}) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      physics: const BouncingScrollPhysics(),
      children: [
        _buildSearchBar(),
        if (loads.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF64748B).withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Icon(Icons.local_shipping_outlined,
                    size: 48, color: Colors.grey.shade400),
                const SizedBox(height: 16),
                Text(
                  'No loads found',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Colors.grey.shade700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _searchController.text.trim().isEmpty
                      ? 'Assigned loads will appear here automatically.'
                      : 'Try a different search term.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade500),
                ),
              ],
            ),
          )
        else
          ...loads.map(
            (load) => _buildModernCard(
              load,
              showAcceptButton: showAcceptButton,
              showProgress: showProgress,
              showCompleted: showCompleted,
            ),
          ),
      ],
    );
  }

  Widget _buildModernCard(LoadData load,
      {bool showAcceptButton = false,
      bool showProgress = false,
      bool showCompleted = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF64748B).withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kLightWhite.withOpacity(0.5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Center(
                    child: Text(
                      load.company.isEmpty ? 'L' : load.company.substring(0, 1),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: kPrimary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        load.loadNumber,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: kDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        load.company,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: kPrimary,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: kPrimary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    load.price ?? '\$0.00',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Column(
                    children: [
                      const Icon(Icons.radio_button_checked,
                          size: 20, color: kPrimary),
                      Expanded(
                        child: Container(
                          width: 2,
                          color: Colors.grey.withOpacity(0.3),
                          margin: const EdgeInsets.symmetric(vertical: 4),
                        ),
                      ),
                      Icon(Icons.location_on, size: 20, color: Colors.red[400]),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailedLocationBlock(
                          title: 'PICKUP',
                          building: load.pickupBuilding,
                          address: load.pickupAddress,
                          location: load.pickupLocation,
                          date: load.pickupDate,
                          dateColor: kPrimary,
                          onNavigate: () => _openMap(load.fullPickupAddress),
                        ),
                        const SizedBox(height: 24),
                        _buildDetailedLocationBlock(
                          title: 'DROP-OFF',
                          building: load.dropBuilding,
                          address: load.dropAddress,
                          location: load.dropLocation,
                          date: load.dropDate,
                          dateColor: Colors.red[400]!,
                          onNavigate: () => _openMap(load.fullDropAddress),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade100),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                if (showProgress) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        load.rawStatus == 'Assigned'
                            ? 'Assigned'
                            : 'In Transit',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '${load.progress}%',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: kPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: load.progress / 100,
                      backgroundColor: kLightWhite,
                      color: kPrimary,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  DispatchDetailsScreen(load: load),
                            ),
                          );
                        },
                        icon: const Icon(Icons.visibility_outlined, size: 18),
                        label: const Text('View Details'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: kDark,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                    if (showAcceptButton) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _onAccept(load),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kSecondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            'Accept',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedLocationBlock({
    required String title,
    required String building,
    required String address,
    required String location,
    required String date,
    required Color dateColor,
    required VoidCallback onNavigate,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                building,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: kDark,
                ),
              ),
            ),
            InkWell(
              onTap: onNavigate,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: dateColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.near_me_rounded,
                      size: 14,
                      color: dateColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Map',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: dateColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        InkWell(
          onTap: onNavigate,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2.0, right: 6.0),
                child: Icon(
                  Icons.navigation_outlined,
                  size: 15,
                  color: dateColor,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      address,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    Text(
                      location,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: dateColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            date,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: dateColor,
            ),
          ),
        ),
      ],
    );
  }
}

class LoadData {
  final String id;
  final String loadNumber;
  final String company;
  final String miles;
  final String status;
  final String rawStatus;
  final String tabKey;
  final String driverName;
  final String? price;
  final int progress;
  final bool isTerminalStatus;
  final DateTime sortTimestamp;
  final String pickupBuilding;
  final String pickupAddress;
  final String pickupLocation;
  final String pickupDate;
  final String dropBuilding;
  final String dropAddress;
  final String dropLocation;
  final String dropDate;

  final String ownerId;
  final String vehicleNumber;
  final Map<String, dynamic> rawData;

  String get fullPickupAddress {
    final list = [pickupBuilding, pickupAddress, pickupLocation]
        .where((s) => s.trim().isNotEmpty && s.trim() != '-')
        .toList();
    return list.join(', ');
  }

  String get fullDropAddress {
    final list = [dropBuilding, dropAddress, dropLocation]
        .where((s) => s.trim().isNotEmpty && s.trim() != '-')
        .toList();
    return list.join(', ');
  }

  LoadData({
    required this.id,
    required this.loadNumber,
    required this.company,
    required this.pickupBuilding,
    required this.pickupAddress,
    required this.pickupLocation,
    required this.pickupDate,
    required this.dropBuilding,
    required this.dropAddress,
    required this.dropLocation,
    required this.dropDate,
    required this.miles,
    required this.status,
    required this.rawStatus,
    required this.tabKey,
    required this.driverName,
    required this.progress,
    required this.isTerminalStatus,
    required this.sortTimestamp,
    this.ownerId = '',
    this.vehicleNumber = '',
    this.rawData = const {},
    this.price,
  });

  factory LoadData.fromFirestore(
      QueryDocumentSnapshot<Map<String, dynamic>> docSnapshot) {
    final data = docSnapshot.data();
    final pickups =
        (data['pickups'] as List<dynamic>? ?? []).cast<Map<dynamic, dynamic>>();
    final deliveries = (data['deliveries'] as List<dynamic>? ?? [])
        .cast<Map<dynamic, dynamic>>();
    final pickup = pickups.isNotEmpty ? pickups.first : <dynamic, dynamic>{};
    final delivery =
        deliveries.isNotEmpty ? deliveries.last : <dynamic, dynamic>{};
    final pickupAddress = (pickup['address'] ?? '').toString().trim();
    final deliveryAddress = (delivery['address'] ?? '').toString().trim();
    final pickupParts = _splitAddress(pickupAddress);
    final deliveryParts = _splitAddress(deliveryAddress);
    final rawStatus = (data['status'] ?? 'Draft').toString();
    final acceptanceStatus =
        (data['driverAcceptanceStatus'] ?? '').toString().toLowerCase();
    final isTerminalStatus = [
      'delivered',
      'completed toun',
      'completed',
      'cancelled'
    ].contains(rawStatus.toLowerCase());
    final isAccepted = acceptanceStatus == 'accepted' ||
        rawStatus == 'Assigned' ||
        rawStatus == 'In Transit' ||
        rawStatus == 'Delivered' ||
        rawStatus == 'Completed Toun' ||
        rawStatus == 'Completed';
    final tabKey = isTerminalStatus
        ? 'history'
        : isAccepted
            ? 'active'
            : 'pending';

    return LoadData(
      id: docSnapshot.id,
      loadNumber: (data['loadNumber'] ?? docSnapshot.id).toString(),
      company:
          (data['customerName'] ?? data['customerSearch'] ?? '-').toString(),
      pickupBuilding: (pickup['company'] ?? '-').toString(),
      pickupAddress: pickupParts.$1,
      pickupLocation: pickupParts.$2,
      pickupDate: _formatDate(pickup['date']),
      dropBuilding: (delivery['company'] ?? '-').toString(),
      dropAddress: deliveryParts.$1,
      dropLocation: deliveryParts.$2,
      dropDate: _formatDate(delivery['date']),
      miles: _formatMiles(data['tenderedMiles']),
      status: rawStatus,
      rawStatus: rawStatus,
      tabKey: tabKey,
      driverName: (data['driverName'] ?? '').toString(),
      progress: _progressForStatus(rawStatus, acceptanceStatus),
      isTerminalStatus: isTerminalStatus,
      ownerId: (data['effectiveUserId'] ?? data['currentUserId'] ?? '').toString(),
      vehicleNumber: (data['vehicleNumber'] ?? data['truckNumber'] ?? '').toString(),
      rawData: data,
      sortTimestamp: _resolveSortTimestamp(
        data['updatedAt'],
        data['createdAt'],
      ),
      price: _formatCurrency(
        (data['totalCarrierPay'] ?? data['totalCustomerRate'] ?? 0) as dynamic,
      ),
    );
  }

  static (String, String) _splitAddress(String address) {
    if (address.isEmpty) return ('-', '-');
    final parts = address
        .split(',')
        .map((part) => part.trim())
        .where((p) => p.isNotEmpty);
    final list = parts.toList();
    if (list.length <= 1) return (address, '-');
    return (list.first, list.sublist(1).join(', '));
  }

  static String _formatDate(dynamic rawValue) {
    if (rawValue == null) return '-';
    if (rawValue is Timestamp) {
      return DateFormat('MMM d, y').format(rawValue.toDate());
    }

    final value = rawValue.toString().trim();
    if (value.isEmpty) return '-';
    final parsed = DateTime.tryParse(value);
    if (parsed != null) {
      return DateFormat('MMM d, y').format(parsed);
    }
    return value;
  }

  static String _formatMiles(dynamic rawValue) {
    final value = rawValue?.toString().trim() ?? '';
    if (value.isEmpty || value == '0') return '-';
    return value.toLowerCase().contains('mi') ? value : '$value mi';
  }

  static String _formatCurrency(dynamic rawValue) {
    final amount = double.tryParse(rawValue.toString()) ?? 0;
    return NumberFormat.currency(symbol: '\$').format(amount);
  }

  static int _progressForStatus(String rawStatus, String acceptanceStatus) {
    if (rawStatus == 'Completed Toun' ||
        rawStatus == 'Completed' ||
        rawStatus == 'Delivered') {
      return 100;
    }
    if (rawStatus == 'In Transit') return 65;
    if (rawStatus == 'Assigned') return 25;
    if (acceptanceStatus == 'accepted') return 15;
    return 0;
  }

  static DateTime _resolveSortTimestamp(dynamic updatedAt, dynamic createdAt) {
    if (updatedAt is Timestamp) return updatedAt.toDate();
    if (createdAt is Timestamp) return createdAt.toDate();
    return DateTime.fromMillisecondsSinceEpoch(0);
  }
}
