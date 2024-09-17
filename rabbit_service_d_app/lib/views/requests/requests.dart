import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/widgets/request_history_upcoming_request.dart';
import '../../services/collection_references.dart';
import '../../services/get_month_string.dart';
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
            text: "Requests", style: appStyle(20, kDark, FontWeight.normal)),
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
                  final phoneNumber = data['phoneNumber'] ?? '';

                  if (userPhoto.isEmpty) {
                    return Text(
                      userName.isNotEmpty ? userName[0] : '',
                      style: appStyle(20, kWhite, FontWeight.w500),
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
                              style: appStyle(16.sp, kPrimary, FontWeight.w500),
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
                    .where("orderId", isEqualTo: widget.id).where("status", isEqualTo: [1,2,3,4,5])
                    .snapshots(),
                builder: (BuildContext context,
                    AsyncSnapshot<QuerySnapshot> snapshot) {
                  if (snapshot.hasError) {
                    return Text('Error: ${snapshot.error}');
                  }

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }

                  final data = snapshot
                      .data!.docs; // List of documents in the 'jobs' collection

                  return data.isEmpty
                      ? Center(child: Text("No Request"))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: data.length,
                          itemBuilder: (context, index) {
                            final job =
                                data[index].data() as Map<String, dynamic>;
                            final userName = job['userName'] ?? "N/A";
                            final imagePath = job['userPhoto'] ?? "";
                            final vehicleNumber = job['vehicleNumber'] ??
                                "N/A"; // Fetch the vehicle number

                            String dateString = '';
                            if (job['orderDate'] is Timestamp) {
                              DateTime dateTime =
                                  (job['orderDate'] as Timestamp).toDate();
                              dateString =
                                  "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
                            }
                            return RequestAcceptHistoryCard(
                              shopName: job["mName"].toString(),
                              time: job["time"].toString(),
                              distance: "5 km",
                              rating: "4.5",
                              jobId: job["orderId"].toString(),
                              userId: job["userId"].toString(),
                              mId: job["mId"].toString(),
                              arrivalCharges: job["arrivalCharges"].toString(),
                              fixCharges: job["fixPrice"].toString(),
                              perHourCharges: job["perHourCharges"].toString(),
                              imagePath: job["mDp"].toString(),
                              currentStatus: job["status"],
                              isHidden: _selectedCardIndex != null &&
                                  _selectedCardIndex != index,
                              languages: job["languages"] ?? [],
                              isImage: job["isImageSelected"],
                              onCallTap: () {
                                makePhoneCall(job["mNumber"].toString());
                              },
                            );
                          });
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
        style: appStyle(12.sp, color, FontWeight.normal),
      ),
    );
  }

  void _handlePayTap(int index, String payCharges) {
    if (_cardStates[index] == CardState.Accepted) {
      _showPayDialog(index, payCharges);
    } else {}
  }

  void _handleConfirmStartTap(int index) {
    if (_cardStates[index] == CardState.Paid) {
      _showConfirmStartDialog(index);
    } else {
      // Show a message or handle the case where the card is not in the right state
      // showToast("You can only start requests that have been paid.");
    }
  }

  void _showPayDialog(int index, String payCharges) {
    Get.defaultDialog(
      title: "Pay \$$payCharges",
      middleText: "Please proceed to pay.",
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the pay dialog
          setState(() {
            _cardStates[index] = CardState.Paid; // Update card state
          });
          // _showConfirmStartDialog(index); // Show confirm to start dialog
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kSecondary, // Custom color for "Pay" button
        ),
        child: Text(
          "Pay",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  void _showConfirmStartDialog(int index) {
    Get.defaultDialog(
      title: "Confirm to Start",
      middleText: "Are you sure you want to start?",
      textCancel: "No",
      textConfirm: "Yes",
      cancel: OutlinedButton(
        onPressed: () {
          Get.back(); // Close the dialog if "No" is pressed
        },
        child: Text(
          "No",
          style: TextStyle(color: Colors.red), // Custom color for "No" button
        ),
      ),
      confirm: ElevatedButton(
        onPressed: () {
          Get.back(); // Close the confirm to start dialog
          setState(() {
            _cardStates[index] = CardState.Confirmed; // Update card state
          });
          // Optionally, you can show a toast or other indication of ongoing status
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green, // Custom color for "Yes" button
        ),
        child: Text(
          "Yes",
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

enum CardState { Initial, Accepted, Paid, Confirmed }

List<CardState> _cardStates = List.generate(10, (_) => CardState.Initial);
