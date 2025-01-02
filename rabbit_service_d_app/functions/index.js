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

exports.checkAndNotifyUserForVehicleService = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    try {
      const usersSnapshot = await admin.firestore().collection("Users").get();

      if (usersSnapshot.empty) {
        console.log("No users found.");
        return null;
      }

      const notificationPromises = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userName = userData.userName || "User";

        // Fetch Vehicles subcollection for the user
        const vehiclesSnapshot = await admin
          .firestore()
          .collection("Users")
          .doc(userId)
          .collection("Vehicles")
          .get();

        if (vehiclesSnapshot.empty) {
          console.log(`No vehicles found for user ${userId}`);
          continue;
        }

        for (const vehicleDoc of vehiclesSnapshot.docs) {
          const vehicleData = vehicleDoc.data();
          const currentMiles = parseInt(vehicleData.currentMiles || "0", 10);
          const nextNotificationMiles = vehicleData.nextNotificationMiles || [];

          for (let i = 0; i < nextNotificationMiles.length; i++) {
            const service = nextNotificationMiles[i];
            const nextNotificationValue = service.nextNotificationValue || 0;
            const serviceName = service.serviceName || "Unknown Service";

            if (
              nextNotificationValue > 0 &&
              currentMiles >= nextNotificationValue
            ) {
              console.log(
                `Service ${serviceName} exceeds threshold for user ${userId}`
              );

              const notificationMessage = `Hey ${userName}, your ${serviceName} for vehicle ${
                vehicleData.vehicleType || "unknown"
              } needs attention. Your mileage has reached ${currentMiles}.`;

              const payload = {
                notification: {
                  title: "Service Reminder 🚗",
                  body: notificationMessage,
                },
                data: {
                  userId,
                  vehicleId: vehicleDoc.id,
                  serviceName,
                  type: "service_reminder",
                },
              };

              // Save notification in UserNotifications subcollection
              await admin
                .firestore()
                .collection("Users")
                .doc(userId)
                .collection("UserNotifications")
                .add({
                  userId,
                  vehicleId: vehicleDoc.id,
                  serviceName,
                  message: notificationMessage,
                  isRead: false,
                  date: admin.firestore.FieldValue.serverTimestamp(),
                  type: "service_reminder",
                });

              // Save notification in ServiceNotifications collection
              await admin.firestore().collection("ServiceNotifications").add({
                userId,
                vehicleId: vehicleDoc.id,
                serviceName,
                message: notificationMessage,
                isRead: false,
                date: admin.firestore.FieldValue.serverTimestamp(),
                type: "service_reminder",
              });

              const fcmToken = userData.fcmToken;
              if (fcmToken) {
                notificationPromises.push(
                  admin.messaging().send({
                    token: fcmToken,
                    ...payload,
                  })
                );
              } else {
                console.error(`No FCM token for user ${userId}`);
              }

              // Update nextNotificationValue to 0 to avoid repeated notifications
              service.nextNotificationValue = 0;
            }
          }

          // Update nextNotificationMiles in the vehicle document
          await vehicleDoc.ref.update({
            nextNotificationMiles,
          });
        }
      }

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);

      console.log("All notifications sent successfully.");
      return null;
    } catch (error) {
      console.error("Error in checkAndNotifyUserForVehicleService:", error);
      return null;
    }
  });

//check and notify User for Service
// exports.checkAndNotifyUserForService = functions.pubsub
//   .schedule("every 24 hours")
//   .onRun(async () => {
//     try {
//       const usersSnapshot = await admin.firestore().collection("Users").get();

//       if (usersSnapshot.empty) {
//         console.log("No users found.");
//         return null;
//       }

//       const notificationPromises = [];

//       for (const userDoc of usersSnapshot.docs) {
//         const userId = userDoc.id;
//         const dataServicesSnapshot = await admin
//           .firestore()
//           .collection("Users")
//           .doc(userId)
//           .collection("DataServices")
//           .get();

//         if (dataServicesSnapshot.empty) {
//           console.log(`No DataServices found for user ${userId}`);
//           continue;
//         }

//         for (const serviceDoc of dataServicesSnapshot.docs) {
//           const serviceData = serviceDoc.data();
//           const docId = serviceDoc.id; // Document ID for DataServices

