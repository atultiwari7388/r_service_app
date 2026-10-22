import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  String userId;
  String name;
  String email;
  String address;
  String contactNumber;
  String vehicleDetails;
  String billingDetail;
  String profilePicture;
  String companyName;
  String city;
  String state;
  String country;

  // Country-specific business registration numbers
  // USA : DOT NUMBER, MC NUMBER
  String dot;
  String mc;
  // CANADA : NSC, CVOR, NIR, CBSA
  String nsc;
  String cvor;
  String nir;
  String cbsa;
  // MEXICO: RFC, FTP
  String rfc;
  String ftp;
  // UK : VOLN
  String voln;
  // AUSTRALIA: ABN, HVA
  String abn;
  String hva;

  Map<String, dynamic> expensesPermission;

  DateTime createdAt;
  DateTime updatedAt;

  UserModel({
    required this.userId,
    required this.name,
    required this.email,
    required this.address,
    required this.contactNumber,
    required this.vehicleDetails,
    required this.billingDetail,
    this.profilePicture = '',
    this.companyName = '',
    this.city = '',
    this.state = '',
    this.country = '',
    this.dot = '',
    this.mc = '',
    this.nsc = '',
    this.cvor = '',
    this.nir = '',
    this.cbsa = '',
    this.rfc = '',
    this.ftp = '',
    this.voln = '',
    this.abn = '',
    this.hva = '',
    Map<String, dynamic>? expensesPermission,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : expensesPermission = expensesPermission ?? {'view': true, 'edit': true, 'add': true},
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Convert a UserModel object into a Map object to store in Firestore
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'name': name,
      'email': email,
      'address': address,
      'contactNumber': contactNumber,
      'vehicleDetails': vehicleDetails,
      'billingDetail': billingDetail,
      'profilePicture': profilePicture,
      'companyName': companyName,
      'city': city,
      'state': state,
      'country': country,
      'dot': dot,
      'mc': mc,
      'nsc': nsc,
      'cvor': cvor,
      'nir': nir,
      'cbsa': cbsa,
      'rfc': rfc,
      'ftp': ftp,
      'voln': voln,
      'abn': abn,
      'hva': hva,
      'expensesPermission': expensesPermission,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  // Create a UserModel object from a Firestore document snapshot
  factory UserModel.fromMap(Map<String, dynamic> map, String documentId) {
    return UserModel(
      userId: documentId,
      name: map['name'] ?? map['userName'] ?? '',
      email: map['email'] ?? '',
      address: map['address'] ?? '',
      contactNumber: map['contactNumber'] ?? map['phoneNumber'] ?? '',
      vehicleDetails: map['vehicleDetails'] ?? '',
      billingDetail: map['billingDetail'] ?? '',
      profilePicture: map['profilePicture'] ?? '',
      companyName: map['companyName'] ?? '',
      city: map['city'] ?? '',
      state: map['state'] ?? '',
      country: map['country'] ?? '',
      dot: map['dot'] ?? '',
      mc: map['mc'] ?? '',
      nsc: map['nsc'] ?? '',
      cvor: map['cvor'] ?? '',
      nir: map['nir'] ?? '',
      cbsa: map['cbsa'] ?? '',
      rfc: map['rfc'] ?? '',
      ftp: map['ftp'] ?? '',
      voln: map['voln'] ?? '',
      abn: map['abn'] ?? '',
      hva: map['hva'] ?? '',
      expensesPermission: map['expensesPermission'] is Map
          ? Map<String, dynamic>.from(map['expensesPermission'])
          : {'view': true, 'edit': true, 'add': true},
      createdAt: map['createdAt'] is Timestamp
          ? (map['createdAt'] as Timestamp).toDate()
          : (map['created_at'] is Timestamp
              ? (map['created_at'] as Timestamp).toDate()
              : DateTime.now()),
      updatedAt: map['updatedAt'] is Timestamp
          ? (map['updatedAt'] as Timestamp).toDate()
          : (map['updated_at'] is Timestamp
              ? (map['updated_at'] as Timestamp).toDate()
              : DateTime.now()),
    );
  }
}
