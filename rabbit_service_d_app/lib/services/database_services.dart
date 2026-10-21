import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';

class DatabaseServices {
  String? uid;

  DatabaseServices({required this.uid});

//===============reference from user collection====================

  final fireStoreDatabase = FirebaseFirestore.instance.collection("Users");

//save user data to firebase

  Future savingUserData({
    required String emailAddress,
    required String userName,
    required String phoneNumber,
    required String address,
    required String companyName,
    String dot = '',
    String mc = '',
    String nsc = '',
    String cvor = '',
    String nir = '',
    String cbsa = '',
    String rfc = '',
    String ftp = '',
    String voln = '',
    String abn = '',
    String hva = '',
    required String city,
    required String state,
    required String country,
    required String selectedVehicleRange,
    String? deviceId,
  }) async {
    // 1. Save main User doc
    await fireStoreDatabase.doc(uid!).set({
      "status": "active", //active and deleted
      "isAnonymous": false, //is anonymous
      "isProfileComplete": true, //is profile complete
      "uid": uid,
      "userName": userName, //name
      "phoneNumber": phoneNumber, //phone number
      "telephoneNumber": "", //telephone number
      "email": emailAddress, //email address
      "email2": "",
      "address": address, //address
      "city": city, //city
      "state": state, //state
      "country": country, //country
      "postalCode": "", //postal code
      "licNumber": "", //license number
      "licExpDate": DateTime.now().toString(), //license expiry date
      "dob": DateTime.now().toString(), //Date of birth
      "lastDrugTest": DateTime.now().toString(), //last drug test
      "dateOfHire": DateTime.now().toString(), //date of hire
      "dateOfTermination": DateTime.now().toString(), //date of termination
      "socialSecurity": "", //social security number
      "active": true,
      'perMileCharge': "",
      "companyName": companyName,
      // USA
      "dot": dot,
      "mc": mc,
      // CANADA
      "nsc": nsc,
      "cvor": cvor,
      "nir": nir,
      "cbsa": cbsa,
      // MEXICO
      "rfc": rfc,
      "ftp": ftp,
      // UK
      "voln": voln,
      // AUSTRALIA
      "abn": abn,
      "hva": hva,
      "vehicleRange": selectedVehicleRange,
      "isTeamMember": false,
      "isMultiDeEnable": false,
      "lastAddress": "",
      "profilePicture":
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
      "wallet": 0,
      "isNotificationOn": true,
      'createdBy': uid,
      'role': 'Owner',
      'teamMembers': [],
      'isOwner': true,
      'isManager': false,
      'isDriver': false,
      'isVendor': false,
      "isView": true,
      "isCheque": true,
      'payMode': '',
      "isEdit": true,
      "isDelete": true,
      "isAdd": true,
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
      'currentDeviceId': deviceId,
      'lastLogin': FieldValue.serverTimestamp(),
      'createdFrom': Platform.isAndroid ? 'android' : 'ios',
    });

    // 2. Save company in myCompanies subcollection
    if (companyName.isNotEmpty) {
      await fireStoreDatabase.doc(uid!).collection("myCompanies").add({
        "companyName": companyName,
        "dot": dot,
        "mc": mc,
        "nsc": nsc,
        "cvor": cvor,
        "nir": nir,
        "cbsa": cbsa,
        "rfc": rfc,
        "ftp": ftp,
        "voln": voln,
        "abn": abn,
        "hva": hva,
        "address": address,
        "city": city,
        "state": state,
        "country": country,
        "isDefault": true,
        "isActive": true,
        "created_at": FieldValue.serverTimestamp(),
        "updated_at": FieldValue.serverTimestamp(),
      });
    }
  }
}
