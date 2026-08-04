import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/aboutUs/about_us_screen.dart';
import 'package:regal_shop_app/views/adminContact/admin_contact_screen.dart';
import 'package:regal_shop_app/views/helpContact/help_center.dart';
import 'package:regal_shop_app/views/privacyPolicy/privacy_policy.dart';
import 'package:regal_shop_app/views/profile/profile_detail_screen.dart';
import 'package:regal_shop_app/views/splash/splash_screen.dart';
import 'package:regal_shop_app/views/termsCondition/terms_conditions.dart';
import 'package:regal_shop_app/views/yourServices/add_your_service.dart';
import '../../services/collection_references.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../utils/show_toast_msg.dart';
import '../../widgets/dashed_divider.dart';
import '../../widgets/reusable_text.dart';
import '../auth/login_screen.dart';
import '../history/completed_history_screen.dart';
import '../ratings/ratings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _firebaseAuth = FirebaseAuth.instance;

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
                          "My Details",
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
                    buildListTile("assets/services_your.png", "My Services",
                        () {
                      Get.to(() => AddYourServices());
                    }),
                    buildListTile("assets/rating_bw.png", "My Ratings", () {
                      Get.to(() => RatingsScreen());
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
                    // buildListTile("assets/help_bw.png", "Help",
                    //     () => Get.to(() => AdminContactScreen())),
                    buildListTile("assets/t_c_bw.png", "Terms & Conditions",
                        () => Get.to(() => TermsAndConditions())),
                    buildListTile("assets/privacy_bw.png", "Privacy Policy",
                        () => Get.to(() => PrivacyPolicyScreen())),
                    buildListTile(
                        "assets/out_bw.png", "Logout", () => signOut(context)),

                    buildListTile(
                      "assets/delete.png",
                      "Delete Account",
                      () {
                        showDialog(
                          context: context,
                          builder: (_) {
                            return AlertDialog(
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              title: const Text(
                                'Delete Your Account',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              content: const Text(
                                'Do you want to permanently delete your account or temporarily deactivate it?\n\n'
                                '• Permanent deletion will remove all your data forever.\n'
                                '• Temporary deactivation will hide your account but you can reactivate later.',
                                style: TextStyle(height: 1.4),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text("CANCEL",
                                      style: TextStyle(color: Colors.grey)),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(
                                        context); // Close first dialog
                                    _showTemporaryDeleteConfirmation(context);
                                  },
                                  child: const Text("TEMPORARY",
                                      style: TextStyle(color: Colors.blue)),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(
                                        context); // Close first dialog
                                    _showPermanentDeleteConfirmation();
                                  },
                                  child: const Text("PERMANENT",
                                      style: TextStyle(color: Colors.red)),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    ),
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

  void _showPermanentDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text(
            'Permanent Account Deletion',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          content: const Text(
            'Are you sure you want to permanently delete your account?\n\n'
            '⚠️ This action is permanent and cannot be recovered.\n\n'
            '• All your personal data will be permanently deleted from our database.\n'
            '• Your linked team members and their data associated with your account will also be removed.\n'
            '• You will lose access to any saved progress, records, jobs, history, or preferences.\n\n',
            style: TextStyle(height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("CANCEL", style: TextStyle(color: Colors.grey)),
            ),
            TextButton(
              onPressed: () async {
                try {
                  // Show loading
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) =>
                        const Center(child: CircularProgressIndicator()),
                  );

                  // Archive data
                  await _archiveUserData(currentUId);

                  // Delete Firestore data
                  await _deleteUserData(currentUId);

                  // Delete Firebase Auth user (current user only)
                  await _firebaseAuth.currentUser?.delete();

                  if (mounted) {
                    Navigator.pop(context); // Close loading
                    Get.offAll(() => const SplashScreen());
                    showToastMessage(
                        "Success", "Account deleted permanently", Colors.green);
                  }
                } catch (e) {
                  if (mounted) {
                    Navigator.pop(context); // Close loading
                    showToastMessage(
                        "Error", "Failed to delete account: $e", Colors.red);
                  }
                  log("Error deleting account: $e");
                }
              },
              child: const Text("DELETE", style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  void _showTemporaryDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text(
            'Temporarily Deactivate Account',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          content: const Text(
            'Your account will be deactivated but not deleted.\n\n'
            '• Your team members will also be deactivated.\n'
            '• All your data will be preserved but hidden.\n\n'
            'We hope to see you again soon!',
            style: TextStyle(height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("CANCEL", style: TextStyle(color: Colors.grey)),
            ),
            TextButton(
              onPressed: () async {
                try {
                  // Show loading
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) =>
                        const Center(child: CircularProgressIndicator()),
                  );

                  // Deactivate owner
                  await FirebaseFirestore.instance
                      .collection('Mechanics')
                      .doc(currentUId)
                      .update({
                    'status': 'deactivated',
                    'deactivatedAt': FieldValue.serverTimestamp(),
                  });

                  // Sign out
                  await auth.signOut();

                  if (mounted) {
                    Navigator.pop(context); // Close loading
                    Get.offAll(() => const SplashScreen());
                    showToastMessage("Success",
                        "Account deactivated temporarily", Colors.green);
                  }
                } catch (e) {
                  if (mounted) {
                    Navigator.pop(context); // Close loading
                    showToastMessage("Error",
                        "Failed to deactivate account: $e", Colors.red);
                  }
                  log("Error deactivating account: $e");
                }
              },
              child: const Text("DEACTIVATE",
                  style: TextStyle(color: Colors.blue)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _archiveUserData(String userId) async {
    final userDoc = await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(userId)
        .get();

    if (userDoc.exists) {
      // Archive the main user data
      final userData = userDoc.data() as Map<String, dynamic>;
      await FirebaseFirestore.instance
          .collection('deletedMembers')
          .doc(userId)
          .set({
        ...userData,
        'deletedAt': FieldValue.serverTimestamp(),
        'originalId': userId,
      });
    }
  }

  Future<void> _deleteUserData(String userId) async {
    final firestore = FirebaseFirestore.instance;

    // Fetch user doc
    final userDoc = await firestore.collection('Mechanics').doc(userId).get();

    if (userDoc.exists) {
      final userData = userDoc.data() as Map<String, dynamic>;

      _deleteUserFromAuth(userId); // Delete owner last
      await firestore.collection('Mechanics').doc(userId).delete();
    }
  }

  Future<void> _deleteUserFromAuth(String uid) async {
    try {
      final user = _firebaseAuth.currentUser;
      if (user != null && user.uid == uid) {
        await user.delete();
      }
    } catch (e) {
      log('Error deleting Firebase Auth user: $e');
    }
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
      await auth.signOut().then((value) async {
        await FirebaseFirestore.instance
            .collection('Mechanics')
            .doc(currentUId)
            .update({
          'active': false,
          'fcmToken': '',
        });
        Get.offAll(() => LoginScreen());
      });
    } catch (e) {
      showToastMessage("Error", e.toString(), Colors.red);
    }
  }
}
