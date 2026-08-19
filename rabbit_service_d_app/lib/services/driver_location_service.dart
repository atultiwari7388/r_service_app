import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DriverLocationService {
  static final DriverLocationService _instance =
      DriverLocationService._internal();
  factory DriverLocationService() => _instance;
  DriverLocationService._internal();

  static const String _prefIsTracking = 'driver_is_tracking';
  static const String _prefActiveLoadId = 'driver_active_load_id';
  static const String _prefOwnerId = 'driver_owner_id';
  static const String _prefLoadNumber = 'driver_load_number';
  static const String _prefVehicleNumber = 'driver_vehicle_number';

  Timer? _timer;
  bool _isTracking = false;

  bool get isTracking => _isTracking;

  /// Start 5-minute periodic location tracking
  static Future<bool> startTracking({
    required String loadId,
    required String ownerId,
    String? loadNumber,
    String? vehicleNumber,
  }) async {
    final service = DriverLocationService();
    final hasPermission = await _checkAndRequestPermission();
    if (!hasPermission) return false;

    // Save state in SharedPreferences for auto-resume
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefIsTracking, true);
    await prefs.setString(_prefActiveLoadId, loadId);
    await prefs.setString(_prefOwnerId, ownerId);
    if (loadNumber != null) await prefs.setString(_prefLoadNumber, loadNumber);
    if (vehicleNumber != null) {
      await prefs.setString(_prefVehicleNumber, vehicleNumber);
    }

    service._isTracking = true;

    // Immediate initial push
    await _sendLocationUpdate(
      loadId: loadId,
      ownerId: ownerId,
      loadNumber: loadNumber,
      vehicleNumber: vehicleNumber,
    );

    // Cancel existing timer if any
    service._timer?.cancel();

    // Start 5-minute periodic timer (300 seconds)
    service._timer = Timer.periodic(const Duration(minutes: 5), (_) async {
      await _sendLocationUpdate(
        loadId: loadId,
        ownerId: ownerId,
        loadNumber: loadNumber,
        vehicleNumber: vehicleNumber,
      );
    });

    return true;
  }

  /// Stop location tracking and mark offline
  static Future<void> stopTracking() async {
    final service = DriverLocationService();
    service._timer?.cancel();
    service._timer = null;
    service._isTracking = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefIsTracking);
    await prefs.remove(_prefActiveLoadId);
    await prefs.remove(_prefOwnerId);
    await prefs.remove(_prefLoadNumber);
    await prefs.remove(_prefVehicleNumber);

    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser != null) {
      try {
        await FirebaseFirestore.instance
            .collection('DriverLocations')
            .doc(currentUser.uid)
            .set({
          'isTrackingActive': false,
          'activeLoadId': null,
          'lastUpdated': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (e) {
        // ignore error on stop
      }
    }
  }

  /// Auto-resume tracking if active load was stored
  static Future<void> checkAndResumeTracking() async {
    final prefs = await SharedPreferences.getInstance();
    final isTracking = prefs.getBool(_prefIsTracking) ?? false;
    final loadId = prefs.getString(_prefActiveLoadId);
    final ownerId = prefs.getString(_prefOwnerId);
    final loadNumber = prefs.getString(_prefLoadNumber);
    final vehicleNumber = prefs.getString(_prefVehicleNumber);

    if (isTracking && loadId != null && ownerId != null) {
      // Verify load is still active in Firestore
      try {
        final loadDoc = await FirebaseFirestore.instance
            .collection('dispatch_loads')
            .doc(loadId)
            .get();

        if (loadDoc.exists) {
          final status =
              (loadDoc.data()?['status'] ?? '').toString().toLowerCase();
          if (status == 'delivered' ||
              status == 'completed' ||
              status == 'cancelled') {
            await stopTracking();
            return;
          }
        }
      } catch (_) {}

      await startTracking(
        loadId: loadId,
        ownerId: ownerId,
        loadNumber: loadNumber,
        vehicleNumber: vehicleNumber,
      );
    }
  }

  /// Check and request location permissions
  static Future<bool> _checkAndRequestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Send single location update to Firestore
  static Future<void> _sendLocationUpdate({
    required String loadId,
    required String ownerId,
    String? loadNumber,
    String? vehicleNumber,
  }) async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );

      final driverName = currentUser.displayName ?? 'Driver';
      final driverPhone = currentUser.phoneNumber ?? '';

      final timestamp = FieldValue.serverTimestamp();
      final speedKmph = (position.speed * 3.6).clamp(0.0, 200.0);

      String resolvedVehicle = (vehicleNumber ?? '').trim();
      if (resolvedVehicle.isEmpty) {
        try {
          final vehSnap = await FirebaseFirestore.instance
              .collection('Users')
              .doc(currentUser.uid)
              .collection('Vehicles')
              .limit(1)
              .get();
          if (vehSnap.docs.isNotEmpty) {
            final vd = vehSnap.docs.first.data();
            resolvedVehicle = (vd['vehicleNumber'] ?? vd['companyName'] ?? '').toString();
          }
        } catch (_) {}
      }

      // 1. Update live DriverLocations document
      final locationData = {
        'driverId': currentUser.uid,
        'driverName': driverName,
        'driverPhone': driverPhone,
        'ownerId': ownerId,
        'activeLoadId': loadId,
        'loadNumber': loadNumber ?? '',
        'vehicleNumber': resolvedVehicle,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'heading': position.heading,
        'speedKmph': double.parse(speedKmph.toStringAsFixed(1)),
        'accuracy': position.accuracy,
        'isTrackingActive': true,
        'lastUpdated': timestamp,
      };

      await FirebaseFirestore.instance
          .collection('DriverLocations')
          .doc(currentUser.uid)
          .set(locationData, SetOptions(merge: true));

      // 2. Append to ActiveLoadLocations breadcrumb history
      await FirebaseFirestore.instance
          .collection('ActiveLoadLocations')
          .doc(loadId)
          .collection('History')
          .add({
        'driverId': currentUser.uid,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'heading': position.heading,
        'speedKmph': double.parse(speedKmph.toStringAsFixed(1)),
        'accuracy': position.accuracy,
        'recordedAt': timestamp,
      });
    } catch (e) {
      // ignore individual telemetry push error
    }
  }
}
