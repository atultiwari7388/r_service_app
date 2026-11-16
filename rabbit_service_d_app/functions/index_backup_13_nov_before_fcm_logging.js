const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { logTrackDataNotification } = require("./trackNotificationsHelper");

admin.initializeApp();

const db = admin.firestore();

const getDisplayAddress = (stop = {}) => {
  if (!stop || typeof stop !== "object") return "";
  return (stop.address || stop.locationNotes || stop.company || "")
    .toString()
    .trim();
};

const buildDispatchLoadMessage = (
  driverName,
  loadNumber,
  pickupStop,
  deliveryStop
) => {
  const pickupLabel = (pickupStop?.company || "Pickup").toString().trim();
  const deliveryLabel = (deliveryStop?.company || "Delivery").toString().trim();
  const safeDriverName = (driverName || "Driver").toString().trim();
  return `Hey ${safeDriverName}, a new load ${loadNumber} has been assigned to you from ${pickupLabel} to ${deliveryLabel}.`;
};

const createDispatchLoadNotificationDoc = ({ loadId, loadData, message }) => {
  const pickups = Array.isArray(loadData.pickups) ? loadData.pickups : [];
  const deliveries = Array.isArray(loadData.deliveries)
    ? loadData.deliveries
    : [];
  const pickupStop = pickups[0] || {};
  const deliveryStop = deliveries[deliveries.length - 1] || {};

  return {
    type: "dispatch_load",
    category: "dispatch_load",
    title: "New Load Assigned",
    loadId,
    loadNumber: loadData.loadNumber || loadId,
    customerName: loadData.customerName || loadData.customerSearch || "",
    driverId: loadData.driverId || "",
    driverName: loadData.driverName || "",
    pickupCompany: pickupStop.company || "",
    pickupAddress: getDisplayAddress(pickupStop),
    pickupDate: pickupStop.date || "",
    deliveryCompany: deliveryStop.company || "",
    deliveryAddress: getDisplayAddress(deliveryStop),
    deliveryDate: deliveryStop.date || "",
    status: loadData.status || "",
    tenderedMiles: loadData.tenderedMiles || "",
    message,
    date: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false,
    notifications: [],
  };
};

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const calculateDistance = (startLat, startLng, endLat, endLng) => {
  const radius = 6371.0; // Earth's radius in kilometers

  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.asin(Math.sqrt(a));

  return radius * c;
};
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Send contact email
exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  // Input validation
  if (!data.name || !data.email || !data.message || !data.recipientEmail) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields"
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email) || !emailRegex.test(data.recipientEmail)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid email format"
    );
  }

  const { name, email, phone, message, recipientEmail } = data;

  const mailOptions = {
    from: `"Trenoops Contact" <${process.env.EMAIL_USER}>`, // Use consistent sender
    replyTo: email, // Allow replying to contact submitter
    to: recipientEmail,
    subject: "New Contact Form Submission - Trenoops",
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send email. Please try again later."
    );
  }
});

//create team memeber function

exports.createTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in."
    );
  }

  const {
    email,
    email2,
    companyName,
    password,
    name,
    phone,
    telephone,
    address,
    city,
    state,
    country,
    postal,
    licenseNum,
    socialSecurity,
    perMileCharge,
    currentUId,
    selectedRole,
    selectedPayType,
    selectedVehicles,
    selectedRecordAccess,
    selectedChequeAccess,
    expensesPermission,
    licExpiryDate,
    dob,
    lastDrugTest,
    dateOfHire,
    dateOfTermination,
    currentDeviceId,
    lastLogin,
    createdFrom,
  } = data;

  if (!email || !password || !name || !phone || !selectedRole) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "All required fields must be provided."
    );
  }

  try {
    // Create Firebase Authentication User
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Prepare User Data with all fields
    const userData = {
      uid: userRecord.uid,
      email: email,
      email2: email2 || "",
      companyName: companyName || "",
      active: true,
      isAnonymous: false,
      isProfileComplete: true,
      userName: name,
      phoneNumber: phone,
      vehicleRange: "",
      telephone: telephone || "",
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      postalCode: postal || "",
      licenseNumber: licenseNum || "",
      socialSecurityNumber: socialSecurity || "",
      licenseExpiryDate: licExpiryDate
        ? admin.firestore.Timestamp.fromDate(new Date(licExpiryDate))
        : null,
      dateOfBirth: dob
        ? admin.firestore.Timestamp.fromDate(new Date(dob))
        : null,
      lastDrugTestDate: lastDrugTest
        ? admin.firestore.Timestamp.fromDate(new Date(lastDrugTest))
        : null,
      dateOfHire: dateOfHire
        ? admin.firestore.Timestamp.fromDate(new Date(dateOfHire))
        : null,
      dateOfTermination: dateOfTermination
        ? admin.firestore.Timestamp.fromDate(new Date(dateOfTermination))
        : null,
      createdBy: currentUId,
      profilePicture:
        "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
      role: selectedRole,
      teamMembers: [],
      payMode: selectedRole === "Driver" ? selectedPayType || "" : "",
      isManager: selectedRole === "Manager",
      isSubOwner: selectedRole === "SubOwner",
      isDriver: selectedRole === "Driver",
      isVendor: selectedRole === "Vendor",
      isAccountant: selectedRole === "Accountant",
      isOtherStaff: selectedRole === "Other Staff",
      perMileCharge: selectedRole === "Driver" ? perMileCharge || "0" : "0",
      isView:
        selectedRole == "SubOwner"
          ? true
          : selectedRecordAccess.includes("View"),
      isEdit:
        selectedRole == "SubOwner"
          ? true
          : selectedRecordAccess.includes("Edit"),
      isAdd:
        selectedRole == "SubOwner"
          ? true
          : selectedRecordAccess.includes("Add"),
      isCheque:
        selectedRole == "SubOwner"
          ? true
          : selectedChequeAccess.includes("Cheque"),
      expensesPermission:
        selectedRole == "SubOwner"
          ? { view: true, edit: true, add: true }
          : {
              view:
                expensesPermission &&
                typeof expensesPermission.view === "boolean"
                  ? expensesPermission.view
                  : false,
              edit:
                expensesPermission &&
                typeof expensesPermission.edit === "boolean"
                  ? expensesPermission.edit
                  : false,
              add:
                expensesPermission &&
                typeof expensesPermission.add === "boolean"
                  ? expensesPermission.add
                  : false,
            },
      isOwner: false,
      isTeamMember: true,
      isMultiDeEnable: false,
      status: "active",
      currentDeviceId: currentDeviceId || null,
      createdFrom: createdFrom,
      lastLogin: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
    };

    // Store in Firestore
    await admin
      .firestore()
      .collection("Users")
      .doc(userRecord.uid)
      .set(userData);

    // Add the new member's ID to the owner's teamMembers array
    const ownerRef = admin.firestore().collection("Users").doc(currentUId);
    await ownerRef.update({
      teamMembers: admin.firestore.FieldValue.arrayUnion(userRecord.uid),
    });

    // Copy Vehicles from the Creator to the New User if any are selected
    if (selectedVehicles && selectedVehicles.length > 0) {
      for (let vehicleId of selectedVehicles) {
        const vehicleDoc = await admin
          .firestore()
          .collection("Users")
          .doc(currentUId)
          .collection("Vehicles")
          .doc(vehicleId)
          .get();

        if (vehicleDoc.exists) {
          await admin
            .firestore()
            .collection("Users")
            .doc(userRecord.uid)
            .collection("Vehicles")
            .doc(vehicleId)
            .set(vehicleDoc.data());
        }

        // Copy DataServices for each vehicle
        const dataServicesSnapshot = await admin
          .firestore()
          .collection("Users")
          .doc(currentUId)
          .collection("DataServices")
          .where("vehicleId", "==", vehicleId)
          .get();

        for (let doc of dataServicesSnapshot.docs) {
          await admin
            .firestore()
            .collection("Users")
            .doc(userRecord.uid)
            .collection("DataServices")
            .doc(doc.id)
            .set(doc.data());
        }
      }
    }

    return {
      success: true,
      message: "Team member added successfully!",
      uid: userRecord.uid,
    };
  } catch (error) {
    console.error("Error creating team member:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Something went wrong.",
      error
    );
  }
});

