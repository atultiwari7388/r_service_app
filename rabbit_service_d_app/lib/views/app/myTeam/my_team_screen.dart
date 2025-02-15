import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/add_team_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/edit_team_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/member_jobs_history.dart';
import '../../../utils/app_styles.dart';

class MyTeamScreen extends StatefulWidget {
  const MyTeamScreen({super.key});

  @override
  _MyTeamScreenState createState() => _MyTeamScreenState();
}

class _MyTeamScreenState extends State<MyTeamScreen> {
  TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _allMembers = [];
  List<Map<String, dynamic>> _filteredMembers = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    fetchTeamMembersWithVehicles();
    _searchController.addListener(_filterMembers);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterMembers);
    _searchController.dispose();
    super.dispose();
  }

  // Method to fetch team members along with their vehicles
  Future<void> fetchTeamMembersWithVehicles() async {
    try {
      List<Map<String, dynamic>> membersWithVehicles = [];

      // Fetch team members from the Users collection
      QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: currentUId)
          .where('uid', isNotEqualTo: currentUId) // Exclude the owner's UID
          .get();

      print('Fetched ${teamSnapshot.docs.length} team members');

      for (var member in teamSnapshot.docs) {
        String memberId = member['uid'];
        String name = member['userName'] ?? 'No Name';
        String email = member['email'] ?? 'No Email';
        bool isActive = member['active'] ?? false;

        // Fetch vehicles from the Vehicles subcollection for each member
        QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(memberId)
            .collection('Vehicles')
            .get();

        List<Map<String, dynamic>> vehicles = vehicleSnapshot.docs.map((doc) {
          return {
            'companyName': doc['companyName'] ?? 'No Company',
            'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
          };
        }).toList();

        print('Member $name has ${vehicles.length} vehicles');

        // Add member data along with their vehicles to the list
        membersWithVehicles.add({
          'name': name,
          'email': email,
          'isActive': isActive,
          'memberId': memberId,
          'ownerId': member['createdBy'],
          'vehicles': vehicles, // List of vehicles
        });
      }

      setState(() {
        _allMembers = membersWithVehicles;
        _filteredMembers = membersWithVehicles; // Initialize filtered list
        _isLoading = false;
      });

      print('Total members fetched: ${_allMembers.length}');
    } catch (e) {
      print('Error fetching team members: $e');
      setState(() {
        _errorMessage = 'Error loading team members: $e';
        _isLoading = false;
      });
    }
  }

  void _filterMembers() {
    String query = _searchController.text.toLowerCase();
    print('Filtering members with query: "$query"');
    setState(() {
      if (query.isEmpty) {
        _filteredMembers = _allMembers;
      } else {
        _filteredMembers = _allMembers.where((member) {
          String name = member['name'].toLowerCase();
          String vehicleDetails = member['vehicles']
              .map<String>((vehicle) =>
                  "${vehicle['companyName'].toLowerCase()} (${vehicle['vehicleNumber'].toLowerCase()})")
              .join(' ')
              .toLowerCase();
          bool matchesName = name.contains(query);
          bool matchesVehicle = vehicleDetails.contains(query);
          return matchesName || matchesVehicle;
        }).toList();
      }
      print('Filtered members count: ${_filteredMembers.length}');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Team"),
        actions: [
          InkWell(
            onTap: () => Get.to(() => const AddTeamMember()),
            child: CircleAvatar(
              radius: 20.r,
              backgroundColor: kPrimary,
              child: const Icon(Icons.add, color: kWhite),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: Column(
        children: [
          // Attractive Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by Name or Vehicle Number',
                prefixIcon: Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[200],
                contentPadding: const EdgeInsets.symmetric(
                    vertical: 12.0, horizontal: 20.0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30.0),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30.0),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30.0),
                  borderSide: BorderSide(color: kPrimary),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.clear, color: Colors.grey),
                        onPressed: () {
                          _searchController.clear();
                          _filterMembers(); // Clear search results
                        },
                      )
                    : null,
              ),
            ),
          ),
          // Display content based on loading, error, or data state
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage.isNotEmpty
                    ? Center(child: Text(_errorMessage))
                    : _filteredMembers.isEmpty
                        ? const Center(child: Text('No team members found'))
                        : ListView.builder(
                            itemCount: _filteredMembers.length,
                            itemBuilder: (context, index) {
                              var member = _filteredMembers[index];
                              String name = member['name'];
                              String email = member['email'];
                              bool isActive = member['isActive'];
                              String memberId = member['memberId'];
                              String ownerId = member['ownerId'];
                              List vehicles = member['vehicles'];

                              String vehicleDetails = vehicles.isNotEmpty
                                  ? vehicles
                                      .map<String>((vehicle) =>
                                          "${vehicle['companyName']} (${vehicle['vehicleNumber']})")
                                      .join('\n')
                                  : 'No Vehicles';

                              return Container(
                                margin: EdgeInsets.only(left: 8.w, right: 8.w),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12.r),
                                  color: kLightWhite,
                                  border: Border.all(
                                    color: kSecondary.withOpacity(0.2),
                                  ),
                                ),
                                child: ListTile(
                                  title: Text(
                                    name,
                                    style: kIsWeb
                                        ? TextStyle()
                                        : appStyle(16, kDark, FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                    vehicleDetails,
                                    style: kIsWeb
                                        ? TextStyle()
                                        : appStyle(
                                            14, kDark, FontWeight.normal),
                                  ),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Switch(
                                        activeColor: kPrimary,
                                        value: isActive,
                                        onChanged: (bool value) {
                                          // Handle the switch change (update in Firestore if necessary)
                                        },
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit,
                                            color: Colors.green),
                                        onPressed: () {
                                          Get.to(() => EditTeamMember(
                                                memberId: memberId,
                                              ));
                                        },
                                      ),
                                    ],
                                  ),
                                  onTap: () =>
                                      Get.to(() => MemberJobsHistoryScreen(
                                            memberName: name,
                                            memebrId: memberId,
                                            ownerId: ownerId,
                                          )),
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
