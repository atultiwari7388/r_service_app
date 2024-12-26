import 'package:flutter/material.dart';

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Service Reminder"),
      ),
      body: Container(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              "Service Reminder",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),
            Text(
              "Your car is due for service. Please visit the nearest service center to get your car serviced.",
              style: TextStyle(
                fontSize: 16,
              ),
            ),
            SizedBox(height: 20),
            Text(
              "Service Center: XYZ Service Center",
              style: TextStyle(
                fontSize: 16,
              ),
            ),
            SizedBox(height: 20),
            Text(
              "Service Date: 12th June 2021",
              style: TextStyle(
                fontSize: 16,
              ),
            ),
            SizedBox(height: 20),
            Text(
              "Service Time: 10:00 AM",
              style: TextStyle(
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
