import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:regal_service_d_app/utils/constants.dart';

double safeParseDouble(dynamic value, [double defaultValue = 0.0]) {
  if (value == null) return defaultValue;
  if (value is num) return value.toDouble();
  if (value is String) {
    return double.tryParse(value.replaceAll(',', '').trim()) ?? defaultValue;
  }
  return defaultValue;
}

int safeParseInt(dynamic value, [int defaultValue = 0]) {
  if (value == null) return defaultValue;
  if (value is num) return value.toInt();
  if (value is String) {
    return int.tryParse(value.replaceAll(',', '').trim()) ?? defaultValue;
  }
  return defaultValue;
}

DateTime? parseFleetDate(dynamic dateVal) {
  if (dateVal == null) return null;
  if (dateVal is DateTime) return dateVal;
  if (dateVal is Timestamp) return dateVal.toDate();
  if (dateVal is int) return DateTime.fromMillisecondsSinceEpoch(dateVal);

  final rawStr = dateVal.toString().trim();
  if (rawStr.isEmpty ||
      rawStr == 'N/A' ||
      rawStr == 'null' ||
      rawStr == '-' ||
      rawStr == '—' ||
      rawStr.toLowerCase() == 'open') {
    return null;
  }

  // Handle stringified Timestamp e.g. Timestamp(seconds=1730000000, nanoseconds=0)
  if (rawStr.startsWith('Timestamp(')) {
    final match = RegExp(r'seconds=(\d+)').firstMatch(rawStr);
    if (match != null) {
      final sec = int.tryParse(match.group(1)!);
      if (sec != null) {
        return DateTime.fromMillisecondsSinceEpoch(sec * 1000);
      }
    }
  }

  // Handle clean date prefix like 2026-11-03 or 11-03-2026
  final cleanStr = rawStr.split(' ')[0].split('T')[0];
  final match =
      RegExp(r'^(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})$').firstMatch(cleanStr);
  if (match != null) {
    final p1 = int.tryParse(match.group(1)!) ?? 0;
    final p2 = int.tryParse(match.group(2)!) ?? 0;
    final p3 = int.tryParse(match.group(3)!) ?? 0;

    if (p1 >= 1000) {
      // YYYY-MM-DD
      return DateTime(p1, p2.clamp(1, 12), p3.clamp(1, 31));
    } else if (p3 >= 1000 || (p3 >= 20 && p3 <= 99)) {
      final year = p3 < 100 ? (2000 + p3) : p3;
      int month = p1;
      int day = p2;
      if (month > 12 && day <= 12) {
        final temp = month;
        month = day;
        day = temp;
      }
      return DateTime(year, month.clamp(1, 12), day.clamp(1, 31));
    }
  }

  final dt = DateTime.tryParse(rawStr);
  if (dt != null) return dt;

  final formats = [
    'MM-dd-yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
    'MMM dd, yyyy',
    'MM-dd-yyyy hh:mm a',
    'yyyy-MM-dd HH:mm:ss',
  ];
  for (final fmt in formats) {
    try {
      return DateFormat(fmt).parseLoose(rawStr);
    } catch (_) {}
  }

  return null;
}

String formatFleetDate(dynamic dateVal, [String fallback = 'N/A']) {
  if (dateVal == null) return fallback;
  if (dateVal is String) {
    final s = dateVal.trim();
    if (s.isEmpty || s == 'null' || s == '-' || s == '—' || s == 'N/A') {
      return fallback;
    }
    if (s.toLowerCase() == 'open') return 'Open';
  }
  final dt = parseFleetDate(dateVal);
  if (dt != null) {
    return DateFormat('MM-dd-yyyy').format(dt);
  }
  return fallback;
}

class SharedVehicleItem {
  final String vehicleId;
  final String vehicleNumber;
  final String vehicleType;
  final String companyName;
  final String vin;
  final double currentMilesAtShare;
  final double? returnedMiles;

  SharedVehicleItem({
    required this.vehicleId,
    required this.vehicleNumber,
    required this.vehicleType,
    required this.companyName,
    this.vin = '',
    this.currentMilesAtShare = 0.0,
    this.returnedMiles,
  });

