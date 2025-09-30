import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_via_excel.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'dart:developer';
import '../../../../widgets/dashboard_search_text_field.dart';
import '../../address/address_management_screen.dart';

class FindMechanic extends StatefulWidget {
  const FindMechanic(
      {super.key,
      required this.controller,
      required this.setTab,
      required this.currentUId});

  final DashboardController controller;
  final Function? setTab;
  final String currentUId;

  @override
  State<FindMechanic> createState() => _FindMechanicState();
}

class _FindMechanicState extends State<FindMechanic> {
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  bool isAddressSelected = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 7.h),
      decoration: BoxDecoration(
          color: kSecondary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12.r)),
      child: Column(
        children: [
//================================ Select Your Vehicles ==========================================
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('Users')
                .doc(widget.currentUId)
                .collection('Vehicles')
                .where("active", isEqualTo: true)
                .snapshots(),
            builder:
                (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
              if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Container();
              }

              // Process the data and build the UI
              List<String> vehicleNames = snapshot.data!.docs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                String vehicleNumber = data['vehicleNumber'] ?? '';
                String companyName = data['companyName'] ?? '';

                return "$vehicleNumber ($companyName)";
              }).toList();

              // Update your controller or state here
              widget.controller.allVehicleAndCompanyName = vehicleNames;
              widget.controller.filterSelectedCompanyAndvehicleName =
                  List.from(vehicleNames);

              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () {
                      widget.controller
                          .showSelectedVehicleAndCompanyOptions(context);
                    },
                    child: SizedBox(
                      width: 270.w,
                      child: AbsorbPointer(
                        child: DashBoardSearchTextField(
                          label: "Select your Vehicle",
                          controller: widget.controller
                              .selectedCompanyAndVehcileNameController,
                          enable: true,
                        ),
                      ),
                    ),
                  ),
                  widget.controller.role == "Owner" ||
                          widget.controller.role == "SubOwner"
                      ? GestureDetector(
                          onTap: () {
                            if (widget.controller.isAnonymous == true ||
                                widget.controller.isProfileComplete == false) {
                              showToastMessage(
                                  "Profile Incomplete",
                                  "Please Create an account to add vehicle",
                                  kRed);
                            } else {
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    title: Text("Choose an option"),
                                    content: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        ListTile(
                                          leading: Icon(Icons.directions_car),
                                          title: Text("Add Vehicle"),
                                          onTap: () async {
                                            Navigator.pop(
                                                context); // Close the dialog
                                            var result = await Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    AddVehicleScreen(
                                                        currentUId:
                                                            widget.currentUId),
                                              ),
                                            );
                                            if (result != null) {
                                              String? company =
                                                  result['company'];
                                              String? vehicleNumber =
                                                  result['vehicleNumber'];
                                              log("Company: $company, Vehicle Number: $vehicleNumber");

                                              setState(() {
                                                widget.controller
                                                        .selectedCompanyAndVehcileName =
                                                    company;
                                              });
                                            }
                                          },
                                        ),
                                        ListTile(
                                          leading: Icon(Icons.upload_file),
                                          title: Text("Import Vehicle"),
                                          onTap: () {
                                            Navigator.pop(
                                                context); // Close the dialog
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    AddVehicleViaExcelScreen(
                                                        currentUId:
                                                            widget.currentUId),
                                              ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  );
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

          SizedBox(height: 10.h),
//================================ Select Your Service ==========================================
          GestureDetector(
            onTap: () {
              showServiceAndNetworkOptions(context, widget.controller);
            },
            child: AbsorbPointer(
              child: DashBoardSearchTextField(
                label: "Select Service",
                controller: widget.controller.serviceAndNetworkController,
                enable: true,
              ),
            ),
          ),

          SizedBox(height: 10.h),
//================================ Select Your Address ================
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('Users')
                .doc(widget.currentUId)
                .collection('Addresses')
                .where("isAddressSelected", isEqualTo: true)
                .snapshots(),
            builder:
                (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
              if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(child: CircularProgressIndicator());
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                // No address selected case
                isAddressSelected = false;
                return GestureDetector(
                  onTap: () async {
                    var selectedAddress = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => AddressManagementScreen(
                          userLat: widget.controller.userLat,
                          userLng: widget.controller.userLong,
                          currentUId: widget.currentUId,
                        ),
                      ),
                    );
                    if (selectedAddress != null) {
                      setState(() {
                        widget.controller.appbarTitle =
                            selectedAddress["address"];
                        widget.controller.userLat = selectedAddress["Lat"];
                        widget.controller.userLong = selectedAddress["Lng"];
                        widget.controller.locationController.text =
                            selectedAddress["address"];
                        isAddressSelected = true;
                        log("Selected location: " +
                            selectedAddress["address"] +
                            " Lat: " +
                            selectedAddress["Lat"].toString() +
                            " Lng: " +
                            selectedAddress["Lng"].toString());
                      });
                    }
                  },
                  child: AbsorbPointer(
                    child: DashBoardSearchTextField(
                      label: "Select your Location",
                      controller: widget.controller.locationController,
                      enable: false,
                    ),
                  ),
                );
              }

              // Address exists case
              var addressData =
                  snapshot.data!.docs.first.data() as Map<String, dynamic>;
              var locationData =
                  addressData["location"] as Map<String, dynamic>?;

              double latitude = locationData?["latitude"] ?? 0.0;
              double longitude = locationData?["longitude"] ?? 0.0;

              widget.controller.locationController.text =
                  addressData["address"] ?? "Select your Location";
              widget.controller.userLat = latitude;
              widget.controller.userLong = longitude;

              // Set address selected to true when we have an address
              if (!isAddressSelected) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  setState(() {
                    isAddressSelected = true;
                  });
                });
              }

              return GestureDetector(
                onTap: () async {
                  var selectedAddress = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AddressManagementScreen(
                        userLat: widget.controller.userLat,
                        userLng: widget.controller.userLong,
                        currentUId: widget.currentUId,
                      ),
                    ),
                  );
                  if (selectedAddress != null) {
                    setState(() {
                      widget.controller.appbarTitle =
                          selectedAddress["address"];
                      widget.controller.userLat = selectedAddress["Lat"];
                      widget.controller.userLong = selectedAddress["Lng"];
                      widget.controller.locationController.text =
                          selectedAddress["address"];
                      isAddressSelected = true;
                      log("Selected location: " +
                          selectedAddress["address"] +
                          " Lat: " +
                          selectedAddress["Lat"].toString() +
                          " Lng: " +
                          selectedAddress["Lng"].toString());
                    });
                  }
                },
                child: AbsorbPointer(
                  child: DashBoardSearchTextField(
                    label: "Select your Location",
                    controller: widget.controller.locationController,
                    enable: false,
                  ),
                ),
              );
            },
          ),

          SizedBox(height: 10.h),
          DashBoardSearchTextField(
              label: "Enter Description",
              controller: widget.controller.descriptionController,
              enable: true),
          SizedBox(height: 5.h),
          widget.controller.imageUploadEnabled
              ? GestureDetector(
                  onTap: () => widget.controller.showImageSourceDialog(context),
                  child: Container(
                    height: 40.h,
                    width: double.maxFinite,
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(
                        border: Border.all(color: kSecondary.withOpacity(0.1)),
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
                )
              : SizedBox(),
          widget.controller.imageUploadEnabled
              ? SizedBox(height: 20.h)
              : SizedBox(),
          widget.controller.images.isNotEmpty
              ? Wrap(
                  spacing: 10.w,
                  runSpacing: 10.h,
                  children: widget.controller.images.map((image) {
                    return Container(
                      width: 80.w,
                      height: 80.h,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12.r),
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

          widget.controller.isFindMechanicEnabled
              ? CustomButton(
                  text: "Find Mechanic",
                  onPress: () async {
                    if (!isAddressSelected) {
                      showToastMessage("Location Required",
                          "Please select your address first", kRed);
                      return;
                    }

                    if (widget.controller.images.isEmpty &&
                        widget.controller.isImageMandatory == true) {
                      showToastMessage(
                          "Image Upload", "Upload at least one Image", kRed);
                    } else {
                      widget.controller
                          .findMechanic(
                        widget.currentUId,
                        widget.controller.locationController.text,
                        widget.controller.userPhoto,
                        widget.controller.userName,
                        widget.controller.phoneNumber,
                        widget.controller.userLat,
                        widget.controller.userLong,
                        widget.controller.serviceAndNetworkController.text
                            .toString(),
                        widget.controller.companyNameController.text.toString(),
                        widget.controller
                            .selectedCompanyAndVehcileNameController.text
                            .toString(),
                        widget.controller.isImageMandatory,
                        widget.controller.images,
                      )
                          .then((value) {
                        widget.setTab?.call(1);
                      });
                      log("Job Created");
                    }
                  },
                  color: isAddressSelected ? kPrimary : kGray,
                )
              : CustomButton(
                  text: "Find Mechanic", onPress: null, color: kGray),
        ],
      ),
    );
  }

  //=========================== Show Services options==================
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

                                  return InkWell(
                                    onTap: () {
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
                                      log("Selected Service Name $title and imageType is ${imageType.toString()} and  priceType is ${priceType.toString()}");
                                    },
                                    child: Container(
                                      padding: EdgeInsets.only(
                                        left: 14.w,
                                        top: 5.h,
                                        right: 5.w,
                                        bottom: 5.w,
                                      ),
                                      // margin: EdgeInsets.all(3),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            title,
                                            style: TextStyle(
                                              fontSize: 15,
                                              color: Colors.black,
                                              fontWeight: FontWeight.normal,
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