// ==========================================
// MECHANIC WORKSHOP TEAM MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Creates a Field Mechanic Team Member under an authenticated Workshop Owner.
 * Runs via Admin SDK: Owner session in browser is NEVER signed out.
 * Saves to collection `Mechanics` with role="member", ownerId, baseCity, and inherited subscription.
 */
exports.createMechanicTeamMember = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Owner must be logged in to create team members."
      );
    }

    const ownerUid = context.auth.uid;
    const db = admin.firestore();

    // 1. Verify caller is an Owner in Mechanics with active subscription
    const ownerDocRef = db.collection("Mechanics").doc(ownerUid);
    const ownerDocSnap = await ownerDocRef.get();

    if (!ownerDocSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Owner mechanic profile not found."
      );
    }

    const ownerData = ownerDocSnap.data();

    if (ownerData.isSubscriptionPurchase !== true) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "An active workshop subscription plan is required to add team members."
      );
    }

    const {
      name,
      email,
      password,
      phone,
      telephone,
      address,
      baseCity,
      baseState,
      postalCode,
      country,
      perHCharge,
      selectedServices,
      allowDirectJobAcceptance = false,
    } = data;

    if (!email || !password || !name) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, email, and password are required fields."
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    try {
      // 2. Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password: String(password),
        displayName: cleanName,
      });

      const now = admin.firestore.FieldValue.serverTimestamp();

      // 3. Prepare Member document in Mechanics collection
      const memberDocData = {
        uid: userRecord.uid,
        email: cleanEmail,
        userName: cleanName,
        workshopName:
          ownerData.workshopName || ownerData.userName || "Mechanic Workshop",
        cellPhone: phone ? String(phone).trim() : "",
        telephone: telephone ? String(telephone).trim() : "",
        address: address ? String(address).trim() : "",
        city: baseCity ? String(baseCity).trim() : ownerData.city || "",
        state: baseState ? String(baseState).trim() : ownerData.state || "",
        country: country ? String(country).trim() : "USA",
        postalCode: postalCode ? String(postalCode).trim() : "",
        dateOfBirth: "",
        experience: "",
        description: "",
        perHCharge:
          typeof perHCharge === "number"
            ? perHCharge
            : parseFloat(perHCharge || "0") || ownerData.perHCharge || 0,
        lastAddress: "",
        languages: ownerData.languages || { English: true },
        location: {
          latitude:
            typeof data.latitude === "number"
              ? data.latitude
              : ownerData.location?.latitude || 0,
          longitude:
            typeof data.longitude === "number"
              ? data.longitude
              : ownerData.location?.longitude || 0,
        },
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        isNotificationOn: true,
        wallet: 0,
        active: true,
        isEnabled: true,
        isMultiDeEnable: false,
        fcmToken: null,
        selected_services: Array.isArray(selectedServices)
          ? selectedServices
          : ownerData.selected_services || [],

        // Role & Subscription Hierarchy
        role: "member",
        isOwner: false,
        isTeamMember: true,
        ownerId: ownerUid,
        isSubscriptionPurchase: true,
        inheritedSubscriptionOwnerId: ownerUid,
        allowDirectJobAcceptance: Boolean(allowDirectJobAcceptance),

        // Performance stats
        rating: 5.0,
        totalCompletedJobs: 0,
        totalReviewsCount: 0,

        // Current workload
        currentActiveJobId: null,
        activeJobStartedAt: null,
        activeJobEstimatedMinutes: null,

        created_at: now,
        updated_at: now,
      };

      // 4. Save to Firestore
      await db.collection("Mechanics").doc(userRecord.uid).set(memberDocData);

      // 5. Append to Owner's teamMembers list
      await ownerDocRef.update({
        teamMembers: admin.firestore.FieldValue.arrayUnion(userRecord.uid),
        updated_at: now,
      });

      return {
        success: true,
        message: `Team member ${cleanName} created successfully!`,
        memberUid: userRecord.uid,
      };
    } catch (err) {
      console.error("Error creating mechanic team member:", err);
      throw new functions.https.HttpsError(
        err.code === "auth/email-already-exists"
          ? "already-exists"
          : "internal",
        err.message || "Failed to create team member."
      );
    }
  }
);

/**
 * Removes a Field Mechanic Team Member and cleans up Auth & Owner references.
 */
exports.deleteMechanicTeamMember = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Owner must be logged in to delete team members."
      );
    }

    const ownerUid = context.auth.uid;
    const { memberUid } = data;

    if (!memberUid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "memberUid is required."
      );
    }

    const db = admin.firestore();
    const memberRef = db.collection("Mechanics").doc(memberUid);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Member not found.");
    }

    const memberData = memberSnap.data();
    if (memberData.ownerId !== ownerUid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You are not authorized to remove this team member."
      );
    }

    try {
      // 1. Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(memberUid);
      } catch (authErr) {
        console.warn(
          "Auth user deletion warning (may not exist in auth):",
          authErr
        );
      }

      // 2. Delete member document from Firestore
      await memberRef.delete();

      // 3. Remove from Owner's teamMembers array
      await db
        .collection("Mechanics")
        .doc(ownerUid)
        .update({
          teamMembers: admin.firestore.FieldValue.arrayRemove(memberUid),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        message: "Team member removed successfully.",
      };
    } catch (err) {
      console.error("Error deleting mechanic team member:", err);
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Failed to delete team member."
      );
    }
  }
);

/**
 * Updates an existing Field Mechanic Team Member profile.
 */
exports.updateMechanicTeamMember = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Owner must be logged in."
      );
    }

    const ownerUid = context.auth.uid;
    const {
      memberUid,
      name,
      phone,
      telephone,
      address,
      baseCity,
      baseState,
      postalCode,
      perHCharge,
      selectedServices,
      allowDirectJobAcceptance,
      isEnabled,
      active,
      newPassword,
    } = data;

    if (!memberUid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "memberUid is required."
      );
    }

    const db = admin.firestore();
    const memberRef = db.collection("Mechanics").doc(memberUid);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Member not found.");
    }

    if (memberSnap.data().ownerId !== ownerUid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Unauthorized."
      );
    }

    try {
      const updateData = {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (name) updateData.userName = String(name).trim();
      if (phone !== undefined) updateData.cellPhone = String(phone).trim();
      if (telephone !== undefined)
        updateData.telephone = String(telephone).trim();
      if (address !== undefined) updateData.address = String(address).trim();
      if (baseCity !== undefined) updateData.city = String(baseCity).trim();
      if (baseState !== undefined) updateData.state = String(baseState).trim();
      if (postalCode !== undefined)
        updateData.postalCode = String(postalCode).trim();
      if (perHCharge !== undefined)
        updateData.perHCharge = Number(perHCharge) || 0;
      if (Array.isArray(selectedServices))
        updateData.selected_services = selectedServices;
      if (typeof allowDirectJobAcceptance === "boolean") {
        updateData.allowDirectJobAcceptance = allowDirectJobAcceptance;
      }
      if (typeof isEnabled === "boolean") updateData.isEnabled = isEnabled;
      if (typeof active === "boolean") updateData.active = active;
      if (
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        updateData.location = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }

      await memberRef.update(updateData);

      // Update password in Auth if provided
      if (newPassword && String(newPassword).length >= 6) {
        await admin
          .auth()
          .updateUser(memberUid, { password: String(newPassword) });
      }

      return {
        success: true,
        message: "Team member updated successfully.",
      };
    } catch (err) {
      console.error("Error updating mechanic team member:", err);
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Failed to update member."
      );
    }
  }
);

