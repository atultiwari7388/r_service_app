import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import '../../../../controllers/dashboard_controller.dart';
import '../../../../utils/constants.dart';

class OurServicesView extends StatelessWidget {
  final DashboardController controller;

  OurServicesView({required this.controller});

  // Static data for anonymous users
  final List<Map<String, dynamic>> staticServices = [
    {
      'title': 'Air Leak truck',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Fair_leak.png?alt=media&token=be6ace77-5a1b-47a3-810a-267898176a47',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
    {
      'title': 'Battery',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Fbattery_truck.png?alt=media&token=1125bb12-f7d7-4c6d-9886-ce169927a2a2',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
    {
      'title': 'Electrical',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Felectrical.png?alt=media&token=045c5029-036c-4637-a20a-a6aca8af8d0c',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
    {
      'title': 'Engine Sign',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Fengine_2.png?alt=media&token=8bf21647-1f4e-497d-b625-17b238c4ae1a',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
    {
      'title': 'Tire Steer',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Ftire.png?alt=media&token=4d698c67-3556-45eb-9a00-6607c4301f9c',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
    {
      'title': 'Towing',
      'image':
          'https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/services%2Ftowing_truck.png?alt=media&token=357671cb-6f4b-416a-b963-4e4098ae9819',
      'image_type': 0,
      'price_type': 0,
      'isFeatured': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
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
        itemCount: controller.isAnonymous == true ||
                controller.isProfileComplete == false
            ? staticServices.length // Use static data count
            : controller.filteredServiceAndNetworkOptions
                .where((item) => item['isFeatured'] == true)
                .length, // Count only featured items from API
        itemBuilder: (context, index) {
          if (controller.isAnonymous == true ||
              controller.isProfileComplete == false) {
            // Use static data for anonymous/incomplete profile users
            final item = staticServices[index];
            return _buildServiceItem(item, isAnonymous: true, context: context);
          } else {
            // Use API data for authenticated users
            final item = controller.filteredServiceAndNetworkOptions
                .where((item) => item['isFeatured'] == true)
                .toList()[index];
            return _buildServiceItem(item,
                isAnonymous: false, context: context);
          }
        },
      ),
    );
  }

  Widget _buildServiceItem(
    Map<String, dynamic> item, {
    required bool isAnonymous,
    required BuildContext context,
  }) {
    String title = item['title'];
    int imageType = item['image_type'];
    int priceType = item['price_type'];

    return GestureDetector(
      onTap: () {
        if (isAnonymous) {
          showToastMessage("Info!", "Login or Create account ", kOrange);
        } else {
          // Original functionality for authenticated users
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
        }
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
                errorBuilder: (context, error, stackTrace) {
                  // Fallback widget if image fails to load
                  return Icon(
                    Icons.build_circle_outlined,
                    size: 30.h,
                    color: Colors.black,
                  );
                },
              ),
            ),
            SizedBox(height: 4.h),
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
//       padding: EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         color: kSecondary.withOpacity(0.1),
//         borderRadius: BorderRadius.circular(12.r),
//       ),
//       child: controller.isAnonymous == true ||
//               controller.isProfileComplete == false
//           ? Container()
//           : GridView.builder(
//               shrinkWrap: true,
//               physics: NeverScrollableScrollPhysics(),
//               gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
//                 crossAxisCount: 3, // Show 3 items per row
//                 crossAxisSpacing: 1,
//                 mainAxisSpacing: 1,
//                 childAspectRatio: 6 / 5,
//               ),
//               itemCount: controller.filteredServiceAndNetworkOptions
//                   .where((item) => item['isFeatured'] == true)
//                   .length, // Count only featured items
//               itemBuilder: (context, index) {
//                 final item = controller.filteredServiceAndNetworkOptions
//                     .where((item) => item['isFeatured'] == true)
//                     .toList()[index]; // Get featured item
//                 return _buildServiceItem(item);
//               },
//             ),
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
//         margin: EdgeInsets.all(5), // Margin around each item
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
