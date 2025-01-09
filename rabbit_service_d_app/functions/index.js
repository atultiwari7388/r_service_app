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

//check and notify User for Service

exports.checkAndNotifyUserForVehicleService = functions.https.onCall(
  async (data) => {
    const userId = data.userId; // User ID passed from Flutter
    const vehicleId = data.vehicleId; // Vehicle ID passed from Flutter

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
      const userName = userData.userName || "User";
      const fcmToken = userData.fcmToken;

      // Fetch the vehicle's data
      const vehicleDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .collection("Vehicles")
        .doc(vehicleId)
        .get();

      if (!vehicleDoc.exists) {
        console.error(`Vehicle with ID ${vehicleId} not found.`);
        return { error: `Vehicle not found for ${vehicleId}` };
      }

      const vehicleData = vehicleDoc.data();
      const vehicleType = vehicleData.vehicleType; // Get vehicle type
      let currentMiles = 0;
      let hoursReading = 0;
      let prevMilesValue = 0;
      let prevHoursReadingValue = 0;

      // Determine which values to check based on vehicle type
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

        // Skip if the notification for this service was already sent
        if (service.notificationSent) continue;

        // Check conditions based on vehicle type
        if (
          vehicleType === "Truck" &&
          defaultNotificationValue > 0 &&
          currentMiles >= defaultNotificationValue &&
          !service.lastNotifiedMiles // Only notify if not previously notified for this milestone
        ) {
          hasNotifications = true;
          serviceNotifications.push({
            serviceName,
            defaultNotificationValue, // Keep original default value
            currentMiles,
            message: `Hey ${userName}, your ${serviceName} for vehicle ${
              vehicleData.vehicleType || "unknown"
            } needs attention. Your mileage has reached ${currentMiles}.`,
          });

          // Update the service to mark it as notified
          service.lastNotifiedMiles = currentMiles;
        } else if (
          vehicleType === "Trailer" &&
          defaultNotificationValue > 0 &&
          hoursReading >= defaultNotificationValue &&
          hoursReading > prevHoursReadingValue
        ) {
          hasNotifications = true;
          serviceNotifications.push({
            serviceName,
            defaultNotificationValue,
            hoursReading,
            message: `Hey ${userName}, your ${serviceName} for vehicle ${
              vehicleData.vehicleType || "unknown"
            } needs attention. Your hours reading has reached ${hoursReading}.`,
          });
        }
      }

      if (hasNotifications) {
        // Save a new notification in a new document every time miles are updated
        await admin
          .firestore()
          .collection("Users")
          .doc(userId)
          .collection("UserNotifications")
          .doc() // New document every time
          .set({
            vehicleId,
            notifications: serviceNotifications,
            date: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
            currentMiles: vehicleType === "Truck" ? currentMiles : null,
            hoursReading: vehicleType === "Trailer" ? hoursReading : null,
          });

        // Save notification in ServiceNotifications collection
        await admin
          .firestore()
          .collection("ServiceNotifications")
          .doc() // New document every time
          .set({
            vehicleId,
            notifications: admin.firestore.FieldValue.arrayUnion(
              ...serviceNotifications
            ),
            date: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
            currentMiles: vehicleType === "Truck" ? currentMiles : 0,
            hoursReading: vehicleType === "Trailer" ? hoursReading : 0,
          });

        // Send a push notification if FCM token exists
        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "Service Reminder 🚗",
              body: `Hey ${userName}, some of your vehicle services need attention.`,
            },
            data: {
              userId,
              vehicleId,
              type: "service_reminder",
            },
          });
        }
      }

      console.log(
        "Notifications processed successfully. Vehicle ID is:",
        vehicleId,
        "Updated Current miles are:",
        currentMiles,
        "Current hours reading are:",
        hoursReading,
        "User ID is:",
        userId,
        "New notification docs created.",
        "And doc data is:",
        serviceNotifications
      );
      return { message: "Notifications sent successfully." };
    } catch (error) {
      console.error("Error in checkAndNotifyUserForVehicleService:", error);
      return { error: "Error in sending notifications" };
    }
  }
);

// exports.checkAndNotifyUserForVehicleService = functions.https.onCall(
//   async (data) => {
//     const userId = data.userId; // User ID passed from Flutter
//     const vehicleId = data.vehicleId; // Vehicle ID passed from Flutter

//     try {
//       // Fetch the user's data
//       const userDoc = await admin
//         .firestore()
//         .collection("Users")
//         .doc(userId)
//         .get();
//       if (!userDoc.exists) {
//         console.error(`User with ID ${userId} not found.`);
//         return { error: `User not found for ${userId}` };
//       }

//       const userData = userDoc.data();
//       const userName = userData.userName || "User";
//       const fcmToken = userData.fcmToken;

//       // Fetch the vehicle's data
//       const vehicleDoc = await admin
//         .firestore()
//         .collection("Users")
//         .doc(userId)
//         .collection("Vehicles")
//         .doc(vehicleId)
//         .get();

//       if (!vehicleDoc.exists) {
//         console.error(`Vehicle with ID ${vehicleId} not found.`);
//         return { error: `Vehicle not found for ${vehicleId}` };
//       }

