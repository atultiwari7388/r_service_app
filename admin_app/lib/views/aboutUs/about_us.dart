import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AboutUsScreen extends StatefulWidget {
  const AboutUsScreen({super.key});

  @override
  _AboutUsScreenState createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  bool _isEditing = false;
  String _aboutUsText = '';
  final TextEditingController _controller = TextEditingController();

  Future<void> getAboutUsDescription() async {
    DocumentSnapshot<Map<String, dynamic>> snapshot = await FirebaseFirestore
        .instance
        .collection('metadata')
        .doc('aboutUs')
        .get();

    String description = snapshot.data()?['description'] ?? 'No description available';
    _controller.text = description; // Set the initial value of the TextField
    setState(() {
      _aboutUsText = description;
    });
  }

  Future<void> updateAboutUsDescription(String newDescription) async {
    await FirebaseFirestore.instance
        .collection('metadata')
        .doc('aboutUs')
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
        title: const Text('About Us'),
        actions: [
          _isEditing
              ? IconButton(
            icon: const Icon(Icons.save),
            onPressed: () async {
              // Update the Firestore database with the new description
              await updateAboutUsDescription(_controller.text);
              setState(() {
                _aboutUsText = _controller.text;
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
            labelText: 'Edit About Us',
            border: OutlineInputBorder(),
          ),
        )
            : Text(
          _aboutUsText,
          style: const TextStyle(fontSize: 16.0),
        ),
      ),
    );
  }
}