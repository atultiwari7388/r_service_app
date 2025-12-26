import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/userRoleService.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/aboutUs/about_us_screen.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
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
import 'package:regal_service_d_app/views/app/truckDispatch/truck_disptach_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
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
  bool isAnonymous = true;
  bool isProfileComplete = false;

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
          isAnonymous = userData["isAnonymous"] ?? true;
          isProfileComplete = userData["isProfileComplete"] ?? false;
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
                      if (isAnonymous == true || isProfileComplete == false) {
                        Get.to(() => const RegistrationScreen());
                      } else {
                        Get.to(() => ProfileDetailsScreen());
                      }
                    }),
                    buildListTile("assets/myvehicles.png", "My Vehicles", () {
                      Get.to(() => MyVehiclesScreen());
                    }),
                    role == 'Driver'
                        ? SizedBox()
                        : buildListTile("assets/cheque.png", "Manage Check",
                            () {
                            if (isCheque == true) {
                              Get.to(() => ManageCheckScreen());
                            } else {
                              showToastMessage(
                                  "Info",
                                  "You are not allowed to access this feature",
                                  Colors.red);
                            }
                          }),
                    if (role == "Owner" ||
                        role == "Manager" ||
                        role == "Accountant" ||
                        role == "SubOwner") ...[
                      buildListTile("assets/team.png", "Manage Team", () {
                        Get.to(() => MyTeamScreen());
                      })
                    ],
                    if (role == "Owner" ||
                        role == "Driver" ||
                        role == "SubOwner") ...[
                      buildListTile("assets/manage_trip.png", "My Trips", () {
                        if (isAnonymous == true || isProfileComplete == false) {
                          Get.to(() => RegistrationScreen());
                        } else {
                          Get.to(() => ManageTripsScreen());
                        }
                      }),
                    ],
                    if (role == "Owner" || role == "Manager") ...[
                      buildListTile(
                          "assets/manage_trip.png", "Trips Wise Vehicle", () {
                        if (isAnonymous == true || isProfileComplete == false) {
                          Get.to(() => RegistrationScreen());
                        } else {
                          Get.to(() => TripWiseVehicleScreen());
                        }
                      }),
                    ],
                    buildListTile("assets/rating_bw.png", "Ratings", () {
                      Get.to(() => RatingsScreen());
                    }),
                    buildListTile("assets/rating_bw.png", "Truck Dispatch", () {
                      Get.to(() => TruckDispatchDashboard());
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
                    (isAnonymous == true || isProfileComplete == false)
                        ? SizedBox()
                        : buildListTile(
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
                                          style: appStyle(15, kSecondary,
                                              FontWeight.normal),
                                        ),
                                        onPressed: () async {
                                          try {
                                            if (isTeamMember == true) {
                                              await FirebaseFirestore.instance
                                                  .collection('Users')
                                                  .doc(currentUId)
                                                  .update({
                                                'fcmToken': '',
                                                'currentDeviceId': null,
                                                // 'active': false,
                                              });
                                            } else {
                                              await FirebaseFirestore.instance
                                                  .collection('Users')
                                                  .doc(currentUId)
                                                  .update({
                                                'fcmToken': '',
                                                'currentDeviceId': null,
                                              });
                                            }

                                            await userService.signOut();
                                            log("User signed out successfully userid : $currentUId");
                                          } catch (e) {
                                            log("Error signing out: $e");
                                            if (context.mounted) {
                                              Navigator.pop(dialogContext);
                                              showToastMessage(
                                                  "Error",
                                                  "Failed to logout",
                                                  Colors.red);
                                            }
                                          }
                                        },
                                      ),
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.pop(dialogContext),
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
                          ),
                    (isAnonymous == true || isProfileComplete == false)
                        ? SizedBox()
                        : role == "Owner"
                            ? buildListTile(
                                "assets/delete.png",
                                "Delete Account",
                                () {
                                  showDialog(
                                    context: context,
                                    builder: (_) {
                                      return AlertDialog(
                                        shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(12)),
                                        title: const Text(
                                          'Delete Your Account',
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold),
                                        ),
                                        content: const Text(
                                          'Do you want to permanently delete your account or temporarily deactivate it?\n\n'
                                          '• Permanent deletion will remove all your data forever.\n'
                                          '• Temporary deactivation will hide your account but you can reactivate later.',
                                          style: TextStyle(height: 1.4),
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context),
                                            child: const Text("CANCEL",
                                                style: TextStyle(
                                                    color: Colors.grey)),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(
                                                  context); // Close first dialog
                                              _showTemporaryDeleteConfirmation();
                                            },
                                            child: const Text("TEMPORARY",
                                                style: TextStyle(
                                                    color: Colors.blue)),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(
                                                  context); // Close first dialog
                                              _showPermanentDeleteConfirmation();
                                            },
                                            child: const Text("PERMANENT",
                                                style: TextStyle(
                                                    color: Colors.red)),
                                          ),
                                        ],
                                      );
                                    },
                                  );
                                },
                              )
                            : SizedBox(),
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
    if (isAnonymous == true || isProfileComplete == false) {
      return Container(
        height: 120.h,
        width: double.maxFinite,
        padding: EdgeInsets.only(left: 12.w, right: 12.w, top: 12.w),
        decoration: BoxDecoration(
          color: kLightWhite,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Center(
          child: CustomButton(
              text: "Register/Login",
              onPress: () {
                Get.to(() => const RegistrationScreen());
              },
              color: kPrimary),
        ),
      );
    }

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
                            text: "\$${wallet}",
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
                    Get.offAll(() => const OnBoardingScreen());
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

  void _showTemporaryDeleteConfirmation() {
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
                      .collection('Users')
                      .doc(currentUId)
                      .update({
                    'status': 'deactivated',
                    'deactivatedAt': FieldValue.serverTimestamp(),
                  });

                  // Deactivate team members
                  final teamMembers = await FirebaseFirestore.instance
                      .collection('Users')
                      .where('createdBy', isEqualTo: currentUId)
                      .where('isTeamMember', isEqualTo: true)
                      .get();

                  for (var member in teamMembers.docs) {
                    await FirebaseFirestore.instance
                        .collection('Users')
                        .doc(member.id)
                        .update({
                      'status': 'deactivated',
                      'deactivatedAt': FieldValue.serverTimestamp(),
                    });
                  }

                  // Sign out
                  await userService.signOut();

                  if (mounted) {
                    Navigator.pop(context); // Close loading
                    Get.offAll(() => const OnBoardingScreen());
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
    final userDoc =
        await FirebaseFirestore.instance.collection('Users').doc(userId).get();

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

      // Archive team members if this user is an owner/manager
      if (userData['isTeamMember'] == false) {
        final teamMembers = await FirebaseFirestore.instance
            .collection('Users')
            .where('createdBy', isEqualTo: userId)
            .where('isTeamMember', isEqualTo: true)
            .get();

        for (var member in teamMembers.docs) {
          await FirebaseFirestore.instance
              .collection('deletedMembers')
              .doc(member.id)
              .set({
            ...member.data(),
            'deletedAt': FieldValue.serverTimestamp(),
            'originalId': member.id,
            'deletedBy': userId,
          });
        }
      }
    }
  }

  Future<void> _deleteUserData(String userId) async {
    final firestore = FirebaseFirestore.instance;

    // Fetch user doc
    final userDoc = await firestore.collection('Users').doc(userId).get();

    if (userDoc.exists) {
      final userData = userDoc.data() as Map<String, dynamic>;

      // If the user is not a team member (i.e. owner), delete team members too
      if (userData['isTeamMember'] == false) {
        final teamMembers = await firestore
            .collection('Users')
            .where('createdBy', isEqualTo: userId)
            .where('isTeamMember', isEqualTo: true)
            .get();

        for (var member in teamMembers.docs) {
          await firestore.collection('Users').doc(member.id).delete();

          // Optionally delete team member from Firebase Auth (if stored)
          if (member.data().containsKey('uid')) {
            await _deleteUserFromAuth(member.data()['uid']);
          }
        }
      }

      // Delete owner last
      await firestore.collection('Users').doc(userId).delete();
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
}
