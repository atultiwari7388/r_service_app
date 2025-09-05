import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/show_toast_msg.dart';
import 'package:regal_service_d_app/views/app/manageCheck/manage_check_screen.dart';
import 'package:regal_service_d_app/views/app/manageTrips/trip_details.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/add_team_trip_o_a.dart';

class ViewMemberTrip extends StatefulWidget {
  const ViewMemberTrip({
    super.key,
    required this.memberId,
    required this.memberName,
    required this.ownerId,
    required this.perMileCharge,
    required this.role,
    required this.teamRole,
  });

  final String memberId;
  final String memberName;
  final String ownerId;
  final num perMileCharge;
  final String role;
  final String teamRole;

  @override
  State<ViewMemberTrip> createState() => _ViewMemberTripState();
}

class _ViewMemberTripState extends State<ViewMemberTrip> {
  DateTime? fromDate;
  DateTime? toDate;

  final TextEditingController _tripNameController = TextEditingController();
  final TextEditingController _startMilesController = TextEditingController();
  final TextEditingController _endMilesController = TextEditingController();
  final TextEditingController _googleMilesController = TextEditingController();
  DateTime? _selectedStartDate;
  DateTime? _selectedEndDate;

  String? selectedTruck;
  String searchTripName = "";
  List<String> availableTrucks = [];
  bool showFilterOptions = false;
  String? sortType; // 'date', 'truck', or 'tripname'

  Future<void> _pickDateRange() async {
    DateTime now = DateTime.now();
    DateTime firstDate = DateTime(now.year - 5);
    DateTime lastDate = DateTime(now.year + 1);

    DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: firstDate,
      lastDate: lastDate,
      initialDateRange: fromDate != null && toDate != null
          ? DateTimeRange(start: fromDate!, end: toDate!)
          : null,
    );

