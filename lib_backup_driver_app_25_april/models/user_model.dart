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
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
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
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  // Create a UserModel object from a Firestore document snapshot
  factory UserModel.fromMap(Map<String, dynamic> map, String documentId) {
    return UserModel(
      userId: documentId,
      name: map['name'],
      email: map['email'],
      address: map['address'],
      contactNumber: map['contactNumber'],
      vehicleDetails: map['vehicleDetails'],
      billingDetail: map['billingDetail'],
      profilePicture: map['profilePicture'] ?? '',
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }
}
