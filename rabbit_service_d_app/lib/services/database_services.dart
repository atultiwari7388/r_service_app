import 'package:cloud_firestore/cloud_firestore.dart';

class DatabaseServices {
  String? uid;

  DatabaseServices({required this.uid});

//===============reference from user collection====================

  final fireStoreDatabase = FirebaseFirestore.instance.collection("Users");

//save user data to firebase

  Future savingUserData(
    String emailAddress,
    String userName,
    String phoneNumber,
    String address,
  ) async {
    return fireStoreDatabase.doc(uid!).set({
      "uid": uid,
      "email": emailAddress,
      "active": true,
      "isTeamMember": false,
      "userName": userName,
      "phoneNumber": phoneNumber,
      "address": address,
      "lastAddress": "",
      "profilePicture": "",
      "wallet": 0,
      "isNotificationOn": true,
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
      'createdBy': uid, // ID of the current user
      'role': 'Owner',
    });
  }
}
