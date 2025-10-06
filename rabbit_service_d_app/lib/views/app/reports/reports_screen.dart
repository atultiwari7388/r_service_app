import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:regal_service_d_app/controllers/reports_controller.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/generate_pdf.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/auth/registration_screen.dart';
import 'package:regal_service_d_app/views/app/cloudNotiMsg/cloud_noti_msg.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/widgets/add_vehicle_via_excel.dart';
import 'package:regal_service_d_app/views/app/profile/profile_screen.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/miles_details_screen.dart';
import 'package:regal_service_d_app/views/app/reports/widgets/records_details_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';
import 'package:multi_select_flutter/multi_select_flutter.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ReportsController>(
        init: ReportsController(),
        builder: (reController) {
          final filteredRecords = reController.getFilteredRecords();
          return Scaffold(
            appBar: AppBar(
              backgroundColor: kWhite,
              elevation: 1,
              centerTitle: true,
              title: Image.asset(
                'assets/new_rabbit_logo.png',
                height: 50.h,
              ),
              actions: [
                if (reController.currentUser != null)
                  buildNotificationBadge(reController.effectiveUserId),
                if (reController.currentUser != null) SizedBox(width: 10.w),
                reController.currentUser == null
                    ? CircleAvatar(
                        radius: 19.r,
                        backgroundColor: kPrimary,
                        child: Icon(Icons.person, color: kWhite),
                      )
                    : buildProfileAvatar(reController.currentUId),
                SizedBox(width: 20.w),
              ],
            ),
            body: reController.isView == true
                ? RefreshIndicator(
                    onRefresh: () async {
                      // _refreshPage(reController);
                      reController.refreshPage(mounted, context);
                    },
                    child: SingleChildScrollView(
                      child: Padding(
                        padding: EdgeInsets.all(10.0.w),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Search Record Add Miles Button Section

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                // Removed PopupMenuButton
                                buildCustomRowButton(
                                    Icons.search, "Search", kPrimary, () {
                                  if (reController.currentUser == null) {
                                    showLoginPrompt();
                                    return;
                                  }

                                  setState(() {
                                    reController.showSearchFilter =
                                        !reController.showSearchFilter;
                                    reController.showAddRecords = false;
                                    reController.showAddMiles = false;
                                    reController.showVehicleSearch = true;
                                  });
                                }),
                                buildCustomRowButton(
                                    Icons.add, "Records", kSecondary, () {
                                  if (reController.currentUser == null) {
                                    showLoginPrompt();
                                    return;
                                  }
                                  //firstly clear the filters if any are applied
                                  reController.resetFilters();

                                  if (reController.isAdd == true) {
                                    setState(() {
                                      reController.showAddRecords =
                                          !reController.showAddRecords;
                                      reController.showSearchFilter = false;
                                      reController.showAddMiles = false;
                                    });
                                  } else {
                                    showToastMessage(
                                        "Alert!",
                                        "Sorry you don't have access",
                                        kPrimary);
                                  }
                                }),
                                buildCustomRowButton(
                                    Icons.add, "Miles", kPrimary, () {
                                  if (reController.currentUser == null) {
                                    showLoginPrompt();
                                    return;
                                  }

                                  if (reController.isAdd == true ||
                                      reController.isView == true) {
                                    setState(() {
                                      reController.showAddMiles =
                                          !reController.showAddMiles;
                                      reController.showSearchFilter = false;
                                      reController.showAddRecords = false;
                                    });
                                  } else {
                                    showToastMessage(
                                        "Alert!",
                                        "Sorry you don't have access",
                                        kPrimary);
                                  }
                                }),
                              ],
                            ),

                            // Search & Filter Section
                            if (reController.showSearchFilter) ...[
                              SizedBox(height: 10.h),
                              buildSearchFilterMethod(context, reController),
                            ],

                            if (reController.showAddRecords) ...[
                              SizedBox(height: 10.h),
                              buildAddRecordMethod(reController, context),
                            ],

                            if (reController.showAddMiles) ...[
                              SizedBox(height: 10.h),
                              buildAddMilesMethod(reController, context),
                            ],

                            // Invoice Summary Box
                            (reController.role == "Owner" ||
                                    reController.role == "SubOwner")
                                ? Card(
                                    elevation: 4,
                                    margin: EdgeInsets.symmetric(vertical: 8),
                                    child: Padding(
                                      padding: EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                'Invoice Summary',
                                                style: TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                  color: kDark,
                                                ),
                                              ),
                                              Row(
                                                children: [
                                                  IconButton(
                                                    icon: Icon(Icons.filter_alt,
                                                        color: kPrimary),
                                                    onPressed: () {
                                                      setState(() {
                                                        reController
                                                                .showVehicleFilter =
                                                            !reController
                                                                .showVehicleFilter;
                                                      });
                                                    },
                                                  ),
                                                  IconButton(
                                                    icon: Icon(Icons.date_range,
                                                        color: kPrimary),
                                                    onPressed: () async {
                                                      final DateTimeRange?
                                                          picked =
                                                          await showDateRangePicker(
                                                        context: context,
                                                        firstDate:
                                                            DateTime(2000),
                                                        lastDate:
                                                            DateTime(2100),
                                                        initialDateRange: reController
                                                                        .summaryStartDate !=
                                                                    null &&
                                                                reController
                                                                        .summaryEndDate !=
                                                                    null
                                                            ? DateTimeRange(
                                                                start: reController
                                                                    .summaryStartDate!,
                                                                end: reController
                                                                    .summaryEndDate!)
                                                            : null,
                                                      );
                                                      if (picked != null) {
                                                        setState(() {
                                                          reController
                                                                  .summaryStartDate =
                                                              picked.start;
                                                          reController
                                                                  .summaryEndDate =
                                                              picked.end;
                                                        });
                                                      }
                                                    },
                                                  ),
                                                  if (reController
                                                              .summaryStartDate !=
                                                          null ||
                                                      reController
                                                              .summaryEndDate !=
                                                          null)
                                                    IconButton(
                                                      icon: Icon(Icons.clear,
                                                          color: Colors.red),
                                                      onPressed: () {
                                                        setState(() {
                                                          reController
                                                                  .summaryStartDate =
                                                              null;
                                                          reController
                                                                  .summaryEndDate =
                                                              null;
                                                        });
                                                      },
                                                    ),
                                                ],
                                              ),
                                            ],
                                          ),

                                          // Show vehicle type filter only when showVehicleFilter is true
                                          if (reController
                                              .showVehicleFilter) ...[
                                            SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child:
                                                      DropdownButtonFormField<
                                                          String>(
                                                    value: reController
                                                        .summaryVehicleTypeFilter,
                                                    items: [
                                                      'All',
                                                      'Truck',
                                                      'Trailer'
                                                    ].map((String value) {
                                                      return DropdownMenuItem<
                                                          String>(
                                                        value: value,
                                                        child: Text(value),
                                                      );
                                                    }).toList(),
                                                    onChanged: (value) {
                                                      setState(() {
                                                        reController
                                                                .summaryVehicleTypeFilter =
                                                            value!;
                                                        reController
                                                            .selectedSummaryVehicles
                                                            .clear();
                                                      });
                                                    },
                                                    decoration: InputDecoration(
                                                      labelText: 'Vehicle Type',
                                                      border:
                                                          OutlineInputBorder(),
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(width: 10),
                                                IconButton(
                                                  icon: Icon(Icons.refresh,
                                                      color: kPrimary),
                                                  onPressed: () {
                                                    setState(() {
                                                      reController
                                                          .selectedSummaryVehicles
                                                          .clear();
                                                      reController
                                                              .summaryVehicleTypeFilter =
                                                          'All';
                                                    });
                                                  },
                                                  tooltip: 'Clear Filters',
                                                ),
                                              ],
                                            ),

                                            // Vehicle Selection (only show if not 'All')
                                            if (reController
                                                    .summaryVehicleTypeFilter !=
                                                'All')
                                              Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  SizedBox(height: 8),
                                                  Text('Select Vehicles:',
                                                      style: TextStyle(
                                                          fontWeight:
                                                              FontWeight.bold)),
                                                  SizedBox(height: 8),
                                                  Container(
                                                    height: 150,
                                                    child: ListView.builder(
                                                      shrinkWrap: true,
                                                      itemCount: reController
                                                          .vehicles
                                                          .where((vehicle) {
                                                        return reController
                                                                    .summaryVehicleTypeFilter ==
                                                                'All' ||
                                                            vehicle['vehicleType'] ==
                                                                reController
                                                                    .summaryVehicleTypeFilter;
                                                      }).length,
                                                      itemBuilder:
                                                          (context, index) {
                                                        final filteredVehicles =
                                                            reController
                                                                .vehicles
                                                                .where(
                                                                    (vehicle) {
                                                          return reController
                                                                      .summaryVehicleTypeFilter ==
                                                                  'All' ||
                                                              vehicle['vehicleType'] ==
                                                                  reController
                                                                      .summaryVehicleTypeFilter;
                                                        }).toList();

                                                        final vehicle =
                                                            filteredVehicles[
                                                                index];
                                                        final isSelected =
                                                            reController
                                                                .selectedSummaryVehicles
                                                                .contains(
                                                                    vehicle[
                                                                        'id']);

                                                        return CheckboxListTile(
                                                          title: Text(
                                                              '${vehicle['vehicleNumber']} (${vehicle['companyName']})'),
                                                          value: isSelected,
                                                          onChanged:
                                                              (bool? value) {
                                                            setState(() {
                                                              if (value ==
                                                                  true) {
                                                                reController
                                                                    .selectedSummaryVehicles
                                                                    .add(vehicle[
                                                                        'id']);
                                                              } else {
                                                                reController
                                                                    .selectedSummaryVehicles
                                                                    .remove(
                                                                        vehicle[
                                                                            'id']);
                                                              }
                                                            });
                                                          },
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            SizedBox(height: 8),
                                          ],

                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              _buildSummaryItem(
                                                  'Total',
                                                  reController
                                                          .calculateInvoiceTotals()[
                                                      'total']!),
                                              _buildSummaryItem(
                                                  'Trucks',
                                                  reController
                                                          .calculateInvoiceTotals()[
                                                      'truck']!),
                                              _buildSummaryItem(
                                                  'Trailers',
                                                  reController
                                                          .calculateInvoiceTotals()[
                                                      'trailer']!),
                                              _buildSummaryItem(
                                                  'Others',
                                                  reController
                                                          .calculateInvoiceTotals()[
                                                      'other']!),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                : SizedBox(),

                            reController.currentUser == null
                                ? AbsorbPointer(
                                    child: TabBar(
                                      controller: _tabController,
                                      tabs: [
                                        Tab(text: "My Records"),
                                        Tab(text: "My Miles"),
                                      ],
                                    ),
                                  )
                                : TabBar(
                                    controller: _tabController,
                                    tabs: [
                                      Tab(
                                        child: Text("My Records",
                                            style: appStyleUniverse(
                                                20, kDark, FontWeight.w500)),
                                      ),
                                      Tab(
                                        child: Text("My Miles",
                                            style: appStyleUniverse(
                                                20, kDark, FontWeight.w500)),
                                      ),
                                    ],
                                  ),
                            // SizedBox(height: 10.h),

                            //my records section
                            Container(
                              // color: kPrimary,
                              height: MediaQuery.of(context).size.height * 0.7,
                              child: TabBarView(
                                controller: _tabController,
                                children: [
                                  // My Records Tab
                                  (reController.isAnonymous == true ||
                                          reController.isProfileComplete ==
                                              false)
                                      ? Center(
                                          child: Padding(
                                            padding: const EdgeInsets.all(15.0),
                                            child: Column(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Icon(Icons.lock,
                                                    size: 50,
                                                    color: Colors.grey),
                                                SizedBox(height: 20),
                                                Text(
                                                    'Please Create an account to \nadd records and view records',
                                                    style: TextStyle(
                                                        color: Colors.grey)),
                                                SizedBox(height: 20),
                                                CustomButton(
                                                    text: "Register/Login",
                                                    onPress: () =>
                                                        showLoginPrompt(),
                                                    color: kSecondary)
                                              ],
                                            ),
                                          ),
                                        )
                                      : SingleChildScrollView(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.stretch,
                                            children: [
                                              if (filteredRecords.isEmpty)
                                                Center(
                                                  child: Column(
                                                    children: [
                                                      Icon(
                                                          Icons
                                                              .note_alt_outlined,
                                                          size: 80,
                                                          color: kPrimary
                                                              .withOpacity(
                                                                  0.5)),
                                                      const SizedBox(
                                                          height: 16),
                                                      Text('No records found',
                                                          style:
                                                              appStyleUniverse(
                                                                  18,
                                                                  kDarkGray,
                                                                  FontWeight
                                                                      .w500)),
                                                    ],
                                                  ),
                                                )
                                              else
                                                Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.end,
                                                  children: [
                                                    CircleAvatar(
                                                      backgroundColor: kPrimary,
                                                      foregroundColor: kWhite,
                                                      radius: 20.r,
                                                      child: IconButton(
                                                        onPressed: () async {
                                                          try {
                                                            final pdfBytes =
                                                                await generateRecordPdf(
                                                                    filteredRecords);
                                                            await Printing
                                                                .layoutPdf(
                                                              onLayout:
                                                                  (format) =>
                                                                      pdfBytes,
                                                            );
                                                          } catch (e) {
                                                            print(
                                                                'Printing error: $e');
                                                          }
                                                        },
                                                        icon: Icon(Icons.print),
                                                      ),
                                                    ),
                                                    ListView.builder(
                                                      shrinkWrap: true,
                                                      physics:
                                                          const NeverScrollableScrollPhysics(),
                                                      itemCount: filteredRecords
                                                          .length,
                                                      itemBuilder:
                                                          (context, index) {
                                                        final record =
                                                            filteredRecords[
                                                                index];
                                                        final services = record[
                                                                'services']
                                                            as List<dynamic>;
                                                        final date = DateFormat(
                                                                'MM-dd-yy')
                                                            .format(DateTime
                                                                .parse(record[
                                                                    'date']));

                                                        return Container(
                                                          child:
                                                              GestureDetector(
                                                            onTap: () => Get.to(() =>
                                                                RecordsDetailsScreen(
                                                                    record:
                                                                        record)),
                                                            child: Card(
                                                              elevation: 0,
                                                              shape:
                                                                  RoundedRectangleBorder(
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            15.r),
                                                                side:
                                                                    BorderSide(
                                                                  color: kPrimary
                                                                      .withOpacity(
                                                                          0.2),
                                                                  width: 1,
                                                                ),
                                                              ),
                                                              child: Container(
                                                                decoration:
                                                                    BoxDecoration(
                                                                  borderRadius:
                                                                      BorderRadius
                                                                          .circular(
                                                                              15.r),
                                                                ),
                                                                child: Padding(
                                                                  padding:
                                                                      EdgeInsets
                                                                          .all(16
                                                                              .w),
                                                                  child: Column(
                                                                    crossAxisAlignment:
                                                                        CrossAxisAlignment
                                                                            .start,
                                                                    children: [
                                                                      Row(
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.spaceBetween,
                                                                        children: [
                                                                          if (record['invoice']
                                                                              .isNotEmpty)
                                                                            Container(
                                                                              padding: EdgeInsets.symmetric(
                                                                                horizontal: 12.w,
                                                                                vertical: 6.h,
                                                                              ),
                                                                              decoration: BoxDecoration(
                                                                                color: kPrimary.withOpacity(0.1),
                                                                                borderRadius: BorderRadius.circular(20.r),
                                                                              ),
                                                                              child: Row(
                                                                                children: [
                                                                                  Icon(Icons.receipt_outlined, size: 20, color: kPrimary),
                                                                                  SizedBox(width: 8.w),
                                                                                  SizedBox(
                                                                                    width: 80.w,
                                                                                    child: Text("#${record['invoice']}", overflow: TextOverflow.ellipsis, style: appStyleUniverse(13, kDark, FontWeight.w500)),
                                                                                  ),
                                                                                ],
                                                                              ),
                                                                            ),
                                                                          Container(
                                                                            padding:
                                                                                EdgeInsets.symmetric(
                                                                              horizontal: 12.w,
                                                                              vertical: 6.h,
                                                                            ),
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: kSecondary.withOpacity(0.1),
                                                                              borderRadius: BorderRadius.circular(20.r),
                                                                            ),
                                                                            child:
                                                                                Row(
                                                                              children: [
                                                                                Icon(Icons.calendar_today, size: 18, color: kSecondary),
                                                                                SizedBox(width: 8.w),
                                                                                Text(date, style: appStyleUniverse(13, kDark, FontWeight.w500)),
                                                                              ],
                                                                            ),
                                                                          ),
                                                                          //Edit Icon

                                                                          GestureDetector(
                                                                            onTap:
                                                                                () {
                                                                              if (reController.isEdit!) {
                                                                                showDialog(
                                                                                    context: context,
                                                                                    builder: (_) {
                                                                                      return AlertDialog(
                                                                                        title: Text("Edit Record"),
                                                                                        content: Text("Are you sure you want to edit this record?"),
                                                                                        actions: [
                                                                                          TextButton(
                                                                                            onPressed: () {
                                                                                              reController.handleEditRecord(record);
                                                                                              Navigator.pop(context);
                                                                                            },
                                                                                            child: Text(
                                                                                              "Yes",
                                                                                              style: appStyle(15, kSecondary, FontWeight.bold),
                                                                                            ),
                                                                                          ),
                                                                                          TextButton(
                                                                                            onPressed: () {
                                                                                              Navigator.pop(context);
                                                                                            },
                                                                                            child: Text(
                                                                                              "No",
                                                                                              style: appStyle(15, kPrimary, FontWeight.bold),
                                                                                            ),
                                                                                          ),
                                                                                        ],
                                                                                      );
                                                                                    });
                                                                              } else {
                                                                                showToastMessage("Sorry", "You don't have permission to edit record", kPrimary);
                                                                              }
                                                                            },
                                                                            child:
                                                                                Container(
                                                                              padding: EdgeInsets.symmetric(
                                                                                horizontal: 12.w,
                                                                                vertical: 6.h,
                                                                              ),
                                                                              decoration: BoxDecoration(
                                                                                color: kPrimary,
                                                                                borderRadius: BorderRadius.circular(20.r),
                                                                              ),
                                                                              child: Icon(Icons.edit, color: kWhite, size: 16),
                                                                            ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                      SizedBox(
                                                                          height:
                                                                              16.h),
                                                                      buildInfoRow(
                                                                        Icons
                                                                            .directions_car_outlined,
                                                                        '${record['vehicleDetails']['vehicleNumber']} (${record['vehicleDetails']['companyName']})',
                                                                      ),
                                                                      Divider(
                                                                          height:
                                                                              24.h),
                                                                      buildInfoRow(
                                                                        Icons
                                                                            .build_outlined,
                                                                        services
                                                                            .map((service) =>
                                                                                service['serviceName'])
                                                                            .join(", "),
                                                                      ),
                                                                      Divider(
                                                                          height:
                                                                              24.h),
                                                                      buildInfoRow(
                                                                        Icons
                                                                            .store_outlined,
                                                                        record['workshopName'] ??
                                                                            'N/A',
                                                                      ),
                                                                      if (record[
                                                                              "description"]
                                                                          .isNotEmpty) ...[
                                                                        Divider(
                                                                            height:
                                                                                24.h),
                                                                        buildInfoRow(
                                                                          Icons
                                                                              .description_outlined,
                                                                          record[
                                                                              'description'],
                                                                        ),
                                                                      ],
                                                                      Divider(
                                                                          height:
                                                                              24.h),
                                                                      Row(
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.spaceBetween,
                                                                        children: [
                                                                          if (record["invoiceAmount"]
                                                                              .isNotEmpty) ...[
                                                                            Row(
                                                                              children: [
                                                                                Text("Invoice Amount :", style: appStyle(14, kDark, FontWeight.w500)),
                                                                                SizedBox(width: 8.w),
                                                                                Text('${record['invoiceAmount']}', style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                              ],
                                                                            ),
                                                                          ],
                                                                          if (record.containsKey("miles") &&
                                                                              record['miles'] != 0)
                                                                            Row(
                                                                              children: [
                                                                                Text("Miles :", style: appStyle(14, kDark, FontWeight.w500)),
                                                                                SizedBox(width: 8.w),
                                                                                Text('${record['miles']}', style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                              ],
                                                                            ),
                                                                          if (record.containsKey("hours") &&
                                                                              record['hours'] != 0)
                                                                            Row(
                                                                              children: [
                                                                                Text("Hours :", style: appStyle(14, kDark, FontWeight.w500)),
                                                                                SizedBox(width: 8.w),
                                                                                Text('${record['hours']}', style: appStyleUniverse(14, kPrimary, FontWeight.bold)),
                                                                              ],
                                                                            ),
                                                                        ],
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                        )
                                                            .animate()
                                                            .fadeIn(
                                                                duration:
                                                                    400.ms,
                                                                delay: (index *
                                                                        100)
                                                                    .ms)
                                                            .slideX(
                                                                begin: 0.2,
                                                                end: 0);
                                                      },
                                                    ),
                                                  ],
                                                ),
                                            ],
                                          ),
                                        ),

                                  // My Miles Tab
                                  (reController.isAnonymous == true ||
                                          reController.isProfileComplete ==
                                              false)
                                      ? Center(
                                          child: Column(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.lock,
                                                  size: 50, color: Colors.grey),
                                              SizedBox(height: 20),
                                              Text(
                                                  'Please Create an account to \nadd miles and view miles',
                                                  style: TextStyle(
                                                      color: Colors.grey)),
                                              SizedBox(height: 20),
                                              CustomButton(
                                                  text: "Register/Login",
                                                  onPress: () =>
                                                      showLoginPrompt(),
                                                  color: kPrimary)
                                            ],
                                          ),
                                        )
                                      : ListView.builder(
                                          itemCount:
                                              reController.vehicles.length,
                                          itemBuilder: (context, index) {
                                            final vehicle =
                                                reController.vehicles[index];
                                            return GestureDetector(
                                              onTap: () => Get.to(() =>
                                                  MilesDetailsScreen(
                                                      milesRecord: vehicle)),
                                              child: Card(
                                                margin: EdgeInsets.symmetric(
                                                    vertical: 8.h),
                                                child: ListTile(
                                                  title: Text(
                                                    '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                                                    style: appStyleUniverse(16,
                                                        kDark, FontWeight.w500),
                                                  ),
                                                  subtitle: vehicle[
                                                              'vehicleType'] ==
                                                          "Truck"
                                                      ? Text(
                                                          'Current Miles: ${vehicle['currentMiles'] ?? '0'}',
                                                          style:
                                                              appStyleUniverse(
                                                                  14,
                                                                  kDarkGray,
                                                                  FontWeight
                                                                      .normal))
                                                      : Text(
                                                          'Hours Reading: ${vehicle['hoursReading'] ?? '0'}',
                                                          style:
                                                              appStyleUniverse(
                                                                  14,
                                                                  kDarkGray,
                                                                  FontWeight
                                                                      .normal),
                                                        ),
                                                  trailing: Icon(
                                                      Icons
                                                          .directions_car_outlined,
                                                      color: kPrimary),
                                                ),
                                              ).animate().fadeIn(
                                                  duration: 400.ms,
                                                  delay: (index * 100).ms),
                                            );
                                          },
                                        ),
                                ],
                              ),
                            ),

                            // SizedBox(height: 20.h),
                          ],
                        ),
                      ),
                    ),
                  )
                : Center(
                    child: Text(
                      'You don\'t have access to view this page',
                      style: appStyleUniverse(18, kDark, FontWeight.w500),
                    ),
                  ),
          );
        });
  }

//MARK: Build Add Miles Method
  Widget buildAddMilesMethod(
      ReportsController reController, BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16.0.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vehicle Dropdown
            reController.currentUser == null
                ? AbsorbPointer(
                    child: DropdownButtonFormField<String>(
                      hint: Text('Login to select vehicle'),
                      items: [],
                      onChanged: null,
                    ),
                  )
                : DropdownButtonFormField<String>(
                    value: reController.selectedVehicle,
                    hint: const Text('Select Vehicle'),
                    items: (reController.vehicles
                          ..sort((a, b) => a['vehicleNumber']
                              .toString()
                              .toLowerCase()
                              .compareTo(
                                  b['vehicleNumber'].toString().toLowerCase())))
                        .map((vehicle) {
                      return DropdownMenuItem<String>(
                        value: vehicle['id'],
                        child: Text(
                          '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                          style: appStyleUniverse(13, kDark, FontWeight.normal),
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        reController.selectedVehicle = value;
                        reController.selectedServices.clear();
                        reController.updateSelectedVehicleAndService();
                        reController.selectedVehicleType =
                            reController.selectedVehicleData?['vehicleType'];
                      });
                    },
                  ),

            SizedBox(height: 16.h),

            // Dynamically show input field based on vehicle type
            if (reController.selectedVehicle != null &&
                reController.selectedVehicleData?['vehicleType'] ==
                    'Truck') ...[
              TextField(
                controller: reController.todayMilesController,
                decoration: InputDecoration(
                  labelText: 'Enter Miles',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ] else if (reController.selectedVehicle != null &&
                reController.selectedVehicleData?['vehicleType'] ==
                    'Trailer') ...[
              if (reController.selectedVehicleData?['companyName'] != "DRY VAN")
                TextField(
                  controller: reController.hoursController,
                  decoration: InputDecoration(
                    labelText: 'Enter Hours',
                    labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
            ],

            SizedBox(height: 16.h),
            //Save Miles Button

            if (reController.selectedVehicleData != null) ...[
              if (reController.selectedVehicleData?['vehicleType'] == 'Truck' ||
                  (reController.selectedVehicleData?['vehicleType'] ==
                          'Trailer' &&
                      reController.selectedVehicleData?['companyName'] !=
                          'DRY VAN'))
                CustomButton(
                  onPress: () async {
                    // Check which controller to use based on vehicle type
                    final isTruck =
                        reController.selectedVehicleData?['vehicleType'] ==
                            'Truck';
                    final controller = isTruck
                        ? reController.todayMilesController
                        : reController.hoursController;
                    final value = controller.text.trim();

                    if (reController.selectedVehicle != null &&
                        value.isNotEmpty) {
                      try {
                        final int enteredValue = int.parse(value);
                        final vehicleId = reController.selectedVehicle;

                        // Check if DataServices subcollection exists and is not empty
                        final dataServicesSnapshot = await FirebaseFirestore
                            .instance
                            .collection("Users")
                            .doc(reController.effectiveUserId)
                            .collection("DataServices")
                            .where("vehicleId", isEqualTo: vehicleId)
                            .get();

                        // Fetch current reading (Miles/Hours) for the selected vehicle
                        final vehicleDoc = await FirebaseFirestore.instance
                            .collection("Users")
                            .doc(reController.effectiveUserId)
                            .collection("Vehicles")
                            .doc(vehicleId)
                            .get();

                        if (vehicleDoc.exists) {
                          final int currentReading = int.parse(
                            vehicleDoc[isTruck
                                    ? 'currentMiles'
                                    : 'hoursReading'] ??
                                '0',
                          );

                          final data = {
                            "updatedAt":
                                DateFormat('yyyy-MM-dd').format(DateTime.now()),
                            isTruck
                                    ? "prevMilesValue"
                                    : "prevHoursReadingValue":
                                currentReading.toString(),
                            isTruck ? "currentMiles" : "hoursReading":
                                enteredValue.toString(),
                            isTruck ? "miles" : "hoursReading":
                                enteredValue.toString(),
                            isTruck ? 'currentMilesArray' : 'hoursReadingArray':
                                FieldValue.arrayUnion([
                              {
                                isTruck ? "miles" : "hours": enteredValue,
                                "date": DateTime.now().toIso8601String(),
                              }
                            ]),
                          };

                          // Get current user data to determine if we're a team member
                          final currentUserDoc = await FirebaseFirestore
                              .instance
                              .collection('Users')
                              .doc(reController.effectiveUserId)
                              .get();

                          final isTeamMember =
                              currentUserDoc.data()?['isTeamMember'] == true;
                          final ownerUid = isTeamMember
                              ? (currentUserDoc.data()?['createdBy'] ??
                                  reController.effectiveUserId)
                              : reController.effectiveUserId;

                          // Update owner's vehicle first
                          await FirebaseFirestore.instance
                              .collection("Users")
                              .doc(ownerUid)
                              .collection("Vehicles")
                              .doc(vehicleId)
                              .update(data);

                          // Query all team members under this owner (including the current user if they're a team member)
                          final teamMembersSnapshot = await FirebaseFirestore
                              .instance
                              .collection('Users')
                              .where('createdBy', isEqualTo: ownerUid)
                              .where('isTeamMember', isEqualTo: true)
                              .get();

                          // Save to all team members who have this vehicle
                          for (final doc in teamMembersSnapshot.docs) {
                            final teamMemberUid = doc.id;

                            // Check if this team member has this vehicle
                            final teamMemberVehicleDoc = await FirebaseFirestore
                                .instance
                                .collection('Users')
                                .doc(teamMemberUid)
                                .collection('Vehicles')
                                .doc(vehicleId)
                                .get();

                            if (teamMemberVehicleDoc.exists) {
                              await FirebaseFirestore.instance
                                  .collection('Users')
                                  .doc(teamMemberUid)
                                  .collection("Vehicles")
                                  .doc(vehicleId)
                                  .update(data);
                            }
                          }

                          // If current user is team member, also update their own vehicle
                          if (isTeamMember &&
                              reController.effectiveUserId != ownerUid) {
                            final currentUserVehicleDoc =
                                await FirebaseFirestore.instance
                                    .collection('Users')
                                    .doc(reController.effectiveUserId)
                                    .collection('Vehicles')
                                    .doc(vehicleId)
                                    .get();

                            if (currentUserVehicleDoc.exists) {
                              await FirebaseFirestore.instance
                                  .collection('Users')
                                  .doc(reController.effectiveUserId)
                                  .collection("Vehicles")
                                  .doc(vehicleId)
                                  .update(data);
                            }
                          }

                          debugPrint(
                              '${isTruck ? 'Miles' : 'Hours'} updated successfully!');
                          reController.todayMilesController.clear();
                          reController.hoursController.clear();
                          setState(() {
                            reController.selectedVehicle = null;
                            reController.selectedVehicleType = '';
                          });

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Saved successfully!'),
                              duration: Duration(seconds: 2),
                            ),
                          );

                          if (dataServicesSnapshot.docs.isEmpty) {
                            // Call cloud function to notify about missing services
                            final HttpsCallable callable =
                                FirebaseFunctions.instance.httpsCallable(
                                    'checkAndNotifyUserForVehicleService');

                            await callable.call({
                              'userId': reController.currentUId,
                              'vehicleId': vehicleId,
                            });

                            log('Called checkAndNotifyUserForVehicleService for $vehicleId');
                          } else {
                            // Call the cloud function to check for notifications
                            final HttpsCallable callable = FirebaseFunctions
                                .instance
                                .httpsCallable('checkDataServicesAndNotify');

                            final result = await callable.call({
                              'userId': reController.currentUId,
                              'vehicleId': vehicleId
                            });

                            log('Check Data Services Cloud function result: ${result.data} vehicle Id $vehicleId');
                          }
                        } else {
                          throw 'Vehicle data not found';
                        }
                      } catch (e) {
                        debugPrint(
                            'Error updating ${isTruck ? 'miles' : 'hours'}: $e');
                      }
                    } else {}
                  },
                  color: kPrimary,
                  text:
                      'Save ${reController.selectedVehicleData?['vehicleType'] == 'Truck' ? 'Miles' : 'Hours'}',
                ),
            ],
          ],
        ),
      ),
    );
  }

