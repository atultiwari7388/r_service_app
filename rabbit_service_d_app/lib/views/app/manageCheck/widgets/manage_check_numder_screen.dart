import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/manageCheck/widgets/check_series_details_screen.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ManageCheckNumbersScreen extends StatefulWidget {
  const ManageCheckNumbersScreen({super.key, required this.currentUId});
  final String currentUId;

  @override
  State<ManageCheckNumbersScreen> createState() =>
      _ManageCheckNumbersScreenState();
}

class _ManageCheckNumbersScreenState extends State<ManageCheckNumbersScreen> {
  final TextEditingController _startNumberController = TextEditingController();
  final TextEditingController _endNumberController = TextEditingController();
  // final String currentUId = FirebaseAuth.instance.currentUser!.uid;
  List<Map<String, dynamic>> _checkSeries = [];
  List<Map<String, dynamic>> _companies = [];
  String? _selectedCompanyId;
  String? _selectedCompanyName;
  bool _isLoading = true;
  String _errorMessage = '';
  String? _currentCheckNumber;

  @override
  void initState() {
    super.initState();
    _fetchCheckSeries();
    _fetchCurrentCheckNumber();
    _fetchCompanies();
  }

  Future<void> _fetchCompanies() async {
    try {
      final companiesSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.currentUId)
          .collection('myCompanies')
          .get();

      List<Map<String, dynamic>> loadedCompanies = [];
      for (var doc in companiesSnapshot.docs) {
        final cData = doc.data();
        final cName =
            (cData['companyName'] ?? cData['name'] ?? '').toString().trim();
        final bool isActive = cData['isActive'] != false;
        if (cName.isNotEmpty && isActive) {
          loadedCompanies.add({
            'id': doc.id,
            'companyName': cName,
            'isDefault': cData['isDefault'] == true,
          });
        }
      }

      if (loadedCompanies.isEmpty) {
        final userDoc = await FirebaseFirestore.instance
            .collection('Users')
            .doc(widget.currentUId)
            .get();
        if (userDoc.exists) {
          final data = userDoc.data() as Map<String, dynamic>?;
          final rootCompanyName =
              (data?['companyName'] ?? '').toString().trim();
          if (rootCompanyName.isNotEmpty) {
            loadedCompanies.add({
              'id': 'default',
              'companyName': rootCompanyName,
              'isDefault': true,
            });
          }
        }
      }

      loadedCompanies.sort((a, b) => (a['companyName'] ?? '')
          .toString()
          .toLowerCase()
          .compareTo((b['companyName'] ?? '').toString().toLowerCase()));

      if (mounted) {
        setState(() {
          _companies = loadedCompanies;
          if (_selectedCompanyId == null && loadedCompanies.isNotEmpty) {
            final defaultComp = loadedCompanies.firstWhere(
                (c) => c['isDefault'] == true,
                orElse: () => loadedCompanies.first);
            _selectedCompanyId = defaultComp['id'];
            _selectedCompanyName = defaultComp['companyName'];
          }
        });
      }
    } catch (e) {
      print('Error fetching companies in ManageCheckNumbersScreen: $e');
    }
  }

  Future<void> _fetchCheckSeries() async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('CheckSeries')
          .where('userId', isEqualTo: widget.currentUId)
          .orderBy('createdAt', descending: true)
          .get();

      setState(() {
        _checkSeries = snapshot.docs.map((doc) {
          Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
          return {
            'id': doc.id,
            ...data,
            'createdAt': (data['createdAt'] as Timestamp).toDate(),
          };
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading check series: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchCurrentCheckNumber() async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(widget.currentUId)
          .get();

      if (snapshot.exists) {
        setState(() {
          _currentCheckNumber = snapshot['currentCheckNumber'];
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error fetching current check number: $e';
      });
    }
  }

  // Function to generate check numbers between start and end
  List<Map<String, dynamic>> _generateCheckNumbers(String start, String end) {
    List<Map<String, dynamic>> checkNumbers = [];

    try {
      // Extract prefix and numeric parts
      String prefix = start.replaceAll(RegExp(r'[0-9]'), '');
      String endPrefix = end.replaceAll(RegExp(r'[0-9]'), '');

      // Verify prefixes match
      if (prefix != endPrefix) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Number prefixes must match')),
        );
        return [];
      }

      // Extract numeric parts
      String startNumStr = start.replaceAll(prefix, '');
      String endNumStr = end.replaceAll(prefix, '');

      int startNum = int.parse(startNumStr);
      int endNum = int.parse(endNumStr);

      if (startNum >= endNum) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('End number must be greater than start number')),
        );
        return [];
      }

      // Generate all numbers in the range
      for (int i = startNum; i <= endNum; i++) {
        // Format number with leading zeros to match the original format
        String numStr = i.toString();
        if (startNumStr.length > numStr.length) {
          numStr = numStr.padLeft(startNumStr.length, '0');
        }

        checkNumbers.add({
          'checkNumber': '$prefix$numStr',
          'isUsed': false,
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error generating check numbers: $e')),
      );
      return [];
    }

    return checkNumbers;
  }

  Future<void> _saveCheckSeries() async {
    if (_startNumberController.text.isEmpty ||
        _endNumberController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter both start and end numbers')),
      );
      return;
    }

    final start = _startNumberController.text.trim();
    final end = _endNumberController.text.trim();

    // Generate the check numbers
    List<Map<String, dynamic>> checkNumbers = _generateCheckNumbers(start, end);

    if (checkNumbers.isEmpty) {
      return; // Error already shown in _generateCheckNumbers
    }

    try {
      // Save the series to Firestore
      DocumentReference seriesRef =
          await FirebaseFirestore.instance.collection('CheckSeries').add({
        'userId': widget.currentUId,
        'startNumber': start,
        'endNumber': end,
        'createdAt': FieldValue.serverTimestamp(),
        'totalChecks': checkNumbers.length,
        if (_selectedCompanyId != null) 'companyId': _selectedCompanyId,
        if (_selectedCompanyName != null) 'companyName': _selectedCompanyName,
      });

      // Save individual check numbers to a subcollection
      WriteBatch batch = FirebaseFirestore.instance.batch();

      for (var check in checkNumbers) {
        var docRef = FirebaseFirestore.instance
            .collection('CheckSeries')
            .doc(seriesRef.id)
            .collection('Checks')
            .doc();

        batch.set(docRef, {
          ...check,
          'seriesId': seriesRef.id,
          'userId': widget.currentUId,
          'createdAt': FieldValue.serverTimestamp(),
          if (_selectedCompanyId != null) 'companyId': _selectedCompanyId,
          if (_selectedCompanyName != null) 'companyName': _selectedCompanyName,
        });
      }

      await batch.commit();

      // Update current check number if not set
      if (_currentCheckNumber == null) {
        await FirebaseFirestore.instance
            .collection('Users')
            .doc(widget.currentUId)
            .update({'currentCheckNumber': start});
        setState(() {
          _currentCheckNumber = start;
        });
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Check series saved successfully')),
      );

      _startNumberController.clear();
      _endNumberController.clear();
      await _fetchCheckSeries();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving check series: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Check Numbers'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Check Number: ${_currentCheckNumber ?? 'Not set'}',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            const Text('Add New Check Series',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _startNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Start Number (e.g., RMS001)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _endNumberController,
                    decoration: const InputDecoration(
                      labelText: 'End Number (e.g., RMS0050)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_companies.isNotEmpty) ...[
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Select Company',
                  border: OutlineInputBorder(),
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                value: _selectedCompanyId,
                items: _companies.map((comp) {
                  return DropdownMenuItem<String>(
                    value: comp['id'],
                    child: Text(
                      comp['companyName'],
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedCompanyId = val;
                    final match = _companies.firstWhere(
                      (c) => c['id'] == val,
                      orElse: () => <String, dynamic>{},
                    );
                    _selectedCompanyName = match['companyName'];
                  });
                },
              ),
              const SizedBox(height: 10),
            ],
            CustomButton(
                text: "Save Check Series",
                onPress: _saveCheckSeries,
                color: kPrimary),
            const SizedBox(height: 20),
            const Text('Check Series History',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _checkSeries.isEmpty
                    ? const Text('No check series found')
                    : Expanded(
                        child: ListView.builder(
                          itemCount: _checkSeries.length,
                          itemBuilder: (context, index) {
                            final series = _checkSeries[index];
                            final compName = series['companyName']?.toString();
                            return Card(
                              child: ListTile(
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                          '${series['startNumber']} - ${series['endNumber']}'),
                                    ),
                                    if (compName != null && compName.isNotEmpty)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(6),
                                          border: Border.all(
                                              color:
                                                  Colors.blue.withOpacity(0.3)),
                                        ),
                                        child: Text(
                                          compName,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                subtitle: Text(
                                    '${series['totalChecks']} checks • ${DateFormat('MMM dd, yyyy').format(series['createdAt'])}'),
                                trailing: IconButton(
                                  icon: const Icon(Icons.visibility),
                                  onPressed: () {
                                    // Navigate to detail view of this series
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            CheckSeriesDetailScreen(
                                          seriesId: series['id'],
                                          seriesName:
                                              '${series['startNumber']} - ${series['endNumber']}',
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ],
        ),
      ),
    );
  }
}
