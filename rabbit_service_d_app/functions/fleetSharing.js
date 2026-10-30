const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Helper: Send in-app notification to Users/{uid}/UserNotifications
 * Uses a deterministic document ID (share_${shareId}_${type}) to prevent duplicate notifications.
 */
const sendInAppNotification = async (
  targetUid,
  { title, message, shareId, type }
) => {
  if (!targetUid) return;
  try {
    const notifDocId = `share_${shareId}_${type || "fleet_sharing"}`;
    const notifDoc = {
      type: type || "fleet_sharing",
      category: "fleet_sharing",
      title: title || "Trenoops Fleet Sharing Update",
      message: message || "",
      shareId: shareId || "",
      appName: "Trenoops",
      date: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      notifications: [],
    };
    await admin
      .firestore()
      .collection("Users")
      .doc(targetUid)
      .collection("UserNotifications")
      .doc(notifDocId)
      .set(notifDoc, { merge: true });
  } catch (err) {
    console.error(
      `Error sending in-app notification to user ${targetUid}:`,
      err
    );
  }
};

/**
 * Helper: Send Push Notification via FCM
 */
const sendPushNotification = async (
  targetUid,
  { title, body, shareId, type }
) => {
  if (!targetUid) return;
  try {
    const userDoc = await admin
      .firestore()
      .collection("Users")
      .doc(targetUid)
      .get();
    if (!userDoc.exists) return;
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: title || "Trenoops Fleet Sharing",
        body: body || "",
      },
      data: {
        appName: "Trenoops",
        type: type || "fleet_sharing",
        shareId: shareId || "",
      },
    });
  } catch (err) {
    console.error(`Error sending push notification to user ${targetUid}:`, err);
  }
};

/**
 * 1. onCreate Trigger for fleet_shares/{shareId}
 * - When a direct offer is created: Notify borrower (by looking up email or borrowerId).
 * - When a borrow request is created: Notify target lender or create log.
 * - Records initial history event.
 */
const onFleetShareCreated = functions.firestore
  .document("fleet_shares/{shareId}")
  .onCreate(async (snap, context) => {
    const shareId = context.params.shareId;
    const data = snap.data();
    if (!data) return null;

    const db = admin.firestore();

    try {
      // 1. If borrowerId is missing but borrowerEmail is present, resolve borrowerId
      let borrowerUid = data.borrowerId;
      if (!borrowerUid && data.borrowerEmail) {
        const cleanEmail = data.borrowerEmail.trim().toLowerCase();
        const usersSnap = await db
          .collection("Users")
          .where("email", "==", cleanEmail)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const bDoc = usersSnap.docs[0];
          borrowerUid = bDoc.id;
          const bData = bDoc.data();
          await snap.ref.update({
            borrowerId: borrowerUid,
            borrowerName:
              bData.userName || bData.name || data.borrowerName || "",
            borrowerCompanyName:
              bData.companyName || data.borrowerCompanyName || "",
          });
        }
      }

      // 1b. If lenderId is missing but lenderEmail is present (e.g. from a borrow_request), resolve lenderId
      let lenderUid = data.lenderId;
      if (!lenderUid && data.lenderEmail) {
        const cleanLenderEmail = data.lenderEmail.trim().toLowerCase();
        const lenderSnap = await db
          .collection("Users")
          .where("email", "==", cleanLenderEmail)
          .limit(1)
          .get();

        if (!lenderSnap.empty) {
          const lDoc = lenderSnap.docs[0];
          lenderUid = lDoc.id;
          const lData = lDoc.data();
          await snap.ref.update({
            lenderId: lenderUid,
            lenderName: lData.userName || lData.name || data.lenderName || "",
            lenderCompanyName:
              lData.companyName || data.lenderCompanyName || "",
          });
        }
      }

      // 2. Mark vehicles as sharing_pending: true on lender's fleet so they aren't double-offered
      if (
        data.type === "direct_offer" &&
        Array.isArray(data.vehicles) &&
        data.lenderId
      ) {
        const batch = db.batch();
        for (const v of data.vehicles) {
          if (v.vehicleId) {
            const vRef = db
              .collection("Users")
              .doc(data.lenderId)
              .collection("Vehicles")
              .doc(v.vehicleId);
            batch.update(vRef, {
              sharingPending: true,
              pendingShareId: shareId,
            });
          }
        }
        await batch.commit();
      }

      // 3. Log History Entry
      await snap.ref.collection("history").add({
        action: "CREATED",
        type: data.type || "direct_offer",
        performedBy: data.createdById || data.lenderId || "",
        performedByEmail: data.lenderEmail || "",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        notes: data.description || "Fleet sharing request initiated.",
      });

      // 4. Send Notifications
      if (data.type === "direct_offer" && borrowerUid) {
        const lenderTitle =
          data.lenderCompanyName || data.lenderName || "A Fleet Owner";
        const vCount = Array.isArray(data.vehicles) ? data.vehicles.length : 1;
        const notifTitle = "New Equipment Sharing Offer";
        const notifMsg = `${lenderTitle} offered to share ${vCount} vehicle(s) with your fleet. Click to review.`;

        await sendInAppNotification(borrowerUid, {
          title: notifTitle,
          message: notifMsg,
          shareId,
          type: "fleet_sharing_offer",
        });

        await sendPushNotification(borrowerUid, {
          title: notifTitle,
          body: notifMsg,
          shareId,
          type: "fleet_sharing_offer",
        });
      } else if (
        data.type === "borrow_request" &&
        (lenderUid || data.lenderId)
      ) {
        const targetLenderUid = lenderUid || data.lenderId;
        const borrowerTitle =
          data.borrowerCompanyName || data.borrowerName || "A Fleet Owner";
        const tCount = data.requestedCounts?.trucks || 0;
        const trCount = data.requestedCounts?.trailers || 0;
        const notifTitle = "Fleet Equipment Request";
        const notifMsg = `${borrowerTitle} requested ${tCount} truck(s) & ${trCount} trailer(s).`;

        await sendInAppNotification(targetLenderUid, {
          title: notifTitle,
          message: notifMsg,
          shareId,
          type: "fleet_sharing_request",
        });

        await sendPushNotification(targetLenderUid, {
          title: notifTitle,
          body: notifMsg,
          shareId,
          type: "fleet_sharing_request",
        });
      }

      return null;
    } catch (error) {
      console.error(
        `Error in onFleetShareCreated for shareId ${shareId}:`,
        error
      );
      return null;
    }
  });

