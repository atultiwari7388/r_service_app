import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/request_history_card.dart';
import '../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "Requests", style: appStyle(20, kDark, FontWeight.normal)),
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
                time: "20 min",
                distance: "5 km",
                rating: "4.7",
                payAdvance: "180",
                onAcceptTap: () => _showConfirmDialog("180"),
              ),

              RequestHistoryCard(
                shopName: "Mechanic Bond",
                time: "10 min",
                distance: "2 km",
                rating: "4.1",
                payAdvance: "150",
                onAcceptTap: () => _showConfirmDialog("150"),
              ),

              RequestHistoryCard(
                shopName: "Gear Arena",
                time: "36 min",
                distance: "20 km",
                rating: "4.6",
                payAdvance: "250",
                onAcceptTap: () => _showConfirmDialog("250"),
              ),
              SizedBox(height: 70.h)
            ],
          ),
        ),
      ),
    );
  }

  void _showConfirmDialog(price) {
    Get.defaultDialog(
      title: "Confirm",
      middleText: "Are you sure you want to accept this offer?",
      textCancel: "No",
      textConfirm: "Yes",
      cancel: OutlinedButton(
        onPressed: () {
          Get.back(); // Close the dialog if "No" is pressed
        },
        child: Text(
          "No",
          style: TextStyle(color: Colors.red), // Custom color for "No" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the current dialog
          _showPayDialog(price); // Show the pay dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Yes" button
        ),
        child: Text(
          "Yes",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  void _showPayDialog(price) {
    Get.defaultDialog(
      title: "Pay \$$price Price",
      middleText: "Please proceed to pay.",
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the pay dialog
          showToastMessage(
              "Payment Success", "You have successfully Paid \$$price", kSuccess);
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kSecondary, // Custom color for "Pay" button
        ),
        child: Text(
          "Pay",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}
