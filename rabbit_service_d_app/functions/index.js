const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const calculateDistance = (startLat, startLng, endLat, endLng) => {
  const radius = 6371.0 // Earth's radius in kilometers

  const dLat = toRadians(endLat - startLat)
  const dLng = toRadians(endLng - startLng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.asin(Math.sqrt(a))

  return radius * c
}
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}

// Function to send a new notification to the nearby Mechanics..
exports.sendNewMechanicNotification = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snapshot, context) => {
    try {
      const job = snapshot.data()
      const userLat = job.userLat // Assuming these fields exist in the job document
      const userLng = job.userLong

      console.log('New job request. Job:', job)

      const jobLocation = {
        latitude: userLat,
        longitude: userLng,
      }

      console.log('Job Location:', jobLocation)
      const mechanicsSnapshot = await admin
        .firestore()
        .collection('Mechanics')
        .where('active', '==', true)
        .get()

      if (mechanicsSnapshot.empty) {
        console.log('No active mechanics found.')
        return null
      }

      console.log('Found active mechanics:', mechanicsSnapshot.size)

      const notificationPromises = []

      mechanicsSnapshot.forEach((mechanicDoc) => {
        const mechanicData = mechanicDoc.data()
        const mechanicLocation = mechanicData.location

        // Calculate the distance between mechanic and job location
        const distance = calculateDistance(
          mechanicLocation.latitude,
          mechanicLocation.longitude,
          jobLocation.latitude,
          jobLocation.longitude
        )

        console.log(
          `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
        )

        // Check if the distance is within a specified range (e.g., 5 km)
        if (distance < 5.0) {
          console.log('Mechanic is in range. Sending notification...')

          const payload = {
            notification: {
              title: 'New Job Request 🔧',
              body: `Hey ${mechanicData.userName}, there's a new job request available!`,
            },
            data: {
              jobId: context.params.jobId,
            },
          }

          const token = mechanicData.fcmToken
          console.log('Mechanic Token:', token)
          console.log('Payload:', payload)

          if (token) {
            // Send notification to the mechanic and add the promise to the array
            notificationPromises.push(
              admin.messaging().send({
                data: payload.data,
                notification: payload.notification,
                token: token,
              })
            )

            console.log('Notification sent to mechanic:', mechanicData)
          } else {
            console.error('Invalid token for mechanic:', mechanicData)
          }
        } else {
          console.log(
            `Mechanic ${mechanicData.name} is not in range. Distance: ${distance} km`
          )
        }
      })

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises)

      console.log('Notifications sent to nearby mechanics.')

      return null
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  })

// Function to send a notification to the user when the mechanic accepts the job
exports.mechanicAcceptJobNotification = functions.firestore
  .document('jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data()
    const previousValue = change.before.data()

    // Check if the status changed from something else to 1 (Mechanic accepted the job)
    if (previousValue.status !== 1 && newValue.status === 1) {
      const userId = newValue.userId // Get userId from job document
      const jobId = context.params.jobId
      const mechanicName = newValue.mName // Assuming mechanicName is stored in the job document

      try {
        // Fetch the user document to get the FCM token and userName
        const userDoc = await admin
          .firestore()
          .collection('Users')
          .doc(userId)
          .get()
        if (!userDoc.exists) {
          console.error('User not found:', userId)
          return null
        }

        const userData = userDoc.data()
        const userToken = userData.fcmToken
        const userName = userData.userName || 'User' // Assuming userName is stored in the Users document

        // Prepare notification payload with emojis and personalized text
        const payload = {
          notification: {
            title: '🔧 Mechanic Accepted Your Job!',
            body: `Hey ${userName}, ${mechanicName} has accepted your job request! 🚗🔧`,
          },
          data: {
            jobId: jobId,
          },
        }

        // Send notification to the user
        if (userToken) {
          await admin.messaging().send({
            token: userToken,
            notification: payload.notification,
            data: payload.data,
          })

          console.log(`Notification sent to user: ${userId} for job: ${jobId}`)
        } else {
          console.error(`User does not have a valid token: ${userId}`)
        }
      } catch (error) {
        console.error('Error sending notification to user:', error)
      }
    }

    return null
  })

// Function to send a notification to the mechanic when the user accepts the offer
exports.userAcceptMechanicOfferNotification = functions.firestore
  .document('jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data()
    const previousValue = change.before.data()

    // Check if the status changed from something else to 2 (User accepted the mechanic's offer)
    if (previousValue.status !== 2 && newValue.status === 2) {
      const mechanicId = newValue.mId // Get mechanic's ID from job document
      const jobId = context.params.jobId
      const userName = newValue.userName // Assuming userName is stored in the job document

      try {
        // Fetch the mechanic document to get the FCM token and mechanicName
        const mechanicDoc = await admin
          .firestore()
          .collection('Mechanics')
          .doc(mechanicId)
          .get()
        if (!mechanicDoc.exists) {
          console.error('Mechanic not found:', mechanicId)
          return null
        }

        const mechanicData = mechanicDoc.data()
        const mechanicToken = mechanicData.fcmToken
        const mechanicName = mechanicData.userName || 'Mechanic' // Assuming mechanic's name is stored

        // Prepare notification payload with emojis and personalized text
        const payload = {
          notification: {
            title: '👍 Offer Accepted!',
            body: `Hey ${mechanicName}, ${userName} has accepted your offer! 🚗💰`,
          },
          data: {
            jobId: jobId,
          },
        }

        // Send notification to the mechanic
        if (mechanicToken) {
          await admin.messaging().send({
            token: mechanicToken,
            notification: payload.notification,
            data: payload.data,
          })

          console.log(
            `Notification sent to mechanic: ${mechanicId} for job: ${jobId}`
          )
        } else {
          console.error(`Mechanic does not have a valid token: ${mechanicId}`)
        }
      } catch (error) {
        console.error('Error sending notification to mechanic:', error)
      }
    }

    return null
  })

