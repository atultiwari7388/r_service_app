import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/reusable_text.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../services/make_call.dart';

class EmergencyContactsScreen extends StatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  State<EmergencyContactsScreen> createState() =>
      _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState extends State<EmergencyContactsScreen> {
  HelpCenterData? helpCenterData;

  @override
  void initState() {
    super.initState();
    _fetchHelpCenterData();
  }

  _fetchHelpCenterData() async {
    FirebaseFirestore.instance
        .collection('metadata')
        .doc('helpCenter')
        .get()
        .then((docSnapshot) {
      if (docSnapshot.exists) {
        setState(() {
          helpCenterData = HelpCenterData.fromMap(
              docSnapshot.data() as Map<String, dynamic>);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 600;

        return Scaffold(
          appBar: AppBar(elevation: 1, title: Text("Help Center")),
          body: Center(
            child: Padding(
              padding:
                  EdgeInsets.symmetric(horizontal: isMobile ? 20.w : 100.w),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Image.asset(
                    "assets/help-center.png",
                    height: isMobile ? 200.h : 250.h,
                    width: double.maxFinite,
                  ),
                  SizedBox(height: isMobile ? 30.h : 40.h),
                  Text(
                    "We are happy to help you",
                    style: kIsWeb
                        ? TextStyle(color: kDark)
                        : appStyle(20, kDark, FontWeight.normal),
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    "24*7",
                    style: kIsWeb
                        ? TextStyle(color: kDark)
                        : appStyle(17, kDark, FontWeight.normal),
                  ),
                  SizedBox(height: isMobile ? 20.h : 30.h),

                  // Buttons with responsive padding and spacing
                  kIsWeb
                      ? Column(
                          // mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () async {
                                if (helpCenterData != null &&
                                    helpCenterData!.phone != null) {
                                  await makePhoneCall(helpCenterData!.phone!);
                                  log(helpCenterData!.phone!.toString());
                                }
                              },
                              icon: const Icon(Icons.call, color: kWhite),
                              label: Text(
                                "Call",
                                style: kIsWeb
                                    ? TextStyle(color: kWhite)
                                    : appStyle(16, kWhite, FontWeight.w500),
                              ),
                              style: ElevatedButton.styleFrom(
                                elevation: 1,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r)),
                                backgroundColor: kSecondary,
                                minimumSize:
                                    Size(isMobile ? 120.w : 40.w, 46.h),
                              ),
                            ),
                            SizedBox(height: 10),
                            ElevatedButton.icon(
                              onPressed: () async {
                                if (helpCenterData != null &&
                                    helpCenterData!.mail != null) {
                                  await sendMail(helpCenterData!.mail!);
                                  log(helpCenterData!.mail!.toString());
                                }
                              },
                              icon: const Icon(Icons.mail, color: kWhite),
                              label: Text(
                                "Mail",
                                style: kIsWeb
                                    ? TextStyle(color: kWhite)
                                    : appStyle(16, kWhite, FontWeight.normal),
                              ),
                              style: ElevatedButton.styleFrom(
                                elevation: 1,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r)),
                                backgroundColor: kPrimary,
                                minimumSize:
                                    Size(isMobile ? 120.w : 40.w, 46.h),
                              ),
                            ),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () async {
                                final uri = Uri.parse(
                                    "https://wa.me/${helpCenterData!.whatsApp!.replaceAll('+', '')}");

                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri,
                                      mode: LaunchMode.externalApplication);
                                } else {
                                  print("Could not launch WhatsApp");
                                }
                              },
                              icon: const Icon(AntDesign.wechat, color: kWhite),
                              label: Text(
                                "WhatsApp",
                                style: kIsWeb
                                    ? TextStyle(color: kWhite)
                                    : appStyle(16, kWhite, FontWeight.w500),
                              ),
                              style: ElevatedButton.styleFrom(
                                elevation: 1,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r)),
                                backgroundColor: kSecondary,
                                minimumSize:
                                    Size(isMobile ? 120.w : 150.w, 46.h),
                              ),
                            ),
                            SizedBox(width: isMobile ? 20.w : 30.w),
                            ElevatedButton.icon(
                              onPressed: () async {
                                if (helpCenterData != null &&
                                    helpCenterData!.mail != null) {
                                  await sendMail(helpCenterData!.mail!);
                                  log(helpCenterData!.mail!.toString());
                                }
                              },
                              icon: const Icon(Icons.mail, color: kWhite),
                              label: Text(
                                "Mail",
                                style: kIsWeb
                                    ? TextStyle(color: kWhite)
                                    : appStyle(16, kWhite, FontWeight.normal),
                              ),
                              style: ElevatedButton.styleFrom(
                                elevation: 1,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r)),
                                backgroundColor: kPrimary,
                                minimumSize:
                                    Size(isMobile ? 120.w : 150.w, 46.h),
                              ),
                            ),
                          ],
                        ),
                ],
              ),
            ),
          ),
          // bottomSheet: Container(
          //   padding: EdgeInsets.symmetric(
          //     vertical: 10.h,
          //     horizontal: isMobile ? 10.w : 20.w,
          //   ),
          //   child: Row(
          //     mainAxisAlignment: MainAxisAlignment.center,
          //     children: [
          //       ReusableText(
          //         text: "Powered By",
          //         style: kIsWeb
          //             ? TextStyle(color: kSecondary)
          //             : appStyle(15, kSecondary, FontWeight.bold),
          //       ),
          //       SizedBox(width: 5.w),
          //       ReusableText(
          //         text: "@$appName",
          //         style: kIsWeb
          //             ? TextStyle(color: kPrimary)
          //             : appStyle(15, kPrimary, FontWeight.bold),
          //       ),
          //     ],
          //   ),
          // ),
        );
      },
    );
  }
}

class HelpCenterData {
  final String? mail;
  final String? phone;
  final String? whatsApp;

  HelpCenterData({this.mail, this.phone, this.whatsApp});

  factory HelpCenterData.fromMap(Map<String, dynamic> map) {
    return HelpCenterData(
      mail: map['mail'],
      phone: map['phone'],
      whatsApp: map['whatsApp'],
    );
  }
}
