import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/myTeam/widgets/add_team_screen.dart';
import 'package:regal_service_d_app/views/myTeam/widgets/member_jobs_history.dart';
import '../../utils/app_styles.dart';

class MyTeamScreen extends StatelessWidget {
  const MyTeamScreen({super.key});

  // Method to fetch team members along with their vehicles
  Future<List<Map<String, dynamic>>> fetchTeamMembersWithVehicles() async {
    List<Map<String, dynamic>> membersWithVehicles = [];

    // Fetch team members from the Users collection
    QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
        .collection('Users')
        .where('createdBy', isEqualTo: currentUId)
        .where('uid', isNotEqualTo: currentUId) // Exclude the owner's UID
        .get();

    for (var member in teamSnapshot.docs) {
      String memberId = member['uid'];
      String name = member['userName'] ?? 'No Name';
      String email = member['email'] ?? 'No Email';
      bool isActive = member['active'] ?? false;

      // Fetch vehicles from the Vehicles subcollection for each member
      QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(memberId)
          .collection('Vehicles')
          .get();

      List<Map<String, dynamic>> vehicles = vehicleSnapshot.docs.map((doc) {
        return {
          'companyName': doc['companyName'] ?? 'No Company',
          'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
        };
      }).toList();

      // Add member data along with their vehicles to the list
      membersWithVehicles.add({
        'name': name,
        'email': email,
        'isActive': isActive,
        'memberId': memberId,
        'ownerId': member['createdBy'],
        'vehicles': vehicles, // List of vehicles
      });
    }

    return membersWithVehicles;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Team"),
        actions: [
          InkWell(
            onTap: () => Get.to(() => const AddTeamMember()),
            child: CircleAvatar(
              radius: 20.r,
              backgroundColor: kPrimary,
              child: const Icon(Icons.add, color: kWhite),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: fetchTeamMembersWithVehicles(), // Fetch members and vehicles
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const Center(child: Text('Error loading team members'));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No team members found'));
          }

          // List of members fetched from Firestore
          List<Map<String, dynamic>> members = snapshot.data!;

          return Container(
            padding: EdgeInsets.all(4.h),
            margin: EdgeInsets.all(10.h),
            child: Table(
              defaultVerticalAlignment: TableCellVerticalAlignment.middle,
              border: TableBorder.all(color: kDark, width: 0.3),
              columnWidths: const {
                0: FlexColumnWidth(3),
                1: FlexColumnWidth(3),
                2: FlexColumnWidth(2),
              },
              children: [
                // Table Header
                TableRow(
                  decoration: BoxDecoration(color: kSecondary.withOpacity(0.8)),
                  children: [
                    buildTableHeaderCell("Name"),
                    buildTableHeaderCell("Vehicle"),
                    buildTableHeaderCell("Actions"),
                  ],
                ),
                // Build Table Rows dynamically from Firestore data
                ...members.map((member) {
                  String name = member['name'];
                  String email = member['email'];
                  bool isActive = member['isActive'];
                  String memberId = member['memberId'];
                  String ownerId = member['ownerId'];

                  // Create a string of vehicle details
                  String vehicleDetails = member['vehicles'].isNotEmpty
                      ? member['vehicles']
                          .map<String>((vehicle) =>
                              "${vehicle['companyName']} (${vehicle['vehicleNumber']})")
                          .join('\n')
                      : 'No Vehicles';

                  return buildTableRow(
                      name, vehicleDetails, email, isActive, memberId, ownerId);
                }).toList(),
              ],
            ),
          );
        },
      ),
    );
  }

  TableRow buildTableRow(
    String name,
    String vehicleDetails, // Updated to show vehicle details
    String email,
    bool switchValue,
    String memberId,
    String ownerId,
  ) {
    return TableRow(
      children: [
        InkWell(
          onTap: () => Get.to(() => MemberJobsHistoryScreen(
                memberName: name,
                memebrId: memberId,
                ownerId: ownerId,
              )),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              name,
              overflow: TextOverflow.ellipsis,
              style: appStyle(13, kDark, FontWeight.normal),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(
            vehicleDetails, // Display vehicle details here
            overflow: TextOverflow.ellipsis,
            style: appStyle(13, kDark, FontWeight.normal),
            textAlign: TextAlign.center,
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Switch(
              activeColor: kPrimary,
              value: switchValue,
              onChanged: (bool value) {
                // Handle the switch change (update in Firestore if necessary)
              },
            ),
            InkWell(
              onTap: () {
                // Handle Edit action
              },
              child: const Icon(Icons.edit, color: Colors.green),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildTableHeaderCell(String text) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        style: const TextStyle(
            fontSize: 13, fontWeight: FontWeight.normal, color: Colors.white),
        textAlign: TextAlign.center,
      ),
    );
  }
}
