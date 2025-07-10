import 'dart:convert';
import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';
import 'package:http/http.dart' as http;
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import '../../../utils/show_toast_msg.dart';
import '../../../utils/app_styles.dart';
import '../../../widgets/reusable_text.dart';
import 'select_location_from_map.dart';

class AddressManagementScreen extends StatefulWidget {
  final double userLat;
  final double userLng;

  const AddressManagementScreen(
      {super.key, required this.userLat, required this.userLng});

  @override
  _AddressManagementScreenState createState() =>
      _AddressManagementScreenState();
}

class _AddressManagementScreenState extends State<AddressManagementScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;

  final TextEditingController _addressController = TextEditingController();
  LocationData? currentLocation;
  String selectedAddressType = "Home";
  double? selectedLat;
  double? selectedLng;
  Map<String, dynamic>? selectedAddress;
  // late String googleMapApiKey;
  bool isApiKeyLoading = false;
  String selectedId = "";

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
  }

  Future<void> getCurrentLocation() async {
    Location location = Location();

    bool _serviceEnabled;
    PermissionStatus _permissionGranted;
    LocationData _locationData;

    _serviceEnabled = await location.serviceEnabled();
    if (!_serviceEnabled) {
      _serviceEnabled = await location.requestService();
      if (!_serviceEnabled) {
        return;
      }
    }

    _permissionGranted = await location.hasPermission();
    if (_permissionGranted == PermissionStatus.denied) {
      _permissionGranted = await location.requestPermission();
      if (_permissionGranted != PermissionStatus.granted) {
        return;
      }
    }

    _locationData = await location.getLocation();
    setState(() {
      currentLocation = _locationData;
    });
  }

  Future<void> selectAddressFromMap() async {
    LatLng? selectedLocation = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => SelectLocationScreen(
          userLat: widget.userLat,
          userLng: widget.userLng,
        ),
      ),
    );

    if (selectedLocation != null) {
      setState(() {
        selectedLat = selectedLocation.latitude;
        selectedLng = selectedLocation.longitude;
      });
      String address = await getAddressFromLatLng(selectedLat!, selectedLng!);
      setState(() {
        _addressController.text = address;
      });
    }
  }

  Future<void> saveAddress() async {
    String userId = FirebaseAuth.instance.currentUser!.uid;
    String address = _addressController.text.trim();

    if (address.isNotEmpty && selectedLat != null && selectedLng != null) {
      DocumentReference addressRef = await FirebaseFirestore.instance
          .collection('Users')
          .doc(userId)
          .collection('Addresses')
          .add({
        'address': address,
        'location': {
          'latitude': selectedLat,
          'longitude': selectedLng,
        },
        'addressType': selectedAddressType,
        'date': DateTime.now(),
      });

      // Retrieve the document ID
      String docId = addressRef.id;
      await addressRef.update({'id': docId});
      // _addressController.clear();
      showToastMessage("Success", "Address added successfully", Colors.green);
      // Navigator.pop(context);
      // Return the selected address to the previous screen
      // Navigator.pop(context, {
      //   "address": _addressController.text.toString(),
      //   "Lat": selectedLat,
      //   "Lng": selectedLng,
      // });
    }
  }

  Widget buildAddressList(DocumentSnapshot document, int index) {
    var address = document.data() as Map<String, dynamic>;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          leading: CircleAvatar(
            radius: 14.r,
            child: Text((index + 1).toString()),
          ),
          title: Text(address['address'],
              style: appStyle(11, kDark, FontWeight.normal)),
          subtitle: Text(
              '${address['addressType']} - (${address['location']['latitude']}, ${address['location']['longitude']})',
              style: appStyle(8, kGray, FontWeight.normal)),
          trailing: IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              showDeleteConfirmationDialog(document);
            },
          ),
          onTap: () async {
            String userId = FirebaseAuth.instance.currentUser!.uid;

            // Get a reference to the address document
            DocumentReference addressRef = document.reference;

            // Begin a batch write
            WriteBatch batch = FirebaseFirestore.instance.batch();

            // Set the selected address to true
            batch.update(addressRef, {'isAddressSelected': true});

            // Fetch all addresses that are currently selected (excluding the newly selected one)
            QuerySnapshot otherAddresses = await FirebaseFirestore.instance
                .collection('Users')
                .doc(userId)
                .collection('Addresses')
                .where('isAddressSelected', isEqualTo: true)
                .get();

            // Set all other addresses to false
            for (DocumentSnapshot otherAddress in otherAddresses.docs) {
              if (otherAddress.id != document.id) {
                batch.update(
                    otherAddress.reference, {'isAddressSelected': false});
              }
            }

            // Commit the batch write
            await batch.commit();

            // Optionally, update the UI if needed
            // setState(() {});

            // Return the selected address to the previous screen
            Navigator.pop(context, address);
            log(address.toString());
          },
        ),
        // DashedDivider(),
      ],
    );
  }

  void showDeleteConfirmationDialog(DocumentSnapshot document) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Address'),
          content: const Text('Are you sure you want to delete this address?'),
          actions: [
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Delete'),
              onPressed: () {
                deleteAddress(document);
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> deleteAddress(DocumentSnapshot document) async {
    try {
      await document.reference.delete();
      log('Address deleted successfully');
    } catch (e) {
      log('Error deleting address: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // String userId = FirebaseAuth.instance.currentUser!.uid;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kPrimary,
        leading: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: const Icon(Icons.arrow_back_ios, color: kWhite)),
        title: ReusableText(
            text: "Manage Addresses",
            style: appStyle(18, kWhite, FontWeight.normal)),
      ),
      body: isApiKeyLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 5,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('Users')
                          .doc(currentUId)
                          .collection('Addresses')
                          .orderBy("date", descending: true)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (!snapshot.hasData) {
                          return const Center(
                              child: CircularProgressIndicator());
                        }
                        return ListView.builder(
                          itemCount: snapshot.data!.docs.length,
                          itemBuilder: (context, index) {
                            DocumentSnapshot document =
                                snapshot.data!.docs[index];
                            return buildAddressList(document, index);
                          },
                        );
                      },
                    ),
                  ),
                  Divider(),
                  Center(
                    child: Text("Add Address",
                        style: appStyle(16, kDark, FontWeight.bold)),
                  ),
                  SizedBox(height: 20.h),
                  Text("Address Type",
                      style: appStyle(16, kDark, FontWeight.w500)),
                  DropdownButton<String>(
                    value: selectedAddressType,
                    items: ['Home', 'Office', 'Other']
                        .map((type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedAddressType = value!;
                      });
                    },
                  ),
                  SizedBox(height: 5.h),
                  Text("Address", style: appStyle(16, kDark, FontWeight.w500)),
                  _addressController.text.isEmpty
                      ? SizedBox()
                      : TextField(
                          controller: _addressController,
                          decoration: const InputDecoration(
                            hintText: "Enter your address",
                            border: OutlineInputBorder(),
                          ),
                        ),
                  SizedBox(height: 16.h),
                  CustomButton(
                      color: kSecondary.withOpacity(0.8),
                      text: "Select Address From Map",
                      onPress: selectAddressFromMap),
                  const Spacer(),
                  CustomButton(
                    color: kPrimary,
                    text: "Save Address",
                    onPress: () async {
                      // Assuming you have already selected an address and stored it in a variable called `selectedAddress`

                      if (_addressController.text.isNotEmpty) {
                        saveAddress();
                      } else {
                        log("something went wrong");
                        // Handle case where no address is selected, if needed
                      }
                    },
                  )
                ],
              ),
            ),
    );
  }
}

Future<String> getAddressFromLatLng(double lat, double lng) async {
  String apiKey = googleApiKey;
  final String url =
      'https://maps.googleapis.com/maps/api/geocode/json?latlng=$lat,$lng&key=$apiKey';

  final response = await http.get(Uri.parse(url));
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    if (data['results'].isNotEmpty) {
      return data['results'][0]['formatted_address'];
    }
  }
  return 'Address not found';
}
