import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/widgets/request_history_upcoming_request.dart';
import '../../services/collection_references.dart';
import '../../services/find_mechanic.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen(
      {super.key,
      required this.serviceName,
      this.companyAndVehicleName = "",
      this.id = ""});

  final String serviceName;
  final String companyAndVehicleName;
  final String id;

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  String _selectedSortOption = "Sort";
  int? _selectedCardIndex; // Track which card is selected

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kLightWhite,
        elevation: 0,
        centerTitle: true,
        title: ReusableText(
            text: "Requests",
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(20, kDark, FontWeight.normal)),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => const ProfileScreen(),
                transition: Transition.cupertino,
                duration: const Duration(milliseconds: 900)),
            child: CircleAvatar(
              radius: 19.r,
              backgroundColor: kPrimary,
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<DocumentSnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot.data!.data() as Map<String, dynamic>;
                  final userPhoto = data['profilePicture'] ?? '';
                  final userName = data['userName'] ?? '';

                  if (userPhoto.isEmpty) {
                    return Text(
                      userName.isNotEmpty ? userName[0] : '',
                      style: kIsWeb
                          ? TextStyle(color: kWhite)
                          : appStyle(20, kWhite, FontWeight.w500),
                    );
                  } else {
                    return ClipOval(
                      child: Image.network(
                        userPhoto,
                        width: 38.r, // Set appropriate size for the image
                        height: 35.r,
                        fit: BoxFit.cover,
                      ),
                    );
                  }
                },
              ),
            ),
          ),
          SizedBox(width: 20.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SizedBox(
                    width: 260.w,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildInfoBox("${widget.id}", kSecondary),
                          SizedBox(width: 5.w),
                          _buildInfoBox(
                              "${widget.companyAndVehicleName}", kPrimary),
                          SizedBox(width: 5.w),
                          // _buildInfoBox("${widget.serviceName}", kSecondary),
                        ],
                      ),
                    ),
                  ),
                  if (_selectedCardIndex == null)
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
                            value: "Rating",
                            child: Text("Rating"),
                          ),
                        ],
                        child: Row(
                          children: [
                            Icon(Icons.sort, color: kPrimary),
                            SizedBox(width: 4.w),
                            Text(
                              _selectedSortOption, // Show the selected option
                              style: kIsWeb
                                  ? TextStyle(color: kPrimary)
                                  : appStyle(16.sp, kPrimary, FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              SizedBox(height: 10.h),
              StreamBuilder(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .collection("history")
                    .where("orderId", isEqualTo: widget.id)
                    .where("status", whereIn: [0, 1, 2, 3, 4, 5]).snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<QuerySnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot.data!.docs; // List of job documents

                  if (data.isEmpty) {
                    return Center(child: Text("No Mechanic Found"));
                  }

                  return ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: data.length,
                    itemBuilder: (context, index) {
                      final job = data[index].data() as Map<String, dynamic>;
                      final userLat = (job["userLat"] as num).toDouble();
                      final userLng = (job["userLong"] as num).toDouble();
                      final orderId = job["orderId"].toString();
                      final userId = job["userId"].toString();
                      final jobStatus = job["status"];
                      final mechanicsOffer =
                          job["mechanicsOffer"] as List<dynamic>? ?? [];

                      // Check if any mechanic has an accepted offer (status between 2 and 5)
                      final hasAcceptedOffer = mechanicsOffer.any((offer) =>
                          offer['status'] >= 2 && offer['status'] <= 5);

                      // Show "No Mechanic Found" if no offers exist
                      if (mechanicsOffer.isEmpty) {
                        return Center(child: Text("No Mechanic Found"));
                      }

                      return ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: mechanicsOffer.length,
                        itemBuilder: (context, mecIndex) {
                          final mechanic = mechanicsOffer[mecIndex];
                          final mName = mechanic["mName"].toString();
                          final arrivalCharges =
                              mechanic["arrivalCharges"].toString();
                          final fixPrice = mechanic["fixPrice"].toString();
                          final perHourCharges =
                              mechanic["perHourCharges"].toString();
                          final mId = mechanic["mId"].toString();
                          final time = mechanic["time"].toString();
                          final mDp = mechanic["mDp"].toString();
                          final languages = mechanic["languages"] ?? [];
                          final mNumber = mechanic["mNumber"];
                          final mStatus = mechanic["status"];
                          final mecLatitude =
                              (mechanic['latitude'] as num?)?.toDouble() ?? 0.0;
                          final mecLongitude =
                              (mechanic['longitude'] as num?)?.toDouble() ??
                                  0.0;

                          double distance = calculateDistance(
                              userLat, userLng, mecLatitude, mecLongitude);
                          distance = distance < 1 ? 1 : distance;

                          // If there's an accepted offer, only display the accepted mechanic
                          if (hasAcceptedOffer &&
                              !(mStatus >= 2 && mStatus <= 5)) {
                            return SizedBox.shrink();
                          }

                          return RequestAcceptHistoryCard(
                            shopName: mName,
                            time: time,
                            distance: "${distance.toStringAsFixed(0)} miles",
                            rating: "4.5",
                            jobId: orderId,
                            userId: userId,
                            mId: mId,
                            arrivalCharges: arrivalCharges,
                            fixCharges: fixPrice,
                            perHourCharges: perHourCharges,
                            imagePath: mDp.isEmpty
                                ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                : mDp,
                            jobStatus: jobStatus,
                            mStatus: mStatus,
                            isHidden: _selectedCardIndex != null &&
                                _selectedCardIndex != index,
                            languages: languages,
                            isImage: job["isImageSelected"] ?? false,
                            reviewSubmitted: job["reviewSubmitted"] ?? false,
                            onCallTap: () {
                              makePhoneCall(mNumber.toString());
                            },
                          );
                        },
                      );
                    },
                  );
                },
              ),
              SizedBox(height: 50.h)
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBox(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0.r),
      ),
      child: Text(
        text,
        style: kIsWeb
            ? TextStyle(color: color)
            : appStyle(12.sp, color, FontWeight.normal),
      ),
    );
  }
}



