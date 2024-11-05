import 'dart:developer';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../controllers/dashboard_controller.dart';
import '../../../../utils/constants.dart';

class OurServicesView extends StatelessWidget {
  final DashboardController controller;

  OurServicesView({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16), // Increased padding for better layout on web
      // constraints: BoxConstraints(maxWidth: 1200), // Limit max width on web
      decoration: BoxDecoration(
        color: kSecondary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, // Show 3 items per row
          crossAxisSpacing: 1,
          mainAxisSpacing: 1,
          childAspectRatio: 6 / 5,
        ),
        itemCount: controller.filteredServiceAndNetworkOptions
            .where((item) => item['isFeatured'] == true)
            .length, // Count only featured items
        itemBuilder: (context, index) {
          final item = controller.filteredServiceAndNetworkOptions
              .where((item) => item['isFeatured'] == true)
              .toList()[index]; // Get featured item
          return _buildServiceItem(item);
        },
      ),
    );
  }

  Widget _buildServiceItem(Map<String, dynamic> item) {
    String title = item['title'];
    int imageType = item['image_type'];
    int priceType = item['price_type'];

    return GestureDetector(
      onTap: () {
        // onTap functionality as provided
        controller.serviceAndNetworkController.text = title;
        controller.isServiceSelected = true; // Service selected
        controller.checkIfAllSelected();

        // Check and update image upload options
        if (imageType == 0) {
          controller.imageUploadEnabled = true;
          controller.isImageMandatory = false;
        } else if (imageType == 1) {
          controller.imageUploadEnabled = true;
          controller.isImageMandatory = true;
        } else {
          controller.imageUploadEnabled = false;
          controller.isImageMandatory = false;
        }

        // Check and update price options
        if (priceType == 1) {
          controller.fixPriceEnabled = true;
        } else {
          controller.fixPriceEnabled = false;
        }

        // Log the selected item details
        log("Selected Service Name $title, imageType: $imageType, priceType: $priceType");

        // Trigger a rebuild to reflect the changes
        // You may want to use a callback or a provider instead of setState in a stateless widget
      },
      child: Container(
        margin: EdgeInsets.all(5), // Margin around each item
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: kSecondary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: kWhite,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Image.network(
                item["image"],
                color: Colors.black,
                height: 30.h, // Image height
                width: 30.w, // Image width
              ),
            ),
            Flexible(
              child: Text(
                title,
                style: TextStyle(color: Colors.white, fontSize: 12),
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
// import 'dart:developer';
// import 'package:flutter/foundation.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import '../../../../controllers/dashboard_controller.dart';
// import '../../../../utils/constants.dart';

// class OurServicesView extends StatelessWidget {
//   final DashboardController controller;

//   OurServicesView({required this.controller});

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       padding: kIsWeb
//           ? EdgeInsets.all(8)
//           : EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
//       decoration: BoxDecoration(
//         color: kSecondary.withOpacity(0.1),
//         borderRadius: BorderRadius.circular(12.r),
//       ),
//       child: GridView.builder(
//         shrinkWrap: true,
//         physics: NeverScrollableScrollPhysics(),
//         gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
//           crossAxisCount: 3, // Show 3 items per row
//           crossAxisSpacing: 1,
//           mainAxisSpacing: 1,
//           childAspectRatio: 6 / 5,
//         ),
//         itemCount: controller.filteredServiceAndNetworkOptions
//             .where((item) => item['isFeatured'] == true)
//             .length, // Count only featured items
//         itemBuilder: (context, index) {
//           final item = controller.filteredServiceAndNetworkOptions
//               .where((item) => item['isFeatured'] == true)
//               .toList()[index]; // Get featured item
//           return _buildServiceItem(item);
//         },
//       ),
//     );
//   }

//   Widget _buildServiceItem(Map<String, dynamic> item) {
//     String title = item['title'];
//     int imageType = item['image_type'];
//     int priceType = item['price_type'];

//     return GestureDetector(
//       onTap: () {
//         // onTap functionality as provided
//         controller.serviceAndNetworkController.text = title;
//         controller.isServiceSelected = true; // Service selected
//         controller.checkIfAllSelected();

//         // Check and update image upload options
//         if (imageType == 0) {
//           controller.imageUploadEnabled = true;
//           controller.isImageMandatory = false;
//         } else if (imageType == 1) {
//           controller.imageUploadEnabled = true;
//           controller.isImageMandatory = true;
//         } else {
//           controller.imageUploadEnabled = false;
//           controller.isImageMandatory = false;
//         }

//         // Check and update price options
//         if (priceType == 1) {
//           controller.fixPriceEnabled = true;
//         } else {
//           controller.fixPriceEnabled = false;
//         }

//         // Log the selected item details
//         log("Selected Service Name $title, imageType: $imageType, priceType: $priceType");

//         // Trigger a rebuild to reflect the changes
//         // You may want to use a callback or a provider instead of setState in a stateless widget
//       },
//       child: Container(
//         margin: EdgeInsets.all(8), // Margin around each item
//         padding: EdgeInsets.all(8),
//         decoration: BoxDecoration(
//           color: kSecondary,
//           borderRadius: BorderRadius.circular(8),
//         ),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Container(
//               padding: EdgeInsets.all(8),
//               decoration: BoxDecoration(
//                 color: kWhite,
//                 borderRadius: BorderRadius.circular(12.r),
//               ),
//               child: Image.network(
//                 item["image"],
//                 color: Colors.black,
//                 height: 30.h, // Image height
//                 width: 30.w, // Image width
//               ),
//             ),
//             Flexible(
//               child: Text(
//                 title,
//                 style: TextStyle(color: Colors.white, fontSize: 12),
//                 textAlign: TextAlign.center,
//                 overflow: TextOverflow.ellipsis,
//                 maxLines: 1,
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }
