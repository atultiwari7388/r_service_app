import 'package:intl/intl.dart';

class OtherExpenseModel {
  final String id;
  final String userId;
  final String serviceId;
  final String serviceName;
  final bool isCustomService;
  final String companyId;
  final String companyName;
  final String vehicleId;
  final String vehicleNumber;
  final String teamMemberId;
  final String teamMemberName;
  final String teamMemberRole;
  final String teamMemberEmail;
  final String teamMemberPhone;
  final String date;
  final double amount;
  final String type; // "Credit" or "Debit"
  final String description;
  final String createdAt;
  final String updatedAt;
  final bool active;
  final String addedFrom;

  OtherExpenseModel({
    required this.id,
    required this.userId,
    this.serviceId = '',
    this.serviceName = 'Other Expense',
    this.isCustomService = false,
    this.companyId = '',
    this.companyName = '',
    this.vehicleId = '',
    this.vehicleNumber = '',
    this.teamMemberId = '',
    this.teamMemberName = '',
    this.teamMemberRole = '',
    this.teamMemberEmail = '',
    this.teamMemberPhone = '',
    required this.date,
    required this.amount,
    required this.type,
    this.description = '',
    this.createdAt = '',
    this.updatedAt = '',
    this.active = true,
    this.addedFrom = 'Mobile',
  });

  factory OtherExpenseModel.fromMap(Map<String, dynamic> map, String docId) {
    double parsedAmount = 0.0;
    if (map['amount'] != null) {
      if (map['amount'] is num) {
        parsedAmount = (map['amount'] as num).toDouble();
      } else {
        parsedAmount = double.tryParse(map['amount'].toString()) ?? 0.0;
      }
    }

    return OtherExpenseModel(
      id: docId,
      userId: map['userId']?.toString() ?? '',
      serviceId: map['serviceId']?.toString() ?? '',
      serviceName: map['serviceName']?.toString().trim().isNotEmpty == true
          ? map['serviceName'].toString().trim()
          : 'Other Expense',
      isCustomService: map['isCustomService'] == true,
      companyId: map['companyId']?.toString() ?? '',
      companyName: map['companyName']?.toString() ?? '',
      vehicleId: map['vehicleId']?.toString() ?? '',
      vehicleNumber: map['vehicleNumber']?.toString() ?? '',
      teamMemberId: map['teamMemberId']?.toString() ?? '',
      teamMemberName: map['teamMemberName']?.toString() ?? '',
      teamMemberRole: map['teamMemberRole']?.toString() ?? '',
      teamMemberEmail: map['teamMemberEmail']?.toString() ?? '',
      teamMemberPhone: map['teamMemberPhone']?.toString() ?? '',
      date: map['date']?.toString() ?? '',
      amount: parsedAmount,
      type: map['type']?.toString().toLowerCase() == 'credit' ? 'Credit' : 'Debit',
      description: map['description']?.toString() ?? '',
      createdAt: map['createdAt']?.toString() ?? '',
      updatedAt: map['updatedAt']?.toString() ?? '',
      active: map['active'] != false,
      addedFrom: map['addedFrom']?.toString() ?? 'Mobile',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'serviceId': serviceId,
      'serviceName': serviceName,
      'isCustomService': isCustomService,
      'companyId': companyId,
      'companyName': companyName,
      'vehicleId': vehicleId,
      'vehicleNumber': vehicleNumber,
      'teamMemberId': teamMemberId,
      'teamMemberName': teamMemberName,
      'teamMemberRole': teamMemberRole,
      'teamMemberEmail': teamMemberEmail,
      'teamMemberPhone': teamMemberPhone,
      'date': date,
      'amount': amount,
      'type': type,
      'description': description,
      'createdAt': createdAt.isNotEmpty ? createdAt : DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
      'active': active,
      'addedFrom': addedFrom,
    };
  }

  DateTime? get parsedDate {
    if (date.isEmpty) return null;
    try {
      final trimmed = date.trim();
      if (trimmed.contains('-') || trimmed.contains('/')) {
        final separator = trimmed.contains('-') ? '-' : '/';
        final parts = trimmed.split(separator);
        if (parts.length == 3) {
          final p0 = int.tryParse(parts[0]) ?? 0;
          final p1 = int.tryParse(parts[1]) ?? 0;
          final p2 = int.tryParse(parts[2]) ?? 0;
          if (parts[2].length == 4) {
            // MM-DD-YYYY or DD-MM-YYYY
            final month = p0 > 12 ? p1 : p0;
            final day = p0 > 12 ? p0 : p1;
            return DateTime(p2, month, day);
          } else if (parts[0].length == 4) {
            // YYYY-MM-DD
            return DateTime(p0, p1, p2);
          }
        }
      }
      return DateTime.tryParse(trimmed);
    } catch (_) {
      return null;
    }
  }

  String get formattedDisplayDate {
    final d = parsedDate;
    if (d == null) return date;
    try {
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) {
      return date;
    }
  }
}
