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
  // late Stream<QuerySnapshot> jobsStream;
  late Stream<List<QueryDocumentSnapshot<Map<String, dynamic>>>> jobsStream;
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

        // Filter orders based on status
        List<Map<String, dynamic>> ongoingOrders = orders
            .where((order) => order['status'] >= 0 && order['status'] <= 4)
            .toList();
        List<Map<String, dynamic>> completedOrders =
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
                vehicleName: vehicleNumber,
                address: jobs['userDeliveryAddress'] ?? "N/A",
                serviceName: jobs['selectedService'] ?? "N/A",
                jobId: jobs['orderId'] ?? "#Unknown",
                imagePath: imagePath.isEmpty
                    ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                    : imagePath,
                date: dateString,
                buttonName: "Start",
                onButtonTap: _showStartDialog,
                onCancelBtnTap: () {
                  // Step 1: Show the first confirmation dialog (Are you sure?)
                  showDialog(
                    context: context,
                    builder: (context) {
                      return AlertDialog(
                        title: Text("Are you sure to cancel this job?"),
                        actions: [
                          TextButton(
                            onPressed: () {
                              // If "No" is pressed, close the dialog
                              Navigator.pop(context);
                            },
                            child: Text("No"),
                          ),
                          TextButton(
                            onPressed: () {
                              // If "Yes" is pressed, proceed to select the reason
                              Navigator.pop(context); // Close the first dialog
                              _showReasonDialog(jobs[
                                  'orderId']); // Pass the job ID to update status later
                            },
                            child: Text("Yes"),
                          ),
                        ],
                      );
                    },
                  );
                },
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
                km: "${distance.toStringAsFixed(0)} miles",
                dId: dId.toString(),
                isImage: isImage,
                images: images,
                payMode: payMode,
                reviewSubmitted: jobs["reviewSubmitted"],
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

  void _showReasonDialog(String orderId) {
    // List of reasons for canceling the job
    List<String> reasons = [
      'Driver Late',
      'Mis-Communication',
      'Language Problem',
      'Other'
    ];

    String? selectedReason;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Select Reason:"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: reasons.map((reason) {
              return RadioListTile<String>(
                title: Text(reason),
                value: reason,
                groupValue: selectedReason,
                onChanged: (value) {
                  setState(() {
                    selectedReason = value!;
                  });
                  Navigator.pop(context); // Close the reason selection dialog
                  _updateJobStatus(orderId,
                      selectedReason!); // Proceed to update the job status
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }

  void _updateJobStatus(String orderId, String reason) async {
    try {
      // Update the job document in Firestore with the new status and reason

      final data = {
        'status': -1, // Update status to cancelled
        'cancelReason': reason, // Store the selected reason
        'cancelBy': 'Mechanic',
      };
      await FirebaseFirestore.instance
          .collection('jobs')
          .doc(orderId)
          .update(data);

      await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('history')
          .doc(orderId)
          .update(data);

      // Show a success message
      Get.snackbar("Job Cancelled", "The job was cancelled due to: $reason",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white);
    } catch (error) {
      // Handle any errors
      Get.snackbar("Error", "Failed to cancel job: $error",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    }
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
            hintText: "Search by #RMS00001",
            prefixIcon: Icon(Icons.search, color: kPrimary.withOpacity(0.5)),
            prefixStyle:
                appStyle(14, kPrimary.withOpacity(0.1), FontWeight.w200),
          ),
        ),
      ),
    );
  }
}
