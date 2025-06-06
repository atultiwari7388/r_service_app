import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/getStringFromStatus.dart';

class TripWiseVehicleScreen extends StatefulWidget {
  const TripWiseVehicleScreen({super.key});

  @override
  State<TripWiseVehicleScreen> createState() => _TripWiseVehicleScreenState();
}

class _TripWiseVehicleScreenState extends State<TripWiseVehicleScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Trip Wise Vehicle"),
        bottom: TabBar(
          labelColor: kPrimary,
          controller: _tabController,
          indicatorColor: kPrimary,
          tabs: const [
            Tab(text: "Assign Trip"),
            Tab(text: "Not Assign Trip"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          AssignTripScreen(),
          NotAssignedTripScreen(),
        ],
      ),
    );
  }
}

class AssignTripScreen extends StatelessWidget {
  const AssignTripScreen({super.key});
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  // Stream<List<Map<String, dynamic>>> fetchTrips(String ownerId) {
  //   return FirebaseFirestore.instance
  //       .collection("Users")
  //       .where("createdBy", isEqualTo: ownerId)
  //       .where("isTeamMember", isEqualTo: true)
  //       .snapshots()
  //       .asyncMap((usersSnapshot) async {
  //     List<Map<String, dynamic>> allTrips = [];

  //     // Include the current user's trips
  //     QuerySnapshot currentUserTrips = await FirebaseFirestore.instance
  //         .collection("Users")
  //         .doc(ownerId)
  //         .collection("trips")
  //         .where("currentUID", isEqualTo: ownerId)
  //         .where("tripStatus", isEqualTo: 1)
  //         .get();

  //     for (var trip in currentUserTrips.docs) {
  //       allTrips.add({
  //         "companyName": trip["companyName"],
  //         "vehicleNumber": trip["vehicleNumber"],
  //         "tripName": trip["tripName"],
  //         "tripStartDate": trip["tripStartDate"],
  //         "driverName": "You",
  //         "tripStatus": trip["tripStatus"],
  //       });
  //     }

  //     // Fetch trips for team members
  //     for (var userDoc in usersSnapshot.docs) {
  //       QuerySnapshot tripSnapshot = await FirebaseFirestore.instance
  //           .collection("Users")
  //           .doc(userDoc.id)
  //           .collection("trips")
  //           .where("tripStatus", isEqualTo: 1)
  //           .get();

  //       for (var trip in tripSnapshot.docs) {
  //         // Fetch Driver Name from Users collection
  //         var driverDoc = await FirebaseFirestore.instance
  //             .collection("Users")
  //             .doc(userDoc.id)
  //             .get();

  //         allTrips.add({
  //           "companyName": trip["companyName"],
  //           "vehicleNumber": trip["vehicleNumber"],
  //           "tripName": trip["tripName"],
  //           "tripStartDate": trip["tripStartDate"],
  //           "driverName": driverDoc["userName"],
  //           "tripStatus": trip["tripStatus"],
  //         });
  //       }
  //     }
  //     return allTrips;
  //   });
  // }

