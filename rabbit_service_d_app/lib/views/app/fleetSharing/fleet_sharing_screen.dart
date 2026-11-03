import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'models/fleet_share_model.dart';
import 'widgets/create_borrow_request_sheet.dart';
import 'widgets/create_share_offer_sheet.dart';
import 'widgets/fleet_share_card.dart';

class FleetSharingScreen extends StatefulWidget {
  final String? initialTab;
  final String? highlightShareId;

  const FleetSharingScreen({
    super.key,
    this.initialTab,
    this.highlightShareId,
  });

  @override
  State<FleetSharingScreen> createState() => _FleetSharingScreenState();
}

class _FleetSharingScreenState extends State<FleetSharingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final String currentUId = FirebaseAuth.instance.currentUser?.uid ?? '';
  final String currentEmail =
      FirebaseAuth.instance.currentUser?.email?.trim().toLowerCase() ?? '';

  String _effectiveUserId = '';
  String _role = '';
  String _ownerName = '';
  String _ownerCompanyName = '';
  bool _isLoadingUser = true;

  StreamSubscription? _sharesSub;
  List<FleetShareDoc> _allShares = [];
  bool _isLoadingShares = true;

  List<LocalFleetVehicle> _myVehicles = [];
  bool _isLoadingVehicles = true;
  StreamSubscription? _vehiclesSub1;
  StreamSubscription? _vehiclesSub2;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _effectiveUserId = currentUId;

    int initialIndex = 0;
    if (widget.initialTab == 'borrowed') initialIndex = 1;
    if (widget.initialTab == 'requests') initialIndex = 2;
    if (widget.initialTab == 'history') initialIndex = 3;

    _tabController =
        TabController(length: 4, vsync: this, initialIndex: initialIndex);

    _loadUserAndStreams();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _sharesSub?.cancel();
    _vehiclesSub1?.cancel();
    _vehiclesSub2?.cancel();
    super.dispose();
  }

  Future<void> _loadUserAndStreams() async {
    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userDoc.exists) {
        final data = userDoc.data() as Map<String, dynamic>;
        final role = (data['role'] ?? '').toString();
        final createdBy = (data['createdBy'] ?? '').toString();

        _role = role;
        if (role == 'SubOwner' || role == 'Manager' || role == 'Accountant') {
          _effectiveUserId = createdBy.isNotEmpty ? createdBy : currentUId;
        } else {
          _effectiveUserId = currentUId;
        }

        _ownerName =
            (data['userName'] ?? data['name'] ?? 'Fleet Owner').toString();
        _ownerCompanyName =
            (data['companyName'] ?? data['carrierName'] ?? '').toString();
      }
    } catch (e) {
      _effectiveUserId = currentUId;
    } finally {
      if (mounted) setState(() => _isLoadingUser = false);
      _listenToFleetShares();
      _listenToMyVehicles();
    }
  }

  void _listenToMyVehicles() {
    _vehiclesSub1?.cancel();
    _vehiclesSub2?.cancel();

    final targetUid =
        _effectiveUserId.isNotEmpty ? _effectiveUserId : currentUId;
    if (targetUid.isEmpty) return;

    final vehiclesMap = <String, LocalFleetVehicle>{};

    void updateFromSnap(QuerySnapshot snap) {
      for (var doc in snap.docs) {
        final v = LocalFleetVehicle.fromFirestore(doc);
        vehiclesMap[v.id] = v;
      }
      final list = vehiclesMap.values.toList()
        ..sort((a, b) => a.vehicleNumber
            .toLowerCase()
            .compareTo(b.vehicleNumber.toLowerCase()));

      if (mounted) {
        setState(() {
          _myVehicles = list;
          _isLoadingVehicles = false;
        });
      }
    }

    _vehiclesSub1 = FirebaseFirestore.instance
        .collection('Users')
        .doc(targetUid)
        .collection('Vehicles')
        .snapshots()
        .listen(updateFromSnap, onError: (e) {
      if (mounted) setState(() => _isLoadingVehicles = false);
    });

    if (currentUId.isNotEmpty && currentUId != targetUid) {
      _vehiclesSub2 = FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .snapshots()
          .listen(updateFromSnap, onError: (_) {});
    }
  }

  void _listenToFleetShares() {
    // Listen to all fleet_shares documents in real-time
    // We fetch root collection and filter in-memory for both Lender and Borrower IDs/Emails
    _sharesSub?.cancel();
    _sharesSub = FirebaseFirestore.instance
        .collection('fleet_shares')
        .snapshots()
        .listen((snapshot) {
      final list = <FleetShareDoc>[];
      for (var doc in snapshot.docs) {
        final share = FleetShareDoc.fromFirestore(doc);

        final matchesLender = share.isLender(_effectiveUserId, currentEmail) ||
            share.isLender(currentUId);
        final matchesBorrower =
            share.isBorrower(_effectiveUserId, currentEmail) ||
                share.isBorrower(currentUId);

        if (matchesLender || matchesBorrower) {
          list.add(share);
        }
      }

      // Sort by creation date descending
      list.sort((a, b) {
        final dtA = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final dtB = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return dtB.compareTo(dtA);
      });

      if (mounted) {
        setState(() {
          _allShares = list;
          _isLoadingShares = false;
        });
      }
    }, onError: (err) {
      if (mounted) {
        setState(() => _isLoadingShares = false);
      }
    });
  }

  // Action: Open Offer Sheet
  void _openOfferSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CreateShareOfferSheet(
        effectiveUserId: _effectiveUserId,
        currentUId: currentUId,
        ownerName: _ownerName,
        ownerCompanyName: _ownerCompanyName,
        preloadedVehicles: _myVehicles,
      ),
    );
  }

  // Action: Open Borrow Request Sheet
  void _openRequestSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CreateBorrowRequestSheet(
        effectiveUserId: _effectiveUserId,
        currentUId: currentUId,
        ownerName: _ownerName,
        ownerCompanyName: _ownerCompanyName,
      ),
    );
  }

  // Filter lists based on tab
  List<FleetShareDoc> _filterByTab(int tabIndex) {
    var list = _allShares;

    // Search filter
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((s) {
        final code = s.shareCode.toLowerCase();
        final lName = s.lenderName.toLowerCase();
        final bName = s.borrowerName.toLowerCase();
        final lComp = s.lenderCompanyName.toLowerCase();
        final bComp = s.borrowerCompanyName.toLowerCase();
        final vehs =
            s.vehicles.map((v) => v.vehicleNumber.toLowerCase()).join(' ');
        return code.contains(q) ||
            lName.contains(q) ||
            bName.contains(q) ||
            lComp.contains(q) ||
            bComp.contains(q) ||
            vehs.contains(q);
      }).toList();
    }

    switch (tabIndex) {
      case 0: // Lent Out
        return list.where((s) {
          final isLender = s.isLender(_effectiveUserId, currentEmail) ||
              s.isLender(currentUId);
          return isLender && s.isActive;
        }).toList();

      case 1: // Borrowed
        return list.where((s) {
          final isBorrower = s.isBorrower(_effectiveUserId, currentEmail) ||
              s.isBorrower(currentUId);
          return isBorrower && s.isActive;
        }).toList();

      case 2: // Requests (Pending)
        return list.where((s) => s.isPending).toList();

      case 3: // History
        return list
            .where((s) => s.isCompleted || s.isRejected || s.isCancelled)
            .toList();

      default:
        return list;
    }
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: kWhite,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: color.withOpacity(0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: appStyle(11, kGray, FontWeight.normal)),
                Icon(icon, size: 16.sp, color: color),
              ],
            ),
            SizedBox(height: 6.h),
            Text(value, style: appStyle(18, color, FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 40.h, horizontal: 24.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 54.sp, color: kGrayLight.withOpacity(0.8)),
            SizedBox(height: 12.h),
            Text(
              message,
              textAlign: TextAlign.center,
              style: appStyle(14, kGray, FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabListView(int tabIndex, String emptyMsg, IconData emptyIcon) {
    final list = _filterByTab(tabIndex);

    if (_isLoadingShares) {
      return const Center(child: CircularProgressIndicator());
    }

    if (list.isEmpty) {
      return _buildEmptyState(emptyMsg, emptyIcon);
    }

    return ListView.builder(
      padding: EdgeInsets.only(top: 8.h, bottom: 80.h),
      itemCount: list.length,
      itemBuilder: (context, index) {
        return FleetShareCard(
          share: list[index],
          effectiveUserId: _effectiveUserId,
          currentUId: currentUId,
          currentEmail: currentEmail,
          preloadedVehicles: _myVehicles,
        );
      },
    );
  }

  Widget _buildTabItem(String title, int count, Color badgeColor) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title),
          if (count > 0) ...[
            SizedBox(width: 6.w),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(10.r),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lentCount = _allShares
        .where((s) =>
            (s.isLender(_effectiveUserId, currentEmail) ||
                s.isLender(currentUId)) &&
            s.isActive)
        .fold<int>(0,
            (sum, s) => sum + (s.vehicles.isNotEmpty ? s.vehicles.length : 1));

    final borrowedCount = _allShares
        .where((s) =>
            (s.isBorrower(_effectiveUserId, currentEmail) ||
                s.isBorrower(currentUId)) &&
            s.isActive)
        .fold<int>(0,
            (sum, s) => sum + (s.vehicles.isNotEmpty ? s.vehicles.length : 1));

    final pendingCount = _allShares.where((s) => s.isPending).length;
    final requestsTabCount = pendingCount;

    final lentTabCount = _allShares
        .where((s) =>
            (s.isLender(_effectiveUserId, currentEmail) ||
                s.isLender(currentUId)) &&
            s.isActive)
        .length;

    final borrowedTabCount = _allShares
        .where((s) =>
            (s.isBorrower(_effectiveUserId, currentEmail) ||
                s.isBorrower(currentUId)) &&
            s.isActive)
        .length;

    final historyTabCount = _allShares
        .where((s) => s.isCompleted || s.isRejected || s.isCancelled)
        .length;

    return Scaffold(
      backgroundColor: kLightWhite,
      appBar: AppBar(
        backgroundColor: kWhite,
        elevation: 0.5,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kDark, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title:
            Text("Fleet Sharing", style: appStyle(18, kDark, FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: kDark),
            onPressed: () {
              setState(() => _isLoadingShares = true);
              _listenToFleetShares();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // KPI Summary Row
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 14.h, 16.w, 6.h),
            child: Row(
              children: [
                _buildKpiCard(
                  title: "Lent Out",
                  value: "$lentCount",
                  icon: Icons.upload_rounded,
                  color: kPrimary,
                ),
                SizedBox(width: 8.w),
                _buildKpiCard(
                  title: "Borrowed",
                  value: "$borrowedCount",
                  icon: Icons.download_rounded,
                  color: kSecondary,
                ),
                SizedBox(width: 8.w),
                _buildKpiCard(
                  title: "Requests",
                  value: "$pendingCount",
                  icon: Icons.pending_actions_rounded,
                  color: Colors.amber.shade800,
                ),
              ],
            ),
          ),

          // Search Field
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
            child: Container(
              height: 42.h,
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.circular(10.r),
                border: Border.all(color: kGrayLight.withOpacity(0.3)),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val.trim()),
                decoration: InputDecoration(
                  hintText: "Search by code, partner, or vehicle...",
                  hintStyle: appStyle(12, kGray, FontWeight.normal),
                  prefixIcon: const Icon(Icons.search, size: 20, color: kGray),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 10.h),
                ),
              ),
            ),
          ),

          // Tab Bar
          Container(
            color: kWhite,
            width: double.infinity,
            alignment: Alignment.centerLeft,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: kPrimary,
              unselectedLabelColor: kGray,
              indicatorColor: kPrimary,
              indicatorWeight: 2.5,
              labelPadding: EdgeInsets.symmetric(horizontal: 16.w),
              labelStyle: appStyle(13, kPrimary, FontWeight.bold),
              unselectedLabelStyle: appStyle(13, kGray, FontWeight.normal),
              tabs: [
                _buildTabItem("Lent Out", lentTabCount, kPrimary),
                _buildTabItem("Borrowed", borrowedTabCount, kSecondary),
                _buildTabItem(
                    "Requests", requestsTabCount, Colors.amber.shade800),
                _buildTabItem("History", historyTabCount, kGray),
              ],
            ),
          ),

          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTabListView(
                  0,
                  "No vehicles currently lent out.",
                  Icons.local_shipping_outlined,
                ),
                _buildTabListView(
                  1,
                  "No partner vehicles currently borrowed.",
                  Icons.rv_hookup_outlined,
                ),
                _buildTabListView(
                  2,
                  "No pending fleet sharing requests.",
                  Icons.pending_actions_outlined,
                ),
                _buildTabListView(
                  3,
                  "No fleet sharing history records.",
                  Icons.history_outlined,
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: "btn_request_fleet",
            onPressed: _openRequestSheet,
            backgroundColor: kWhite,
            foregroundColor: kPrimary,
            elevation: 3,
            icon: const Icon(Icons.rv_hookup_rounded, size: 20),
            label: Text("Request Equipment",
                style: appStyle(12, kPrimary, FontWeight.bold)),
          ),
          SizedBox(height: 10.h),
          FloatingActionButton.extended(
            heroTag: "btn_lend_fleet",
            onPressed: _openOfferSheet,
            backgroundColor: kPrimary,
            foregroundColor: kWhite,
            elevation: 3,
            icon: const Icon(Icons.share_location_rounded, size: 20),
            label: Text("Lend Equipment",
                style: appStyle(12, kWhite, FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
