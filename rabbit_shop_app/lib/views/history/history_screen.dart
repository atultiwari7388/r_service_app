import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/calculate_distance.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';

class UpcomingAndCompletedJobsScreen extends StatefulWidget {
  const UpcomingAndCompletedJobsScreen({super.key, required this.setTab});

  final Function? setTab;

  @override
  State<UpcomingAndCompletedJobsScreen> createState() =>
      _UpcomingAndCompletedJobsScreenState();
}

class _UpcomingAndCompletedJobsScreenState
    extends State<UpcomingAndCompletedJobsScreen>
    with SingleTickerProviderStateMixin {
  late TextEditingController searchController;
  late Stream<QuerySnapshot> jobsStream;
  bool isVendorActive = true;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late TabController _tabsController;

  void switchTab(int index) {
    _tabsController.animateTo(index);
  }

  @override
  void initState() {
    super.initState();
    searchController = TextEditingController();
    _tabsController = TabController(length: 2, vsync: this);
    jobsStream = FirebaseFirestore.instance
        .collection('jobs')
        .where("mId", isEqualTo: currentUId)
        .orderBy("orderDate", descending: true)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          backgroundColor: kLightWhite,
          title: ReusableText(
            text: "Jobs",
            style: appStyle(20, kDark, FontWeight.normal),
          ),
        ),
        body: isVendorActive
            ? buildOrderStreamSection()
            : buildInactiveDriverScreen(),
      ),
    );
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
        // Filter orders based on status
        List<Map<String, dynamic>> ongoingOrders = [];
        List<Map<String, dynamic>> completedOrders = [];

        // Extract orders data from the snapshot
        List<Map<String, dynamic>> orders = snapshot.data!.docs
            .map((doc) => doc.data() as Map<String, dynamic>)
            .toList();

        ongoingOrders = orders
            .where((order) => order['status'] >= 1 && order['status'] <= 4)
            .toList();
        completedOrders =
            orders.where((order) => order['status'] == 5).toList();

        return DefaultTabController(
          length: 2,
          child: Column(
            children: [
              TabBar(
                controller: _tabsController,
                labelColor: kSecondary,
                unselectedLabelColor: kGray,
                tabAlignment: TabAlignment.center,
                padding: EdgeInsets.zero,
                isScrollable: true,
                labelStyle: appStyle(16, kDark, FontWeight.normal),
                indicator: UnderlineTabIndicator(
                  borderSide: BorderSide(
                      width: 2.w, color: kPrimary), // Set your color here
                  insets: EdgeInsets.symmetric(horizontal: 20.w),
                ),
                tabs: const [
                  Tab(text: "Ongoing"),
                  Tab(text: "Complete/Cancel"),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabsController,
                  children: [
                    _buildOrdersList(ongoingOrders, 1),
                    _buildOrdersList(completedOrders, 2),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget buildInactiveDriverScreen() {
    return Padding(
      padding: EdgeInsets.all(28.sp),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.warning,
              size: 100,
              color: kPrimary,
            ),
            const SizedBox(height: 20),
            ReusableText(
              text: "Please activate the online button.",
              style: appStyle(17, kSecondary, FontWeight.normal),
            ),
          ],
        ),
      ),
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
              final userName = jobs['userName'] ?? "N/A";
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
              final mecLatitude = (jobs["mecLatitude"] as num).toDouble();
              final mecLongtitude = (jobs["mecLongtitude"] as num).toDouble();

              // Print to check values
              print('User Latitude: $userLat, User Longitude: $userLng');
              print(
                  'Mechanic Latitude: $mecLatitude, Mechanic Longitude: $mecLongtitude');

              double distance = calculateDistance(
                  userLat, userLng, mecLatitude, mecLongtitude);
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
                    ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                    : imagePath,
                date: dateString,
                buttonName: "Start",
                onButtonTap: _showStartDialog,
                onPhoneCallTap: () async {
                  final Uri launchUri = Uri(
                    scheme: 'tel',
                    path: userPhoneNumber,
                  );
                  await launchUrl(launchUri);
                },
                onDirectionTapButton: () async {
                  final Uri googleMapsUri = Uri.parse(
                      'https://www.google.com/maps/dir/?api=1&destination=$userLat,$userLng');
                  // ignore: deprecated_member_use
                  if (await canLaunch(googleMapsUri.toString())) {
                    // ignore: deprecated_member_use
                    await launch(googleMapsUri.toString());
                  } else {
                    // Handle the error if the URL cannot be launched
                    print('Could not launch Google Maps');
                  }
                },
                currentStatus: currentStatus,
                companyNameAndVehicleName:
                    "${jobs["companyName"]} (${vehicleNumber})",
                onCompletedButtonTap: () {},
                rating: jobs["rating"].toString(),
                arrivalCharges: jobs["arrivalCharges"].toString(),
                fixCharge: jobs["fixPrice"].toString(),
                km: "${distance.toStringAsFixed(0)} km",
                dId: dId.toString(),
                isImage: isImage,
                images: images,
                payMode: payMode,
              );
            },
          ),
          SizedBox(height: 80.h),
        ],
      ),
    );
  }

  void _showStartDialog() {
    Get.defaultDialog(
      title: "Start Job Confirmation ",
      middleText: "Wait for Driver Confirmation",
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the pay dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary, // Custom color for "Pay" button
        ),
        child: Text(
          "Confirm",
          style: TextStyle(color: Colors.white),
        ),
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