// Function to monitor new jobs and cancel them if no mechanic accepts in 5 minutes
// exports.autoCancelJobAfterFiveMinutes = functions.firestore
//   .document('jobs/{jobId}')
//   .onCreate(async (snapshot, context) => {
//     const job = snapshot.data()
//     const jobId = context.params.jobId

//     // Set a delay for 5 minutes (300000 ms)
//     const delay = 300000 // 5 minutes in milliseconds
//     const orderDate = job.orderDate.toDate() // Convert Firestore Timestamp to JS Date object
//     const userId = job.userId

//     console.log(`New job created. Job ID: ${jobId}, User ID: ${userId}`)

//     // Wait for 5 minutes to check the status
//     setTimeout(async () => {
//       try {
//         // Fetch the job again after 5 minutes to check its status
//         const jobSnapshot = await admin
//           .firestore()
//           .collection('jobs')
//           .doc(jobId)
//           .get()
//         const updatedJob = jobSnapshot.data()

//         if (updatedJob.status === 0) {
//           // Mechanic didn't accept the job within 5 minutes, so cancel it
//           console.log(
//             `No mechanic accepted the job. Cancelling job ID: ${jobId}`
//           )

//           // Update job status to -1 (cancelled) and add cancelReason
//           await admin.firestore().collection('jobs').doc(jobId).update({
//             status: -1,
//             cancelReason: 'No mechanic found',
//           })

//           // Update in user's subcollection (history)
//           await admin
//             .firestore()
//             .collection('Users')
//             .doc(userId)
//             .collection('history')
//             .doc(jobId)
//             .update({
//               status: -1,
//               cancelReason: 'No mechanic found',
//             })

//           console.log(`Job ID: ${jobId} has been cancelled.`)

//           // Fetch user data to send notification
//           const userDoc = await admin
//             .firestore()
//             .collection('Users')
//             .doc(userId)
//             .get()
//           if (!userDoc.exists) {
//             console.error('User not found:', userId)
//             return null
//           }

//           const userData = userDoc.data()
//           const userToken = userData.fcmToken
//           const userName = userData.name || 'User' // Assuming userName is stored in the Users document

//           // Prepare notification payload with emojis and personalized text
//           const payload = {
//             notification: {
//               title: '🚫 Mechanic Not Found!',
//               body: `Hey ${userName}, we couldn't find a mechanic for your job. Try again later!`,
//             },
//             data: {
//               jobId: jobId,
//             },
//           }

//           // Send notification to the user
//           if (userToken) {
//             await admin.messaging().send({
//               token: userToken,
//               notification: payload.notification,
//               data: payload.data,
//             })

//             console.log(
//               `Notification sent to user: ${userId} for job: ${jobId}`
//             )
//           } else {
//             console.error(`User does not have a valid token: ${userId}`)
//           }
//         }
//       } catch (error) {
//         console.error('Error during job auto-cancellation:', error)
//       }
//     }, delay)

//     return null
//   })

exports.scheduledAutoCancelJobs = functions.pubsub
  .schedule('every 1 minutes') // Run this function every 1 minute
  .onRun(async (context) => {
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 5 * 60 * 1000) // Get the time 5 minutes ago
    )

    try {
      // Query jobs where status is 0 and orderDate is more than 5 minutes ago
      const querySnapshot = await admin
        .firestore()
        .collection('jobs')
        .where('status', '==', 0)
        .where('orderDate', '<=', fiveMinutesAgo)
        .get()

      if (querySnapshot.empty) {
        console.log('No jobs found for auto-cancelation.')
        return null
      }

      const batch = admin.firestore().batch()

      // Loop through each job and cancel it
      querySnapshot.forEach((doc) => {
        const jobId = doc.id
        const jobData = doc.data()
        const userId = jobData.userId

        console.log(`Auto-canceling job with ID: ${jobId}`)

        // Update the job's status to -1 (cancelled) and add a cancel reason
        batch.update(admin.firestore().collection('jobs').doc(jobId), {
          status: -1,
          cancelReason: 'No mechanic found',
        })

        // Update the job's status in the user's history subcollection
        const userJobRef = admin
          .firestore()
          .collection('Users')
          .doc(userId)
          .collection('history')
          .doc(jobId)

        batch.update(userJobRef, {
          status: -1,
          cancelReason: 'No mechanic found',
        })

        // Send a notification to the user
        sendCancelNotificationToUser(userId, jobId)
      })

      // Commit the batch
      await batch.commit()

      console.log('Successfully auto-canceled jobs after 5 minutes.')
      return null
    } catch (error) {
      console.error('Error auto-canceling jobs:', error)
      return null
    }
  })

// Function to send a cancellation notification to the user
async function sendCancelNotificationToUser(userId, jobId) {
  try {
    const userDoc = await admin
      .firestore()
      .collection('Users')
      .doc(userId)
      .get()
    if (!userDoc.exists) {
      console.error('User not found:', userId)
      return
    }

    const userData = userDoc.data()
    const userToken = userData.fcmToken
    const userName = userData.name || 'User' // Assuming userName is stored in the Users document

    // Prepare notification payload with emojis and personalized text
    const payload = {
      notification: {
        title: '🚫 Mechanic Not Found!',
        body: `Hey ${userName}, we couldn't find a mechanic for your job. Please try again later.`,
      },
      data: {
        jobId: jobId,
      },
    }

    if (userToken) {
      await admin.messaging().send({
        token: userToken,
        notification: payload.notification,
        data: payload.data,
      })
      console.log(`Notification sent to user: ${userId} for job: ${jobId}`)
    } else {
      console.error(`No valid token for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}
