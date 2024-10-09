//                               StreamBuilder<QuerySnapshot>(
//                                 stream: FirebaseFirestore.instance
//                                     .collection('jobs')
//                                     .where('status', isEqualTo: 0)
//                                     .snapshots(),
//                                 builder: (BuildContext context,
//                                     AsyncSnapshot<QuerySnapshot> snapshot) {
//                                   if (snapshot.hasError) {
//                                     return Center(
//                                         child:
//                                             Text('Error: ${snapshot.error}'));
//                                   }

//                                   if (snapshot.connectionState ==
//                                       ConnectionState.waiting) {
//                                     return Center(
//                                         child: CircularProgressIndicator());
//                                   }

//                                   final data = snapshot.data!.docs;
// // Filter the data based on mechanicOffers
//                                   final filteredData = data.where((doc) {
//                                     final job =
//                                         doc.data() as Map<String, dynamic>;
//                                     final mechanicOffers =
//                                         job['mechanicOffers'] as List<dynamic>?;

//                                     // Check if mechanicOffers is not null
//                                     if (mechanicOffers != null) {
//                                       // Check for any offer where mId matches currentUId and status is 1
//                                       for (var offer in mechanicOffers) {
//                                         if (offer['mId'] == currentUId &&
//                                             offer['status'] == 1) {
//                                           return false; // Hide the job
//                                         }
//                                       }
//                                     }

//                                     // Show the job if mechanicOffers is null or empty
//                                     return true; // If offers are null or the conditions above aren't met
//                                   }).toList();
//                                   if (filteredData.isEmpty) {
//                                     return Center(
//                                         child: Text("No Request Available"));
//                                   }

//                                   return ListView.builder(
//                                     shrinkWrap: true,
//                                     physics: NeverScrollableScrollPhysics(),
//                                     itemCount: data.length,
//                                     itemBuilder: (context, index) {
//                                       final job = data[index].data()
//                                           as Map<String, dynamic>;

//                                       final userLat =
//                                           (job["userLat"] as num).toDouble();
//                                       final userLng =
//                                           (job["userLong"] as num).toDouble();

//                                       final bool isImage =
//                                           job["isImageSelected"] ?? false;
//                                       final bool isPriceTypeEnable =
//                                           job["fixPriceEnabled"] ?? false;
//                                       final imagePath = job['userPhoto'] ?? "";
//                                       final List<dynamic> images =
//                                           job['images'] ?? [];
//                                       String dateString = '';
//                                       if (job['orderDate'] is Timestamp) {
//                                         DateTime dateTime =
//                                             (job['orderDate'] as Timestamp)
//                                                 .toDate();
//                                         dateString =
//                                             "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
//                                       }

//                                       double distance = calculateDistance(
//                                           userLat,
//                                           userLng,
//                                           controller.mecLat,
//                                           controller.mecLng);
//                                       log('Calculated Distance: $distance km');

//                                       // Retrieve job's nearbyDistance
//                                       num jobNearbyDistance =
//                                           job['nearByDistance'] ?? 0;

//                                       if (distance < 1) {
//                                         distance = 1;
//                                       }

