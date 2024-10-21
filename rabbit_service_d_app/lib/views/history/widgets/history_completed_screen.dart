import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../../services/collection_references.dart';
import '../../../services/find_mechanic.dart';
import '../../../services/make_call.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/request_history_upcoming_request.dart';
import '../../../widgets/reusable_text.dart';
import '../../profile/profile_screen.dart';

class HistoryCompletedScreen extends StatefulWidget {
  const HistoryCompletedScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<HistoryCompletedScreen> createState() => _HistoryCompletedScreenState();
}

class _HistoryCompletedScreenState extends State<HistoryCompletedScreen> {
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
              StreamBuilder(
                stream: FirebaseFirestore.instance
                    .collection('Users')
                    .doc(currentUId)
                    .collection("history")
                    .where("orderId", isEqualTo: widget.orderId)
                    .where("status", whereIn: [1, 2, 3, 4, 5]).snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<QuerySnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot.data!.docs;

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
                            jobId: job["orderId"].toString(),
                            userId: job["userId"].toString(),
                            mId: mId,
                            arrivalCharges: arrivalCharges,
                            fixCharges: fixPrice,
                            perHourCharges: perHourCharges,
                            imagePath: mDp.isEmpty
                                ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                                : mDp.toString(),
                            jobStatus: jobStatus,
                            mStatus: mStatus,
                            languages: languages ?? [],
                            isImage: job["isImageSelected"],
                            isPriceEnabled: job["fixPriceEnabled"],
                            reviewSubmitted: job["reviewSubmitted"],
                            onCallTap: () {
                              makePhoneCall(job["mNumber"].toString());
                            },
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}


    // return RequestAcceptHistoryCard(
    //                           shopName: job["mName"].toString(),
    //                           time: job["time"].toString(),
    //                           distance: "${distance.toStringAsFixed(0)} miles",
    //                           rating: "4.5",
    //                           jobId: job["orderId"].toString(),
    //                           userId: job["userId"].toString(),
    //                           mId: job["mId"].toString(),
    //                           arrivalCharges: job["arrivalCharges"].toString(),
    //                           fixCharges: job["fixPrice"].toString(),
    //                           perHourCharges: job["perHourCharges"].toString(),
    //                           imagePath: job["mDp"].toString().isEmpty
    //                               ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
    //                               : job["mDp"].toString(),
    //                           jobStatus: job["status"],
    //                           mStatus: 0,
    //                           languages: job["languages"] ?? [],
    //                           isImage: job["isImageSelected"],
    //                           reviewSubmitted: job["reviewSubmitted"],
    //                           onCallTap: () {
    //                             makePhoneCall(job["mNumber"].toString());
    //                           },
    //                         );
                        
