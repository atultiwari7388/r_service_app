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
  final String? initialType;
  final String? initialPayee;
  final String? initialUserId;
  final double? initialTotalAmount;
  final List<Map<String, dynamic>>? initialServiceDetails;
  final List<Map<String, dynamic>>? attachedInvoices;
  final bool autoOpenWriteCheck;

  const ManageCheckScreen({
    super.key,
    this.initialType,
    this.initialPayee,
    this.initialUserId,
    this.initialTotalAmount,
    this.initialServiceDetails,
    this.attachedInvoices,
    this.autoOpenWriteCheck = false,
  });

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

  String get _effectiveUserId {
    final rolesThatUseOwnerId = ['SubOwner', 'Manager', 'Accountant'];
    return rolesThatUseOwnerId.contains(role) ? _ownerId! : currentUId;
  }

  // Edit Check variables
  bool _isEditing = false;
  String? _editingCheckId;
  String? _editingCheckNumber;
  bool _isPreparingAutoCheck = false;
  bool _isSavingCheck = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoOpenWriteCheck) {
      _isPreparingAutoCheck = true;
    }
    if (widget.initialPayee != null && widget.initialUserId != null) {
      _allMembers.add(<String, dynamic>{
        'name': widget.initialPayee!,
        'memberId': widget.initialUserId!,
        'role': widget.initialType ?? 'Vendor',
        'vehicles': <Map<String, dynamic>>[],
      });
    }
    fetchUserDetails().then((_) {
      _fetchCurrentCheckNumber().then((_) {
        if (widget.autoOpenWriteCheck) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _showAddCheckDialog();
          });
        }
      });
      fetchTeamMembersWithVehicles();
      fetchChecks();
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
          .where('userId', isEqualTo: _effectiveUserId)
          .get();

      // Parallel fetch checks from all series
      List<String> allCheckNumbers = [];
      final checksSnapshots = await Future.wait(
        seriesSnapshot.docs.map((seriesDoc) {
          return FirebaseFirestore.instance
              .collection('CheckSeries')
              .doc(seriesDoc.id)
              .collection('Checks')
              .get();
        }),
      );

      for (var checksSnapshot in checksSnapshots) {
        allCheckNumbers.addAll(checksSnapshot.docs.map((doc) {
          return doc['checkNumber'] as String;
        }));
      }

      if (allCheckNumbers.isEmpty) return null;

      // Sort the check numbers
      allCheckNumbers.sort((a, b) {
        String prefixA = a.replaceAll(RegExp(r'[0-9]'), '');
        String prefixB = b.replaceAll(RegExp(r'[0-9]'), '');

        if (prefixA != prefixB) return prefixA.compareTo(prefixB);

        int numA = int.tryParse(a.replaceAll(prefixA, '')) ?? 0;
        int numB = int.tryParse(b.replaceAll(prefixB, '')) ?? 0;
        return numA.compareTo(numB);
      });

      // Query all used check numbers in a SINGLE fast query instead of looping roundtrips
      QuerySnapshot usedChecksSnapshot = await FirebaseFirestore.instance
          .collection('Checks')
          .where('createdBy', isEqualTo: _effectiveUserId)
          .get();

      final Set<String> usedCheckNumbers = usedChecksSnapshot.docs
          .map((doc) => doc['checkNumber']?.toString() ?? '')
          .where((num) => num.isNotEmpty)
          .toSet();

      // Find the first unused check number
      for (var checkNumber in allCheckNumbers) {
        if (!usedCheckNumbers.contains(checkNumber)) {
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

    final rawDetails = (check['serviceDetails'] as List?) ?? [];
    final activeDetails = rawDetails.where((detail) {
      final name = (detail['serviceName'] ?? '').toString().trim();
      final amount = detail['amount'];
      return name.isNotEmpty || (amount != null && amount != 0);
    }).toList();

    final printableDetails = activeDetails.length > 1
        ? [
            {
              'serviceName': activeDetails[0]['serviceName']
                          ?.toString()
                          .trim()
                          .isNotEmpty ==
                      true
                  ? activeDetails[0]['serviceName']
                  : 'Payment for ${activeDetails.length} Invoices',
              'amount': check['totalAmount'],
            }
          ]
        : activeDetails.isNotEmpty
            ? activeDetails
            : [
                {'serviceName': '', 'amount': check['totalAmount']}
              ];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Transform.translate(
            offset: const PdfPoint(0, -10),
            child: pw.Container(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.SizedBox(height: 6),
                  // Date row
                  pw.Row(
                    children: [
                      pw.Text(""),
                      pw.Spacer(),
                      pw.SizedBox(width: 450),
                      pw.Text(
                        DateFormat('MM/dd/yyyy').format(check['date']),
                        style: pw.TextStyle(fontSize: 11, font: universeFont),
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
                              fontSize: 11,
                              fontWeight: pw.FontWeight.normal,
                              font: universeFont),
                        ),
                        pw.Spacer(),
                        pw.SizedBox(width: 410),
                        pw.Text(
                          '**${check['totalAmount'] != null ? NumberFormat("#,##0.00", "en_US").format(check['totalAmount']) : "0.00"}',
                          style: pw.TextStyle(fontSize: 11, font: universeFont),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 15),

                  pw.Container(
                    margin: pw.EdgeInsets.only(left: -18, top: -5),
                    child: pw.Text(
                      "****${_amountToWords(check['totalAmount'])}***********",
                      style: pw.TextStyle(fontSize: 11, font: universeFont),
                    ),
                  ),
                  pw.SizedBox(height: 20),

                  // Payee Address - Now in 3 lines
                  if (streetLine.isNotEmpty)
                    pw.Container(
                      margin: pw.EdgeInsets.only(left: -15),
                      child: pw.Text(
                        streetLine,
                        style: pw.TextStyle(fontSize: 11, font: universeFont),
                      ),
                    ),

                  if (cityStateLine.isNotEmpty)
                    pw.Container(
                      margin: pw.EdgeInsets.only(left: -15),
                      child: pw.Text(
                        cityStateLine,
                        style: pw.TextStyle(fontSize: 11, font: universeFont),
                      ),
                    ),

                  if (countryZipLine.isNotEmpty)
                    pw.Container(
                      margin: pw.EdgeInsets.only(left: -15),
                      child: pw.Text(
                        countryZipLine,
                        style: pw.TextStyle(fontSize: 11, font: universeFont),
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

                  pw.SizedBox(height: 85),
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
                  ...printableDetails.map<pw.Widget>((detail) {
                    final numberFormat = NumberFormat("#,##0.00", "en_US");
                    final formattedTotal = numberFormat.format(
                        detail['amount'] != null ? detail['amount'] : 0);
                    return pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          detail['serviceName'],
                          style: pw.TextStyle(fontSize: 13, font: universeFont),
                        ),
                        pw.Text(
                          '\$${formattedTotal}',
                          style: pw.TextStyle(fontSize: 13, font: universeFont),
                        ),
                      ],
                    );
                  }).toList(),
                  pw.SizedBox(height: 20),
                  pw.Row(children: [
                    pw.Spacer(),
                    pw.Text(
                      '\$${check['totalAmount'] != null ? NumberFormat("#,##0.00", "en_US").format(check['totalAmount']) : "0.00"}',
                      style: pw.TextStyle(
                          fontSize: 13,
                          fontWeight: pw.FontWeight.normal,
                          font: universeFont),
                    ),
                  ]),
                  pw.SizedBox(height: 10),
                  if (check['memoNumber'] != null)
                    pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.start,
                        children: [
                          pw.Text(
                            '${check['memoNumber'].toString()}',
                            style: pw.TextStyle(
                                fontSize: 13,
                                fontWeight: pw.FontWeight.normal,
                                font: universeFont),
                          ),
                        ]),

                  //duplicate section
                  pw.SizedBox(height: 200),
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
                  ...printableDetails.map<pw.Widget>((detail) {
                    final numberFormat = NumberFormat("#,##0.00", "en_US");
                    final formattedTotal = numberFormat.format(
                        detail['amount'] != null ? detail['amount'] : 0);
                    return pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          detail['serviceName'],
                          style: pw.TextStyle(fontSize: 13, font: universeFont),
                        ),
                        pw.Text(
                          '\$${formattedTotal}',
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
                  pw.SizedBox(height: 10),
                  if (check['memoNumber'] != null)
                    pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.start,
                        children: [
                          // pw.Text(
                          //   'Memo Number :',
                          //   style: pw.TextStyle(
                          //       fontSize: 13,
                          //       fontWeight: pw.FontWeight.normal,
                          //       font: universeFont),
                          // ),
                          pw.Text(
                            '${check['memoNumber'].toString()}',
                            style: pw.TextStyle(
                                fontSize: 13,
                                fontWeight: pw.FontWeight.normal,
                                font: universeFont),
                          ),
                        ]),
                ],
              ),
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

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

    // 👉 Ten Million
    if (number >= 10000000) {
      words += _numberToWords((number / 10000000).floor()) + ' Ten Million ';
      number %= 10000000;
    }

    // 👉 Million
    if (number >= 1000000) {
      words += _numberToWords((number / 1000000).floor()) + ' Million ';
      number %= 1000000;
    }

    // 👉 Thousands
    if (number >= 1000) {
      words += _numberToWords((number / 1000).floor()) + ' Thousand ';
      number %= 1000;
    }

    // 👉 Hundreds
    if (number >= 100) {
      words += _numberToWords((number / 100).floor()) + ' Hundred ';
      number %= 100;
    }

    // 👉 Tens and Units
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

  Future<void> _showEditCheckDialog(Map<String, dynamic> check) async {
    setState(() {
      _isEditing = true;
      _editingCheckId = check['id'];
      _editingCheckNumber = check['checkNumber'].toString();
      _selectedType = check['type'];
      _selectedUserId = check['userId'];
      _selectedUserName = check['userName'];
      _serviceDetails.clear();
      _serviceDetails
          .addAll(List<Map<String, dynamic>>.from(check['serviceDetails']));
      _memoNumberController.text = check['memoNumber'] ?? '';
      _selectedDate = check['date'];
      _totalAmount = (check['totalAmount'] as num).toDouble();
      _calculateTotal();
    });

    await showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text('Edit Check',
                  style: appStyle(18, kDark, FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(height: 16),
                    TextField(
                      controller:
                          TextEditingController(text: _editingCheckNumber),
                      decoration: InputDecoration(
                        labelText: 'Check Number',
                        labelStyle: appStyle(14, kDark, FontWeight.normal),
                        border: OutlineInputBorder(),
                        filled: true,
                        fillColor: Colors.grey[200],
                      ),
                      readOnly: true,
                      enabled: false,
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
                      Builder(
                        builder: (context) {
                          final typeMembers = _allMembers
                              .where((member) =>
                                  member['role']?.toString() == _selectedType)
                              .toList();
                          final validSelectedId = typeMembers.any((m) =>
                                  m['memberId']?.toString() == _selectedUserId)
                              ? _selectedUserId
                              : null;

                          return DropdownButtonFormField<String>(
                            decoration: InputDecoration(
                              labelText: 'Select Name',
                              labelStyle:
                                  appStyle(14, kDark, FontWeight.normal),
                              border: const OutlineInputBorder(),
                            ),
                            value: validSelectedId,
                            items: typeMembers
                                .map<DropdownMenuItem<String>>(
                                    (member) => DropdownMenuItem<String>(
                                          value: member['memberId'].toString(),
                                          child: Text(
                                              member['name']?.toString() ??
                                                  'Unknown'),
                                        ))
                                .toList(),
                            onChanged: (value) {
                              setState(() {
                                _selectedUserId = value;
                                final matched = _allMembers.firstWhere(
                                  (member) =>
                                      member['memberId']?.toString() == value,
                                  orElse: () => <String, dynamic>{
                                    'name': value ?? '',
                                    'memberId': value ?? '',
                                  },
                                );
                                _selectedUserName =
                                    matched['name']?.toString() ?? value;
                              });
                            },
                            validator: (value) =>
                                value == null ? 'Required' : null,
                          );
                        },
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
                          ..._serviceDetails.asMap().entries.map((entry) {
                            final index = entry.key;
                            final detail = entry.value;
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
                                    icon: Icon(Icons.edit, color: kPrimary),
                                    onPressed: () {
                                      _showEditDetailDialog(
                                          context, setState, index);
                                    },
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.delete, color: Colors.red),
                                    onPressed: () {
                                      setState(() {
                                        _serviceDetails.removeAt(index);
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
                  onPressed: _isSavingCheck
                      ? null
                      : () {
                          _resetForm();
                          Navigator.of(context).pop();
                        },
                  child: Text('Cancel',
                      style: appStyle(14, _isSavingCheck ? kGray : kDark, FontWeight.normal)),
                ),
                ElevatedButton(
                  onPressed: (_serviceDetails.isEmpty || _isSavingCheck)
                      ? null
                      : () => _updateCheck(setState),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    disabledBackgroundColor: Colors.orange.withOpacity(0.6),
                  ),
                  child: _isSavingCheck
                      ? SizedBox(
                          width: 18.w,
                          height: 18.w,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            color: kWhite,
                          ),
                        )
                      : Text('Update Check',
                          style: appStyle(14, kWhite, FontWeight.normal)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showEditDetailDialog(
      BuildContext context, StateSetter setState, int index) {
    final detail = _serviceDetails[index];
    final TextEditingController serviceNameController =
        TextEditingController(text: detail['serviceName']);
    final TextEditingController amountController =
        TextEditingController(text: detail['amount'].toString());

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Edit Service Detail',
              style: appStyle(16, kDark, FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: serviceNameController,
                  maxLength: 70,
                  decoration: InputDecoration(
                    labelText: 'Enter Service Name',
                    labelStyle: appStyle(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  decoration: InputDecoration(
                    labelText: 'Enter Amount',
                    labelStyle: appStyle(14, kDark, FontWeight.normal),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
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
                  _serviceDetails[index] = {
                    'serviceName': serviceNameController.text,
                    'amount': double.parse(amountController.text),
                  };
                  _calculateTotal();
                });

                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
              child: Text('Update',
                  style: appStyle(14, kWhite, FontWeight.normal)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateCheck(StateSetter dialogSetState) async {
    if (_isSavingCheck) return;
    if (_editingCheckId == null ||
        _selectedUserId == null ||
        _serviceDetails.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    dialogSetState(() => _isSavingCheck = true);
    setState(() => _isSavingCheck = true);

    try {
      // Update check document
      await FirebaseFirestore.instance
          .collection('Checks')
          .doc(_editingCheckId)
          .update({
        'type': _selectedType,
        'userId': _selectedUserId,
        'userName': _selectedUserName,
        'serviceDetails': _serviceDetails,
        'totalAmount': _totalAmount,
        'memoNumber': _memoNumberController.text.isEmpty
            ? null
            : _memoNumberController.text,
        'date': _selectedDate,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Check updated successfully')),
      );

      _resetForm();
      Navigator.of(context).pop();
      await fetchChecks();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating check: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSavingCheck = false);
      }
    }
  }

  void _resetForm() {
    setState(() {
      _isEditing = false;
      _editingCheckId = null;
      _editingCheckNumber = null;
      _selectedType = null;
      _selectedUserId = null;
      _selectedUserName = null;
      _serviceDetails.clear();
      _memoNumberController.clear();
      _selectedDate = DateTime.now();
      _totalAmount = 0.0;
    });
  }

  Widget _buildCheckCard(Map<String, dynamic> check) {
    final numberFormat = NumberFormat("#,##0.00", "en_US");
    final formattedTotal = numberFormat.format(check['totalAmount']);
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
                if (role == "Owner" || role == "SubOwner") ...[
                  SizedBox(width: 8),
                  IconButton(
                    icon: Icon(Icons.edit, color: Colors.orange, size: 20),
                    onPressed: () => _showEditCheckDialog(check),
                  ),
                ],
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Paid To: ${check['userName']} (${check['type']})',
              style: appStyle(14, kDark, FontWeight.w600),
            ),
            SizedBox(height: 8),
            Divider(),
            ...((check['serviceDetails'] is List)
                    ? (check['serviceDetails'] as List)
                    : [])
                .map<Widget>((detail) {
              final formattedAmount = numberFormat
                  .format(detail['amount'] != null ? detail['amount'] : 0);
              return Padding(
                padding: EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        detail['serviceName'],
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        style: appStyle(14, kDark, FontWeight.normal),
                      ),
                    ),
                    Text(
                      '\$${formattedAmount}',
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
                  '\$${formattedTotal}',
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
      QuerySnapshot teamSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .where('createdBy', isEqualTo: _effectiveUserId)
          .where('uid', isNotEqualTo: _effectiveUserId)
          .where("active", isEqualTo: true)
          .get();

      List<Map<String, dynamic>> membersWithVehicles = await Future.wait(
        teamSnapshot.docs.map((member) async {
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

          return <String, dynamic>{
            'name': name,
            'email': email,
            'isActive': isActive,
            'memberId': memberId,
            'ownerId': member['createdBy'],
            'vehicles': vehicles,
            'perMileCharge': member['perMileCharge'],
            'role': member['role']
          };
        }),
      );

      setState(() {
        _allMembers = membersWithVehicles;
        if (widget.initialPayee != null && widget.initialUserId != null) {
          final exists = _allMembers
              .any((m) => m['memberId']?.toString() == widget.initialUserId);
          if (!exists) {
            _allMembers.add(<String, dynamic>{
              'name': widget.initialPayee!,
              'memberId': widget.initialUserId!,
              'role': widget.initialType ?? 'Vendor',
              'vehicles': <Map<String, dynamic>>[],
            });
          }
        }
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
    if (widget.initialPayee != null && widget.initialPayee!.isNotEmpty) {
      _selectedType = widget.initialType ?? 'Vendor';
      _selectedUserId = widget.initialUserId;
      _selectedUserName = widget.initialPayee;
      _serviceDetails.clear();
      if (widget.initialServiceDetails != null) {
        _serviceDetails.addAll(
            List<Map<String, dynamic>>.from(widget.initialServiceDetails!));
      }
      _memoNumberController.clear();
      _selectedDate = DateTime.now();
      _totalAmount = widget.initialTotalAmount ?? 0.0;
    } else {
      _selectedType = null;
      _selectedUserId = null;
      _selectedUserName = null;
      _serviceDetails.clear();
      _memoNumberController.clear();
      _selectedDate = DateTime.now();
      _totalAmount = 0.0;
    }

    if (_selectedUserId != null && _selectedUserName != null) {
      final exists = _allMembers
          .any((m) => m['memberId']?.toString() == _selectedUserId);
      if (!exists) {
        _allMembers.add(<String, dynamic>{
          'name': _selectedUserName!,
          'memberId': _selectedUserId!,
          'role': _selectedType ?? 'Vendor',
          'vehicles': <Map<String, dynamic>>[],
        });
      }
    }

    // Get the next available check number
    String? nextCheckNumber = await _getNextAvailableCheckNumber();

    if (_isPreparingAutoCheck && mounted) {
      setState(() => _isPreparingAutoCheck = false);
    }

    if (nextCheckNumber != null) {
      _checkNumberController.text = nextCheckNumber;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
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
                      Builder(
                        builder: (context) {
                          final typeMembers = _allMembers
                              .where((member) =>
                                  member['role']?.toString() == _selectedType)
                              .toList();
                          final validSelectedId = typeMembers.any((m) =>
                                  m['memberId']?.toString() == _selectedUserId)
                              ? _selectedUserId
                              : null;

                          return DropdownButtonFormField<String>(
                            decoration: InputDecoration(
                              labelText: 'Select Name',
                              labelStyle:
                                  appStyle(14, kDark, FontWeight.normal),
                              border: const OutlineInputBorder(),
                            ),
                            value: validSelectedId,
                            items: typeMembers
                                .map<DropdownMenuItem<String>>(
                                    (member) => DropdownMenuItem<String>(
                                          value: member['memberId'].toString(),
                                          child: Text(
                                              member['name']?.toString() ??
                                                  'Unknown'),
                                        ))
                                .toList(),
                            onChanged: (value) {
                              setState(() {
                                _selectedUserId = value;
                                final matched = _allMembers.firstWhere(
                                  (member) =>
                                      member['memberId']?.toString() == value,
                                  orElse: () => <String, dynamic>{
                                    'name': value ?? '',
                                    'memberId': value ?? '',
                                  },
                                );
                                _selectedUserName =
                                    matched['name']?.toString() ?? value;
                              });
                            },
                            validator: (value) =>
                                value == null ? 'Required' : null,
                          );
                        },
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
                  onPressed: _isSavingCheck ? null : () => Navigator.of(context).pop(),
                  child: Text('Cancel',
                      style: appStyle(14, _isSavingCheck ? kGray : kDark, FontWeight.normal)),
                ),
                ElevatedButton(
                  onPressed: (_serviceDetails.isEmpty || _isSavingCheck)
                      ? null
                      : () => _saveCheck(setState),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    disabledBackgroundColor: kPrimary.withOpacity(0.6),
                  ),
                  child: _isSavingCheck
                      ? SizedBox(
                          width: 18.w,
                          height: 18.w,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            color: kWhite,
                          ),
                        )
                      : Text('Save',
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
                  maxLength: 70,
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
                    keyboardType: TextInputType.streetAddress,
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
                  _serviceDetails.add(<String, dynamic>{
                    'serviceName': serviceNameController.text.trim(),
                    'amount': double.tryParse(amountController.text.trim()) ?? 0.0,
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

  Future<void> _saveCheck(StateSetter dialogSetState) async {
    if (_isSavingCheck) return;
    if (_selectedUserId == null || _serviceDetails.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    dialogSetState(() => _isSavingCheck = true);
    setState(() => _isSavingCheck = true);

    try {
      String checkNumber = _checkNumberController.text;

      // Create check document
      final checkDocRef = await FirebaseFirestore.instance.collection('Checks').add({
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

      // Sync attached invoices from Pay Invoice screen
      if (widget.attachedInvoices != null && widget.attachedInvoices!.isNotEmpty) {
        try {
          final batch = FirebaseFirestore.instance.batch();
          final now = DateTime.now();
          final nowIso = now.toIso8601String();
          final paymentId = "PAY-CHK-$checkNumber";

          // Fetch team members
          final teamSnap = await FirebaseFirestore.instance
              .collection('Users')
              .where('createdBy', isEqualTo: _effectiveUserId)
              .where('isTeamMember', isEqualTo: true)
              .get();
          final memberIds = teamSnap.docs.map((d) => d.id).toList();

          final List<Map<String, dynamic>> ledgerInvoices = [];

          for (var inv in widget.attachedInvoices!) {
            final recId = inv['recordId']?.toString() ?? '';
            if (recId.isEmpty) continue;

            final payAmt = (inv['amount'] as num?)?.toDouble() ?? 0.0;
            if (payAmt <= 0) continue;

            final ownerDocRef = FirebaseFirestore.instance
                .collection('Users')
                .doc(_effectiveUserId)
                .collection('DataServices')
                .doc(recId);
            final ownerSnap = await ownerDocRef.get();

            double totalInv = 0.0;
            double currentPaid = 0.0;
            List<dynamic> existingHist = [];

            if (ownerSnap.exists) {
              final recData = ownerSnap.data() as Map<String, dynamic>;
              final rawTotal = recData['invoiceAmount'];
              final totalStr = rawTotal?.toString().replaceAll(RegExp(r'[^0-9.-]'), '') ?? '0';
              totalInv = double.tryParse(totalStr) ?? 0.0;
              currentPaid = (recData['paidAmount'] as num?)?.toDouble() ?? 0.0;
              if (recData['paymentHistory'] is List) {
                existingHist = List<dynamic>.from(recData['paymentHistory']);
              }
            } else {
              // Try global DataServicesRecords
              final globalDocRef = FirebaseFirestore.instance
                  .collection('DataServicesRecords')
                  .doc(recId);
              final gSnap = await globalDocRef.get();
              if (gSnap.exists) {
                final recData = gSnap.data() as Map<String, dynamic>;
                final rawTotal = recData['invoiceAmount'];
                final totalStr = rawTotal?.toString().replaceAll(RegExp(r'[^0-9.-]'), '') ?? '0';
                totalInv = double.tryParse(totalStr) ?? 0.0;
                currentPaid = (recData['paidAmount'] as num?)?.toDouble() ?? 0.0;
                if (recData['paymentHistory'] is List) {
                  existingHist = List<dynamic>.from(recData['paymentHistory']);
                }
              }
            }

            final newPaid = currentPaid + payAmt;
            final newBalance = (totalInv - newPaid) > 0 ? (totalInv - newPaid) : 0.0;
            final newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';

            final paymentEntry = {
              'paymentId': paymentId,
              'paymentMethod': 'Check',
              'amountPaid': payAmt,
              'checkNumber': checkNumber,
              'checkId': checkDocRef.id,
              'paidAt': nowIso,
              'paidBy': currentUId,
              'paidByName': _selectedUserName ?? 'User',
            };

            existingHist.add(paymentEntry);

            final updatePayload = {
              'paidAmount': newPaid,
              'balanceAmount': newBalance,
              'paymentStatus': newStatus,
              'paymentHistory': existingHist,
              'updatedAt': nowIso,
            };

            // 1. Owner record
            batch.set(ownerDocRef, updatePayload, SetOptions(merge: true));

            // 2. Global record
            final globalRef = FirebaseFirestore.instance
                .collection('DataServicesRecords')
                .doc(recId);
            batch.set(globalRef, updatePayload, SetOptions(merge: true));

            // 3. Team members
            for (final mId in memberIds) {
              if (mId == _effectiveUserId) continue;
              final memberRef = FirebaseFirestore.instance
                  .collection('Users')
                  .doc(mId)
                  .collection('DataServices')
                  .doc(recId);
              final mSnap = await memberRef.get();
              if (mSnap.exists) {
                batch.set(memberRef, updatePayload, SetOptions(merge: true));
              }
            }

            ledgerInvoices.add({
              'recordId': recId,
              'invoiceNumber': inv['invoiceNumber'] ?? 'N/A',
              'vehicleNumber': inv['vehicleNumber'] ?? 'N/A',
              'amountPaid': payAmt,
              'remainingBalance': newBalance,
            });
          }

          if (ledgerInvoices.isNotEmpty) {
            final ledgerRef = FirebaseFirestore.instance
                .collection('Users')
                .doc(_effectiveUserId)
                .collection('InvoicePayments')
                .doc();

            batch.set(ledgerRef, {
              'id': ledgerRef.id,
              'paymentId': paymentId,
              'ownerId': _effectiveUserId,
              'vendorName': _selectedUserName ?? 'Vendor',
              'totalAmount': _totalAmount,
              'paymentMethod': 'Check',
              'checkNumber': checkNumber,
              'checkId': checkDocRef.id,
              'invoices': ledgerInvoices,
              'createdAt': FieldValue.serverTimestamp(),
              'createdBy': currentUId,
              'createdByName': _selectedUserName ?? 'User',
            });
          }

          await batch.commit();
        } catch (invoiceSyncError) {
          print('Error updating invoice records on check creation: $invoiceSyncError');
        }
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
    } finally {
      if (mounted) {
        setState(() => _isSavingCheck = false);
      }
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
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (role == "Owner" || role == "SubOwner") ...[
                    CustomButton(
                      text: "Write Check",
                      onPress: _showAddCheckDialog,
                      color: kPrimary,
                    ),
                  ],
                  const SizedBox(height: 16),
                  _buildFilterRow(),
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
          if (_isPreparingAutoCheck)
            Container(
              color: Colors.black.withOpacity(0.35),
              child: Center(
                child: Container(
                  margin: EdgeInsets.symmetric(horizontal: 32.w),
                  padding:
                      EdgeInsets.symmetric(horizontal: 24.w, vertical: 22.h),
                  decoration: BoxDecoration(
                    color: kWhite,
                    borderRadius: BorderRadius.circular(16.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: kPrimary),
                      SizedBox(height: 16.h),
                      Text(
                        "Preparing Check Details...",
                        style: appStyle(15, kDark, FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 6.h),
                      Text(
                        "Loading prefilled invoice details and check series",
                        style: appStyle(12, kGray, FontWeight.normal),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