// StreamBuilder(
//   stream: FirebaseFirestore.instance
//       .collection('Users')
//       .doc(currentUId)
//       .collection("history")
//       .where("orderId", isEqualTo: widget.id)
//       .where("status", whereIn: [0, 1, 2, 3, 4, 5])
//       .snapshots(),
//   builder: (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
//     if (snapshot.hasError) {
//       return Text('Error: ${snapshot.error}');
//     }

//     if (snapshot.connectionState == ConnectionState.waiting) {
//       return const CircularProgressIndicator();
//     }

//     final data = snapshot.data!.docs; // List of documents in the 'jobs' collection

//     return data.isEmpty
//         ? Center(child: Text("No Mechanic Found"))
//         : ListView.builder(
//             shrinkWrap: true,
//             physics: NeverScrollableScrollPhysics(),
//             itemCount: data.length,
//             itemBuilder: (context, index) {
//               final job = data[index].data() as Map<String, dynamic>;
//               final userLat = (job["userLat"] as num).toDouble();
//               final userLng = (job["userLong"] as num).toDouble();
//               final orderId = job["orderId"].toString();
//               final userId = job["userId"].toString();
//               final jobStatus = job["status"];
//               final mechanicsOffer = job["mechanicsOffer"] as List<dynamic>? ?? [];

//               // Check if the job status is 2 (accepted) or not
//               final hasAcceptedOffer = mechanicsOffer.any((offer) => offer['status'] == 2);

//               return mechanicsOffer.isEmpty
//                   ? Center(child: Text("No Mechanic Found"))
//                   : ListView.builder(
//                       shrinkWrap: true,
//                       physics: NeverScrollableScrollPhysics(),
//                       itemCount: mechanicsOffer.length,
//                       itemBuilder: (context, mecIndex) {
//                         final mechanic = mechanicsOffer[mecIndex];
//                         final mName = mechanic["mName"].toString();
//                         final arrivalCharges = mechanic["arrivalCharges"].toString();
//                         final fixPrice = mechanic["fixPrice"].toString() ?? "";
//                         final perHourCharges = mechanic["perHourCharges"].toString();
//                         final mId = mechanic["mId"].toString();
//                         final time = mechanic["time"].toString();
//                         final mDp = mechanic["mDp"].toString();
//                         final languages = mechanic["languages"];
//                         final mNumber = mechanic["mNumber"];
//                         final mStatus = mechanic["status"];
//                         final mecLatitude = (mechanic['latitude'] as num?)?.toDouble() ?? 0.0;
//                         final mecLongitude = (mechanic['longitude'] as num?)?.toDouble() ?? 0.0;

//                         double distance = calculateDistance(userLat, userLng, mecLatitude, mecLongitude);
//                         if (distance < 1) {
//                           distance = 1;
//                         }

//                         // Only show the accepted offer if one has been accepted, else show all offers
//                         if (hasAcceptedOffer && mStatus != 2) {
//                           // Hide this offer since it's not the accepted one
//                           return SizedBox.shrink();
//                         }

//                         return RequestAcceptHistoryCard(
//                           shopName: mName,
//                           time: time,
//                           distance: "${distance.toStringAsFixed(0)} miles",
//                           rating: "4.5",
//                           jobId: orderId,
//                           userId: userId,
//                           mId: mId,
//                           arrivalCharges: arrivalCharges,
//                           fixCharges: fixPrice,
//                           perHourCharges: perHourCharges,
//                           imagePath: mDp.isEmpty
//                               ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
//                               : mechanic["mDp"].toString(),
//                           jobStatus: jobStatus,
//                           mStatus: mStatus,
//                           isHidden: _selectedCardIndex != null && _selectedCardIndex != index,
//                           languages: languages ?? [],
//                           isImage: job["isImageSelected"],
//                           reviewSubmitted: job["reviewSubmitted"] ?? false,
//                           onCallTap: () {
//                             makePhoneCall(mNumber.toString());
//                           },
//                         );
//                       },
//                     );
//             },
//           );
//   },
// ),