  factory SharedVehicleItem.fromMap(Map<String, dynamic> map) {
    return SharedVehicleItem(
      vehicleId: (map['vehicleId'] ?? map['id'] ?? '').toString(),
      vehicleNumber: (map['vehicleNumber'] ?? map['name'] ?? '').toString(),
      vehicleType: (map['vehicleType'] ?? 'Truck').toString(),
      companyName: (map['companyName'] ?? '').toString(),
      vin: (map['vin'] ?? '').toString(),
      currentMilesAtShare: safeParseDouble(
          map['currentMilesAtShare'] ?? map['currentMiles'] ?? map['currentReading']),
      returnedMiles: map['returnedMiles'] != null
          ? safeParseDouble(map['returnedMiles'])
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'vehicleId': vehicleId,
      'vehicleNumber': vehicleNumber,
      'vehicleType': vehicleType,
      'companyName': companyName,
      'vin': vin,
      'currentMilesAtShare': currentMilesAtShare,
      if (returnedMiles != null) 'returnedMiles': returnedMiles,
    };
  }
}

class FleetShareDoc {
  final String id;
  final String shareCode;
  final String type; // direct_offer | borrow_request
  final String status; // pending | active | rejected | cancelled | completed
  final String lenderId;
  final String lenderEmail;
  final String lenderName;
  final String lenderCompanyName;
  final String borrowerId;
  final String borrowerEmail;
  final String borrowerName;
  final String borrowerCompanyName;
  final int requestedTrucks;
  final int requestedTrailers;
  final List<SharedVehicleItem> vehicles;
  final String description;
  final String leaseTerms;
  final String startDate;
  final String expectedEndDate;
  final String actualEndDate;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String createdById;

  FleetShareDoc({
    required this.id,
    required this.shareCode,
    required this.type,
    required this.status,
    required this.lenderId,
    required this.lenderEmail,
    required this.lenderName,
    required this.lenderCompanyName,
    required this.borrowerId,
    required this.borrowerEmail,
    required this.borrowerName,
    required this.borrowerCompanyName,
    this.requestedTrucks = 0,
    this.requestedTrailers = 0,
    required this.vehicles,
    this.description = '',
    this.leaseTerms = '',
    this.startDate = '',
    this.expectedEndDate = '',
    this.actualEndDate = '',
    this.createdAt,
    this.updatedAt,
    this.createdById = '',
  });

  factory FleetShareDoc.fromFirestore(DocumentSnapshot doc) {
    final map = (doc.data() as Map<String, dynamic>?) ?? {};
    final vList = (map['vehicles'] as List<dynamic>? ?? [])
        .map((v) => v is Map<String, dynamic>
            ? SharedVehicleItem.fromMap(v)
            : SharedVehicleItem.fromMap(Map<String, dynamic>.from(v as Map)))
        .toList();

    String extractDateRaw(dynamic val) {
      if (val == null) return '';
      if (val is Timestamp) {
        return DateFormat('MM-dd-yyyy').format(val.toDate());
      }
      if (val is DateTime) {
        return DateFormat('MM-dd-yyyy').format(val);
      }
      final s = val.toString().trim();
      if (s == 'null') return '';
      return s;
    }

    final counts = map['requestedCounts'] as Map<String, dynamic>?;

    return FleetShareDoc(
      id: doc.id,
      shareCode: (map['shareCode'] ?? 'SHR-${doc.id.substring(0, 6)}').toString(),
      type: (map['type'] ?? 'direct_offer').toString(),
      status: (map['status'] ?? 'pending').toString(),
      lenderId: (map['lenderId'] ?? '').toString(),
      lenderEmail: (map['lenderEmail'] ?? '').toString(),
      lenderName: (map['lenderName'] ?? 'Fleet Owner').toString(),
      lenderCompanyName: (map['lenderCompanyName'] ?? '').toString(),
      borrowerId: (map['borrowerId'] ?? '').toString(),
      borrowerEmail: (map['borrowerEmail'] ?? '').toString(),
      borrowerName: (map['borrowerName'] ?? 'Partner Owner').toString(),
      borrowerCompanyName: (map['borrowerCompanyName'] ?? '').toString(),
      requestedTrucks: safeParseInt(counts?['trucks'] ?? map['requestedTrucks']),
      requestedTrailers: safeParseInt(counts?['trailers'] ?? map['requestedTrailers']),
      vehicles: vList,
      description: (map['description'] ?? '').toString(),
      leaseTerms: (map['leaseTerms'] ?? '').toString(),
      startDate: extractDateRaw(map['startDate']),
      expectedEndDate: extractDateRaw(map['expectedEndDate']),
      actualEndDate: extractDateRaw(map['actualEndDate']),
      createdAt: parseFleetDate(map['createdAt']),
      updatedAt: parseFleetDate(map['updatedAt']),
      createdById: (map['createdById'] ?? '').toString(),
    );
  }

