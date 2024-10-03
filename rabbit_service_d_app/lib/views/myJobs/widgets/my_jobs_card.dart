// import 'dart:async';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:intl/intl.dart';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:geolocator/geolocator.dart';
// import 'package:geoflutterfire2/geoflutterfire2.dart';
// import '../../../utils/app_styles.dart';
// import '../../../utils/constants.dart';
// import '../../../widgets/rating_box_widgets.dart';
// import '../../history/widgets/history_completed_screen.dart';

// class MyJobsCard extends StatefulWidget {
//   const MyJobsCard({
//     super.key,
//     required this.companyNameAndVehicleName,
//     required this.address,
//     required this.serviceName,
//     this.cancelationReason = "",
//     required this.jobId,
//     this.imagePath = "",
//     required this.dateTime,
//     this.isStatusCompleted = false,
//     this.onButtonTap,
//     this.onCancelBtnTap,
//     required this.currentStatus,
//     this.nearByDistance = 0,
//     this.onDistanceChanged,
//   });

//   final String companyNameAndVehicleName;
//   final String address;
//   final String serviceName;
//   final String cancelationReason;
//   final String jobId;
//   final String imagePath;
//   final DateTime dateTime;
//   final bool isStatusCompleted;
//   final void Function()? onButtonTap;
//   final void Function()? onCancelBtnTap;
//   final int currentStatus;
//   final num nearByDistance;
//   final Function(num)? onDistanceChanged;

//   @override
//   State<MyJobsCard> createState() => _MyJobsCardState();
// }

// class _MyJobsCardState extends State<MyJobsCard> {
//   Timer? _timer;
//   int _remainingTime = 5 * 60; // 5 minutes in seconds
//   bool _showTimer = true;
//   num? _selectedDistance;
//   List<Map<String, dynamic>> _mechanics = [];
//   bool _isFetchingMechanics = false;
//   String _mechanicFetchError = '';

//   final Geoflutterfire geo = Geoflutterfire();
//   StreamSubscription? _mechanicsSubscription;

//   @override
//   void initState() {
//     super.initState();
//     calculateRemainingTime();
//     if (_remainingTime > 0 && widget.currentStatus == 0) {
//       startTimer();
//     } else {
//       _showTimer = false;
//     }
//     _selectedDistance = widget.nearByDistance;
//     if (widget.currentStatus == 0) {
//       fetchMechanics(_selectedDistance!);
//     }
//   }

//   /// Calculates the remaining time based on job creation time.
//   void calculateRemainingTime() {
//     DateTime jobTime = widget.dateTime;
//     DateTime now = DateTime.now();

//     // Calculate the difference in seconds
//     int elapsedSeconds = now.difference(jobTime).inSeconds;

//     // Set remaining time
//     _remainingTime = 5 * 60 - elapsedSeconds;

//     if (_remainingTime <= 0) {
//       _remainingTime = 0;
//       _showTimer = false;
//     }
//   }

//   /// Starts the countdown timer.
//   void startTimer() {
//     _timer = Timer.periodic(Duration(seconds: 1), (timer) {
//       if (_remainingTime > 0) {
//         setState(() {
//           _remainingTime--;
//         });
//       } else {
//         _timer?.cancel();
//         setState(() {
//           _showTimer = false;
//         });
//       }
//     });
//   }

//   /// Formats the remaining time as MM:SS.
//   String getFormattedTime() {
//     int minutes = _remainingTime ~/ 60;
//     int seconds = _remainingTime % 60;
//     String formattedMinutes = minutes.toString().padLeft(2, '0');
//     String formattedSeconds = seconds.toString().padLeft(2, '0');
//     return '$formattedMinutes:$formattedSeconds';
//   }

//   @override
//   void dispose() {
//     _timer?.cancel();
//     _mechanicsSubscription?.cancel();
//     super.dispose();
//   }

//   @override
//   void didUpdateWidget(covariant MyJobsCard oldWidget) {
//     super.didUpdateWidget(oldWidget);
//     if (oldWidget.nearByDistance != widget.nearByDistance) {
//       setState(() {
//         _selectedDistance = widget.nearByDistance;
//       });
//       if (widget.currentStatus == 0) {
//         fetchMechanics(_selectedDistance!);
//       }
//     }
//   }

