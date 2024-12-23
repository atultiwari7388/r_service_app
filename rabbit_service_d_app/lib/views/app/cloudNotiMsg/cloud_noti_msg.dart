import 'package:flutter/material.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class CloudNotificationMessageCenter extends StatelessWidget {
  const CloudNotificationMessageCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notification Center"),
        elevation: 1,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(8.0),
        itemCount: 10, // Example count
        itemBuilder: (ctx, index) {
          return NotificationCard(
            message:
                "Hey User, it's time to service your vehicle. Your mileage has reached ${120000 + index * 6000} miles.",
            onRead: () {
              // Handle "Read" button action
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text("Message $index marked as read."),
                ),
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
  final VoidCallback onRead;

  const NotificationCard({
    super.key,
    required this.message,
    required this.onRead,
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
                    message,
                    style: appStyle(16, kDark, FontWeight.normal),
                  ),
                  const SizedBox(height: 8.0),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      onPressed: onRead,
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
                      child: Text("Mark as Read",
                          style: appStyle(15, kWhite, FontWeight.normal)),
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
