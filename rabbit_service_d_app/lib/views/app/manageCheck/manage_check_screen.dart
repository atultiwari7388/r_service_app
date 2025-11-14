import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
// import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:flutter/services.dart' show rootBundle;
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/manageCheck/widgets/manage_check_numder_screen.dart';
import 'package:regal_service_d_app/views/app/myTeam/widgets/add_team_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ManageCheckScreen extends StatefulWidget {
  const ManageCheckScreen({super.key});

  @override
  State<ManageCheckScreen> createState() => _ManageCheckScreenState();
}

class _ManageCheckScreenState extends State<ManageCheckScreen> {
  final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  List<Map<String, dynamic>> _allMembers = [];
  bool _isLoading = true;
  String _errorMessage = '';
  late String role = "";
  String? _ownerId;

  // Add Check Dialog variables
  String? _selectedType;
  String? _selectedUserId;
  String? _selectedUserName;
  final List<Map<String, dynamic>> _serviceDetails = [];
  final TextEditingController _memoNumberController = TextEditingController();
  final TextEditingController _checkNumberController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  double _totalAmount = 0.0;
  bool isAnonymous = true;
  bool isProfileComplete = false;

  // For displaying checks
  List<Map<String, dynamic>> _checks = [];
  bool _loadingChecks = true;
  String? _filterType;
  DateTimeRange? _dateRange;

  // Check number management
  String? _currentCheckNumber;
  String? _nextCheckNumber;

  // Get effective user ID based on role
  // String get _effectiveUserId {
  //   return role == 'SubOwner' ? _ownerId! : currentUId;
  // }

  String get _effectiveUserId {
    final rolesThatUseOwnerId = ['SubOwner', 'Manager', 'Accountant'];
    return rolesThatUseOwnerId.contains(role) ? _ownerId! : currentUId;
  }

  @override
  void initState() {
    super.initState();
    fetchUserDetails().then((_) {
      fetchTeamMembersWithVehicles();
      fetchChecks();
      _fetchCurrentCheckNumber();
    });
  }