//   /// Gets the user's current location.
//   Future<Position?> _getCurrentLocation() async {
//     bool serviceEnabled;
//     LocationPermission permission;

//     // Check if location services are enabled.
//     serviceEnabled = await Geolocator.isLocationServiceEnabled();
//     if (!serviceEnabled) {
//       Get.snackbar("Location Error", "Location services are disabled.",
//           snackPosition: SnackPosition.BOTTOM,
//           backgroundColor: Colors.red,
//           colorText: Colors.white);
//       return null;
//     }

//     // Check for location permissions.
//     permission = await Geolocator.checkPermission();
//     if (permission == LocationPermission.denied) {
//       permission = await Geolocator.requestPermission();
//       if (permission == LocationPermission.denied) {
//         Get.snackbar("Permission Denied", "Location permissions are denied.",
//             snackPosition: SnackPosition.BOTTOM,
//             backgroundColor: Colors.red,
//             colorText: Colors.white);
//         return null;
//       }
//     }

//     if (permission == LocationPermission.deniedForever) {
//       Get.snackbar(
//           "Permission Denied", "Location permissions are permanently denied.",
//           snackPosition: SnackPosition.BOTTOM,
//           backgroundColor: Colors.red,
//           colorText: Colors.white);
//       return null;
//     }

//     // If permissions are granted, get the position.
//     return await Geolocator.getCurrentPosition(
//         desiredAccuracy: LocationAccuracy.high);
//   }

//   /// Fetches available mechanics within the selected distance.
//   void fetchMechanics(num distanceKm) async {
//     setState(() {
//       _isFetchingMechanics = true;
//       _mechanics = [];
//       _mechanicFetchError = '';
//     });

//     Position? position = await _getCurrentLocation();

//     if (position == null) {
//       setState(() {
//         _isFetchingMechanics = false;
//         _mechanicFetchError = 'Unable to get current location.';
//       });
//       return;
//     }

//     GeoFirePoint center =
//         geo.point(latitude: position.latitude, longitude: position.longitude);

//     // Firestore collection reference
//     CollectionReference mechanicsRef =
//         FirebaseFirestore.instance.collection('mechanics');

//     // Query Firestore using GeoFlutterFire
//     Stream<List<DocumentSnapshot>> stream =
//         geo.collection(collectionRef: mechanicsRef).within(
//               center: center,
//               radius: distanceKm,
//               field: 'location',
//               strictMode: true,
//             );

//     // Listen to the stream
//     _mechanicsSubscription?.cancel();
//     _mechanicsSubscription = stream.listen((List<DocumentSnapshot> documents) {
//       List<Map<String, dynamic>> mechanicsList = [];
//       for (var doc in documents) {
//         if (doc.exists) {
//           Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
//           if (data['active'] == true) {
//             mechanicsList.add(data);
//           }
//         }
//       }

//       setState(() {
//         _mechanics = mechanicsList;
//         _isFetchingMechanics = false;
//       });
//     }, onError: (error) {
//       setState(() {
//         _mechanicFetchError = 'Error fetching mechanics: $error';
//         _isFetchingMechanics = false;
//       });
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     // Ensure unique distance options
//     List<num> distanceOptions =
//         {widget.nearByDistance, 10, 15, 20, 25, 30}.toList();

