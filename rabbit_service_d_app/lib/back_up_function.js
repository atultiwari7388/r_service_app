// const functions = require('firebase-functions')
// const admin = require('firebase-admin')

// admin.initializeApp()

// const calculateDistance = (startLat, startLng, endLat, endLng) => {
//   const radius = 6371.0 // Earth's radius in kilometers

//   const dLat = toRadians(endLat - startLat)
//   const dLng = toRadians(endLng - startLng)

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(startLat)) *
//       Math.cos(toRadians(endLat)) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2)

//   const c = 2 * Math.asin(Math.sqrt(a))

//   return radius * c
// }
// const toRadians = (degrees) => {
//   return degrees * (Math.PI / 180)
// }
// // Function to send a new notification to the nearby Mechanics..
// exports.sendNewMechanicNotification = functions.firestore
//   .document('jobs/{jobId}')
//   .onCreate(async (snapshot, context) => {
//     try {
//       const job = snapshot.data()
//       const userLat = job.userLat // Assuming these fields exist in the job document
//       const userLng = job.userLong

//       console.log('New job request. Job:', job)

//       const jobLocation = {
//         latitude: userLat,
//         longitude: userLng,
//       }

//       console.log('Job Location:', jobLocation)
//       const mechanicsSnapshot = await admin
//         .firestore()
//         .collection('Mechanics')
//         .where('active', '==', true)
//         .get()

//       if (mechanicsSnapshot.empty) {
//         console.log('No active mechanics found.')
//         return null
//       }

//       console.log('Found active mechanics:', mechanicsSnapshot.size)

//       const notificationPromises = []

//       mechanicsSnapshot.forEach((mechanicDoc) => {
//         const mechanicData = mechanicDoc.data()
//         const mechanicLocation = mechanicData.location

//         // Calculate the distance between mechanic and job location
//         const distance = calculateDistance(
//           mechanicLocation.latitude,
//           mechanicLocation.longitude,
//           jobLocation.latitude,
//           jobLocation.longitude
//         )

//         console.log(
//           `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
//         )

//         // Check if the distance is within a specified range (e.g., 5 km)
//         if (distance < 5.0) {
//           console.log('Mechanic is in range. Sending notification...')

//           const payload = {
//             notification: {
//               title: 'New Job Request 🔧',
//               body: `Hey ${mechanicData.userName}, there's a new job request available!`,
//             },
//             data: {
//               jobId: context.params.jobId,
//               type: 'new_job', // Added type field
//             },
//           }

//           const token = mechanicData.fcmToken
//           console.log('Mechanic Token:', token)
//           console.log('Payload:', payload)

//           if (token) {
//             // Send notification to the mechanic and add the promise to the array
//             notificationPromises.push(
//               admin.messaging().send({
//                 data: payload.data,
//                 notification: payload.notification,
//                 token: token,
//               })
//             )

//             console.log('Notification sent to mechanic:', mechanicData)
//           } else {
//             console.error('Invalid token for mechanic:', mechanicData)
//           }
//         } else {
//           console.log(
//             `Mechanic ${mechanicData.name} is not in range. Distance: ${distance} km`
//           )
//         }
//       })

//       // Wait for all notifications to be sent
//       await Promise.all(notificationPromises)

//       console.log('Notifications sent to nearby mechanics.')

//       return null
//     } catch (error) {
//       console.error('Error:', error)
//       return null
//     }
//   })

// // Function to send a notification to the user when the mechanic accepts the job
// exports.mechanicAcceptJobNotification = functions.firestore
//   .document('jobs/{jobId}')
//   .onUpdate(async (change, context) => {
//     const newValue = change.after.data()
//     const previousValue = change.before.data()

//     // Check if the status changed from something else to 1 (Mechanic accepted the job)
//     if (previousValue.status !== 1 && newValue.status === 1) {
//       const userId = newValue.userId // Get userId from job document
//       const jobId = context.params.jobId
//       const mechanicName = newValue.mName // Assuming mechanicName is stored in the job document

//       try {
//         // Fetch the user document to get the FCM token and userName
//         const userDoc = await admin
//           .firestore()
//           .collection('Users')
//           .doc(userId)
//           .get()
//         if (!userDoc.exists) {
//           console.error('User not found:', userId)
//           return null
//         }

