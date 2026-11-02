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
import '../requests/requests.dart';

class MyJobsScreen extends StatefulWidget {
  const MyJobsScreen({super.key});

  @override
  State<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends State<MyJobsScreen> {
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
      log("Error fetching user doc assigned vehicles: $e");
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
      log("Error listening to assigned vehicles: $e");
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
            text: "My Jobs",
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(20, kDark, FontWeight.normal)),
        actions: currentUser == null
            ? []
            : [
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
                              onTap: () => Get.to(() =>
                                  CloudNotificationMessageCenter(
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
                              onTap: () => Get.to(() =>
                                  CloudNotificationMessageCenter(
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

                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const CircularProgressIndicator();
                        }

                        final data =
                            snapshot.data!.data() as Map<String, dynamic>;
                        final userPhoto = data['profilePicture'] ?? '';
                        final userName = data['userName'] ?? '';

                        if (userPhoto.isEmpty) {
                          return Text(
                            userName.isNotEmpty ? userName[0] : '',
                            style: kIsWeb
                                ? TextStyle(color: kWhite)
                                : appStyle(20, kWhite, FontWeight.w500),
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
              ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
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
        padding: const EdgeInsets.all(8.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            SizedBox(height: 10.h),
            StreamBuilder(
              stream: FirebaseFirestore.instance
                  .collection('Users')
                  .doc(effectiveOwnerId)
                  .collection("history")
                  .where("status", whereIn: [0, 1, 2, 3, 4])
                  .orderBy("orderDate", descending: true)
                  .snapshots(),
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
                    ? Center(child: Text("No Jobs Created"))
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: data.length,
                        itemBuilder: (context, index) {
                          final job =
                              data[index].data() as Map<String, dynamic>;
                          final orderId = job['orderId']?.toString() ?? "";

                          // Bind each job to its live document in root `jobs` collection
                          // so mechanic offers and status changes show in real-time immediately
                          return StreamBuilder<DocumentSnapshot>(
                            stream: FirebaseFirestore.instance
                                .collection('jobs')
                                .doc(orderId)
                                .snapshots(),
                            builder: (context, jobDocSnap) {
                              final liveJob = jobDocSnap.hasData &&
                                      jobDocSnap.data?.data() != null
                                  ? (jobDocSnap.data!.data()
                                      as Map<String, dynamic>)
                                  : job;

                              final vehicleNumber = liveJob['vehicleNumber'] ??
                                  job['vehicleNumber'] ??
                                  "N/A";

                              DateTime orderDateTime;
                              final dateVal =
                                  liveJob['orderDate'] ?? job['orderDate'];
                              if (dateVal is Timestamp) {
                                orderDateTime = dateVal.toDate().toLocal();
                              } else {
                                orderDateTime = DateTime.now();
                              }

                              final mechanicsOffer = (liveJob["mechanicsOffer"]
                                      as List<dynamic>?) ??
                                  (job["mechanicsOffer"] as List<dynamic>?) ??
                                  [];
                              final List<dynamic> images =
                                  liveJob['images'] ?? job['images'] ?? [];
                              final currentStatus =
                                  (liveJob["status"] as num?)?.toInt() ??
                                      (job["status"] as num?)?.toInt() ??
                                      0;
                              final nearByDistance =
                                  liveJob["nearByDistance"] ??
                                      job["nearByDistance"] ??
                                      25;

                              return MyJobsCard(
                                companyNameAndVehicleName: "${vehicleNumber}",
                                address: (liveJob["userDeliveryAddress"] ??
                                        job["userDeliveryAddress"] ??
                                        "")
                                    .toString(),
                                serviceName: (liveJob["selectedService"] ??
                                        job["selectedService"] ??
                                        "")
                                    .toString(),
                                jobId: orderId,
                                imagePath: (liveJob["userPhoto"] ??
                                            job["userPhoto"] ??
                                            "")
                                        .toString()
                                        .isEmpty
                                    ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                    : (liveJob["userPhoto"] ?? job["userPhoto"])
                                        .toString(),
                                dateTime: orderDateTime,
                                onButtonTap: () {
                                  Get.to(() => RequestsScreen(
                                        serviceName: (liveJob[
                                                    "selectedService"] ??
                                                job["selectedService"] ??
                                                "")
                                            .toString(),
                                        id: orderId,
                                        companyAndVehicleName:
                                            "${liveJob["companyName"] ?? job["companyName"]} (${vehicleNumber})",
                                        currentUId: effectiveOwnerId,
                                      ));
                                },
                                onCancelBtnTap: () {
                                  showDialog(
                                    context: context,
                                    builder: (context) {
                                      return AlertDialog(
                                        title: Text(
                                            "Are you sure to cancel this job?"),
                                        actions: [
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(context);
                                            },
                                            child: Text("No"),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(context);
                                              _showReasonDialog(orderId);
                                            },
                                            child: Text("Yes"),
                                          ),
                                        ],
                                      );
                                    },
                                  );
                                },
                                currentStatus: currentStatus,
                                nearByDistance: nearByDistance,
                                onDistanceChanged: (newDistance) {
                                  _updateNearbyDistance(
                                      newDistance, nearByDistance, orderId);
                                },
                                userLat:
                                    liveJob["userLat"] ?? job["userLat"] ?? 0,
                                userLong:
                                    liveJob["userLong"] ?? job["userLong"] ?? 0,
                                mechanicOffers: mechanicsOffer,
                                description: (liveJob["description"] ??
                                        job["description"] ??
                                        "")
                                    .toString(),
                                images: images,
                                isImage: liveJob["isImageSelected"] ??
                                    job["isImageSelected"] ??
                                    false,
                              );
                            },
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

  void _updateNearbyDistance(
      num newDistance, num nearByDistance, String jobId) async {
    try {
      var data = {
        "nearByDistance": newDistance,
      };

      // Update the Firestore `jobs` collection
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(jobId)
          .update(data);

      // Check if the history document exists
      DocumentReference historyDoc = await FirebaseFirestore.instance
          .collection("Users")
          .doc(_effectiveUserId) // Use effective user ID
          .collection("history")
          .doc(jobId);

      // Get the history document snapshot
      DocumentSnapshot docSnapshot = await historyDoc.get();

      if (docSnapshot.exists) {
        // If document exists, update it
        await historyDoc.update(data);
      } else {
        // If document does not exist, create it
        await historyDoc.set(data);
      }

      final jobSnap = await FirebaseFirestore.instance.collection('jobs').doc(jobId).get();
      final creatorId = jobSnap.data()?['userId']?.toString();
      if (creatorId != null && creatorId.isNotEmpty && creatorId != _effectiveUserId) {
        DocumentReference creatorHistoryDoc = FirebaseFirestore.instance
            .collection("Users")
            .doc(creatorId)
            .collection("history")
            .doc(jobId);
        DocumentSnapshot creatorSnap = await creatorHistoryDoc.get();
        if (creatorSnap.exists) {
          await creatorHistoryDoc.update(data);
        }
      }

      setState(() {
        nearByDistance = newDistance;
      });

      Get.snackbar("Success", "Nearby distance updated to $newDistance km.",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white);
    } catch (error) {
      Get.snackbar("Error", "Failed to update distance: $error",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    }
  }

  void _showReasonDialog(String orderId) {
    List<String> reasons = [
      'Mechanic Late',
      'Mis-Communication',
      'Language Problem',
      'Other'
    ];

    String? selectedReason;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Select Reason:"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: reasons.map((reason) {
              return RadioListTile<String>(
                title: Text(reason),
                value: reason,
                groupValue: selectedReason,
                onChanged: (value) {
                  setState(() {
                    selectedReason = value!;
                  });
                  Navigator.pop(context);
                  _updateJobStatus(orderId, selectedReason!);
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }

  void _updateJobStatus(String orderId, String reason) async {
    try {
      // Fetch the job document to access the mechanicsOffer list
      DocumentSnapshot jobSnapshot = await FirebaseFirestore.instance
          .collection('jobs')
          .doc(orderId)
          .get();

      Map<String, dynamic>? jobData =
          jobSnapshot.data() as Map<String, dynamic>?;

      List<dynamic> mechanicsOffer = jobData?['mechanicsOffer'] ?? [];

      // Update the status in each mechanic's offer if mechanicsOffer is not empty
      if (mechanicsOffer.isNotEmpty) {
        mechanicsOffer = mechanicsOffer.map((offer) {
          final offerData = offer as Map<String, dynamic>;
          offerData['status'] = -1;
          return offerData;
        }).toList();
      }

      final data = {
        'status': -1,
        'cancelReason': reason,
        'cancelBy': 'Driver',
        'mechanicsOffer': mechanicsOffer,
      };

      // Update the job document in Firestore
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(orderId)
          .update(data);

      // Update the job in the user's history subcollection using effective user ID
      await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId) // Use effective user ID
          .collection('history')
          .doc(orderId)
          .update(data);

      final creatorId = jobData?['userId']?.toString();
      if (creatorId != null && creatorId.isNotEmpty && creatorId != _effectiveUserId) {
        final creatorHistoryRef = FirebaseFirestore.instance
            .collection('Users')
            .doc(creatorId)
            .collection('history')
            .doc(orderId);
        final creatorSnap = await creatorHistoryRef.get();
        if (creatorSnap.exists) {
          await creatorHistoryRef.update(data);
        }
      }

      print("Updated mechanicsOffer: $mechanicsOffer");

      Get.snackbar(
        "Job Cancelled",
        "The job was cancelled due to: $reason",
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.green,
        colorText: Colors.white,
      );
    } catch (error) {
      Get.snackbar(
        "Error",
        "Failed to cancel job: $error",
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }
}
