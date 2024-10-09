import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:regal_service_d_app/views/history/widgets/history_completed_screen.dart';
import '../../../services/find_mechanic.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';

class MyJobsCard extends StatefulWidget {
  const MyJobsCard({
    super.key,
    required this.companyNameAndVehicleName,
    required this.address,
    required this.serviceName,
    this.cancelationReason = "",
    required this.jobId,
    this.imagePath = "",
    required this.dateTime,
    this.isStatusCompleted = false,
    this.onButtonTap,
    this.onCancelBtnTap,
    required this.currentStatus,
    this.nearByDistance = 0,
    this.onDistanceChanged,
    required this.userLat,
    required this.userLong,
  });

  final String companyNameAndVehicleName;
  final String address;
  final String serviceName;
  final String cancelationReason;
  final String jobId;
  final String imagePath;
  final DateTime dateTime;
  final bool isStatusCompleted;
  final void Function()? onButtonTap;
  final void Function()? onCancelBtnTap;
  final int currentStatus;
  final num nearByDistance;
  final Function(num)? onDistanceChanged;
  final num userLat;
  final num userLong;

  @override
  State<MyJobsCard> createState() => _MyJobsCardState();
}

class _MyJobsCardState extends State<MyJobsCard> {
  // Timer? _timer;
  // int _remainingTime = 5 * 60; // 5 minutes in seconds
  // bool _showTimer = true;
  num? _selectedDistance;
  List<num> _distanceOptions = [];
  List<Map<String, dynamic>> _availableMechanics = [];
  StreamSubscription<DocumentSnapshot>? _distanceSubscription;

  @override
  void initState() {
    super.initState();
    // calculateRemainingTime();
    // if (_remainingTime > 0 && widget.currentStatus == 0) {
    //   startTimer();
    // } else {
    //   _showTimer = false;
    // }
    _selectedDistance = widget.nearByDistance;

    fetchDistanceOptions(); // Fetch distance options from Firestore
    fetchAvailableMechanics();
  }

