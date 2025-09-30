// import 'dart:developer';
// import 'package:flutter/material.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
// import 'package:regal_service_d_app/views/app/aboutUs/about_us_screen.dart';
// import 'package:regal_service_d_app/views/app/dashboard/widgets/our_services.dart';
// import 'package:regal_service_d_app/views/app/helpContact/help_center.dart';
// import 'package:regal_service_d_app/views/app/history/history_screen.dart';
// import 'package:regal_service_d_app/views/app/myJobs/my_jobs_screen.dart';
// import '../../utils/constants.dart';
// import '../app/dashboard/widgets/find_mechanic.dart';

// class WebDashboardScreen extends StatefulWidget {
//   const WebDashboardScreen({super.key, required this.setTab});
//   final Function? setTab;

//   @override
//   State<WebDashboardScreen> createState() => _WebDashboardScreenState();
// }

// class _WebDashboardScreenState extends State<WebDashboardScreen> {
//   @override
//   Widget build(BuildContext context) {
//     return GetBuilder<DashboardController>(
//       init: DashboardController(),
//       builder: (controller) {
//         if (controller.isLoading) {
//           return Center(child: CircularProgressIndicator());
//         } else {
//           return Scaffold(
//             appBar: AppBar(
//               backgroundColor: kWhite,
//               elevation: 1,
//               title: Image.asset(
//                 'assets/h_n_logo-removebg.png',
//                 height: 50,
//               ),
//               actions: [
//                 LayoutBuilder(
//                   builder: (context, constraints) {
//                     if (constraints.maxWidth < 600) {
//                       // Show a PopupMenuButton for mobile view
//                       return PopupMenuButton<String>(
//                         onSelected: (value) {
//                           // Handle action item selection
//                           switch (value) {
//                             case 'About us':
//                               log("About us");
//                               break;
//                             case 'Contact us':
//                               log("Contact us");
//                               break;
//                             case 'My Jobs':
//                               log("My Jobs");
//                               break;
//                             case 'History':
//                               log("History");
//                               break;
//                           }
//                         },
//                         itemBuilder: (context) => [
//                           PopupMenuItem(
//                               value: 'About us', child: Text('About us')),
//                           PopupMenuItem(
//                               value: 'Contact us', child: Text('Contact us')),
//                           PopupMenuItem(
//                               value: 'My Jobs', child: Text('My Jobs')),
//                           PopupMenuItem(
//                               value: 'History', child: Text('History')),
//                         ],
//                         icon: Icon(Icons.more_vert, color: kPrimary),
//                       );
//                     } else {
//                       // Show individual action items for larger screens
//                       return Row(
//                         children: [
//                           menuItems(
//                               "About us", () => Get.to(() => AboutUsScreen())),
//                           SizedBox(width: 20),
//                           menuItems("Contact us",
//                               () => Get.to(() => EmergencyContactsScreen())),
//                           SizedBox(width: 20),
//                           menuItems(
//                               "My Jobs", () => Get.to(() => MyJobsScreen())),
//                           SizedBox(width: 20),
//                           menuItems(
//                               "History", () => Get.to(() => HistoryScreen())),
//                           SizedBox(width: 80),
//                         ],
//                       );
//                     }
//                   },
//                 ),
//               ],
//             ),
//             body: LayoutBuilder(
//               builder: (context, constraints) {
//                 bool isMobile = constraints.maxWidth < 600;

//                 return Padding(
//                   padding: const EdgeInsets.all(20), // Adjust padding
//                   child: Column(
//                     children: [
//                       if (isMobile)
//                         // Stacked layout for mobile
//                         Column(
//                           children: [
//                             FindMechanic(
//                                 controller: controller, setTab: widget.setTab),
//                             SizedBox(height: 20),
//                             OurServicesView(controller: controller),
//                           ],
//                         )
//                       else
//                         // Side-by-side layout for larger screens (web/tablet)
//                         Row(
//                           children: [
//                             Expanded(
//                               child: FindMechanic(
//                                   controller: controller,
//                                   setTab: widget.setTab),
//                             ),
//                             SizedBox(width: 30),
//                             Expanded(
//                                 child: OurServicesView(controller: controller)),
//                           ],
//                         ),
//                     ],
//                   ),
//                 );
//               },
//             ),
//           );
//         }
//       },
//     );
//   }

//   InkWell menuItems(String text, void Function()? onTap) => InkWell(
//       onTap: onTap,
//       child: Text(text,
//           style: TextStyle(color: kPrimary, fontWeight: FontWeight.bold)));
// }
