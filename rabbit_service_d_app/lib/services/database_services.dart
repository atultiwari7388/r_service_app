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
      "userName": userName,
      "phoneNumber": phoneNumber,
      "isTeamMember": false,
      "address": address,
      "lastAddress": "",
      "profilePicture": "",
      "wallet": 0,
      "isNotificationOn": true,
      'createdBy': uid,
      'role': 'Owner',
      'isOwner': true,
      'isManager': false,
      'isDriver': false,
      'perHourCharge': "",
      "isView": true,
      "isEdit": true,
      "isDelete": true,
      "isAdd": true,
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
    });
  }
}
