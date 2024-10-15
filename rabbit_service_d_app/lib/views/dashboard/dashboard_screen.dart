import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import '../../services/collection_references.dart';
import '../../widgets/dashboard_search_text_field.dart';
import 'dart:developer';
import '../address/address_management_screen.dart';
import '../profile/profile_screen.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key, required this.setTab});

  final Function? setTab;

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  @override
  Widget build(BuildContext context) {
    return GetBuilder<DashboardController>(
      init: DashboardController(),
      builder: (controller) {
        if (controller.isLoading) {
          return Center(child: CircularProgressIndicator());
        } else {
          return controller.appbarTitle.isEmpty
              ? Center(child: CircularProgressIndicator())
              : Scaffold(
                  // appBar: buildCustomAppBar(context),
                  appBar: AppBar(
                    backgroundColor: kWhite,
                    elevation: 1,
                    centerTitle: true,
                    title: Image.asset(
                      'assets/h_n_logo-removebg.png', // Replace with your logo asset path
                      height: 50.h, // Adjust the height as needed
                    ),
                    actions: [
                      GestureDetector(
                        onTap: () => Get.to(() => const ProfileScreen(),
                            transition: Transition.cupertino,
                            duration: const Duration(milliseconds: 900)),
                        child: CircleAvatar(
                          radius: 19.r,
                          backgroundColor: kPrimary,
                          child: StreamBuilder<DocumentSnapshot>(
                            stream: FirebaseFirestore.instance
                                .collection('Users')
                                .doc(currentUId)
                                .snapshots(),
                            builder: (BuildContext context,
                                AsyncSnapshot<DocumentSnapshot> snapshot) {
                              if (snapshot.hasError) {
                                return Text('Error: ${snapshot.error}');
                              }

                              if (snapshot.connectionState ==
                                  ConnectionState.waiting) {
                                // return Container();
                                return const CircularProgressIndicator();
                              }

                              final data =
                                  snapshot.data!.data() as Map<String, dynamic>;
                              controller.userPhoto =
                                  data['profilePicture'] ?? '';
                              controller.userName = data['userName'] ?? '';
                              controller.phoneNumber =
                                  data['phoneNumber'] ?? '';

                              if (controller.userPhoto.isEmpty) {
                                return Text(
                                  controller.userName.isNotEmpty
                                      ? controller.userName[0]
                                      : '',
                                  style: appStyle(20, kWhite, FontWeight.w500),
                                );
                              } else {
                                return ClipOval(
                                  child: Image.network(
                                    controller.userPhoto,
                                    width: 38.r,
                                    // Set appropriate size for the image
                                    height: 35.r,
                                    fit: BoxFit.cover,
                                  ),
                                );
                              }
                            },
                          ),
                        ),
                      ),
                      SizedBox(width: 20.w),
                    ],
                  ),

                  body: SingleChildScrollView(
                    child: Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // SizedBox(height: 20.h),

                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 8.w, vertical: 15.h),
                            decoration: BoxDecoration(
                                color: kSecondary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12.r)),
                            child: Column(
                              children: [
                                StreamBuilder<QuerySnapshot>(
                                  stream: FirebaseFirestore.instance
                                      .collection('Users')
                                      .doc(currentUId)
                                      .collection('Vehicles')
                                      .snapshots(),
                                  builder: (BuildContext context,
                                      AsyncSnapshot<QuerySnapshot> snapshot) {
                                    if (snapshot.hasError) {
                                      return Text('Error: ${snapshot.error}');
                                    }

                                    if (snapshot.connectionState ==
                                        ConnectionState.waiting) {
                                      return Container();

                                      // return Center(
                                      //     child: CircularProgressIndicator());
                                    }

                                    // Process the data and build the UI
                                    List vehicleNames =
                                        snapshot.data!.docs.map((doc) {
                                      final data =
                                          doc.data() as Map<String, dynamic>;
                                      return data['vehicleNumber'] ?? '';
                                    }).toList();

                                    // Update your controller or state here
                                    controller.allVehicleAndCompanyName =
                                        vehicleNames;
                                    controller
                                            .filterSelectedCompanyAndvehicleName =
                                        List.from(vehicleNames);

                                    return Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        GestureDetector(
                                          onTap: () {
                                            controller
                                                .showSelectedVehicleAndCompanyOptions(
                                                    context);
                                          },
                                          child: SizedBox(
                                            width: 270.w,
                                            child: AbsorbPointer(
                                              child: DashBoardSearchTextField(
                                                label: "Select your Vehicle",
                                                controller: controller
                                                    .selectedCompanyAndVehcileNameController,
                                                enable: true,
                                              ),
                                            ),
                                          ),
                                        ),
                                        controller.role == "Owner"
                                            ? GestureDetector(
                                                onTap: () async {
                                                  var result =
                                                      await Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (context) =>
                                                          AddVehicleScreen(),
                                                    ),
                                                  );
                                                  if (result != null) {
                                                    // Handle the result
                                                    String? company =
                                                        result['company'];
                                                    String? vehicleNumber =
                                                        result['vehicleNumber'];
                                                    log("Company: $company, Vehicle Number: $vehicleNumber");

                                                    setState(
                                                      () {
                                                        controller
                                                                .selectedCompanyAndVehcileName =
                                                            company;
                                                      },
                                                    );
                                                  }
                                                },
                                                child: CircleAvatar(
                                                  backgroundColor: kPrimary,
                                                  child: Icon(
                                                    Icons.add,
                                                    color: kWhite,
                                                    size: 24.r,
                                                  ),
                                                ),
                                              )
                                            : SizedBox()
                                      ],
                                    );
                                  },
                                ),
                                SizedBox(height: 20.h),
                                GestureDetector(
                                  onTap: () {
                                    showServiceAndNetworkOptions(
                                        context, controller);
                                  },
                                  child: AbsorbPointer(
                                    child: DashBoardSearchTextField(
                                      label: "Select Service",
                                      // hint: "Service or Network",
                                      controller: controller
                                          .serviceAndNetworkController,
                                      enable: true,
                                    ),
                                  ),
                                ),
                                SizedBox(height: 20.h),
                                StreamBuilder<QuerySnapshot>(
                                  stream: FirebaseFirestore.instance
                                      .collection('Users')
                                      .doc(currentUId)
                                      .collection('Addresses')
                                      .where("isAddressSelected",
                                          isEqualTo: true)
                                      .snapshots(),
                                  builder: (BuildContext context,
                                      AsyncSnapshot<QuerySnapshot> snapshot) {
                                    if (snapshot.hasError) {
                                      return Text('Error: ${snapshot.error}');
                                    }

                                    if (snapshot.connectionState ==
                                        ConnectionState.waiting) {
                                      return Center(
                                          child: CircularProgressIndicator());
                                    }

                                    if (!snapshot.hasData ||
                                        snapshot.data!.docs.isEmpty) {
                                      return GestureDetector(
                                        onTap: () async {
                                          var selectedAddress =
                                              await Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  AddressManagementScreen(
                                                userLat: controller.userLat,
                                                userLng: controller.userLong,
                                              ),
                                            ),
                                          );
                                          if (selectedAddress != null) {
                                            setState(() {
                                              controller.appbarTitle =
                                                  selectedAddress["address"];
                                              controller.userLat =
                                                  selectedAddress["Lat"];
                                              controller.userLong =
                                                  selectedAddress["Lng"];
                                              controller
                                                      .locationController.text =
                                                  selectedAddress[
                                                      "address"]; // Set the selected address to the text field
                                              log("Selected location: " +
                                                  selectedAddress["address"] +
                                                  " Lat: " +
                                                  selectedAddress["Lat"]
                                                      .toString() +
                                                  " Lng: " +
                                                  selectedAddress["Lng"]
                                                      .toString());
                                            });
                                          }
                                        },
                                        child: AbsorbPointer(
                                          child: DashBoardSearchTextField(
                                            label: "Select your Location",
                                            controller:
                                                controller.locationController,
                                            enable: false,
                                          ),
                                        ),
                                      );
                                    }

                                    // Get the selected address and location from the snapshot
                                    var addressData = snapshot.data!.docs.first
                                        .data() as Map<String, dynamic>;

                                    // Extract the location data
                                    var locationData = addressData["location"]
                                        as Map<String, dynamic>?;

                                    // Extract latitude and longitude from location map
                                    double latitude =
                                        locationData?["latitude"] ?? 0.0;
                                    double longitude =
                                        locationData?["longitude"] ?? 0.0;

                                    // Assign values to the controller
                                    controller.locationController.text =
                                        addressData["address"] ??
                                            "Select your Location";
                                    controller.userLat = latitude;
                                    controller.userLong = longitude;

                                    return GestureDetector(
                                      onTap: () async {
                                        var selectedAddress =
                                            await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                AddressManagementScreen(
                                              userLat: controller.userLat,
                                              userLng: controller.userLong,
                                            ),
                                          ),
                                        );
                                        if (selectedAddress != null) {
                                          setState(() {
                                            controller.appbarTitle =
                                                selectedAddress["address"];
                                            controller.userLat =
                                                selectedAddress["Lat"];
                                            controller.userLong =
                                                selectedAddress["Lng"];
                                            controller.locationController.text =
                                                selectedAddress[
                                                    "address"]; // Set the selected address to the text field
                                            log("Selected location: " +
                                                selectedAddress["address"] +
                                                " Lat: " +
                                                selectedAddress["Lat"]
                                                    .toString() +
                                                " Lng: " +
                                                selectedAddress["Lng"]
                                                    .toString());
                                          });
                                        }
                                      },
                                      child: AbsorbPointer(
                                        child: DashBoardSearchTextField(
                                          label: "Select your Location",
                                          controller:
                                              controller.locationController,
                                          enable: false,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                SizedBox(height: 20.h),
                                controller.imageUploadEnabled
                                    ? GestureDetector(
                                        onTap: () => controller
                                            .showImageSourceDialog(context),
                                        child: Container(
                                          height: 40.h,
                                          width: double.maxFinite,
                                          alignment: Alignment.centerLeft,
                                          decoration: BoxDecoration(
                                              border: Border.all(
                                                  color: kSecondary
                                                      .withOpacity(0.1)),
                                              color: kWhite,
                                              borderRadius:
                                                  BorderRadius.circular(12.r)),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text("Upload Images"),
                                              SizedBox(width: 20.w),
                                              Icon(Icons.upload_file,
                                                  color: kDark),
                                            ],
                                          ),
                                        ),
                                      )
                                    : SizedBox(),
                                controller.imageUploadEnabled
                                    ? SizedBox(height: 20.h)
                                    : SizedBox(),
                                controller.images.isNotEmpty
                                    ? Wrap(
                                        spacing: 10.w,
                                        runSpacing: 10.h,
                                        children:
                                            controller.images.map((image) {
                                          return Container(
                                            width: 80.w,
                                            height: 80.h,
                                            decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(12.r),
                                              image: DecorationImage(
                                                image: FileImage(image),
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                          );
                                        }).toList(),
                                      )
                                    : Container(),
                                SizedBox(height: 20.h),
                                controller.isFindMechanicEnabled
                                    ? CustomButton(
                                        text: "Find Mechanic",
                                        onPress: () async {
                                          if (controller.images.isEmpty &&
                                              controller.isImageMandatory ==
                                                  true) {
                                            showToastMessage(
                                                "Image Upload",
                                                "Upload at least one Image",
                                                kRed);
                                          } else {
                                            controller
                                                .findMechanic(
                                              controller
                                                  .locationController.text,
                                              controller.userPhoto,
                                              controller.userName,
                                              controller.phoneNumber,
                                              controller.userLat,
                                              controller.userLong,
                                              controller
                                                  .serviceAndNetworkController
                                                  .text
                                                  .toString(),
                                              controller
                                                  .companyNameController.text
                                                  .toString(),
                                              controller
                                                  .selectedCompanyAndVehcileNameController
                                                  .text
                                                  .toString(),
                                              controller.isImageMandatory,
                                              controller.images,
                                            )
                                                .then((value) {
                                              widget.setTab?.call(1);
                                            });
                                            log("Job Created");
                                          }
                                        },
                                        color: kPrimary,
                                      )
                                    : CustomButton(
                                        text: "Find Mechanic",
                                        onPress: null,
                                        color: kGray)
                              ],
                            ),
                          ),

                          SizedBox(height: 12.h),
                          // Quick Search Section
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Our Services',
                                style: kIsWeb
                                    ? TextStyle(color: kDark)
                                    : appStyle(22, kDark, FontWeight.w500)),
                          ),
                          SizedBox(height: 10.h),
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 8.w, vertical: 15.h),
                            decoration: BoxDecoration(
                                color: kSecondary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12.r)),
                            child: GridView.count(
                              shrinkWrap: true,
                              physics: NeverScrollableScrollPhysics(),
                              crossAxisCount: 3,
                              crossAxisSpacing: 1,
                              mainAxisSpacing: 1,
                              childAspectRatio: 6 / 5,
                              children: _buildQuickSearchItems(),
                            ),
                          ),

                          SizedBox(height: 20.h),
                        ],
                      ),
                    ),
                  ),
                );
        }
      },
    );
  }

  List<Widget> _buildQuickSearchItems() {
    List<Map<String, dynamic>> items = [
      {"title": "Tires", "icon": "assets/tire.png"},
      {"title": "Air Leak", "icon": "assets/air_leak.png"},
      {"title": "Battery", "icon": "assets/battery_truck.png"},
      {"title": "Engine Sign", "icon": "assets/engine_2.png"},
      {"title": "Electrical", "icon": "assets/electrical.png"},
      {"title": "Towing", "icon": "assets/towing_truck.png"},
    ];

    return items.map((item) {
      return GestureDetector(
        onTap: () {
          // Get.to(
          //     () => SearchResultsScreen(searchText: item["title"].toString()));
          // // Your quick search logic here
        },
        child: Container(
          width: kIsWeb ? 0 : 100,
          // Define width for the rectangle
          height: kIsWeb ? 0 : 50,
          // Define height for the rectangle
          margin: EdgeInsets.only(left: 8, right: 8, bottom: 8, top: 8),
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kSecondary,
            borderRadius: BorderRadius.circular(8), // Optional: rounded corners
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: kWhite, borderRadius: BorderRadius.circular(12.r)),
                child: Image.asset(
                  item["icon"],
                  color: Colors.black,
                  height: 30.h, // Image height
                  width: 30.w, // Image width
                ),
              ),
              // Space between image and text
              Flexible(
                child: Text(
                  item["title"],
                  style: kIsWeb
                      ? TextStyle(color: kWhite)
                      : TextStyle(color: Colors.white, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  void showServiceAndNetworkOptions(
      BuildContext context, DashboardController serviceController) {
    // Initialize filtered options
    serviceController.filteredServiceAndNetworkOptions =
        List<Map<String, dynamic>>.from(
            serviceController.allServiceAndNetworkOptions);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 1.0,
          builder: (BuildContext context, ScrollController scrollController) {
            return GetBuilder<DashboardController>(
              builder: (controller) {
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(20.0),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Drag handle
                      Container(
                        margin: EdgeInsets.symmetric(vertical: 10),
                        width: 60,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      // Search bar
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: "Search Service or Network",
                            prefixIcon: Icon(Icons.search),
                          ),
                          onChanged: (value) {
                            controller.filterServiceAndNetwork(value);
                          },
                          autofocus: true,
                        ),
                      ),
                      // List of filtered services
                      Expanded(
                        child: controller
                                .filteredServiceAndNetworkOptions.isNotEmpty
                            ? ListView.builder(
                                padding: EdgeInsets.zero,
                                controller: scrollController,
                                itemCount: controller
                                    .filteredServiceAndNetworkOptions.length,
                                itemBuilder: (context, index) {
                                  final item = controller
                                      .filteredServiceAndNetworkOptions[index];
                                  String title = item['title'];
                                  int imageType = item['image_type'];
                                  int priceType = item['price_type'];

                                  return GestureDetector(
                                    onTap: () {
                                      log("Selected Service Name $title and imageType is ${imageType.toString()} and  priceType is ${priceType.toString()}");
                                      controller.serviceAndNetworkController
                                          .text = title;
                                      controller.isServiceSelected =
                                          true; // Service selected
                                      controller.checkIfAllSelected();
                                      setState(() {});

                                      if (imageType == 0) {
                                        controller.imageUploadEnabled = true;
                                        controller.isImageMandatory = false;
                                        setState(() {});
                                      } else if (imageType == 1) {
                                        controller.imageUploadEnabled = true;
                                        controller.isImageMandatory = true;
                                        setState(() {});
                                        ;
                                      } else {
                                        controller.imageUploadEnabled = false;
                                        controller.isImageMandatory = false;
                                        setState(() {});
                                        ;
                                      }

                                      if (priceType == 1) {
                                        controller.fixPriceEnabled = true;
                                        setState(() {});
                                      } else {
                                        controller.fixPriceEnabled = false;
                                        setState(() {});
                                        ;
                                      }
                                      Navigator.pop(context);
                                    },
                                    child: Container(
                                      padding: EdgeInsets.all(2),
                                      margin: EdgeInsets.all(1),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                left: 14.0),
                                            child: Text(
                                              title,
                                              style: TextStyle(
                                                fontSize: 15,
                                                color: Colors.black,
                                                fontWeight: FontWeight.normal,
                                              ),
                                            ),
                                          ),
                                          Divider(
                                              color:
                                                  Colors.grey.withOpacity(0.1)),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              )
                            : Center(
                                child: Text(
                                  "No services found",
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}