exports.updateUserEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const { userId, newEmail } = data;

  try {
    // Update Authentication email
    await admin.auth().updateUser(userId, { email: newEmail });

    // Update Firestore email
    await admin
      .firestore()
      .collection("Users")
      .doc(userId)
      .update({ email: newEmail });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

exports.checkAndNotifyUserForVehicleService = functions.https.onCall(
  async (data, context) => {
    const userId = data.userId;
    const vehicleId = data.vehicleId;

    // Validate input
    if (!userId || !vehicleId) {
      console.error("Missing required parameters");
      return { error: "Missing required parameters: userId and vehicleId" };
    }

    try {
      // Fetch the user's data
      const userDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.error(`User with ID ${userId} not found.`);
        return { error: `User not found for ${userId}` };
      }

      const userData = userDoc.data();
      const isTeamMember = userData.isTeamMember || false;
      const createdBy = userData.createdBy;

      // Determine the actual owner of the vehicle (single source of truth)
      const ownerId = isTeamMember ? createdBy : userId;

      // Fetch all users who have this vehicle (owner + team members)
      const notificationRecipients = new Set();

      // Always add the owner
      notificationRecipients.add(ownerId);

      // Find all team members who have this vehicle
      const teamMembersSnapshot = await admin
        .firestore()
        .collection("Users")
        .where("createdBy", "==", ownerId)
        .where("isTeamMember", "==", true)
        .get();

      // Check each team member to see if they have this vehicle
      for (const memberDoc of teamMembersSnapshot.docs) {
        const memberId = memberDoc.id;

        // Check if this team member has the vehicle in their collection
        const memberVehicleRef = admin
          .firestore()
          .collection("Users")
          .doc(memberId)
          .collection("Vehicles")
          .doc(vehicleId);

        const memberVehicleDoc = await memberVehicleRef.get();

        if (memberVehicleDoc.exists) {
          notificationRecipients.add(memberId);
        }
      }

      // Also add the current user if they're not already included
      notificationRecipients.add(userId);

      // Fetch the vehicle's data from the owner's collection (single source of truth)
      const vehicleDoc = await admin
        .firestore()
        .collection("Users")
        .doc(ownerId)
        .collection("Vehicles")
        .doc(vehicleId)
        .get();

      if (!vehicleDoc.exists) {
        console.error(
          `Vehicle with ID ${vehicleId} not found for owner ${ownerId}`
        );
        return { error: `Vehicle not found for ${vehicleId}` };
      }

      const vehicleData = vehicleDoc.data();

      // Check for firstTimeVehicle
      if (vehicleData.firstTimeVehicle === true) {
        await admin
          .firestore()
          .collection("Users")
          .doc(ownerId)
          .collection("Vehicles")
          .doc(vehicleId)
          .update({ firstTimeVehicle: false });

        console.log(
          `First time vehicle. Skipping notifications for ${vehicleId}`
        );

        // Log initial baseline reading to TrackDataNotifications
        await logTrackDataNotification({
          userId,
          ownerId,
          vehicleId,
          actionType: data.actionType || "miles",
          source: data.source || "App",
          enteredMiles:
            data.enteredMiles !== undefined ? data.enteredMiles : null,
          previousMiles:
            data.previousMiles !== undefined ? data.previousMiles : null,
          enteredHours:
            data.enteredHours !== undefined ? data.enteredHours : null,
          previousHours:
            data.previousHours !== undefined ? data.previousHours : null,
          recordDetails:
            data.recordDetails || (data.actionType === "record" ? data : null),
          previousServices: data.previousServices || [],
          serviceNotifications: [],
          hasNotifications: false,
          notifiedRecipients: Array.from(notificationRecipients),
        });

        return {
          success: true,
          hasNotifications: false,
          isFirstTime: true,
          serviceNotifications: [],
          servicesDueCount: 0,
          message:
            "Initial vehicle reading recorded. No service reminders are due yet.",
        };
      }

      const vehicleType = vehicleData.vehicleType;
      let currentMiles = 0;
      let hoursReading = 0;
      let prevMilesValue = 0;
      let prevHoursReadingValue = 0;

      if (vehicleType === "Truck") {
        const currentMilesArray = vehicleData.currentMilesArray || [];
        if (currentMilesArray.length === 0) {
          console.error("No miles data found.");
          return { error: "No miles data found." };
        }
        const latestMilesEntry =
          currentMilesArray[currentMilesArray.length - 1];
        currentMiles = parseInt(latestMilesEntry.miles || "0", 10);
        prevMilesValue = parseInt(vehicleData.prevMilesValue || "0", 10);
      } else if (vehicleType === "Trailer") {
        hoursReading = parseInt(vehicleData.hoursReading || "0", 10);
        prevHoursReadingValue = parseInt(
          vehicleData.prevHoursReadingValue || "0",
          10
        );
      } else {
        console.error(`Unknown vehicle type: ${vehicleType}`);
        return { error: `Unknown vehicle type: ${vehicleType}` };
      }

      const nextNotificationMiles = vehicleData.nextNotificationMiles || [];
      const serviceNotifications = [];
      let hasNotifications = false;

      for (const service of nextNotificationMiles) {
        // Skip service if notification is disabled
        if (service.isNotification === false) {
          console.log(
            `Skipping ${service.serviceName} - notification is disabled (isNotification: false)`
          );
          continue;
        }

        const defaultNotificationValue = service.defaultNotificationValue || 0;
        const serviceName = service.serviceName || "Unknown Service";
        const type = (service.type || "").toLowerCase();

        // Skip services that don't have reading or hours type
        if (type !== "reading" && type !== "hours") {
          console.log(
            `Skipping ${serviceName} - not a reading/hours-based service`
          );
          continue;
        }

        if (service.notificationSent) continue;

        // Handle reading type for trucks (miles-based)
        if (
          type === "reading" &&
          vehicleType === "Truck" &&
          defaultNotificationValue > 0 &&
          currentMiles >= defaultNotificationValue &&
          !service.lastNotifiedMiles
        ) {
          hasNotifications = true;
          serviceNotifications.push({
            serviceName,
            defaultNotificationValue,
            nextNotificationValue: defaultNotificationValue,
            currentMiles,
            message: `Your ${serviceName} for vehicle ${
              vehicleData.vehicleType || "unknown"
            } needs attention. Your mileage has reached ${currentMiles}.`,
          });

          service.lastNotifiedMiles = currentMiles;
        }
        // Handle hours type for trailers (hours-based)
        else if (
          type === "hours" &&
          vehicleType === "Trailer" &&
          defaultNotificationValue > 0 &&
          hoursReading >= defaultNotificationValue &&
          hoursReading > prevHoursReadingValue
        ) {
          hasNotifications = true;
          serviceNotifications.push({
            serviceName,
            defaultNotificationValue,
            nextNotificationValue: defaultNotificationValue,
            hoursReading,
            message: `Your ${serviceName} for vehicle ${
              vehicleData.vehicleType || "unknown"
            } needs attention. Your hours reading has reached ${hoursReading}.`,
          });
        }
      }

      if (hasNotifications) {
        // Update the vehicle's notification status
        const updateData = {
          nextNotificationMiles: nextNotificationMiles.map((service) => {
            const matchingNotification = serviceNotifications.find(
              (n) => n.serviceName === service.serviceName
            );
            if (matchingNotification) {
              return { ...service, notificationSent: true };
            }
            return service;
          }),
          lastNotified: admin.firestore.FieldValue.serverTimestamp(),
        };

        await admin
          .firestore()
          .collection("Users")
          .doc(ownerId)
          .collection("Vehicles")
          .doc(vehicleId)
          .update(updateData);

        // Send notifications to all recipients
        for (const recipientId of notificationRecipients) {
          const recipientDoc = await admin
            .firestore()
            .collection("Users")
            .doc(recipientId)
            .get();

          const recipientData = recipientDoc.data();
          const isNotificationOn = recipientData.isNotificationOn !== false;

          if (!isNotificationOn) {
            console.log(
              `Skipping notifications for user ${recipientId} - notifications disabled`
            );
            continue;
          }

          const userName = recipientData.userName || "User";
          const fcmToken = recipientData.fcmToken;

          // Save notification to user's collection
          await admin
            .firestore()
            .collection("Users")
            .doc(recipientId)
            .collection("UserNotifications")
            .doc()
            .set({
              vehicleId,
              notifications: serviceNotifications,
              date: admin.firestore.FieldValue.serverTimestamp(),
              isRead: false,
              message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
              currentMiles: vehicleType === "Truck" ? currentMiles : null,
              hoursReading: vehicleType === "Trailer" ? hoursReading : null,
            });

          // Send push notification if token exists
          if (fcmToken) {
            try {
              await admin.messaging().send({
                token: fcmToken,
                notification: {
                  title: "Service Reminder 🚗",
                  body: `Hey ${userName}, some of your vehicle services need attention.`,
                },
                data: {
                  userId: recipientId,
                  vehicleId,
                  // type: "service_reminder",
                  type: "default",
                },
              });
            } catch (fcmError) {
              console.error(`Failed to send FCM to ${recipientId}:`, fcmError);
            }
          }
        }

        // Log the notification in ServiceNotifications collection
        await admin
          .firestore()
          .collection("ServiceNotifications")
          .doc()
          .set({
            vehicleId,
            notifications: serviceNotifications,
            date: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            message: `Vehicle services need attention for vehicle ${vehicleId}`,
            currentMiles: vehicleType === "Truck" ? currentMiles : 0,
            hoursReading: vehicleType === "Trailer" ? hoursReading : 0,
            triggeredBy: userId,
            recipients: Array.from(notificationRecipients),
          });
      }

      console.log(
        "Notifications processed successfully. Vehicle ID:",
        vehicleId,
        "Current miles:",
        currentMiles,
        "Current hours:",
        hoursReading,
        "User ID:",
        userId,
        "Recipients:",
        Array.from(notificationRecipients),
        "Service notifications:",
        serviceNotifications
      );

      // Log maintenance activity, miles and notification comparisons to TrackDataNotifications
      await logTrackDataNotification({
        userId,
        ownerId,
        vehicleId,
        actionType: data.actionType || "miles",
        source: data.source || "App",
        enteredMiles:
          data.enteredMiles !== undefined ? data.enteredMiles : currentMiles,
        previousMiles:
          data.previousMiles !== undefined
            ? data.previousMiles
            : prevMilesValue,
        enteredHours:
          data.enteredHours !== undefined ? data.enteredHours : hoursReading,
        previousHours:
          data.previousHours !== undefined
            ? data.previousHours
            : prevHoursReadingValue,
        recordDetails:
          data.recordDetails || (data.actionType === "record" ? data : null),
        previousServices: data.previousServices || [],
        serviceNotifications,
        hasNotifications,
        notifiedRecipients: Array.from(notificationRecipients),
      });

      return {
        success: true,
        hasNotifications: hasNotifications,
        serviceNotifications: serviceNotifications,
        servicesDueCount: serviceNotifications.length,
        isFirstTime: false,
        message: hasNotifications
          ? `Service reminder: ${serviceNotifications.length} service(s) need attention.`
          : "All maintenance services are up to date.",
        recipients: Array.from(notificationRecipients),
      };
    } catch (error) {
      console.error("Error in checkAndNotifyUserForVehicleService:", error);
      return {
        error: "Error in sending notifications",
        details: error.message,
      };
    }
  }
);