//           // Get currentMilesArray and calculate totalMiles
//           const currentMilesArray = serviceData.currentMilesArray || [];
//           const currentMiles = serviceData.vehicleDetails?.currentMiles || 0;
//           const totalMiles =
//             currentMiles +
//             currentMilesArray.reduce((acc, entry) => acc + entry.miles, 0);

//           // Update the totalMiles field in both collections
//           await Promise.all([
//             serviceDoc.ref.update({ totalMiles }),
//             admin
//               .firestore()
//               .collection("DataServicesRecords")
//               .doc(docId)
//               .update({ totalMiles }),
//           ]);

//           // Check each service in the services array
//           const services = serviceData.services || [];
//           for (const service of services) {
//             const { defaultNotificationValue, nextNotificationValues } =
//               service;

//             if (!defaultNotificationValue || defaultNotificationValue === 0) {
//               console.log(
//                 `Service ${service.serviceName} has no notification threshold.`
//               );
//               continue;
//             }

//             // Handle services that have already crossed the threshold
//             if (currentMiles >= defaultNotificationValue) {
//               console.log(
//                 `Service ${service.serviceName} already exceeded for user ${userId}`
//               );

//               // Notify the user immediately
//               const notificationMessage = `Hey ${
//                 userDoc.data().userName || "user"
//               }, your ${service.serviceName} for vehicle ${
//                 serviceData.vehicleDetails?.vehicleType || "unknown"
//               } has already crossed the service threshold. Current mileage: ${currentMiles}. Please service it as soon as possible!`;

//               const payload = {
//                 notification: {
//                   title: "Service Reminder 🚗",
//                   body: notificationMessage,
//                 },
//                 data: {
//                   userId,
//                   vehicleId: serviceData.vehicleId || "",
//                   serviceId: service.serviceId || "",
//                   type: "service_reminder",
//                 },
//               };

//               // Create notification document in UserNotifications collection
//               await admin
//                 .firestore()
//                 .collection("Users")
//                 .doc(userId)
//                 .collection("UserNotifications")
//                 .add({
//                   userId,
//                   message: notificationMessage,
//                   isRead: false,
//                   date: admin.firestore.FieldValue.serverTimestamp(),
//                   serviceId: service.serviceId || "",
//                   vehicleId: serviceData.vehicleId || "",
//                   type: "service_reminder",
//                 });

//               // Create notification document in ServiceNotifications collection
//               await admin
//                 .firestore()
//                 .collection("ServiceNotifications")
//                 .add({
//                   userId,
//                   message: notificationMessage,
//                   isRead: false,
//                   date: admin.firestore.FieldValue.serverTimestamp(),
//                   serviceId: service.serviceId || "",
//                   vehicleId: serviceData.vehicleId || "",
//                   type: "service_reminder",
//                 });

//               const fcmToken = userDoc.data().fcmToken;
//               if (fcmToken) {
//                 notificationPromises.push(
//                   admin.messaging().send({
//                     token: fcmToken,
//                     ...payload,
//                   })
//                 );
//               } else {
//                 console.error(`No FCM token for user ${userId}`);
//               }

//               // Reset nextNotificationValues for future tracking
//               service.nextNotificationValues = currentMiles;
//             } else {
//               // For services not yet crossed, update nextNotificationValues
//               const updatedNextNotificationValues =
//                 nextNotificationValues || totalMiles;
//               service.nextNotificationValues = updatedNextNotificationValues;

//               // Send notification if the threshold is exceeded
//               if (updatedNextNotificationValues >= defaultNotificationValue) {
//                 console.log(
//                   `Service ${service.serviceName} exceeds threshold for user ${userId}`
//                 );

//                 const notificationMessage = `Hey ${
//                   userDoc.data().userName || "user"
//                 }, it's time to service your ${
//                   service.serviceName
//                 }! Your total mileage has reached ${totalMiles}.`;

//                 const payload = {
//                   notification: {
//                     title: "Service Reminder 🚗",
//                     body: notificationMessage,
//                   },
//                   data: {
//                     userId,
//                     vehicleId: serviceData.vehicleId || "",
//                     serviceId: service.serviceId || "",
//                     type: "service_reminder",
//                   },
//                 };