//MARK: - Add Record Method
  Widget buildAddRecordMethod(
      ReportsController reController, BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(8.0.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vehicle Dropdown
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: reController.selectedVehicle,
                    hint: const Text('Select Vehicle'),
                    items: (reController.vehicles
                          ..sort((a, b) => a['vehicleNumber']
                              .toString()
                              .toLowerCase()
                              .compareTo(
                                  b['vehicleNumber'].toString().toLowerCase())))
                        .map((vehicle) {
                      return DropdownMenuItem<String>(
                        value: vehicle['id'],
                        child: Text(
                          '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                          style: appStyleUniverse(14, kDark, FontWeight.normal),
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        reController.selectedVehicle = value;
                        reController.selectedServices.clear();
                        reController.selectedPackages.clear();
                        reController.updateSelectedVehicleAndService();
                      });
                    },
                  ),
                ),
                if (reController.role == "Owner" ||
                    reController.role == "SubOwner")
                  Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: InkWell(
                      onTap: () {
                        if (reController.isAnonymous == true ||
                            reController.isProfileComplete == false) {
                          showToastMessage(
                              "Incomplete Profile",
                              "Please Create an account or login with existing account",
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
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                AddVehicleScreen(
                                                    currentUId: reController
                                                        .currentUId),
                                          ),
                                        );
                                      },
                                    ),
                                    ListTile(
                                      leading: Icon(Icons.upload_file),
                                      title: Text("Import Vehicle"),
                                      onTap: () {
                                        Navigator.pop(context);
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                AddVehicleViaExcelScreen(
                                              currentUId:
                                                  reController.currentUId,
                                            ),
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
                        backgroundColor: kWhite,
                        child: Icon(Icons.add, color: kPrimary),
                      ),
                    ),
                  )
              ],
            ),

            SizedBox(height: 10.h),
            // Select Package (Multiple Selection)

            if (reController.selectedVehicle != null &&
                reController.selectedVehicleData?['vehicleType'] ==
                    'Truck') ...[
              Text("Select Packages",
                  style: appStyleUniverse(16, kDark, FontWeight.normal)),
              MultiSelectDialogField(
                dialogHeight: 300,
                items: reController.packages.where((package) {
                  List<String>? vehicleTypes = reController
                      .selectedVehicleData?['vehicleType']
                      .toString()
                      .toLowerCase()
                      .split('/');

                  List<String> packageTypes = List<String>.from(package['type'])
                      .map((t) => t.toLowerCase())
                      .toList(); // Convert package types to lowercase

                  return packageTypes.any((type) => vehicleTypes!
                      .contains(type)); // Check if any type matches
                }).map((package) {
                  return MultiSelectItem<String>(
                    package['name'], // Display the package name
                    package['name'], // Label in dropdown
                  );
                }).toList(),
                initialValue: reController.selectedPackages.toList(),
                title: Text("Select Packages"),
                selectedColor: kSecondary,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey),
                ),
                buttonIcon: Icon(Icons.arrow_drop_down),
                buttonText: Text("Choose Packages"),
                separateSelectedItems: false,
                onConfirm: (values) {
                  setState(() {
                    reController.selectedPackages = Set<String>.from(values);
                    reController.selectedServices.clear();

                    for (var selectedPackage in reController.selectedPackages) {
                      String normalizedPackage =
                          reController.normalizeString(selectedPackage);

                      for (var service in reController.services) {
                        if (service['pName'] != null &&
                            service['pName'].isNotEmpty) {
                          for (var packageName in service['pName']) {
                            if (reController.normalizeString(packageName) ==
                                normalizedPackage) {
                              reController.selectedServices.add(service['sId']);

                              // Automatically select subservices if they exist
                              if (service['subServices'] != null) {
                                for (var subService in service['subServices']) {
                                  List<String> subServiceNames =
                                      List<String>.from(
                                          subService['sName'] ?? []);
                                  for (var subServiceName in subServiceNames) {
                                    if (subServiceName.isNotEmpty) {
                                      reController.selectedSubServices[
                                          service['sId']] ??= [];
                                      reController
                                          .selectedSubServices[service['sId']]!
                                          .add(subServiceName);
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    reController.updateSelectedVehicleAndService();
                  });
                },
              ),
            ],

            SizedBox(height: 10.h),

            // Services Selection with Search
            Text('Select Services',
                style: appStyleUniverse(16, kDark, FontWeight.w500)),
            SizedBox(height: 8.h),

            // Search Bar for Services
            SizedBox(
              height: 40.h,
              child: TextField(
                controller: reController.serviceSearchController,
                decoration: InputDecoration(
                  labelText: 'Search Services',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                    borderSide: BorderSide(color: Colors.grey.shade400),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                    borderSide: BorderSide(color: kPrimary, width: 1),
                  ),
                  prefixIcon: Icon(Icons.search, color: kPrimary),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                ),
                onChanged: (value) {
                  setState(() {});
                },
              ),
            ),
            SizedBox(height: 8.h),

            Wrap(
              spacing: 4.w,
              runSpacing: 4.h,
              children: reController.services.where((service) {
                final searchTerm =
                    reController.serviceSearchController.text.toLowerCase();
                final matchesSearch = searchTerm.isEmpty ||
                    service['sName']
                        .toString()
                        .toLowerCase()
                        .contains(searchTerm);
                final matchesVehicleType =
                    reController.selectedVehicleData == null ||
                        service['vType'] ==
                            reController.selectedVehicleData?['vehicleType'];

                return matchesSearch && matchesVehicleType;
              }).map((service) {
                bool isSelected =
                    reController.selectedServices.contains(service['sId']);
                return reController.buildServiceChip(
                    service, isSelected, context);
              }).toList(),
            ),

            SizedBox(height: 10.h),

            if (reController.selectedVehicleData?['vehicleType'] == "Truck")
              SizedBox(
                height: 40.h,
                child: TextField(
                  controller: reController.milesController,
                  decoration: const InputDecoration(
                    labelText: 'Miles',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),

            if (reController.selectedVehicleData?['vehicleType'] ==
                "Trailer") ...[
              SizedBox(
                height: 40.h,
                child: TextField(
                  controller: reController.hoursController,
                  decoration: const InputDecoration(
                    labelText: 'Hours',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
              SizedBox(height: 10.h),
            ],
            SizedBox(height: 10.h),

            InkWell(
              onTap: () async {
                final DateTime? picked = await showDatePicker(
                  context: context,
                  initialDate: reController.selectedDate ?? DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) {
                  setState(() {
                    reController.selectedDate = picked;
                  });
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date',
                  border: OutlineInputBorder(),
                ),
                child: Text(
                  reController.selectedDate != null
                      ? reController.selectedDate!
                          .toLocal()
                          .toString()
                          .split(' ')[0]
                      : 'Select Date',
                ),
              ),
            ),

            SizedBox(height: 10.h),

            // Workshop Name
            SizedBox(
              height: 40.h,
              child: TextField(
                controller: reController.workshopController,
                decoration: InputDecoration(
                  labelText: 'Workshop Name',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            SizedBox(height: 10.h),
            SizedBox(
              height: 60.h,
              child: TextField(
                controller: reController.invoiceController,
                decoration: InputDecoration(
                  labelText: 'Invoice Number (Optional)',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(),
                  // counterText:
                  //     '${invoiceController.text.length}/10',
                ),
                maxLength: 15,
                keyboardType: TextInputType.text,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
                ],
                onChanged: (value) {
                  // setState(() {}); // Refresh to update counter
                },
              ),
            ),
            // Text(
            //   'Max 10 characters (letters and numbers only)',
            //   style: appStyleUniverse(
            //       12, kDarkGray, FontWeight.normal),
            // ),
            SizedBox(height: 10.h),

            SizedBox(
              height: 40.h,
              child: TextField(
                controller: reController.invoiceAmountController,
                decoration: InputDecoration(
                  labelText: 'Invoice Amount (Optional)',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ),
            SizedBox(height: 10.h),
            SizedBox(
              height: 40.h,
              child: TextField(
                controller: reController.descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description (Optional)',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.text,
              ),
            ),
            SizedBox(height: 10.h),
            GestureDetector(
              onTap: () => reController.showImageSourceDialog(context),
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
            ),
            SizedBox(height: 10.h),

            // image section
            if (reController.image != null)
              Container(
                width: 80.w,
                height: 80.h,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12.r),
                  image: DecorationImage(
                    image: FileImage(reController.image!),
                    fit: BoxFit.cover,
                  ),
                ),
              )
            else if (reController.existingImageUrl != null)
              Container(
                width: 80.w,
                height: 80.h,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12.r),
                  image: DecorationImage(
                    image: NetworkImage(reController.existingImageUrl!),
                    fit: BoxFit.cover,
                  ),
                ),
              ),

            // Save Button
            Row(
              mainAxisAlignment: reController.isEditing
                  ? MainAxisAlignment.spaceBetween
                  : MainAxisAlignment.center,
              children: [
                CustomButton(
                  height: reController.isEditing ? 45 : 45,
                  width: reController.isEditing ? 100 : 220.w,
                  onPress: () {
                    if (reController.isAdd == true) {
                      // reController.handleSaveRecords().then((refreshPage) {
                      // _refreshPage(reController);
                      // });
                      reController.handleSaveRecords(mounted, context);
                    } else {
                      showToastMessage(
                          "Alert!", "Sorry you don't have access", kPrimary);
                    }
                  },
                  color: kSecondary,
                  text:
                      reController.isEditing ? 'Update Record' : 'Save Record',
                ),
                reController.isEditing
                    ? CustomButton(
                        width: 80,
                        text: "Cancel",
                        onPress: () => reController.resetForm(),
                        color: kPrimary)
                    : SizedBox(),
              ],
            ),
          ],
        ),
      ),
    );
  }

//MARK: - Search & Filter Method
  Widget buildSearchFilterMethod(
      BuildContext context, ReportsController reController) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16.0.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Search & Filter',
                    style: appStyleUniverse(18, kDark, FontWeight.normal)),

                // Filter Icon
                IconButton(
                  icon: Icon(Icons.filter_list, color: kPrimary),
                  onPressed: () {
                    // Show popup with options for filtering
                    showDialog(
                      context: context,
                      builder: (context) {
                        return AlertDialog(
                          title: Text('Filter Options'),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ListTile(
                                title: Text('Search by Vehicle'),
                                onTap: () {
                                  // Handle search by vehicle

                                  setState(() {
                                    reController.showCombinedSearch = false;
                                    reController.showVehicleSearch = true;
                                    reController.showServiceSearch = false;
                                    reController.showDateSearch = false;
                                    reController.showInvoiceSearch = false;
                                    reController.filterService = '';
                                    reController.startDate = null;
                                    reController.endDate = null;
                                  });
                                  Navigator.of(context).pop();
                                },
                              ),
                              ListTile(
                                title: Text('Search by Service'),
                                onTap: () {
                                  setState(() {});
                                  // Handle search by service
                                  setState(() {
                                    reController.showCombinedSearch = false;
                                    reController.showVehicleSearch = false;
                                    reController.showServiceSearch = true;
                                    reController.showDateSearch = false;
                                    reController.showInvoiceSearch = false;
                                    reController.filterVehicle = '';
                                    reController.startDate = null;
                                    reController.endDate = null;
                                  });
                                  Navigator.of(context).pop();
                                },
                              ),
                              ListTile(
                                title: Text('Search by Date'),
                                onTap: () {
                                  setState(() {
                                    reController.showCombinedSearch = false;
                                    reController.showVehicleSearch = false;
                                    reController.showServiceSearch = false;
                                    reController.showDateSearch = true;
                                    reController.showInvoiceSearch = false;
                                    reController.filterVehicle = '';
                                    reController.filterService = '';
                                  });
                                  // Handle search by date
                                  Navigator.of(context).pop();
                                },
                              ),
                              ListTile(
                                  title: Text('Search by Invoice'),
                                  onTap: () {
                                    setState(() {
                                      reController.showCombinedSearch = false;
                                      reController.showVehicleSearch = false;
                                      reController.showServiceSearch = false;
                                      reController.showDateSearch = false;
                                      reController.showInvoiceSearch = true;
                                      reController.filterVehicle = '';
                                      reController.filterService = '';
                                      reController.startDate = null;
                                      reController.endDate = null;
                                    });
                                    Navigator.of(context).pop();
                                  }),
                              ListTile(
                                  title: Text('Search All'),
                                  onTap: () {
                                    setState(() {
                                      reController.showCombinedSearch = true;
                                      reController.showVehicleSearch = false;
                                      reController.showServiceSearch = false;
                                      reController.showDateSearch = false;
                                      reController.showInvoiceSearch = false;
                                      reController.filterVehicle = '';
                                      reController.filterService = '';
                                      reController.startDate = null;
                                      reController.endDate = null;
                                    });
                                    Navigator.of(context).pop();
                                  }),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              child: Text('Close'),
                            ),
                          ],
                        );
                      },
                    );
                  },
                ),
              ],
            ),
            SizedBox(height: 16.h),
            if (reController.showVehicleSearch ||
                reController.showCombinedSearch)
              DropdownButtonFormField<String>(
                hint: const Text('Select Vehicle'),
                items: (reController.vehicles
                      ..sort((a, b) => a['vehicleNumber']
                          .toString()
                          .toLowerCase()
                          .compareTo(
                              b['vehicleNumber'].toString().toLowerCase())))
                    .map((vehicle) {
                  return DropdownMenuItem<String>(
                    value: vehicle['id'],
                    child: Text(
                      '${vehicle['vehicleNumber']} (${vehicle['companyName']})',
                      style: appStyleUniverse(13, kDark, FontWeight.normal),
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    reController.selectedVehicle = value;
                    reController.selectedServices.clear();
                    reController.updateSelectedVehicleAndService();
                  });
                },
              ),
            SizedBox(height: 16.h),
            if (reController.showInvoiceSearch ||
                reController.showCombinedSearch)
              TextField(
                decoration: InputDecoration(
                  labelText: 'Search by Invoice',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: Icon(Icons.receipt, color: kPrimary),
                ),
                onChanged: (value) {
                  setState(() {
                    reController.filterInvoice = value;
                  });
                },
              ),
            SizedBox(height: 16.h),
            if ((reController.showVehicleSearch ||
                    reController.showCombinedSearch) &&
                (reController.showServiceSearch || reController.showDateSearch))
              SizedBox(height: 16.h),
            if (reController.showServiceSearch ||
                reController.showCombinedSearch)
              DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  labelText: 'Search by Service',
                  labelStyle: appStyleUniverse(14, kDark, FontWeight.normal),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: Icon(Icons.build, color: kPrimary),
                ),
                items: reController.services.map((service) {
                  return DropdownMenuItem<String>(
                    value: service['sName'],
                    child: Text(
                      service['sName'],
                      style: appStyleUniverse(14, kDark, FontWeight.normal),
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    reController.filterService = value ?? '';
                  });
                },
                value: reController.filterService.isEmpty
                    ? null
                    : reController.filterService,
                hint: Text(
                  'Select Service',
                  style: appStyleUniverse(14, kDark, FontWeight.normal),
                ),
              ),
            SizedBox(height: 16.h),
            if ((reController.showServiceSearch ||
                    reController.showCombinedSearch) &&
                reController.showDateSearch)
              SizedBox(height: 16.h),
            if (reController.showDateSearch ||
                reController.showCombinedSearch) ...[
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final DateTime? picked = await showDatePicker(
                          context: context,
                          initialDate: reController.startDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            reController.startDate = picked;
                          });
                        }
                      },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Start Date',
                          labelStyle:
                              appStyleUniverse(14, kDark, FontWeight.normal),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon:
                              Icon(Icons.calendar_today, color: kPrimary),
                        ),
                        child: Text(
                          reController.startDate != null
                              ? DateFormat('MM-dd-yyyy')
                                  .format(reController.startDate!)
                              : 'Select Start Date',
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final DateTime? picked = await showDatePicker(
                          context: context,
                          initialDate: reController.endDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            reController.endDate = picked;
                          });
                        }
                      },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'End Date',
                          labelStyle:
                              appStyleUniverse(14, kDark, FontWeight.normal),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon:
                              Icon(Icons.calendar_today, color: kPrimary),
                        ),
                        child: Text(
                          reController.endDate != null
                              ? DateFormat('MM-dd-yyyy')
                                  .format(reController.endDate!)
                              : 'Select End Date',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            SizedBox(height: 16.h),
            CustomButton(
                text: "Clear",
                onPress: reController.resetFilters,
                color: kPrimary),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, double amount) {
    return Column(
      children: [
        Text(
          label,
          style: appStyle(
            14,
            kDarkGray,
            FontWeight.w500,
          ),
        ),
        SizedBox(height: 4),
        Text(
          '\$${amount.toStringAsFixed(0)}',
          style: appStyle(
            12,
            kPrimary,
            FontWeight.bold,
          ),
        ),
      ],
    );
  }

  void showLoginPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirmation Required'),
        content: Text('You need to create an account to access this feature'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Get.to(() => RegistrationScreen());
            },
            child: Text('Register'),
          ),
        ],
      ),
    );
  }

  GestureDetector buildProfileAvatar(currentUId) {
    return GestureDetector(
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
          builder:
              (BuildContext context, AsyncSnapshot<DocumentSnapshot> snapshot) {
            if (snapshot.hasError) {
              return Text('Error: ${snapshot.error}');
            }

            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            }

            final data = snapshot.data!.data() as Map<String, dynamic>;
            final userPhoto = data['profilePicture'] ?? '';
            final userName = data['userName'] ?? '';

            if (userPhoto.isEmpty) {
              return Text(
                userName.isNotEmpty ? userName[0] : '',
                style: kIsWeb
                    ? TextStyle(color: kWhite)
                    : appStyle(20, kWhite, FontWeight.w500),
              );
            } else {
              return ClipOval(
                child: Image.network(
                  userPhoto,
                  width: 38.r, // Set appropriate size for the image
                  height: 35.r,
                  fit: BoxFit.cover,
                ),
              );
            }
          },
        ),
      ),
    );
  }

  StreamBuilder<QuerySnapshot<Object?>> buildNotificationBadge(currentUId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('Users')
          .doc(currentUId)
          .collection('UserNotifications')
          .where('isRead', isEqualTo: false)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container();
        }
        int unreadCount = snapshot.data!.docs.length;
        return unreadCount > 0
            ? Badge(
                backgroundColor: kSecondary,
                label: Text(unreadCount.toString(),
                    style: appStyle(12, kWhite, FontWeight.normal)),
                child: GestureDetector(
                  onTap: () => Get.to(() =>
                      CloudNotificationMessageCenter(currentUId: currentUId)),
                  child: CircleAvatar(
                      backgroundColor: kPrimary,
                      radius: 17.r,
                      child: Icon(Icons.notifications,
                          size: 25.sp, color: kWhite)),
                ),
              )
            : Badge(
                backgroundColor: kSecondary,
                label: Text(unreadCount.toString(),
                    style: appStyle(12, kWhite, FontWeight.normal)),
                child: GestureDetector(
                  onTap: () => Get.to(() =>
                      CloudNotificationMessageCenter(currentUId: currentUId)),
                  child: CircleAvatar(
                      backgroundColor: kPrimary,
                      radius: 17.r,
                      child: Icon(Icons.notifications,
                          size: 25.sp, color: kWhite)),
                ),
              );
      },
    );
  }

  Widget buildInfoRow(IconData icon, String vText) {
    return Row(
      children: [
        Icon(icon, size: 20, color: kSecondary),
        SizedBox(width: 8.w),
        // Text(hText, style: appStyle(16, kDark, FontWeight.w500)),
        // SizedBox(width: 8.w),
        Expanded(
          child: Text(
            vText,
            style: appStyleUniverse(16, kDarkGray, FontWeight.w400),
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget buildReusableRowTextWidget(String hText, String vText) {
    return Row(
      children: [
        Text(hText, style: appStyle(15, kDark, FontWeight.w500)),
        SizedBox(
          width: 250.w,
          child: Text(vText,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: appStyle(15, kDarkGray, FontWeight.w400)),
        ),
      ],
    );
  }

  Widget buildCustomRowButton(
      IconData iconName, String text, Color boxColor, void Function()? onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 38.h,
        width: 90.w,
        decoration: BoxDecoration(
            color: boxColor, borderRadius: BorderRadius.circular(10.r)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(iconName, color: kWhite),
            Text(text, style: appStyleUniverse(14, kWhite, FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  // Future<void> _refreshPage(reController) async {
  //   try {
  //     reController.resetForm();
  //     reController.resetFilters();
  //     reController.initializeStreams();

  //     setState(() {
  //       reController.showAddRecords = false;
  //       reController.showSearchFilter = false;
  //       reController.showAddMiles = false;
  //       reController.showVehicleSearch = false;
  //       reController.showServiceSearch = false;
  //       reController.showDateSearch = false;
  //       reController.showCombinedSearch = false;
  //     });

  //     if (mounted) setState(() {});

  //     await Future.delayed(Duration(milliseconds: 500));

  //     ScaffoldMessenger.of(context).showSnackBar(
  //       SnackBar(
  //         content: Text('Page refreshed'),
  //         duration: Duration(seconds: 1),
  //       ),
  //     );
  //   } catch (e) {
  //     debugPrint('Refresh error: $e');
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       SnackBar(
  //         content: Text('Refresh failed'),
  //         duration: Duration(seconds: 1),
  //       ),
  //     );
  //   }
  // }
}