exports.checkDataServicesAndNotify = functions.https.onCall(
  async (data, context) => {
    const userId = data.userId;
    const vehicleId = data.vehicleId;
    const currentDate = new Date();

    try {
      // Fetch the user's data
      const userDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          ` User with ID ${userId} not found.`
        );
      }

      const userData = userDoc.data();
      const isTeamMember = userData.isTeamMember || false;
      const createdBy = userData.createdBy; // Owner's ID if this is a team member

      // Determine the actual owner of the vehicle (single source of truth)
      const ownerId = isTeamMember ? createdBy : userId;

      // Fetch all users who have this vehicle (owner + team members)
      const notificationRecipients = new Set();

      // Always add the owner
      notificationRecipients.add(ownerId);

      // Find all team members who have this vehicle
      const teamMembersSnapshot = await admin
        .firestore()
        .collection("Users")
        .where("createdBy", "==", ownerId)
        .where("isTeamMember", "==", true)
        .get();

      // Check each team member to see if they have this vehicle
      for (const memberDoc of teamMembersSnapshot.docs) {
        const memberId = memberDoc.id;

        // Check if this team member has the vehicle in their collection
        const memberVehicleRef = admin
          .firestore()
          .collection("Users")
          .doc(memberId)
          .collection("Vehicles")
          .doc(vehicleId);

        const memberVehicleDoc = await memberVehicleRef.get();

        if (memberVehicleDoc.exists) {
          notificationRecipients.add(memberId);
        }
      }

      // Also add the current user if they're not already included
      // (this handles the case where a team member updates but might not have the vehicle)
      notificationRecipients.add(userId);

      // Fetch the vehicle's data from the owner's collection (single source of truth)
      const vehicleDoc = await admin
        .firestore()
        .collection("Users")
        .doc(ownerId)
        .collection("Vehicles")
        .doc(vehicleId)
        .get();

      if (!vehicleDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          ` Vehicle with ID ${vehicleId} not found.`
        );
      }

      const vehicleData = vehicleDoc.data();
      const vehicleType = vehicleData.vehicleType;
      const currentMiles =
        vehicleType === "Truck"
          ? parseInt(vehicleData.currentMiles || "0")
          : null;
      const hoursReading =
        vehicleType === "Trailer"
          ? parseInt(vehicleData.hoursReading || "0")
          : null;
      const createdAt = vehicleData.createdAt
        ? vehicleData.createdAt.toDate()
        : null;

      if (!vehicleData.services || vehicleData.services.length === 0) {
        // Still log maintenance activity to TrackDataNotifications
        await logTrackDataNotification({
          userId,
          ownerId,
          vehicleId,
          actionType: data.actionType || "miles",
          source: data.source || "App",
          enteredMiles:
            data.enteredMiles !== undefined ? data.enteredMiles : currentMiles,
          previousMiles:
            data.previousMiles !== undefined ? data.previousMiles : null,
          enteredHours:
            data.enteredHours !== undefined ? data.enteredHours : hoursReading,
          previousHours:
            data.previousHours !== undefined ? data.previousHours : null,
          recordDetails:
            data.recordDetails || (data.actionType === "record" ? data : null),
          previousServices: data.previousServices || [],
          serviceNotifications: [],
          hasNotifications: false,
          notifiedRecipients: Array.from(notificationRecipients),
        });

        return {
          success: true,
          hasNotifications: false,
          serviceNotifications: [],
          servicesDueCount: 0,
          message: "No services configured for this vehicle.",
        };
      }

      let hasNotifications = false;
      const serviceNotifications = [];

      vehicleData.services.forEach((service) => {
        // Skip service if notification is disabled
        if (service.isNotification === false) {
          console.log(
            `Skipping ${service.serviceName} - notification is disabled (isNotification: false)`
          );
          return;
        }

        const type = (service.type || "reading").toLowerCase();
        const nextNotificationValue = parseInt(
          service.nextNotificationValue || "0"
        );
        let shouldNotify = false;

        switch (type) {
          case "reading":
            shouldNotify =
              vehicleType === "Truck" &&
              nextNotificationValue > 0 &&
              currentMiles >= nextNotificationValue;
            break;
          case "hours":
            shouldNotify =
              vehicleType === "Trailer" &&
              nextNotificationValue > 0 &&
              hoursReading >= nextNotificationValue;
            break;

          case "day":
            if (
              service.nextNotificationValue &&
              typeof service.nextNotificationValue === "string"
            ) {
              const dateStr = service.nextNotificationValue.trim();
              if (dateStr.includes("/")) {
                const parts = dateStr.split("/").map(Number);
                if (parts.length === 3 && !parts.some(isNaN)) {
                  const [dd, mm, yyyy] = parts;
                  const dueDate = new Date(yyyy, mm - 1, dd);
                  if (!isNaN(dueDate.getTime())) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const diffMs = dueDate - today;
                    const daysRemaining = Math.ceil(
                      diffMs / (1000 * 60 * 60 * 24)
                    );

                    shouldNotify =
                      (daysRemaining <= 15 && daysRemaining >= 0) ||
                      daysRemaining < 0;
                  }
                }
              }
            }
            break;
        }

        if (shouldNotify) {
          hasNotifications = true;
          serviceNotifications.push({
            serviceName: service.serviceName,
            type: type,
            nextNotificationValue: service.nextNotificationValue,
            message: ` ${service.serviceName} for your ${vehicleType} is due!`,
          });
        }
      });

      if (hasNotifications) {
        // Process notifications for each recipient
        for (const recipientId of notificationRecipients) {
          // Check if notifications are enabled for this user
          const recipientDoc = await admin
            .firestore()
            .collection("Users")
            .doc(recipientId)
            .get();

          const recipientData = recipientDoc.data();
          const isNotificationOn = recipientData.isNotificationOn !== false; // Default to true if not set
          const fcmToken = recipientData.fcmToken;
          const userName = recipientData.userName || "User";

          if (!isNotificationOn) {
            console.log(
              `  Skipping notifications for user ${recipientId} - notifications disabled`
            );
            continue;
          }

          // Save a new notification in the recipient's collection
          await admin
            .firestore()
            .collection("Users")
            .doc(recipientId)
            .collection("UserNotifications")
            .doc()
            .set({
              vehicleId,
              notifications: serviceNotifications,
              date: admin.firestore.FieldValue.serverTimestamp(),
              isRead: false,
              message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
              currentMiles: vehicleType === "Truck" ? currentMiles : null,
              hoursReading: vehicleType === "Trailer" ? hoursReading : null,
            });

          // Send a push notification if FCM token exists
          if (fcmToken) {
            try {
              await admin.messaging().send({
                token: fcmToken,
                notification: {
                  title: "Service Reminder 🚗",
                  body: `Hey ${userName}, some of your vehicle services need attention.`,
                },
                data: {
                  userId: recipientId,
                  vehicleId,
                  // type: "service_reminder",
                  type: "default",
                },
              });
            } catch (err) {
              console.error(
                "FCM send error:",
                recipientId,
                err.code,
                err.message
              );
              if (
                err.code === "messaging/invalid-argument" ||
                err.code === "messaging/registration-token-not-registered"
              ) {
                // Clean up token in Firestore
                await admin
                  .firestore()
                  .collection("Users")
                  .doc(recipientId)
                  .update({
                    fcmToken: admin.firestore.FieldValue.delete(),
                  });
              }
            }
          }
        }

        // Save notification in ServiceNotifications collection (global)
        await admin
          .firestore()
          .collection("ServiceNotifications")
          .doc()
          .set({
            vehicleId,
            notifications: admin.firestore.FieldValue.arrayUnion(
              ...serviceNotifications
            ),
            date: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            message: `Vehicle services need attention for vehicle ${vehicleId}`,
            currentMiles: vehicleType === "Truck" ? currentMiles : 0,
            hoursReading: vehicleType === "Trailer" ? hoursReading : 0,
            triggeredBy: userId,
            recipients: Array.from(notificationRecipients),
          });
      }

      // Log maintenance activity, miles and notification comparisons to TrackDataNotifications
      await logTrackDataNotification({
        userId,
        ownerId,
        vehicleId,
        actionType: data.actionType || "miles",
        source: data.source || "App",
        enteredMiles:
          data.enteredMiles !== undefined ? data.enteredMiles : currentMiles,
        previousMiles:
          data.previousMiles !== undefined ? data.previousMiles : null,
        enteredHours:
          data.enteredHours !== undefined ? data.enteredHours : hoursReading,
        previousHours:
          data.previousHours !== undefined ? data.previousHours : null,
        recordDetails:
          data.recordDetails || (data.actionType === "record" ? data : null),
        previousServices: data.previousServices || [],
        serviceNotifications,
        hasNotifications,
        notifiedRecipients: Array.from(notificationRecipients),
      });

      return {
        success: true,
        hasNotifications: hasNotifications,
        serviceNotifications: serviceNotifications,
        servicesDueCount: serviceNotifications.length,
        message: hasNotifications
          ? `Service reminder: ${serviceNotifications.length} service(s) need attention.`
          : "All maintenance services are up to date.",
        recipients: Array.from(notificationRecipients),
      };
    } catch (error) {
      console.error("Error in checkDataServicesAndNotify:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Error processing service notifications",
        error
      );
    }
  }
);

