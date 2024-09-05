import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/myTeam/widgets/add_team_screen.dart';
import 'package:regal_service_d_app/views/myTeam/widgets/member_jobs_history.dart';

import '../../utils/app_styles.dart';

class MyTeamScreen extends StatelessWidget {
  const MyTeamScreen({super.key});

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
      body: Container(
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
            TableRow(
              decoration: BoxDecoration(color: kSecondary.withOpacity(0.8)),
              children: [
                buildTableHeaderCell("Name"),
                buildTableHeaderCell("Email"),
                buildTableHeaderCell("Actions"),
              ],
            ),
            // Display List of team members
            buildTableRow("Sachin Minhas", "Sachin@gmail.com", false),
            buildTableRow("Navneet Dhiman", "navneet@gmail.com", true),
            // Pagination Button
            TableRow(
              children: [
                const SizedBox(),
                const SizedBox(),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Center(
                    child: TextButton(
                      onPressed: () {},
                      child: const Text("Next"),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  TableRow buildTableRow(String name, String email, bool switchValue) {
    return TableRow(
      children: [
        InkWell(
          onTap: () => Get.to(() => MemberJobsHistoryScreen(memberName: name)),
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
              onChanged: (bool value) {},
            ),
            InkWell(
              onTap: () {},
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
//         title: Text("My Team"),
//         actions: [
//           InkWell(
//             onTap: () => Get.to(() => AddTeamMember()),
//             child: CircleAvatar(
//               radius: 20.r,
//               backgroundColor: kPrimary,
//               child: Icon(Icons.add, color: kWhite),
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
//           textBaseline: TextBaseline.alphabetic,
//           border: TableBorder.all(color: kDark, width: .3),
//           children: [
//             TableRow(
//               decoration: BoxDecoration(color: kSecondary.withOpacity(0.8)),
//               children: [
//                 // buildTableHeaderCell("#"),
//                 buildTableHeaderCell("Name"),
//                 buildTableHeaderCell("Email"),
//                 buildTableHeaderCell("Actions"),
//               ],
//             ),
//             // Display List of team members

//             TableRow(
//               children: [
//                 InkWell(
//                   onTap: () => Get.to(() =>
//                       MemberJobsHistoryScreen(memberName: "Sachin Minhas")),
//                   child: TableCell(
//                     child: Text(
//                       "Sachin Minhas",
//                       overflow: TextOverflow.ellipsis,
//                       style: appStyle(13, kDark, FontWeight.normal),
//                       textAlign: TextAlign.center,
//                     ),
//                   ),
//                 ),
//                 TableCell(
//                   child: Text(
//                     "Sachin@gmail.com",
//                     overflow: TextOverflow.ellipsis,
//                     style: appStyle(13, kDark, FontWeight.normal),
//                     textAlign: TextAlign.center,
//                   ),
//                 ),
//                 TableCell(
//                   child: Row(
//                     mainAxisAlignment: MainAxisAlignment.center,
//                     children: [
//                       Builder(builder: (context) {
//                         return Switch(
//                           activeColor: kPrimary,
//                           key: UniqueKey(),
//                           value: false,
//                           onChanged: (bool value) {},
//                         );
//                       }),
//                       InkWell(
//                         onTap: () {},
//                         child: const Icon(Icons.edit, color: Colors.green),
//                       ),
//                     ],
//                   ),
//                 ),
//               ],
//             ),

//             TableRow(
//               children: [
//                 InkWell(
//                   onTap: () => Get.to(() =>
//                       MemberJobsHistoryScreen(memberName: "Navneet Dhiman")),
//                   child: TableCell(
//                     child: Text(
//                       "Navneet Dhiman",
//                       overflow: TextOverflow.ellipsis,
//                       style: appStyle(13, kDark, FontWeight.normal),
//                       textAlign: TextAlign.center,
//                     ),
//                   ),
//                 ),
//                 TableCell(
//                   child: Text(
//                     "navneet@gmail.com",
//                     overflow: TextOverflow.ellipsis,
//                     style: appStyle(13, kDark, FontWeight.normal),
//                     textAlign: TextAlign.center,
//                   ),
//                 ),
//                 TableCell(
//                   child: Row(
//                     mainAxisAlignment: MainAxisAlignment.center,
//                     children: [
//                       Builder(builder: (context) {
//                         return Switch(
//                           activeColor: kPrimary,
//                           key: UniqueKey(),
//                           value: true,
//                           onChanged: (bool value) {},
//                         );
//                       }),
//                       InkWell(
//                         onTap: () {},
//                         child: const Icon(Icons.edit, color: Colors.green),
//                       ),
//                     ],
//                   ),
//                 ),
//               ],
//             ),
//             // Pagination Button
//             TableRow(
//               children: [
//                 TableCell(
//                   child: SizedBox(),
//                 ),
//                 TableCell(
//                   child: SizedBox(),
//                 ),
//                 TableCell(
//                   child: Padding(
//                     padding: const EdgeInsets.all(8.0),
//                     child: Center(
//                       child: TextButton(
//                         onPressed: () {},
//                         child: const Text("Next"),
//                       ),
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

//   Widget buildTableHeaderCell(String text) {
//     return TableCell(
//       child: Padding(
//         padding: const EdgeInsets.all(8.0),
//         child: Text(
//           text,
//           style: const TextStyle(
//               fontSize: 13, fontWeight: FontWeight.normal, color: Colors.white),
//           textAlign: TextAlign.center,
//         ),
//       ),
//     );
//   }
// }
