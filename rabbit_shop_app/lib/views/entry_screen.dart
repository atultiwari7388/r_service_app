import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/dashboard/dashboard_screen.dart';
import 'package:regal_shop_app/views/history/history_screen.dart';
import 'package:regal_shop_app/views/profile/profile_screen.dart';
import '../controllers/tab_index_controller.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';
import 'auth/login_screen.dart';

// // ignore: must_be_immutable
// class EntryScreen extends StatefulWidget {
//   // ignore: use_key_in_widget_constructors
//   EntryScreen({Key? key});

//   @override
//   State<EntryScreen> createState() => _EntryScreenState();
// }

// class _EntryScreenState extends State<EntryScreen> {
//   int tab = 0;

//   void setTab(int index) {
//     setState(() {
//       tab = index;
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     List<Widget> screens = [
//       DashBoardScreen(),
//       UpcomingAndCompletedJobsScreen(setTab: setTab),
//       ProfileScreen(),
//     ];

//     final controller = Get.put(TabIndexController());

//     return Obx(
//       () => Scaffold(
//         body: Stack(
//           children: [
//             screens[controller.getTabIndex],
//             Align(
//               alignment: Alignment.bottomCenter,
//               child: Container(
//                 decoration: BoxDecoration(
//                   color: Colors.transparent,
//                   // Keep the background transparent
//                   border: Border.all(color: kGray, width: 1),
//                   // Add border here
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//                 child: BottomNavigationBar(
//                   // backgroundColor: Colors.transparent,
//                   enableFeedback: true,
//                   elevation: 0,
//                   showSelectedLabels: true,
//                   showUnselectedLabels: true,
//                   unselectedIconTheme: const IconThemeData(color: kGray),
//                   selectedItemColor: kPrimary,
//                   selectedIconTheme: const IconThemeData(color: kPrimary),
//                   selectedLabelStyle: appStyle(12, kSecondary, FontWeight.bold),
//                   onTap: (value) {
//                     controller.setTabIndex = value;
//                   },
//                   currentIndex: controller.getTabIndex,
//                   items: [
//                     const BottomNavigationBarItem(
//                       icon: Icon(AntDesign.home),
//                       label: "Home",
//                     ),
//                     const BottomNavigationBarItem(
//                       icon: Icon(AntDesign.jpgfile1),
//                       label: "Jobs",
//                     ),
//                     BottomNavigationBarItem(
//                       icon: const Icon(AntDesign.user),
//                       label: "Profile",
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

class EntryScreen extends StatefulWidget {
  const EntryScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _EntryScreenState createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen> {
  int tab = 0;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    checkUserAuthentication();
  }

  Future<void> checkUserAuthentication() async {
    FirebaseAuth _auth = FirebaseAuth.instance;
    User? user = _auth.currentUser;

    log("Checking user authentication...");

    // Simulating an asynchronous operation (e.g., fetching user data) with a delay
    await Future.delayed(Duration(seconds: 2));

    setState(() {
      loading = true;
    });

    if (user == null) {
      // If user is not authenticated, navigate to OnboardScreen
      log("User is not authenticated. Navigating to OnboardingScreen.");

      Get.offAll(() => LoginScreen());
    } else {
      // If user is authenticated, you can perform additional actions if needed
      log("User is authenticated. UID: ${user.uid}");

      setState(() {
        loading = false;
      });
    }

    log("Check user authentication completed.");

    setState(() {
      loading = false;
    });
  }

  void setTab(int index) {
    setState(() {
      tab = index;
    });
  }

  final GlobalKey<ScaffoldState> _myGlobe = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      DashBoardScreen(setTab: setTab),
      UpcomingAndCompletedJobsScreen(setTab: setTab),
      ProfileScreen(),
    ];

    return Scaffold(
      key: _myGlobe,
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : IndexedStack(
              index: tab,
              children: pages,
            ),
      bottomNavigationBar: BottomNavigationBar(
        elevation: kIsWeb ? 1 : 5,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.home),
            label: "Home",
          ),
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.jpgfile1),
            label: "Jobs",
          ),
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.book),
            label: "Profile",
          ),
        ],
        currentIndex: tab,
        selectedItemColor: kPrimary,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        unselectedIconTheme: const IconThemeData(color: kGray),
        selectedIconTheme: const IconThemeData(color: kPrimary),
        selectedLabelStyle:
            kIsWeb ? TextStyle() : appStyle(12, kSecondary, FontWeight.bold),
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            tab = index;
          });
        },
      ),
    );
  }
}