//         const userData = userDoc.data()
//         const userToken = userData.fcmToken
//         const userName = userData.userName || 'User' // Assuming userName is stored in the Users document

//         // Prepare notification payload with emojis and personalized text
//         const payload = {
//           notification: {
//             title: '🔧 Mechanic Accepted Your Job!',
//             body: `Hey ${userName}, ${mechanicName} has accepted your job request! 🚗🔧`,
//           },
//           data: {
//             jobId: jobId,
//             type: 'default_sound',
//           },
//         }

//         // Send notification to the user
//         if (userToken) {
//           await admin.messaging().send({
//             token: userToken,
//             notification: payload.notification,
//             data: payload.data,
//           })

//           console.log(`Notification sent to user: ${userId} for job: ${jobId}`)
//         } else {
//           console.error(`User does not have a valid token: ${userId}`)
//         }
//       } catch (error) {
//         console.error('Error sending notification to user:', error)
//       }
//     }

//     return null
//   })

// // Function to send a notification to the mechanic when the user accepts the offer
// exports.userAcceptMechanicOfferNotification = functions.firestore
//   .document('jobs/{jobId}')
//   .onUpdate(async (change, context) => {
//     const newValue = change.after.data()
//     const previousValue = change.before.data()

//     // Check if the status changed from something else to 2 (User accepted the mechanic's offer)
//     if (previousValue.status !== 2 && newValue.status === 2) {
//       const mechanicId = newValue.mId // Get mechanic's ID from job document
//       const jobId = context.params.jobId
//       const userName = newValue.userName // Assuming userName is stored in the job document

//       try {
//         // Fetch the mechanic document to get the FCM token and mechanicName
//         const mechanicDoc = await admin
//           .firestore()
//           .collection('Mechanics')
//           .doc(mechanicId)
//           .get()
//         if (!mechanicDoc.exists) {
//           console.error('Mechanic not found:', mechanicId)
//           return null
//         }

//         const mechanicData = mechanicDoc.data()
//         const mechanicToken = mechanicData.fcmToken
//         const mechanicName = mechanicData.userName || 'Mechanic' // Assuming mechanic's name is stored

//         // Prepare notification payload with emojis and personalized text
//         const payload = {
//           notification: {
//             title: '👍 Offer Accepted!',
//             body: `Hey ${mechanicName}, ${userName} has accepted your offer! 🚚💰`,
//           },
//           data: {
//             jobId: jobId,
//             type: 'offer_accepted', // Added type field
//           },
//         }

//         // Send notification to the mechanic
//         if (mechanicToken) {
//           await admin.messaging().send({
//             token: mechanicToken,
//             notification: payload.notification,
//             data: payload.data,
//           })

//           console.log(
//             `Notification sent to mechanic: ${mechanicId} for job: ${jobId}`
//           )
//         } else {
//           console.error(`Mechanic does not have a valid token: ${mechanicId}`)
//         }
//       } catch (error) {
//         console.error('Error sending notification to mechanic:', error)
//       }
//     }

//     return null
//   })

// // Cloud Function to handle job completion and update mechanic's wallet
// exports.jobCompletionPayment = functions.firestore
//   .document('jobs/{jobId}')
//   .onUpdate(async (change, context) => {
//     const newValue = change.after.data()
//     const previousValue = change.before.data()
//     const jobId = context.params.jobId

//     // Check if the status has been updated to 5
//     if (previousValue.status !== 5 && newValue.status === 5) {
//       // Check if payMode is 'online'
//       const payMode = newValue.payMode
//       if (payMode && payMode.toLowerCase() === 'Online') {
//         // Determine the price to add
//         // Adjust the field names as per your Firestore schema
//         const fixPrice = parseFloat(newValue.fixPrice) || 0
//         const arrivalCharges = parseFloat(newValue.arrivalCharges) || 0

//         // You can adjust the logic here based on how you want to calculate the total price
//         // For example, summing both fixPrice and arrivalCharges
//         const totalPrice = fixPrice + arrivalCharges

//         // Alternatively, if only one of them is relevant based on other conditions, adjust accordingly

