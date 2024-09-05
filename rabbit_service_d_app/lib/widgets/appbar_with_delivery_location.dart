import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../utils/app_styles.dart';
import '../utils/constants.dart';
import '../views/profile/profile_screen.dart';
import 'reusable_text.dart';

class CustomAppBar extends StatelessWidget {
  const CustomAppBar({
    super.key,
    required this.appbarTitle,
    required this.context,
  });

  final String appbarTitle;
  final BuildContext context;

  @override
  Widget build(BuildContext context) {
    return PreferredSize(
      preferredSize: Size.fromHeight(130.h),
      child: GestureDetector(
        onTap: () async {
//           var selectedAddress = await Navigator.push(
//             context,
//             MaterialPageRoute(
//               builder: (context) => AddressManagementScreen(
//                 userLat: userLat,
//                 userLng: userLong,
//               ),
//             ),
//           );

//           if (selectedAddress != null) {
//             setState(() {
//               appbarTitle = selectedAddress['address'];
//             });
// // Update the selected address in Firestore
//             // Update the selected address in Firestore
//             FirebaseFirestore.instance
//                 .collection('Users')
//                 .doc(currentUId)
//                 .collection('Addresses')
//                 .get()
//                 .then((querySnapshot) {
//               WriteBatch batch = FirebaseFirestore.instance.batch();

//               for (var doc in querySnapshot.docs) {
//                 log("Selected Address Id : ${selectedAddress["id"]}");
//                 // Update all addresses to set isAddressSelected to false
//                 batch.update(doc.reference, {'isAddressSelected': false});
//               }

//               // Update the selected address to set isAddressSelected to true
//               batch.update(
//                 FirebaseFirestore.instance
//                     .collection('Users')
//                     .doc(currentUId)
//                     .collection('Addresses')
//                     .doc(selectedAddress["id"]),
//                 {'isAddressSelected': true},
//               );

//               // Commit the batch write
//               batch.commit().then((value) {
//                 // _onAddressChanged();
//               });
//             });

//           }
        },
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 1.h),
          height: 90.h,
          width: MediaQuery.of(context).size.width,
          color: kOffWhite,
          child: Container(
            margin: EdgeInsets.only(top: 8.h),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Padding(
                      padding:
                          EdgeInsets.only(bottom: 4.h, left: 5.w, top: 7.h),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.location_on_outlined),
                              ReusableText(
                                  text: "Delivery in",
                                  style: appStyle(13, kDark, FontWeight.bold)),
                            ],
                          ),
                          SizedBox(
                            width: MediaQuery.of(context).size.width * 0.65,
                            child: Text(
                              appbarTitle.isEmpty
                                  ? "Fetching Addresses....."
                                  : appbarTitle,
                              overflow: TextOverflow.ellipsis,
                              style: appStyle(12, kDarkGray, FontWeight.normal),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Icon(Icons.location_on, color: kSecondary, size: 35.sp),
                  ],
                ),

                GestureDetector(
                  onTap: () => Get.to(() => ProfileScreen()),
                  child: CircleAvatar(
                    radius: 19.r,
                    backgroundColor: kPrimary,
                    child: Text("A",
                        style: appStyle(18, kWhite, FontWeight.normal)),
                  ),
                ),
                // GestureDetector(
                //   onTap: () => Get.to(() => const ProfileScreen(),
                //       transition: Transition.cupertino,
                //       duration: const Duration(milliseconds: 900)),
                //   child: CircleAvatar(
                //     radius: 19.r,
                //     backgroundColor: kPrimary,
                //     child: StreamBuilder<DocumentSnapshot>(
                //       stream: FirebaseFirestore.instance
                //           .collection('Users')
                //           .doc(currentUId)
                //           .snapshots(),
                //       builder: (BuildContext context,
                //           AsyncSnapshot<DocumentSnapshot> snapshot) {
                //         if (snapshot.hasError) {
                //           return Text('Error: ${snapshot.error}');
                //         }

                //         if (snapshot.connectionState ==
                //             ConnectionState.waiting) {
                //           return const CircularProgressIndicator();
                //         }

                //         final data =
                //             snapshot.data!.data() as Map<String, dynamic>;
                //         final profileImageUrl = data['profilePicture'] ?? '';
                //         final userName = data['userName'] ?? '';

                //         if (profileImageUrl.isEmpty) {
                //           return Text(
                //             userName.isNotEmpty ? userName[0] : '',
                //             style: appStyle(20, kWhite, FontWeight.bold),
                //           );
                //         } else {
                //           return ClipOval(
                //             child: Image.network(
                //               profileImageUrl,
                //               width: 38.r, // Set appropriate size for the image
                //               height: 35.r,
                //               fit: BoxFit.cover,
                //             ),
                //           );
                //         }
                //       },
                //     ),
                //   ),
                // ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
