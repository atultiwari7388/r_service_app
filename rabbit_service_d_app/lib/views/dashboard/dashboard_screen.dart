import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import '../../services/collection_references.dart';
import '../../widgets/dashboard_search_text_field.dart';
import 'dart:developer';
import '../address/address_management_screen.dart';
import '../profile/profile_screen.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  // final DashboardController dashboardController = Get.find();

  @override
  Widget build(BuildContext context) {
    return GetBuilder<DashboardController>(
      init: DashboardController(),
      builder: (controller) {
        if (controller.isLoading) {
          return Center(child: CircularProgressIndicator());
        } else {
          return Scaffold(
            // appBar: buildCustomAppBar(context),
            appBar: AppBar(
              backgroundColor: kLightWhite,
              elevation: 0,
              centerTitle: true,
              title: Image.asset(
                'assets/appbar_logo.png', // Replace with your logo asset path
                height: 60.h, // Adjust the height as needed
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
                          return const CircularProgressIndicator();
                        }

                        final data =
                            snapshot.data!.data() as Map<String, dynamic>;
                        controller.userPhoto = data['profilePicture'] ?? '';
                        controller.userName = data['userName'] ?? '';
                        controller.phoneNumber = data['phoneNumber'] ?? '';

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
                padding: EdgeInsets.symmetric(horizontal: 15.w, vertical: 5.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 20.h),

                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
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
                              }

                              // Process the data and build the UI
                              List vehicleNames =
                                  snapshot.data!.docs.map((doc) {
                                final data = doc.data() as Map<String, dynamic>;
                                return data['vehicleNumber'] ?? '';
                              }).toList();

                              // Update your controller or state here
                              controller.allVehicleAndCompanyName =
                                  vehicleNames;
                              controller.filterSelectedCompanyAndvehicleName =
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
                                  GestureDetector(
                                    onTap: () async {
                                      var result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              AddVehicleScreen(),
                                        ),
                                      );
                                      if (result != null) {
                                        // Handle the result
                                        String? company = result['company'];
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
                                  ),
                                ],
                              );
                            },
                          ),
                          SizedBox(height: 20.h),
                          GestureDetector(
                            onTap: () {
                              controller.showServiceAndNetworkOptions(context);
                            },
                            child: AbsorbPointer(
                              child: DashBoardSearchTextField(
                                label: "Select Service",
                                // hint: "Service or Network",
                                controller:
                                    controller.serviceAndNetworkController,
                                enable: true,
                              ),
                            ),
                          ),
                          SizedBox(height: 20.h),
                          GestureDetector(
                            onTap: () async {
                              var selectedAddress = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AddressManagementScreen(
                                    userLat: controller.userLat,
                                    userLng: controller.userLong,
                                  ),
                                ),
                              );
                              if (selectedAddress != null) {
                                setState(() {
                                  controller.appbarTitle =
                                      selectedAddress["address"];
                                  controller.locationController.text =
                                      selectedAddress[
                                          "address"]; // Set the selected address to the text field
                                  log("Selected location: " +
                                      selectedAddress["address"]);
                                });
                              }
                            },
                            child: DashBoardSearchTextField(
                              label: "Select your Location",
                              // label: "Select your Location",
                              controller: controller.locationController,
                              enable: false,
                            ),
                          ),
                          SizedBox(height: 20.h),
                          GestureDetector(
                            onTap: () =>
                                controller.showImageSourceDialog(context),
                            child: Container(
                              height: 40.h,
                              width: double.maxFinite,
                              alignment: Alignment.centerLeft,
                              decoration: BoxDecoration(
                                  border: Border.all(
                                      color: kSecondary.withOpacity(0.1)),
                                  color: kWhite,
                                  borderRadius: BorderRadius.circular(12.r)),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text("Upload Images"),
                                  SizedBox(width: 20.w),
                                  Icon(Icons.upload_file, color: kDark),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 20.h),
                          controller.images.isNotEmpty
                              ? Wrap(
                                  spacing: 10.w,
                                  runSpacing: 10.h,
                                  children: controller.images.map((image) {
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
                          CustomButton(
                            text: "Find Mechanic",
                            onPress: () async {
                              controller.findMechanic(
                                controller.locationController.text,
                                controller.userPhoto,
                                controller.userName,
                                controller.phoneNumber,
                                controller.userLat,
                                controller.userLong,
                                controller.serviceAndNetworkController.text
                                    .toString(),
                                controller.companyNameController.text
                                    .toString(),
                                controller
                                    .selectedCompanyAndVehcileNameController
                                    .text
                                    .toString(),
                                controller.imageSelected,
                                controller.images,
                              );
                              // dashboardController.switchToMyJobsScreen();
                            },
                            color: kPrimary,
                          ),
                        ],
                      ),
                    ),

                    SizedBox(height: 12.h),
                    // Quick Search Section
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Our Services',
                          style: appStyle(22, kDark, FontWeight.w500)),
                    ),
                    SizedBox(height: 10.h),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
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

                    SizedBox(height: 100.h),
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
          width: 100,
          // Define width for the rectangle
          height: 50,
          // Define height for the rectangle
          margin: EdgeInsets.only(left: 8, right: 8, bottom: 8, top: 8),
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kPrimary,
            borderRadius: BorderRadius.circular(8), // Optional: rounded corners
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                item["icon"],
                color: Colors.white,
                height: 30.h, // Image height
                width: 30.w, // Image width
              ),
              // Space between image and text
              Flexible(
                child: Text(
                  item["title"],
                  style: TextStyle(color: Colors.white, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }
}