//       const vehicleData = vehicleDoc.data();
//       const vehicleType = vehicleData.vehicleType; // Get vehicle type
//       let currentMiles = 0;
//       let hoursReading = 0;
//       let prevMilesValue = 0;
//       let prevHoursReadingValue = 0;

//       // Determine which values to check based on vehicle type
//       if (vehicleType === "Truck") {
//         const currentMilesArray = vehicleData.currentMilesArray || [];
//         if (currentMilesArray.length === 0) {
//           console.error("No miles data found.");
//           return { error: "No miles data found." };
//         }
//         const latestMilesEntry =
//           currentMilesArray[currentMilesArray.length - 1];
//         currentMiles = parseInt(latestMilesEntry.miles || "0", 10);
//         prevMilesValue = parseInt(vehicleData.prevMilesValue || "0", 10);
//       } else if (vehicleType === "Trailer") {
//         hoursReading = parseInt(vehicleData.hoursReading || "0", 10);
//         prevHoursReadingValue = parseInt(
//           vehicleData.prevHoursReadingValue || "0",
//           10
//         );
//       } else {
//         console.error(`Unknown vehicle type: ${vehicleType}`);
//         return { error: `Unknown vehicle type: ${vehicleType}` };
//       }

//       const nextNotificationMiles = vehicleData.nextNotificationMiles || [];
//       const serviceNotifications = [];
//       let hasNotifications = false;

//       for (const service of nextNotificationMiles) {
//         const defaultNotificationValue = service.defaultNotificationValue || 0;
//         const serviceName = service.serviceName || "Unknown Service";

//         // Skip if the notification for this service was already sent
//         if (service.notificationSent) continue;

//         // Check conditions based on vehicle type
//         if (
//           vehicleType === "Truck" &&
//           defaultNotificationValue > 0 &&
//           currentMiles >= defaultNotificationValue &&
//           currentMiles > prevMilesValue
//         ) {
//           hasNotifications = true;
//           serviceNotifications.push({
//             serviceName,
//             defaultNotificationValue,
//             currentMiles,
//             message: `Hey ${userName}, your ${serviceName} for vehicle ${
//               vehicleData.vehicleType || "unknown"
//             } needs attention. Your mileage has reached ${currentMiles}.`,
//           });
//         } else if (
//           vehicleType === "Trailer" &&
//           defaultNotificationValue > 0 &&
//           hoursReading >= defaultNotificationValue &&
//           hoursReading > prevHoursReadingValue
//         ) {
//           hasNotifications = true;
//           serviceNotifications.push({
//             serviceName,
//             defaultNotificationValue,
//             hoursReading,
//             message: `Hey ${userName}, your ${serviceName} for vehicle ${
//               vehicleData.vehicleType || "unknown"
//             } needs attention. Your hours reading has reached ${hoursReading}.`,
//           });
//         }
//       }

//       if (hasNotifications) {
//         // Save a new notification in a new document every time miles are updated
//         await admin
//           .firestore()
//           .collection("Users")
//           .doc(userId)
//           .collection("UserNotifications")
//           .doc() // New document every time
//           .set({
//             vehicleId,
//             notifications: serviceNotifications,
//             date: admin.firestore.FieldValue.serverTimestamp(),
//             isRead: false,
//             message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
//             currentMiles: vehicleType === "Truck" ? currentMiles : null,
//             hoursReading: vehicleType === "Trailer" ? hoursReading : null,
//           });

//         // Save notification in ServiceNotifications collection
//         await admin
//           .firestore()
//           .collection("ServiceNotifications")
//           .doc() // New document every time
//           .set({
//             vehicleId,
//             notifications: admin.firestore.FieldValue.arrayUnion(
//               ...serviceNotifications
//             ),
//             date: admin.firestore.FieldValue.serverTimestamp(),
//             isRead: false,
//             message: `Hey ${userName}, some of your vehicle services need attention. Check now!`,
//             currentMiles: vehicleType === "Truck" ? currentMiles : 0,
//             hoursReading: vehicleType === "Trailer" ? hoursReading : 0,
//           });

//         // Send a push notification if FCM token exists
//         if (fcmToken) {
//           await admin.messaging().send({
//             token: fcmToken,
//             notification: {
//               title: "Service Reminder 🚗",
//               body: `Hey ${userName}, some of your vehicle services need attention.`,
//             },
//             data: {
//               userId,
//               vehicleId,
//               type: "service_reminder",
//             },
//           });
//         }
//       }

//       console.log(
//         "Notifications processed successfully. Vehicle ID is:",
//         vehicleId,
//         "Updated Current miles are:",
//         currentMiles,
//         "Current hours reading are:",
//         hoursReading,
//         "User ID is:",
//         userId,
//         "New notification docs created.",
//         "And doc data is:",
//         serviceNotifications
//       );
//       return { message: "Notifications sent successfully." };
//     } catch (error) {
//       console.error("Error in checkAndNotifyUserForVehicleService:", error);
//       return { error: "Error in sending notifications" };
//     }
//   }
// );

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
            type: "job_canceled",
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
              type: "new_job",
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
