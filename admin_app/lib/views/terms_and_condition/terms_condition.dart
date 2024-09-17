import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class TermsAndConditionsScreen extends StatefulWidget {
  const TermsAndConditionsScreen({super.key});

  @override
  _TermsAndConditionsScreenState createState() =>
      _TermsAndConditionsScreenState();
}

class _TermsAndConditionsScreenState extends State<TermsAndConditionsScreen> {
  bool _isEditing = false;
  String _termsConText = '';
  final TextEditingController _controller = TextEditingController();

  Future<void> getAboutUsDescription() async {
    DocumentSnapshot<Map<String, dynamic>> snapshot = await FirebaseFirestore
        .instance
        .collection('metadata')
        .doc('termsCond')
        .get();

    String description =
        snapshot.data()?['description'] ?? 'No description available';
    _controller.text = description; // Set the initial value of the TextField
    setState(() {
      _termsConText = description;
    });
  }

  Future<void> updateAboutUsDescription(String newDescription) async {
    await FirebaseFirestore.instance
        .collection('metadata')
        .doc('termsCond')
        .update({'description': newDescription});
  }

  @override
  void initState() {
    super.initState();
    getAboutUsDescription(); // Load the current description from Firestore
  }

  @override
  void dispose() {
    _controller.dispose(); // Dispose the controller when the screen is disposed
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('T&C screen'),
        actions: [
          _isEditing
              ? IconButton(
                  icon: const Icon(Icons.save),
                  onPressed: () async {
                    // Update the Firestore database with the new description
                    await updateAboutUsDescription(_controller.text);
                    setState(() {
                      _termsConText = _controller.text;
                      _isEditing = false;
                    });
                  },
                )
              : IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () {
                    setState(() {
                      _isEditing = true;
                    });
                  },
                ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _isEditing
            ? TextField(
                controller: _controller,
                maxLines: null, // Allow multiple lines
                decoration: const InputDecoration(
                  labelText: 'Edit Terms and Conditions',
                  border: OutlineInputBorder(),
                ),
              )
            : Text(
                _termsConText,
                style: const TextStyle(fontSize: 16.0),
              ),
      ),
    );
  }
}
