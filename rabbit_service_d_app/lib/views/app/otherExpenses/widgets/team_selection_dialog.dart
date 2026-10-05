import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';

class TeamMemberOption {
  final String uid;
  final String userName;
  final String email;
  final String phoneNumber;
  final String role;
  final String profilePicture;
  final bool active;

  TeamMemberOption({
    required this.uid,
    required this.userName,
    required this.email,
    required this.phoneNumber,
    required this.role,
    this.profilePicture = '',
    this.active = true,
  });

  factory TeamMemberOption.fromMap(Map<String, dynamic> map, String docId) {
    String phone = map['phoneNumber']?.toString() ?? '';
    phone = phone.replaceAll(RegExp(r'^\+1\s*'), '').replaceAll(RegExp(r'^\+'), '').trim();

    return TeamMemberOption(
      uid: docId,
      userName: (map['userName'] ?? map['name'] ?? 'Unnamed Member').toString().trim(),
      email: map['email']?.toString().trim() ?? '',
      phoneNumber: phone,
      role: map['role']?.toString().trim() ?? 'Driver',
      profilePicture: map['profilePicture']?.toString() ?? '',
      active: map['active'] != false,
    );
  }
}

class TeamSelectionDialog extends StatefulWidget {
  final String effectiveUserId;
  final TeamMemberOption? initialSelected;

  const TeamSelectionDialog({
    super.key,
    required this.effectiveUserId,
    this.initialSelected,
  });

  @override
  State<TeamSelectionDialog> createState() => _TeamSelectionDialogState();
}

