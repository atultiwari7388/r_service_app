import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/cloud_noti_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/our_services.dart';
import '../../../services/collection_references.dart';
import '../profile/profile_screen.dart';
import 'widgets/find_mechanic.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key, required this.setTab});

  final Function? setTab;

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  @override
  Widget build(BuildContext context) {
    return GetBuilder<DashboardController>(
      init: DashboardController(),
      builder: (controller) {
        if (controller.isLoading) {
          return Center(child: CircularProgressIndicator());
        } else {
          return controller.appbarTitle.isEmpty
              ? Center(child: CircularProgressIndicator())
              : Scaffold(
                  appBar: AppBar(
                    backgroundColor: kWhite,
                    elevation: 1,
                    centerTitle: true,
                    title: Image.asset(
                      'assets/h_n_logo-removebg.png',
                      height: 50.h,
                    ),
                    actions: [
                      StreamBuilder<QuerySnapshot>(
                        stream: FirebaseFirestore.instance
                            .collection('Users')
                            .doc(currentUId)
                            .collection('UserNotifications')
                            .where('isRead', isEqualTo: false)
                            .snapshots(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) {
                            return Container();
                          }
                          int unreadCount = snapshot.data!.docs.length;
                          return unreadCount > 0
                              ? Badge(
                                  backgroundColor: kSecondary,
                                  label: Text(unreadCount.toString(),
                                      style: appStyle(
                                          12, kWhite, FontWeight.normal)),
                                  child: GestureDetector(
                                    onTap: () => Get.to(
                                        () => CloudNotificationMessageCenter()),
                                    child: CircleAvatar(
                                        backgroundColor: kPrimary,
                                        radius: 17.r,
                                        child: Icon(Icons.notifications,
                                            size: 25.sp, color: kWhite)),
                                  ),
                                )
                              : Badge(
                                  backgroundColor: kSecondary,
                                  label: Text(unreadCount.toString(),
                                      style: appStyle(
                                          12, kWhite, FontWeight.normal)),
                                  child: GestureDetector(
                                    onTap: () => Get.to(
                                        () => CloudNotificationMessageCenter()),
                                    child: CircleAvatar(
                                        backgroundColor: kPrimary,
                                        radius: 17.r,
                                        child: Icon(Icons.notifications,
                                            size: 25.sp, color: kWhite)),
                                  ),
                                );
                        },
                      ),
                      SizedBox(width: 10.w),
                      GestureDetector(
                        onTap: () => Get.to(() => const ProfileScreen(),
                            transition: Transition.cupertino,
                            duration: const Duration(milliseconds: 900)),
                        child: CircleAvatar(
                          radius: 19.r,
                          backgroundColor: kPrimary,
                          child: StreamBuilder<DocumentSnapshot>(
                            stream: FirebaseFirestore.instance
                                .collection('Users')
                                .doc(currentUId)
                                .snapshots(),
                            builder: (BuildContext context,
                                AsyncSnapshot<DocumentSnapshot> snapshot) {
                              if (snapshot.hasError) {
                                return Text('Error: ${snapshot.error}');
                              }

                              if (snapshot.connectionState ==
                                  ConnectionState.waiting) {
                                // return Container();
                                return const CircularProgressIndicator();
                              }

                              final data =
                                  snapshot.data!.data() as Map<String, dynamic>;
                              controller.userPhoto =
                                  data['profilePicture'] ?? '';
                              controller.userName = data['userName'] ?? '';
                              controller.phoneNumber =
                                  data['phoneNumber'] ?? '';

                              if (controller.userPhoto.isEmpty) {
                                return Text(
                                  controller.userName.isNotEmpty
                                      ? controller.userName[0]
                                      : '',
                                  style: appStyle(20, kWhite, FontWeight.w500),
                                );
                              } else {
                                return ClipOval(
                                  child: Image.network(
                                    controller.userPhoto,
                                    width: 38.r,
                                    // Set appropriate size for the image
                                    height: 35.r,
                                    fit: BoxFit.cover,
                                  ),
                                );
                              }
                            },
                          ),
                        ),
                      ),
                      SizedBox(width: 20.w),
                    ],
                  ),
                  body: SingleChildScrollView(
                    child: Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FindMechanic(
                              controller: controller, setTab: widget.setTab),
                          SizedBox(height: 12.h),
                          // Quick Search Section
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Our Services',
                                style: kIsWeb
                                    ? TextStyle(color: kDark)
                                    : appStyle(22, kDark, FontWeight.w500)),
                          ),
                          SizedBox(height: 10.h),

                          OurServicesView(controller: controller),
                          SizedBox(height: 20.h),
                        ],
                      ),
                    ),
                  ),
                );
        }
      },
    );
  }
}
