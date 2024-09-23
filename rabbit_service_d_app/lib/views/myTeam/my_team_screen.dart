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

  Future<QuerySnapshot> fetchTeamMembers() async {
    return FirebaseFirestore.instance
        .collection('Users')
        .where('createdBy', isEqualTo: currentUId)
        .where('uid', isNotEqualTo: currentUId) // Exclude the owner's UID
        .get();
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
      body: FutureBuilder<QuerySnapshot>(
        future: fetchTeamMembers(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const Center(child: Text('Error loading team members'));
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No team members found'));
          }

          // List of members fetched from Firestore
          List<QueryDocumentSnapshot> members = snapshot.data!.docs;

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
                    buildTableHeaderCell("Email"),
                    buildTableHeaderCell("Actions"),
                  ],
                ),
                // Build Table Rows dynamically from Firestore data
                ...members.map((member) {
                  String name = member['userName'] ?? 'No Name';
                  String email = member['email'] ?? 'No Email';
                  bool isActive = member['active'] ?? false;
                  String memberId = member['uid'] ?? '';
                  String ownerId = member['createdBy'] ?? '';

                  return buildTableRow(
                      name, email, isActive, memberId, ownerId);
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
    String email,
    bool switchValue,
    String memebrId,
    String ownerId,
  ) {
    return TableRow(
      children: [
        InkWell(
          onTap: () => Get.to(() => MemberJobsHistoryScreen(
                memberName: name,
                memebrId: memebrId,
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
            email,
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


// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/views/myTeam/widgets/add_team_screen.dart';
// import 'package:regal_service_d_app/views/myTeam/widgets/member_jobs_history.dart';
// import '../../utils/app_styles.dart';

// class MyTeamScreen extends StatelessWidget {
//   const MyTeamScreen({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: const Text("My Team"),
//         actions: [
//           InkWell(
//             onTap: () => Get.to(() => const AddTeamMember()),
//             child: CircleAvatar(
//               radius: 20.r,
//               backgroundColor: kPrimary,
//               child: const Icon(Icons.add, color: kWhite),
//             ),
//           ),
//           SizedBox(width: 10.w),
//         ],
//       ),
//       body: Container(
//         padding: EdgeInsets.all(4.h),
//         margin: EdgeInsets.all(10.h),
//         child: Table(
//           defaultVerticalAlignment: TableCellVerticalAlignment.middle,
//           border: TableBorder.all(color: kDark, width: 0.3),
//           columnWidths: const {
//             0: FlexColumnWidth(3),
//             1: FlexColumnWidth(3),
//             2: FlexColumnWidth(2),
//           },
//           children: [
//             TableRow(
//               decoration: BoxDecoration(color: kSecondary.withOpacity(0.8)),
//               children: [
//                 buildTableHeaderCell("Name"),
//                 buildTableHeaderCell("Email"),
//                 buildTableHeaderCell("Actions"),
//               ],
//             ),
//             // Display List of team members
//             buildTableRow("Sachin Minhas", "Sachin@gmail.com", false),
//             buildTableRow("Navneet Dhiman", "navneet@gmail.com", true),
//             // Pagination Button
//             TableRow(
//               children: [
//                 const SizedBox(),
//                 const SizedBox(),
//                 Padding(
//                   padding: const EdgeInsets.all(8.0),
//                   child: Center(
//                     child: TextButton(
//                       onPressed: () {},
//                       child: const Text("Next"),
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   TableRow buildTableRow(String name, String email, bool switchValue) {
//     return TableRow(
//       children: [
//         InkWell(
//           onTap: () => Get.to(() => MemberJobsHistoryScreen(memberName: name)),
//           child: Padding(
//             padding: const EdgeInsets.all(8.0),
//             child: Text(
//               name,
//               overflow: TextOverflow.ellipsis,
//               style: appStyle(13, kDark, FontWeight.normal),
//               textAlign: TextAlign.center,
//             ),
//           ),
//         ),
//         Padding(
//           padding: const EdgeInsets.all(8.0),
//           child: Text(
//             email,
//             overflow: TextOverflow.ellipsis,
//             style: appStyle(13, kDark, FontWeight.normal),
//             textAlign: TextAlign.center,
//           ),
//         ),
//         Row(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Switch(
//               activeColor: kPrimary,
//               value: switchValue,
//               onChanged: (bool value) {},
//             ),
//             InkWell(
//               onTap: () {},
//               child: const Icon(Icons.edit, color: Colors.green),
//             ),
//           ],
//         ),
//       ],
//     );
//   }

//   Widget buildTableHeaderCell(String text) {
//     return Padding(
//       padding: const EdgeInsets.all(8.0),
//       child: Text(
//         text,
//         style: const TextStyle(
//             fontSize: 13, fontWeight: FontWeight.normal, color: Colors.white),
//         textAlign: TextAlign.center,
//       ),
//     );
//   }
// }
