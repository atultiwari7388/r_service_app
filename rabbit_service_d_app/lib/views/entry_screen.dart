import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/views/dashboard/dashboard_screen.dart';
import 'package:regal_service_d_app/views/history/history_screen.dart';
import 'package:regal_service_d_app/views/myJobs/my_jobs_screen.dart';
import '../controllers/tab_index_controller.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';
import 'requests/requests.dart';

// ignore: must_be_immutable
class EntryScreen extends StatefulWidget {
  // ignore: use_key_in_widget_constructors
  EntryScreen({Key? key});

  @override
  State<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen> {
  int tab = 0;

  void setTab(int index) {
    setState(() {
      tab = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> screens = [
      DashBoardScreen(),
      MyJobsScreen(),
      // UploadRequestsScreen(),
      HistoryScreen(),
      // ProfileScreen(),
    ];

    final controller = Get.put(TabIndexController());

    return Obx(
      () => Scaffold(
        body: Stack(
          children: [
            screens[controller.getTabIndex],
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.transparent, // Keep the background transparent
                  border: Border.all(color: kGray, width: 1), // Add border here
                  borderRadius: BorderRadius.circular(12),
                ),
                child: BottomNavigationBar(
                  // backgroundColor: Colors.transparent,
                  enableFeedback: true,
                  elevation: 0,
                  showSelectedLabels: true,
                  showUnselectedLabels: true,
                  unselectedIconTheme: const IconThemeData(color: kGray),
                  selectedItemColor: kPrimary,
                  selectedIconTheme: const IconThemeData(color: kPrimary),
                  selectedLabelStyle: appStyle(12, kSecondary, FontWeight.bold),
                  onTap: (value) {
                    controller.setTabIndex = value;
                  },
                  currentIndex: controller.getTabIndex,
                  items: [
                    const BottomNavigationBarItem(
                      icon: Icon(AntDesign.home),
                      label: "Home",
                    ),
                    const BottomNavigationBarItem(
                      icon: Icon(AntDesign.jpgfile1),
                      label: "My Jobs",
                    ),
                    // const BottomNavigationBarItem(
                    //   icon: Icon(AntDesign.upload),
                    //   label: "+",
                    // ),
                    const BottomNavigationBarItem(
                      icon: Icon(AntDesign.book),
                      label: "History",
                    ),
                    // BottomNavigationBarItem(
                    //   icon: const Icon(AntDesign.user),
                    //   label: "Profile",
                    // ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
