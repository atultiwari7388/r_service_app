'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, collection, addDoc, updateDoc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import Footer from './components/Footer'
import Header from './components/Header'

export default function Page() {
  const { user } = useAuth()

  // Function to get user's current location using Geolocation API
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            resolve({ latitude, longitude })
          },
          (error) => {
            reject(error)
          }
        )
      } else {
        reject(new Error('Geolocation is not supported by this browser.'))
      }
    })
  }

  // Function to convert latitude and longitude to address using OpenStreetMap Nominatim
  const getAddressFromLocation = async (latitude, longitude) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    )

    if (!response.ok) {
      throw new Error('Failed to retrieve address from location.')
    }

    const data = await response.json()

    if (data.error) {
      throw new Error('Failed to retrieve address from location.')
    }

    return data.display_name // This returns the human-readable address
  }

  // Function to check if the user's location is already set
  const isLocationAlreadySet = async () => {
    try {
      const userRef = doc(db, 'Users', user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        return userData.isLocationSet || false
      }
      return false
    } catch (error) {
      console.error('Error checking if location is set:', error)
      return false
    }
  }

  // Function to store the user's location in Firestore
  const storeUserLocation = async () => {
    if (!user) {
      toast.error('User is not logged in.')
      return
    }

    try {
      // Check if the location is already set
      const locationSet = await isLocationAlreadySet()

      if (locationSet) {
        toast.info('Location already set. No need to store again.')
        return
      }

      // Get user's current location
      const location = await getUserLocation()
      console.log('User location:', location)

      // Get address from coordinates
      const address = await getAddressFromLocation(
        location.latitude,
        location.longitude
      )
      console.log('Retrieved address:', address)

      // Prepare the data to be stored
      const addressData = {
        address: address, // Store the retrieved address
        addressType: 'Home', // Default address type
        date: new Date(),
        location: {
          latitude: location.latitude.toString(), // Convert to string
          longitude: location.longitude.toString(), // Convert to string
        },
        isAddressSelected: true, // New field added
      }

      // Reference to the Addresses subcollection for the logged-in user
      const addressesRef = collection(doc(db, 'Users', user.uid), 'Addresses')

      // Add a new document to the Addresses subcollection
      const docRef = await addDoc(addressesRef, addressData)

      // Update the document with the ID field
      await updateDoc(docRef, {
        id: docRef.id,
      })

      // Update the user's document to set isLocationSet to true
      const userRef = doc(db, 'Users', user.uid)
      await updateDoc(userRef, {
        isLocationSet: true, // New field added
      })

      toast.success('Location saved successfully!')
    } catch (error) {
      console.error('Error storing location:', error)
      toast.error(error.message || 'Failed to save location.')
    }
  }

  // Fetch and store location when user lands on the dashboard
  useEffect(() => {
    if (user) {
      storeUserLocation()
    }
  }, [user])

  return (
    <main className='flex flex-col min-h-screen'>
      {' '}
      {/* Flex column to stretch to full height */}
      <Header />
      <div className='flex-grow'>
        {' '}
        {/* This div takes up the remaining space */}
        {/** Some body section text */}
        <p>Your main content goes here.</p>
      </div>
      <Footer />
    </main>
  )
}
