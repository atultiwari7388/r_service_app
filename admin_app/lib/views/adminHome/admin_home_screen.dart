import 'package:admin_app/services/collection_references.dart';
import 'package:admin_app/views/all_jobs/all_jobs_screen.dart';
import 'package:admin_app/views/drivers/drivers_screen.dart';
import 'package:admin_app/views/help/help_screen.dart';
import 'package:admin_app/views/languages/languages_screen.dart';
import 'package:admin_app/views/payments/payments_screen.dart';
import 'package:admin_app/views/privacyPolicy/privacy_policy.dart';
import 'package:admin_app/views/services/services.dart';
import 'package:admin_app/views/terms_and_condition/terms_condition.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../aboutUs/about_us.dart';
import '../shops/shops_screen.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int totalDrivers = 0;
  int totalMechanics = 0;
  int totalJobs = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Welcome Admin",
            style: appStyle(20, kDark, FontWeight.normal)),
      ),
      drawer: buildDrawer(),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 10.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 20.h),
            buildAnalysisBox(
                stream: usersList,
                firstText: "Total Drivers",
                icon: Icons.abc_sharp,
                onTap: () {},
                containerColor: kSecondary),
            SizedBox(height: 10.h),
            buildAnalysisBox(
                stream: mechanicsList,
                firstText: "Total Mechanics",
                icon: Icons.abc_sharp,
                onTap: () {},
                containerColor: kPrimary),
            SizedBox(height: 10.h),
            buildAnalysisBox(
                stream: jobsList,
                firstText: "Total Jobs",
                icon: Icons.abc_sharp,
                onTap: () {},
                containerColor: kSuccess),
          ],
        ),
      ),
    );
  }

  Widget buildAnalysisBox({
    required Stream<QuerySnapshot> stream,
    required String firstText,
    required IconData icon,
    Color containerColor = kPrimary,
    required onTap,
  }) {
    return StreamBuilder<QuerySnapshot>(
      stream: stream,
      builder: (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasData) {
          List<DocumentSnapshot> documents = snapshot.data!.docs;
          int count = documents.length;

          return InkWell(
              onTap: onTap,
              child: _compactDashboardItem(
                  firstText, count.toString(), containerColor));
        } else {
          return Container(); // Placeholder widget for error or no data
        }
      },
    );
  }

  Drawer buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          const DrawerHeader(
            decoration: BoxDecoration(
              color: kPrimary,
            ), //BoxDecoration
            child: UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: kPrimary),
              accountName: Text(
                "Mylex Infotech",
                style: TextStyle(fontSize: 18),
              ),
              accountEmail: Text("mylexinfotech@gmail.com"),
              currentAccountPictureSize: Size.square(50),
              currentAccountPicture: CircleAvatar(
                backgroundColor: kWhite,
                child: Text(
                  "M",
                  style: TextStyle(fontSize: 30.0, color: Colors.blue),
                ), //Text
              ),
            ),
          ),
          buildListTile("assets/order-history.png", "All Jobs",
              () => Get.to(() => AllJobsScreen())),
          buildListTile("assets/driver.png", "Drivers",
              () => Get.to(() => DriversScreen())),
          buildListTile("assets/mechanic.png", "Mechanics",
              () => Get.to(() => ShopsScreen())),
          buildListTile("assets/languages.png", "Languages",
              () => Get.to(() => LanguagesScreen())),
          buildListTile("assets/services.png", "Services",
              () => Get.to(() => ServicesScreen())),
          buildListTile("assets/about_us.png", "About us",
              () => Get.to(() => AboutUsScreen())),
          buildListTile(
              "assets/help-desk.png", "Help", () => Get.to(() => HelpScreen())),
          buildListTile("assets/terms-and-conditions.png", "Terms & Conditions",
              () => Get.to(() => TermsAndConditionsScreen())),
          buildListTile("assets/privacy-policy.png", "Privacy Policy",
              () => Get.to(() => PrivacyPolicyScreen())),
          buildListTile("assets/logout.png", "Logout", () {}),
        ],
      ),
    );
  }

//------------------- List tile -----------
  ListTile buildListTile(String iconName, String title, void Function() onTap) {
    return ListTile(
      leading: Image.asset(iconName, height: 20.h, width: 20.w),
      trailing: const Icon(Icons.arrow_forward_ios, size: 18, color: kGray),
      title: Text(title, style: appStyle(13, kDark, FontWeight.normal)),
      onTap: onTap,
    );
  }

  Widget _compactDashboardItem(String title, String value, Color color) {
    return Container(
      height: 120.h,
      width: double.maxFinite,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12.r),
      ),
      padding: EdgeInsets.all(10.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title,
              textAlign: TextAlign.center,
              style: appStyle(26, kWhite, FontWeight.bold)),
          SizedBox(height: 10.h),
          Text(value, style: appStyle(16, kWhite, FontWeight.bold)),
        ],
      ),
    );
  }
}