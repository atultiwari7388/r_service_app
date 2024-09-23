import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/aboutUs/about_us_screen.dart';
import 'package:regal_shop_app/views/helpContact/help_center.dart';
import 'package:regal_shop_app/views/privacyPolicy/privacy_policy.dart';
import 'package:regal_shop_app/views/profile/profile_detail_screen.dart';
import 'package:regal_shop_app/views/termsCondition/terms_conditions.dart';
import '../../services/collection_references.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/dashed_divider.dart';
import '../../widgets/reusable_text.dart';
import '../auth/login_screen.dart';
import '../history/completed_history_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Menu", style: appStyle(20, kDark, FontWeight.normal)),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 7.h),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: 0.h),
              GestureDetector(
                  onTap: () => Get.to(() => ProfileDetailsScreen()),
                  child: buildTopProfileSection()),
              SizedBox(height: 10.h),
              Container(
                width: double.maxFinite,
                // margin: EdgeInsets.symmetric(horizontal: 12.w),
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: kLightWhite,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          "Manage Orders",
                          style: appStyle(18, kPrimary, FontWeight.normal),
                        ),
                        SizedBox(width: 5.w),
                        Container(width: 30.w, height: 3.h, color: kSecondary),
                      ],
                    ),
                    SizedBox(height: 15.h),
                    const DashedDivider(color: kGrayLight),
                    SizedBox(height: 10.h),
                    buildListTile("assets/bookings_bw.png", "My History", () {
                      Get.to(() => CompletedJobsHistoryScreen());
                    }),
                    buildListTile("assets/profile_bw.png", "My Profile", () {
                      Get.to(() => ProfileDetailsScreen());
                    }),
                  ],
                ),
              ),
              SizedBox(height: 18.h),
              Container(
                width: double.maxFinite,
                // margin: EdgeInsets.symmetric(horizontal: 12.w),
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: kLightWhite,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          "More",
                          style: appStyle(18, kPrimary, FontWeight.normal),
                        ),
                        SizedBox(width: 5.w),
                        Container(width: 30.w, height: 3.h, color: kSecondary),
                      ],
                    ),
                    SizedBox(height: 15.h),
                    const DashedDivider(color: kGrayLight),
                    SizedBox(height: 10.h),
                    buildListTile("assets/about_us_bw.png", "About us",
                        () => Get.to(() => AboutUsScreen())),
                    buildListTile("assets/help_bw.png", "Help",
                        () => Get.to(() => EmergencyContactsScreen())),
                    buildListTile("assets/t_c_bw.png", "Terms & Conditions",
                        () => Get.to(() => TermsAndConditions())),
                    buildListTile("assets/privacy_bw.png", "Privacy Policy",
                        () => Get.to(() => PrivacyPolicyScreen())),
                    buildListTile(
                        "assets/out_bw.png", "Logout", () => signOut(context)),
                    SizedBox(height: 50.h),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildListTile(String iconName, String title, void Function() onTap) {
    return GestureDetector(
      onTap: onTap,
      child: ListTile(
        leading:
            Image.asset(iconName, height: 20.h, width: 20.w, color: kPrimary),
        trailing: const Icon(Icons.arrow_forward_ios, size: 18, color: kGray),
        title: Text(title, style: appStyle(13, kDark, FontWeight.normal)),
        // onTap: onTap,
      ),
    );
  }

//================================ top Profile section =============================
  Container buildTopProfileSection() {
    return Container(
      height: 120.h,
      width: double.maxFinite,
      padding: EdgeInsets.only(left: 12.w, right: 12.w, top: 12.w),
      decoration: BoxDecoration(
        color: kLightWhite,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('Mechanics')
            .doc(currentUId)
            .snapshots(),
        builder:
            (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
          if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return Container();
          }

          final data = snapshot.data!.data() as Map<String, dynamic>;
          final profilePictureUrl = data['profilePicture'] ?? '';
          final userName = data['userName'] ?? '';
          final email = data['email'] ?? '';
          final wallet = data["wallet"] ?? 0;

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 33.r,
                backgroundColor: kSecondary,
                child: profilePictureUrl.isEmpty
                    ? Text(
                        userName.isNotEmpty ? userName[0] : '',
                        style: appStyle(20, kWhite, FontWeight.bold),
                      )
                    : CircleAvatar(
                        radius: 33.r,
                        backgroundImage: NetworkImage(profilePictureUrl),
                      ),
              ),
              SizedBox(width: 10.w),
              Padding(
                padding: EdgeInsets.only(top: 15.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ReusableText(
                      text: userName.isNotEmpty ? userName : '',
                      style: appStyle(15, kDark, FontWeight.bold),
                    ),
                    ReusableText(
                      text: email.isNotEmpty ? email : '',
                      style: appStyle(12, kDark, FontWeight.normal),
                    ),
                    Spacer(),
                    Container(
                      height: 30.h,
                      width: 140.w,
                      // padding: EdgeInsets.only(left: 10.w),
                      decoration: BoxDecoration(
                          color: kSuccess.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(12.r)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset("assets/wallet_3.png",
                              height: 20.h, width: 20.w, color: kWhite),
                          SizedBox(width: 5.w),
                          ReusableText(
                            text: "\$${wallet.toString()}",
                            style: appStyle(17, kWhite, FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    Spacer(),
                  ],
                ),
              )
            ],
          );
        },
      ),
    );
  }

  //====================== signOut from app =====================
  void signOut(BuildContext context) async {
    try {
      await auth.signOut().then((value) {
        Get.offAll(() => LoginScreen());
      });
    } catch (e) {
      showToastMessage("Error", e.toString(), Colors.red);
    }
  }
}