//         // Get the Mechanic's ID
//         const mechanicId = newValue.mId
//         if (!mechanicId) {
//           console.error(`Mechanic ID (mId) is missing in job ${jobId}`)
//           return null
//         }

//         try {
//           // Reference to the Mechanic's document
//           const mechanicRef = admin
//             .firestore()
//             .collection('Mechanics')
//             .doc(mechanicId)

//           // Update the wallet using FieldValue.increment for atomicity
//           await mechanicRef.update({
//             wallet: admin.firestore.FieldValue.increment(totalPrice),
//           })

//           console.log(
//             `Successfully added ${totalPrice} to mechanic ${mechanicId}'s wallet for job ${jobId}.`
//           )

//           // Optional: Send a notification to the mechanic about the wallet update
//           const mechanicDoc = await mechanicRef.get()
//           if (mechanicDoc.exists) {
//             const mechanicData = mechanicDoc.data()
//             const mechanicToken = mechanicData.fcmToken

//             if (mechanicToken) {
//               const notificationPayload = {
//                 notification: {
//                   title: '💰 Wallet Updated!',
//                   body: `Your wallet has been credited with ₹${totalPrice} for job ID: ${jobId}. Total Balance: ₹${
//                     mechanicData.wallet + totalPrice
//                   }`,
//                 },
//                 data: {
//                   jobId: jobId,
//                   type: 'default_sound',
//                 },
//               }

//               await admin.messaging().send({
//                 token: mechanicToken,
//                 notification: notificationPayload.notification,
//                 data: notificationPayload.data,
//               })

//               console.log(
//                 `Notification sent to mechanic ${mechanicId} about wallet update.`
//               )
//             } else {
//               console.error(
//                 `Mechanic ${mechanicId} does not have a valid FCM token.`
//               )
//             }
//           } else {
//             console.error(`Mechanic document not found for ID: ${mechanicId}`)
//           }
//         } catch (error) {
//           console.error(
//             `Error updating wallet for mechanic ${mechanicId}:`,
//             error
//           )
//         }
//       } else {
//         console.log(
//           `Job ${jobId} completed but payMode is not 'online'. No wallet update required.`
//         )
//       }
//     } else {
//       // Status did not change to 5; do nothing
//       return null
//     }
//     return null
//   })

// Function to send a new notification to the nearby Mechanics
// exports.sendNewMechanicNotification = functions.firestore
//   .document('jobs/{jobId}')
//   .onCreate(async (snapshot, context) => {
//     try {
//       const job = snapshot.data()
//       const userLat = job.userLat // Assuming these fields exist in the job document
//       const userLng = job.userLong

//       console.log('New job request. Job:', job)

//       const jobLocation = {
//         latitude: userLat,
//         longitude: userLng,
//       }

//       console.log('Job Location:', jobLocation)
//       const mechanicsSnapshot = await admin
//         .firestore()
//         .collection('Mechanics')
//         .where('active', '==', true)
//         .get()

//       if (mechanicsSnapshot.empty) {
//         console.log('No active mechanics found.')
//         return null
//       }

//       console.log('Found active mechanics:', mechanicsSnapshot.size)

//       const notificationPromises = []

//       mechanicsSnapshot.forEach((mechanicDoc) => {
//         const mechanicData = mechanicDoc.data()
//         const mechanicLocation = mechanicData.location

//         // Calculate the distance between mechanic and job location
//         const distance = calculateDistance(
//           mechanicLocation.latitude,
//           mechanicLocation.longitude,
//           jobLocation.latitude,
//           jobLocation.longitude
//         )

//         console.log(
//           `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
//         )

//         // Check if the distance is within a specified range (e.g., 5 km)
//         if (distance < 5.0) {
//           console.log('Mechanic is in range. Sending notification...')

//           const payload = {
//             notification: {
//               title: 'New Job Request 🔧',
//               body: `Hey ${mechanicData.userName}, there's a new job request available!`,
//             },
//             data: {
//               jobId: context.params.jobId,
//               type: 'new_job', // Added type field
//             },
//           }

//           const token = mechanicData.fcmToken
//           console.log('Mechanic Token:', token)
//           console.log('Payload:', payload)

