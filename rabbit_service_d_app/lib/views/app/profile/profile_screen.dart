import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/authentication_controller.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/controllers/tab_index_controller.dart';
import 'package:regal_service_d_app/services/userRoleService.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/aboutUs/about_us_screen.dart';
import 'package:regal_service_d_app/views/app/helpContact/help_center.dart';
import 'package:regal_service_d_app/views/app/history/history_screen.dart';
import 'package:regal_service_d_app/views/app/manageCheck/manage_check_screen.dart';
import 'package:regal_service_d_app/views/app/manageTrips/manage_trips_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/my_team_screen.dart';
import 'package:regal_service_d_app/views/app/myVehicles/my_vehicles_screen.dart';
import 'package:regal_service_d_app/views/app/notificationScreen/notification_setting.dart';
import 'package:regal_service_d_app/views/app/onBoard/on_boarding_screen.dart';
import 'package:regal_service_d_app/views/app/privacyPolicy/privacy_policy.dart';
import 'package:regal_service_d_app/views/app/profile/profile_details_screen.dart';
import 'package:regal_service_d_app/views/app/ratings/ratings_screen.dart';
import 'package:regal_service_d_app/views/app/termsCondition/terms_conditions.dart';
import 'package:regal_service_d_app/views/app/tripWiseVehicle/trip_wise_vehicle_screen.dart';
import '../../../services/collection_references.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/dashed_divider.dart';
import '../../../widgets/reusable_text.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late String role = "";
  bool isCheque = false;
  bool isTeamMember = false;
  final _firebaseAuth = FirebaseAuth.instance;
  final userService = UserService.to;
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  Future<void> fetchUserDetails() async {
    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        // Cast the document data to a map
        final userData = userSnapshot.data() as Map<String, dynamic>;

        setState(() {
          role = userData["role"] ?? "";
          isCheque = userData["isCheque"] ?? false;
          isTeamMember = userData["isTeamMember"] ?? false;
        });
        log("Role set to ${role} and isCheque set to ${isCheque} for user ID: $currentUId and isTeamMember set to ${isTeamMember}");
      } else {
        log("No user document found for ID: $currentUId");
      }
    } catch (e) {
      log("Error fetching user details: $e");
      setState(() {});
    }
  }

  @override
  void initState() {
    super.initState();
    fetchUserDetails();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Menu",
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(20, kDark, FontWeight.normal)),
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
                          "Manage Profile",
                          style: kIsWeb
                              ? TextStyle(color: kPrimary)
                              : appStyle(18, kPrimary, FontWeight.normal),
                        ),
                        SizedBox(width: 5.w),
                        Container(width: 30.w, height: 3.h, color: kSecondary),
                      ],
                    ),
                    SizedBox(height: 15.h),
                    const DashedDivider(color: kGrayLight),
                    SizedBox(height: 10.h),
                    buildListTile("assets/bookings_bw.png", "History", () {
                      Get.to(() => HistoryScreen());
                    }),
                    buildListTile("assets/profile_bw.png", "My Profile", () {
                      Get.to(() => ProfileDetailsScreen());
                    }),
                    buildListTile("assets/myvehicles.png", "My Vehicles", () {
                      Get.to(() => MyVehiclesScreen());
                    }),
                    isCheque
                        ? buildListTile("assets/cheque.png", "Manage Check",
                            () {
                            Get.to(() => ManageCheckScreen());
                          })
                        : Container(),
                    if (role == "Owner" ||
                        role == "Manager" ||
                        role == "Accountant") ...[
                      buildListTile("assets/team.png", "Manage Team", () {
                        Get.to(() => MyTeamScreen());
                      })
                    ],
                    if (role == "Owner" || role == "Driver") ...[
                      buildListTile("assets/manage_trip.png", "My Trips", () {
                        Get.to(() => ManageTripsScreen());
                      }),
                    ],
                    if (role == "Owner" || role == "Manager") ...[
                      buildListTile(
                          "assets/manage_trip.png", "Trips Wise Vehicle", () {
                        Get.to(() => TripWiseVehicleScreen());
                      }),
                    ],
                    buildListTile("assets/rating_bw.png", "Ratings", () {
                      Get.to(() => RatingsScreen());
                    }),
                    buildListTile("assets/notification_setting.png",
                        "Notification ON/OFF", () {
                      Get.to(() => NotificationScreenSetting());
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
                          style: kIsWeb
                              ? TextStyle(color: kPrimary)
                              : appStyle(18, kPrimary, FontWeight.normal),
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
                      "assets/out_bw.png",
                      "Logout",
                      () {
                        showDialog<void>(
                          context: context,
                          barrierDismissible: true,
                          builder: (BuildContext dialogContext) {
                            return AlertDialog(
                              title: const Text('Logout'),
                              content: const Text(
                                'Are you sure you want to log out from this account',
                              ),
                              actions: <Widget>[
                                TextButton(
                                  child: Text(
                                    'Yes',
                                    style: appStyle(
                                        15, kSecondary, FontWeight.normal),
                                  ),
                                  onPressed: () async {
                                    try {
                                      if (isTeamMember == true) {
                                        await FirebaseFirestore.instance
                                            .collection('Users')
                                            .doc(currentUId)
                                            .update({
                                          'fcmToken': '',
                                          'active': false,
                                        });
                                      } else {
                                        await FirebaseFirestore.instance
                                            .collection('Users')
                                            .doc(currentUId)
                                            .update({
                                          'fcmToken': '',
                                        });
                                      }

                                      await userService.signOut();
                                      log("User signed out successfully userid : $currentUId");

                                      // if (context.mounted)
                                      //   Navigator.pop(
                                      //       dialogContext); // close dialog
                                      // Get.offAll(() => const LoginScreen(),
                                      //     transition: Transition.cupertino,
                                      //     duration: const Duration(
                                      //         milliseconds: 900));
                                    } catch (e) {
                                      log("Error signing out: $e");
                                      if (context.mounted) {
                                        Navigator.pop(dialogContext);
                                        showToastMessage("Error",
                                            "Failed to logout", Colors.red);
                                      }
                                    }
                                  },
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(dialogContext),
                                  child: Text(
                                    "No",
                                    style: appStyle(
                                        15, kPrimary, FontWeight.normal),
                                  ),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    )
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
        title: Text(title,
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(13, kDark, FontWeight.normal)),
        // onTap: onTap,
      ),
    );
  }

//================================ top Profile section =============================
  Container buildTopProfileSection() {
    return Container(
      height: kIsWeb ? 180.h : 120.h,
      width: double.maxFinite,
      padding: EdgeInsets.only(left: 12.w, right: 12.w, top: 12.w),
      decoration: BoxDecoration(
        color: kLightWhite,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('Users')
            .doc(currentUId)
            .snapshots(),
        builder:
            (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
          if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data!.data() as Map<String, dynamic>;
          final profilePictureUrl = data['profilePicture'] ?? '';
          final userName = data['userName'] ?? '';
          final email = data['email'] ?? '';
          final wallet = data["wallet"] ?? "";

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 33.r,
                backgroundColor: kSecondary,
                child: profilePictureUrl.isEmpty
                    ? Text(
                        userName.isNotEmpty ? userName[0] : '',
                        style: kIsWeb
                            ? TextStyle(color: kWhite)
                            : appStyle(20, kWhite, FontWeight.bold),
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
                      style: kIsWeb
                          ? TextStyle(color: kDark)
                          : appStyle(15, kDark, FontWeight.bold),
                    ),
                    ReusableText(
                      text: email.isNotEmpty ? email : '',
                      style: kIsWeb
                          ? TextStyle(color: kDark)
                          : appStyle(12, kDark, FontWeight.normal),
                    ),
                    Spacer(),
                    Container(
                      height: 30.h,
                      width: kIsWeb ? 80.w : 140.w,
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
                            style: kIsWeb
                                ? TextStyle(color: kWhite)
                                : appStyle(17, kWhite, FontWeight.bold),
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

  // TextButton(
  //                             child: const Text('Logout'),
  //                             onPressed: () async {
  //                               await ZegoUIKitPrebuiltCallInvitationService()
  //                                   .uninit();
  //                               await AuthRepository().signOut();
  //                               Navigator.pushAndRemoveUntil(
  //                                 context,
  //                                 MaterialPageRoute(
  //                                     builder: (BuildContext context) =>
  //                                         const WelcomeScreen()),
  //                                 (Route<dynamic> route) =>
  //                                     false, // Remove all previous routes
  //                               );
  //                             }

  //                             ),

//================ Signout from the app ====================

  // void logOutUser(BuildContext context) async {
  //   try {
  //     log("Signing out user...");
  //     final navigator = Navigator.of(context);
  //     String? uid = auth.currentUser?.uid;

  //     if (uid != null) {
  //       await FirebaseFirestore.instance.collection('Users').doc(uid).update({
  //         'fcmToken': FieldValue.delete(),
  //       });
  //     }

  //     // Stop Firestore Listeners
  //     FirebaseFirestore.instance.terminate();

  //     // Clear Firestore Cache Before Sign-Out
  //     await FirebaseFirestore.instance.clearPersistence();

  //     // Sign out from Firebase
  //     await auth.signOut();
  //     clearControllers();
  //     log("User should be signed out.");

  //     // Wait & force FirebaseAuth to reload session
  //     await Future.delayed(const Duration(milliseconds: 500));
  //     await FirebaseAuth.instance.currentUser?.reload();

  //     // Check if user is null
  //     var currentUser = FirebaseAuth.instance.currentUser;
  //     log("User after sign out: $currentUser"); // Should be null

  //     // Ensure User is Fully Signed Out
  //     FirebaseAuth.instance.authStateChanges().listen((user) {
  //       log("AuthState after signOut: ${user?.uid}"); // Should print "null"
  //     });

  //     // Navigate to Login Screen
  //     // Get.offAll(() => const LoginScreen());
  //     // Clear GetX controllers and app state
  //     Get.reset();

  //     // Force close the app (works on Android)
  //     SystemChannels.platform.invokeMethod('SystemNavigator.pop');
  //     log("User signed out successfully: $uid");
  //   } catch (e) {
  //     showToastMessage("Error", e.toString(), Colors.red);
  //   }
  // }

  Future<void> signOut() async {
    try {
      await _firebaseAuth.signOut();
    } catch (e) {
      throw Exception(e);
    }
  }

  void clearControllers() {
    Get.delete<DashboardController>(force: true);
    Get.delete<AuthController>(force: true);
    Get.delete<TabIndexController>(force: true);
    // Remove Any Stored GetX Data
    Get.deleteAll();
  }
}
