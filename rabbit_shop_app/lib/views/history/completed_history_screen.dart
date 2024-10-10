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
  late Stream<List<QueryDocumentSnapshot<Map<String, dynamic>>>> jobsStream;
  TextEditingController searchController = TextEditingController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    jobsStream = FirebaseFirestore.instance
        .collection('jobs')
        .orderBy("orderDate", descending: true)
        .snapshots()
        .map((snapshot) {
      // Filter out the documents where mechanicsOffer exists and contains mId matching currentUId
      final filteredDocs = snapshot.docs.where((doc) {
        // Check if the mechanicsOffer field exists
        if (doc.data().containsKey('mechanicsOffer')) {
          List mechanicsOffers = doc['mechanicsOffer'] ?? [];
          return mechanicsOffers.any((offer) => offer['mId'] == currentUId);
        }
        return false; // If mechanicsOffer doesn't exist, exclude this document
      }).toList();
      // Return the filtered list of documents
      return filteredDocs;
    });
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

  StreamBuilder<List<QueryDocumentSnapshot<Map<String, dynamic>>>>
      buildOrderStreamSection() {
    return StreamBuilder<List<QueryDocumentSnapshot<Map<String, dynamic>>>>(
      stream: jobsStream,
      builder: (BuildContext context,
          AsyncSnapshot<List<QueryDocumentSnapshot<Map<String, dynamic>>>>
              snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Text('Error: ${snapshot.error}');
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                ReusableText(
                  text: "No Jobs Found",
                  style: appStyle(20, kSecondary, FontWeight.bold),
                ),
              ],
            ),
          );
        }

        // Extract orders data from the snapshot
        List<Map<String, dynamic>> orders =
            snapshot.data!.map((doc) => doc.data()).toList();
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
          Container(
            margin: const EdgeInsets.only(left: 10, right: 10),
            child: Row(
              children: [
                Expanded(child: buildTopSearchBar()),
                SizedBox(width: 5.w),
              ],
            ),
          ),

          ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filteredOrders.length,
            itemBuilder: (ctx, index) {
              final jobs = filteredOrders[index];
              final userPhoneNumber = jobs['userPhoneNumber'] ?? "N/A";
              final imagePath = jobs['userPhoto'] ?? "";
              final currentStatus = jobs["status"] ?? 0;
              final dId = jobs["userId"];
              final bool isImage = jobs["isImageSelected"] ?? false;
              final List<dynamic> images = jobs['images'] ?? [];
              final vehicleNumber =
                  jobs['vehicleNumber'] ?? "N/A"; // Fetch the vehicle number

              String dateString = '';
              if (jobs['date'] is Timestamp) {
                DateTime dateTime = (jobs['date'] as Timestamp).toDate();
                dateString =
                    "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
              }
              final payMode = jobs["payMode"].toString();
              final userLat = (jobs["userLat"] as num).toDouble();
              final userLng = (jobs["userLong"] as num).toDouble();

              // Retrieve mecLatitude and mecLongitude from mechanicsOffer array
              double mecLatitude = 0.0;
              double mecLongitude = 0.0;

              // Check if mechanicsOffer exists and is a list
              if (jobs['mechanicsOffer'] is List) {
                // Find the mechanic whose mId matches currentUId
                final mechanic =
                    (jobs['mechanicsOffer'] as List<dynamic>).firstWhere(
                  (offer) => offer['mId'] == currentUId,
                  orElse: () => null, // Return null if not found
                );

                if (mechanic != null) {
                  mecLatitude = (mechanic['latitude'] as num?)?.toDouble() ??
                      0.0; // Update with your field name
                  mecLongitude = (mechanic['longitude'] as num?)?.toDouble() ??
                      0.0; // Update with your field name
                }
              }

              // Print to check values
              print('User Latitude: $userLat, User Longitude: $userLng');
              print(
                  'Mechanic Latitude: $mecLatitude, Mechanic Longitude: $mecLongitude');

              double distance = calculateDistance(
                  userLat, userLng, mecLatitude, mecLongitude);
              print('Calculated Distance: $distance');

              if (distance < 1) {
                distance = 1;
              }
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

          SizedBox(height: 80.h),
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