//           if (token) {
//             // Send notification to the mechanic and add the promise to the array
//             notificationPromises.push(
//               admin.messaging().send({
//                 data: payload.data,
//                 notification: payload.notification,
//                 token: token,
//               })
//             )

//             console.log('Notification sent to mechanic:', mechanicData)
//           } else {
//             console.error('Invalid token for mechanic:', mechanicData)
//           }
//         } else {
//           console.log(
//             `Mechanic ${mechanicData.userName} is not in range. Distance: ${distance} km`
//           )
//         }
//       })

//       // Wait for all notifications to be sent
//       await Promise.all(notificationPromises)

//       console.log('Notifications sent to nearby mechanics.')

//       return null
//     } catch (error) {
//       console.error('Error:', error)
//       return null
//     }
//   })

//new code 3 October

// Function to send a new notification to the nearby Mechanics
// exports.sendNewMechanicNotification = functions.firestore
//   .document('jobs/{jobId}')
//   .onCreate(async (snapshot, context) => {
//     try {
//       const job = snapshot.data()
//       const userLat = job.userLat // Assuming these fields exist in the job document
//       const userLng = job.userLong

//       console.log('New job request. Job:', job)

//       const jobLocation = {
//         latitude: userLat,
//         longitude: userLng,
//       }

//       console.log('Job Location:', jobLocation)

//       // Fetch the dynamic nearby distance value from the metadata collection
//       const metadataDoc = await admin
//         .firestore()
//         .collection('metadata')
//         .doc('nearByDistance')
//         .get()
//       let nearByDistance = 5.0 // Default value

//       if (metadataDoc.exists) {
//         nearByDistance = metadataDoc.data().value || nearByDistance
//         console.log('Fetched nearByDistance:', nearByDistance)
//       } else {
//         console.log(
//           'Metadata document not found. Using default nearByDistance:',
//           nearByDistance
//         )
//       }

//       const mechanicsSnapshot = await admin
//         .firestore()
//         .collection('Mechanics')
//         .where('active', '==', true)
//         .get()

//       if (mechanicsSnapshot.empty) {
//         console.log('No active mechanics found.')
//         return null
//       }

//       console.log('Found active mechanics:', mechanicsSnapshot.size)

//       const notificationPromises = []

//       mechanicsSnapshot.forEach((mechanicDoc) => {
//         const mechanicData = mechanicDoc.data()
//         const mechanicLocation = mechanicData.location

//         // Calculate the distance between mechanic and job location
//         const distance = calculateDistance(
//           mechanicLocation.latitude,
//           mechanicLocation.longitude,
//           jobLocation.latitude,
//           jobLocation.longitude
//         )

//         console.log(
//           `Mechanic ID: ${mechanicDoc.id}, Distance to job: ${distance} kms`
//         )

//         // Use the dynamic nearby distance value
//         if (distance < nearByDistance) {
//           console.log('Mechanic is in range. Sending notification...')

//           const payload = {
//             notification: {
//               title: 'New Job Request 🔧',
//               body: `Hey ${mechanicData.userName}, there's a new job request available!`,
//             },
//             data: {
//               jobId: context.params.jobId,
//               type: 'new_job', // Added type field
//             },
//           }

//           const token = mechanicData.fcmToken
//           console.log('Mechanic Token:', token)
//           console.log('Payload:', payload)

//           if (token) {
//             // Send notification to the mechanic and add the promise to the array
//             notificationPromises.push(
//               admin.messaging().send({
//                 data: payload.data,
//                 notification: payload.notification,
//                 token: token,
//               })
//             )

//             console.log('Notification sent to mechanic:', mechanicData)
//           } else {
//             console.error('Invalid token for mechanic:', mechanicData)
//           }
//         } else {
//           console.log(
//             `Mechanic ${mechanicData.userName} is not in range. Distance: ${distance} km`
//           )
//         }
//       })

//       // Wait for all notifications to be sent
//       await Promise.all(notificationPromises)

//       console.log('Notifications sent to nearby mechanics.')

//       return null
//     } catch (error) {
//       console.error('Error:', error)
//       return null
//     }
//   })
