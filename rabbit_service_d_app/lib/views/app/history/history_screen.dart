import 'dart:async';
import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/views/app/auth/login_screen.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/cloud_noti_msg.dart';
import 'package:regal_service_d_app/views/app/myJobs/widgets/my_jobs_card.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  User? get currentUser => FirebaseAuth.instance.currentUser;
  String get currentUId => currentUser?.uid ?? '';

  final DashboardController _dashboardController =
      Get.find<DashboardController>();

  // Common fleet owner ID (anchor for jobs across all team members)
  String get effectiveOwnerId => _dashboardController.effectiveOwnerId;
  String get _effectiveUserId => effectiveOwnerId;

  StreamSubscription<QuerySnapshot>? _assignedVehiclesSub;
  final Set<String> _assignedVehicleNumbers = {};
  final Set<String> _assignedVehicleIds = {};

  String _selectedSortOption = "Sort";
  int? _selectedCardIndex;

  @override
  void initState() {
    super.initState();
    _loadAndListenAssignedVehicles();
  }

  @override
  void dispose() {
    _assignedVehiclesSub?.cancel();
    super.dispose();
  }

  void _loadAndListenAssignedVehicles() {
    if (currentUser == null) return;

    // 1. Check direct user document for assigned vehicles
    FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .get()
        .then((doc) {
      if (doc.exists && doc.data() != null) {
        final uData = doc.data()!;
        final directLists = [
          if (uData['assignVehicle'] is List)
            ...(uData['assignVehicle'] as List),
          if (uData['selectedVehicles'] is List)
            ...(uData['selectedVehicles'] as List),
          if (uData['assignedVehicles'] is List)
            ...(uData['assignedVehicles'] as List),
        ];
        for (var item in directLists) {
          final str = item.toString().trim().toLowerCase();
          if (str.isNotEmpty) {
            _assignedVehicleIds.add(str);
            _assignedVehicleNumbers.add(str);
          }
        }
        if (mounted) setState(() {});
      }
    }).catchError((e) {
      log("Error fetching user doc assigned vehicles in history: $e");
    });

    // 2. Listen to Users/{currentUId}/Vehicles subcollection
    _assignedVehiclesSub?.cancel();
    _assignedVehiclesSub = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('Vehicles')
        .snapshots()
        .listen((snap) {
      for (var doc in snap.docs) {
        _assignedVehicleIds.add(doc.id.trim().toLowerCase());
        final data = doc.data();
        final vNum = (data['vehicleNumber'] ??
                data['vehicle_number'] ??
                data['number'] ??
                doc.id)
            .toString()
            .trim();
        if (vNum.isNotEmpty) {
          _assignedVehicleNumbers.add(vNum.toLowerCase());
          final clean = _cleanVehicleNum(vNum);
          if (clean.isNotEmpty) {
            _assignedVehicleNumbers.add(clean);
          }
        }
      }
      if (mounted) setState(() {});
    }, onError: (e) {
      log("Error listening to assigned vehicles in history: $e");
    });
  }

  String _cleanVehicleNum(String input) {
    if (input.contains('(')) {
      return input.split('(').first.trim().toLowerCase();
    }
    return input.trim().toLowerCase();
  }

  bool _isJobVisibleToUser(Map<String, dynamic> job) {
    // 1. Fleet Owner sees all jobs
    if (_dashboardController.role == 'Owner') {
      return true;
    }

    // 2. Creator of this job always sees it
    final creatorId =
        (job['userId'] ?? job['creatorId'] ?? '').toString().trim();
    if (creatorId.isNotEmpty && creatorId == currentUId) {
      return true;
    }

    // 3. If no specific vehicles assigned (e.g. SubOwner with full access), show all
    if (_assignedVehicleNumbers.isEmpty && _assignedVehicleIds.isEmpty) {
      return true;
    }

    final vNum = (job['vehicleNumber'] ?? '').toString().trim().toLowerCase();
    final cleanNum = _cleanVehicleNum(vNum);
    final vId = (job['vehicleId'] ?? '').toString().trim().toLowerCase();

    // 4. Check matching vehicle ID or vehicle number
    if (vId.isNotEmpty && _assignedVehicleIds.contains(vId)) {
      return true;
    }
    if (vNum.isNotEmpty &&
        (_assignedVehicleNumbers.contains(vNum) ||
            _assignedVehicleIds.contains(vNum))) {
      return true;
    }
    if (cleanNum.isNotEmpty && _assignedVehicleNumbers.contains(cleanNum)) {
      return true;
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "History",
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(20, kDark, FontWeight.normal)),
        actions: buildAppBarActions(),
      ),
      body: buildBody(),
    );
  }

  Widget buildBody() {
    if (currentUser == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Please login to view this page"),
            SizedBox(height: 20.h),
            ElevatedButton(
              onPressed: () {
                Get.to(() => const LoginScreen(),
                    transition: Transition.cupertino,
                    duration: const Duration(milliseconds: 900));
              },
              child: Text("Login"),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Padding(
        padding:
            kIsWeb ? const EdgeInsets.all(30.0) : const EdgeInsets.all(8.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            if (_selectedCardIndex == null)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: kPrimary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8.0.r),
                    ),
                    child: PopupMenuButton<String>(
                      onSelected: (value) {
                        setState(() {
                          _selectedSortOption = value;
                        });
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: "Completed",
                          child: Text("Completed"),
                        ),
                        PopupMenuItem(
                          value: "Cancelled",
                          child: Text("Cancelled"),
                        ),
                      ],
                      child: Row(
                        children: [
                          Icon(Icons.sort, color: kPrimary),
                          SizedBox(width: 4.w),
                          Text(
                            _selectedSortOption,
                            style: kIsWeb
                                ? TextStyle(color: kPrimary)
                                : appStyle(16.sp, kPrimary, FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            SizedBox(height: 10.h),
            StreamBuilder(
              stream: _getFilteredHistoryStream(),
              builder: (BuildContext context,
                  AsyncSnapshot<QuerySnapshot> snapshot) {
                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator();
                }

                final allDocs = snapshot.data!.docs;

                // Filter jobs: Owner sees all; Team members see only jobs matching their assigned vehicles (or jobs they created)
                final data = allDocs.where((doc) {
                  final job = doc.data() as Map<String, dynamic>;
                  return _isJobVisibleToUser(job);
                }).toList();

                return data.isEmpty
                    ? Center(child: Text("No History found!"))
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: data.length,
                        itemBuilder: (context, index) {
                          final job =
                              data[index].data() as Map<String, dynamic>;
                          final vehicleNumber = job['vehicleNumber'] ?? "N/A";

                          DateTime orderDateTime;
                          if (job['orderDate'] is Timestamp) {
                            orderDateTime = (job['orderDate'] as Timestamp)
                                .toDate()
                                .toLocal();
                          } else {
                            // Handle cases where 'orderDate' is not a Timestamp
                            orderDateTime = DateTime
                                .now(); // Fallback to current time or handle appropriately
                          }
                          return MyJobsCard(
                            companyNameAndVehicleName: "${vehicleNumber}",
                            address: job["userDeliveryAddress"].toString(),
                            serviceName: job["selectedService"].toString(),
                            cancelationReason: job["cancelReason"].toString(),
                            jobId: job["orderId"].toString(),
                            imagePath: job["userPhoto"].toString().isEmpty
                                ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                : job["userPhoto"].toString(),
                            dateTime: orderDateTime,
                            currentStatus: job["status"],
                            userLat: job["userLat"],
                            userLong: job["userLong"],
                            description: job["description"].toString(),
                          );
                        },
                      );
              },
            ),
            SizedBox(height: 50.h)
          ],
        ),
      ),
    );
  }

  List<Widget> buildAppBarActions() {
    if (currentUser == null) return [];

    return [
      StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('UserNotifications')
            .where('isRead', isEqualTo: false)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Container();
          }
          int unreadCount = snapshot.data!.docs.length;
          return unreadCount > 0
              ? Badge(
                  backgroundColor: kSecondary,
                  label: Text(unreadCount.toString(),
                      style: appStyle(12, kWhite, FontWeight.normal)),
                  child: GestureDetector(
                    onTap: () => Get.to(() => CloudNotificationMessageCenter(
                        currentUId: currentUId)),
                    child: CircleAvatar(
                        backgroundColor: kPrimary,
                        radius: 17.r,
                        child: Icon(Icons.notifications,
                            size: 25.sp, color: kWhite)),
                  ),
                )
              : Badge(
                  backgroundColor: kSecondary,
                  label: Text(unreadCount.toString(),
                      style: appStyle(12, kWhite, FontWeight.normal)),
                  child: GestureDetector(
                    onTap: () => Get.to(() => CloudNotificationMessageCenter(
                        currentUId: currentUId)),
                    child: CircleAvatar(
                        backgroundColor: kPrimary,
                        radius: 17.r,
                        child: Icon(Icons.notifications,
                            size: 25.sp, color: kWhite)),
                  ),
                );
        },
      ),
      SizedBox(width: 10.w),
      GestureDetector(
        onTap: () => Get.to(() => const ProfileScreen(),
            transition: Transition.cupertino,
            duration: const Duration(milliseconds: 900)),
        child: CircleAvatar(
          radius: 19.r,
          backgroundColor: kPrimary,
          child: StreamBuilder<DocumentSnapshot>(
            stream: FirebaseFirestore.instance
                .collection('Users')
                .doc(currentUId)
                .snapshots(),
            builder: (BuildContext context,
                AsyncSnapshot<DocumentSnapshot> snapshot) {
              if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                // return Container();
                return const CircularProgressIndicator();
              }

              final data = snapshot.data!.data() as Map<String, dynamic>;
              final userPhoto = data['profilePicture'] ?? '';
              final userName = data['userName'] ?? '';

              if (userPhoto.isEmpty) {
                return Text(
                  userName.isNotEmpty ? userName[0] : '',
                  style: appStyle(20, kWhite, FontWeight.w500),
                );
              } else {
                return ClipOval(
                  child: Image.network(
                    userPhoto,
                    width: 38.r,
                    height: 35.r,
                    fit: BoxFit.cover,
                  ),
                );
              }
            },
          ),
        ),
      ),
      SizedBox(width: 20.w),
    ];
  }

  /// This method returns a Firestore query stream based on the selected sort option.
  Stream<QuerySnapshot> _getFilteredHistoryStream() {
    final collection = FirebaseFirestore.instance
        .collection('Users')
        .doc(_effectiveUserId)
        .collection("history")
        .orderBy("orderDate", descending: true);

    if (_selectedSortOption == "Cancelled") {
      return collection.where("status", isEqualTo: -1).snapshots();
    } else if (_selectedSortOption == "Completed") {
      return collection.where("status", isEqualTo: 5).snapshots();
    } else {
      // Default: show both Cancelled (-1) and Completed (5)
      return collection.where("status", whereIn: [-1, 5]).snapshots();
    }
  }
}
