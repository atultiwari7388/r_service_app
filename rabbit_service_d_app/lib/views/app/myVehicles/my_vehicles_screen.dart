import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_via_excel.dart';
import 'package:regal_service_d_app/views/app/myVehicles/my_vehicles_details_screen.dart';

class MyVehiclesScreen extends StatefulWidget {
  const MyVehiclesScreen({super.key});

  @override
  State<MyVehiclesScreen> createState() => _MyVehiclesScreenState();
}

class _MyVehiclesScreenState extends State<MyVehiclesScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final TextEditingController _searchController = TextEditingController();
  final List<Map<String, dynamic>> _vehicles = [];
  final List<Map<String, dynamic>> _filteredVehicles = [];

  late StreamSubscription vehiclesSubscription;
  late String role = "";
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    initializeStreams();
    fetchUserDetails();

    _searchController.addListener(() {
      _filterVehicles(_searchController.text);
    });
  }

  Future<void> fetchUserDetails() async {
    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        setState(() {
          role = userData["role"] ?? "";
        });
      }
    } catch (e) {
      setState(() {});
    }
  }

  void initializeStreams() {
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(currentUId)
        .collection("Vehicles")
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        debugPrint('No vehicles found for user');
        setState(() {
          _vehicles.clear();
          _filteredVehicles.clear();
        });
        return;
      }

      setState(() {
        _vehicles.clear();
        _vehicles.addAll(snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
            }));
        _filterVehicles(_searchController.text); // Re-filter on data update
      });

      debugPrint('Fetched ${_vehicles.length} vehicles');
    });
  }

  void _filterVehicles(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredVehicles
          ..clear()
          ..addAll(_vehicles);
      } else {
        _filteredVehicles
          ..clear()
          ..addAll(_vehicles.where((vehicle) {
            final company = vehicle['companyName']?.toLowerCase() ?? '';
            final number = vehicle['vehicleNumber']?.toLowerCase() ?? '';
            final lowerQuery = query.toLowerCase();
            return company.contains(lowerQuery) || number.contains(lowerQuery);
          }));
      }
    });
  }

  @override
  void dispose() {
    vehiclesSubscription.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text("My Vehicles", style: appStyle(20, kWhite, FontWeight.normal)),
        backgroundColor: kPrimary,
        iconTheme: IconThemeData(color: kWhite),
        actions: [
          role == "Owner"
              ? InkWell(
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return AlertDialog(
                          title: Text("Choose an option"),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ListTile(
                                leading: Icon(Icons.directions_car),
                                title: Text("Add Vehicle"),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => AddVehicleScreen(),
                                    ),
                                  );
                                },
                              ),
                              ListTile(
                                leading: Icon(Icons.upload_file),
                                title: Text("Import Vehicle"),
                                onTap: () {
                                  Navigator.pop(context);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          AddVehicleViaExcelScreen(),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                  child: CircleAvatar(
                    backgroundColor: kWhite,
                    child: Icon(Icons.add, color: kPrimary),
                  ),
                )
              : SizedBox(),
          SizedBox(width: 10.w),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by vehicle number or company name',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: _filteredVehicles.isEmpty
                      ? Center(
                          child: Text("No vehicles found",
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
                        )
                      : ListView.builder(
                          itemCount: _filteredVehicles.length,
                          itemBuilder: (context, index) {
                            final vehicle = _filteredVehicles[index];
                            final vehicleName =
                                vehicle['companyName'] ?? 'Unknown Vehicle';
                            final vehicleNumber =
                                vehicle['vehicleNumber'] ?? 'Unknown Number';
                            final vehicleImage = vehicle['image'] ??
                                'assets/myvehicles.png'; // Placeholder image

                            return Card(
                              margin: EdgeInsets.symmetric(
                                  vertical: 10, horizontal: 15),
                              elevation: 1,
                              child: ListTile(
                                contentPadding: EdgeInsets.all(15),
                                leading: ClipOval(
                                  child: Image.asset(
                                    vehicleImage,
                                    width: 50.w,
                                    height: 50.h,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Text(vehicleNumber,
                                        style: TextStyle(
                                            fontSize: 17,
                                            color: const Color.fromARGB(
                                                255, 12, 12, 12),
                                            fontWeight: FontWeight.normal)),
                                    Text("(${vehicleName})",
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                            fontWeight: FontWeight.normal)),
                                  ],
                                ),
                                // subtitle: Text(
                                //   vehicleNumber,
                                //   style: TextStyle(fontWeight: FontWeight.bold),
                                // ),
                                trailing: Icon(Icons.arrow_forward_ios,
                                    color: kPrimary),
                                onTap: () {
                                  Get.to(() => MyVehiclesDetailsScreen(
                                      vehicleData: vehicle, role: role));
                                },
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

// import 'dart:async';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/services/collection_references.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
// import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_via_excel.dart';
// import 'package:regal_service_d_app/views/app/myVehicles/my_vehicles_details_screen.dart';

// class MyVehiclesScreen extends StatefulWidget {
//   const MyVehiclesScreen({super.key});

//   @override
//   State<MyVehiclesScreen> createState() => _MyVehiclesScreenState();
// }

// class _MyVehiclesScreenState extends State<MyVehiclesScreen> {
//   final bool isLoading = false;
//   final List<Map<String, dynamic>> vehicles = [];
//   late StreamSubscription vehiclesSubscription;
//   late String role = "";

//   @override
//   void initState() {
//     super.initState();
//     initializeStreams();
//     fetchUserDetails();
//   }

//   Future<void> fetchUserDetails() async {
//     try {
//       DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
//           .collection('Users')
//           .doc(currentUId)
//           .get();

//       if (userSnapshot.exists) {
//         // Cast the document data to a map
//         final userData = userSnapshot.data() as Map<String, dynamic>;

//         setState(() {
//           role = userData["role"] ?? "";
//         });
//         // log("Role set to " + role);
//       } else {
//         // log("No user document found for ID: $currentUId");
//       }
//     } catch (e) {
//       // log("Error fetching user details: $e");
//       setState(() {});
//     }
//   }

//   void initializeStreams() {
//     vehiclesSubscription = FirebaseFirestore.instance
//         .collection('Users')
//         .doc(currentUId)
//         .collection("Vehicles")
//         .snapshots()
//         .listen((snapshot) {
//       if (snapshot.docs.isEmpty) {
//         debugPrint('No vehicles found for user');
//         return;
//       }

//       setState(() {
//         vehicles.clear();
//         vehicles
//             .addAll(snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
//       });
//       debugPrint('Fetched ${vehicles.length} vehicles');
//     });
//   }

//   @override
//   void dispose() {
//     vehiclesSubscription.cancel();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title:
//             Text("My Vehicles", style: appStyle(20, kWhite, FontWeight.normal)),
//         backgroundColor: kPrimary,
//         iconTheme: IconThemeData(color: kWhite),
//         actions: [
//           role == "Owner"
//               ? InkWell(
//                   onTap: () {
//                     showDialog(
//                       context: context,
//                       builder: (BuildContext context) {
//                         return AlertDialog(
//                           title: Text("Choose an option"),
//                           content: Column(
//                             mainAxisSize: MainAxisSize.min,
//                             children: [
//                               ListTile(
//                                 leading: Icon(Icons.directions_car),
//                                 title: Text("Add Vehicle"),
//                                 onTap: () async {
//                                   Navigator.push(
//                                     context,
//                                     MaterialPageRoute(
//                                       builder: (context) => AddVehicleScreen(),
//                                     ),
//                                   );
//                                 },
//                               ),
//                               ListTile(
//                                 leading: Icon(Icons.upload_file),
//                                 title: Text("Import Vehicle"),
//                                 onTap: () {
//                                   Navigator.pop(context); // Close the dialog
//                                   Navigator.push(
//                                     context,
//                                     MaterialPageRoute(
//                                       builder: (context) =>
//                                           AddVehicleViaExcelScreen(),
//                                     ),
//                                   );
//                                 },
//                               ),
//                             ],
//                           ),
//                         );
//                       },
//                     );
//                   },
//                   child: CircleAvatar(
//                     backgroundColor: kWhite,
//                     child: Icon(Icons.add, color: kPrimary),
//                   ),
//                 )
//               : SizedBox(),
//           SizedBox(width: 10.w),
//         ],
//       ),
//       body: isLoading
//           ? Center(child: CircularProgressIndicator())
//           : vehicles.isEmpty
//               ? Center(
//                   child: Text("No vehicles found",
//                       style:
//                           TextStyle(fontSize: 18, fontWeight: FontWeight.bold)))
//               : ListView.builder(
//                   itemCount: vehicles.length,
//                   itemBuilder: (context, index) {
//                     final vehicle = vehicles[index];
//                     final vehicleName =
//                         vehicle['companyName'] ?? 'Unknown Vehicle';
//                     final vehicleNumber =
//                         vehicle['vehicleNumber'] ?? 'Unknown Number';
//                     final vehicleImage = vehicle['image'] ??
//                         'assets/myvehicles.png'; // Placeholder image

//                     return Card(
//                       margin:
//                           EdgeInsets.symmetric(vertical: 10, horizontal: 15),
//                       elevation: 1,
//                       child: ListTile(
//                         contentPadding: EdgeInsets.all(15),
//                         leading: ClipOval(
//                           child: Image.asset(
//                             vehicleImage,
//                             width: 50.w,
//                             height: 50.h,
//                             fit: BoxFit.contain,
//                           ),
//                         ),
//                         title: Text(vehicleName,
//                             style: TextStyle(
//                                 fontSize: 18,
//                                 color: Colors.grey[600],
//                                 fontWeight: FontWeight.normal)),
//                         subtitle: Text(
//                           vehicleNumber,
//                           style: TextStyle(fontWeight: FontWeight.bold),
//                         ),
//                         trailing:
//                             Icon(Icons.arrow_forward_ios, color: kPrimary),
//                         onTap: () {
//                           Get.to(() => MyVehiclesDetailsScreen(
//                               vehicleData: vehicle, role: role));
//                         },
//                       ),
//                     );
//                   },
//                 ),
//     );
//   }
// }
