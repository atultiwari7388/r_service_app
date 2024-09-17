import 'dart:developer';
import 'package:admin_app/utils/constants.dart';
import 'package:admin_app/widgets/custom_button.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class LanguagesScreen extends StatefulWidget {
  const LanguagesScreen({super.key});

  @override
  State<LanguagesScreen> createState() => _LanguagesScreenState();
}

class _LanguagesScreenState extends State<LanguagesScreen> {
  List<String> languages = [];
  final TextEditingController _languageController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLanguages();
  }

  Future<void> _fetchLanguages() async {
    FirebaseFirestore.instance
        .collection('metadata')
        .doc('languages')
        .get()
        .then((docSnapshot) {
      if (docSnapshot.exists) {
        setState(() {
          languages = List<String>.from(docSnapshot.data()!['data']);
          _isLoading = false;
        });
      }
    }).catchError((error) {
      log('Failed to load languages: $error');
      setState(() {
        _isLoading = false;
      });
    });
  }

  Future<void> _updateLanguages() async {
    FirebaseFirestore.instance.collection('metadata').doc('languages').update({
      'data': languages,
    }).then((value) {
      log('Languages updated');
    }).catchError((error) {
      log('Failed to update languages: $error');
    });
  }

  void _addLanguage() {
    if (_languageController.text.isNotEmpty) {
      setState(() {
        languages.add(_languageController.text);
      });
      _updateLanguages();
      _languageController.clear();
    }
  }

  void _editLanguage(int index) {
    _languageController.text = languages[index];
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Language'),
          content: TextField(
            controller: _languageController,
            decoration: InputDecoration(hintText: 'Enter new language'),
          ),
          actions: [
            TextButton(
              onPressed: () {
                setState(() {
                  languages[index] = _languageController.text;
                });
                _updateLanguages();
                _languageController.clear();
                Navigator.pop(context);
              },
              child: Text('Save'),
            ),
            TextButton(
              onPressed: () {
                _languageController.clear();
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  void _deleteLanguage(int index) {
    setState(() {
      languages.removeAt(index);
    });
    _updateLanguages();
  }

  @override
  void dispose() {
    _languageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Languages"),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: languages.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(languages[index]),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => _editLanguage(index),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteLanguage(index),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _languageController,
                          decoration: InputDecoration(
                            labelText: 'Add a language',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      SizedBox(width: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: kPrimary,foregroundColor: kWhite),
                        onPressed: _addLanguage,
                        child: Text('Add'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
