'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, collection, addDoc, updateDoc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import Footer from './components/Footer'
import Header from './components/Header'
import FindMechanicForm from './components/FindMechanicForm'
import OurServicesComponent from './components/OurServices'

const kPrimary = '#F96176' // Define primary color
const kSecondary = '#58bb87' //Define secondary color

export default function Page() {
  const [allServices, setAllServices] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [query, setQuery] = useState('')
  const { user } = useAuth()

  // Fetch services from Firestore
  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDoc(
        doc(collection(db, 'metadata'), 'servicesList')
      )
      const servicesData = servicesSnapshot.data()?.data || []

      // Process services
      const servicesList = servicesData.map((service) => ({
        title: service.title,
        imageType: Number(service.image_type),
        priceType: Number(service.price_type),
      }))

      setAllServices(servicesList)
      setFilteredServices(servicesList)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  // Fetch vehicles from Firestore
  const fetchVehicles = async () => {
    try {
      const userId = user.uid
      const vehiclesSnapshot = await getDoc(
        collection(db, `Users/${userId}/Vehicles`)
      )
      const vehiclesList = vehiclesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(), // This will spread the vehicle data into the object
        }))
        .filter((vehicle) => vehicle.companyName) // Filter out any vehicles without company name

      setVehicles(vehiclesList) // Set the fetched vehicles into state
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchVehicles()
  }, [])

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) {
        const filtered = allServices.filter((service) =>
          service.title.toLowerCase().startsWith(query.toLowerCase())
        )
        setFilteredServices(filtered)
      } else {
        setFilteredServices(allServices)
      }
    }, 300) // 300ms debounce time

    return () => {
      clearTimeout(handler)
    }
  }, [query, allServices])

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
        // toast.info('Location already set. No need to store again.')
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
    <main className='flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <Header />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Left side (Find Mechanic form) */}
          <FindMechanicForm
            allServices={allServices}
            filteredServices={filteredServices}
            filteredvehicles={vehicles}
            setQuery={setQuery}
          />
          {/* Right side (Our Services) */}
          <OurServicesComponent />
        </div>
      </div>
      <Footer />
    </main>
  )
}