/**
 * 2. onUpdate Trigger for fleet_shares/{shareId}
 * Handles State Machine transitions:
 * - status -> 'active': locks lender vehicles (isAssignedToOther: true) & mirrors into borrower's SharedVehicles
 * - status -> 'completed' / 'returned': unlocks lender vehicles (isAssignedToOther: false) & marks borrower's shared vehicle inactive
 * - status -> 'rejected' / 'cancelled': clears sharingPending: false
 * - Logs all transitions in fleet_shares/{shareId}/history
 */
const onFleetShareStatusChanged = functions.firestore
  .document("fleet_shares/{shareId}")
  .onUpdate(async (change, context) => {
    const shareId = context.params.shareId;
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;
    if (before.status === after.status) return null; // Only react to status transitions

    const db = admin.firestore();
    const newStatus = after.status;
    const lenderId = after.lenderId;
    const borrowerId = after.borrowerId;
    const vehicles = Array.isArray(after.vehicles) ? after.vehicles : [];

    try {
      const batch = db.batch();

      // ==========================================
      // Transition: -> ACTIVE
      // ==========================================
      if (newStatus === "active") {
        for (const v of vehicles) {
          if (!v.vehicleId || !lenderId) continue;

          // 1. Update Lender's Master Vehicle: isAssignedToOther: true
          const lenderVehicleRef = db
            .collection("Users")
            .doc(lenderId)
            .collection("Vehicles")
            .doc(v.vehicleId);

          batch.update(lenderVehicleRef, {
            isAssignedToOther: true,
            sharingPending: false,
            activeShareId: shareId,
            sharedWith: {
              borrowerId: borrowerId || "",
              borrowerEmail: after.borrowerEmail || "",
              borrowerName: after.borrowerName || "",
              sharedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          });

          // 2. Mirror into Borrower's SharedVehicles collection
          // allowMilesUpdate is explicitly FALSE to protect master odometer
          if (borrowerId) {
            const borrowerSharedRef = db
              .collection("Users")
              .doc(borrowerId)
              .collection("SharedVehicles")
              .doc(v.vehicleId);

            batch.set(
              borrowerSharedRef,
              {
                id: v.vehicleId,
                vehicleNumber: v.vehicleNumber || "",
                vehicleType: v.vehicleType || "Truck",
                companyName:
                  v.companyName || after.lenderCompanyName || "Partner Fleet",
                vin: v.vin || "",
                isSharedFromOther: true,
                allowMilesUpdate: false, // Protected: records only, no miles update
                lenderId: lenderId,
                lenderEmail: after.lenderEmail || "",
                lenderName: after.lenderName || "",
                shareId: shareId,
                active: true,
                assignedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }

        // Notify Lender that Offer/Request was accepted
        if (lenderId) {
          const bTitle =
            after.borrowerCompanyName || after.borrowerName || "Borrower";
          const title = "Fleet Share Accepted";
          const msg = `${bTitle} accepted the fleet share (${
            after.shareCode || shareId
          }). Vehicles are now active with partner.`;

          await sendInAppNotification(lenderId, {
            title,
            message: msg,
            shareId,
            type: "fleet_sharing_accepted",
          });
          await sendPushNotification(lenderId, {
            title,
            body: msg,
            shareId,
            type: "fleet_sharing_accepted",
          });
        }
      }

      // ==========================================
      // Transition: -> COMPLETED / RETURNED
      // ==========================================
      else if (newStatus === "completed" || newStatus === "returned") {
        for (const v of vehicles) {
          if (!v.vehicleId || !lenderId) continue;

          // 1. Release Lender's Master Vehicle: isAssignedToOther: false
          const lenderVehicleRef = db
            .collection("Users")
            .doc(lenderId)
            .collection("Vehicles")
            .doc(v.vehicleId);

          batch.update(lenderVehicleRef, {
            isAssignedToOther: false,
            sharingPending: false,
            activeShareId: null,
            sharedWith: null,
            lastReturnedShareId: shareId,
            returnedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // 2. Mark Borrower's SharedVehicles entry as inactive
          if (borrowerId) {
            const borrowerSharedRef = db
              .collection("Users")
              .doc(borrowerId)
              .collection("SharedVehicles")
              .doc(v.vehicleId);

            batch.update(borrowerSharedRef, {
              active: false,
              returnedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        // Notify both parties
        const completedMsg = `Fleet sharing (${
          after.shareCode || shareId
        }) has ended. Vehicles have been returned to owner.`;
        if (lenderId) {
          await sendInAppNotification(lenderId, {
            title: "Vehicle Returned / Share Completed",
            message: completedMsg,
            shareId,
            type: "fleet_sharing_returned",
          });
        }
        if (borrowerId) {
          await sendInAppNotification(borrowerId, {
            title: "Fleet Share Closed",
            message: completedMsg,
            shareId,
            type: "fleet_sharing_returned",
          });
        }
      }

      // ==========================================
      // Transition: -> REJECTED / CANCELLED
      // ==========================================
      else if (newStatus === "rejected" || newStatus === "cancelled") {
        for (const v of vehicles) {
          if (!v.vehicleId || !lenderId) continue;

          const lenderVehicleRef = db
            .collection("Users")
            .doc(lenderId)
            .collection("Vehicles")
            .doc(v.vehicleId);

          batch.update(lenderVehicleRef, {
            sharingPending: false,
            pendingShareId: null,
          });
        }

        // If rejected by borrower, notify lender
        if (newStatus === "rejected" && lenderId) {
          const bTitle =
            after.borrowerCompanyName || after.borrowerName || "Partner";
          await sendInAppNotification(lenderId, {
            title: "Fleet Share Offer Declined",
            message: `${bTitle} declined your equipment sharing offer (${
              after.shareCode || shareId
            }).`,
            shareId,
            type: "fleet_sharing_declined",
          });
        }
      }

      await batch.commit();

      // Log History Record
      await change.after.ref.collection("history").add({
        action: newStatus.toUpperCase(),
        previousStatus: before.status,
        newStatus: newStatus,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: after.lastUpdatedById || "",
        notes:
          after.returnNotes ||
          after.rejectionReason ||
          `Status transitioned to ${newStatus}.`,
      });

      return null;
    } catch (error) {
      console.error(
        `Error in onFleetShareStatusChanged for shareId ${shareId}:`,
        error
      );
      return null;
    }
  });

module.exports = {
  onFleetShareCreated,
  onFleetShareStatusChanged,
};
