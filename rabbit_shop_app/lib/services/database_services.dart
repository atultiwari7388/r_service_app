// import 'package:cloud_firestore/cloud_firestore.dart';

// class DatabaseServices {
//   String? uid;

//   DatabaseServices({required this.uid});

// //===============reference from user collection====================

//   final fireStoreDatabase = FirebaseFirestore.instance.collection("Mechanics");

// //save user data to firebase

//   Future savingUserData(
//     String emailAddress,
//     String userName,
//     String phoneNumber,
//     String address,
//     num perHourCharge,
//     Map<String, dynamic> languages,
//   ) async {
//     return fireStoreDatabase.doc(uid!).set({
//       "uid": uid,
//       "email": emailAddress,
//       "userName": userName,
//       "phoneNumber": phoneNumber,
//       "address": address,
//       "perHCharge": perHourCharge,
//       "lastAddress": "",
//       "languages": languages,
//       "profilePicture": "",
//       "isNotificationOn": true,
//       "wallet": 0,
//       "active": true,
//       "isEnabled": true,
//       "selected_services": [],
//       "created_at": DateTime.now(),
//       "updated_at": DateTime.now(),
//     });
//   }
// }

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
    String workshopName,
    String cellPhone,
    String telephone,
    String address,
    String city,
    String state,
    String country,
    String postalCode,
    String dateOfBirth,
    String experience,
    String description,
    num perHourCharge,
    Map<String, dynamic> languages,
  ) async {
    return fireStoreDatabase.doc(uid!).set({
      "uid": uid,
      "email": emailAddress,
      "userName": userName,
      "workshopName": workshopName,
      "cellPhone": cellPhone,
      "telephone": telephone,
      "address": address,
      "city": city,
      "state": state,
      "country": country,
      "postalCode": postalCode,
      "dateOfBirth": dateOfBirth,
      "experience": experience,
      "description": description,
      "perHCharge": perHourCharge,
      "lastAddress": "",
      "languages": languages,
      "profilePicture": "",
      "isNotificationOn": true,
      "wallet": 0,
      "active": true,
      "isEnabled": true,
      "selected_services": [],
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
    });
  }

  // You might also want to add an update method for when users edit their profile
  Future updateUserData({
    String? userName,
    String? workshopName,
    String? cellPhone,
    String? telephone,
    String? address,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    String? dateOfBirth,
    String? experience,
    String? description,
    num? perHourCharge,
    Map<String, dynamic>? languages,
  }) async {
    Map<String, dynamic> updateData = {
      "updated_at": DateTime.now(),
    };

    // Add only the fields that are provided
    if (userName != null) updateData["userName"] = userName;
    if (workshopName != null) updateData["workshopName"] = workshopName;
    if (cellPhone != null) updateData["cellPhone"] = cellPhone;
    if (telephone != null) updateData["telephone"] = telephone;
    if (address != null) updateData["address"] = address;
    if (city != null) updateData["city"] = city;
    if (state != null) updateData["state"] = state;
    if (country != null) updateData["country"] = country;
    if (postalCode != null) updateData["postalCode"] = postalCode;
    if (dateOfBirth != null) updateData["dateOfBirth"] = dateOfBirth;
    if (experience != null) updateData["experience"] = experience;
    if (description != null) updateData["description"] = description;
    if (perHourCharge != null) updateData["perHCharge"] = perHourCharge;
    if (languages != null) updateData["languages"] = languages;

    return await fireStoreDatabase.doc(uid!).update(updateData);
  }

  // Get user data
  Future<DocumentSnapshot> getUserData() async {
    return await fireStoreDatabase.doc(uid!).get();
  }

  // Check if user exists
  Future<bool> userExists() async {
    final doc = await fireStoreDatabase.doc(uid!).get();
    return doc.exists;
  }
}
