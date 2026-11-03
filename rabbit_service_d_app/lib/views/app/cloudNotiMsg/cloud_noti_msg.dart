import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/notification_detail_screen.dart';
import 'package:regal_service_d_app/views/app/fleetSharing/fleet_sharing_screen.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/truck_disptach_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class CloudNotificationMessageCenter extends StatelessWidget {
  CloudNotificationMessageCenter({super.key, required this.currentUId});
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  final String currentUId;

  bool isDispatchLoadNotification(Map<String, dynamic> notification) {
    return (notification['type'] ?? notification['category'] ?? '')
            .toString()
            .toLowerCase() ==
        'dispatch_load';
  }

  bool isFleetSharingNotification(Map<String, dynamic> notification) {
    final type = (notification['type'] ?? notification['category'] ?? '')
        .toString()
        .toLowerCase();
    return type.contains('fleet_sharing') ||
        type.contains('fleet_share') ||
        type.contains('fleetsharing') ||
        notification['shareId'] != null;
  }

  DateTime? parseNotificationDate(dynamic dateVal) {
    if (dateVal is Timestamp) return dateVal.toDate();
    if (dateVal is DateTime) return dateVal;
    if (dateVal is String) return DateTime.tryParse(dateVal);
    if (dateVal is int) return DateTime.fromMillisecondsSinceEpoch(dateVal);
    return null;
  }

  Future<Map<String, dynamic>?> getVehicleDetails(String? vehicleId) async {
    if (vehicleId == null || vehicleId.trim().isEmpty) return null;
    try {
      DocumentSnapshot vehicleDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .doc(vehicleId)
          .get();
      if (!vehicleDoc.exists || vehicleDoc.data() == null) {
        return null;
      }
      return vehicleDoc.data() as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<void> markAsRead(String notificationId) async {
    await FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('UserNotifications')
        .doc(notificationId)
        .update({'isRead': true});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notification Center"),
        elevation: 1,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .collection('UserNotifications')
            .where('isRead', isEqualTo: false)
            .orderBy('date', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          var rawDocs = snapshot.data!.docs;

          // Filter out malformed documents
          var notifications = rawDocs.where((doc) {
            final data = doc.data() as Map<String, dynamic>?;
            if (data == null) return false;
            return true;
          }).toList();

          if (notifications.isEmpty) {
            return Center(
              child: Text(
                "No notification found",
                style: appStyle(18, kDark, FontWeight.w500),
              ),
            );
          }

          // Group notifications by date while maintaining descending order
          Map<String, List<QueryDocumentSnapshot>> groupedNotifications = {};
          for (var doc in notifications) {
            final data = doc.data() as Map<String, dynamic>;
            final parsedDate =
                parseNotificationDate(data['date']) ?? DateTime.now();
            String date = DateFormat('yyyy-MM-dd').format(parsedDate);
            if (!groupedNotifications.containsKey(date)) {
              groupedNotifications[date] = [];
            }
            groupedNotifications[date]!.add(doc);
          }

          // Ensure dates in descending order
          List<String> sortedDates = groupedNotifications.keys.toList()
            ..sort((a, b) => b.compareTo(a)); // Descending order

          return ListView.builder(
            padding: const EdgeInsets.all(2.0),
            itemCount: sortedDates.length,
            itemBuilder: (ctx, index) {
              String dateKey = sortedDates[index];
              List<QueryDocumentSnapshot> dateNotifications =
                  groupedNotifications[dateKey]!;

              DateTime parsedKeyDate =
                  DateTime.tryParse(dateKey) ?? DateTime.now();
              String dayMonth = DateFormat('d MMMM').format(parsedKeyDate);
              String year = DateFormat('yyyy').format(parsedKeyDate);

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 8),
                  ...dateNotifications.map((doc) {
                    var notification = doc.data() as Map<String, dynamic>;
                    if (isDispatchLoadNotification(notification)) {
                      return Padding(
                        padding: const EdgeInsets.all(5.0),
                        child: NotificationCard(
                          dayMonth: dayMonth,
                          year: year,
                          title: (notification['title'] ?? 'New Load Assigned')
                              .toString(),
                          message: (notification['message'] ?? '').toString(),
                          subjectPrimary:
                              (notification['loadNumber'] ?? 'Load').toString(),
                          subjectSecondary: [
                            (notification['pickupCompany'] ?? '').toString(),
                            (notification['deliveryCompany'] ?? '').toString(),
                          ]
                              .where((item) => item.trim().isNotEmpty)
                              .join(' -> '),
                          onView: () async {
                            Get.to(() => const TruckDispatchDashboard());
                          },
                          onReadVehicle: () async {
                            await markAsRead(doc.id);
                          },
                        ),
                      );
                    }

                    if (isFleetSharingNotification(notification)) {
                      return Padding(
                        padding: const EdgeInsets.all(5.0),
                        child: NotificationCard(
                          dayMonth: dayMonth,
                          year: year,
                          title: (notification['title'] ?? 'Fleet Sharing')
                              .toString(),
                          message: (notification['message'] ?? '').toString(),
                          subjectPrimary: (notification['subtitle'] ??
                                  notification['subject'] ??
                                  'Fleet Sharing Update')
                              .toString(),
                          subjectSecondary: '',
                          onView: () async {
                            await markAsRead(doc.id);
                            Get.to(() => const FleetSharingScreen());
                          },
                          onReadVehicle: () async {
                            await markAsRead(doc.id);
                          },
                        ),
                      );
                    }

                    // For vehicle notifications with a valid vehicleId
                    final vehicleId =
                        (notification['vehicleId'] ?? '').toString().trim();
                    if (vehicleId.isNotEmpty) {
                      return FutureBuilder<Map<String, dynamic>?>(
                        future: getVehicleDetails(vehicleId),
                        builder: (context, vehicleSnapshot) {
                          if (vehicleSnapshot.connectionState ==
                              ConnectionState.waiting) {
                            return const SizedBox.shrink();
                          }

                          var vehicleData = vehicleSnapshot.data ?? {};
                          final vehicleNum = (vehicleData['vehicleNumber'] ??
                                  notification['vehicleNumber'] ??
                                  '')
                              .toString();
                          final compName = (vehicleData['companyName'] ??
                                  notification['companyName'] ??
                                  '')
                              .toString();
                          final subjectPrimary = vehicleNum.isNotEmpty
                              ? (compName.isNotEmpty
                                  ? '$vehicleNum ($compName)'
                                  : vehicleNum)
                              : (notification['vehicleName'] ??
                                      'Vehicle Service')
                                  .toString();

                          return Padding(
                            padding: const EdgeInsets.all(5.0),
                            child: NotificationCard(
                              dayMonth: dayMonth,
                              year: year,
                              title:
                                  (notification['title'] ?? "Service Reminder")
                                      .toString(),
                              message:
                                  (notification['message'] ?? '').toString(),
                              subjectPrimary: subjectPrimary,
                              subjectSecondary: '',
                              onView: () async {
                                Get.to(() => NotificationDetailsScreen(
                                      notification: notification,
                                      vehicleData: vehicleData,
                                    ));
                              },
                              onReadVehicle: () async {
                                await markAsRead(doc.id);
                              },
                            ),
                          );
                        },
                      );
                    }

                    // Generic fallback notification (no vehicleId)
                    return Padding(
                      padding: const EdgeInsets.all(5.0),
                      child: NotificationCard(
                        dayMonth: dayMonth,
                        year: year,
                        title: (notification['title'] ?? "Notification")
                            .toString(),
                        message: (notification['message'] ?? '').toString(),
                        subjectPrimary: (notification['subtitle'] ??
                                notification['subject'] ??
                                '')
                            .toString(),
                        subjectSecondary: '',
                        onView: () async {
                          await markAsRead(doc.id);
                        },
                        onReadVehicle: () async {
                          await markAsRead(doc.id);
                        },
                      ),
                    );
                  }).toList(),
                  // SizedBox(height: 16),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class NotificationCard extends StatelessWidget {
  final String title;
  final String message;
  final String subjectPrimary;
  final String subjectSecondary;
  final VoidCallback onView;
  final VoidCallback onReadVehicle;
  final String dayMonth;
  final String year;

  const NotificationCard({
    super.key,
    required this.title,
    required this.message,
    required this.subjectPrimary,
    required this.subjectSecondary,
    required this.onView,
    required this.onReadVehicle,
    required this.dayMonth,
    required this.year,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 2.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
      ),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: kPrimary,
              child: const Icon(Icons.notifications, color: Colors.white),
            ),
            const SizedBox(width: 12.0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: appStyle(15, kDark, FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(
                            color: kPrimary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12.r)),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              dayMonth,
                              style: appStyle(10, kDark, FontWeight.normal),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              year,
                              style: appStyle(10, kDark, FontWeight.w400),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (subjectPrimary.trim().isNotEmpty) ...[
                    const SizedBox(height: 4.0),
                    Text(
                      subjectPrimary,
                      style: appStyle(14, kDark, FontWeight.normal),
                    ),
                  ],
                  if (subjectSecondary.trim().isNotEmpty) ...[
                    const SizedBox(height: 4.0),
                    Text(
                      subjectSecondary,
                      style: appStyle(13, kDarkGray, FontWeight.normal),
                    ),
                  ],
                  const SizedBox(height: 4.0),
                  Text(
                    message,
                    style: appStyle(14, kDark, FontWeight.normal),
                  ),
                  const SizedBox(height: 8.0),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        ElevatedButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) {
                                return AlertDialog(
                                  title: Text('Mark as Read'),
                                  content: Text(
                                      'Are you sure to hide this notification?'),
                                  actions: <Widget>[
                                    TextButton(
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                      },
                                      child: Text('Cancel',
                                          style: appStyle(
                                              16, kRed, FontWeight.w500)),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        onReadVehicle();
                                        Navigator.of(context).pop();
                                      },
                                      child: Text('Mark as Read',
                                          style: appStyle(
                                              16, kSecondary, FontWeight.w500)),
                                    ),
                                  ],
                                );
                              },
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kSecondary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16.0,
                              vertical: 8.0,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                          ),
                          child: Text("Disappear",
                              style: appStyle(14, kWhite, FontWeight.normal)),
                        ),
                        SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: onView,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16.0,
                              vertical: 8.0,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                          ),
                          child: Text("View",
                              style: appStyle(14, kWhite, FontWeight.normal)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
