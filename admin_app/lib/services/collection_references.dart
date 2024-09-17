import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

//for currentUser id
final FirebaseAuth auth = FirebaseAuth.instance;
final currentUId = FirebaseAuth.instance.currentUser!.uid;

//for user collection
final CollectionReference usersCollection =
    FirebaseFirestore.instance.collection("Users");

final Stream<QuerySnapshot> usersList =
    FirebaseFirestore.instance.collection('Users').snapshots();

final Stream<QuerySnapshot> mechanicsList =
    FirebaseFirestore.instance.collection('Mechanics').snapshots();

final Stream<QuerySnapshot> jobsList =
    FirebaseFirestore.instance.collection('jobs').snapshots();

//for coupons collection
final CollectionReference allDriversList =
    FirebaseFirestore.instance.collection("Users");

final CollectionReference allMechanicsList =
    FirebaseFirestore.instance.collection("Mechanics");

final CollectionReference allJobsList =
    FirebaseFirestore.instance.collection("jobs");
