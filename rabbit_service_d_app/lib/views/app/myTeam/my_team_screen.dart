import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/services/make_call.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/add_team_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/edit_team_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/member_jobs_history.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/view_members_trip.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/view_vehicles_screen.dart';
import '../../../utils/app_styles.dart';

class MyTeamScreen extends StatefulWidget {
  const MyTeamScreen({super.key});

  @override
  _MyTeamScreenState createState() => _MyTeamScreenState();
}

class _MyTeamScreenState extends State<MyTeamScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _allMembers = [];
  List<Map<String, dynamic>> _filteredMembers = [];
  bool _isLoading = true;
  String _errorMessage = '';
  late String role = "";

  List<String> _selectedRoles = ['All'];
  List<String> _availableRoles = [
    'All',
    'Manager',
    'Driver',
    'Vendor',
    'Accountant',
    'Other Staff'
  ];

  @override
  void initState() {
    super.initState();
    fetchUserDetails();
    fetchTeamMembersWithVehicles();
    _searchController.addListener(_filterMembers);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterMembers);
    _searchController.dispose();
    super.dispose();
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
      } else {
        setState(() {
          _errorMessage = 'User not found';
        });
      }
    } catch (e) {
      // log("Error fetching user details: $e");
      setState(() {});
    }
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

        vehicles.sort((a, b) => a['vehicleNumber']
            .toString()
            .toLowerCase()
            .compareTo(b['vehicleNumber'].toString().toLowerCase()));

        log('Member $name has ${vehicles.length} vehicles');

        membersWithVehicles.add({
          'name': name,
          'email': email,
          'isActive': isActive,
          'memberId': memberId,
          'ownerId': member['createdBy'],
          'vehicles': vehicles,
          'perMileCharge': member['perMileCharge'],
          'role': member['role'],
          'phoneNumber': member['phoneNumber'],
        });
      }

      membersWithVehicles.sort(
          (a, b) => a['name'].toLowerCase().compareTo(b['name'].toLowerCase()));

      setState(() {
        _allMembers = membersWithVehicles;
        _filteredMembers = membersWithVehicles;
        _isLoading = false;
      });

      log('Total members fetched: ${_allMembers.length}');
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
      if (query.isEmpty &&
          (_selectedRoles.contains('All') || _selectedRoles.isEmpty)) {
        _filteredMembers = _allMembers;
      } else {
        _filteredMembers = _allMembers.where((member) {
          // Filter by role first
          bool roleMatches = _selectedRoles.contains('All') ||
              _selectedRoles.contains(member['role']);

          if (!roleMatches) return false;

          // Then filter by search query if needed
          if (query.isEmpty) return true;

          String name = member['name'].toLowerCase();
          String vehicleDetails = member['vehicles']
              .map<String>((vehicle) =>
                  "${vehicle['vehicleNumber'].toLowerCase()} (${vehicle['companyName'].toLowerCase()})")
              .join(' ')
              .toLowerCase();
          bool matchesName = name.contains(query);
          bool matchesVehicle = vehicleDetails.contains(query);
          return matchesName || matchesVehicle;
        }).toList();
      }
      _filteredMembers.sort(
          (a, b) => a['name'].toLowerCase().compareTo(b['name'].toLowerCase()));
      log('Filtered members count: ${_filteredMembers.length}');
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
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
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
                                _filterMembers();
                              },
                            )
                          : null,
                    ),
                  ),
                ),
                SizedBox(width: 10.w),
                IconButton(
                  icon: Icon(Icons.filter_list, color: kPrimary),
                  onPressed: _showFilterDialog,
                ),
              ],
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
                              String phone = member['phoneNumber'];
                              bool isActive = member['isActive'];
                              String memberId = member['memberId'];
                              String ownerId = member['ownerId'];
                              String perMileCharge = member['perMileCharge'];
                              List vehicles = member['vehicles'];

                              String vehicleDetails = vehicles.isNotEmpty
                                  ? vehicles
                                      .map<String>((vehicle) =>
                                          "${vehicle['vehicleNumber']} (${vehicle['companyName']})")
                                      .join('\n')
                                  : 'No Vehicles';

                              return Container(
                                margin: EdgeInsets.only(left: 8.w, right: 8.w),
                                padding: EdgeInsets.symmetric(vertical: 8.h),
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
                                    "${member['role']}",
                                    style: kIsWeb
                                        ? TextStyle()
                                        : appStyle(
                                            14, kDark, FontWeight.normal),
                                  ),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      InkWell(
                                        onTap: () => makePhoneCall(phone),
                                        child: CircleAvatar(
                                          radius: 18.r,
                                          backgroundColor: kSecondary,
                                          child:
                                              Icon(Icons.call, color: kWhite),
                                        ),
                                      ),
                                      SizedBox(width: 2.w),
                                      Switch(
                                        activeColor: kPrimary,
                                        value: isActive,
                                        onChanged: (bool value) async {
                                          try {
                                            await FirebaseFirestore.instance
                                                .collection('Users')
                                                .doc(memberId)
                                                .update({'active': value});

                                            setState(() {
                                              _filteredMembers[index]
                                                  ['isActive'] = value;
                                            });

                                            showToastMessage(
                                                "Success",
                                                "Member status updated",
                                                Colors.green);
                                          } catch (e) {
                                            showToastMessage(
                                                "Error",
                                                "Failed to update status",
                                                Colors.red);
                                          }
                                        },
                                      ),
                                      PopupMenuButton<String>(
                                        icon: Icon(Icons
                                            .more_vert_rounded), // The 3-dot menu icon
                                        onSelected: (value) {
                                          if (value == 'edit') {
                                            Get.to(() => EditTeamMember(
                                                memberId: memberId));
                                          } else if (value == 'view_trip') {
                                            Get.to(() => ViewMemberTrip(
                                                  memberName: name,
                                                  memberId: memberId,
                                                  ownerId: ownerId,
                                                  perMileCharge:
                                                      num.parse(perMileCharge),
                                                ));
                                          } else if (value == 'view_vehicles') {
                                            Get.to(() => MemberVehiclesScreen(
                                                  memberName: name,
                                                  memberContact: phone,
                                                  memberId: memberId,
                                                  vehicles: member['vehicles'],
                                                ));
                                          } else if (value == 'view_jobs') {
                                            Get.to(
                                                () => MemberJobsHistoryScreen(
                                                      memberName: name,
                                                      memebrId: memberId,
                                                      ownerId: ownerId,
                                                    ));
                                          }
                                        },
                                        itemBuilder: (BuildContext context) => [
                                          PopupMenuItem(
                                            value: 'edit',
                                            child: ListTile(
                                              leading: Icon(Icons.edit,
                                                  color: kPrimary),
                                              title: Text('Edit'),
                                            ),
                                          ),
                                          if (role == "Owner" ||
                                              role == "Manager" ||
                                              role == "Accountant")
                                            PopupMenuItem(
                                              value: 'view_trip',
                                              child: ListTile(
                                                leading: Icon(
                                                    Icons.directions_car,
                                                    color: kPrimary),
                                                title: Text('View Trip'),
                                              ),
                                            ),
                                          if (role == "Owner" ||
                                              role == "Manager" ||
                                              role == "Accountant")
                                            PopupMenuItem(
                                              value: 'view_vehicles',
                                              child: ListTile(
                                                leading: Icon(Icons.work,
                                                    color: kPrimary),
                                                title: Text('View Vehicles'),
                                              ),
                                            ),
                                          if (role == "Owner" ||
                                              role == "Manager" ||
                                              role == "Accountant")
                                            PopupMenuItem(
                                              value: 'view_jobs',
                                              child: ListTile(
                                                leading: Icon(Icons.work,
                                                    color: kPrimary),
                                                title: Text('View Jobs'),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text("Filter by Role"),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: _availableRoles.map((role) {
                    return CheckboxListTile(
                      title: Text(role),
                      value: _selectedRoles.contains(role),
                      onChanged: (bool? value) {
                        setState(() {
                          if (value == true) {
                            if (role == 'All') {
                              _selectedRoles = ['All'];
                            } else {
                              _selectedRoles.remove('All');
                              _selectedRoles.add(role);
                            }
                          } else {
                            _selectedRoles.remove(role);
                            if (_selectedRoles.isEmpty) {
                              _selectedRoles.add('All');
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ),
              actions: [
                TextButton(
                  child: Text("Cancel"),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                TextButton(
                  child: Text("Apply"),
                  onPressed: () {
                    Navigator.of(context).pop();
                    _filterMembers();
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }
}
