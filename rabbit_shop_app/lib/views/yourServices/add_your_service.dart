import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class AddYourServices extends StatefulWidget {
  const AddYourServices({super.key});

  @override
  State<AddYourServices> createState() => _AddYourServicesState();
}

class _AddYourServicesState extends State<AddYourServices> {
  List<Map<String, dynamic>> allServiceAndNetworkOptions = [];
  List<Map<String, dynamic>> filteredServiceAndNetworkOptions = [];
  List<String> selectedServices = [];

  @override
  void initState() {
    super.initState();
    fetchServicesName();
  }

  Future<void> fetchServicesName() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> metadataSnapshot =
          await FirebaseFirestore.instance
              .collection('metadata')
              .doc('servicesList')
              .get();

      if (metadataSnapshot.exists) {
        List<dynamic> servicesList = metadataSnapshot.data()?['data'] ?? [];

        // Extract titles, image_type, and price_type from each service map
        allServiceAndNetworkOptions = servicesList.map((service) {
          String title = service['title'].toString();
          int imageType = int.tryParse(service['image_type'].toString()) ?? 0;
          int priceType = int.tryParse(service['price_type'].toString()) ?? 0;

          // Return a map with title, imageType, and priceType
          return {
            'title': title,
            'image_type': imageType,
            'price_type': priceType,
          };
        }).toList();

        // Initialize filtered list with all options
        filteredServiceAndNetworkOptions =
            List.from(allServiceAndNetworkOptions);

        // Fetch selected services from the mechanics collection
        await fetchSelectedServices();

        setState(() {});
      }
    } catch (e) {
      print('Error fetching services names: $e');
    }
  }

  Future<void> fetchSelectedServices() async {
    try {
      String currentUID = FirebaseAuth.instance.currentUser!.uid;

      DocumentSnapshot<Map<String, dynamic>> mechanicSnapshot =
          await FirebaseFirestore.instance
              .collection('Mechanics')
              .doc(currentUID)
              .get();

      if (mechanicSnapshot.exists) {
        // Load selected services from Firestore
        List<dynamic> services =
            mechanicSnapshot.data()?['selected_services'] ?? [];
        selectedServices =
            List<String>.from(services); // Convert to List<String>

        // Print selected services for debugging
        print('Selected Services: $selectedServices');
      }
    } catch (e) {
      print('Error fetching selected services: $e');
    }
  }

  // Handle checkbox selection
  void onServiceSelected(bool? selected, String title) {
    setState(() {
      if (selected == true) {
        selectedServices.add(title);
      } else {
        selectedServices.remove(title);
      }
    });
  }

  // Save selected services to the mechanics collection
  Future<void> saveSelectedServices() async {
    try {
      String currentUID = FirebaseAuth.instance.currentUser!.uid;

      await FirebaseFirestore.instance
          .collection('Mechanics')
          .doc(currentUID)
          .set(
        {'selected_services': selectedServices},
        SetOptions(
            merge:
                true), // Use merge to update only the selected_services field
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Services saved successfully!')),
      );
      Navigator.pop(context, true); // This sends the result back
    } catch (e) {
      print('Error saving selected services: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving services. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Select Services'),
      ),
      body: filteredServiceAndNetworkOptions.isEmpty
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: filteredServiceAndNetworkOptions.length,
              itemBuilder: (context, index) {
                final service = filteredServiceAndNetworkOptions[index];
                final title = service['title'];

                return CheckboxListTile(
                  title: Text(title),
                  value: selectedServices.contains(title),
                  onChanged: (bool? selected) {
                    onServiceSelected(selected, title);
                  },
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: saveSelectedServices,
        child: Icon(Icons.save),
        tooltip: 'Save Selected Services',
      ),
    );
  }
}
