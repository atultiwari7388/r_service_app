// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/widgets/reusable_text.dart';
// import '../services/collection_references.dart';
// import '../utils/app_styles.dart';
// import '../utils/constants.dart';
// import '../views/app/profile/profile_screen.dart';

// PreferredSizeWidget appBar = AppBar(
//   backgroundColor: kLightWhite,
//   elevation: 0,
//   centerTitle: true,
//   title: ReusableText(
//     text: "appBarTitle",
//     style: appStyle(20, kDark, FontWeight.normal),
//   ),
//   actions: [
//     GestureDetector(
//       onTap: () => Get.to(() => const ProfileScreen(),
//           transition: Transition.cupertino,
//           duration: const Duration(milliseconds: 900)),
//       child: CircleAvatar(
//         radius: 19.r,
//         backgroundColor: kPrimary,
//         child: StreamBuilder<DocumentSnapshot>(
//           stream: FirebaseFirestore.instance
//               .collection('Users')
//               .doc(currentUId)
//               .snapshots(),
//           builder:
//               (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
//             if (snapshot.hasError) {
//               return Text('Error: ${snapshot.error}');
//             }

//             if (snapshot.connectionState == ConnectionState.waiting) {
//               return const CircularProgressIndicator();
//             }

//             final data = snapshot.data!.data() as Map<String, dynamic>;
//             final userPhoto = data['profilePicture'] ?? '';
//             final userName = data['userName'] ?? '';

//             if (userPhoto.isEmpty) {
//               return Text(
//                 userName.isNotEmpty ? userName[0] : '',
//                 style: appStyle(20, kWhite, FontWeight.w500),
//               );
//             } else {
//               return ClipOval(
//                 child: Image.network(
//                   userPhoto,
//                   width: 38.r, // Set appropriate size for the image
//                   height: 35.r,
//                   fit: BoxFit.cover,
//                 ),
//               );
//             }
//           },
//         ),
//       ),
//     ),
//     SizedBox(width: 20.w),
//   ],
// );