// Function to send a new notification to the nearby Mechanics when a job is created
exports.sendNewMechanicNotification = functions.firestore
  .document("jobs/{jobId}")
  .onCreate(async (snapshot, context) => {
    try {
      const job = snapshot.data();
      const userLat = job.userLat;
      const userLng = job.userLong;
      const nearByDistance = job.nearByDistance || 5.0; // Default to 5 km if not provided

      // Debugging nearby distance
      console.log("Initial Job Creation. Nearby Distance:", nearByDistance);

      if (!userLat || !userLng) {
        console.error("userLat or userLong is missing in the job data.");
        return null;
      }

      const jobLocation = {
        latitude: userLat,
        longitude: userLng,
      };

      // Debugging job location
      console.log("Job Location:", jobLocation);

      const mechanicsSnapshot = await admin
        .firestore()
        .collection("Mechanics")
        .where("active", "==", true)
        .get();

      if (mechanicsSnapshot.empty) {
        console.log("No active mechanics found.");
        return null;
      }

      console.log("Found active mechanics:", mechanicsSnapshot.size);

      const notificationPromises = [];
      const jobService = job.selectedService; // Fetching the selected service from the job

      mechanicsSnapshot.forEach((mechanicDoc) => {
        const mechanicData = mechanicDoc.data();
        const mechanicLocation = mechanicData.location;
        const selectedServices = mechanicData.selected_services || []; // Assuming the field name is 'selected_services'

        // Calculate the distance between the mechanic and job location
        const distance = calculateDistance(
          mechanicLocation.latitude,
          mechanicLocation.longitude,
          jobLocation.latitude,
          jobLocation.longitude
        );

        console.log(
          `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
        );

        // Check if the mechanic is within the nearby distance range
        if (distance < nearByDistance) {
          console.log("Mechanic is in range.");

          // Check if the job's selected service matches any of the mechanic's selected services
          if (selectedServices.includes(jobService)) {
            console.log(
              "Mechanic has the matching service. Sending notification..."
            );

            const payload = {
              notification: {
                title: "New Job Request 🔧",
                body: `Hey ${mechanicData.userName}, there's a new job request available!`,
              },
              data: {
                jobId: context.params.jobId,
                type: "new_job",
              },
              apns: {
                payload: {
                  aps: {
                    sound: "new_job_sound.mp3",
                    badge: 1,
                  },
                },
              },
              android: {
                notification: {
                  channelId: "rabbit_services_mechanic_new_job",
                  sound: "new_job_sound",
                },
              },
            };

            const token = mechanicData.fcmToken;
            if (token) {
              notificationPromises.push(
                admin.messaging().send({
                  ...payload,
                  token: token,
                })
              );
              console.log("Notification sent to mechanic:", mechanicData);
            } else {
              console.error("Invalid token for mechanic:", mechanicData);
            }
          } else {
            console.log(
              `Mechanic ${mechanicData.userName} does not have the required service.`
            );
          }
        } else {
          console.log(
            `Mechanic ${mechanicData.userName} is not in range. Distance: ${distance} km`
          );
        }
      });

      await Promise.all(notificationPromises);
      console.log("Notifications sent to nearby mechanics.");
      return null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  });

//corn job after 5 minute auto cancel the job

