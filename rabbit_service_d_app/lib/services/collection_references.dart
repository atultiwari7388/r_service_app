import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

//for currentUser id
final FirebaseAuth auth = FirebaseAuth.instance;
final currentUId = FirebaseAuth.instance.currentUser!.uid;

//for user collection
final CollectionReference usersCollection =
    FirebaseFirestore.instance.collection("Users");
