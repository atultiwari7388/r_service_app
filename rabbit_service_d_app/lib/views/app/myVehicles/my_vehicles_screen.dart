import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
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

class _MyVehiclesScreenState extends State<MyVehiclesScreen>
    with SingleTickerProviderStateMixin {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  final TextEditingController _searchController = TextEditingController();
  final DashboardController _dashboardController =
      Get.find<DashboardController>();

  final List<Map<String, dynamic>> _vehicles = [];
  final List<Map<String, dynamic>> _activeVehicles = [];
  final List<Map<String, dynamic>> _inactiveVehicles = [];
  final List<Map<String, dynamic>> _filteredActive = [];
  final List<Map<String, dynamic>> _filteredInactive = [];

  late StreamSubscription vehiclesSubscription;
  late TabController _tabController;
  late String role = "";
  bool isLoading = false;
  bool isAnonymous = true;
  bool isProfileComplete = false;
  String? _ownerId;

  // Get effective user ID based on role
  String get _effectiveUserId {
    return role == 'SubOwner' ? _ownerId! : currentUId;
  }

  // Check if current user can add vehicles
  // bool get _canAddVehicles {
  //   return role != 'SubOwner' &&
  //       isAnonymous == false &&
  //       isProfileComplete == true;
  // }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    fetchUserDetails().then((_) {
      initializeStreams();
    });

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
          isAnonymous = userData["isAnonymous"] ?? true;
          isProfileComplete = userData["isProfileComplete"] ?? false;
          _ownerId = userData["createdBy"]?.toString() ?? currentUId;
        });
      }
    } catch (e) {
      setState(() {
        role = "";
        _ownerId = currentUId;
      });
    }
  }

  void initializeStreams() {
    vehiclesSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(_effectiveUserId) // Use effective user ID
        .collection("Vehicles")
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        debugPrint('No vehicles found for user $_effectiveUserId');
        setState(() {
          _vehicles.clear();
          _activeVehicles.clear();
          _inactiveVehicles.clear();
          _filteredActive.clear();
          _filteredInactive.clear();
        });
        return;
      }

      final updatedVehicles = snapshot.docs
          .map((doc) => {
                ...doc.data(),
                'id': doc.id,
                'ownerUserId':
                    _effectiveUserId, // Track which user owns this vehicle
              })
          .toList();

      // Sort alphabetically
      updatedVehicles.sort((a, b) {
        final numA = (a['vehicleNumber'] ?? '').toString().toLowerCase();
        final numB = (b['vehicleNumber'] ?? '').toString().toLowerCase();
        return numA.compareTo(numB);
      });

      final activeList =
          updatedVehicles.where((v) => v['active'] == true).toList();
      final inactiveList =
          updatedVehicles.where((v) => v['active'] == false).toList();

      setState(() {
        _vehicles
          ..clear()
          ..addAll(updatedVehicles);
        _activeVehicles
          ..clear()
          ..addAll(activeList);
        _inactiveVehicles
          ..clear()
          ..addAll(inactiveList);

        _filterVehicles(_searchController.text);
      });
    }, onError: (error) {
      debugPrint('Error listening to vehicles: $error');
    });
  }

  void _filterVehicles(String query) {
    final lowerQuery = query.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredActive
          ..clear()
          ..addAll(_activeVehicles);
        _filteredInactive
          ..clear()
          ..addAll(_inactiveVehicles);
      } else {
        _filteredActive
          ..clear()
          ..addAll(_activeVehicles.where((vehicle) {
            final company = vehicle['companyName']?.toLowerCase() ?? '';
            final number = vehicle['vehicleNumber']?.toLowerCase() ?? '';
            return company.contains(lowerQuery) || number.contains(lowerQuery);
          }));
        _filteredInactive
          ..clear()
          ..addAll(_inactiveVehicles.where((vehicle) {
            final company = vehicle['companyName']?.toLowerCase() ?? '';
            final number = vehicle['vehicleNumber']?.toLowerCase() ?? '';
            return company.contains(lowerQuery) || number.contains(lowerQuery);
          }));
      }
    });
  }

  void _showAddVehicleOptions() {
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
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AddVehicleScreen(
                          currentUId:
                              _effectiveUserId), // Use effective user ID
                    ),
                  );
                },
              ),
              // if (role == "Owner") // Only show import for Owners
              ListTile(
                leading: Icon(Icons.upload_file),
                title: Text("Import Vehicle"),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AddVehicleViaExcelScreen(
                          currentUId:
                              _effectiveUserId), // Use effective user ID
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    vehiclesSubscription.cancel();
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Widget buildVehicleList(List<Map<String, dynamic>> list) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "No vehicles found",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            if (role == 'SubOwner')
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  "Vehicles are managed by the owner",
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: list.length,
      itemBuilder: (context, index) {
        final vehicle = list[index];
        final vehicleName = vehicle['companyName'] ?? 'Unknown Vehicle';
        final vehicleNumber = vehicle['vehicleNumber'] ?? 'Unknown Number';
        final vehicleImage = vehicle['image'] ?? 'assets/myvehicles.png';
        final isOwnedByCurrentUser = vehicle['ownerUserId'] == currentUId;

        return Card(
          margin: EdgeInsets.symmetric(vertical: 10, horizontal: 15),
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
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(vehicleNumber,
                        style: TextStyle(
                            fontSize: 17,
                            color: const Color.fromARGB(255, 12, 12, 12),
                            fontWeight: FontWeight.normal)),
                    SizedBox(width: 5),
                    Text("($vehicleName)",
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.normal)),
                  ],
                ),
                if (role == 'SubOwner' && !isOwnedByCurrentUser)
                  Text(
                    "Owner's Vehicle",
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.blue,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
            trailing: Icon(Icons.arrow_forward_ios, color: kPrimary),
            onTap: () {
              Get.to(() => MyVehiclesDetailsScreen(
                    vehicleData: vehicle,
                    role: role,
                    currentUId: _effectiveUserId,
                  ));
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          role == 'SubOwner' ? "Owner's Vehicles" : "My Vehicles",
          style: appStyle(20, kWhite, FontWeight.normal),
        ),
        backgroundColor: kPrimary,
        iconTheme: IconThemeData(color: kWhite),
        actions: (role == "Owner" || role == "SubOwner")
            ? [
                InkWell(
                  onTap: _showAddVehicleOptions,
                  child: CircleAvatar(
                    backgroundColor: kWhite,
                    child: Icon(Icons.add, color: kPrimary),
                  ),
                ),
                SizedBox(width: 10.w),
              ]
            : [],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (role == 'SubOwner')
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(12),
                    color: Colors.blue[50],
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "Viewing vehicles from your owner",
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
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
                TabBar(
                  controller: _tabController,
                  labelColor: kPrimary,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: kPrimary,
                  tabs: const [
                    Tab(text: 'Active Vehicles'),
                    Tab(text: 'Inactive Vehicles'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      buildVehicleList(_filteredActive),
                      buildVehicleList(_filteredInactive),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
