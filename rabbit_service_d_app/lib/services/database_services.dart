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
    String companyName,
    String selectedVehicleRange,
  ) async {
    return fireStoreDatabase.doc(uid!).set({
      "uid": uid,
      "userName": userName, //name
      "phoneNumber": phoneNumber, //phone number
      "telephoneNumber": "", //telephone number
      "email": emailAddress, //email address
      "email2": "",
      "address": address, //address
      "city": "", //city
      "state": "", //state
      "country": "", //country
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
      "vehicleRange": selectedVehicleRange,
      "isTeamMember": false,
      "lastAddress": "",
      "profilePicture":
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
      "wallet": 0,
      "isNotificationOn": true,
      'createdBy': uid,
      'role': 'Owner',
      'isOwner': true,
      'isManager': false,
      'isDriver': false,
      'isVendor': false,
      "isView": true,
      "isCheque": true,

      "isEdit": true,
      "isDelete": true,
      "isAdd": true,
      "created_at": DateTime.now(),
      "updated_at": DateTime.now(),
    });
  }
}
