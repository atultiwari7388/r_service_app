const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const db = admin.firestore();

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
    from: `"Rabbit Mechanic Contact" <${process.env.EMAIL_USER}>`, // Use consistent sender
    replyTo: email, // Allow replying to contact submitter
    to: recipientEmail,
    subject: "New Contact Form Submission - Rabbit Mechanic",
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
    licExpiryDate,
    dob,
    lastDrugTest,
    dateOfHire,
    dateOfTermination,
    currentDeviceId,
    lastLogin,
    createdFrom,
  } = data;

  if (
    !email ||
    !password ||
    !name ||
    !phone ||
    !selectedRole ||
    (selectedRole === "Driver" && selectedVehicles.length === 0)
  ) {
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
      companyName: "",
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
      payMode: selectedPayType || "",
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
      isOwner: false,
      isTeamMember: true,
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
        return { message: "First time vehicle - no notifications sent." };
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

      return {
        success: true,
        message: "Notifications processed successfully",
        hasNotifications,
        serviceNotifications,
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
        return {
          success: true,
          message: "No services found for this vehicle.",
        };
      }

      let hasNotifications = false;
      const serviceNotifications = [];

      vehicleData.services.forEach((service) => {
        const type = (service.type || "reading").toLowerCase();
        const nextNotificationValue = parseInt(
          service.nextNotificationValue || "0"
        );
        let shouldNotify = false;

        switch (type) {
          case "reading":
            shouldNotify =
              vehicleType === "Truck" && currentMiles >= nextNotificationValue;
            break;
          case "hours":
            shouldNotify =
              vehicleType === "Trailer" &&
              hoursReading >= nextNotificationValue;
            break;
          case "day":
            if (createdAt) {
              const notificationDate = new Date(createdAt);
              notificationDate.setDate(
                notificationDate.getDate() + nextNotificationValue
              );
              shouldNotify = currentDate >= notificationDate;
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

      return {
        success: true,
        message: hasNotifications
          ? `Notifications sent to ${notificationRecipients.size} users.`
          : "No notifications sent.",
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

//daily check functions
exports.startDailyDayCheckForUser = functions.https.onCall(
  async (data, context) => {
    const ownerId = data.ownerId;
    const vehicleId = data.vehicleId;

    console.log("🚀 startDailyDayCheckForUser: Starting for:", {
      ownerId,
      vehicleId,
    });

    try {
      // Calculate next check for TOMORROW
      const now = new Date();
      const nextCheckDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Exactly 24 hours

      const nextCheckTimestamp =
        admin.firestore.Timestamp.fromDate(nextCheckDate);

      const docId = `${ownerId}_${vehicleId}`;
      const userDailyCheckRef = admin
        .firestore()
        .collection("UserDailyChecks")
        .doc(docId);

      await userDailyCheckRef.set({
        ownerId: ownerId,
        vehicleId: vehicleId,
        isActive: true,
        lastChecked: null,
        nextCheck: nextCheckTimestamp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalNotifications: 0,
        lastNotificationDate: null,
      });

      console.log(
        "✅ startDailyDayCheckForUser: Document created. Next check:",
        nextCheckDate.toISOString()
      );

      return { success: true, nextCheck: nextCheckDate.toISOString() };
    } catch (error) {
      console.error("❌ startDailyDayCheckForUser: Error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Error starting daily day check"
      );
    }
  }
);

exports.processUserDailyChecks = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context) => {
    const currentDate = new Date();
    const currentTimestamp = admin.firestore.Timestamp.fromDate(currentDate);

    console.log("🚀 CRON JOB: Started at:", currentDate.toISOString());

    try {
      const userChecksSnapshot = await admin
        .firestore()
        .collection("UserDailyChecks")
        .where("isActive", "==", true)
        .where("nextCheck", "<=", currentTimestamp)
        .get();

      console.log(`📊 Found ${userChecksSnapshot.size} checks due`);

      if (userChecksSnapshot.empty) {
        console.log("❌ No checks due");
        return null;
      }

      // Process each check SEQUENTIALLY to avoid conflicts
      for (const checkDoc of userChecksSnapshot.docs) {
        try {
          const checkData = checkDoc.data();
          console.log(
            `🔄 Processing: ${checkDoc.id}, NextCheck: ${checkData.nextCheck
              .toDate()
              .toISOString()}`
          );

          await processSingleUserDailyCheck(
            checkData.ownerId,
            checkData.vehicleId,
            checkDoc.ref,
            currentDate
          );

          console.log(`✅ Completed: ${checkDoc.id}`);
        } catch (error) {
          console.error(`❌ Failed: ${checkDoc.id}`, error);
        }
      }

      console.log("✅ All checks processed");
      return null;
    } catch (error) {
      console.error("❌ Cron job error:", error);
      throw error;
    }
  });

async function processSingleUserDailyCheck(
  ownerId,
  vehicleId,
  checkDocRef,
  currentDate
) {
  console.log(
    `🔄 processSingleUserDailyCheck: Starting for ${ownerId}, ${vehicleId}`
  );

  try {
    // STEP 1: Check for notifications
    const result = await checkDayServicesForVehicle(
      ownerId,
      vehicleId,
      currentDate
    );
    console.log(`📊 Check result: ${result.notificationCount} notifications`);

    // STEP 2: Calculate NEXT next check (24 hours from NOW, not from current nextCheck)
    const nextNextCheckDate = new Date(
      currentDate.getTime() + 24 * 60 * 60 * 1000
    );
    const nextNextCheckTimestamp =
      admin.firestore.Timestamp.fromDate(nextNextCheckDate);

    console.log(`📅 Scheduling next check:`);
    console.log(`   Current: ${currentDate.toISOString()}`);
    console.log(`   Next: ${nextNextCheckDate.toISOString()}`);

    // STEP 3: Update the document with ALL information
    const updateData = {
      lastChecked: admin.firestore.Timestamp.fromDate(currentDate),
      nextCheck: nextNextCheckTimestamp, // This is the KEY FIX - update to next day
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastProcessed: currentDate.toISOString(),
      hasNotifications: result.hasNotifications,
      lastNotificationCount: result.notificationCount || 0,
      lastRecipientCount: result.recipientCount || 0,
    };

    // If notifications were sent, update notification stats
    if (result.hasNotifications) {
      updateData.totalNotifications = admin.firestore.FieldValue.increment(
        result.notificationCount || 0
      );
      updateData.lastNotificationDate =
        admin.firestore.Timestamp.fromDate(currentDate);
    }

    console.log(`💾 Updating document:`, JSON.stringify(updateData));

    // STEP 4: Perform the update
    await checkDocRef.update(updateData);

    // STEP 5: Verify the update
    const updatedDoc = await checkDocRef.get();
    const updatedData = updatedDoc.data();

    console.log(`✅ Document updated successfully:`);
    console.log(
      `   - New nextCheck: ${updatedData.nextCheck.toDate().toISOString()}`
    );
    console.log(
      `   - Last checked: ${updatedData.lastChecked.toDate().toISOString()}`
    );
    console.log(`   - Has notifications: ${updatedData.hasNotifications}`);
    console.log(`   - Total notifications: ${updatedData.totalNotifications}`);

    return result;
  } catch (error) {
    console.error(`❌ Error in processSingleUserDailyCheck:`, error);

    // Still update the document even on error, but mark the error
    await checkDocRef.update({
      lastError: error.message,
      lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw error;
  }
}

async function checkDayServicesForVehicle(ownerId, vehicleId, currentDate) {
  console.log(
    `🔍 checkDayServicesForVehicle: Checking ${ownerId}, ${vehicleId}`
  );

  try {
    // Get vehicle data
    const vehicleDoc = await admin
      .firestore()
      .collection("Users")
      .doc(ownerId)
      .collection("Vehicles")
      .doc(vehicleId)
      .get();

    if (!vehicleDoc.exists) {
      console.log(`❌ Vehicle not found`);
      return {
        hasNotifications: false,
        notificationCount: 0,
        recipientCount: 0,
      };
    }

    const vehicleData = vehicleDoc.data();
    if (!vehicleData.services || vehicleData.services.length === 0) {
      console.log(`ℹ️ No services found`);
      return {
        hasNotifications: false,
        notificationCount: 0,
        recipientCount: 0,
      };
    }

    console.log(`🔍 Found ${vehicleData.services.length} services`);

    // Get recipients (owner + team members)
    const notificationRecipients = new Set([ownerId]);

    const teamMembersSnapshot = await admin
      .firestore()
      .collection("Users")
      .where("createdBy", "==", ownerId)
      .where("isTeamMember", "==", true)
      .get();

    for (const memberDoc of teamMembersSnapshot.docs) {
      const memberId = memberDoc.id;
      const memberVehicleDoc = await admin
        .firestore()
        .collection("Users")
        .doc(memberId)
        .collection("Vehicles")
        .doc(vehicleId)
        .get();
      if (memberVehicleDoc.exists) {
        notificationRecipients.add(memberId);
      }
    }

    console.log(`👥 Recipients: ${notificationRecipients.size}`);

    let hasNotifications = false;
    const serviceNotifications = [];

    // Check each service
    vehicleData.services.forEach((service) => {
      const type = (service.type || "reading").toLowerCase();
      const nextNotificationValue = service.nextNotificationValue;

      if (type !== "day") return;
      if (!isNaN(nextNotificationValue)) return;

      if (
        typeof nextNotificationValue === "string" &&
        nextNotificationValue.includes("/")
      ) {
        try {
          const [day, month, year] = nextNotificationValue
            .split("/")
            .map(Number);
          const notificationDate = new Date(year, month - 1, day);
          const shouldNotify = currentDate >= notificationDate;

          if (shouldNotify) {
            hasNotifications = true;
            serviceNotifications.push({
              serviceName: service.serviceName,
              type: type,
              nextNotificationValue: service.nextNotificationValue,
              message: `${service.serviceName} for your ${vehicleData.vehicleType} is due!`,
            });
            console.log(`🔔 Notification: ${service.serviceName}`);
          }
        } catch (error) {
          console.error(`❌ Date parse error: ${nextNotificationValue}`);
        }
      }
    });

    console.log(`📊 Results: ${serviceNotifications.length} notifications`);

    // Send notifications if any
    if (hasNotifications && serviceNotifications.length > 0) {
      console.log(
        `📨 Sending ${serviceNotifications.length} notifications to ${notificationRecipients.size} recipients`
      );
      await sendNotificationsToRecipients(
        ownerId,
        vehicleId,
        vehicleData,
        serviceNotifications,
        notificationRecipients
      );
    }

    return {
      hasNotifications: hasNotifications,
      notificationCount: serviceNotifications.length,
      recipientCount: notificationRecipients.size,
    };
  } catch (error) {
    console.error(`❌ Error in checkDayServicesForVehicle:`, error);
    return { hasNotifications: false, notificationCount: 0, recipientCount: 0 };
  }
}

async function sendNotificationsToRecipients(
  ownerId,
  vehicleId,
  vehicleData,
  notifications,
  recipients
) {
  console.log(
    `📨 sendNotificationsToRecipients: Sending to ${recipients.size} recipients`
  );

  const vehicleType = vehicleData.vehicleType;
  const currentMiles = parseInt(vehicleData.currentMiles || "0");
  const hoursReading = parseInt(vehicleData.hoursReading || "0");

  for (const recipientId of recipients) {
    try {
      const recipientDoc = await admin
        .firestore()
        .collection("Users")
        .doc(recipientId)
        .get();
      const recipientData = recipientDoc.data();

      if (recipientData.isNotificationOn === false) continue;

      const userName = recipientData.userName || "User";
      const fcmToken = recipientData.fcmToken;

      // Save to UserNotifications
      await admin
        .firestore()
        .collection("Users")
        .doc(recipientId)
        .collection("UserNotifications")
        .doc()
        .set({
          vehicleId: vehicleId,
          notifications: notifications,
          date: admin.firestore.FieldValue.serverTimestamp(),
          isRead: false,
          message: `Hey ${userName}, ${notifications.length} service${
            notifications.length > 1 ? "s" : ""
          } for your ${vehicleType} ${
            notifications.length > 1 ? "are" : "is"
          } due!`,
          currentMiles: vehicleType === "Truck" ? currentMiles : null,
          hoursReading: vehicleType === "Trailer" ? hoursReading : null,
        });

      console.log(`✅ Notification saved for: ${recipientId}`);

      // Send FCM if token exists
      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "Service Reminder 🚗",
              body: `Hey ${userName}, ${notifications.length} service${
                notifications.length > 1 ? "s" : ""
              } for your ${vehicleType} ${
                notifications.length > 1 ? "are" : "is"
              } due!`,
            },
            data: {
              userId: recipientId,
              vehicleId: vehicleId,
              type: "service_reminder",
            },
          });
          console.log(`📱 FCM sent to: ${recipientId}`);
        } catch (fcmError) {
          console.error(`❌ FCM error for ${recipientId}:`, fcmError.message);
          // Clean invalid token
          if (
            fcmError.code === "messaging/invalid-argument" ||
            fcmError.code === "messaging/registration-token-not-registered"
          ) {
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
    } catch (error) {
      console.error(`❌ Error notifying ${recipientId}:`, error);
    }
  }

  // Save to global notifications
  await admin
    .firestore()
    .collection("ServiceNotifications")
    .doc()
    .set({
      vehicleId: vehicleId,
      notifications: notifications,
      date: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      message: `Vehicle services need attention for vehicle ${vehicleId}`,
      currentMiles: vehicleType === "Truck" ? currentMiles : 0,
      hoursReading: vehicleType === "Trailer" ? hoursReading : 0,
      triggeredBy: "daily_cron_job",
      recipients: Array.from(recipients),
    });

  console.log(`✅ All notifications sent successfully`);
}

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
                // type: "new_job",
                type: "default",
              },
            };

            const token = mechanicData.fcmToken;
            if (token) {
              notificationPromises.push(
                admin.messaging().send({
                  data: payload.data,
                  notification: payload.notification,
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
        .where("status", "==", 0) // Assuming 0 means job is open
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
              // type: "new_job",
              type: "default",
            },
          };

          const token = mechanicData.fcmToken;
          console.log("Mechanic Token:", token);
          console.log("Payload:", payload);

          if (token) {
            notificationPromises.push(
              admin.messaging().send({
                data: payload.data,
                notification: payload.notification,
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
          type: "default_sound",
        },
      };

      // Send notification to the user
      if (userToken) {
        await admin.messaging().send({
          token: userToken,
          notification: payload.notification,
          data: payload.data,
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
        };

        // Send notification to the mechanic
        if (mechanicToken) {
          await admin.messaging().send({
            token: mechanicToken,
            notification: payload.notification,
            data: payload.data,
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