//                 // Create notification document in UserNotifications collection
//                 await admin
//                   .firestore()
//                   .collection("Users")
//                   .doc(userId)
//                   .collection("UserNotifications")
//                   .add({
//                     userId,
//                     message: notificationMessage,
//                     isRead: false,
//                     date: admin.firestore.FieldValue.serverTimestamp(),
//                     serviceId: service.serviceId || "",
//                     vehicleId: serviceData.vehicleId || "",
//                     type: "service_reminder",
//                   });
//                 // Create notification document in ServiceNotifications collection
//                 await admin
//                   .firestore()
//                   .collection("ServiceNotifications")
//                   .add({
//                     userId,
//                     message: notificationMessage,
//                     isRead: false,
//                     date: admin.firestore.FieldValue.serverTimestamp(),
//                     serviceId: service.serviceId || "",
//                     vehicleId: serviceData.vehicleId || "",
//                     type: "service_reminder",
//                   });

//                 if (fcmToken) {
//                   notificationPromises.push(
//                     admin.messaging().send({
//                       token: fcmToken,
//                       ...payload,
//                     })
//                   );
//                 }

//                 // Reset nextNotificationValues after sending notification
//                 service.nextNotificationValues = 0;
//               }
//             }
//           }

//           // Update the services array in both collections
//           await Promise.all([
//             serviceDoc.ref.update({ services }),
//             admin
//               .firestore()
//               .collection("DataServicesRecords")
//               .doc(docId)
//               .update({ services }),
//           ]);
//         }
//       }

//       // Wait for all notifications to be sent
//       await Promise.all(notificationPromises);

//       console.log("All notifications sent successfully.");
//       return null;
//     } catch (error) {
//       console.error("Error in checkAndNotifyUserForService:", error);
//       return null;
//     }
//   });

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

// Scheduled function to run every 5 minutes
// exports.updateMechanicLocation = functions.pubsub
//   .schedule("every 5 minutes")
//   .onRun(async (context) => {
//     try {
//       // Fetch jobs with status 2
//       const jobsSnapshot = await admin
//         .firestore()
//         .collection("jobs")
//         .where("status", "==", 2)
//         .get();

//       const updates = [];

//       // Iterate through each job document
//       for (const jobDoc of jobsSnapshot.docs) {
//         const jobData = jobDoc.data();
//         const mechanicsOffers = jobData.mechanicsOffer;

//         // Find mechanics with status 2
//         for (const offer of mechanicsOffers) {
//           if (offer.status === 2) {
//             const mechanicId = offer.mId;
//             const userId = jobData.userId; // Get the userId from the job document

//             // Fetch the mechanic's real-time location
//             const mechanicDoc = await admin
//               .firestore()
//               .collection("Mechanics")
//               .doc(mechanicId)
//               .get();

//             if (mechanicDoc.exists) {
//               const mechanicData = mechanicDoc.data();
//               const { latitude: newLatitude, longitude: newLongitude } =
//                 mechanicData.location || {};

//               // Update job's mechanicsOffer with new location
//               const offerIndex = mechanicsOffers.findIndex(
//                 (o) => o.mId === mechanicId
//               );
//               if (offerIndex !== -1) {
//                 // Update mechanics offer with new latitude and longitude
//                 mechanicsOffers[offerIndex].mecLatitude = newLatitude;
//                 mechanicsOffers[offerIndex].mecLongitude = newLongitude;

//                 // Update the jobs collection
//                 updates.push(
//                   jobDoc.ref.update({
//                     mechanicsOffer: mechanicsOffers,
//                   })
//                 );

//                 // Update the mechanic's location in the Mechanics collection (if needed)
//                 updates.push(
//                   admin
//                     .firestore()
//                     .collection("Mechanics")
//                     .doc(mechanicId)
//                     .update({
//                       location: {
//                         latitude: newLatitude,
//                         longitude: newLongitude,
//                       },
//                     })
//                 );

//                 // Update the user's history as well
//                 updates.push(
//                   admin
//                     .firestore()
//                     .collection("Users")
//                     .doc(userId)
//                     .collection("history")
//                     .doc(jobDoc.id) // Assuming you want to update the same job document in history
//                     .update({
//                       mechanicsOffer: mechanicsOffers, // Update the mechanicsOffer in user's history
//                     })
//                 );
//               }
//             } else {
//               console.error("Mechanic not found:", mechanicId);
//             }
//           }
//         }
//       }

//       // Wait for all updates to complete
//       await Promise.all(updates);

//       console.log("Mechanic locations and user history updated successfully.");
//     } catch (error) {
//       console.error(
//         "Error updating mechanic locations and user history:",
//         error
//       );
//     }

//     return null;
//   });