//     return Container(
//       padding: EdgeInsets.all(5.w),
//       margin: EdgeInsets.all(2.h),
//       decoration: BoxDecoration(
//         color: kWhite,
//         borderRadius: BorderRadius.circular(12.w),
//         boxShadow: [
//           BoxShadow(
//             color: kSecondary.withOpacity(0.1),
//             blurRadius: 6.w,
//             offset: Offset(0, 2.h),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             children: [
//               // Shop image
//               CircleAvatar(
//                 radius: 24.w,
//                 backgroundImage: widget.imagePath.isNotEmpty
//                     ? NetworkImage(widget.imagePath)
//                     : const AssetImage('assets/images/default_avatar.png')
//                         as ImageProvider,
//                 backgroundColor: kSecondary.withOpacity(0.1),
//               ),
//               SizedBox(width: 12.w),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     // Job ID and DateTime
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         Text(
//                           widget.jobId,
//                           style: appStyle(12, kSecondary, FontWeight.bold),
//                         ),
//                         Text(
//                           DateFormat('dd MMM yyyy, hh:mm a')
//                               .format(widget.dateTime),
//                           style: appStyle(13, kGray, FontWeight.bold),
//                         ),
//                       ],
//                     ),
//                     SizedBox(height: 4.h),
//                     // Company Name and Vehicle Name
//                     Text(
//                       widget.companyNameAndVehicleName,
//                       style: appStyle(16.sp, kDark, FontWeight.w500),
//                     ),
//                     SizedBox(height: 4.h),
//                     // Address
//                     SizedBox(
//                       width: double.infinity,
//                       child: Text(
//                         widget.address,
//                         maxLines: 2,
//                         style: appStyle(15.sp, kGray, FontWeight.bold),
//                       ),
//                     ),
//                     if (widget.currentStatus == 0)
//                       Padding(
//                         padding: EdgeInsets.only(bottom: 12.h),
//                         child: DropdownButton<num>(
//                           isExpanded: true,
//                           value: _selectedDistance,
//                           icon: Icon(Icons.arrow_downward),
//                           elevation: 16,
//                           style: appStyle(16, kDark, FontWeight.normal),
//                           underline: Container(
//                             height: 2.h,
//                             color: kPrimary,
//                           ),
//                           onChanged: (num? newValue) {
//                             if (newValue != null &&
//                                 newValue != _selectedDistance) {
//                               setState(() {
//                                 _selectedDistance = newValue;
//                               });
//                               widget.onDistanceChanged?.call(newValue);
//                               fetchMechanics(newValue);
//                             }
//                           },
//                           items: distanceOptions
//                               .map<DropdownMenuItem<num>>((num value) {
//                             return DropdownMenuItem<num>(
//                               value: value,
//                               child: Text("$value km"),
//                             );
//                           }).toList(),
//                         ),
//                       ),
//                     SizedBox(height: 4.h),
//                     // Timer
//                     if (widget.currentStatus == 0 && _showTimer)
//                       RatingBoxWidget(
//                         rating: getFormattedTime(),
//                         iconData: Icons.timer,
//                       ),
//                   ],
//                 ),
//               ),
//             ],
//           ),
//           SizedBox(height: 12.h),
//           // Service Details and Actions
//           Container(
//             padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 12.h),
//             margin: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
//             decoration: BoxDecoration(
//               color: kSecondary.withOpacity(0.1),
//               borderRadius: BorderRadius.circular(12.r),
//             ),
//             child: Column(
//               children: [
//                 buildReusableRow("Selected Service", widget.serviceName),
//                 if (widget.currentStatus == -1)
//                   buildReusableRow("Cancel Reason", widget.cancelationReason),
//                 SizedBox(height: 15.h),
//                 // Action Buttons
//                 if (widget.currentStatus == -1)
//                   Container(
//                     height: 40.h,
//                     width: double.infinity,
//                     decoration: BoxDecoration(
//                       color: kPrimary,
//                       borderRadius: BorderRadius.circular(12.r),
//                     ),
//                     child: Center(
//                       child: Text(
//                         "Canceled",
//                         style: appStyle(15.sp, kWhite, FontWeight.bold),
//                       ),
//                     ),
//                   )
//                 else if (widget.currentStatus == 5)
//                   SizedBox(
//                     width: double.infinity,
//                     child: ElevatedButton(
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: kSuccess,
//                         shape: RoundedRectangleBorder(
//                           borderRadius: BorderRadius.circular(12.0.r),
//                         ),
//                       ),
//                       onPressed: () => Get.to(
//                           () => HistoryCompletedScreen(orderId: widget.jobId)),
//                       child: Text(
//                         "Completed",
//                         style: appStyle(15.sp, kWhite, FontWeight.bold),
//                       ),
//                     ),
//                   )
//                 else
//                   Row(
//                     children: [
//                       if (widget.currentStatus == 0 && _showTimer)
//                         buildButton(kRed, "Cancel", widget.onCancelBtnTap),
//                       if (widget.currentStatus == 0 && _showTimer)
//                         SizedBox(width: 20.w),
//                       buildButton(kSecondary, "View", widget.onButtonTap),
//                     ],
//                   )
//               ],
//             ),
//           ),
//           SizedBox(height: 12.h),
//           // Mechanics List
//           if (widget.currentStatus == 0)
//             _isFetchingMechanics
//                 ? Center(child: CircularProgressIndicator())
//                 : _mechanicFetchError.isNotEmpty
//                     ? Text(
//                         _mechanicFetchError,
//                         style: TextStyle(color: Colors.red),
//                       )
//                     : _mechanics.isEmpty
//                         ? Text(
//                             "No mechanics available within selected distance.")
//                         : Column(
//                             crossAxisAlignment: CrossAxisAlignment.start,
//                             children: [
//                               Text(
//                                 "Available Mechanics:",
//                                 style: appStyle(16.sp, kDark, FontWeight.bold),
//                               ),
//                               SizedBox(height: 8.h),
//                               ListView.builder(
//                                 shrinkWrap: true,
//                                 physics: NeverScrollableScrollPhysics(),
//                                 itemCount: _mechanics.length,
//                                 itemBuilder: (context, index) {
//                                   final mechanic = _mechanics[index];
//                                   final mechanicName =
//                                       mechanic['name'] ?? 'N/A';
//                                   final mechanicPhoto =
//                                       mechanic['profilePicture'] ?? '';
//                                   return ListTile(
//                                     leading: CircleAvatar(
//                                       backgroundImage: mechanicPhoto.isNotEmpty
//                                           ? NetworkImage(mechanicPhoto)
//                                           : AssetImage(
//                                                   'assets/images/default_avatar.png')
//                                               as ImageProvider,
//                                       backgroundColor:
//                                           kSecondary.withOpacity(0.1),
//                                     ),
//                                     title: Text(
//                                       mechanicName,
//                                       style: appStyle(
//                                           14.sp, kDark, FontWeight.w500),
//                                     ),
//                                     // You can add more details or actions here
//                                   );
//                                 },
//                               ),
//                             ],
//                           ),
//         ],
//       ),
//     );
//   }

//   Expanded buildButton(Color color, String text, void Function()? onTap) {
//     return Expanded(
//       child: ElevatedButton(
//         style: ElevatedButton.styleFrom(
//           backgroundColor: color, // Button color
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(12.0.r),
//           ),
//         ),
//         onPressed: onTap,
//         child: Text(
//           text,
//           style: appStyle(13.sp, Colors.white, FontWeight.bold),
//         ),
//       ),
//     );
//   }

//   Row buildReusableRow(String label, String value) {
//     return Row(
//       children: [
//         Expanded(
//           flex: 3,
//           child: Text(
//             label,
//             style: appStyle(16.sp, kDark, FontWeight.w500),
//           ),
//         ),
//         Expanded(
//           flex: 5,
//           child: Text(
//             value,
//             maxLines: 2,
//             overflow: TextOverflow.ellipsis,
//             style: appStyle(13.sp, kSecondary, FontWeight.w500),
//           ),
//         ),
//       ],
//     );
//   }
// }

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/views/history/widgets/history_completed_screen.dart';
import '../../../utils/app_styles.dart';
import '../../../utils/constants.dart';
import '../../../widgets/rating_box_widgets.dart';

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

  @override
  State<MyJobsCard> createState() => _MyJobsCardState();
}

