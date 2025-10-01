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
import 'package:regal_service_d_app/views/app/myTeam/widgets/view_member_profile_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/view_members_trip.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/view_vehicles_screen.dart';
import '../../../utils/app_styles.dart';

class MyTeamScreen extends StatefulWidget {
  const MyTeamScreen({super.key});

  @override
  _MyTeamScreenState createState() => _MyTeamScreenState();
}

class _MyTeamScreenState extends State<MyTeamScreen>
    with SingleTickerProviderStateMixin {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  late TabController _tabController;

  TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _allMembers = [];
  List<Map<String, dynamic>> _activeMembers = [];
  List<Map<String, dynamic>> _inactiveMembers = [];
  bool _isLoading = true;
  String _errorMessage = '';
  late String role = "";
  bool isAnonymous = true;
  bool isProfileComplete = false;
  String? ownerId;
  List<String> _currentUserVehicleIds = [];

  List<String> _selectedRoles = ['All'];
  List<String> _availableRoles = [
    'All',
    'Manager',
    'Driver',
    'Vendor',
    'Accountant',
    'Other Staff'
  ];

  // Get effective user ID based on role
  String get _effectiveUserId {
    return role == 'SubOwner' ? ownerId! : currentUId;
  }

  // Check if current user can manage team
  bool get _canManageTeam {
    return role == 'Owner' ||
        role == "SubOwner" && isAnonymous == false && isProfileComplete == true;
  }

  // Check if current user can view team
  bool get _canViewTeam {
    return role == 'Owner' ||
        role == 'SubOwner' ||
        role == 'Manager' ||
        role == 'Accountant';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    fetchUserDetails();
    _searchController.addListener(_filterMembers);
  }

  @override
  void dispose() {
    _tabController.dispose();
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
        final userData = userSnapshot.data() as Map<String, dynamic>;
        setState(() {
          role = userData["role"] ?? "";
          isAnonymous = userData["isAnonymous"] ?? true;
          isProfileComplete = userData["isProfileComplete"] ?? false;
          ownerId = userData["createdBy"] ?? currentUId;
        });

        await _fetchCurrentUserVehicles();
        fetchTeamMembersWithVehicles();
      } else {
        setState(() {
          _errorMessage = 'User not found';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading user details: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchCurrentUserVehicles() async {
    try {
      QuerySnapshot vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('Vehicles')
          .get();

      setState(() {
        _currentUserVehicleIds =
            vehiclesSnapshot.docs.map((doc) => doc.id).toList();
      });
    } catch (e) {
      print('Error fetching current user vehicles: $e');
    }
  }

  Future<void> fetchTeamMembersWithVehicles() async {
    try {
      if (!_canViewTeam) {
        setState(() {
          _errorMessage = 'You are not authorized to view team members';
          _isLoading = false;
        });
        return;
      }

      List<Map<String, dynamic>> membersWithVehicles = [];
      String effectiveOwnerId = _effectiveUserId;

      if (role == 'SubOwner') {
        DocumentSnapshot ownerDoc = await FirebaseFirestore.instance
            .collection('Users')
            .doc(effectiveOwnerId)
            .get();

        List? teamMembers = ownerDoc['teamMembers'] as List?;
        if (!ownerDoc.exists ||
            teamMembers == null ||
            !teamMembers.contains(currentUId)) {
          setState(() {
            _errorMessage = 'You are not authorized to view this team';
            _isLoading = false;
          });
          return;
        }
      }

      QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: effectiveOwnerId)
          .get();

      for (var member in teamSnapshot.docs) {
        String memberId = member['uid'];
        String memberRole = member['role'] ?? '';

        // Skip self for Owners, but include self for SubOwners if they are in the team
        if (role == 'Owner' && memberId == currentUId) continue;

        // For SubOwners: filter out Owners and SubOwners, only show other roles
        if (role == 'SubOwner') {
          if (memberRole == 'Owner' || memberRole == 'SubOwner') {
            continue; // Skip Owners and SubOwners
          }
        }

        // For non-owners (Managers/Accountants), only process drivers who share vehicles
        if (role != "Owner" && role != "SubOwner" && memberRole != "Driver") {
          continue;
        }

        String name = member['userName'] ?? 'No Name';
        String email = member['email'] ?? 'No Email';
        bool isActive = member['active'] ?? false;

        QuerySnapshot vehicleSnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(memberId)
            .collection('Vehicles')
            .get();

        List<Map<String, dynamic>> vehicles = vehicleSnapshot.docs.map((doc) {
          return {
            'id': doc.id,
            'companyName': doc['companyName'] ?? 'No Company',
            'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
          };
        }).toList();

        if (role != "Owner" && role != "SubOwner") {
          bool sharesVehicle = vehicles
              .any((vehicle) => _currentUserVehicleIds.contains(vehicle['id']));

          if (!sharesVehicle) continue;
        }

        vehicles.sort((a, b) => a['vehicleNumber']
            .toString()
            .toLowerCase()
            .compareTo(b['vehicleNumber'].toString().toLowerCase()));

        membersWithVehicles.add({
          'name': name,
          'email': email,
          'isActive': isActive,
          'memberId': memberId,
          'ownerId': effectiveOwnerId,
          'vehicles': vehicles,
          'perMileCharge': member['perMileCharge'],
          'role': memberRole,
          'phoneNumber': member['phoneNumber'],
          'isOwnedByCurrentUser': memberId == currentUId,
        });
      }

      membersWithVehicles.sort(
          (a, b) => a['name'].toLowerCase().compareTo(b['name'].toLowerCase()));

      setState(() {
        _allMembers = membersWithVehicles;
        _activeMembers =
            membersWithVehicles.where((m) => m['isActive']).toList();
        _inactiveMembers =
            membersWithVehicles.where((m) => !m['isActive']).toList();
        _isLoading = false;
        _updateAvailableRoles();
      });
    } catch (e) {
      print('Error fetching team members: $e');
      setState(() {
        _errorMessage = 'Error loading team members: $e';
        _isLoading = false;
      });
    }
  }

  void _updateAvailableRoles() {
    Set<String> rolesPresent = {'All'};
    for (var member in _allMembers) {
      rolesPresent.add(member['role']);
    }
    setState(() {
      _availableRoles = rolesPresent.toList();
      _availableRoles.sort((a, b) => a == 'All'
          ? -1
          : b == 'All'
              ? 1
              : a.compareTo(b));
    });
  }

  void _filterMembers() {
    String query = _searchController.text.toLowerCase();

    setState(() {
      if (query.isEmpty &&
          (_selectedRoles.contains('All') || _selectedRoles.isEmpty)) {
        _activeMembers = _allMembers.where((m) => m['isActive']).toList();
        _inactiveMembers = _allMembers.where((m) => !m['isActive']).toList();
      } else {
        _activeMembers = _allMembers.where((member) {
          if (!member['isActive']) return false;
          bool roleMatches = _selectedRoles.contains('All') ||
              _selectedRoles.contains(member['role']);
          if (!roleMatches) return false;
          if (query.isEmpty) return true;
          String name = member['name'].toLowerCase();
          String vehicleDetails = member['vehicles']
              .map<String>((vehicle) =>
                  "${vehicle['vehicleNumber'].toLowerCase()} (${vehicle['companyName'].toLowerCase()})")
              .join(' ')
              .toLowerCase();
          return name.contains(query) || vehicleDetails.contains(query);
        }).toList();

        _inactiveMembers = _allMembers.where((member) {
          if (member['isActive']) return false;
          bool roleMatches = _selectedRoles.contains('All') ||
              _selectedRoles.contains(member['role']);
          if (!roleMatches) return false;
          if (query.isEmpty) return true;
          String name = member['name'].toLowerCase();
          String vehicleDetails = member['vehicles']
              .map<String>((vehicle) =>
                  "${vehicle['vehicleNumber'].toLowerCase()} (${vehicle['companyName'].toLowerCase()})")
              .join(' ')
              .toLowerCase();
          return name.contains(query) || vehicleDetails.contains(query);
        }).toList();
      }

      _activeMembers.sort(
          (a, b) => a['name'].toLowerCase().compareTo(b['name'].toLowerCase()));
      _inactiveMembers.sort(
          (a, b) => a['name'].toLowerCase().compareTo(b['name'].toLowerCase()));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("My Team"),
        actions: _canManageTeam
            ? [
                InkWell(
                  onTap: () =>
                      Get.to(() => AddTeamMember(currentUId: _effectiveUserId)),
                  child: CircleAvatar(
                    radius: 20.r,
                    backgroundColor: kPrimary,
                    child: const Icon(Icons.add, color: kWhite),
                  ),
                ),
                SizedBox(width: 10.w),
              ]
            : [],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Active Members'),
            Tab(text: 'Inactive Members'),
          ],
          labelColor: kPrimary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: kPrimary,
        ),
      ),
      body: Column(
        children: [
          if (role == "Owner" || role == "SubOwner")
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
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
                ],
              ),
            ),
          SizedBox(height: 10.h),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildMembersList(_activeMembers),
                _buildMembersList(_inactiveMembers),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembersList(List<Map<String, dynamic>> members) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage.isNotEmpty) {
      return Center(child: Text(_errorMessage));
    }

    if (!_canViewTeam) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group_off, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'Team Access Restricted',
              style: appStyle(18, kDark, FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'You do not have permission to view team members',
              style: appStyle(14, kGray, FontWeight.normal),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (members.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              role == "SubOwner"
                  ? "No team members found for owner"
                  : role == "Owner"
                      ? 'No team members found'
                      : 'No drivers sharing vehicles with you found',
              style: appStyle(16, kDark, FontWeight.normal),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: members.length,
      itemBuilder: (context, index) {
        var member = members[index];
        String name = member['name'];
        String phone = member['phoneNumber'];
        bool isActive = member['isActive'];
        String memberId = member['memberId'];
        String ownerId = member['ownerId'];
        String perMileCharge = member['perMileCharge'];
        String memberRole = member['role'];
        bool isOwnedByCurrentUser = member['isOwnedByCurrentUser'] ?? false;

        // Check if the team member is an Owner - if so, hide switch and menu buttons
        bool isTeamMemberOwner = memberRole == 'Owner';
        bool isSubOwner = memberRole == 'SubOwner';

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
            title: Row(
              children: [
                Text(
                  name,
                  style: kIsWeb
                      ? TextStyle()
                      : appStyle(16, kDark, FontWeight.bold),
                ),
                if (isOwnedByCurrentUser)
                  Container(
                    margin: EdgeInsets.only(left: 8),
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'You',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                if (isTeamMemberOwner)
                  Container(
                    margin: EdgeInsets.only(left: 8),
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Owner',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.orange[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  memberRole == "SubOwner" ? "Co-Owner" : memberRole,
                  style: kIsWeb
                      ? TextStyle()
                      : appStyle(14, kDark, FontWeight.normal),
                ),
              ],
            ),
            trailing: isTeamMemberOwner
                ? SizedBox(width: 48.w) // Empty space to maintain layout
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: () => makePhoneCall(phone),
                        child: CircleAvatar(
                          radius: 18.r,
                          backgroundColor: kSecondary,
                          child: Icon(Icons.call, color: kWhite),
                        ),
                      ),
                      SizedBox(width: 2.w),
                      if (_canManageTeam && !isOwnedByCurrentUser)
                        Switch(
                          activeColor: kPrimary,
                          value: isActive,
                          onChanged: (bool value) async {
                            try {
                              await FirebaseFirestore.instance
                                  .collection('Users')
                                  .doc(memberId)
                                  .update({'active': value});

                              await fetchTeamMembersWithVehicles();
                              showToastMessage("Success",
                                  "Member status updated", Colors.green);
                            } catch (e) {
                              showToastMessage("Error",
                                  "Failed to update status", Colors.red);
                            }
                          },
                        ),
                      if (!isTeamMemberOwner)
                        PopupMenuButton<String>(
                          icon: Icon(Icons.more_vert_rounded),
                          onSelected: (value) {
                            if (value == 'edit') {
                              if (_canManageTeam && !isOwnedByCurrentUser) {
                                Get.to(() => EditTeamMember(
                                    memberId: memberId,
                                    currentUId: _effectiveUserId));
                              } else {
                                showToastMessage(
                                    "Permission Denied",
                                    "Only owners can edit team members",
                                    Colors.red);
                              }
                            } else if (value == 'view_trip') {
                              Get.to(() => ViewMemberTrip(
                                    memberName: name,
                                    memberId: memberId,
                                    ownerId: ownerId,
                                    perMileCharge: num.parse(perMileCharge),
                                    role: role,
                                    teamRole: memberRole,
                                    effectiveUserId: _effectiveUserId,
                                  ));
                            } else if (value == 'view_vehicles') {
                              Get.to(() => MemberVehiclesScreen(
                                    memberName: name,
                                    memberContact: phone,
                                    memberId: memberId,
                                    vehicles: member['vehicles'],
                                  ));
                            } else if (value == 'view_jobs') {
                              Get.to(() => MemberJobsHistoryScreen(
                                    memberName: name,
                                    memebrId: memberId,
                                    ownerId: ownerId,
                                  ));
                            } else if (value == 'view_profile') {
                              // Add your view profile logic here
                              Get.to(() => ViewMemberProfileScreen(
                                    memberId: memberId,
                                    memberName: name,
                                  ));
                            }
                          },
                          itemBuilder: (BuildContext context) => [
                            if (isSubOwner) ...[
                              // Only show View Profile for SubOwner
                              PopupMenuItem(
                                value: 'view_profile',
                                child: ListTile(
                                  leading: Icon(Icons.person, color: kPrimary),
                                  title: Text('View Profile'),
                                ),
                              ),
                            ],
                            if (_canManageTeam &&
                                !isOwnedByCurrentUser &&
                                !isSubOwner)
                              // Show all options for non-subowner members
                              ...[
                              PopupMenuItem(
                                value: 'edit',
                                child: ListTile(
                                  leading: Icon(Icons.edit, color: kPrimary),
                                  title: Text('Edit'),
                                ),
                              ),
                              PopupMenuItem(
                                value: 'view_trip',
                                child: ListTile(
                                  leading: Icon(Icons.directions_car,
                                      color: kPrimary),
                                  title: Text('View Trip'),
                                ),
                              ),
                              PopupMenuItem(
                                value: 'view_vehicles',
                                child: ListTile(
                                  leading: Icon(Icons.work, color: kPrimary),
                                  title: Text('View Vehicles'),
                                ),
                              ),
                              PopupMenuItem(
                                value: 'view_jobs',
                                child: ListTile(
                                  leading: Icon(Icons.work, color: kPrimary),
                                  title: Text('View Jobs'),
                                ),
                              ),
                            ],
                          ],
                        ),
                    ],
                  ),
          ),
        );
      },
    );
  }

  // void _showFilterDialog() {
  //   showDialog(
  //     context: context,
  //     builder: (BuildContext context) {
  //       return StatefulBuilder(
  //         builder: (context, setState) {
  //           return AlertDialog(
  //             title: Text("Filter by Role"),
  //             content: SingleChildScrollView(
  //               child: Column(
  //                 mainAxisSize: MainAxisSize.min,
  //                 children: _availableRoles.map((role) {
  //                   return CheckboxListTile(
  //                     title: Text(role),
  //                     value: _selectedRoles.contains(role),
  //                     onChanged: (bool? value) {
  //                       setState(() {
  //                         if (value == true) {
  //                           if (role == 'All') {
  //                             _selectedRoles = ['All'];
  //                           } else {
  //                             _selectedRoles.remove('All');
  //                             _selectedRoles.add(role);
  //                           }
  //                         } else {
  //                           _selectedRoles.remove(role);
  //                           if (_selectedRoles.isEmpty) {
  //                             _selectedRoles.add('All');
  //                           }
  //                         }
  //                       });
  //                     },
  //                   );
  //                 }).toList(),
  //               ),
  //             ),
  //             actions: [
  //               TextButton(
  //                 child: Text("Cancel"),
  //                 onPressed: () => Navigator.of(context).pop(),
  //               ),
  //               TextButton(
  //                 child: Text("Apply"),
  //                 onPressed: () {
  //                   Navigator.of(context).pop();
  //                   _filterMembers();
  //                 },
  //               ),
  //             ],
  //           );
  //         },
  //       );
  //     },
  //   );
  // }

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
                    // Display "Co-Owner" instead of "SubOwner" in the UI
                    String displayRole = role == 'SubOwner' ? 'Co-Owner' : role;

                    return CheckboxListTile(
                      title: Text(displayRole),
                      value: _selectedRoles
                          .contains(role), // Still use original role for logic
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
