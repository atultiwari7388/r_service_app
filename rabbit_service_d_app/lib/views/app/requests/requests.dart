import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/widgets/request_history_upcoming_request.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../services/find_mechanic.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/reusable_text.dart';
import '../profile/profile_screen.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({
    super.key,
    required this.serviceName,
    this.companyAndVehicleName = "",
    this.id = "",
    required this.currentUId,
  });

  final String serviceName;
  final String companyAndVehicleName;
  final String id;
  final String currentUId;

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;

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
                    .doc(widget.currentUId)
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
              StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('jobs')
                    .doc(widget.id)
                    .snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<DocumentSnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  if (!snapshot.hasData || !snapshot.data!.exists) {
                    return Center(child: Text("No Mechanic Found"));
                  }

                  final job = snapshot.data!.data() as Map<String, dynamic>? ?? {};
                  final userLat = (job["userLat"] is num)
                      ? (job["userLat"] as num).toDouble()
                      : (double.tryParse(job["userLat"]?.toString() ?? "") ?? 0.0);
                  final userLng = (job["userLong"] is num)
                      ? (job["userLong"] as num).toDouble()
                      : (double.tryParse(job["userLong"]?.toString() ?? "") ?? 0.0);
                  final orderId = (job["orderId"] ?? widget.id).toString();
                  final userId = (job["userId"] ?? widget.currentUId).toString();
                  final jobStatus = (job["status"] is num)
                      ? (job["status"] as num).toInt()
                      : (int.tryParse(job["status"]?.toString() ?? "") ?? 0);
                  final List<dynamic> images = job['images'] ?? [];
                  final mechanicsOffer =
                      job["mechanicsOffer"] as List<dynamic>? ?? [];

                  // Check if any mechanic has an accepted offer (status between 2 and 5)
                  final hasAcceptedOffer = mechanicsOffer.any((offer) {
                    if (offer is! Map) return false;
                    final st = (offer['status'] is num)
                        ? (offer['status'] as num).toInt()
                        : (int.tryParse(offer['status']?.toString() ?? '') ?? 0);
                    return st >= 2 && st <= 5;
                  });

                  // Show "No Mechanic Found" if no offers exist
                  if (mechanicsOffer.isEmpty) {
                    return Center(child: Text("No Mechanic Found"));
                  }

                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: mechanicsOffer.length,
                    itemBuilder: (context, mecIndex) {
                      final mechanic = mechanicsOffer[mecIndex];
                      if (mechanic is! Map) return const SizedBox.shrink();

                      final mName = (mechanic["mName"] ?? "Mechanic").toString();
                      final arrivalCharges =
                          (mechanic["arrivalCharges"] ?? 0).toString();
                      final fixPrice = (mechanic["fixPrice"] ?? 0).toString();
                      final perHourCharges =
                          (mechanic["perHourCharges"] ?? 0).toString();
                      final mId = (mechanic["mId"] ?? "").toString();
                      final time = (mechanic["time"] ?? "15").toString();
                      final mDp = (mechanic["mDp"] ?? "").toString();
                      final languages = mechanic["languages"] ?? [];
                      final mNumber = mechanic["mNumber"] ?? "";
                      final mStatus = (mechanic["status"] is num)
                          ? (mechanic["status"] as num).toInt()
                          : (int.tryParse(mechanic["status"]?.toString() ?? "") ?? 1);
                      final mLatitude = mechanic["latitude"];
                      final mLongitude = mechanic["longitude"];
                      final mecLatitude = (mechanic['latitude'] is num)
                          ? (mechanic['latitude'] as num).toDouble()
                          : (double.tryParse(mechanic['latitude']?.toString() ?? "") ?? 0.0);
                      final mecLongitude = (mechanic['longitude'] is num)
                          ? (mechanic['longitude'] as num).toDouble()
                          : (double.tryParse(mechanic['longitude']?.toString() ?? "") ?? 0.0);

                      double distance = calculateDistance(
                          userLat, userLng, mecLatitude, mecLongitude);
                      distance = distance < 1 ? 1 : distance;

                      // If there's an accepted offer, only display the accepted mechanic
                      if (hasAcceptedOffer && !(mStatus >= 2 && mStatus <= 5)) {
                        return const SizedBox.shrink();
                      }

                      return RequestAcceptHistoryCard(
                          shopName: mName,
                          time: time,
                          distance: "${distance.toStringAsFixed(0)} miles",
                          rating: (mechanic["rating"] ?? "4.5").toString(),
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
                              _selectedCardIndex != mecIndex,
                          languages: languages,
                          isImage: job["isImageSelected"] ?? false,
                          isPriceEnabled: job["fixPriceEnabled"] ?? false,
                          reviewSubmitted: job["reviewSubmitted"] ?? false,
                          onCallTap: () {
                            makePhoneCall(mNumber.toString());
                          },
                          onDirectionTapButton: () async {
                            try {
                              if (!kIsWeb &&
                                  defaultTargetPlatform ==
                                      TargetPlatform.iOS) {
                                final Uri appleMapsUri = Uri.parse(
                                    'https://maps.apple.com/?daddr=$mLatitude,$mLongitude&dirflg=d');
                                if (await canLaunchUrl(appleMapsUri)) {
                                  await launchUrl(appleMapsUri,
                                      mode: LaunchMode.externalApplication);
                                  return;
                                }
                              }

                              final Uri googleMapsUri = Uri.parse(
                                  'https://www.google.com/maps/dir/?api=1&destination=$mLatitude,$mLongitude');
                              if (await canLaunchUrl(googleMapsUri)) {
                                await launchUrl(googleMapsUri,
                                    mode: LaunchMode.externalApplication);
                              } else {
                                print('Could not launch Maps');
                              }
                            } catch (e) {
                              print('Error launching maps: $e');
                            }
                          },
                          description: (job["description"] ?? "").toString());
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
