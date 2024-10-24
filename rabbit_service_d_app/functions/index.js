const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

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

// exports.autoCancelIfUserDidNotAccept = functions.pubsub
//   .schedule("every 1 minutes")
//   .onRun(async (context) => {
//     try {
//       const fiveMinutesAgo = admin.firestore.Timestamp.now().toDate();
//       fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

//       // Query jobs where status is 0 (open) and a mechanic has accepted the job
//       const jobsSnapshot = await db
//         .collection("jobs")
//         .where("status", "==", 0) // Job is still open
//         .get();

//       if (jobsSnapshot.empty) {
//         console.log("No open jobs to check for user acceptance.");
//         return null;
//       }

//       const updatePromises = [];
//       const notificationPromises = [];

//       for (const jobDoc of jobsSnapshot.docs) {
//         const jobData = jobDoc.data();
//         const jobId = jobDoc.id;
//         const userId = jobData.userId;
//         const mechanicsOffer = jobData.mechanicsOffer || [];

//         // Check if there's any mechanic who accepted the job
//         for (let [index, offer] of mechanicsOffer.entries()) {
//           const offerStatus = offer.status;
//           const offerAcceptedDate = offer.offerAcceptedDate
//             ? offer.offerAcceptedDate.toDate()
//             : null;

//           if (
//             offerStatus === 1 &&
//             offerAcceptedDate &&
//             offerAcceptedDate <= fiveMinutesAgo
//           ) {
//             console.log(
//               `Mechanic offer was accepted more than 5 minutes ago for job ${jobId}. Checking if user accepted...`
//             );

//             // If the user still hasn't accepted (job status == 0), cancel the job
//             if (jobData.status === 0) {
//               console.log(
//                 `User did not accept the job within 5 minutes for job ${jobId}. Cancelling...`
//               );

//               // Update job status and cancelReason in the 'jobs' collection
//               updatePromises.push(
//                 db.collection("jobs").doc(jobId).update({
//                   status: -1, // Set the job status to 'canceled'
//                   cancelReason: "User did not accept the job within 5 minutes",
//                   cancelBy: "System",
//                 })
//               );

//               // Update the mechanicsOffer status to -1 (canceled by the system)
//               mechanicsOffer[index].status = -1;
//               updatePromises.push(
//                 db.collection("jobs").doc(jobId).update({
//                   mechanicsOffer: mechanicsOffer, // Update the whole array
//                 })
//               );

//               // Update the same in the User's history subcollection
//               const userHistoryRef = db
//                 .collection("Users")
//                 .doc(userId)
//                 .collection("history")
//                 .doc(jobId);

//               updatePromises.push(
//                 userHistoryRef.update({
//                   status: -1, // Set the status to 'canceled' in the user's history
//                   cancelReason:
//                     "You did not accept the mechanic's offer within 5 minutes. The job has been automatically canceled.",
//                   cancelBy: "System",
//                 })
//               );

//               // Update mechanicsOffer in User's history
//               updatePromises.push(
//                 db
//                   .collection("Users")
//                   .doc(userId)
//                   .collection("history")
//                   .doc(jobId)
//                   .update({
//                     mechanicsOffer: mechanicsOffer, // Update the whole array
//                   })
//               );

//               // Send notification to the user
//               const payload = {
//                 notification: {
//                   title: "Job Canceled",
//                   body: "You did not accept the mechanic's offer within 5 minutes. The job has been automatically canceled.",
//                 },
//                 data: {
//                   jobId: jobId,
//                   type: "job_canceled",
//                 },
//               };

//               // Fetch the user's FCM token for sending notification
//               const userSnapshot = await db
//                 .collection("Users")
//                 .doc(userId)
//                 .get();
//               const userData = userSnapshot.data();
//               const userToken = userData.fcmToken;

//               if (userToken) {
//                 notificationPromises.push(
//                   admin.messaging().send({
//                     token: userToken,
//                     notification: payload.notification,
//                     data: payload.data,
//                   })
//                 );
//                 console.log(
//                   `Notification sent to user ${userId} for job ${jobId}`
//                 );
//               } else {
//                 console.log(`User ${userId} does not have a valid FCM token.`);
//               }
//             }
//           }
//         }
//       }

//       // Wait for all updates and notifications to complete
//       await Promise.all([...updatePromises, ...notificationPromises]);

//       console.log("Auto-cancel function for user non-acceptance completed.");
//       return null;
//     } catch (error) {
//       console.error("Error auto-canceling jobs if user did not accept:", error);
//       return null;
//     }
//   });

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
  .schedule("every 10 minutes")
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

    // Check if the status changed from something else to 1 (Mechanic accepted the job)
    if (previousValue.status !== 1 && newValue.status === 1) {
      const userId = newValue.userId; // Get userId from job document
      const jobId = context.params.jobId;
      const mechanicName = newValue.mName; // Assuming mechanicName is stored in the job document

      try {
        // Fetch the user document to get the FCM token and userName
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
        const userName = userData.userName || "User"; // Assuming userName is stored in the Users document

        // Prepare notification payload with emojis and personalized text
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
      } catch (error) {
        console.error("Error sending notification to user:", error);
      }
    }

    return null;
  });

// Function to send a notification to the mechanic when the user accepts the offer
exports.userAcceptMechanicOfferNotification = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Check if the status changed from something else to 2 (User accepted the mechanic's offer)
    if (previousValue.status !== 2 && newValue.status === 2) {
      const mechanicId = newValue.mId; // Get mechanic's ID from job document
      const jobId = context.params.jobId;
      const userName = newValue.userName; // Assuming userName is stored in the job document

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
