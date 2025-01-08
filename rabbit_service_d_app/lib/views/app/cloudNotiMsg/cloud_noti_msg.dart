import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/notification_detail_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class CloudNotificationMessageCenter extends StatelessWidget {
  const CloudNotificationMessageCenter({super.key});

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
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          var notifications = snapshot.data!.docs;

          return notifications.isEmpty
              ? Center(
                  child: Text("No notification found",
                      style: appStyle(18, kDark, FontWeight.w500)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(8.0),
                  itemCount: notifications.length,
                  itemBuilder: (ctx, index) {
                    var notification =
                        notifications[index].data() as Map<String, dynamic>;
                    return FutureBuilder<Map<String, dynamic>>(
                      future: getVehicleDetails(notification['vehicleId']),
                      builder: (context, vehicleSnapshot) {
                        if (!vehicleSnapshot.hasData) {
                          return SizedBox.shrink();
                        }

                        var vehicleData = vehicleSnapshot.data!;

                        return NotificationCard(
                          message: notification['message'],
                          vehicleName: vehicleData['companyName'],
                          vehicleNumber: vehicleData['vehicleNumber'],
                          onView: () async {
                            // await markAsRead(notifications[index].id);
                            Get.to(() => NotificationDetailsScreen(
                                  notification: notification,
                                  vehicleData: vehicleData,
                                ));
                          },
                          onReadVehicle: () async {
                            await markAsRead(notifications[index].id);
                          },
                        );
                      },
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

  const NotificationCard({
    super.key,
    required this.message,
    required this.vehicleName,
    required this.vehicleNumber,
    required this.onView,
    required this.onReadVehicle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
      ),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
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
                  Text(
                    "Service Reminder",
                    style: appStyle(18, kDark, FontWeight.bold),
                  ),
                  const SizedBox(height: 4.0),
                  Text(
                    "$vehicleName ($vehicleNumber)",
                    style: appStyle(16, kDark, FontWeight.normal),
                  ),
                  const SizedBox(height: 4.0),
                  Text(
                    message,
                    style: appStyle(16, kDark, FontWeight.normal),
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
                                      onPressed: onReadVehicle,
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
                              style: appStyle(15, kWhite, FontWeight.normal)),
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
                              style: appStyle(15, kWhite, FontWeight.normal)),
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