  void fetchDistanceOptions() {
    _distanceSubscription = FirebaseFirestore.instance
        .collection('metadata')
        .doc('nearByDisstanceList')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        List<dynamic> distances = snapshot.get('value');
        setState(() {
          print(distances);
          _distanceOptions = distances.cast<num>();
          // Ensure the current distance is included
          if (!_distanceOptions.contains(widget.nearByDistance)) {
            _distanceOptions.insert(0, widget.nearByDistance);
          }
        });
      }
    }, onError: (error) {
      print("Error fetching distance options: $error");
      // Optionally set a default list or handle the error
      setState(() {
        _distanceOptions = [widget.nearByDistance, 10, 15, 20, 25, 30];
      });
    });
  }

  /// Fetches available mechanics based on nearby distance.
  Future<void> fetchAvailableMechanics() async {
    // Replace with your user's current location coordinates
    final userLocation =
        LatLng(widget.userLat.toDouble(), widget.userLong.toDouble());

    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Mechanics') // Your mechanics collection name
          .get();

      List<Map<String, dynamic>> mechanics = snapshot.docs.map((doc) {
        return {
          'id': doc.id,
          'name': doc['userName'], // Mechanic's name
          'location': doc['location'], // Mechanic's location
        };
      }).toList();

      // Calculate distances and filter based on nearby distance
      setState(() {
        _availableMechanics = mechanics.where((mechanic) {
          double distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            mechanic['location']['latitude'],
            mechanic['location']['longitude'],
          );
          return distance <= widget.nearByDistance; // Check if within range
        }).toList();
      });
    } catch (e) {
      print("Error fetching mechanics: $e");
    }
  }

  @override
  void dispose() {
    // _timer?.cancel();
    _distanceSubscription?.cancel(); // Cancel the Firestore subscription
    super.dispose();
  }

  /// Calculates the remaining time based on job creation time.
  // void calculateRemainingTime() {
  //   DateTime jobTime = widget.dateTime;
  //   DateTime now = DateTime.now();

  //   // Calculate the difference in seconds
  //   int elapsedSeconds = now.difference(jobTime).inSeconds;

  //   // Set remaining time
  //   _remainingTime = 5 * 60 - elapsedSeconds;

  //   if (_remainingTime <= 0) {
  //     _remainingTime = 0;
  //     _showTimer = false;
  //   }
  // }

  // /// Starts the countdown timer.
  // void startTimer() {
  //   _timer = Timer.periodic(Duration(seconds: 1), (timer) {
  //     if (_remainingTime > 0) {
  //       setState(() {
  //         _remainingTime--;
  //       });
  //     } else {
  //       _timer?.cancel();
  //       setState(() {
  //         _showTimer = false;
  //       });
  //     }
  //   });
  // }

  // /// Formats the remaining time as MM:SS.
  // String getFormattedTime() {
  //   int minutes = _remainingTime ~/ 60;
  //   int seconds = _remainingTime % 60;
  //   String formattedMinutes = minutes.toString().padLeft(2, '0');
  //   String formattedSeconds = seconds.toString().padLeft(2, '0');
  //   return '$formattedMinutes:$formattedSeconds';
  // }

  @override
  void didUpdateWidget(covariant MyJobsCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.nearByDistance != widget.nearByDistance) {
      setState(() {
        _selectedDistance = widget.nearByDistance;
      });
      fetchAvailableMechanics();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Use the fetched distance options or a default list if not yet fetched
    List<num> distanceOptions = _distanceOptions.isNotEmpty
        ? _distanceOptions
        : [widget.nearByDistance, 10, 15, 20, 25, 30];

    return Container(
      padding: kIsWeb
          ? EdgeInsets.only(left: 10.w, right: 10.w)
          : EdgeInsets.all(5.w),
      margin: kIsWeb
          ? EdgeInsets.only(left: 50.w, right: 50.w)
          : EdgeInsets.all(2.h),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(12.w),
        boxShadow: [
          BoxShadow(
            color: kSecondary.withOpacity(0.1),
            blurRadius: 6.w,
            offset: Offset(0, 2.h),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Shop image
              CircleAvatar(
                radius: kIsWeb ? 12.w : 24.w,
                backgroundImage: widget.imagePath.isNotEmpty
                    ? NetworkImage(widget.imagePath)
                    : const AssetImage('assets/images/default_avatar.png')
                        as ImageProvider,
                backgroundColor: kSecondary.withOpacity(0.1),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Job ID and DateTime
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          widget.jobId,
                          style: kIsWeb
                              ? TextStyle(color: kSecondary)
                              : appStyle(12, kSecondary, FontWeight.bold),
                        ),
                        Text(
                          DateFormat('dd MMM yyyy, hh:mm a')
                              .format(widget.dateTime),
                          style: kIsWeb
                              ? TextStyle(color: kGray)
                              : appStyle(13, kGray, FontWeight.bold),
                        ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    // Company Name and Vehicle Name
                    Text(
                      widget.companyNameAndVehicleName,
                      style: kIsWeb
                          ? TextStyle(color: kDark)
                          : appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    SizedBox(height: 4.h),
                    // Address
                    SizedBox(
                      width: double.infinity,
                      child: Text(
                        widget.address,
                        maxLines: 2,
                        style: kIsWeb
                            ? TextStyle(color: kGray)
                            : appStyle(15.sp, kGray, FontWeight.bold),
                      ),
                    ),
                    if (widget.currentStatus == 0)
                      Row(
                        children: [
                          // Timer
                          SizedBox(),
                          Expanded(
                            child: Container(
                              padding: EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12.r),
                                color: kSecondary.withOpacity(0.1),
                              ),
                              child: Row(
                                children: [
                                  Text(
                                    "Available \nMechanics",
                                    style:
                                        appStyle(10, kPrimary, FontWeight.bold),
                                  ),
                                  SizedBox(width: 10.w),
                                  Text(
                                    "${_availableMechanics.length}",
                                    style:
                                        appStyle(15, kPrimary, FontWeight.bold),
                                  )
                                ],
                              ),
                            ),
                          ),
                          Spacer(),
                          Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(bottom: 12.h),
                              child: _distanceOptions.isNotEmpty
                                  ? DropdownButton<num>(
                                      isExpanded: true,
                                      value: _selectedDistance,
                                      icon: Icon(
                                          Icons.keyboard_arrow_down_rounded),
                                      elevation: kIsWeb ? 0 : 16,
                                      style: kIsWeb
                                          ? TextStyle(color: kDark)
                                          : appStyle(
                                              13, kDark, FontWeight.normal),
                                      onChanged: (num? newValue) {
                                        if (newValue != null &&
                                            newValue != _selectedDistance) {
                                          setState(() {
                                            _selectedDistance = newValue;
                                          });
                                          if (widget.onDistanceChanged !=
                                              null) {
                                            widget.onDistanceChanged!(newValue);
                                          }
                                        }
                                      },
                                      items: distanceOptions
                                          .map<DropdownMenuItem<num>>(
                                              (num value) {
                                        return DropdownMenuItem<num>(
                                          value: value,
                                          child: Text("$value miles"),
                                        );
                                      }).toList(),
                                    )
                                  : DropdownButton<num>(
                                      isExpanded: true,
                                      value: null,
                                      hint: Text("Loading distances..."),
                                      items: [],
                                      onChanged:
                                          null, // Disable the dropdown while loading
                                    ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          // Service Details and Actions
          Container(
            padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 12.h),
            margin: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
            decoration: BoxDecoration(
              color: kSecondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              children: [
                buildReusableRow("Selected Service", widget.serviceName),
                if (widget.currentStatus == 0)
                  if (widget.currentStatus == -1)
                    buildReusableRow("Cancel Reason", widget.cancelationReason),
                SizedBox(height: 15.h),
                // Action Buttons
                if (widget.currentStatus == -1)
                  Container(
                    height: 40.h,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: kPrimary,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Center(
                      child: Text(
                        "Canceled",
                        style: kIsWeb
                            ? TextStyle()
                            : appStyle(15.sp, kWhite, FontWeight.bold),
                      ),
                    ),
                  )
                else if (widget.currentStatus == 5)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kSuccess,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.0.r),
                        ),
                      ),
                      onPressed: () => Get.to(
                          () => HistoryCompletedScreen(orderId: widget.jobId)),
                      child: Text(
                        "Completed",
                        style: appStyle(15.sp, kWhite, FontWeight.bold),
                      ),
                    ),
                  )
                else
                  Row(
                    children: [
                      if (widget.currentStatus == 0)
                        buildButton(kRed, "Cancel", widget.onCancelBtnTap),
                      if (widget.currentStatus == 0) SizedBox(width: 20.w),
                      buildButton(kSecondary, "View", widget.onButtonTap),
                    ],
                  ),
              ],
            ),
          ),
          SizedBox(height: 12.h),

          // Call button (if any)
        ],
      ),
    );
  }

  Expanded buildButton(Color color, String text, void Function()? onTap) {
    return Expanded(
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: color, // Button color
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0.r),
          ),
        ),
        onPressed: onTap,
        child: Text(
          text,
          style: kIsWeb
              ? TextStyle(color: kWhite)
              : appStyle(13.sp, Colors.white, FontWeight.bold),
        ),
      ),
    );
  }

  Row buildReusableRow(String label, String value) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Text(
            label,
            style: kIsWeb
                ? TextStyle(color: kDark)
                : appStyle(16.sp, kDark, FontWeight.w500),
          ),
        ),
        Expanded(
          flex: 5,
          child: Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: kIsWeb
                ? TextStyle(color: kSecondary)
                : appStyle(13.sp, kSecondary, FontWeight.w500),
          ),
        ),
      ],
    );
  }

  // List<Widget> _buildMechanicsAvatars() {
  //   List<Widget> avatars = [];
  //   int count = _availableMechanics.length;

  //   if (count == 1) {
  //     // Show one avatar for a single mechanic
  //     avatars.add(
  //       CircleAvatar(
  //         radius: 40,
  //         backgroundImage: NetworkImage(_availableMechanics[0]['imageUrl'] ??
  //             'https://via.placeholder.com/150'), // Replace with the mechanic's image URL
  //       ),
  //     );
  //   } else if (count == 2) {
  //     // Show two avatars for two mechanics
  //     for (int i = 0; i < count; i++) {
  //       avatars.add(
  //         Positioned(
  //           left: i * 30.0, // Adjusts the horizontal spacing between avatars
  //           child: CircleAvatar(
  //             radius: 40,
  //             backgroundImage: NetworkImage(_availableMechanics[i]
  //                     ['imageUrl'] ??
  //                 'https://via.placeholder.com/150'), // Replace with the mechanic's image URL
  //           ),
  //         ),
  //       );
  //     }
  //   } else if (count > 2) {
  //     // Show "5+" if more than 5 mechanics are available
  //     for (int i = 0; i < 2; i++) {
  //       avatars.add(
  //         Positioned(
  //           left: i * 30.0,
  //           child: CircleAvatar(
  //             radius: 40,
  //             backgroundImage: NetworkImage(_availableMechanics[i]
  //                     ['imageUrl'] ??
  //                 'https://via.placeholder.com/150'), // Replace with the mechanic's image URL
  //           ),
  //         ),
  //       );
  //     }
  //     // Add a CircleAvatar with the count of remaining mechanics
  //     avatars.add(
  //       Positioned(
  //         left: 60.0, // Adjust position based on the number of shown avatars
  //         child: CircleAvatar(
  //           radius: 40,
  //           backgroundColor: Colors.blueAccent,
  //           child: Text(
  //             '+${count - 2}', // Show the count of additional mechanics
  //             style: TextStyle(
  //               color: Colors.white,
  //               fontSize: 20.sp,
  //               fontWeight: FontWeight.bold,
  //             ),
  //           ),
  //         ),
  //       ),
  //     );
  //   }

  //   return avatars;
  // }
}
