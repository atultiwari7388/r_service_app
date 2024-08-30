import 'package:admin_app/views/all_jobs/all_jobs_screen.dart';
import 'package:admin_app/views/drivers/drivers_screen.dart';
import 'package:admin_app/views/help/help_screen.dart';
import 'package:admin_app/views/payments/payments_screen.dart';
import 'package:admin_app/views/privacyPolicy/privacy_policy.dart';
import 'package:admin_app/views/profile/profile_detail_screen.dart';
import 'package:admin_app/views/terms_and_condition/terms_condition.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';

import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../aboutUs/about_us.dart';
import '../profile/profile_screen.dart';
import '../shops/shops_screen.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int totalOrders = 0;
  int todaysOrder = 0;
  int pendingOrders = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Welcome Admin",
            style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => ProfileDetailsScreen()),
            child: CircleAvatar(
              backgroundColor: kPrimary,
              radius: 19.r,
              child: Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      drawer: Drawer(
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
            buildListTile("assets/profile.png", "My Profile",
                () => Get.to(() => ProfileDetailsScreen())),
            buildListTile("assets/order-history.png", "All Jobs",
                () => Get.to(() => AllJobsScreen())),
            buildListTile("assets/driver.png", "Drivers",
                () => Get.to(() => DriversScreen())),
            buildListTile(
                "assets/shops.png", "Shops", () => Get.to(() => ShopsScreen())),
            buildListTile("assets/money.png", "Payments",
                () => Get.to(() => PaymentsScreen())),
            buildListTile("assets/about_us.png", "About us",
                () => Get.to(() => AboutUsScreen())),
            buildListTile("assets/help-desk.png", "Help",
                () => Get.to(() => HelpScreen())),
            buildListTile(
                "assets/terms-and-conditions.png",
                "Terms & Conditions",
                () => Get.to(() => TermsAndConditionsScreen())),
            buildListTile("assets/privacy-policy.png", "Privacy Policy",
                () => Get.to(() => PrivacyPolicyScreen())),
            buildListTile("assets/logout.png", "Logout", () {}),
          ],
        ),
      ),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 10.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              child: _compactDashboardItem(
                  "Today Orders", todaysOrder.toString(), kSecondary),
            ),
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              child: _compactDashboardItem(
                  "Total Orders", totalOrders.toString(), kRed),
            ),
            SizedBox(height: 20.h),
            GestureDetector(
              // onTap: () => Get.to(() => OrderHistoryScreen()),
              onTap: () {
                // widget.setTab?.call(1);
              },
              child: _compactDashboardItem(
                  "Pending Orders", pendingOrders.toString(), Colors.green),
            ),
          ],
        ),
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
      height: 180.h,
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
