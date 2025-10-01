import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class ViewMemberProfileScreen extends StatefulWidget {
  const ViewMemberProfileScreen(
      {super.key, required this.memberId, required this.memberName});
  final String memberId;
  final String memberName;

  @override
  State<ViewMemberProfileScreen> createState() =>
      _ViewMemberProfileScreenState();
}

class _ViewMemberProfileScreenState extends State<ViewMemberProfileScreen> {
  Map<String, dynamic>? _memberData;
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _fetchMemberData();
  }

  Future<void> _fetchMemberData() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.memberId)
          .get();

      if (doc.exists) {
        setState(() {
          _memberData = doc.data();
          _isLoading = false;
        });
      } else {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _hasError = true;
        _isLoading = false;
      });
    }
  }

  Widget _buildInfoCard(String title, String value, {IconData? icon}) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: icon != null ? Icon(icon, color: kPrimary) : null,
        title: Text(
          value.isEmpty ? 'Not provided' : value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Member Profile',
          style: appStyle(20, kWhite, FontWeight.w300),
        ),
        backgroundColor: kPrimary,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading profile...'),
                ],
              ),
            )
          : _hasError
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red),
                      SizedBox(height: 16),
                      Text(
                        'Failed to load profile',
                        style: TextStyle(fontSize: 18),
                      ),
                      SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _fetchMemberData,
                        child: Text('Retry'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile Header
                      Card(
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: kPrimary.withOpacity(0.2),
                                child: Icon(
                                  Icons.person,
                                  size: 30,
                                  color: kPrimary,
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _memberData?['userName'] ??
                                          widget.memberName,
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Team Member',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      SizedBox(height: 24),

                      // Contact Information Section
                      Text(
                        'Contact Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      SizedBox(height: 12),

                      _buildInfoCard(
                        'Phone Number',
                        _memberData?['phoneNumber'] ?? '',
                        icon: Icons.phone,
                      ),
                      _buildInfoCard(
                        'Telephone Number',
                        _memberData?['telephoneNumber'] ?? '',
                        icon: Icons.phone_android,
                      ),
                      _buildInfoCard(
                        'Email Address',
                        _memberData?['email'] ?? '',
                        icon: Icons.email,
                      ),
                      if (_memberData?['email2']?.isNotEmpty == true)
                        _buildInfoCard(
                          'Secondary Email',
                          _memberData?['email2'] ?? '',
                          icon: Icons.alternate_email,
                        ),

                      SizedBox(height: 24),

                      // Address Information Section
                      Text(
                        'Address Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      SizedBox(height: 12),

                      _buildInfoCard(
                        'Address',
                        _memberData?['address'] ?? '',
                        icon: Icons.location_on,
                      ),
                      _buildInfoCard(
                        'City',
                        _memberData?['city'] ?? '',
                        icon: Icons.location_city,
                      ),
                      _buildInfoCard(
                        'State',
                        _memberData?['state'] ?? '',
                        icon: Icons.map,
                      ),
                      _buildInfoCard(
                        'Country',
                        _memberData?['country'] ?? '',
                        icon: Icons.public,
                      ),
                      if (_memberData?['postalCode']?.isNotEmpty == true)
                        _buildInfoCard(
                          'Postal Code',
                          _memberData?['postalCode'] ?? '',
                          icon: Icons.markunread_mailbox,
                        ),

                      SizedBox(height: 24),

                      // License Information Section
                      Text(
                        'License Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      SizedBox(height: 12),

                      _buildInfoCard(
                        'License Number',
                        _memberData?['licNumber'] ?? '',
                        icon: Icons.card_membership,
                      ),

                      SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }
}
