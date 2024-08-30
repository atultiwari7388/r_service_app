import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geocoding/geocoding.dart';
import 'package:regal_shop_app/widgets/custom_background_container.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/reusable_text.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, required this.setTab});
  final Function? setTab;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TextEditingController searchController;
  late Stream<QuerySnapshot> ordersStream;
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
    _tabsController = TabController(length: 3, vsync: this);

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
      length: 3,
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          backgroundColor: kLightWhite,
          title: ReusableText(
            text: "Orders",
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
    List<Map<String, dynamic>> newOrders = [];
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
              Tab(text: "New"),
              Tab(text: "Ongoing"),
              Tab(text: "Complete/Cancel"),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabsController,
              children: [
                _buildOrdersList(newOrders, 0),
                _buildOrdersList(ongoingOrders, 1),
                _buildOrdersList(completedOrders, 2),
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

    return CustomBackgroundContainer(
      child: Column(
        children: [
          //filter and search bar section
          Container(
            margin: const EdgeInsets.only(left: 10, right: 10),
            child: Row(
              children: [
                Expanded(child: buildTopSearchBar()),
                SizedBox(width: 5.w),
                FilterChip(
                    label: const Icon(Icons.calendar_month, color: kPrimary),
                    onSelected: (value) {})
              ],
            ),
          ),

          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 1,
            itemBuilder: (ctx, index) {
              return Container();
            },
          ),
          // SizedBox(height: 100.h),
        ],
      ),
      horizontalW: 20,
      vertical: 1,
      scrollPhysics: NeverScrollableScrollPhysics(),
    );
  }

  /**-------------------------- Build Top Search Bar ----------------------------------**/
  Widget buildTopSearchBar() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.0.w, vertical: 8.h),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18.h),
          // border: Border.all(color: kGrayLight),
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
              prefixIcon: const Icon(Icons.search),
              prefixStyle: appStyle(14, kDark, FontWeight.w200)),
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