  bool isLender(String uid, [String? email]) {
    final cleanEmail = (email ?? '').trim().toLowerCase();
    return lenderId == uid ||
        (cleanEmail.isNotEmpty && lenderEmail.toLowerCase() == cleanEmail);
  }

  bool isBorrower(String uid, [String? email]) {
    final cleanEmail = (email ?? '').trim().toLowerCase();
    return borrowerId == uid ||
        (cleanEmail.isNotEmpty && borrowerEmail.toLowerCase() == cleanEmail);
  }

  bool get isDirectOffer => type == 'direct_offer';
  bool get isBorrowRequest => type == 'borrow_request';

  bool get isPending => status == 'pending';
  bool get isActive => status == 'active';
  bool get isCompleted => status == 'completed';
  bool get isRejected => status == 'rejected';
  bool get isCancelled => status == 'cancelled';

  Color get statusColor {
    switch (status) {
      case 'active':
        return kSecondary;
      case 'pending':
        return Colors.amber.shade800;
      case 'completed':
        return kDarkGray;
      case 'rejected':
      case 'cancelled':
        return kRed;
      default:
        return kGray;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.toUpperCase();
    }
  }

  String get formattedStartDate => formatFleetDate(startDate, 'N/A');

  String get formattedExpectedEndDate => formatFleetDate(expectedEndDate, 'Open');

  String get formattedActualEndDate => formatFleetDate(actualEndDate, 'N/A');

  String get formattedEndDate {
    if (actualEndDate.isNotEmpty) {
      return formatFleetDate(actualEndDate, 'Open');
    }
    return formatFleetDate(expectedEndDate, 'Open');
  }
}

class LocalFleetVehicle {
  final String id;
  final String vehicleNumber;
  final String vehicleType; // 'Truck' or 'Trailer'
  final String companyName;
  final String vin;
  final double currentMiles;
  final bool active;
  final bool isAssignedToOther;
  final bool sharingPending;
  final Map<String, dynamic>? sharedWith;

  LocalFleetVehicle({
    required this.id,
    required this.vehicleNumber,
    required this.vehicleType,
    required this.companyName,
    this.vin = '',
    this.currentMiles = 0.0,
    this.active = true,
    this.isAssignedToOther = false,
    this.sharingPending = false,
    this.sharedWith,
  });

  bool get isAvailable => active && !isAssignedToOther && !sharingPending;

  String get borrowerName {
    if (sharedWith == null) return '';
    return (sharedWith!['borrowerCompanyName'] ??
            sharedWith!['borrowerName'] ??
            '')
        .toString()
        .trim();
  }

  factory LocalFleetVehicle.fromFirestore(DocumentSnapshot doc) {
    final data = (doc.data() as Map<String, dynamic>?) ?? {};
    final vNum = (data['vehicleNumber'] ??
            data['vehicle_number'] ??
            data['name'] ??
            doc.id)
        .toString()
        .trim();
    final vTypeRaw = (data['vehicleType'] ?? 'Truck').toString();
    final vType = vTypeRaw.toLowerCase() == 'trailer' ? 'Trailer' : 'Truck';
    final comp = (data['companyName'] ?? data['myCompany'] ?? 'My Fleet')
        .toString()
        .trim();
    final vin = (data['vin'] ?? '').toString().trim();
    final miles = safeParseDouble(data['currentMiles'] ?? data['currentReading']);

    final isActive = data['active'] != false;
    final isAssigned = data['isAssignedToOther'] == true ||
        data['isAssignedToOther'] == 'true';
    final isPending = data['sharingPending'] == true ||
        data['sharingPending'] == 'true';
    final sharedWithData = data['sharedWith'] as Map<String, dynamic>?;

    return LocalFleetVehicle(
      id: doc.id,
      vehicleNumber: vNum.isNotEmpty ? vNum : doc.id,
      vehicleType: vType,
      companyName: comp,
      vin: vin,
      currentMiles: miles,
      active: isActive,
      isAssignedToOther: isAssigned,
      sharingPending: isPending,
      sharedWith: sharedWithData,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'vehicleNumber': vehicleNumber,
      'vehicleType': vehicleType,
      'companyName': companyName,
      'vin': vin,
      'currentMiles': currentMiles,
      'active': active,
      'isAssignedToOther': isAssignedToOther,
      'sharingPending': sharingPending,
    };
  }
}
