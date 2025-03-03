import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
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

  Stream<List<Map<String, dynamic>>> fetchTrips(String ownerId) {
    return FirebaseFirestore.instance
        .collection("Users")
        .where("createdBy", isEqualTo: ownerId)
        .where("isTeamMember", isEqualTo: true)
        .snapshots()
        .asyncMap((usersSnapshot) async {
      List<Map<String, dynamic>> allTrips = [];

      for (var userDoc in usersSnapshot.docs) {
        QuerySnapshot tripSnapshot = await FirebaseFirestore.instance
            .collection("Users")
            .doc(userDoc.id)
            .collection("trips")
            .where("tripStatus", whereIn: [1, 2])
            .get();


        for (var trip in tripSnapshot.docs) {
          // Fetch Driver Name from Users collection
          var driverDoc = await FirebaseFirestore.instance
              .collection("Users")
              .doc(userDoc.id)
              .get();

          allTrips.add({
            "companyName": trip["companyName"],
            "vehicleNumber": trip["vehicleNumber"],
            "tripName": trip["tripName"],
            "tripStartDate": trip["tripStartDate"],
            "driverName": driverDoc["userName"],
            "tripStatus": trip["tripStatus"],
          });
        }
      }
      return allTrips;
    });
  }

  @override
  Widget build(BuildContext context) {
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

        var trips = snapshot.data!;

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
                      "${trip['companyName']} - ${trip['vehicleNumber']}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueAccent,
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
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.orange),
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

  Stream<List<Map<String, dynamic>>> fetchNotAssignedDrivers(String ownerId) {
    return FirebaseFirestore.instance
        .collection("Users")
        .where("createdBy", isEqualTo: ownerId)
        .where("isTeamMember", isEqualTo: true)
        .snapshots()
        .asyncMap((usersSnapshot) async {
      List<Map<String, dynamic>> notAssignedDrivers = [];

      for (var userDoc in usersSnapshot.docs) {
        // Check if the driver has any active trips (tripStatus 1 or 2)
        QuerySnapshot tripSnapshot = await FirebaseFirestore.instance
            .collection("Users")
            .doc(userDoc.id)
            .collection("trips")
            .where("tripStatus", whereIn: [1, 2])
            .get();

        // If the driver has active trips, skip this driver
        if (tripSnapshot.docs.isNotEmpty) {
          continue;
        }

        // Fetch vehicle details from vehicles subcollection
        QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
            .collection("Users")
            .doc(userDoc.id)
            .collection("vehicles")
            .get();

        // If no vehicle found, store only driver name
        if (vehicleSnapshot.docs.isEmpty) {
          notAssignedDrivers.add({
            "driverName": userDoc["userName"],
            "vehicleName": "No Vehicle Assigned",
            "vehicleNumber": "--",
          });
        } else {
          for (var vehicle in vehicleSnapshot.docs) {
            notAssignedDrivers.add({
              "driverName": userDoc["userName"],
              "vehicleName": vehicle["vehicleName"],
              "vehicleNumber": vehicle["vehicleNumber"],
            });
          }
        }
      }
      return notAssignedDrivers;
    });
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: fetchNotAssignedDrivers(currentUId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Text(
              "No Unassigned Drivers Found",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          );
        }

        var drivers = snapshot.data!;

        return ListView.builder(
          itemCount: drivers.length,
          itemBuilder: (context, index) {
            var driver = drivers[index];

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
                      "Driver: ${driver['driverName']}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Vehicle: ${driver['vehicleName']} - ${driver['vehicleNumber']}",
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.blueAccent,
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
