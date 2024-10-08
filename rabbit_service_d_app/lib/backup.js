// Function to send a new notification to the nearby Mechanics..
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

//         // Check if the distance is within a specified range (e.g., 5 km)
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