  Future<void> _fetchCurrentCheckNumber() async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId)
          .get();

      if (snapshot.exists) {
        setState(() {
          _currentCheckNumber = snapshot['currentCheckNumber'];
          _nextCheckNumber = _currentCheckNumber;
          if (_nextCheckNumber != null) {
            _checkNumberController.text = _nextCheckNumber.toString();
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching current check number: $e';
      });
    }
  }

  Future<String?> _getNextAvailableCheckNumber() async {
    if (_currentCheckNumber == null) return null;

    try {
      // Get all check series for the effective user
      QuerySnapshot seriesSnapshot = await FirebaseFirestore.instance
          .collection('CheckSeries')
          .where('userId', isEqualTo: _effectiveUserId) // Use effective user ID
          .get();

      // Get all checks from all series
      List<String> allCheckNumbers = [];
      for (var seriesDoc in seriesSnapshot.docs) {
        QuerySnapshot checksSnapshot = await FirebaseFirestore.instance
            .collection('CheckSeries')
            .doc(seriesDoc.id)
            .collection('Checks')
            .get();

        allCheckNumbers.addAll(checksSnapshot.docs.map((doc) {
          return doc['checkNumber'] as String;
        }));
      }

      // Sort the check numbers
      allCheckNumbers.sort((a, b) {
        String prefixA = a.replaceAll(RegExp(r'[0-9]'), '');
        String prefixB = b.replaceAll(RegExp(r'[0-9]'), '');

        if (prefixA != prefixB) return prefixA.compareTo(prefixB);

        int numA = int.parse(a.replaceAll(prefixA, ''));
        int numB = int.parse(b.replaceAll(prefixB, ''));
        return numA.compareTo(numB);
      });

      // Find the first unused check number
      for (var checkNumber in allCheckNumbers) {
        // Check if this check number is used in the Checks collection
        QuerySnapshot usedCheck = await FirebaseFirestore.instance
            .collection('Checks')
            .where('checkNumber', isEqualTo: checkNumber)
            .where('createdBy',
                isEqualTo: _effectiveUserId) // Use effective user ID
            .get();

        if (usedCheck.docs.isEmpty) {
          return checkNumber;
        }
      }

      return null; // No available check numbers
    } catch (e) {
      print('Error getting next check number: $e');
      return null;
    }
  }

  Future<void> _updateCheckNumberUsage(String checkNumber) async {
    try {
      // Find the check number in the CheckSeries subcollection and mark it as used
      QuerySnapshot seriesSnapshot = await FirebaseFirestore.instance
          .collection('CheckSeries')
          .where('userId', isEqualTo: _effectiveUserId) // Use effective user ID
          .get();

      for (var seriesDoc in seriesSnapshot.docs) {
        QuerySnapshot checksSnapshot = await FirebaseFirestore.instance
            .collection('CheckSeries')
            .doc(seriesDoc.id)
            .collection('Checks')
            .where('checkNumber', isEqualTo: checkNumber)
            .get();

        if (checksSnapshot.docs.isNotEmpty) {
          await FirebaseFirestore.instance
              .collection('CheckSeries')
              .doc(seriesDoc.id)
              .collection('Checks')
              .doc(checksSnapshot.docs.first.id)
              .update({
            'isUsed': true,
            'usedAt': FieldValue.serverTimestamp(),
            'usedBy': _effectiveUserId, // Use effective user ID
          });
          break;
        }
      }

      // Update the current check number in user document
      await FirebaseFirestore.instance
          .collection('Users')
          .doc(_effectiveUserId) // Use effective user ID
          .update({'currentCheckNumber': checkNumber});
    } catch (e) {
      print('Error updating check number usage: $e');
    }
  }

  Future<void> fetchChecks() async {
    try {
      Query query = FirebaseFirestore.instance
          .collection('Checks')
          .where('createdBy',
              isEqualTo: _effectiveUserId) // Use effective user ID
          .orderBy('date', descending: true);

      if (_filterType != null) {
        query = query.where('type', isEqualTo: _filterType);
      }

      if (_dateRange != null) {
        query = query
            .where('date', isGreaterThanOrEqualTo: _dateRange!.start)
            .where('date', isLessThanOrEqualTo: _dateRange!.end);
      }

      QuerySnapshot snapshot = await query.get();

      setState(() {
        _checks = snapshot.docs.map((doc) {
          Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
          return {
            'id': doc.id,
            ...data,
            'date': (data['date'] as Timestamp).toDate(),
          };
        }).toList();
        _loadingChecks = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading checks: $e';
        _loadingChecks = false;
      });
    }
  }

  Future<void> _printCheck(Map<String, dynamic> check) async {
    // Fetch user address
    String streetLine = '';
    String cityStateLine = '';
    String countryZipLine = '';

    try {
      DocumentSnapshot userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(check['userId'])
          .get();

      if (userSnapshot.exists) {
        final userData = userSnapshot.data() as Map<String, dynamic>;
        String street = userData['address'] ?? userData['street'] ?? '';
        String city = userData['city'] ?? '';
        String state = userData['state'] ?? '';
        String zipCode = userData['zipCode'] ?? userData['zip'] ?? '';
        String country = userData['country'] ?? '';

        // First line: Street address
        if (street.isNotEmpty) streetLine = street.toUpperCase();

        // Second line: City, State
        List<String> cityStateParts = [];
        if (city.isNotEmpty) cityStateParts.add(city.toUpperCase());
        if (state.isNotEmpty) cityStateParts.add(state.toUpperCase());
        cityStateLine = cityStateParts.join(', ');

        // Third line: Country, Zip Code
        List<String> countryZipParts = [];
        if (country.isNotEmpty) countryZipParts.add(country.toUpperCase());
        if (zipCode.isNotEmpty) countryZipParts.add(zipCode.toUpperCase());
        countryZipLine = countryZipParts.join(', ');
      }
    } catch (e) {
      print('Error fetching user address: $e');
    }

    final pdf = pw.Document();
    final universeFont =
        pw.Font.ttf(await rootBundle.load('assets/font/UniversRegular.ttf'));
    final universeBoldFont =
        pw.Font.ttf(await rootBundle.load('assets/font/UniversBold.ttf'));

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Container(
            margin: pw.EdgeInsets.only(top: -10),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.SizedBox(height: 8),
                // Date row
                pw.Row(
                  children: [
                    pw.Text(""),
                    pw.Spacer(),
                    pw.SizedBox(width: 450),
                    pw.Text(
                      DateFormat('MM/dd/yyyy').format(check['date']),
                      style: pw.TextStyle(fontSize: 10, font: universeFont),
                    ),
                  ],
                ),
                pw.SizedBox(height: 30),

                // Payee Name (in CAPITAL)
                pw.Container(
                  margin: pw.EdgeInsets.only(top: -5),
                  child: pw.Row(
                    children: [
                      pw.SizedBox(width: 5),
                      pw.Text(
                        check['userName'].toString().toUpperCase(),
                        style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.normal,
                            font: universeFont),
                      ),
                      pw.Spacer(),
                      pw.SizedBox(width: 410),
                      pw.Text(
                        '**${check['totalAmount'].toStringAsFixed(2)}',
                        style: pw.TextStyle(fontSize: 10, font: universeFont),
                      ),
                      // pw.SizedBox(width: 30),
                    ],
                  ),
                ),
                pw.SizedBox(height: 15),

                pw.Container(
                  margin: pw.EdgeInsets.only(left: -18, top: -5),
                  child: pw.Text(
                    "****${_amountToWords(check['totalAmount'])}***********",
                    style: pw.TextStyle(fontSize: 10, font: universeFont),
                  ),
                ),
                pw.SizedBox(height: 20),

                // Payee Address - Now in 3 lines
                if (streetLine.isNotEmpty)
                  pw.Container(
                    margin: pw.EdgeInsets.only(left: -15),
                    child: pw.Text(
                      streetLine,
                      style: pw.TextStyle(fontSize: 10, font: universeFont),
                    ),
                  ),

                if (cityStateLine.isNotEmpty)
                  pw.Container(
                    margin: pw.EdgeInsets.only(left: -15),
                    child: pw.Text(
                      cityStateLine,
                      style: pw.TextStyle(fontSize: 10, font: universeFont),
                    ),
                  ),

                if (countryZipLine.isNotEmpty)
                  pw.Container(
                    margin: pw.EdgeInsets.only(left: -15),
                    child: pw.Text(
                      countryZipLine,
                      style: pw.TextStyle(fontSize: 10, font: universeFont),
                    ),
                  ),

                // Adjust spacing based on which address lines are present
                pw.SizedBox(
                    height: _calculateAddressHeight(
                        streetLine, cityStateLine, countryZipLine)),

                // Memo number with negative margin
                if (check['memoNumber'] != null)
                  pw.Container(
                    margin: pw.EdgeInsets.only(left: -15),
                    child: pw.Text(
                      '${check['memoNumber']}',
                      style: pw.TextStyle(fontSize: 11, font: universeFont),
                    ),
                  ),

                pw.SizedBox(height: 65),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      check['userName'].toString().toUpperCase(),
                      style: pw.TextStyle(
                          fontSize: 11,
                          fontWeight: pw.FontWeight.normal,
                          font: universeFont),
                    ),
                    pw.Text(
                      DateFormat('MM/dd/yyyy').format(check['date']),
                      style: pw.TextStyle(fontSize: 15, font: universeFont),
                    ),
                  ],
                ),
                pw.SizedBox(height: 10),
                ...check['serviceDetails'].map<pw.Widget>((detail) {
                  return pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        detail['serviceName'],
                        style: pw.TextStyle(fontSize: 13, font: universeFont),
                      ),
                      pw.Text(
                        '\$${detail['amount'].toStringAsFixed(2)}',
                        style: pw.TextStyle(fontSize: 13, font: universeFont),
                      ),
                    ],
                  );
                }).toList(),
                pw.SizedBox(height: 20),
                pw.Row(children: [
                  pw.Spacer(),
                  pw.Text(
                    '\$${check['totalAmount'].toStringAsFixed(2)}',
                    style: pw.TextStyle(
                        fontSize: 13,
                        fontWeight: pw.FontWeight.normal,
                        font: universeFont),
                  ),
                ]),

                //duplicate section
                pw.SizedBox(height: 140),
                // pw.Divider(thickness: 1),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      check['userName'].toString().toUpperCase(),
                      style: pw.TextStyle(
                          fontSize: 13,
                          fontWeight: pw.FontWeight.normal,
                          font: universeFont),
                    ),
                    pw.Text(
                      DateFormat('MM/dd/yyyy').format(check['date']),
                      style: pw.TextStyle(fontSize: 15, font: universeFont),
                    ),
                  ],
                ),
                pw.SizedBox(height: 10),
                ...check['serviceDetails'].map<pw.Widget>((detail) {
                  return pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        detail['serviceName'],
                        style: pw.TextStyle(fontSize: 13, font: universeFont),
                      ),
                      pw.Text(
                        '\$${detail['amount'].toStringAsFixed(2)}',
                        style: pw.TextStyle(fontSize: 13, font: universeFont),
                      ),
                    ],
                  );
                }).toList(),
                pw.SizedBox(height: 20),
                pw.Row(children: [
                  pw.Spacer(),
                  pw.Text(
                    '\$${check['totalAmount'].toStringAsFixed(2)}',
                    style: pw.TextStyle(
                        fontSize: 13,
                        fontWeight: pw.FontWeight.normal,
                        font: universeFont),
                  ),
                ]),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  // Helper function to calculate appropriate spacing based on address lines
  double _calculateAddressHeight(
      String street, String cityState, String countryZip) {
    int lineCount = 0;
    if (street.isNotEmpty) lineCount++;
    if (cityState.isNotEmpty) lineCount++;
    if (countryZip.isNotEmpty) lineCount++;

    // Adjust this value based on your layout needs
    if (lineCount == 0) return 15;
    if (lineCount == 1) return 25;
    if (lineCount == 2) return 15;
    return 10; // for 3 lines
  }

  String _amountToWords(num amount) {
    final wholePart = amount.floor();
    final decimalPart = ((amount - wholePart) * 100).round();

    String wholeWords = _numberToWords(wholePart);

    // Format decimal part as fraction (e.g., "82/100")
    String decimalFraction = '${decimalPart.toString().padLeft(2, '0')}/100';

    return '$wholeWords and $decimalFraction********';
  }

  String _numberToWords(int number) {
    if (number == 0) return 'Zero';

    final units = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine'
    ];
    final teens = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ];
    final tens = [
      '',
      'Ten',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety'
    ];

    String words = '';

    if ((number / 1000).floor() > 0) {
      words += _numberToWords((number / 1000).floor()) + ' Thousand ';
      number %= 1000;
    }

    if ((number / 100).floor() > 0) {
      words += _numberToWords((number / 100).floor()) + ' Hundred ';
      number %= 100;
    }

    if (number > 0) {
      if (number < 10) {
        words += units[number];
      } else if (number < 20) {
        words += teens[number - 10];
      } else {
        words += tens[(number / 10).floor()];
        if ((number % 10) > 0) {
          words += ' ' + units[number % 10];
        }
      }
    }

    return words.trim();
  }

  Widget _buildCheckCard(Map<String, dynamic> check) {
    return Card(
      elevation: 4,
      margin: EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Check #${check['checkNumber']}',
                  style: appStyle(16, kPrimary, FontWeight.bold),
                ),
                Text(
                  DateFormat('MMM dd, yyyy').format(check['date']),
                  style: appStyle(14, kGray, FontWeight.normal),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Paid To: ${check['userName']} (${check['type']})',
              style: appStyle(14, kDark, FontWeight.w600),
            ),
            SizedBox(height: 8),
            Divider(),
            ...check['serviceDetails'].map<Widget>((detail) {
              return Padding(
                padding: EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      detail['serviceName'],
                      style: appStyle(14, kDark, FontWeight.normal),
                    ),
                    Text(
                      '\$${detail['amount'].toStringAsFixed(2)}',
                      style: appStyle(14, kDark, FontWeight.normal),
                    ),
                  ],
                ),
              );
            }).toList(),
            Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TOTAL:',
                  style: appStyle(16, kDark, FontWeight.bold),
                ),
                Text(
                  '\$${check['totalAmount'].toStringAsFixed(2)}',
                  style: appStyle(16, kPrimary, FontWeight.bold),
                ),
              ],
            ),
            SizedBox(height: 8),
            if (check['memoNumber'] != null)
              Text(
                'Memo: ${check['memoNumber']}',
                style: appStyle(12, kGray, FontWeight.normal),
              ),
            SizedBox(height: 8),
            // if (_canManageChecks) // Only show print button if user can manage checks
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: Icon(Icons.print, color: kPrimary),
                  onPressed: () => _printCheck(check),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: 'Filter by Type',
                labelStyle: appStyle(14, kDark, FontWeight.normal),
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              value: _filterType,
              items: [
                DropdownMenuItem(value: null, child: Text('All Types')),
                ...['Manager', 'Accountant', 'Driver', 'Vendor', 'Other Staff']
                    .map((type) => DropdownMenuItem(
                          value: type,
                          child: Text(type),
                        ))
                    .toList(),
              ],
              onChanged: (value) {
                setState(() {
                  _filterType = value;
                  _loadingChecks = true; // Show loading immediately
                });
                fetchChecks(); // Fetch checks with new filter
              },
            ),
          ),
          SizedBox(width: 8),
          if (role == "Owner" || role == "SubOwner")
            GestureDetector(
                onTap: () =>
                    Get.to(() => AddTeamMember(currentUId: currentUId)),
                child: CircleAvatar(
                    backgroundColor: kPrimary,
                    radius: 20.r,
                    child: Icon(Icons.add, color: kWhite))),
          SizedBox(width: 8),
          IconButton(
            icon: Icon(Icons.calendar_today, color: kPrimary),
            onPressed: () async {
              final DateTimeRange? picked = await showDateRangePicker(
                context: context,
                firstDate: DateTime(2000),
                lastDate: DateTime(2100),
                initialDateRange: _dateRange ??
                    DateTimeRange(
                      start: DateTime.now().subtract(Duration(days: 30)),
                      end: DateTime.now(),
                    ),
              );

              if (picked != null) {
                setState(() {
                  _dateRange = picked;
                  _loadingChecks = true;
                });
                await fetchChecks();
              }
            },
          ),
          if (_dateRange != null)
            IconButton(
              icon: Icon(Icons.clear, color: Colors.red),
              onPressed: () async {
                setState(() {
                  _dateRange = null;
                  _loadingChecks = true; // Show loading immediately
                });
                await fetchChecks();
              },
            ),
        ],
      ),
    );
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
          _ownerId = userData["createdBy"]?.toString() ?? currentUId;
        });
      } else {
        setState(() {
          _errorMessage = 'User not found';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching user details: $e';
      });
    }
  }

  Future<void> fetchTeamMembersWithVehicles() async {
    try {
      List<Map<String, dynamic>> membersWithVehicles = [];

      QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy',
              isEqualTo: _effectiveUserId) // Use effective user ID
          .where('uid', isNotEqualTo: _effectiveUserId) // Use effective user ID
          .where("active", isEqualTo: true)
          .get();

      for (var member in teamSnapshot.docs) {
        String memberId = member['uid'];
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
            'companyName': doc['companyName'] ?? 'No Company',
            'vehicleNumber': doc['vehicleNumber'] ?? 'No Number'
          };
        }).toList();

        vehicles.sort((a, b) => a['vehicleNumber']
            .toString()
            .toLowerCase()
            .compareTo(b['vehicleNumber'].toString().toLowerCase()));

        membersWithVehicles.add({
          'name': name,
          'email': email,
          'isActive': isActive,
          'memberId': memberId,
          'ownerId': member['createdBy'],
          'vehicles': vehicles,
          'perMileCharge': member['perMileCharge'],
          'role': member['role']
        });
      }

      setState(() {
        _allMembers = membersWithVehicles;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading team members: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _showAddCheckDialog() async {
    _selectedType = null;
    _selectedUserId = null;
    _selectedUserName = null;
    _serviceDetails.clear();
    _memoNumberController.clear();
    _selectedDate = DateTime.now();
    _totalAmount = 0.0;

    // Get the next available check number
    String? nextCheckNumber = await _getNextAvailableCheckNumber();
    if (nextCheckNumber != null) {
      _checkNumberController.text = nextCheckNumber;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                'No available check numbers. Please add a check series first.')),
      );
      return;
    }

    await showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text('Write Check',
                  style: appStyle(18, kDark, FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // if (role == 'SubOwner')
                    //   Container(
                    //     width: double.infinity,
                    //     padding: EdgeInsets.all(8),
                    //     decoration: BoxDecoration(
                    //       color: Colors.blue[50],
                    //       borderRadius: BorderRadius.circular(4),
                    //     ),
                    //     child: Row(
                    //       children: [
                    //         Icon(Icons.info_outline,
                    //             color: Colors.blue, size: 16),
                    //         SizedBox(width: 8),
                    //         Expanded(
                    //           child: Text(
                    //             'Writing check on behalf of owner',
                    //             style: TextStyle(
                    //               fontSize: 12,
                    //               color: Colors.blue[700],
                    //             ),
                    //           ),
                    //         ),
                    //       ],
                    //     ),
                    //   ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _checkNumberController,
                      decoration: InputDecoration(
                        labelText: 'Check Number',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                      readOnly: true,
                    ),
                    SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Select Type',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                      value: _selectedType,
                      items: <String>[
                        'Manager',
                        'Accountant',
                        'Driver',
                        'Vendor',
                        'Other Staff'
                      ]
                          .map<DropdownMenuItem<String>>(
                              (String type) => DropdownMenuItem<String>(
                                    value: type,
                                    child: Text(type),
                                  ))
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value;
                          _selectedUserId = null;
                          _selectedUserName = null;
                        });
                      },
                      validator: (value) => value == null ? 'Required' : null,
                    ),
                    SizedBox(height: 16),
                    if (_selectedType != null)
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: 'Select Name',
                          labelStyle: appStyle(14, kDark, FontWeight.normal),
                          border: OutlineInputBorder(),
                        ),
                        value: _selectedUserId,
                        items: _allMembers
                            .where((member) => member['role'] == _selectedType)
                            .map<DropdownMenuItem<String>>(
                                (member) => DropdownMenuItem<String>(
                                      value: member['memberId'],
                                      child: Text(member['name']),
                                    ))
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedUserId = value;
                            _selectedUserName = _allMembers.firstWhere(
                                (member) =>
                                    member['memberId'] == value)['name'];
                          });
                        },
                        validator: (value) => value == null ? 'Required' : null,
                      ),
                    SizedBox(height: 16),
                    if (_selectedUserId != null)
                      Column(
                        children: [
                          CustomButton(
                            text: "Add Detail",
                            onPress: () {
                              _showAddDetailDialog(context, setState);
                            },
                            color: kPrimary,
                          ),
                          SizedBox(height: 16),
                        ],
                      ),
                    if (_serviceDetails.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Service Details:',
                              style: appStyle(14, kDark, FontWeight.bold)),
                          SizedBox(height: 8),
                          ..._serviceDetails.map((detail) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${detail['serviceName']}: \$${detail['amount']}',
                                      style: appStyle(
                                          12, kDark, FontWeight.normal),
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.delete, color: Colors.red),
                                    onPressed: () {
                                      setState(() {
                                        _serviceDetails.remove(detail);
                                        _calculateTotal();
                                      });
                                    },
                                  ),
                                ],
                              ),
                            );
                          }),
                          SizedBox(height: 8),
                          Divider(),
                          Text('Total: \$$_totalAmount',
                              style: appStyle(14, kDark, FontWeight.bold)),
                          SizedBox(height: 16),
                        ],
                      ),
                    TextField(
                      controller: _memoNumberController,
                      decoration: InputDecoration(
                        labelText: 'Memo Number (Optional)',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),
                    Row(
                      children: [
                        Text('Date: ',
                            style: appStyle(14, kDark, FontWeight.normal)),
                        TextButton(
                          onPressed: () async {
                            final DateTime? picked = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null && picked != _selectedDate) {
                              setState(() {
                                _selectedDate = picked;
                              });
                            }
                          },
                          child: Text(
                            DateFormat('MM/dd/yyyy').format(_selectedDate),
                            style: appStyle(14, kPrimary, FontWeight.normal),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Cancel',
                      style: appStyle(14, kDark, FontWeight.normal)),
                ),
                ElevatedButton(
                  onPressed: _serviceDetails.isEmpty ? null : _saveCheck,
                  style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
                  child: Text('Save',
                      style: appStyle(14, kWhite, FontWeight.normal)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAddDetailDialog(BuildContext context, StateSetter setState) {
    final TextEditingController serviceNameController = TextEditingController();
    final TextEditingController amountController = TextEditingController();

    bool isDriver = _selectedType == 'Driver';
    List<Map<String, dynamic>> unpaidTrips = [];
    double driverUnpaidTotal = 0.0;

    if (isDriver) {
      FirebaseFirestore.instance
          .collection('Users')
          .doc(_selectedUserId)
          .collection('trips')
          .where('isPaid', isEqualTo: false)
          .get()
          .then((querySnapshot) {
        unpaidTrips = querySnapshot.docs.map((doc) {
          return {
            'id': doc.id,
            'tripName': doc['tripName'] ?? 'Unnamed Trip',
            'oEarnings': doc['oEarnings'] ?? 0.0,
          };
        }).toList();

        driverUnpaidTotal = unpaidTrips.fold(
            0.0, (sum, trip) => sum + (trip['oEarnings'] as num).toDouble());

        setState(() {
          amountController.text = driverUnpaidTotal.toStringAsFixed(2);
        });
      });
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Add Service Detail',
              style: appStyle(16, kDark, FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: serviceNameController,
                  decoration: InputDecoration(
                    labelText: 'Enter Service Name',
                    labelStyle: appStyle(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 16),
                if (isDriver)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Unpaid Trips:',
                          style: appStyle(12, kDark, FontWeight.bold)),
                      ...unpaidTrips.map((trip) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Text(
                              '${trip['tripName']}: \$${(trip['oEarnings'] as num).toStringAsFixed(2)}',
                              style: appStyle(12, kDark, FontWeight.normal),
                            ),
                          )),
                      SizedBox(height: 8),
                      Text(
                          'Total Unpaid Amount: \$${driverUnpaidTotal.toStringAsFixed(2)}',
                          style: appStyle(12, kDark, FontWeight.bold)),
                      SizedBox(height: 16),
                    ],
                  ),
                TextField(
                    controller: amountController,
                    decoration: InputDecoration(
                      labelText: 'Enter Amount',
                      labelStyle: appStyle(14, kDark, FontWeight.normal),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    enabled: true),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child:
                  Text('Cancel', style: appStyle(14, kDark, FontWeight.normal)),
            ),
            ElevatedButton(
              onPressed: () {
                if (serviceNameController.text.isEmpty ||
                    amountController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please fill all fields')),
                  );
                  return;
                }

                setState(() {
                  _serviceDetails.add({
                    'serviceName': serviceNameController.text,
                    'amount': double.parse(amountController.text),
                  });
                  _calculateTotal();
                });

                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
              child:
                  Text('Add', style: appStyle(14, kWhite, FontWeight.normal)),
            ),
          ],
        );
      },
    );
  }

  void _calculateTotal() {
    _totalAmount = _serviceDetails.fold(
        0.0, (sum, detail) => sum + (detail['amount'] as num).toDouble());
  }

  Future<void> _saveCheck() async {
    if (_selectedUserId == null || _serviceDetails.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    try {
      String checkNumber = _checkNumberController.text;

      // Create check document
      await FirebaseFirestore.instance.collection('Checks').add({
        'checkNumber': checkNumber,
        'type': _selectedType,
        'userId': _selectedUserId,
        'userName': _selectedUserName,
        'serviceDetails': _serviceDetails,
        'totalAmount': _totalAmount,
        'memoNumber': _memoNumberController.text.isEmpty
            ? null
            : _memoNumberController.text,
        'date': _selectedDate,
        'createdBy': _effectiveUserId,
        'createdByUser': currentUId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // MARK CHECK NUMBER AS USED
      await _updateCheckNumberUsage(checkNumber);

      final userDoc = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_selectedUserId!)
          .get();
      final currentWallet =
          (userDoc.data()?['wallet'] as num?)?.toDouble() ?? 0.0;
      final newWalletBalance = currentWallet + _totalAmount;

      await userDoc.reference.update({'wallet': newWalletBalance});
      if (_selectedType == 'Driver') {
        final querySnapshot = await FirebaseFirestore.instance
            .collection('Users')
            .doc(_selectedUserId)
            .collection('trips')
            .where('isPaid', isEqualTo: false)
            .get();

        final batch = FirebaseFirestore.instance.batch();
        for (final doc in querySnapshot.docs) {
          batch.update(doc.reference, {'isPaid': true});
        }
        await batch.commit();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Check saved successfully')),
      );

      Navigator.of(context).pop();
      await fetchChecks();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving check: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: kWhite),
        title: Text(
          'Manage Checks',
          style: appStyle(18, kWhite, FontWeight.normal),
        ),
        actions: (isAnonymous == true && isProfileComplete == false)
            ? []
            : [
                IconButton(
                  icon: Icon(Icons.numbers),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ManageCheckNumbersScreen(
                            currentUId: _effectiveUserId),
                      ),
                    );
                  },
                ),
              ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CustomButton(
                text: "Write Check",
                onPress: _showAddCheckDialog,
                color: kPrimary,
              ),
              const SizedBox(height: 16),
              _buildFilterRow(),
              // if (role == "Owner" || role == "SubOwner")
              //   GestureDetector(
              //       onTap: () =>
              //           Get.to(() => AddTeamMember(currentUId: currentUId)),
              //       child: CircleAvatar(radius: 20.r, child: Icon(Icons.add))),
              if (_dateRange != null)
                Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Showing checks from ${DateFormat('MMM dd, yyyy').format(_dateRange!.start)} to ${DateFormat('MMM dd, yyyy').format(_dateRange!.end)}',
                    style: appStyle(12, kGray, FontWeight.normal),
                  ),
                ),
              if (_loadingChecks)
                Center(child: CircularProgressIndicator())
              else if (_checks.isEmpty)
                Center(
                  child: Text(
                    'No checks found',
                    style: appStyle(16, kGray, FontWeight.normal),
                  ),
                )
              else
                Column(
                  children:
                      _checks.map((check) => _buildCheckCard(check)).toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
