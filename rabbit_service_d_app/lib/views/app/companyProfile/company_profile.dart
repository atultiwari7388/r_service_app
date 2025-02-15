import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/services/collection_references.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:share_plus/share_plus.dart';

class CompanyProfileScreen extends StatefulWidget {
  const CompanyProfileScreen({super.key});

  @override
  State<CompanyProfileScreen> createState() => _CompanyProfileScreenState();
}

class _CompanyProfileScreenState extends State<CompanyProfileScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  String userId = currentUId;

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  // Show Dialog to Enter Company Name & Address
  void _showCompanyDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Add Company Profile"),
          content: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(labelText: "Enter Company Name"),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Company Name is required";
                    }
                    return null;
                  },
                ),
                SizedBox(height: 10.h),
                TextFormField(
                  controller: _addressController,
                  decoration:
                      InputDecoration(labelText: "Enter Company Address"),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Company Address is required";
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child:
                  Text("Cancel", style: appStyle(16, kRed, FontWeight.normal)),
            ),
            TextButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  Navigator.pop(context);
                  _showConfirmationDialog();
                }
              },
              child: Text("Save",
                  style: appStyle(16, kSecondary, FontWeight.normal)),
            ),
          ],
        );
      },
    );
  }

  // Show Confirmation Dialog Before Saving
  void _showConfirmationDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Confirm"),
          content: Text("Are you sure you want to add this company profile?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("No", style: appStyle(16, kRed, FontWeight.normal)),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _saveCompanyProfile();
              },
              child: Text("Yes",
                  style: appStyle(16, kSecondary, FontWeight.normal)),
            ),
          ],
        );
      },
    );
  }

  // Save Company Profile to Firestore with Auto-ID
  Future<void> _saveCompanyProfile() async {
    String name = _nameController.text.trim();
    String address = _addressController.text.trim();

    if (name.isEmpty || address.isEmpty) return;

    await FirebaseFirestore.instance
        .collection('Users')
        .doc(userId)
        .collection('companyProfile')
        .add({
      'name': name,
      'address': address,
      'timestamp': FieldValue.serverTimestamp(),
    });

    _nameController.clear();
    _addressController.clear();

    setState(() {}); // Refresh UI
  }

  // Share on WhatsApp
  void _shareCompanyProfile(String name, String address) {
    String message = """
    Hey! Check out my company profile managed with Rabbit Mechanic! 🔧

    🏢 Company Name: $name
    📍 Address: $address

    📱 Get the Rabbit Mechanic App:
    • Android: [Play Store URL]
    • iOS: [App Store URL]
    • Web: www.rabbitmechanic.com
    """;

    Share.share(message);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Company Profile"),
        actions: [
          CircleAvatar(
            radius: 20.r,
            backgroundColor: kPrimary,
            child: IconButton(
              color: kWhite,
              onPressed: _showCompanyDialog,
              icon: Icon(Icons.add),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance
            .collection('Users')
            .doc(userId)
            .collection('companyProfile')
            .orderBy('timestamp', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(child: Text("No company profiles added yet"));
          }

          var companyList = snapshot.data!.docs;

          return ListView.builder(
            itemCount: companyList.length,
            itemBuilder: (context, index) {
              var company = companyList[index];
              String name = company['name'];
              String address = company['address'];

              return Card(
                margin: EdgeInsets.symmetric(vertical: 8.h, horizontal: 16.w),
                child: ListTile(
                  title: Text(name,
                      style: appStyleUniverse(16, kPrimary, FontWeight.bold)),
                  subtitle: Text(address,
                      style: appStyle(14, kDark, FontWeight.w500)),
                  trailing: IconButton(
                    icon: Icon(Icons.share, color: kPrimary),
                    onPressed: () => _shareCompanyProfile(name, address),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