    if (picked != null) {
      setState(() {
        fromDate = picked.start;
        toDate = picked.end;
      });
    }
  }

  Future<Map<String, double>> calculateTotals(List<QueryDocumentSnapshot> trips,
      String perMileCharge, String driverId, String role) async {
    double totalExpenses = 0;
    double totalEarnings = 0;
    double googleMilesEarnings = 0;
    String userId = driverId;
    double perMile = double.tryParse(perMileCharge) ?? 0.0;

    for (var trip in trips) {
      // Calculate expenses from tripDetails
      var expensesSnapshot = await FirebaseFirestore.instance
          .collection("Users")
          .doc(userId)
          .collection('trips')
          .doc(trip.id)
          .collection('tripDetails')
          .where('type', isEqualTo: 'Expenses')
          .get();

      double tripExpenses = expensesSnapshot.docs
          .fold(0.0, (sum, doc) => sum + (doc['amount'] ?? 0.0));
      totalExpenses += tripExpenses;

      // Calculate earnings based on role
      if (role == "Driver") {
        int startMiles = trip['tripStartMiles'] ?? 0;
        int endMiles = trip['tripEndMiles'] ?? 0;
        int miles = endMiles - startMiles;
        totalEarnings += miles * perMile;

        // Add Google earnings if they exist
        if (trip['googleTotalEarning'] != null) {
          googleMilesEarnings += (trip['googleTotalEarning'] as num).toDouble();
        }
      } else if (role == "Owner") {
        // Sum all oEarnings values
        double ownerEarnings = (trip['oEarnings'] ?? 0.0).toDouble();
        totalEarnings += ownerEarnings;
      }
    }

    // If any value is negative, set it to 0
    totalExpenses = totalExpenses < 0 ? 0 : totalExpenses;
    totalEarnings = totalEarnings < 0 ? 0 : totalEarnings;
    googleMilesEarnings = googleMilesEarnings < 0 ? 0 : googleMilesEarnings;

    return {
      'expenses': totalExpenses,
      'earnings': totalEarnings,
      'googleTotalEarning': googleMilesEarnings
    };
  }

  Future<void> _showEditDialog(DocumentSnapshot tripDoc) async {
    // Initialize controllers with current values
    _tripNameController.text = tripDoc['tripName'];
    _startMilesController.text = tripDoc['tripStartMiles'].toString();
    _endMilesController.text = tripDoc['tripEndMiles'].toString();
    _selectedStartDate = tripDoc['tripStartDate'].toDate();
    _selectedEndDate = tripDoc['tripEndDate'].toDate();

    // Store current vehicle IDs
    String currentTruckId = tripDoc['vehicleId'];
    String? currentTrailerId = tripDoc['trailerId'];

    // Fetch available trucks and trailers
    final trucksSnapshot = await FirebaseFirestore.instance
        .collection("Users")
        .doc(widget.memberId)
        .collection('Vehicles')
        .where('active', isEqualTo: true)
        .where("vehicleType", isEqualTo: "Truck")
        .get();

    final trailersSnapshot = await FirebaseFirestore.instance
        .collection("Users")
        .doc(widget.memberId)
        .collection('Vehicles')
        .where('active', isEqualTo: true)
        .where("vehicleType", isEqualTo: "Trailer")
        .get();

    // Create maps for display strings to document data
    Map<String, QueryDocumentSnapshot> truckDisplayToDoc = {};
    Map<String, QueryDocumentSnapshot> trailerDisplayToDoc = {};

    List<String> trucks = trucksSnapshot.docs.map((doc) {
      String display = "${doc['companyName']} (${doc['vehicleNumber']})";
      truckDisplayToDoc[display] = doc;
      return display;
    }).toList();

    List<String> trailers = trailersSnapshot.docs.map((doc) {
      String display = "${doc['companyName']} (${doc['vehicleNumber']})";
      trailerDisplayToDoc[display] = doc;
      return display;
    }).toList();

    // Get current display values
    String currentTruckDisplay =
        "${tripDoc['companyName']} (${tripDoc['vehicleNumber']})";

    String? currentTrailerDisplay;
    if (currentTrailerId != null &&
        tripDoc['trailerCompanyName'] != null &&
        tripDoc['trailerNumber'] != null) {
      currentTrailerDisplay =
          "${tripDoc['trailerCompanyName']} (${tripDoc['trailerNumber']})";
    }

    // Load types
    List<String> loadTypes = ["Empty", "Loaded"];
    String currentLoadType = tripDoc['loadType'] ?? "";

    // Initialize selected values
    String? selectedTruck = currentTruckDisplay;
    String? selectedTrailer = currentTrailerDisplay;
    String? selectedLoadType = currentLoadType;

    // These will hold the IDs (either existing or new)
    String? newTruckId = currentTruckId;
    String? newTrailerId = currentTrailerId;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            // FIX: Check if trailers list is empty and handle accordingly
            bool hasTrailers = trailers.isNotEmpty;
            String? effectiveTrailerValue =
                hasTrailers ? selectedTrailer : null;

            return AlertDialog(
              title: Text('Edit Trip Details'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _tripNameController,
                      decoration: InputDecoration(labelText: 'Trip Name'),
                    ),
                    SizedBox(height: 10.h),

                    // Truck Dropdown
                    DropdownButtonFormField<String>(
                      value: selectedTruck,
                      decoration: InputDecoration(labelText: 'Truck'),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text('Select Truck'),
                        ),
                        ...trucks.map((truck) {
                          return DropdownMenuItem(
                            value: truck,
                            child: Text(truck),
                          );
                        }).toList(),
                      ],
                      onChanged: (value) {
                        setState(() {
                          selectedTruck = value;
                          newTruckId = value != null
                              ? truckDisplayToDoc[value]!.id
                              : currentTruckId;
                        });
                      },
                    ),
                    SizedBox(height: 10.h),

                    // Trailer Dropdown - FIXED: Handle case when no trailers exist
                    if (hasTrailers) ...[
                      DropdownButtonFormField<String>(
                        value: effectiveTrailerValue,
                        decoration:
                            InputDecoration(labelText: 'Trailer (Optional)'),
                        items: [
                          DropdownMenuItem(
                            value: null,
                            child: Text('No Trailer'),
                          ),
                          ...trailers.map((trailer) {
                            return DropdownMenuItem(
                              value: trailer,
                              child: Text(trailer),
                            );
                          }).toList(),
                        ],
                        onChanged: (value) {
                          setState(() {
                            selectedTrailer = value;
                            effectiveTrailerValue = value;
                            newTrailerId = value != null
                                ? trailerDisplayToDoc[value]!.id
                                : null;
                          });
                        },
                      ),
                      SizedBox(height: 10.h),
                    ] else ...[
                      // Show message when no trailers available
                      Text(
                        'No trailers available',
                        style: TextStyle(color: Colors.grey),
                      ),
                      SizedBox(height: 10.h),
                    ],

                    // Load Type Dropdown
                    DropdownButtonFormField<String>(
                      value: selectedLoadType,
                      decoration: InputDecoration(labelText: 'Load Type'),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text('Select Load Type'),
                        ),
                        ...loadTypes.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Text(type),
                          );
                        }).toList(),
                      ],
                      onChanged: (value) {
                        setState(() {
                          selectedLoadType = value;
                        });
                      },
                    ),
                    SizedBox(height: 10.h),

                    TextField(
                      controller: _startMilesController,
                      decoration: InputDecoration(labelText: 'Start Miles'),
                      keyboardType: TextInputType.number,
                    ),
                    SizedBox(height: 10.h),
                    TextField(
                      controller: _endMilesController,
                      decoration: InputDecoration(labelText: 'End Miles'),
                      keyboardType: TextInputType.number,
                    ),
                    SizedBox(height: 10.h),
                    ListTile(
                      title: Text(
                          'Start Date: ${_selectedStartDate != null ? DateFormat('dd MMM yyyy').format(_selectedStartDate!) : 'Not selected'}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedStartDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedStartDate = picked;
                          });
                        }
                      },
                    ),
                    ListTile(
                      title: Text(
                          'End Date: ${_selectedEndDate != null ? DateFormat('dd MMM yyyy').format(_selectedEndDate!) : 'Not selected'}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedEndDate ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedEndDate = picked;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    if (_tripNameController.text.isEmpty ||
                        _startMilesController.text.isEmpty ||
                        _endMilesController.text.isEmpty ||
                        _selectedStartDate == null ||
                        _selectedEndDate == null ||
                        selectedTruck == null ||
                        selectedLoadType == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text('Please fill all required fields')),
                      );
                      return;
                    }

                    try {
                      // Get the selected truck and trailer documents
                      QueryDocumentSnapshot? selectedTruckDoc =
                          selectedTruck != null
                              ? truckDisplayToDoc[selectedTruck!]
                              : null;
                      QueryDocumentSnapshot? selectedTrailerDoc =
                          selectedTrailer != null && hasTrailers
                              ? trailerDisplayToDoc[selectedTrailer!]
                              : null;

                      // Prepare update data
                      Map<String, dynamic> updateData = {
                        'tripName': _tripNameController.text,
                        'tripStartMiles': int.parse(_startMilesController.text),
                        'tripEndMiles': int.parse(_endMilesController.text),
                        'tripStartDate': _selectedStartDate,
                        'tripEndDate': _selectedEndDate,
                        'vehicleId': newTruckId,
                        'companyName': selectedTruckDoc?['companyName'] ??
                            tripDoc['companyName'],
                        'vehicleNumber': selectedTruckDoc?['vehicleNumber'] ??
                            tripDoc['vehicleNumber'],
                        'trailerId': newTrailerId,
                        'loadType': selectedLoadType,
                        'updatedAt': Timestamp.now(),
                      };

                      // Only add trailer fields if a trailer is selected and trailers exist
                      if (selectedTrailerDoc != null && hasTrailers) {
                        updateData['trailerCompanyName'] =
                            selectedTrailerDoc['companyName'];
                        updateData['trailerNumber'] =
                            selectedTrailerDoc['vehicleNumber'];
                      } else {
                        // Clear trailer fields if no trailer is selected or no trailers exist
                        updateData['trailerCompanyName'] = null;
                        updateData['trailerNumber'] = null;
                        updateData['trailerId'] = null;
                      }

                      await FirebaseFirestore.instance
                          .collection("Users")
                          .doc(widget.memberId)
                          .collection('trips')
                          .doc(tripDoc.id)
                          .update(updateData);

                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Trip updated successfully')),
                      );
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error updating trip: $e')),
                      );
                    }
                  },
                  child: Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showGoogleMilesDialog(DocumentSnapshot tripDoc) async {
    _googleMilesController.clear();

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add Google Miles'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _googleMilesController,
                decoration: InputDecoration(labelText: 'Enter Google Miles'),
                keyboardType: TextInputType.number,
              ),
              SizedBox(height: 10.h),
              FutureBuilder<DocumentSnapshot>(
                future: FirebaseFirestore.instance
                    .collection("Users")
                    .doc(widget.memberId)
                    .get(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return CircularProgressIndicator();
                  }
                  if (snapshot.hasError) {
                    return Text('Error loading driver data');
                  }

                  String perMileCharge = snapshot.data?['perMileCharge'] ?? '0';
                  double googleMiles =
                      double.tryParse(_googleMilesController.text) ?? 0;
                  double totalEarning =
                      googleMiles * double.parse(perMileCharge);

                  return Column(
                    children: [
                      Text('Per Mile Charge: \$$perMileCharge'),
                      SizedBox(height: 10.h),
                      Text(
                        'Total Earning: \$${totalEarning.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                if (_googleMilesController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please enter Google Miles')),
                  );
                  return;
                }

                try {
                  // Get driver's perMileCharge
                  DocumentSnapshot driverDoc = await FirebaseFirestore.instance
                      .collection("Users")
                      .doc(widget.memberId)
                      .get();

                  String perMileCharge = driverDoc['perMileCharge'] ?? '0';
                  double googleMiles =
                      double.parse(_googleMilesController.text);
                  double googleTotalEarning =
                      googleMiles * double.parse(perMileCharge);

                  // Update the trip document
                  await FirebaseFirestore.instance
                      .collection("Users")
                      .doc(widget.memberId)
                      .collection('trips')
                      .doc(tripDoc.id)
                      .update({
                    'googleMiles': googleMiles,
                    'googleTotalEarning': googleTotalEarning,
                  });

                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Google Miles added successfully')),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error adding Google Miles: $e')),
                  );
                }
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _fetchAvailableTrucks() async {
    final querySnapshot = await FirebaseFirestore.instance
        .collection("Users")
        .doc(widget.memberId)
        .collection('Vehicles')
        .where('active', isEqualTo: true)
        .get();

    setState(() {
      availableTrucks = querySnapshot.docs
          .map((doc) => "${doc['companyName']} (${doc['vehicleNumber']})")
          .toList();
    });
  }

  initState() {
    super.initState();
    _fetchAvailableTrucks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.memberName}'s Trip"),
        actions: [
          CircleAvatar(
            radius: 20.r,
            backgroundColor: kPrimary,
            child: IconButton(
              onPressed: () {
                Get.to(() => AddTeamTripOwnerAndAccountant(
                      driverName: widget.memberName,
                      mId: widget.memberId,
                      teamRole: widget.teamRole,
                    ));
              },
              icon: Icon(Icons.add, color: kWhite),
            ),
          ),
          SizedBox(width: 10.w),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.only(left: 8.0, right: 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            icon: Icon(Icons.filter_list, color: kPrimary),
                            onPressed: () {
                              setState(() {
                                showFilterOptions = !showFilterOptions;
                              });
                            },
                          ),
                          if (fromDate != null ||
                              toDate != null ||
                              selectedTruck != null ||
                              searchTripName.isNotEmpty)
                            IconButton(
                              icon: Icon(Icons.clear, color: Colors.red),
                              onPressed: () {
                                setState(() {
                                  fromDate = null;
                                  toDate = null;
                                  selectedTruck = null;
                                  searchTripName = "";
                                });
                              },
                            ),
                        ],
                      ),
                      if (fromDate != null && toDate != null)
                        Text(
                          "${DateFormat('dd MMM yyyy').format(fromDate!)} - ${DateFormat('dd MMM yyyy').format(toDate!)}",
                          style: appStyle(14, kDark, FontWeight.w500),
                        ),
                    ],
                  ),
                  if (showFilterOptions) ...[
                    _buildFilterOptions(),
                    SizedBox(height: 10.h),
                  ],
                ],
              ),
            ),
            StreamBuilder(
              stream: FirebaseFirestore.instance
                  .collection("Users")
                  .doc(widget.memberId)
                  .collection('trips')
                  .where("currentUID", isEqualTo: widget.memberId)
                  .snapshots(),
              builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                if (!snapshot.hasData) return const CircularProgressIndicator();

                var filteredTrips = snapshot.data!.docs.where((doc) {
                  // Date filter
                  DateTime tripStartDate = doc['tripStartDate'].toDate();
                  DateTime tripEndDate = doc['tripEndDate'].toDate();

                  bool dateFilter = (fromDate == null ||
                          tripEndDate.isAfter(
                              fromDate!.subtract(const Duration(days: 1)))) &&
                      (toDate == null ||
                          tripStartDate.isBefore(
                                  toDate!.add(const Duration(days: 1))) &&
                              tripEndDate.isAfter(
                                  toDate!.subtract(const Duration(days: 1))));

                  // Truck filter
                  bool truckFilter = true;
                  if (selectedTruck != null) {
                    final truckInfo =
                        "${doc['companyName']} (${doc['vehicleNumber']})";
                    truckFilter = truckInfo == selectedTruck;
                  }

                  // Trip name filter
                  bool nameFilter = searchTripName.isEmpty ||
                      doc['tripName']
                          .toLowerCase()
                          .contains(searchTripName.toLowerCase());

                  return dateFilter && truckFilter && nameFilter;
                }).toList();

                // Apply sorting
                if (sortType == 'date') {
                  filteredTrips.sort((a, b) => a['tripStartDate']
                      .toDate()
                      .compareTo(b['tripStartDate'].toDate()));
                } else if (sortType == 'truck') {
                  filteredTrips.sort((a, b) {
                    final truckA =
                        "${a['companyName']} (${a['vehicleNumber']})";
                    final truckB =
                        "${b['companyName']} (${b['vehicleNumber']})";
                    return truckA.compareTo(truckB);
                  });
                } else if (sortType == 'tripname') {
                  filteredTrips
                      .sort((a, b) => a['tripName'].compareTo(b['tripName']));
                }

                if (filteredTrips.isEmpty) {
                  return Center(
                    child: Text(
                      "No trips found",
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.red),
                    ),
                  );
                }

                return Column(
                  children: [
                    FutureBuilder<Map<String, double>>(
                      future: calculateTotals(
                          filteredTrips,
                          widget.perMileCharge.toString(),
                          widget.memberId,
                          widget.teamRole),
                      builder: (context, totalsSnapshot) {
                        if (totalsSnapshot.connectionState ==
                            ConnectionState.waiting) {
                          return Padding(
                            padding: EdgeInsets.symmetric(vertical: 10.h),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        if (totalsSnapshot.hasError) {
                          return Text('Error calculating totals');
                        }
                        var totals = totalsSnapshot.data ??
                            {
                              'expenses': 0.0,
                              'earnings': 0.0,
                              'googleTotalEarning': 0.0
                            };
                        return Padding(
                          padding: EdgeInsets.symmetric(
                              vertical: 10.h, horizontal: 12.w),
                          child: widget.role == "Manager"
                              ? SizedBox()
                              : Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 12.w, vertical: 12.h),
                                      decoration: BoxDecoration(
                                          color: kSecondary.withOpacity(0.8),
                                          borderRadius:
                                              BorderRadius.circular(10)),
                                      child: Column(
                                        children: [
                                          Text(
                                            'Total Earnings',
                                            style: appStyle(
                                                13, kWhite, FontWeight.w500),
                                          ),
                                          Text(
                                              "\$${totals['googleTotalEarning']!.toStringAsFixed(0)}",
                                              style: appStyle(13, kWhite,
                                                  FontWeight.normal))
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 12.w, vertical: 12.h),
                                      decoration: BoxDecoration(
                                          color: kPrimary.withOpacity(0.8),
                                          borderRadius:
                                              BorderRadius.circular(10)),
                                      child: Column(
                                        children: [
                                          Text(
                                            'Total Expenses',
                                            style: appStyle(
                                                13, kWhite, FontWeight.w500),
                                          ),
                                          Text(
                                            "\$${totals['expenses']!.toStringAsFixed(0)}",
                                            style: appStyle(
                                                13, kWhite, FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 12.w, vertical: 12.h),
                                      decoration: BoxDecoration(
                                          color: kSecondary.withOpacity(0.8),
                                          borderRadius:
                                              BorderRadius.circular(10)),
                                      child: Column(
                                        children: [
                                          Text(
                                            'Total Paid',
                                            style: appStyle(
                                                13, kWhite, FontWeight.w500),
                                          ),
                                          Text("\$0",
                                              style: appStyle(13, kWhite,
                                                  FontWeight.normal))
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                        );
                      },
                    ),
                    ListView(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: filteredTrips.map((doc) {
                        bool isPaid = doc['isPaid'];
                        String formattedStartDate = DateFormat('dd MMM yyyy')
                            .format(doc['tripStartDate'].toDate());
                        String formattedEndDate = DateFormat('dd MMM yyyy')
                            .format(doc['tripEndDate'].toDate());

                        num tripStartMiles = doc['tripStartMiles'];
                        num tripEndMiles = doc['tripEndMiles'];
                        num totalMiles =
                            doc['tripEndMiles'] - doc['tripStartMiles'];
                        num perMileCharges =
                            num.parse(widget.perMileCharge.toString());
                        num earnings = totalMiles * perMileCharges;
                        String tripStatus =
                            getStringFromTripStatus(doc['tripStatus']);
                        String truckNameandNumber =
                            "${doc['vehicleNumber']} (${doc['companyName']})";
                        String trailerNameandNumber = doc['trailerId'] != null
                            ? "${doc['trailerNumber']} (${doc['trailerCompanyName']})"
                            : "N/A";
                        String vehicleID = doc['vehicleId'];
                        String loadValue = doc['loadType'];

                        return FutureBuilder<QuerySnapshot>(
                          future: FirebaseFirestore.instance
                              .collection("Users")
                              .doc(widget.memberId)
                              .collection('trips')
                              .doc(doc.id)
                              .collection('tripDetails')
                              .where('tripId', isEqualTo: doc.id)
                              .get(),
                          builder: (context, snapshot) {
                            if (snapshot.connectionState ==
                                ConnectionState.waiting) {
                              return Container(); // Prevents flickering UI while loading
                            }

                            // ✅ If tripDetails subcollection doesn't exist or is empty, hide "Total Expenses"
                            if (!snapshot.hasData ||
                                snapshot.data == null ||
                                snapshot.data!.docs.isEmpty) {
                              return buildTripCard(
                                doc,
                                formattedStartDate,
                                tripStartMiles,
                                tripStatus,
                                formattedEndDate,
                                tripEndMiles,
                                totalMiles,
                                earnings,
                                isPaid,
                                0,
                                truckNameandNumber,
                                trailerNameandNumber,
                                vehicleID,
                                loadValue,
                              );
                            }

                            // ✅ Sum all "amount" values ONLY if tripId matches
                            num totalExpenses = snapshot.data!.docs.fold(
                              0,
                              (sum, item) => sum + (item['amount'] ?? 0),
                            );

                            return buildTripCard(
                              doc,
                              formattedStartDate,
                              tripStartMiles,
                              tripStatus,
                              formattedEndDate,
                              tripEndMiles,
                              totalMiles,
                              earnings,
                              isPaid,
                              totalExpenses,
                              truckNameandNumber,
                              trailerNameandNumber,
                              vehicleID,
                              loadValue,
                            );
                          },
                        );
                      }).toList(),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Container buildTripCard(
    QueryDocumentSnapshot<Object?> doc,
    String formattedStartDate,
    num tripStartMiles,
    String tripStatus,
    String formattedEndDate,
    num tripEndMiles,
    num totalMiles,
    num earnings,
    bool isPaid,
    num totalExpenses,
    String truckNameandNumber,
    String trailerNameandNumber,
    String vehicleID,
    String loadType,
  ) {
    // // Check if google miles data exists
    bool hasGoogleMiles = doc['googleMiles'] != null;
    num googleMiles = hasGoogleMiles ? doc['googleMiles'] : 0;
    num googleTotalEarning = hasGoogleMiles ? doc['googleTotalEarning'] : 0;
    return Container(
      padding: EdgeInsets.all(5.w),
      margin: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: BorderRadius.circular(10.r),
        border: Border.all(color: kPrimary),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Text(doc['tripName'],
                style: appStyle(16, kDark, FontWeight.w500)),
          ),
          SizedBox(height: 10.h),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Truck: $truckNameandNumber",
                  style: appStyle(12, kDark, FontWeight.w300)),
              Text("Trailer: $trailerNameandNumber",
                  style: appStyle(12, kDark, FontWeight.w300)),
            ],
          ),
          SizedBox(height: 10.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Start Date: $formattedStartDate",
                  style: appStyle(12, kDark, FontWeight.w300)),
              Text("Start Miles: $tripStartMiles",
                  style: appStyle(12, kDark, FontWeight.w300)),
            ],
          ),
          SizedBox(height: 5.h),
          Row(
            children: [
              tripStatus != "Completed" ? Text("Trip Status: ") : Text(""),
              SizedBox(width: 5.w),
              if (tripStatus != 'Completed') ...[
                DropdownButton<String>(
                  value: tripStatus,
                  items: ['Started', 'Completed']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (value) async {
                    if (value != null) {
                      int newStatus = getIntFromTripStatus(value);

                      if (value == 'Completed') {
                        String? currentMilesStr = await showDialog<String>(
                          context: context,
                          builder: (BuildContext context) {
                            TextEditingController milesController =
                                TextEditingController();
                            return AlertDialog(
                              title: Text('Enter Trip End Miles'),
                              content: TextField(
                                controller: milesController,
                                keyboardType: TextInputType.number,
                                decoration:
                                    InputDecoration(labelText: 'Current Miles'),
                              ),
                              actions: <Widget>[
                                TextButton(
                                  child: Text('Cancel'),
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                ),
                                TextButton(
                                  child: Text('Submit'),
                                  onPressed: () {
                                    Navigator.of(context)
                                        .pop(milesController.text);
                                  },
                                ),
                              ],
                            );
                          },
                        );

                        if (currentMilesStr != null &&
                            currentMilesStr.isNotEmpty) {
                          int currentMiles = int.tryParse(currentMilesStr) ?? 0;

                          WriteBatch batch = FirebaseFirestore.instance.batch();

                          // **Update the current user's trip**
                          DocumentReference userTripRef = FirebaseFirestore
                              .instance
                              .collection("Users")
                              .doc(widget.memberId)
                              .collection('trips')
                              .doc(doc.id);

                          batch.update(userTripRef, {
                            'tripStatus': newStatus,
                            'tripEndMiles': currentMiles,
                            'tripEndDate': Timestamp.now(),
                            'updatedAt': Timestamp.now(),
                          });

                          // **Update the global trips collection**
                          DocumentReference globalTripRef = FirebaseFirestore
                              .instance
                              .collection('trips')
                              .doc(doc.id);

                          batch.update(globalTripRef, {
                            'tripStatus': newStatus,
                            'tripEndMiles': currentMiles,
                            'tripEndDate': Timestamp.now(),
                            'updatedAt': Timestamp.now(),
                          });

                          // **Find and update all assigned drivers' vehicles**
                          QuerySnapshot driverDocs = await FirebaseFirestore
                              .instance
                              .collection("Users")
                              .where("createdBy", isEqualTo: widget.ownerId)
                              .where("isDriver", isEqualTo: true)
                              .where("isTeamMember", isEqualTo: true)
                              .get();

                          for (var driverDoc in driverDocs.docs) {
                            String driverId = driverDoc.id;
                            DocumentReference driverVehicleRef =
                                FirebaseFirestore.instance
                                    .collection("Users")
                                    .doc(driverId)
                                    .collection("Vehicles")
                                    .doc(vehicleID);

                            // Check if the document exists before updating
                            DocumentSnapshot driverVehicleSnap =
                                await driverVehicleRef.get();
                            if (driverVehicleSnap.exists) {
                              batch.update(
                                  driverVehicleRef, {'tripAssign': false});
                            }

                            // **Update the driver's trip collection if the current user is not the driver**
                            if (driverId != widget.ownerId) {
                              DocumentReference driverTripRef =
                                  FirebaseFirestore.instance
                                      .collection("Users")
                                      .doc(driverId)
                                      .collection('trips')
                                      .doc(doc.id);

                              // Check if the trip exists in the driver's collection before updating
                              DocumentSnapshot driverTripSnap =
                                  await driverTripRef.get();
                              if (driverTripSnap.exists) {
                                batch.update(driverTripRef, {
                                  'tripStatus': newStatus,
                                  'tripEndMiles': currentMiles,
                                  'tripEndDate': Timestamp.now(),
                                  'updatedAt': Timestamp.now(),
                                });
                              }
                            }
                          }

                          // **Update the current user's vehicle to remove trip assignment**
                          DocumentReference currentUserVehicleRef =
                              FirebaseFirestore.instance
                                  .collection("Users")
                                  .doc(widget.memberId)
                                  .collection("Vehicles")
                                  .doc(vehicleID);

                          // Check if the document exists before updating
                          DocumentSnapshot currentUserVehicleSnap =
                              await currentUserVehicleRef.get();
                          if (currentUserVehicleSnap.exists) {
                            batch.update(
                                currentUserVehicleRef, {'tripAssign': false});
                          }

                          // **If the current user is a driver, update the owner's vehicle**
                          if (widget.role == "Driver") {
                            DocumentReference ownerVehicleRef =
                                FirebaseFirestore.instance
                                    .collection("Users")
                                    .doc(widget.ownerId)
                                    .collection("Vehicles")
                                    .doc(vehicleID);

                            // Check if the document exists before updating
                            DocumentSnapshot ownerVehicleSnap =
                                await ownerVehicleRef.get();
                            if (ownerVehicleSnap.exists) {
                              batch.update(
                                  ownerVehicleRef, {'tripAssign': false});
                            }

                            // Also update the owner's trip collection if needed
                            DocumentReference ownerTripRef = FirebaseFirestore
                                .instance
                                .collection("Users")
                                .doc(widget.ownerId)
                                .collection('trips')
                                .doc(doc.id);

                            // Check if the trip exists in the owner's collection before updating
                            DocumentSnapshot ownerTripSnap =
                                await ownerTripRef.get();
                            if (ownerTripSnap.exists) {
                              batch.update(ownerTripRef, {
                                'tripStatus': newStatus,
                                'tripEndMiles': currentMiles,
                                'tripEndDate': Timestamp.now(),
                                'updatedAt': Timestamp.now(),
                              });
                            }
                          }

                          await batch.commit();
                        } else {
                          showToastMessage(
                              "Warning", "Please enter current miles.", kRed);
                          return;
                        }
                      } else {
                        FirebaseFirestore.instance
                            .collection("Users")
                            .doc(widget.memberId)
                            .collection('trips')
                            .doc(doc.id)
                            .update({
                          'tripStatus': newStatus,
                          'updatedAt': Timestamp.now(),
                        });
                      }
                    }
                  },
                ),
              ] else
                ...[],
              Spacer(),
            ],
          ),
          if (tripStatus == "Completed") ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("End Date: $formattedEndDate"),
                Text("End Miles: $tripEndMiles"),
              ],
            ),
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Text("Earnings: \$${earnings.toStringAsFixed(0)}",
                //     style: appStyle(14, kSecondary, FontWeight.w500)),
                Text("Trip Miles: ${totalMiles.toStringAsFixed(0)}"),
              ],
            ),
            if (hasGoogleMiles) ...[
              widget.role == "Manager"
                  ? SizedBox()
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("G'Miles: ${googleMiles.toStringAsFixed(0)}",
                            style: appStyle(14, kPrimary, FontWeight.w500)),
                        Text(
                            "G'Earnings: \$${googleTotalEarning.toStringAsFixed(0)}",
                            style: appStyle(14, Colors.green, FontWeight.w500)),
                      ],
                    ),
            ],
            SizedBox(height: 5.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Expenses: \$${totalExpenses.toStringAsFixed(0)}",
                    style: appStyle(15, kPrimary, FontWeight.w500)),
              ],
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                Text(
                  "Load :",
                  style: appStyle(13, kPrimary, FontWeight.w400),
                ),
                Text(
                  "${loadType}",
                  style: appStyle(13, kPrimary, FontWeight.w400),
                )
              ],
            ),
            SizedBox(height: 5.h),
            Wrap(
              direction: Axis.horizontal,
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                isPaid
                    ?
                    // ElevatedButton(
                    //     style: ElevatedButton.styleFrom(
                    //       backgroundColor: kSecondary,
                    //       foregroundColor: kWhite,
                    //     ),
                    //     onPressed: null,
                    //     child: Text("Paid"))

                    SizedBox()
                    : widget.role == "Manager"
                        ? SizedBox()
                        : ElevatedButton(
                            onPressed: () {
                              showDialog(
                                  context: context,
                                  builder: (context) {
                                    return AlertDialog(
                                      title: Text('Payment'),
                                      content: Text("Are you sure to Pay ?",
                                          style: appStyle(
                                              17, kDark, FontWeight.normal)),
                                      actions: [
                                        TextButton(
                                          onPressed: () async {
                                            // await FirebaseFirestore.instance
                                            //     .collection("Users")
                                            //     .doc(widget.memberId)
                                            //     .collection('trips')
                                            //     .doc(doc.id)
                                            //     .update({
                                            //   'isPaid': true,
                                            // }).then((value) {
                                            //   Get.back();
                                            // }).catchError((error) {
                                            //   print(error);
                                            // });

                                            Navigator.pop(context);
                                            Get.to(() => ManageCheckScreen());
                                          },
                                          child: Text('Confirm'),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.pop(context);
                                          },
                                          child: Text('Cancel'),
                                        ),
                                      ],
                                    );
                                  });
                            },
                            child: Text(
                              "Pay",
                              style: appStyle(12, kWhite, FontWeight.normal),
                            ),
                            style: ElevatedButton.styleFrom(
                                minimumSize: Size(60, 40),
                                backgroundColor: kPrimary,
                                foregroundColor: kWhite)),
                // SizedBox(width: 10.w),
                // widget.role == "Manager"
                //     ? SizedBox()
                //     : ElevatedButton(
                //         onPressed: () => _showEditDialog(doc),
                //         child: Text("Edit",
                //             style: appStyle(12, kWhite, FontWeight.normal)),
                //         style: ElevatedButton.styleFrom(
                //             minimumSize: Size(60, 40),
                //             backgroundColor: Colors.orange,
                //             foregroundColor: kWhite),
                //       ),
                SizedBox(width: 10.w),
                (widget.role == "Accountant" || widget.role == "Owner")
                    ? ElevatedButton(
                        onPressed: () => _showGoogleMilesDialog(doc),
                        child: Text(
                          "Add Google Miles",
                          style: appStyle(12, kWhite, FontWeight.normal),
                        ),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary.withOpacity(0.8),
                            foregroundColor: kWhite),
                      )
                    : Container(),
                SizedBox(width: 10.w),
                ElevatedButton(
                  onPressed: () => Get.to(() => TripDetailsScreen(
                      docId: doc.id,
                      userId: widget.memberId,
                      tripName: doc['tripName'],
                      truckDetails:
                          doc['vehicleNumber'] + "(${doc['companyName']})",
                      trailerDetails: doc['trailerNumber'] +
                          "(${doc['trailerCompanyName']})")),
                  child: Text(
                    "View",
                    style: appStyle(12, kWhite, FontWeight.normal),
                  ),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: kSecondary, foregroundColor: kWhite),
                ),
              ],
            )
          ],
          widget.role == "Manager"
              ? SizedBox()
              : ElevatedButton(
                  onPressed: () => _showEditDialog(doc),
                  child: Text("Edit",
                      style: appStyle(12, kWhite, FontWeight.normal)),
                  style: ElevatedButton.styleFrom(
                      minimumSize: Size(60, 40),
                      backgroundColor: Colors.orange,
                      foregroundColor: kWhite),
                ),
        ],
      ),
    );
  }

  Widget _buildFilterOptions() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(12.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Filter & Sort", style: appStyle(16, kDark, FontWeight.bold)),
            SizedBox(height: 10.h),

            // Sort Type Selection
            Text("Sort By", style: appStyle(14, kDark, FontWeight.w500)),
            SizedBox(height: 5.h),
            Row(
              children: [
                ChoiceChip(
                  label: Text("Date"),
                  selected: sortType == 'date',
                  onSelected: (selected) {
                    setState(() {
                      sortType = selected ? 'date' : null;
                    });
                  },
                ),
                SizedBox(width: 8.w),
                ChoiceChip(
                  label: Text("Truck"),
                  selected: sortType == 'truck',
                  onSelected: (selected) {
                    setState(() {
                      sortType = selected ? 'truck' : null;
                    });
                  },
                ),
                SizedBox(width: 8.w),
                ChoiceChip(
                  label: Text("Trip Name"),
                  selected: sortType == 'tripname',
                  onSelected: (selected) {
                    setState(() {
                      sortType = selected ? 'tripname' : null;
                    });
                  },
                ),
              ],
            ),
            SizedBox(height: 15.h),

            // Date Range Picker
            if (sortType == 'date') ...[
              Text("Date Range", style: appStyle(14, kDark, FontWeight.w500)),
              SizedBox(height: 5.h),
              ElevatedButton(
                onPressed: _pickDateRange,
                child: Text("Select Date Range"),
              ),
              SizedBox(height: 15.h),
            ],

            // Truck Selection
            if (sortType == 'truck') ...[
              Text("Select Truck", style: appStyle(14, kDark, FontWeight.w500)),
              SizedBox(height: 5.h),
              DropdownButtonFormField<String>(
                value: selectedTruck,
                items: [
                  DropdownMenuItem(
                    value: null,
                    child: Text("All Trucks"),
                  ),
                  ...availableTrucks.map((truck) {
                    return DropdownMenuItem(
                      value: truck,
                      child: Text(truck),
                    );
                  }).toList(),
                ],
                onChanged: (value) {
                  setState(() {
                    selectedTruck = value;
                  });
                },
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 10.w),
                ),
              ),
              SizedBox(height: 15.h),
            ],

            // Trip Name Search
            if (sortType == 'tripname') ...[
              Text("Search Trip Name",
                  style: appStyle(14, kDark, FontWeight.w500)),
              SizedBox(height: 5.h),
              TextField(
                onChanged: (value) {
                  setState(() {
                    searchTripName = value;
                  });
                },
                decoration: InputDecoration(
                  hintText: "Enter trip name...",
                  border: OutlineInputBorder(),
                  suffixIcon: searchTripName.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear),
                          onPressed: () {
                            setState(() {
                              searchTripName = "";
                            });
                          },
                        )
                      : null,
                ),
              ),
            ],

            // Add this at the bottom of _buildFilterOptions()
            ElevatedButton(
              onPressed: () {
                setState(() {
                  fromDate = null;
                  toDate = null;
                  selectedTruck = null;
                  searchTripName = "";
                  sortType = null;
                });
              },
              child: Text("Reset All"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String getStringFromTripStatus(int status) {
    if (status == 0) {
      return 'Pending';
    } else if (status == 1) {
      return 'Started';
    } else if (status == 2) {
      return 'Completed';
    }
    return 'Pending';
  }

  int getIntFromTripStatus(String status) {
    if (status == 'Pending') {
      return 0;
    } else if (status == 'Started') {
      return 1;
    } else if (status == 'Completed') {
      return 2;
    }
    return 0;
  }
}
