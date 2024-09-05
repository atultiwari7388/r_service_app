import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/request_history_card.dart';
import '../../../widgets/reusable_text.dart';
import '../../profile/profile_screen.dart';

class HistoryCompletedScreen extends StatelessWidget {
  const HistoryCompletedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "History", style: appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => ProfileScreen()),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            children: [
              // ListView.builder(
              //   shrinkWrap: true,
              //   physics: NeverScrollableScrollPhysics(),
              //   itemCount: 10, // Replace with actual number of requests
              //   itemBuilder: (ctx, index) {
              //     return RequestHistoryCard();
              //   },
              // ),
              RequestHistoryCard(
                shopName: "Repair Shop",
                date: "24 Aug 2024",
                rating: "4.7",
                payAdvance: "180",
                isOrderCompleted: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
