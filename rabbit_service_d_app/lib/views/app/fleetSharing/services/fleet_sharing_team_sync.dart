import 'package:cloud_firestore/cloud_firestore.dart';

/// Helper to sync vehicle fleet-sharing status across the Owner
/// and all Team Members under that Owner.
class FleetSharingTeamSync {
  /// Syncs one vehicle's status to the owner and all team members.
  static Future<void> syncVehicleAcrossTeam({
    required String ownerUid,
    required String vehicleId,
    required Map<String, dynamic> statusData,
    WriteBatch? existingBatch,
  }) async {
    await syncMultipleVehiclesAcrossTeam(
      ownerUid: ownerUid,
      vehicleIds: [vehicleId],
      statusData: statusData,
      existingBatch: existingBatch,
    );
  }

  /// Syncs multiple vehicles' status to the owner and all team members in a single batch.
  static Future<void> syncMultipleVehiclesAcrossTeam({
    required String ownerUid,
    required List<String> vehicleIds,
    required Map<String, dynamic> statusData,
    WriteBatch? existingBatch,
  }) async {
    final cleanOwnerUid = ownerUid.trim();
    final cleanVehicleIds = vehicleIds
        .map((id) => id.trim())
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    if (cleanOwnerUid.isEmpty || cleanVehicleIds.isEmpty) return;

    final firestore = FirebaseFirestore.instance;
    final batch = existingBatch ?? firestore.batch();

    // 1. Update owner's vehicle copies
    for (final vId in cleanVehicleIds) {
      final ownerVehicleRef = firestore
          .collection('Users')
          .doc(cleanOwnerUid)
          .collection('Vehicles')
          .doc(vId);
      batch.update(ownerVehicleRef, statusData);
    }

    // 2. Query all team members created by this owner
    try {
      final teamMembersSnap = await firestore
          .collection('Users')
          .where('createdBy', isEqualTo: cleanOwnerUid)
          .where('isTeamMember', isEqualTo: true)
          .get();

      for (final memberDoc in teamMembersSnap.docs) {
        for (final vId in cleanVehicleIds) {
          final memberVehicleRef = firestore
              .collection('Users')
              .doc(memberDoc.id)
              .collection('Vehicles')
              .doc(vId);

          final memberVehDoc = await memberVehicleRef.get();
          if (memberVehDoc.exists) {
            batch.update(memberVehicleRef, statusData);
          }
        }
      }
    } catch (e) {
      // Log error but allow operation to continue
      print('FleetSharingTeamSync error: $e');
    }

    if (existingBatch == null) {
      await batch.commit();
    }
  }
}
