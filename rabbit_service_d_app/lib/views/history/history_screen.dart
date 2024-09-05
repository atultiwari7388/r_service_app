import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/views/myJobs/widgets/my_jobs_card.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _selectedSortOption = "Sort";
  int? _selectedCardIndex;

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
          if (_selectedCardIndex == null) // Show only if no card is selected
            GestureDetector(
              onTap: () => Get.to(() => ProfileScreen()),
              child: CircleAvatar(
                radius: 19.r,
                backgroundColor: kPrimary,
                child:
                    Text("A", style: appStyle(18, kWhite, FontWeight.normal)),
              ),
            ),
          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              if (_selectedCardIndex == null)
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                      decoration: BoxDecoration(
                        color: kPrimary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8.0.r),
                      ),
                      child: PopupMenuButton<String>(
                        onSelected: (value) {
                          setState(() {
                            _selectedSortOption =
                                value; // Update the button text
                          });
                          // Implement your sorting logic here if needed
                          print('Selected sort option: $value');
                        },
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            value: "Near by",
                            child: Text("Near by"),
                          ),
                          PopupMenuItem(
                            value: "Price",
                            child: Text("Price"),
                          ),
                          PopupMenuItem(
                            value: "Review",
                            child: Text("Review"),
                          ),
                        ],
                        child: Row(
                          children: [
                            Icon(Icons.sort, color: kPrimary),
                            SizedBox(width: 4.w),
                            Text(
                              _selectedSortOption, // Show the selected option
                              style: appStyle(16.sp, kPrimary, FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              SizedBox(height: 10.h),
              MyJobsCard(
                companyNameAndVehicleName: "Freightliner (A45-143)",
                address: "STPI - 2nd phase, Mohali PB.",
                serviceName: "5th wheel",
                jobId: "#RMS0001",
                imagePath: "assets/images/profile.jpg",
                dateTime: "25 Aug 2024, 14:08:27",
                isStatusCompleted: true,
              ),
              SizedBox(height: 10.h),
              MyJobsCard(
                companyNameAndVehicleName: "International (B65-128)",
                address: "Sector 20 , Panchkula Haryana",
                serviceName: "Alignment Trailer",
                jobId: "#RMS0002",
                imagePath: "assets/images/profile.jpg",
                dateTime: "2 Sept 2024, 6:00:27",
                isStatusCompleted: true,
              ),
              SizedBox(height: 50.h)
            ],
          ),
        ),
      ),
    );
  }
}
