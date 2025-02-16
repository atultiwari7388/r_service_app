import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:regal_service_d_app/services/collection_references.dart';

class ManageTripsScreen extends StatefulWidget {
  const ManageTripsScreen({super.key});

  @override
  _ManageTripsScreenState createState() => _ManageTripsScreenState();
}

class _ManageTripsScreenState extends State<ManageTripsScreen> {
  final TextEditingController _tripNameController = TextEditingController();
  final TextEditingController _totalMilesController = TextEditingController();
  String selectedTrip = '';
  String selectedType = 'Miles';
  TextEditingController milesController = TextEditingController();
  TextEditingController amountController = TextEditingController();
  TextEditingController descriptionController = TextEditingController();
  DateTime? fromDate;
  DateTime? toDate;

  void addTrip() async {
    if (_tripNameController.text.isNotEmpty &&
        _totalMilesController.text.isNotEmpty) {
      await FirebaseFirestore.instance
          .collection("Users")
          .doc(currentUId)
          .collection('trips')
          .add({
        'tripName': _tripNameController.text,
        'totalMiles': int.parse(_totalMilesController.text),
        'createdAt': Timestamp.now(),
      });
      _tripNameController.clear();
      _totalMilesController.clear();
    }
  }

  void addMileageOrExpense() async {
    if (selectedTrip.isNotEmpty) {
      Map<String, dynamic> data = {
        'tripId': selectedTrip,
        'type': selectedType,
        'createdAt': Timestamp.now(),
      };
      if (selectedType == 'Miles' && milesController.text.isNotEmpty) {
        data['miles'] = int.parse(milesController.text);
      } else if (selectedType == 'Expenses' &&
          amountController.text.isNotEmpty) {
        data['amount'] = double.parse(amountController.text);
        data['description'] = descriptionController.text;
      }
      await FirebaseFirestore.instance.collection('tripDetails').add(data);
    }
  }

  Future<void> _selectDateRange(BuildContext context) async {
    DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      setState(() {
        fromDate = picked.start;
        toDate = picked.end;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Manage Trips")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _tripNameController,
              decoration: const InputDecoration(labelText: "Trip Name"),
            ),
            TextField(
              controller: _totalMilesController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Total Miles"),
            ),
            ElevatedButton(onPressed: addTrip, child: const Text("Add Trip")),
            const Divider(),
            DropdownButton<String>(
              value: selectedType,
              items: ['Miles', 'Expenses']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (value) {
                setState(() => selectedType = value!);
              },
            ),
            if (selectedType == 'Miles')
              TextField(
                controller: milesController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Enter Miles"),
              )
            else ...[
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Enter Amount"),
              ),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: "Description"),
              ),
            ],
            ElevatedButton(
                onPressed: addMileageOrExpense, child: const Text("Add Entry")),
            ElevatedButton(
              onPressed: () => _selectDateRange(context),
              child: const Text("Filter by Date"),
            ),
            Expanded(
              child: StreamBuilder(
                stream:
                    FirebaseFirestore.instance.collection('trips').snapshots(),
                builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                  if (!snapshot.hasData)
                    return const CircularProgressIndicator();
                  return ListView(
                    children: snapshot.data!.docs.map((doc) {
                      return ListTile(
                        title: Text(doc['tripName']),
                        subtitle: Text("Miles: ${doc['totalMiles']}"),
                        trailing: Text("Earnings: \$${doc['totalMiles'] * 10}"),
                        onTap: () {},
                      );
                    }).toList(),
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
