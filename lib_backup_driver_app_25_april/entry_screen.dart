import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/dashboard/dashboard_screen.dart';
import 'utils/app_styles.dart';
import 'views/app/history/history_screen.dart';
import 'views/app/myJobs/my_jobs_screen.dart';
import 'views/app/reports/reports_screen.dart';

class EntryScreen extends StatefulWidget {
  const EntryScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _EntryScreenState createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen>
    with SingleTickerProviderStateMixin {
  int tab = 0;
  bool loading = false;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    // checkUserAuthentication();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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
      ReportsScreen(),
      // AddServicesData(),
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
            label: "My Jobs",
          ),
          const BottomNavigationBarItem(
            icon: Icon(AntDesign.book),
            label: "History",
          ),
          BottomNavigationBarItem(
            backgroundColor: kPrimary,
            tooltip: "Records",
            icon: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Container(
                    padding: EdgeInsets.all(5),
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: Color.lerp(
                            kPrimary, kSecondary, _animationController.value)),
                    child: Icon(AntDesign.barschart, color: kWhite));
              },
            ),
            label: "RECORDS",
          ),
        ],
        currentIndex: tab,
        selectedItemColor: kPrimary,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        unselectedIconTheme: tab == 3
            ? IconThemeData(color: kDark)
            : IconThemeData(color: kGray),
        selectedIconTheme: const IconThemeData(color: kPrimary),
        selectedLabelStyle: tab == 3
            ? appStyle(14, kPrimary, FontWeight.bold)
            : appStyle(12, kSecondary, FontWeight.bold),
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
