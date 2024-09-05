import 'package:cloud_firestore/cloud_firestore.dart';

class DatabaseServices {
  String? uid;

  DatabaseServices({required this.uid});

//===============reference from user collection====================

  final fireStoreDatabase = FirebaseFirestore.instance.collection("Mechanics");

//save user data to firebase

  Future savingUserData(
      String emailAddress,
      String userName,
      String phoneNumber,
      String address,
      num perHourCharge,
     Map<String,dynamic> languages,
      ) async {
    return fireStoreDatabase.doc(uid!).set({
      "uid": uid,
      "email": emailAddress,
      "userName": userName,
      "phoneNumber": phoneNumber,
      "address": address,
      "perHCharge":perHourCharge,
      "lastAddress": "",
      "languages":languages,
      "profilePicture": "",
      "isNotificationOn": true,
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
    });
  }
}
