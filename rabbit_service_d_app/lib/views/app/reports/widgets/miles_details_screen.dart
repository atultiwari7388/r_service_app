import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/dashed_divider.dart';

class MilesDetailsScreen extends StatelessWidget {
  const MilesDetailsScreen({super.key, required this.milesRecord});
  final Map<String, dynamic> milesRecord;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Miles Record"),
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                '${milesRecord['vehicleNumber']} (${milesRecord['companyName']})',
                style: appStyleUniverse(18, kDark, FontWeight.w500)),
            const SizedBox(height: 8.0),
            Text("Engine: ${milesRecord['engineName']}",
                style: appStyleUniverse(18, kDark, FontWeight.w500)),
            const SizedBox(height: 8.0),
            Text("Total Miles: ${milesRecord['currentMiles']}",
                style: appStyleUniverse(18, kDark, FontWeight.normal)),
            const SizedBox(height: 8.0),
            Text(
              'Miles Record: ${milesRecord['currentMilesArray']?.length ?? 0}',
              style: appStyleUniverse(18, kDarkGray, FontWeight.normal),
            ),
            SizedBox(height: 7),
            if (milesRecord['currentMilesArray'] != null)
              ...milesRecord['currentMilesArray'].map<Widget>((milesRecord) {
                final date = DateFormat('dd-MM-yyyy')
                    .format(DateTime.parse(milesRecord['date']));
                final miles = milesRecord['miles'];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text(
                        'Date: $date, Miles: $miles',
                        style:
                            appStyleUniverse(17, kDarkGray, FontWeight.normal),
                      ),
                    ),
                    SizedBox(height: 4),
                    DashedDivider(),
                  ],
                );
              }).toList(),
          ],
        ),
      ),
    );
  }
}