exports.autoCancelUnacceptedJobs = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    try {
      const fiveMinutesAgo = admin.firestore.Timestamp.now().toDate();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 4);

      // Query jobs where no mechanic accepted the offer within 5 minutes
      const jobsSnapshot = await db
        .collection("jobs")
        .where("orderDate", "<=", fiveMinutesAgo)
        .where("status", "==", 0)
        .where("mechanicsOffer", "==", []) // No mechanic has accepted yet
        .get();

      if (jobsSnapshot.empty) {
        console.log("No jobs to auto-cancel.");
        return null;
      }

      const updatePromises = [];
      const notificationPromises = [];

      jobsSnapshot.forEach(async (jobDoc) => {
        const jobData = jobDoc.data();
        const jobId = jobDoc.id;
        const userId = jobData.userId;

        // Update job status and cancelReason in the 'jobs' collection
        updatePromises.push(
          db.collection("jobs").doc(jobId).update({
            status: -1, // Set the job status to 'canceled'
            cancelReason: "Mechanic not found within 5 minutes",
            cancelBy: "System",
          })
        );

        // Update the same in the User's history subcollection
        const userHistoryRef = db
          .collection("Users")
          .doc(userId)
          .collection("history")
          .doc(jobId);

        updatePromises.push(
          userHistoryRef.update({
            status: -1,
            cancelReason: "Mechanic not found within 5 minutes",
            cancelBy: "System",
          })
        );

        // Send notification to the user
        const payload = {
          notification: {
            title: "Job Canceled",
            body: "No mechanic was found within 5 minutes. The job has been automatically canceled.",
          },
          data: {
            jobId: jobId,
            // type: "job_canceled",
            type: "default",
          },
        };

        const userSnapshot = await db.collection("Users").doc(userId).get();
        const userData = userSnapshot.data();
        const userToken = userData.fcmToken;

        if (userToken) {
          notificationPromises.push(
            admin.messaging().send({
              token: userToken,
              notification: payload.notification,
              data: payload.data,
            })
          );
          console.log(`Notification sent to user ${userId} for job ${jobId}`);
        } else {
          console.log(`User ${userId} does not have a valid FCM token.`);
        }
      });

      // Wait for all updates and notifications to complete
      await Promise.all([...updatePromises, ...notificationPromises]);

      console.log("Auto-cancel job function completed.");
      return null;
    } catch (error) {
      console.error("Error auto-canceling unaccepted jobs:", error);
      return null;
    }
  });

//auto cancel unfinished jobs after 24 hours of acceptance
exports.autoCancelUnfinishedJobs = functions.pubsub
  .schedule("every 1 hours") // runs every hour (recommended)
  .onRun(async (context) => {
    try {
      const twentyFourHoursAgo = admin.firestore.Timestamp.now().toDate();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const jobsSnapshot = await db
        .collection("jobs")
        .where("status", "!=", 5) // not completed
        .where("offerAcceptedDate", "<=", twentyFourHoursAgo)
        .get();

      if (jobsSnapshot.empty) {
        console.log("No unfinished jobs to auto-cancel.");
        return null;
      }

      const updatePromises = [];
      const notificationPromises = [];

      for (const jobDoc of jobsSnapshot.docs) {
        const jobData = jobDoc.data();
        const jobId = jobDoc.id;
        const userId = jobData.userId;

        // Skip if no mechanic ever accepted
        if (!jobData.offerAcceptedDate) continue;

        // Update job status + reason
        updatePromises.push(
          db.collection("jobs").doc(jobId).update({
            status: -1,
            cancelReason: "Mechanic did not complete the job within 24 hours",
            cancelBy: "System",
          })
        );

        // Update history
        const userHistoryRef = db
          .collection("Users")
          .doc(userId)
          .collection("history")
          .doc(jobId);

        updatePromises.push(
          userHistoryRef.update({
            status: -1,
            cancelReason: "Mechanic did not complete the job within 24 hours",
            cancelBy: "System",
          })
        );

        // Push notification
        const userSnapshot = await db.collection("Users").doc(userId).get();
        const userData = userSnapshot.data();
        const userToken = userData.fcmToken;

        const payload = {
          notification: {
            title: "Job Canceled",
            body: "Your mechanic did not complete the job within 24 hours. The job has been canceled automatically.",
          },
          data: {
            jobId: jobId,
            type: "default",
          },
        };

        if (userToken) {
          notificationPromises.push(
            admin.messaging().send({
              token: userToken,
              notification: payload.notification,
              data: payload.data,
            })
          );
          console.log(`Notification sent to user ${userId} for job ${jobId}`);
        } else {
          console.log(`User ${userId} has no FCM token.`);
        }
      }

      await Promise.all([...updatePromises, ...notificationPromises]);

      console.log("Auto-cancel unfinished jobs function completed.");
      return null;
    } catch (error) {
      console.error("Error auto-canceling unfinished jobs:", error);
      return null;
    }
  });

// Function to Again send a new notification to the nearby mechanics when nearbyDistance value changed
exports.sendAgainNewMechanicNotification = async (
  snapshot,
  context,
  jobData = null
) => {
  try {
    const job = jobData || snapshot.data(); // Use passed data or snapshot
    const userLat = job.userLat;
    const userLong = job.userLong;
    const nearByDistance = job.nearByDistance || 5.0;
    const jobService = job.selectedService; // Fetching the selected service from the job

    if (!userLat || !userLong) {
      console.error("userLat or userLong is missing in the job data.");
      return null;
    }

    console.log("New job request. Job:", job);

    const jobLocation = {
      latitude: userLat,
      longitude: userLong,
    };

    console.log("Job Location:", jobLocation);
    console.log("Using nearbyDistance from the job:", nearByDistance);

    const mechanicsSnapshot = await admin
      .firestore()
      .collection("Mechanics")
      .where("active", "==", true)
      .get();

    if (mechanicsSnapshot.empty) {
      console.log("No active mechanics found.");
      return null;
    }

    console.log("Found active mechanics:", mechanicsSnapshot.size);

    const notificationPromises = [];

    mechanicsSnapshot.forEach((mechanicDoc) => {
      const mechanicData = mechanicDoc.data();
      const mechanicLocation = mechanicData.location;
      const selectedServices = mechanicData.selected_services || []; // Assuming the field name is 'selected_services'

      const distance = calculateDistance(
        mechanicLocation.latitude,
        mechanicLocation.longitude,
        jobLocation.latitude,
        jobLocation.longitude
      );

      console.log(
        `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
      );

      // Check if the mechanic is within the nearby distance range
      if (distance < nearByDistance) {
        console.log("Mechanic is in range.");

        // Check if the job's selected service matches any of the mechanic's selected services
        if (selectedServices.includes(jobService)) {
          console.log(
            "Mechanic has the matching service. Sending notification..."
          );

          const payload = {
            notification: {
              title: "New Job Request 🔧",
              body: `Hey ${mechanicData.userName}, there's a new job request available!`,
            },
            data: {
              jobId: context.params.jobId,
              type: "new_job",
            },
            apns: {
              payload: {
                aps: {
                  sound: "new_job_sound.mp3",
                  badge: 1,
                },
              },
            },
            android: {
              notification: {
                channelId: "rabbit_services_mechanic_new_job",
                sound: "new_job_sound",
              },
            },
          };

          const token = mechanicData.fcmToken;
          console.log("Mechanic Token:", token);
          console.log("Payload:", payload);

          if (token) {
            notificationPromises.push(
              admin.messaging().send({
                ...payload,
                token: token,
              })
            );

            console.log("Notification sent to mechanic:", mechanicData);
          } else {
            console.error("Invalid token for mechanic:", mechanicData);
          }
        } else {
          console.log(
            `Mechanic ${mechanicData.userName} does not have the required service.`
          );
        }
      } else {
        console.log(
          `Mechanic ${mechanicData.userName} is not in range. Distance: ${distance} km`
        );
      }
    });

    await Promise.all(notificationPromises);

    console.log("Notifications sent to nearby mechanics.");
    return null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

