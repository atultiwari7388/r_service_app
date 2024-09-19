import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/auth/login_screen.dart';
import 'package:regal_service_d_app/views/dashboard/dashboard_screen.dart';
import '../utils/app_styles.dart';
import 'history/history_screen.dart';
import 'myJobs/my_jobs_screen.dart';

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
      MyJobsScreen(),
      HistoryScreen(),
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
        elevation: 5,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.home),
            label: "Home",
          ),
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.jpgfile1),
            label: "My Jobs",
          ),
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.book),
            label: "History",
          ),
        ],
        currentIndex: tab,
        selectedItemColor: kPrimary,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        unselectedIconTheme: const IconThemeData(color: kGray),
        selectedIconTheme: const IconThemeData(color: kPrimary),
        selectedLabelStyle: appStyle(12, kSecondary, FontWeight.bold),
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
