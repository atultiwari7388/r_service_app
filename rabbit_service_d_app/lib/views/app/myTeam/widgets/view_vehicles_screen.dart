import 'package:flutter/material.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class MemberVehiclesScreen extends StatelessWidget {
  final String memberName;
  final String memberContact;
  final String memberId;
  final List<Map<String, dynamic>> vehicles;

  const MemberVehiclesScreen({
    super.key,
    required this.memberName,
    required this.memberContact,
    required this.memberId,
    required this.vehicles,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("$memberName's Vehicles",
            style: appStyle(18, Colors.white, FontWeight.normal)),
        centerTitle: true,
        backgroundColor: kPrimary,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Header with count
          Container(
            padding: const EdgeInsets.all(16),
            color: kPrimary.withOpacity(0.05),
            child: Row(
              children: [
                Icon(Icons.directions_car, color: kPrimary, size: 24),
                const SizedBox(width: 8),
                Text(
                  "${vehicles.length} Vehicles",
                  style: appStyle(16, kDark, FontWeight.bold),
                ),
              ],
            ),
          ),

          // Vehicle List
          Expanded(
            child: vehicles.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.car_repair,
                            size: 50, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          "No Vehicles Assigned Yet",
                          style: appStyle(16, Colors.grey, FontWeight.w500),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: vehicles.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final vehicle = vehicles[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ListTile(
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: kPrimary.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.directions_car, color: kPrimary),
                          ),
                          title: Text(
                            vehicle['vehicleNumber'] ?? 'N/A',
                            style: appStyle(16, kDark, FontWeight.w600),
                          ),
                          subtitle: Text(
                            vehicle['companyName'] ?? 'No company specified',
                            style: appStyle(
                                14, Colors.grey[600]!, FontWeight.normal),
                          ),
                          // trailing: Icon(Icons.chevron_right, color: kPrimary),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          onTap: () {
                            // Add tap functionality if needed
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        color: kPrimary,
        child: InkWell(
          onTap: () async {
            await makePhoneCall(memberContact);
          },
          child: Container(
            height: 50,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  backgroundColor: kSecondary,
                  child: Icon(Icons.phone, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 8),
                Text(
                  "Call now",
                  style: appStyle(16, Colors.white, FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
