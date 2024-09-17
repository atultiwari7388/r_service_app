import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';


class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() =>
      _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  HelpCenterData? helpCenterData;
  bool _isEditing = false; // Editing mode toggle
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _mailController = TextEditingController();

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
          _phoneController.text = helpCenterData?.phone ?? ''; // Set initial value
          _mailController.text = helpCenterData?.mail ?? '';   // Set initial value
        });
      }
    });
  }

  Future<void> _updateHelpCenterData() async {
    if (helpCenterData != null) {
      FirebaseFirestore.instance.collection('metadata').doc('helpCenter').update({
        'phone': _phoneController.text,
        'mail': _mailController.text,
      }).then((value) {
        log('Help center data updated');
        setState(() {
          _isEditing = false;
        });
      }).catchError((error) {
        log('Failed to update data: $error');
      });
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _mailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 1,
        title: Text("Help Center"),
        actions: [
          _isEditing
              ? IconButton(
            icon: const Icon(Icons.save),
            onPressed: _updateHelpCenterData,
          )
              : IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              setState(() {
                _isEditing = true;
              });
            },
          ),
        ],
      ),
      body: helpCenterData == null
          ? const Center(child: CircularProgressIndicator())
          : Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset("assets/help-center.png",
                height: 200.h, width: double.maxFinite),
            SizedBox(height: 30.h),
            Text("We are happy to help you",
                style: appStyle(20, kDark, FontWeight.normal)),
            Text("24*7", style: appStyle(17, kDark, FontWeight.normal)),
            SizedBox(height: 20.h),

            // Phone and Mail TextFields if editing, otherwise display them
            _isEditing
                ? Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Column(
                                children: [
                  TextField(
                    controller: _phoneController,
                    decoration: InputDecoration(
                      labelText: "Phone",
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                  SizedBox(height: 20.h),
                  TextField(
                    controller: _mailController,
                    decoration: InputDecoration(
                      labelText: "Email",
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                                ],
                              ),
                )
                : Column(
              children: [
                Text("Phone: ${helpCenterData?.phone ?? ''}",
                    style: appStyle(16, kDark, FontWeight.normal)),
                SizedBox(height: 10.h),
                Text("Email: ${helpCenterData?.mail ?? ''}",
                    style: appStyle(16, kDark, FontWeight.normal)),
              ],
            ),

            // Call and Mail Buttons
            SizedBox(height: 20.h),
            // Row(
            //   mainAxisAlignment: MainAxisAlignment.center,
            //   children: [
            //     ElevatedButton.icon(
            //       onPressed: () async {
            //         if (helpCenterData != null &&
            //             helpCenterData!.phone != null) {
            //           // await makePhoneCall(helpCenterData!.phone!);
            //           log(helpCenterData!.phone!.toString());
            //         }
            //       },
            //       icon: const Icon(Icons.call, color: kWhite),
            //       label: Text("Call",
            //           style: appStyle(16, kWhite, FontWeight.w500)),
            //       style: ElevatedButton.styleFrom(
            //           elevation: 1,
            //           shape: RoundedRectangleBorder(
            //               borderRadius: BorderRadius.circular(12.r)),
            //           backgroundColor: kSecondary,
            //           minimumSize: Size(120.w, 46.h)),
            //     ),
            //     SizedBox(width: 20.w),
            //     ElevatedButton.icon(
            //       onPressed: () async {
            //         if (helpCenterData != null &&
            //             helpCenterData!.mail != null) {
            //           // await sendMail(helpCenterData!.mail!);
            //           log(helpCenterData!.mail!.toString());
            //         }
            //       },
            //       icon: const Icon(Icons.mail, color: kWhite),
            //       label: Text("Mail",
            //           style: appStyle(16, kWhite, FontWeight.normal)),
            //       style: ElevatedButton.styleFrom(
            //           elevation: 1,
            //           shape: RoundedRectangleBorder(
            //               borderRadius: BorderRadius.circular(12.h)),
            //           backgroundColor: kPrimary,
            //           minimumSize: Size(120.w, 46.h)),
            //     ),
            //   ],
            // ),
            //
          ],
        ),
      ),
      // bottomSheet: Container(
      //   padding: EdgeInsets.all(10.h),
      //   margin: EdgeInsets.all(10.h),
      //   child: Row(
      //     mainAxisAlignment: MainAxisAlignment.center,
      //     children: [
      //       ReusableText(
      //           text: "Powered By",
      //           style: appStyle(15, kSecondary, FontWeight.bold)),
      //       SizedBox(width: 5.w),
      //       ReusableText(
      //           text: "@$appName",
      //           style: appStyle(15, kPrimary, FontWeight.bold)),
      //     ],
      //   ),
      // ),
      //
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
