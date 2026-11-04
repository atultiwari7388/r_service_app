const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Send in-app notification to Users/{uid}/UserNotifications
 */
const sendInAppNotification = async (
  targetUid,
  { title, message, docId, type }
) => {
  if (!targetUid) return;
  try {
    const notifDocId = `carrier_${docId || Date.now()}_${type || "log"}`;
    const notifDoc = {
      type: type || "carrier_fleet",
      category: "fleet_sharing",
      title: title || "Carrier Fleet Update",
      message: message || "",
      docId: docId || "",
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
 * Send Push Notification via FCM
 */
const sendPushNotification = async (
  targetUid,
  { title, body, docId, type }
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
        title: title || "Trenoops Fleet",
        body: body || "",
      },
      data: {
        appName: "Trenoops",
        type: type || "carrier_fleet",
        docId: docId || "",
      },
    });
  } catch (err) {
    console.error(`Error sending push notification to user ${targetUid}:`, err);
  }
};

/**
 * 1. onCreate Trigger for carriersRecords/{recordId}
 * Triggered whenever a record is created in carriersRecords.
 * If logged by the Carrier (toId), notifies the original Lender (fromId).
 */
const onCarrierRecordCreated = functions.firestore
  .document("carriersRecords/{recordId}")
  .onCreate(async (snap, context) => {
    const recordId = context.params.recordId;
    const data = snap.data();
    if (!data) return null;

    try {
      const {
        fromId,
        toId,
        createdById,
        vehicleNumber,
        serviceName,
        cost,
        workshopName,
      } = data;

      // Only notify if logged by the Carrier (borrower) or non-lender
      if (fromId && createdById !== fromId) {
        const title = `Carrier Service Logged: ${vehicleNumber || "Vehicle"}`;
        const message = `Carrier logged "${
          serviceName || "Maintenance Service"
        }"${cost ? ` ($${cost})` : ""}${
          workshopName ? ` at ${workshopName}` : ""
        } on your shared unit ${vehicleNumber || ""}.`;

        await Promise.all([
          sendInAppNotification(fromId, {
            title,
            message,
            docId: recordId,
            type: "carrier_record",
          }),
          sendPushNotification(fromId, {
            title,
            body: message,
            docId: recordId,
            type: "carrier_record",
          }),
        ]);
      }
    } catch (e) {
      console.error("Error in onCarrierRecordCreated trigger:", e);
    }
    return null;
  });

/**
 * 2. onUpdate Trigger for carriersVehicles/{cvId}
 * Triggered whenever a carrier vehicle's miles or status changes.
 */
const onCarrierVehicleUpdated = functions.firestore
  .document("carriersVehicles/{cvId}")
  .onUpdate(async (change, context) => {
    const cvId = context.params.cvId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) return null;

    try {
      const beforeMiles = Number(beforeData.currentMiles || 0);
      const afterMiles = Number(afterData.currentMiles || 0);

      // If miles updated and changed by carrier (or updated)
      if (afterMiles > beforeMiles && afterData.fromId) {
        const title = `Carrier Mileage Update: ${
          afterData.vehicleNumber || "Vehicle"
        }`;
        const message = `Odometer updated from ${beforeMiles.toLocaleString()} to ${afterMiles.toLocaleString()} miles (+${(
          afterMiles - beforeMiles
        ).toLocaleString()} mi) for ${afterData.vehicleNumber || "vehicle"}.`;

        await Promise.all([
          sendInAppNotification(afterData.fromId, {
            title,
            message,
            docId: cvId,
            type: "carrier_miles",
          }),
          sendPushNotification(afterData.fromId, {
            title,
            body: message,
            docId: cvId,
            type: "carrier_miles",
          }),
        ]);
      }
    } catch (e) {
      console.error("Error in onCarrierVehicleUpdated trigger:", e);
    }
    return null;
  });

module.exports = {
  onCarrierRecordCreated,
  onCarrierVehicleUpdated,
};
