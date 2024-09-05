import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geocoding/geocoding.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/dashboard/widgets/upcoming_request_card.dart';
import 'package:regal_shop_app/widgets/custom_background_container.dart';
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
  late Stream<QuerySnapshot> ordersStream;
  bool isVendorActive = true;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late TabController _tabsController;
  int _currentStatus = 1;

  void switchTab(int index) {
    _tabsController.animateTo(index);
  }

  @override
  void initState() {
    super.initState();
    searchController = TextEditingController();
    _tabsController = TabController(length: 2, vsync: this);

    // FirebaseFirestore.instance
    //     .collection("Vendors")
    //     .doc(currentUId)
    //     .snapshots()
    //     .listen((event) {
    //   if (event.exists) {
    //     setState(() {
    //       isVendorActive = event.data()?["active"] ?? false;
    //     });

    //     if (isVendorActive) {
    //       ordersStream = FirebaseFirestore.instance
    //           .collection('orders')
    //           .where("venId", isEqualTo: currentUId)
    //           .snapshots();
    //     }
    //   }
    // });
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

  Widget buildOrderStreamSection() {
    List<Map<String, dynamic>> ongoingOrders = [];
    List<Map<String, dynamic>> completedOrders = [];
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          TabBar(
            controller: _tabsController,
            labelColor: kPrimary,
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
              Tab(text: "Completed"),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabsController,
              children: [
                _buildOrdersList(ongoingOrders, 1),

                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                  child: UpcomingRequestCard(
                    userName: "Sachin Minhas",
                    vehicleName: "Freightliner",
                    address: "STPI - 2nd phase, Mohali PB.",
                    serviceName: "5th wheel",
                    jobId: "#RMS0001",
                    imagePath: "assets/images/profile.jpg",
                    date: "25 Aug 2024",
                    buttonName: "Start",
                    onButtonTap: () {
                      setState(() {
                        // status == 2;
                        _showConfirmDialog();
                      });
                    },
                    currentStatus: 3,
                    companyNameAndVehicleName: "Freightliner (A45-143)",
                    onCompletedButtonTap: () {},
                    rating: "4.3",
                    arrivalCharges: "20",
                  ),
                ),

                // _buildOrdersList(completedOrders, 3),
              ],
            ),
          ),
        ],
      ),
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
    // final searchQuery = searchController.text.toLowerCase();

    // // Filter orders based on orderId containing the search query
    // final filteredOrders = orders.where((order) {
    //   final orderId = order["orderId"].toLowerCase();
    //   return orderId.contains(searchQuery);
    // }).toList();

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
                // FilterChip(
                //     label: const Icon(Icons.sort, color: kPrimary),
                //     onSelected: (value) {})
              ],
            ),
          ),

          // ListView.builder(
          //   padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
          //   shrinkWrap: true,
          //   physics: const NeverScrollableScrollPhysics(),
          //   itemCount: 1,
          //   itemBuilder: (ctx, index) {
          //     return UpcomingRequestCard(
          //       userName: "Sachin Minhas",
          //       vehicleName: "Freightliner",
          //       address: "STPI - 2nd phase, Mohali PB.",
          //       serviceName: "5th wheel",
          //       jobId: "#RMS0001",
          //       imagePath: "assets/images/profile.jpg",
          //       date: "25 Aug 2024",
          //       buttonName: "Start",
          //       onButtonTap: () {
          //         setState(() {
          //           status == 2;
          //           _showConfirmDialog();
          //         });
          //       },
          //       currentStatus: status,
          //       companyNameAndVehicleName: "Freightliner (A45-143)",
          //       onCompletedButtonTap: (){},
          //       rating: "4.3",
          //       arrivalCharges: "20",
          //     );
          //
          //   },
          // ),

          Padding(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            child: UpcomingRequestCard(
              userName: "Sachin Minhas",
              vehicleName: "Freightliner",
              address: "STPI - 2nd phase, Mohali PB.",
              serviceName: "5th wheel",
              jobId: "#RMS0001",
              imagePath: "assets/images/profile.jpg",
              date: "25 Aug 2024",
              buttonName: "Start",
              onButtonTap: () {
                setState(() {
                  status == 2;
                  _showConfirmDialog();
                });
              },
              currentStatus: status,
              companyNameAndVehicleName: "Freightliner (A45-143)",
              onCompletedButtonTap: () {},
              rating: "4.3",
              arrivalCharges: "20",
            ),
          ),
          // SizedBox(height: 10.h),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            child: UpcomingRequestCard(
              userName: "Sachin Minhas",
              vehicleName: "Freightliner",
              address: "STPI - 2nd phase, Mohali PB.",
              serviceName: "5th wheel",
              jobId: "#RMS0001",
              imagePath: "assets/images/profile.jpg",
              date: "25 Aug 2024",
              buttonName: "Start",
              onButtonTap: () {
                setState(() {
                  status == 2;
                  _showConfirmDialog();
                });
              },
              currentStatus: 2,
              companyNameAndVehicleName: "Freightliner (A45-143)",
              onCompletedButtonTap: () {},
              rating: "4.3",
              arrivalCharges: "20",
            ),
          ),

          // // SizedBox(height: 100.h),
        ],
      ),
    );
  }

  void _showConfirmDialog() {
    Get.defaultDialog(
      title: "Waiting",
      middleText: "Waiting for Driver confirmation..",
      // textCancel: "No",
      // textConfirm: "Yes",
      // cancel: OutlinedButton(
      //   onPressed: () {
      //     Get.back(); // Close the dialog if "No" is pressed
      //   },
      //   child: Text(
      //     "No",
      //     style: TextStyle(color: Colors.red), // Custom color for "No" button
      //   ),
      // ),
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the current dialog
          setState(() {});
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Yes" button
        ),
        child: Text(
          "Okay",
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

  //================= Convert latlang to actual address =========================
  Future<String> _getAddressFromLatLng(
      double latitude, double longitude) async {
    List<Placemark> placemarks =
        await placemarkFromCoordinates(latitude, longitude);

    if (placemarks.isNotEmpty) {
      final Placemark pm = placemarks.first;
      return "${pm.name}, ${pm.locality}, ${pm.administrativeArea}";
    }
    return '';
  }
}
