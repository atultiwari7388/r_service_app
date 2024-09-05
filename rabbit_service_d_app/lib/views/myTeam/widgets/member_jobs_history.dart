import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/views/myJobs/widgets/my_jobs_card.dart';
import 'package:regal_service_d_app/views/myTeam/widgets/memebr_jobs_card.dart';

class MemberJobsHistoryScreen extends StatelessWidget {
  const MemberJobsHistoryScreen({super.key, required this.memberName});
  final String memberName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${memberName} History"),
      ),
      body: SingleChildScrollView(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: 10.h),
              MemberJobsCard(
                companyNameAndVehicleName: "Freightliner (A45-143)",
                address: "STPI - 2nd phase, Mohali PB.",
                serviceName: "5th wheel",
                jobId: "#RMS0001",
                imagePath: "assets/images/profile.jpg",
                dateTime: "25 Aug 2024, 14:08:27",
                status: "Ongoing",
                charges: "20",
              ),
              SizedBox(height: 10.h),
              MemberJobsCard(
                companyNameAndVehicleName: "International (B65-128)",
                address: "Sector 20 , Panchkula Haryana",
                serviceName: "Alignment Trailer",
                jobId: "#RMS0002",
                imagePath: "assets/images/profile.jpg",
                dateTime: "2 Sept 2024, 6:00:27",
                status: "Completed",
                charges: "15",
              ),
              SizedBox(height: 50.h)
            ],
          ),
        ),
      ),
    );
  }
}