class _TeamSelectionDialogState extends State<TeamSelectionDialog> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedRole = "All";
  bool _isLoading = true;
  List<TeamMemberOption> _allMembers = [];
  List<TeamMemberOption> _filteredMembers = [];

  final List<String> _roleTabs = ["All", "Driver", "Accountant", "Manager", "Co-Owner"];

  @override
  void initState() {
    super.initState();
    _fetchTeamMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchTeamMembers() async {
    setState(() => _isLoading = true);
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: widget.effectiveUserId)
          .get();

      final List<TeamMemberOption> members = [];
      for (var doc in snapshot.docs) {
        final data = doc.data();
        if (data['active'] != false && doc.id != widget.effectiveUserId) {
          members.add(TeamMemberOption.fromMap(data, doc.id));
        }
      }

      // Sort alphabetically A-Z by name
      members.sort((a, b) => a.userName.toLowerCase().compareTo(b.userName.toLowerCase()));

      setState(() {
        _allMembers = members;
        _isLoading = false;
      });
      _applyFilter();
    } catch (e) {
      log("Error fetching team members: $e");
      setState(() => _isLoading = false);
    }
  }

  void _applyFilter() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredMembers = _allMembers.where((member) {
        // Role match
        if (_selectedRole != "All") {
          final targetRole = _selectedRole.toLowerCase();
          final memberRole = member.role.toLowerCase();
          if (_selectedRole == "Co-Owner") {
            if (memberRole != "subowner" && memberRole != "co-owner") {
              return false;
            }
          } else if (memberRole != targetRole) {
            return false;
          }
        }

        // Search query match
        if (query.isNotEmpty) {
          final matchName = member.userName.toLowerCase().contains(query);
          final matchEmail = member.email.toLowerCase().contains(query);
          final matchPhone = member.phoneNumber.toLowerCase().contains(query);
          final matchRole = member.role.toLowerCase().contains(query);
          return matchName || matchEmail || matchPhone || matchRole;
        }

        return true;
      }).toList();
    });
  }

  Color _getRoleColor(String role) {
    switch (role.toLowerCase()) {
      case 'driver':
        return Colors.blue;
      case 'accountant':
        return Colors.green;
      case 'manager':
        return Colors.purple;
      case 'subowner':
      case 'co-owner':
        return Colors.orange;
      default:
        return Colors.blueGrey;
    }
  }

  String _formatRoleDisplay(String role) {
    if (role.toLowerCase() == 'subowner') return 'Co-Owner';
    return role;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
      backgroundColor: Colors.white,
      insetPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
      child: Container(
        width: double.infinity,
        constraints: BoxConstraints(maxHeight: 0.8.sh),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
              decoration: BoxDecoration(
                color: kLightWhite,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16.r),
                  topRight: Radius.circular(16.r),
                ),
                border: const Border(bottom: BorderSide(color: kGrayLight, width: 0.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(6.w),
                        decoration: BoxDecoration(
                          color: kPrimary.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.people_alt_rounded, color: kPrimary, size: 18.sp),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        "Assign Team Member",
                        style: appStyle(16, kDark, FontWeight.bold),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: Icon(Icons.close, size: 20.sp, color: kGray),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => Get.back(),
                  ),
                ],
              ),
            ),

            // Search input
            Padding(
              padding: EdgeInsets.fromLTRB(14.w, 12.h, 14.w, 8.h),
              child: Container(
                height: 42.h,
                decoration: BoxDecoration(
                  color: kOffWhite,
                  borderRadius: BorderRadius.circular(10.r),
                  border: Border.all(color: kGrayLight.withOpacity(0.5)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (_) => _applyFilter(),
                  style: appStyle(13, kDark, FontWeight.normal),
                  decoration: InputDecoration(
                    hintText: "Search by name, role, phone...",
                    hintStyle: appStyle(12, kGray, FontWeight.normal),
                    prefixIcon: Icon(Icons.search, color: kGray, size: 18.sp),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              _applyFilter();
                            },
                            child: Icon(Icons.clear, color: kGray, size: 16.sp),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 10.h),
                  ),
                ),
              ),
            ),

            // Role filter chips
            SizedBox(
              height: 36.h,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: 14.w),
                itemCount: _roleTabs.length,
                separatorBuilder: (_, __) => SizedBox(width: 6.w),
                itemBuilder: (context, index) {
                  final role = _roleTabs[index];
                  final isSelected = _selectedRole == role;
                  return ChoiceChip(
                    label: Text(
                      role,
                      style: appStyle(
                        11,
                        isSelected ? Colors.white : kDark,
                        isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: kPrimary,
                    backgroundColor: kOffWhite,
                    padding: EdgeInsets.symmetric(horizontal: 4.w),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedRole = role);
                        _applyFilter();
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20.r),
                      side: BorderSide(
                        color: isSelected ? kPrimary : kGrayLight.withOpacity(0.5),
                        width: 0.8,
                      ),
                    ),
                  );
                },
              ),
            ),

            SizedBox(height: 6.h),

            // Members List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : _filteredMembers.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.person_off_rounded, size: 40.sp, color: kGrayLight),
                              SizedBox(height: 8.h),
                              Text(
                                "No team members found",
                                style: appStyle(13, kGray, FontWeight.w500),
                              ),
                              SizedBox(height: 4.h),
                              Text(
                                "Try adjusting search or role filter",
                                style: appStyle(11, kGrayLight, FontWeight.normal),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
                          itemCount: _filteredMembers.length,
                          separatorBuilder: (_, __) => SizedBox(height: 8.h),
                          itemBuilder: (context, index) {
                            final member = _filteredMembers[index];
                            final isSelected = widget.initialSelected?.uid == member.uid;
                            final roleColor = _getRoleColor(member.role);

                            return InkWell(
                              onTap: () => Get.back(result: member),
                              borderRadius: BorderRadius.circular(12.r),
                              child: Container(
                                padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                                decoration: BoxDecoration(
                                  color: isSelected ? kPrimary.withOpacity(0.06) : Colors.white,
                                  borderRadius: BorderRadius.circular(12.r),
                                  border: Border.all(
                                    color: isSelected ? kPrimary : kGrayLight.withOpacity(0.4),
                                    width: isSelected ? 1.2 : 0.8,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    // Avatar
                                    CircleAvatar(
                                      radius: 20.r,
                                      backgroundColor: roleColor.withOpacity(0.12),
                                      backgroundImage: member.profilePicture.isNotEmpty
                                          ? NetworkImage(member.profilePicture)
                                          : null,
                                      child: member.profilePicture.isEmpty
                                          ? Text(
                                              member.userName.isNotEmpty
                                                  ? member.userName[0].toUpperCase()
                                                  : 'M',
                                              style: appStyle(14, roleColor, FontWeight.bold),
                                            )
                                          : null,
                                    ),
                                    SizedBox(width: 10.w),

                                    // Info
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  member.userName,
                                                  style: appStyle(13, kDark, FontWeight.bold),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              SizedBox(width: 6.w),
                                              Container(
                                                padding: EdgeInsets.symmetric(
                                                    horizontal: 6.w, vertical: 2.h),
                                                decoration: BoxDecoration(
                                                  color: roleColor.withOpacity(0.1),
                                                  borderRadius: BorderRadius.circular(6.r),
                                                  border: Border.all(
                                                    color: roleColor.withOpacity(0.3),
                                                    width: 0.6,
                                                  ),
                                                ),
                                                child: Text(
                                                  _formatRoleDisplay(member.role),
                                                  style: appStyle(9, roleColor, FontWeight.bold),
                                                ),
                                              ),
                                            ],
                                          ),
                                          SizedBox(height: 2.h),
                                          Text(
                                            member.email.isNotEmpty
                                                ? member.email
                                                : (member.phoneNumber.isNotEmpty
                                                    ? member.phoneNumber
                                                    : 'No contact info'),
                                            style: appStyle(11, kGray, FontWeight.normal),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Select Icon
                                    Icon(
                                      isSelected
                                          ? Icons.check_circle_rounded
                                          : Icons.arrow_forward_ios_rounded,
                                      size: isSelected ? 20.sp : 14.sp,
                                      color: isSelected ? kPrimary : kGrayLight,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),

            // Footer
            Container(
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: kLightWhite,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(16.r),
                  bottomRight: Radius.circular(16.r),
                ),
                border: const Border(top: BorderSide(color: kGrayLight, width: 0.5)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Get.back(),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: kGrayLight),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
                        padding: EdgeInsets.symmetric(vertical: 10.h),
                      ),
                      child: Text("Cancel", style: appStyle(12, kDark, FontWeight.w500)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