//update the mechanic when distance is updated
exports.updateMechanicNotifications = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const previousNearbyDistance = beforeData.nearByDistance;
    const newNearbyDistance = afterData.nearByDistance;

    console.log("Before data:", beforeData);
    console.log("After data:", afterData);

    // Check if nearbyDistance has changed
    if (previousNearbyDistance !== newNearbyDistance) {
      console.log(
        `nearByDistance updated from ${previousNearbyDistance} km to ${newNearbyDistance} km for job ${context.params.jobId}`
      );

      // Check if userLat and userLong exist in the afterData
      if (!afterData.userLat || !afterData.userLong) {
        console.error(
          "userLat or userLong is missing in the updated job document."
        );
        return null;
      }

      // Pass afterData directly to sendNewMechanicNotification
      return exports.sendAgainNewMechanicNotification(null, context, afterData);
    }

    return null;
  });

//when mechanic uninstall mechanic app then deactivate the mechanic

exports.checkInactiveMechanics = functions.pubsub
  .schedule("0 0 * * *") // Runs every day at midnight
  .timeZone("America/Los_Angeles") // Set to Pacific Time Zone
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const cutoffTime = new Date(now.toDate().getTime() - 10 * 60 * 1000); // 10 minutes ago

    const mechanicsSnapshot = await admin
      .firestore()
      .collection("Mechanics")
      .where("lastActive", "<=", cutoffTime)
      .where("active", "==", true) // Only check active mechanics
      .get();

    mechanicsSnapshot.forEach(async (doc) => {
      await doc.ref.update({
        active: false, // Mark mechanic as inactive
      });
      console.log(`Marked mechanic ${doc.id} as inactive`);
    });

    return null;
  });

// Function to send a notification to the user when the mechanic accepts the job
exports.mechanicAcceptJobNotification = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const jobId = context.params.jobId;

    // Check if any mechanic's offer status changed to accepted (status 1)
    const newOffers = newValue.mechanicsOffer || [];
    const previousOffers = previousValue.mechanicsOffer || [];

    // Find out if any mechanic has just accepted the offer
    const acceptedOffer = newOffers.find(
      (offer, index) =>
        offer.status === 1 &&
        (!previousOffers[index] || previousOffers[index].status !== 1)
    );

    if (acceptedOffer) {
      const userId = newValue.userId; // Get userId from job document
      const mechanicName = acceptedOffer.mName || "Mechanic"; // Assuming mechanic's name is stored in the offer
      const userDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.error("User not found:", userId);
        return null;
      }

      const userData = userDoc.data();
      const userToken = userData.fcmToken;
      const userName = userData.userName || "User"; // Default userName

      // Prepare notification payload
      const payload = {
        notification: {
          title: "🔧 Mechanic Accepted Your Job!",
          body: `Hey ${userName}, ${mechanicName} has accepted your job request! 🚗🔧`,
        },
        data: {
          jobId: jobId,
          type: "offer_accepted",
        },
        apns: {
          payload: {
            aps: {
              sound: "offer_accepted_sound.mp3",
              badge: 1,
            },
          },
        },
        android: {
          notification: {
            channelId: "rabbit_services_driver_offer_accepted",
            sound: "offer_accepted_sound",
          },
        },
      };

      // Send notification to the user
      if (userToken) {
        await admin.messaging().send({
          ...payload,
          token: userToken,
        });

        console.log(`Notification sent to user: ${userId} for job: ${jobId}`);
      } else {
        console.error(`User does not have a valid token: ${userId}`);
      }
    } else {
      console.log("No new mechanic offer was accepted.");
    }

    return null;
  });

// Function to send a notification to the mechanic when the user accepts their offer
exports.userAcceptMechanicOfferNotification = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const jobId = context.params.jobId;

    // Check if the user's job status changed to 2 (User accepted the mechanic's offer)
    if (previousValue.status !== 2 && newValue.status === 2) {
      const userName = newValue.userName || "User"; // Get user name from the job document
      const mechanicId = newValue.mechanicsOffer.find(
        (offer) => offer.status === 2
      )?.mId; // Get mechanic ID from accepted offer

      if (!mechanicId) {
        console.error("No mechanic offer was accepted.");
        return null;
      }

      try {
        // Fetch the mechanic document to get the FCM token and mechanicName
        const mechanicDoc = await admin
          .firestore()
          .collection("Mechanics")
          .doc(mechanicId)
          .get();
        if (!mechanicDoc.exists) {
          console.error("Mechanic not found:", mechanicId);
          return null;
        }

        const mechanicData = mechanicDoc.data();
        const mechanicToken = mechanicData.fcmToken;
        const mechanicName = mechanicData.userName || "Mechanic"; // Assuming mechanic's name is stored

        // Prepare notification payload with emojis and personalized text
        const payload = {
          notification: {
            title: "👍 Offer Accepted!",
            body: `Hey ${mechanicName}, ${userName} has accepted your offer! 🚚💰`,
          },
          data: {
            jobId: jobId,
            type: "offer_accepted", // Added type field
          },
          apns: {
            payload: {
              aps: {
                sound: "offer_accepted_sound.mp3",
                badge: 1,
              },
            },
          },
          android: {
            notification: {
              channelId: "rabbit_services_mechanic_offer_accepted",
              sound: "offer_accepted_sound",
            },
          },
        };

        // Send notification to the mechanic
        if (mechanicToken) {
          await admin.messaging().send({
            ...payload,
            token: mechanicToken,
          });

          console.log(
            `Notification sent to mechanic: ${mechanicId} for job: ${jobId}`
          );
        } else {
          console.error(`Mechanic does not have a valid token: ${mechanicId}`);
        }
      } catch (error) {
        console.error("Error sending notification to mechanic:", error);
      }
    }

    return null;
  });

exports.notifyDriverOnDispatchLoadAssignment = functions.firestore
  .document("dispatch_loads/{loadId}")
  .onWrite(async (change, context) => {
    const loadId = context.params.loadId;
    const afterExists = change.after.exists;
    if (!afterExists) {
      return null;
    }

    const afterData = change.after.data() || {};
    const beforeData = change.before.exists ? change.before.data() || {} : {};

    const nextDriverId = (afterData.driverId || "").toString().trim();
    const previousDriverId = (beforeData.driverId || "").toString().trim();

    if (!nextDriverId) {
      return null;
    }

    const isNewAssignment =
      !change.before.exists || previousDriverId !== nextDriverId;

    if (!isNewAssignment) {
      return null;
    }

    try {
      const driverDoc = await db.collection("Users").doc(nextDriverId).get();
      if (!driverDoc.exists) {
        console.log(
          `Driver not found for dispatch load notification: ${nextDriverId}`
        );
        return null;
      }

      const driverData = driverDoc.data() || {};
      const isNotificationOn = driverData.isNotificationOn !== false;
      if (!isNotificationOn) {
        console.log(
          `Skipping dispatch load notification for ${nextDriverId} - notifications disabled`
        );
        return null;
      }

      const driverName = (
        afterData.driverName ||
        driverData.userName ||
        "Driver"
      )
        .toString()
        .trim();
      const pickups = Array.isArray(afterData.pickups) ? afterData.pickups : [];
      const deliveries = Array.isArray(afterData.deliveries)
        ? afterData.deliveries
        : [];
      const pickupStop = pickups[0] || {};
      const deliveryStop = deliveries[deliveries.length - 1] || {};
      const loadNumber = (afterData.loadNumber || loadId).toString();
      const message = buildDispatchLoadMessage(
        driverName,
        loadNumber,
        pickupStop,
        deliveryStop
      );

      const notificationDoc = createDispatchLoadNotificationDoc({
        loadId,
        loadData: afterData,
        message,
      });

      await db
        .collection("Users")
        .doc(nextDriverId)
        .collection("UserNotifications")
        .doc()
        .set(notificationDoc);

      const fcmToken = driverData.fcmToken;
      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "New Load Assigned",
              body: message,
            },
            data: {
              type: "dispatch_load",
              loadId,
              loadNumber,
              driverId: nextDriverId,
            },
          });
        } catch (fcmError) {
          console.error(
            `Failed to send dispatch load FCM to ${nextDriverId}:`,
            fcmError
          );
        }
      }

      console.log(
        `Dispatch load assignment notification stored for driver ${nextDriverId} on load ${loadId}`
      );
      return null;
    } catch (error) {
      console.error(
        "Error sending dispatch load assignment notification:",
        error
      );
      return null;
    }
  });