//                                       if (distance <= jobNearbyDistance) {
//                                         return FutureBuilder(
//                                           future: getAverageUserRating(
//                                               job["userId"]),
//                                           builder: (ctx, snapshot) {
//                                             double rating = 4.5;
//                                             if (snapshot.hasData) {
//                                               rating = snapshot.data ?? 4.5;
//                                             }
//                                             return UpcomingRequestCard(
//                                               orderId:
//                                                   job["orderId"].toString(),
//                                               userName:
//                                                   job["userName"].toString(),
//                                               vehicleName:
//                                                   "${job["companyName"]} (${job['vehicleNumber']})",
//                                               address:
//                                                   job['userDeliveryAddress'] ??
//                                                       "N/A",
//                                               serviceName:
//                                                   job['selectedService'] ??
//                                                       "N/A",
//                                               jobId:
//                                                   job['orderId'] ?? "#Unknown",
//                                               imagePath: imagePath.isEmpty
//                                                   ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
//                                                   : imagePath,
//                                               date: dateString,
//                                               buttonName: "Interested",
//                                               onButtonTap: () =>
//                                                   controller.showConfirmDialog(
//                                                 index,
//                                                 data,
//                                                 job["userId"].toString(),
//                                                 job["orderId"].toString(),
//                                                 isImage,
//                                                 isPriceTypeEnable,
//                                               ),
//                                               onDasMapButton: () async {
//                                                 final Uri googleMapsUri = Uri.parse(
//                                                     'https://www.google.com/maps/dir/?api=1&destination=$userLat,$userLng');
//                                                 // ignore: deprecated_member_use
//                                                 if (await canLaunch(
//                                                     googleMapsUri.toString())) {
//                                                   // ignore: deprecated_member_use
//                                                   await launch(
//                                                       googleMapsUri.toString());
//                                                 } else {
//                                                   // Handle the error if the URL cannot be launched
//                                                   print(
//                                                       'Could not launch Google Maps');
//                                                 }
//                                               },
//                                               currentStatus: job['status'] ?? 0,
//                                               rating: rating.toStringAsFixed(1),
//                                               arrivalCharges: "30",
//                                               km: "${distance.toStringAsFixed(0)} miles",
//                                               isImage: isImage,
//                                               // priceEnabled: isPriceTypeEnable,
//                                               images: images,
//                                               fixCharge:
//                                                   job["fixPrice"].toString(),
//                                               reviewSubmitted:
//                                                   job["reviewSubmitted"] ??
//                                                       false,
//                                             );
//                                           },
//                                         );
//                                       } else {
//                                         return Container(); // Return an empty container if the distance is greater than nearbyDistance
//                                       }
//                                     },
//                                   );
//                                 },
//                               ),

                              // StreamBuilder<QuerySnapshot>(
                              //   stream: FirebaseFirestore.instance
                              //       .collection('jobs')
                              //       .where('status', isEqualTo: 0)
                              //       .snapshots(),
                              //   builder: (BuildContext context,
                              //       AsyncSnapshot<QuerySnapshot> snapshot) {
                              //     if (snapshot.hasError) {
                              //       return Center(
                              //           child:
                              //               Text('Error: ${snapshot.error}'));
                              //     }

                              //     if (snapshot.connectionState ==
                              //         ConnectionState.waiting) {
                              //       return Center(
                              //           child: CircularProgressIndicator());
                              //     }

                              //     final data = snapshot.data!.docs;

                              //     // Filter the data based on mechanicOffers
                              //     final filteredData = data.where((doc) {
                              //       final job =
                              //           doc.data() as Map<String, dynamic>;
                              //       final mechanicOffers =
                              //           job['mechanicOffers'] as List<dynamic>?;

                              //       if (mechanicOffers != null) {
                              //         for (var offer in mechanicOffers) {
                              //           if (offer['mId'] == currentUId &&
                              //               offer['status'] == 1) {
                              //             return false; // Hide the job if the mechanic has accepted the job
                              //           }
                              //         }
                              //       }

                              //       return true;
                              //     }).toList();

                              //     if (filteredData.isEmpty) {
                              //       return Center(
                              //           child: Text("No Request Available"));
                              //     }

                              //     return ListView.builder(
                              //       shrinkWrap: true,
                              //       physics: NeverScrollableScrollPhysics(),
                              //       itemCount: filteredData.length,
                              //       itemBuilder: (context, index) {
                              //         final job = filteredData[index].data()
                              //             as Map<String, dynamic>;

                              //         // Extract job details
                              //         final userLat =
                              //             (job["userLat"] as num).toDouble();
                              //         final userLng =
                              //             (job["userLong"] as num).toDouble();
                              //         final bool isImage =
                              //             job["isImageSelected"] ?? false;
                              //         final bool isPriceTypeEnable =
                              //             job["fixPriceEnabled"] ?? false;
                              //         final imagePath = job['userPhoto'] ?? "";
                              //         final List<dynamic> images =
                              //             job['images'] ?? [];

                              //         String dateString = '';
                              //         if (job['orderDate'] is Timestamp) {
                              //           DateTime dateTime =
                              //               (job['orderDate'] as Timestamp)
                              //                   .toDate();
                              //           dateString =
                              //               "${dateTime.day} ${getMonthName(dateTime.month)} ${dateTime.year}";
                              //         }

                              //         double distance = calculateDistance(
                              //             userLat,
                              //             userLng,
                              //             controller.mecLat,
                              //             controller.mecLng);
                              //         log('Calculated Distance: $distance km');

                              //         num jobNearbyDistance =
                              //             job['nearByDistance'] ?? 0;

                              //         if (distance < 1) {
                              //           distance = 1;
                              //         }

                              //         if (distance <= jobNearbyDistance) {
                              //           return FutureBuilder(
                              //             future: getAverageUserRating(
                              //                 job["userId"]),
                              //             builder: (ctx, snapshot) {
                              //               double rating = 4.5;
                              //               if (snapshot.hasData) {
                              //                 rating = snapshot.data ?? 4.5;
                              //               }
                              //               return UpcomingRequestCard(
                              //                 orderId:
                              //                     job["orderId"].toString(),
                              //                 userName:
                              //                     job["userName"].toString(),
                              //                 vehicleName:
                              //                     "${job["companyName"]} (${job['vehicleNumber']})",
                              //                 address:
                              //                     job['userDeliveryAddress'] ??
                              //                         "N/A",
                              //                 serviceName:
                              //                     job['selectedService'] ??
                              //                         "N/A",
                              //                 jobId:
                              //                     job['orderId'] ?? "#Unknown",
                              //                 imagePath: imagePath.isEmpty
                              //                     ? "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                              //                     : imagePath,
                              //                 date: dateString,
                              //                 buttonName: "Interested",
                              //                 onButtonTap: () =>
                              //                     controller.showConfirmDialog(
                              //                   index,
                              //                   filteredData, // Use filtered data
                              //                   job["userId"].toString(),
                              //                   job["orderId"].toString(),
                              //                   isImage,
                              //                   isPriceTypeEnable,
                              //                 ),
                              //                 onDasMapButton: () async {
                              //                   final Uri googleMapsUri = Uri.parse(
                              //                       'https://www.google.com/maps/dir/?api=1&destination=$userLat,$userLng');
                              //                   if (await canLaunch(
                              //                       googleMapsUri.toString())) {
                              //                     await launch(
                              //                         googleMapsUri.toString());
                              //                   } else {
                              //                     print(
                              //                         'Could not launch Google Maps');
                              //                   }
                              //                 },
                              //                 currentStatus: job['status'] ?? 0,
                              //                 rating: rating.toStringAsFixed(1),
                              //                 arrivalCharges: "30",
                              //                 km: "${distance.toStringAsFixed(0)} miles",
                              //                 isImage: isImage,
                              //                 images: images,
                              //                 fixCharge:
                              //                     job["fixPrice"].toString(),
                              //                 reviewSubmitted:
                              //                     job["reviewSubmitted"] ??
                              //                         false,
                              //               );
                              //             },
                              //           );
                              //         } else {
                              //           return Container(); // Return an empty container if distance is greater than nearbyDistance
                              //         }
                              //       },
                              //     );
                              //   },
                              // ),
