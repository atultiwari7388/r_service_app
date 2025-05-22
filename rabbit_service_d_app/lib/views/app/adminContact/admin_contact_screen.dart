import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class AdminContactScreen extends StatefulWidget {
  const AdminContactScreen({super.key});

  @override
  State<AdminContactScreen> createState() => _AdminContactScreenState();
}

class _AdminContactScreenState extends State<AdminContactScreen> {
  //========================================

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
    return Scaffold(
      appBar: AppBar(elevation: 1, title: Text("Admin Contact")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: kPrimary,
              size: 80,
            ),
            SizedBox(height: 20),
            Text(
              "Account Deactivated",
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: kPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 10),
            Text(
              "Your Account is deactivated, kindly contact with your office.",
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[700],
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 30.h),
            Text("We are happy to help you",
                style: appStyle(20, kDark, FontWeight.normal)),
            Text("24*7", style: appStyle(17, kDark, FontWeight.normal)),
            SizedBox(height: 20.h),

            // Two Buttons in a Row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Call Button
                ElevatedButton.icon(
                  onPressed: () async {
                    if (helpCenterData != null &&
                        helpCenterData!.phone != null) {
                      await makePhoneCall(helpCenterData!.phone!);
                      log(helpCenterData!.phone!.toString());
                    }
                  },
                  icon: const Icon(Icons.call, color: kWhite),
                  label: Text("Call",
                      style: appStyle(16, kWhite, FontWeight.w500)),
                  style: ElevatedButton.styleFrom(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.r)),
                      backgroundColor: kSecondary,
                      minimumSize: Size(120.w, 46.h)),
                ),
                SizedBox(width: 20.w),

                // Mail Button
                ElevatedButton.icon(
                  onPressed: () async {
                    if (helpCenterData != null &&
                        helpCenterData!.mail != null) {
                      await sendMail(helpCenterData!.mail!);
                      log(helpCenterData!.mail!.toString());
                      // _sendMail(helpCenterData!.mail!);
                    }
                  },
                  icon: const Icon(Icons.mail, color: kWhite),
                  label: Text("Mail",
                      style: appStyle(16, kWhite, FontWeight.normal)),
                  style: ElevatedButton.styleFrom(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.h)),
                      backgroundColor: kPrimary,
                      minimumSize: Size(120.w, 46.h)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class HelpCenterData {
  final String? mail;
  final String? phone;

  HelpCenterData({this.mail, this.phone});

  factory HelpCenterData.fromMap(Map<String, dynamic> map) {
    return HelpCenterData(
      mail: map['mail'],
      phone: map['phone'],
    );
  }
}