  Stream<List<Map<String, dynamic>>> fetchTrips(String ownerId) {
    return FirebaseFirestore.instance
        .collection("Users")
        .where("createdBy", isEqualTo: ownerId)
        .where("isTeamMember", isEqualTo: true)
        .snapshots()
        .asyncMap((usersSnapshot) async {
      final Map<String, Map<String, dynamic>> vehicleTrips = {};

      // 1. Fetch owner's trips first (highest priority)
      final QuerySnapshot ownerTrips = await FirebaseFirestore.instance
          .collection("Users")
          .doc(ownerId)
          .collection("trips")
          .where("tripStatus", isEqualTo: 1)
          .get();

      for (final trip in ownerTrips.docs) {
        final vehicleNumber = trip['vehicleNumber'] as String;
        vehicleTrips[vehicleNumber] = {
          "companyName": trip["companyName"],
          "vehicleNumber": vehicleNumber,
          "tripName": trip["tripName"],
          "tripStartDate": trip["tripStartDate"],
          "driverName": "You", // Owner's trip always shows "You"
          "tripStatus": trip["tripStatus"],
          "isOwnerTrip": true,
          "trailerNumber": trip["trailerNumber"] ?? "",
          "trailerCompanyName": trip["trailerCompanyName"] ?? "",
        };
      }

      // 2. Fetch team members' trips (only for vehicles without owner trips)
      for (final userDoc in usersSnapshot.docs) {
        final QuerySnapshot driverTrips = await FirebaseFirestore.instance
            .collection("Users")
            .doc(userDoc.id)
            .collection("trips")
            .where("tripStatus", isEqualTo: 1)
            .get();

        for (final trip in driverTrips.docs) {
          final vehicleNumber = trip['vehicleNumber'] as String;

          // Skip if owner already has a trip for this vehicle
          if (vehicleTrips.containsKey(vehicleNumber)) continue;

          final driverDoc = await FirebaseFirestore.instance
              .collection("Users")
              .doc(userDoc.id)
              .get();
          final driverName = driverDoc["userName"] as String;

          if (vehicleTrips.containsKey(vehicleNumber)) {
            // If multiple drivers have trips for same vehicle, combine names
            final existingDriverNames =
                vehicleTrips[vehicleNumber]!["driverName"] as String;
            if (!existingDriverNames.contains(driverName)) {
              vehicleTrips[vehicleNumber]!["driverName"] =
                  "$existingDriverNames/$driverName";
            }
          } else {
            // First driver trip for this vehicle
            vehicleTrips[vehicleNumber] = {
              "companyName": trip["companyName"],
              "vehicleNumber": vehicleNumber,
              "tripName": trip["tripName"],
              "tripStartDate": trip["tripStartDate"],
              "driverName": driverName,
              "tripStatus": trip["tripStatus"],
              "isOwnerTrip": false,
              "trailerNumber": trip["trailerNumber"] ?? "",
              "trailerCompanyName": trip["trailerCompanyName"] ?? "",
            };
          }
        }
      }

      return vehicleTrips.values.toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final String currentUId = FirebaseAuth.instance.currentUser!.uid;

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: fetchTrips(currentUId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Text(
              "No Assigned Trips Found",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          );
        }

        // var trips = snapshot.data!;

        var trips = snapshot.data!;
        trips.sort((a, b) => a['vehicleNumber'].compareTo(b['vehicleNumber']));

        return ListView.builder(
          itemCount: trips.length,
          itemBuilder: (context, index) {
            var trip = trips[index];

            String formattedDate =
                DateFormat('yyyy-MM-dd').format(trip['tripStartDate'].toDate());

            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${trip['vehicleNumber']} - ${trip['companyName']}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueAccent,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Trailer: ${trip['trailerNumber']} - ${trip['trailerCompanyName']}",
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: kSecondary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Trip: ${trip['tripName']}",
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Driver: ${trip['driverName']}",
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Status: ${getStringFromTripStatus(trip['tripStatus'])}",
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.orange),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today,
                            size: 16, color: Colors.grey),
                        const SizedBox(width: 5),
                        Text(
                          "${formattedDate}",
                          style: const TextStyle(
                              fontSize: 14, color: Colors.black54),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class NotAssignedTripScreen extends StatelessWidget {
  const NotAssignedTripScreen({super.key});

  Stream<List<Map<String, dynamic>>> fetchNotAssignedVehicles(String ownerId) {
    return FirebaseFirestore.instance
        .collection("Users")
        .where("createdBy", isEqualTo: ownerId)
        .where("isTeamMember", isEqualTo: true)
        .snapshots()
        .asyncMap((usersSnapshot) async {
      List<Map<String, dynamic>> notAssignedVehicles = [];
      Map<String, Map<String, dynamic>> uniqueVehicles = {};

      // Fetch vehicles for the owner where tripAssign == false
      QuerySnapshot ownerVehicles = await FirebaseFirestore.instance
          .collection("Users")
          .doc(ownerId)
          .collection("Vehicles")
          .where("tripAssign", isEqualTo: false)
          .get();

      for (var vehicle in ownerVehicles.docs) {
        String vehicleId = vehicle.id;
        uniqueVehicles[vehicleId] = {
          "companyName": vehicle["companyName"],
          "vehicleNumber": vehicle["vehicleNumber"],
          "driverName": "You",
        };
      }

      // Fetch vehicles for each team member where tripAssign == false
      for (var userDoc in usersSnapshot.docs) {
        var teamMemberId = userDoc.id;
        String driverName = userDoc["userName"];

        QuerySnapshot teamVehicles = await FirebaseFirestore.instance
            .collection("Users")
            .doc(teamMemberId)
            .collection("Vehicles")
            .where("tripAssign", isEqualTo: false)
            .get();

        for (var vehicle in teamVehicles.docs) {
          String vehicleId = vehicle.id;

          if (uniqueVehicles.containsKey(vehicleId)) {
            // If vehicle exists, update driver name
            uniqueVehicles[vehicleId]!["driverName"] = "You/$driverName";
          } else {
            uniqueVehicles[vehicleId] = {
              "companyName": vehicle["companyName"],
              "vehicleNumber": vehicle["vehicleNumber"],
              "driverName": driverName,
            };
          }
        }
      }

      return uniqueVehicles.values.toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final String currentUId = FirebaseAuth.instance.currentUser!.uid;

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: fetchNotAssignedVehicles(currentUId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Text(
              "No Unassigned Vehicles Found",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          );
        }

        // var vehicles = snapshot.data!;
        var vehicles = snapshot.data!;
        vehicles
            .sort((a, b) => a['vehicleNumber'].compareTo(b['vehicleNumber']));

        return ListView.builder(
          itemCount: vehicles.length,
          itemBuilder: (context, index) {
            var vehicle = vehicles[index];

            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${vehicle['vehicleNumber']} - ${vehicle['companyName']}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueAccent,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      "Driver: ${vehicle['driverName']}",
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