class _MyJobsCardState extends State<MyJobsCard> {
  Timer? _timer;
  int _remainingTime = 5 * 60; // 5 minutes in seconds
  bool _showTimer = true;
  num? _selectedDistance;

  @override
  void initState() {
    super.initState();
    calculateRemainingTime();
    if (_remainingTime > 0 && widget.currentStatus == 0) {
      startTimer();
    } else {
      _showTimer = false;
    }
    _selectedDistance = widget.nearByDistance;
  }

  /// Calculates the remaining time based on job creation time.
  void calculateRemainingTime() {
    DateTime jobTime = widget.dateTime;
    DateTime now = DateTime.now();

    // Calculate the difference in seconds
    int elapsedSeconds = now.difference(jobTime).inSeconds;

    // Set remaining time
    _remainingTime = 5 * 60 - elapsedSeconds;

    if (_remainingTime <= 0) {
      _remainingTime = 0;
      _showTimer = false;
    }
  }

  /// Starts the countdown timer.
  void startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_remainingTime > 0) {
        setState(() {
          _remainingTime--;
        });
      } else {
        _timer?.cancel();
        setState(() {
          _showTimer = false;
        });
      }
    });
  }

  /// Formats the remaining time as MM:SS.
  String getFormattedTime() {
    int minutes = _remainingTime ~/ 60;
    int seconds = _remainingTime % 60;
    String formattedMinutes = minutes.toString().padLeft(2, '0');
    String formattedSeconds = seconds.toString().padLeft(2, '0');
    return '$formattedMinutes:$formattedSeconds';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant MyJobsCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.nearByDistance != widget.nearByDistance) {
      setState(() {
        _selectedDistance = widget.nearByDistance;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // List<num> distanceOptions = [widget.nearByDistance, 10, 15, 20, 25, 30];
    List<num> distanceOptions =
        {widget.nearByDistance, 10, 15, 20, 25, 30}.toList();

    return Container(
      padding: EdgeInsets.all(5.w),
      margin: EdgeInsets.all(2.h),
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
                radius: 24.w,
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
                          style: appStyle(12, kSecondary, FontWeight.bold),
                        ),
                        Text(
                          DateFormat('dd MMM yyyy, hh:mm a')
                              .format(widget.dateTime),
                          style: appStyle(13, kGray, FontWeight.bold),
                        ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    // Company Name and Vehicle Name
                    Text(
                      widget.companyNameAndVehicleName,
                      style: appStyle(16.sp, kDark, FontWeight.w500),
                    ),
                    SizedBox(height: 4.h),
                    // Address
                    SizedBox(
                      width: double.infinity,
                      child: Text(
                        widget.address,
                        maxLines: 2,
                        style: appStyle(15.sp, kGray, FontWeight.bold),
                      ),
                    ),
                    if (widget.currentStatus == 0)
                      Row(
                        children: [
                          Text("Distance"),
                          Spacer(),
                          Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(bottom: 12.h),
                              child: DropdownButton<num>(
                                isExpanded: true,
                                value: _selectedDistance,
                                icon: Icon(Icons.keyboard_arrow_down_rounded),
                                elevation: 16,
                                style: appStyle(16, kDark, FontWeight.normal),
                                // underline: Container(
                                //   height: 2.h,
                                //   color: kPrimary,
                                // ),
                                onChanged: (num? newValue) {
                                  if (newValue != null &&
                                      newValue != _selectedDistance) {
                                    setState(() {
                                      _selectedDistance = newValue;
                                    });
                                    widget.onDistanceChanged!(newValue);
                                  }
                                },
                                items: distanceOptions
                                    .map<DropdownMenuItem<num>>((num value) {
                                  return DropdownMenuItem<num>(
                                    value: value,
                                    child: Text("$value miles"),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    SizedBox(height: 4.h),
                    // Timer
                    if (widget.currentStatus == 0 && _showTimer)
                      RatingBoxWidget(
                        rating: getFormattedTime(),
                        iconData: Icons.timer,
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
                        style: appStyle(15.sp, kWhite, FontWeight.bold),
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
                      if (widget.currentStatus == 0 && _showTimer)
                        buildButton(kRed, "Cancel", widget.onCancelBtnTap),
                      if (widget.currentStatus == 0 && _showTimer)
                        SizedBox(width: 20.w),
                      buildButton(kSecondary, "View", widget.onButtonTap),
                    ],
                  )
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
          style: appStyle(13.sp, Colors.white, FontWeight.bold),
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
            style: appStyle(16.sp, kDark, FontWeight.w500),
          ),
        ),
        Expanded(
          flex: 5,
          child: Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: appStyle(13.sp, kSecondary, FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
