import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/calculate_distance.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';

class CompletedJobsHistoryScreen extends StatefulWidget {
  const CompletedJobsHistoryScreen({super.key});

  @override
  State<CompletedJobsHistoryScreen> createState() =>
      _CompletedJobsHistoryScreenState();
}

class _CompletedJobsHistoryScreenState extends State<CompletedJobsHistoryScreen>
    with SingleTickerProviderStateMixin {
  late Stream<QuerySnapshot> jobsStream;

  TextEditingController searchController = TextEditingController();

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    jobsStream = FirebaseFirestore.instance
        .collection('jobs')
        .where("mId", isEqualTo: currentUId)
        .where("status", isEqualTo: 5)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          backgroundColor: kLightWhite,
          title: ReusableText(
            text: "History",
            style: appStyle(20, kDark, FontWeight.normal),
          ),
        ),
        body: buildOrderStreamSection());
  }

  StreamBuilder<QuerySnapshot<Object?>> buildOrderStreamSection() {
    return StreamBuilder<QuerySnapshot>(
      stream: jobsStream,
      builder: (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Text('Error: ${snapshot.error}');
        }
        if (snapshot.data!.docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // const Icon(
                //   Icons.shopping_cart_outlined,
                //   size: 100,
                //   color: kPrimary,
                // ),
                const SizedBox(height: 20),
                ReusableText(
                  text: "No Jobs Found",
                  style: appStyle(20, kSecondary, FontWeight.bold),
                ),
              ],
            ),
          );
        }

        List<Map<String, dynamic>> completedOrders = [];

        // Extract orders data from the snapshot
        List<Map<String, dynamic>> orders = snapshot.data!.docs
            .map((doc) => doc.data() as Map<String, dynamic>)
            .toList();

        completedOrders =
            orders.where((order) => order['status'] == 5).toList();

        return _buildOrdersList(orders, 5);
      },
    );
  }

  Widget _buildOrdersList(List<Map<String, dynamic>> orders, int status) {
    // Get the search query from the text controller
    final searchQuery = searchController.text.toLowerCase();

    // Filter orders based on orderId containing the search query
    final filteredOrders = orders.where((order) {
      final orderId = order["orderId"].toLowerCase();
      return orderId.contains(searchQuery);
    }).toList();

    return SingleChildScrollView(
      child: Column(
        children: [
          //filter and search bar section
          // Container(
          //   margin: const EdgeInsets.only(left: 10, right: 10),
          //   child: Row(
          //     children: [
          //       Expanded(child: buildTopSearchBar()),
          //       SizedBox(width: 5.w),
          //     ],
          //   ),
          // ),

          ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filteredOrders.length,
            itemBuilder: (ctx, index) {
              final jobs = filteredOrders[index];
              final userName = jobs['userName'] ?? "N/A";
              final userPhoneNumber = jobs['userPhoneNumber'] ?? "N/A";
              final imagePath = jobs['userPhoto'] ?? "";
              final userLat = jobs["userLat"] ?? 00;
              final userLng = jobs["userLong"] ?? 00;
              final mecLatitude = jobs["mecLatitude"] ?? 00;
              final mecLongtitude = jobs["mecLongtitude"] ?? 00;
              final currentStatus = jobs["status"] ?? 0;
              final dId = jobs["userId"];
              final bool isImage = jobs["isImageSelected"] ?? false;
              final List<dynamic> images = jobs['images'] ?? [];

              String dateString = '';
              if (jobs['date'] is Timestamp) {
                DateTime dateTime = (jobs['date'] as Timestamp).toDate();
                dateString =
                    "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
              }
              double distance = calculateDistance(
                  userLat, userLng, mecLatitude, mecLongtitude);

              return UpcomingRequestCard(
                orderId: jobs["orderId"].toString(),
                userName: jobs["userName"],
                vehicleName: jobs['vehicleNumber'] ?? "N/A",
                address: jobs['userDeliveryAddress'] ?? "N/A",
                serviceName: jobs['selectedService'] ?? "N/A",
                jobId: jobs['orderId'] ?? "#Unknown",
                imagePath: imagePath.isEmpty
                    ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/playstore.png?alt=media&token=a6526b0d-7ddf-48d6-a2f7-0612f04742b5"
                    : imagePath,
                date: dateString,
                buttonName: "Start",
                onButtonTap: () {},
                onPhoneCallTap: () async {
                  final Uri launchUri = Uri(
                    scheme: 'tel',
                    path: userPhoneNumber,
                  );
                  await launchUrl(launchUri);
                },
                currentStatus: currentStatus,
                companyNameAndVehicleName: "Freightliner (A45-143)",
                onCompletedButtonTap: () {},
                rating: jobs["rating"].toString(),
                arrivalCharges: jobs["arrivalCharges"].toString(),
                km: "${distance.toStringAsFixed(0)} km",
                dId: dId.toString(),
                isImage: isImage,
                // priceEnabled: jobs["fixPriceEnabled"] ?? false,
                images: images,
                payMode: jobs["payMode"].toString(),
                reviewSubmitted: jobs["reviewSubmitted"],
              );
            },
          ),
        ],
      ),
    );
  }

  /**-------------------------- Build Top Search Bar ----------------------------------**/
  Widget buildTopSearchBar() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.0.w, vertical: 8.h),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18.h),
          // border: Border.all(color: kPrimary.withOpacity(0.1)),
          boxShadow: const [
            BoxShadow(
              color: kLightWhite,
              spreadRadius: 0.2,
              blurRadius: 1,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: TextFormField(
          controller: searchController,
          onChanged: (value) {
            setState(() {});
          },
          decoration: InputDecoration(
            border: InputBorder.none,
            hintText: "Search by #00001",
            prefixIcon: Icon(Icons.search, color: kPrimary.withOpacity(0.5)),
            prefixStyle:
                appStyle(14, kPrimary.withOpacity(0.1), FontWeight.w200),
          ),
        ),
      ),
    );
  }
}
