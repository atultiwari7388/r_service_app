import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/notification_detail_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class CloudNotificationMessageCenter extends StatelessWidget {
  CloudNotificationMessageCenter({super.key});
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  Future<Map<String, dynamic>> getVehicleDetails(String vehicleId) async {
    DocumentSnapshot vehicleDoc = await FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection('Vehicles')
        .doc(vehicleId)
        .get();
    return vehicleDoc.data() as Map<String, dynamic>;
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

          var notifications = snapshot.data!.docs;

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
            String date = DateFormat('yyyy-MM-dd').format(
              (doc['date'] as Timestamp).toDate(),
            );
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

              String dayMonth = DateFormat('d MMMM')
                  .format(DateTime.parse(dateKey)); // e.g., "9 January"
              String year = DateFormat('yyyy').format(DateTime.parse(dateKey));

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 8),
                  ...dateNotifications.map((doc) {
                    var notification = doc.data() as Map<String, dynamic>;
                    return FutureBuilder<Map<String, dynamic>>(
                      future: getVehicleDetails(notification['vehicleId']),
                      builder: (context, vehicleSnapshot) {
                        if (!vehicleSnapshot.hasData) {
                          return SizedBox.shrink();
                        }

                        var vehicleData = vehicleSnapshot.data!;

                        return Padding(
                          padding: const EdgeInsets.all(5.0),
                          child: NotificationCard(
                            dayMonth: dayMonth,
                            year: year,
                            message: notification['message'],
                            vehicleName: vehicleData['companyName'],
                            vehicleNumber: vehicleData['vehicleNumber'],
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
  final String message;
  final String vehicleName;
  final String vehicleNumber;
  final VoidCallback onView;
  final VoidCallback onReadVehicle;
  final String dayMonth;
  final String year;

  const NotificationCard({
    super.key,
    required this.message,
    required this.vehicleName,
    required this.vehicleNumber,
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Service Reminder",
                        style: appStyle(15, kDark, FontWeight.bold),
                      ),
                      Container(
                        padding: EdgeInsets.all(5),
                        decoration: BoxDecoration(
                            color: kPrimary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12.r)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              dayMonth,
                              style: appStyle(10, kDark, FontWeight.normal),
                            ),
                            SizedBox(width: 5),
                            Text(
                              year,
                              style: appStyle(10, kDark, FontWeight.w400),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4.0),
                  Text(
                    "$vehicleName ($vehicleNumber)",
                    style: appStyle(14, kDark, FontWeight.normal),
                  ),
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
                          child: Text("Read",
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
