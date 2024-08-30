import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:admin_app/views/auth/login_screen.dart';
import 'package:admin_app/views/profile/profile_detail_screen.dart';
import 'package:admin_app/widgets/custom_background_container.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/dashed_divider.dart';
import '../../widgets/reusable_text.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Profile", style: appStyle(20, kDark, FontWeight.normal)),
      ),
      body: CustomBackgroundContainer(
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
                  buildListTile("assets/order-history.png", "Jobs", () {}),
                  buildListTile("assets/profile.png", "My Profile", () {}),
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
                  buildListTile("assets/about_us.png", "About us", () {}),
                  buildListTile("assets/help-desk.png", "Help", () {}),
                  buildListTile("assets/terms-and-conditions.png",
                      "Terms & Conditions", () {}),
                  buildListTile(
                      "assets/privacy-policy.png", "Privacy Policy", () {}),
                  buildListTile(
                      "assets/logout.png", "Logout", () => signOut(context)),
                ],
              ),
            ),
          ],
        ),
        horizontalW: 10.w,
        vertical: 10.h,
        scrollPhysics: AlwaysScrollableScrollPhysics(),
      ),
    );
  }

  ListTile buildListTile(String iconName, String title, void Function() onTap) {
    return ListTile(
      leading: Image.asset(iconName, height: 20.h, width: 20.w),
      trailing: const Icon(Icons.arrow_forward_ios, size: 18, color: kGray),
      title: Text(title, style: appStyle(13, kDark, FontWeight.normal)),
      onTap: onTap,
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 33.r,
            backgroundColor: kPrimary,
            backgroundImage: AssetImage("assets/images/profile.jpg"),
          ),
          SizedBox(width: 10.w),
          Padding(
            padding: EdgeInsets.only(top: 15.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ReusableText(
                  text: "Dummy userName",
                  style: appStyle(15, kDark, FontWeight.bold),
                ),
                ReusableText(
                  text: "dummy@gmail.com",
                  style: appStyle(12, kDark, FontWeight.normal),
                ),
              ],
            ),
          )
        ],
      ),

      // child: StreamBuilder<DocumentSnapshot>(
      //   stream: FirebaseFirestore.instance
      //       .collection('Users')
      //       .doc(currentUId)
      //       .snapshots(),
      //   builder:
      //       (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
      //     if (snapshot.hasError) {
      //       return Text('Error: ${snapshot.error}');
      //     }

      //     if (snapshot.connectionState == ConnectionState.waiting) {
      //       return const CircularProgressIndicator();
      //     }

      //     final data = snapshot.data!.data() as Map<String, dynamic>;
      //     final profilePictureUrl = data['profilePicture'] ?? '';
      //     final userName = data['userName'] ?? '';
      //     final email = data['email'] ?? '';

      //     return Row(
      //       crossAxisAlignment: CrossAxisAlignment.start,
      //       children: [
      //         CircleAvatar(
      //           radius: 33.r,
      //           backgroundColor: kSecondary,
      //           child: profilePictureUrl.isEmpty
      //               ? Text(
      //                   userName.isNotEmpty ? userName[0] : '',
      //                   style: appStyle(20, kWhite, FontWeight.bold),
      //                 )
      //               : CircleAvatar(
      //                   radius: 33.r,
      //                   backgroundImage: NetworkImage(profilePictureUrl),
      //                 ),
      //         ),
      //         SizedBox(width: 10.w),
      //         Padding(
      //           padding: EdgeInsets.only(top: 15.h),
      //           child: Column(
      //             crossAxisAlignment: CrossAxisAlignment.start,
      //             children: [
      //               ReusableText(
      //                 text: userName.isNotEmpty ? userName : '',
      //                 style: appStyle(15, kDark, FontWeight.bold),
      //               ),
      //               ReusableText(
      //                 text: email.isNotEmpty ? email : '',
      //                 style: appStyle(12, kDark, FontWeight.normal),
      //               ),
      //             ],
      //           ),
      //         )
      //       ],
      //     );

      //   },
      // ),
    );
  }

  //====================== signOut from app =====================
  void signOut(BuildContext context) async {
    try {
      // await auth.signOut();
      Get.offAll(() => const LoginScreen());
    } catch (e) {
      showToastMessage("Error", e.toString(), Colors.red);
    }
  }
}