/**
 * Scheduled Watchdog: Checks for missing telemetry on in-progress loads.
 * If driver hasn't pinged in > 20 minutes, sends a high-priority wakeup FCM.
 */
exports.checkDriverTelemetryWatchdog = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async (context) => {
    try {
      const now = Date.now();
      const twentyMinsAgo = new Date(now - 20 * 60 * 1000);

      // Query active in-progress loads
      const activeLoadsSnap = await admin
        .firestore()
        .collection("dispatch_loads")
        .where("status", "in", ["Assigned", "In Transit"])
        .get();

      for (const loadDoc of activeLoadsSnap.docs) {
        const load = loadDoc.data();
        const driverId = load.driverId;
        if (!driverId) continue;

        const driverLocDoc = await admin
          .firestore()
          .collection("DriverLocations")
          .doc(driverId)
          .get();

        if (driverLocDoc.exists) {
          const locData = driverLocDoc.data();
          const lastUpdated = locData.lastUpdated
            ? locData.lastUpdated.toDate()
            : null;

          if (!lastUpdated || lastUpdated < twentyMinsAgo) {
            // Send high-priority wakeup notification to driver
            const driverDoc = await admin
              .firestore()
              .collection("Users")
              .doc(driverId)
              .get();

            const fcmToken = driverDoc.data()?.fcmToken;
            if (fcmToken) {
              await admin.messaging().send({
                token: fcmToken,
                notification: {
                  title: "⚠️ Trip GPS Tracking Inactive",
                  body: `Please keep Trenoops App open to send location updates for Load #${
                    load.loadNumber || ""
                  }`,
                },
                data: {
                  type: "tracking_heartbeat_alert",
                  loadId: loadDoc.id,
                },
              });
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error in checkDriverTelemetryWatchdog:", error);
      return null;
    }
  });

/**
 * On Load Delivered / Completed: Turn off active tracking flag in DriverLocations
 */
exports.cleanupDriverTelemetryOnLoadComplete = functions.firestore
  .document("dispatch_loads/{loadId}")
  .onUpdate(async (change, context) => {
    try {
      const afterData = change.after.data();
      const status = (afterData.status || "").toLowerCase();

      if (
        status === "delivered" ||
        status === "completed" ||
        status === "cancelled"
      ) {
        const driverId = afterData.driverId;
        if (driverId) {
          await admin
            .firestore()
            .collection("DriverLocations")
            .doc(driverId)
            .set(
              {
                isTrackingActive: false,
                activeLoadId: null,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
        }
      }
      return null;
    } catch (error) {
      console.error("Error in cleanupDriverTelemetryOnLoadComplete:", error);
      return null;
    }
  });

// ==========================================
// Fleet Sharing Triggers
// ==========================================
const {
  onFleetShareCreated,
  onFleetShareStatusChanged,
} = require("./fleetSharing");

exports.onFleetShareCreated = onFleetShareCreated;
exports.onFleetShareStatusChanged = onFleetShareStatusChanged;

// ==========================================
// Carrier Vehicles & Records Triggers
// ==========================================
const {
  onCarrierRecordCreated,
  onCarrierVehicleUpdated,
} = require("./carrierFleet");

exports.onCarrierRecordCreated = onCarrierRecordCreated;
exports.onCarrierVehicleUpdated = onCarrierVehicleUpdated;

// ==========================================
// Maintenance Activity & Notifications Tracking
// ==========================================
exports.trackMaintenanceEvent = functions.https.onCall(
  async (data, context) => {
    const userId = data.userId;
    const vehicleId = data.vehicleId;
    if (!userId || !vehicleId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameters: userId and vehicleId"
      );
    }
    const result = await logTrackDataNotification(data);
    return { success: true, tracking: result };
  }
);

// ==========================================
// Mechanic Fleet Dispatch & Team Notifications Triggers
// ==========================================
/**
 * Automatically notifies team members when assigned a job,
 * and notifies Workshop Owners when an emergency handover is requested.
 */
exports.onJobAssignedOrHandoverTrigger = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const jobId = context.params.jobId;
    const db = admin.firestore();

    // 1. Job assigned to a technician member
    if (
      after.assignedMemberId &&
      before.assignedMemberId !== after.assignedMemberId
    ) {
      try {
        const memberDoc = await db
          .collection("Mechanics")
          .doc(after.assignedMemberId)
          .get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          const fcmToken = memberData.fcmToken;
          if (fcmToken) {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: "🔧 New Job Assigned to You!",
                body: `Your workshop owner assigned you Order #${
                  after.orderId || jobId
                } (${after.selectedService || "Repair"}).`,
              },
              data: {
                jobId: jobId,
                type: "job_assigned",
              },
            });
            console.log(
              `Dispatched notification to member ${after.assignedMemberId}`
            );
          }
        }
      } catch (err) {
        console.error("Error sending job assigned notification:", err);
      }
    }

    // 2. Emergency handover requested by technician
    if (after.handoverRequested && !before.handoverRequested && after.ownerId) {
      try {
        const ownerDoc = await db
          .collection("Mechanics")
          .doc(after.ownerId)
          .get();
        if (ownerDoc.exists) {
          const ownerData = ownerDoc.data();
          const fcmToken = ownerData.fcmToken;
          if (fcmToken) {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: "🚨 Emergency Handover Alert!",
                body: `Technician ${
                  after.assignedMemberName || "on-site"
                } requested handover for #${after.orderId}. Reason: ${
                  after.handoverReason || "Sudden illness/issue"
                }`,
              },
              data: {
                jobId: jobId,
                type: "handover_alert",
              },
            });
            console.log(`Dispatched handover alert to owner ${after.ownerId}`);
          }
        }
      } catch (err) {
        console.error("Error sending handover alert:", err);
      }
    }

    return null;
  });

/**
 * Updates individual technician's performance metrics & ratings upon job completion.
 */
exports.onJobRatedOrCompletedTrigger = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const techId = after.assignedMemberId;
    if (!techId) return null;

    const db = admin.firestore();

    // 1. Completion Counter & Active Job Cleanup
    if (before.status !== 5 && after.status === 5) {
      try {
        await db
          .collection("Mechanics")
          .doc(techId)
          .update({
            totalCompletedJobs: admin.firestore.FieldValue.increment(1),
            currentActiveJobId: null,
            activeJobStartedAt: null,
            activeJobEstimatedMinutes: null,
          });
      } catch (err) {
        console.error("Error incrementing tech completed jobs:", err);
      }
    }

    // 2. Individual Rating Attribution
    const incomingRating = after.rating || after.driverRating || after.mRating;
    const oldRating = before.rating || before.driverRating || before.mRating;

    if (incomingRating && incomingRating !== oldRating) {
      try {
        const techRef = db.collection("Mechanics").doc(techId);
        const techSnap = await techRef.get();
        if (techSnap.exists) {
          const tData = techSnap.data();
          const currentTotalReviews = tData.totalReviewsCount || 0;
          const currentRating = tData.rating || 5.0;
          const newRatingVal = Number(incomingRating);

          const updatedReviewsCount = currentTotalReviews + 1;
          const updatedAverageRating =
            (currentRating * currentTotalReviews + newRatingVal) /
            updatedReviewsCount;

          await techRef.update({
            rating: Math.round(updatedAverageRating * 10) / 10,
            totalReviewsCount: updatedReviewsCount,
          });
        }
      } catch (rErr) {
        console.error("Error attributing technician rating:", rErr);
      }
    }

    return null;
  });
