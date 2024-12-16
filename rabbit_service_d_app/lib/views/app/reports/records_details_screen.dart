import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/main.dart';

import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';

class RecordsDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const RecordsDetailsScreen({Key? key, required this.record})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final currentMiles = record['currentMilesArray'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Record Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildReusableRowTextWidget("Vehicle :",
                ' ${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})'),
            const SizedBox(height: 16),
            buildReusableRowTextWidget(
                "Workshop :", "${record['workshopName'] ?? 'N/A'}"),
            const SizedBox(height: 16),
            buildReusableRowTextWidget(
                "Invoice :", "${record['invoice'] ?? 'N/A'}"),
            const SizedBox(height: 16),
            if (currentMiles.isNotEmpty) ...[
              const Text(
                "Miles History:",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: currentMiles.length,
                itemBuilder: (context, index) {
                  final mileEntry = currentMiles[index];
                  final date = mileEntry['date'] != null
                      ? mileEntry['date'].toString()
                      : 'Unknown Date';
                  return ListTile(
                    leading: const Icon(Icons.speed),
                    title: Text("Miles: ${mileEntry['miles']}"),
                    subtitle: Text("Date: $date"),
                  );
                },
              ),
            ] else
              const Text("No miles data available."),
            const SizedBox(height: 16),
            const Text(
              "Services:",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...record['services'].map<Widget>((service) {
              final subServices = service['subServices'] as List<dynamic>?;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Service: ${service['serviceName']}"),
                  if (subServices != null && subServices.isNotEmpty)
                    Text(
                        "Sub Services: ${subServices.map((s) => s['name']).join(', ')}"),
                  const SizedBox(height: 8),
                ],
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget buildReusableRowTextWidget(String hText, String vText) {
    return Row(
      children: [
        Text(hText, style: appStyle(15, kDark, FontWeight.w500)),
        SizedBox(
          width: 250.w,
          child: Text(
            vText,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: appStyle(15, kDarkGray, FontWeight.w400),
          ),
        ),
      ],
    );
  }
}
