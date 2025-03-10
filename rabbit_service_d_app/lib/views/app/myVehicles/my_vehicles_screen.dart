import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/views/app/myVehicles/my_vehicles_details_screen.dart';

class MyVehiclesScreen extends StatefulWidget {
  const MyVehiclesScreen({super.key});

  @override
  State<MyVehiclesScreen> createState() => _MyVehiclesScreenState();
}

class _MyVehiclesScreenState extends State<MyVehiclesScreen> {
  final bool isLoading = false;
  final List<Map<String, dynamic>> vehicles = [];
  late StreamSubscription vehiclesSubscription;
  late String role = "";

  @override
  void initState() {
    super.initState();
    initializeStreams();
    fetchUserDetails();
  }

  Future<void> fetchUserDetails() async {
    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .get();

      if (userSnapshot.exists) {
        // Cast the document data to a map
        final userData = userSnapshot.data() as Map<String, dynamic>;

        setState(() {
          role = userData["role"] ?? "";
        });
        // log("Role set to " + role);
      } else {
        // log("No user document found for ID: $currentUId");
      }
    } catch (e) {
      // log("Error fetching user details: $e");
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
        return;
      }

      setState(() {
        vehicles.clear();
        vehicles
            .addAll(snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}));
      });
      debugPrint('Fetched ${vehicles.length} vehicles');
    });
  }

  @override
  void dispose() {
    vehiclesSubscription.cancel();
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
                    Get.to(() => AddVehicleScreen());
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
          : vehicles.isEmpty
              ? Center(
                  child: Text("No vehicles found",
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)))
              : ListView.builder(
                  itemCount: vehicles.length,
                  itemBuilder: (context, index) {
                    final vehicle = vehicles[index];
                    final vehicleName =
                        vehicle['companyName'] ?? 'Unknown Vehicle';
                    final vehicleNumber =
                        vehicle['vehicleNumber'] ?? 'Unknown Number';
                    final vehicleImage = vehicle['image'] ??
                        'assets/myvehicles.png'; // Placeholder image

                    return Card(
                      margin:
                          EdgeInsets.symmetric(vertical: 10, horizontal: 15),
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
                        title: Text(vehicleName,
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold)),
                        subtitle: Text(vehicleNumber,
                            style: TextStyle(color: Colors.grey[600])),
                        trailing:
                            Icon(Icons.arrow_forward_ios, color: kPrimary),
                        onTap: () {
                          Get.to(() =>
                              MyVehiclesDetailsScreen(vehicleData: vehicle, role: role));
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
