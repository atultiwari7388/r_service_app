import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/widgets/custom_background_container.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/reusable_text.dart';

class UploadRequestsScreen extends StatelessWidget {
  const UploadRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        title: ReusableText(
            text: "Upload", style: appStyle(20, kDark, FontWeight.normal)),
      ),
      body: CustomBackgroundContainer(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [],
        ),
        horizontalW: 10.w,
        vertical: 10.h,
      ),
    );
  }
}
