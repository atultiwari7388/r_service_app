const admin = require("firebase-admin");

/**
 * Format Date helper (MM-DD-YYYY HH:mm:ss)
 */
function formatCurrentDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse any miles or number safely
 */
function parseNumberSafe(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : Math.round(val);
  const cleaned = String(val).replace(/,/g, "").replace(/\s/g, "").trim();
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Calculate remaining units (miles, hours, or days)
 */
function calculateRemainingUnits(
  type,
  nextNotificationValue,
  currentMiles,
  currentHours
) {
  const normType = (type || "").toLowerCase();
  if (normType === "reading") {
    const nextVal = parseNumberSafe(nextNotificationValue, 0);
    return nextVal > 0 ? Math.max(0, nextVal - currentMiles) : null;
  }
  if (normType === "hours") {
    const nextVal = parseNumberSafe(nextNotificationValue, 0);
    return nextVal > 0 ? Math.max(0, nextVal - currentHours) : null;
  }
  if (normType === "day") {
    if (!nextNotificationValue) return null;
    const str = String(nextNotificationValue).trim();
    let dueDate = null;
    if (str.includes("-")) {
      const parts = str.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        // MM-DD-YYYY or YYYY-MM-DD
        if (parts[0] > 1900) {
          dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          dueDate = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    } else if (str.includes("/")) {
      const parts = str.split("/").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        dueDate = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    if (dueDate && !isNaN(dueDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = dueDate - today;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  }
  return null;
}

/**
 * Log maintenance activity, miles and notification comparisons to TrackDataNotifications
 * @param {Object} options
 */
async function logTrackDataNotification({
  userId,
  ownerId,
  vehicleId,
  actionType = "miles",
  source = "App",
  enteredMiles = null,
  previousMiles = null,
  enteredHours = null,
  previousHours = null,
  recordDetails = null,
  previousServices = [],
  serviceNotifications = [],
  hasNotifications = false,
  notifiedRecipients = [],
}) {
  if (!userId || !vehicleId) {
    console.warn(
      "logTrackDataNotification: Missing userId or vehicleId, skipping tracking."
    );
    return null;
  }

  const effectiveOwnerId = ownerId || userId;
  const db = admin.firestore();

  try {
    // 1. Fetch User Data
    let userData = {};
    try {
      const userSnap = await db.collection("Users").doc(userId).get();
      if (userSnap.exists) {
        userData = userSnap.data() || {};
      }
    } catch (uErr) {
      console.error(
        "Error fetching user data in logTrackDataNotification:",
        uErr
      );
    }

    const userName =
      userData.userName ||
      userData.name ||
      userData.displayName ||
      userData.companyName ||
      "Unknown User";
    const userEmail = userData.email || "";
    const userRole =
      userData.role || (userData.isTeamMember ? "TeamMember" : "Owner");
    const userCompany = userData.companyName || "";

    // 2. Fetch Vehicle Data from Owner collection
    let vehicleData = {};
    const vehicleRef = db
      .collection("Users")
      .doc(effectiveOwnerId)
      .collection("Vehicles")
      .doc(vehicleId);

    const vehicleSnap = await vehicleRef.get();
    if (vehicleSnap.exists) {
      vehicleData = vehicleSnap.data() || {};
    }

    const vehicleNumber = vehicleData.vehicleNumber || "Unknown";
    const vehicleType = vehicleData.vehicleType || "Truck";
    const engineName = vehicleData.engineName || vehicleData.engineNumber || "";
    const vehicleCompany =
      vehicleData.companyName || vehicleData.myCompany || userCompany;

    // 3. Resolve Current & Previous Miles / Hours
    let finalCurrentMiles = 0;
    let finalPreviousMiles = 0;
    let finalCurrentHours = 0;
    let finalPreviousHours = 0;

    if (vehicleType === "Truck") {
      const milesArr = Array.isArray(vehicleData.currentMilesArray)
        ? vehicleData.currentMilesArray
        : [];

      if (enteredMiles !== null && enteredMiles !== undefined) {
        finalCurrentMiles = parseNumberSafe(enteredMiles);
      } else if (milesArr.length > 0) {
        finalCurrentMiles = parseNumberSafe(
          milesArr[milesArr.length - 1]?.miles || vehicleData.currentMiles
        );
      } else {
        finalCurrentMiles = parseNumberSafe(vehicleData.currentMiles);
      }

      if (previousMiles !== null && previousMiles !== undefined) {
        finalPreviousMiles = parseNumberSafe(previousMiles);
      } else if (milesArr.length > 1) {
        finalPreviousMiles = parseNumberSafe(
          milesArr[milesArr.length - 2]?.miles
        );
      } else if (vehicleData.prevMilesValue !== undefined) {
        finalPreviousMiles = parseNumberSafe(vehicleData.prevMilesValue);
      } else {
        finalPreviousMiles = finalCurrentMiles;
      }
    } else if (vehicleType === "Trailer") {
      finalCurrentHours =
        enteredHours !== null && enteredHours !== undefined
          ? parseNumberSafe(enteredHours)
          : parseNumberSafe(vehicleData.hoursReading);

      finalPreviousHours =
        previousHours !== null && previousHours !== undefined
          ? parseNumberSafe(previousHours)
          : parseNumberSafe(
              vehicleData.prevHoursReadingValue !== undefined
                ? vehicleData.prevHoursReadingValue
                : finalCurrentHours
            );
    }

    const deltaMiles = Math.max(0, finalCurrentMiles - finalPreviousMiles);
    const deltaHours = Math.max(0, finalCurrentHours - finalPreviousHours);
    const nowIso = new Date().toISOString();
    const formattedDate = formatCurrentDateTime();

    // 4. Build previous services lookup map
    const prevMap = new Map();
    if (Array.isArray(previousServices)) {
      previousServices.forEach((s) => {
        if (!s) return;
        const key = (s.serviceId || s.id || s.serviceName || "")
          .toString()
          .toLowerCase();
        if (key) {
          prevMap.set(key, s.nextNotificationValue ?? s.defaultValue ?? 0);
        }
      });
    }

    // 5. Build notificationsArray (Previous vs Next notification values with Date)
    const currentServicesList = Array.isArray(vehicleData.services)
      ? vehicleData.services
      : Array.isArray(vehicleData.nextNotificationMiles)
      ? vehicleData.nextNotificationMiles
      : [];

    const notificationsArray = currentServicesList.map((service) => {
      const sId = service.serviceId || service.id || "";
      const sName = service.serviceName || "Unknown Service";
      const sType = (service.type || "reading").toLowerCase();
      const sDefault = parseNumberSafe(
        service.defaultNotificationValue || service.defaultValue,
        0
      );
      const nextNotificationValue = service.nextNotificationValue;

      // Determine previous notification value:
      // If client supplied previous value, use it;
      // Otherwise if action is "miles", the notification target didn't change so prev = next;
      // If action is "record" and service was renewed, prev is older target or calculated backward.
      const lookupKey = (sId || sName).toString().toLowerCase();
      let previousNotificationValue = prevMap.has(lookupKey)
        ? prevMap.get(lookupKey)
        : service.previousNotificationValue;

      if (
        previousNotificationValue === undefined ||
        previousNotificationValue === null
      ) {
        if (actionType === "miles") {
          previousNotificationValue = nextNotificationValue;
        } else if (
          actionType === "record" &&
          sType === "reading" &&
          sDefault > 0
        ) {
          const nextNum = parseNumberSafe(nextNotificationValue, 0);
          previousNotificationValue =
            nextNum > sDefault ? nextNum - sDefault : nextNum;
        } else {
          previousNotificationValue = nextNotificationValue || 0;
        }
      }

      const remainingUnits = calculateRemainingUnits(
        sType,
        nextNotificationValue,
        finalCurrentMiles,
        finalCurrentHours
      );

      const isDue =
        (sType === "reading" &&
          finalCurrentMiles > 0 &&
          parseNumberSafe(nextNotificationValue, 0) > 0 &&
          finalCurrentMiles >= parseNumberSafe(nextNotificationValue, 0)) ||
        (sType === "hours" &&
          finalCurrentHours > 0 &&
          parseNumberSafe(nextNotificationValue, 0) > 0 &&
          finalCurrentHours >= parseNumberSafe(nextNotificationValue, 0)) ||
        (sType === "day" && remainingUnits !== null && remainingUnits <= 15);

      return {
        serviceId: sId,
        serviceName: sName,
        type: sType,
        defaultNotificationValue: sDefault,
        previousNotificationValue: previousNotificationValue,
        nextNotificationValue: nextNotificationValue,
        date: formattedDate.split(" ")[0], // MM-DD-YYYY
        updatedAt: nowIso,
        remainingUnits: remainingUnits,
        isDue: isDue,
      };
    });

    // 6. Assemble complete document payload for TrackDataNotifications
    const trackPayload = {
      type: actionType, // "miles" | "record"
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      userRole: userRole,
      companyName: userCompany || vehicleCompany,
      ownerId: effectiveOwnerId,

      vehicleId: vehicleId,
      vehicleNumber: vehicleNumber,
      vehicleType: vehicleType,
      engineName: engineName,

      // Miles & Hours comparison
      milesData: {
        previousMiles: finalPreviousMiles,
        currentMiles: finalCurrentMiles,
        deltaMiles: deltaMiles,
        date: formattedDate,
      },
      hoursData: {
        previousHours: finalPreviousHours,
        currentHours: finalCurrentHours,
        deltaHours: deltaHours,
        date: formattedDate,
      },

      // Full notification array with dates & previous vs next values
      notificationsArray: notificationsArray,

      // Record specifics if type === "record"
      recordDetails:
        actionType === "record" && recordDetails
          ? {
              recordId: recordDetails.recordId || "",
              invoice: recordDetails.invoice || "",
              invoiceAmount: recordDetails.invoiceAmount || "",
              workshopName: recordDetails.workshopName || "",
              recordDate:
                recordDetails.recordDate || formattedDate.split(" ")[0],
              servicesSelected: recordDetails.servicesSelected || [],
            }
          : null,

      // Notification dispatch audit
      hasNotifications: hasNotifications,
      serviceNotifications: Array.isArray(serviceNotifications)
        ? serviceNotifications
        : [],
      notifiedRecipients: Array.isArray(notifiedRecipients)
        ? notifiedRecipients
        : [],
      notifiedRecipientsCount: Array.isArray(notifiedRecipients)
        ? notifiedRecipients.length
        : 0,

      // Metadata
      source: source || "App",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
    };

    // 7. Write to global TrackDataNotifications collection
    const trackDocRef = db.collection("TrackDataNotifications").doc();
    trackPayload.id = trackDocRef.id;
    await trackDocRef.set(trackPayload);

    console.log(
      `Logged TrackDataNotifications [${trackDocRef.id}] for vehicle ${vehicleNumber} (${actionType}) by ${userName}`
    );

    // 8. Update vehicle history array and prevMilesValue on owner's vehicle
    try {
      const historyEntry = {
        trackId: trackDocRef.id,
        type: actionType,
        source: source || "App",
        updatedBy: userId,
        updatedByName: userName,
        date: formattedDate,
        isoDate: nowIso,
        currentMiles: finalCurrentMiles,
        previousMiles: finalPreviousMiles,
        currentHours: finalCurrentHours,
        previousHours: finalPreviousHours,
        notifications: notificationsArray.map((n) => ({
          serviceName: n.serviceName,
          previousNotificationValue: n.previousNotificationValue,
          nextNotificationValue: n.nextNotificationValue,
          type: n.type,
          remainingUnits: n.remainingUnits,
          isDue: n.isDue,
        })),
      };

      const vehicleUpdate = {
        prevMilesValue: finalCurrentMiles,
        notificationHistoryArray:
          admin.firestore.FieldValue.arrayUnion(historyEntry),
      };

      if (vehicleType === "Trailer") {
        vehicleUpdate.prevHoursReadingValue = finalCurrentHours;
      }

      await vehicleRef.update(vehicleUpdate);
    } catch (vehUpdateErr) {
      console.warn(
        "Could not update notificationHistoryArray on Vehicle doc:",
        vehUpdateErr.message
      );
    }

    return trackPayload;
  } catch (error) {
    console.error("Critical error in logTrackDataNotification:", error);
    // Return null so calling function continues without throwing error to client
    return null;
  }
}

module.exports = {
  logTrackDataNotification,
  formatCurrentDateTime,
  parseNumberSafe,
};
