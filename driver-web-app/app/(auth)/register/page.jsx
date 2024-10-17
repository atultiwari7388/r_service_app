'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
// import { auth, firestore } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const kPrimary = '#F96176' // Define primary color

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({})
  const handleData = (key, value) => {
    setData({
      ...data,
      [key]: value,
    })
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (
      !data.email ||
      !data.password ||
      !data.userName ||
      !data.phoneNumber ||
      !data.address
    ) {
      toast.error('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      const user = userCredential.user

      // Save user data to Firestore
      await setDoc(doc(db, `Users/${user.uid}`), {
        uid: user.uid,
        email: data.email,
        userName: data.userName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        wallet: 0,
        isNotificationOn: true,
        active: true,
        isTeamMember: false,
        role: 'Owner',
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Send email verification
      await sendEmailVerification(user)
      toast.success(
        'A verification email has been sent. Please verify your email.'
      )

      // Sign out the user immediately after creation to prevent unverified access
      await auth.signOut()

      // Redirect to login screen
      router.push('/login')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email is already in use. Please use a different email.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password.')
      } else {
        toast.error(error?.message || 'Something went wrong, please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className='w-full flex justify-center items-center bg-gray-100 md:p-24 p-10 min-h-screen'>
      <section className='flex flex-col gap-4'>
        <div className='flex justify-center'>
          <img className='h-16' src='/logo.png' alt='Logo' />
        </div>
        <div className='flex flex-col gap-4 bg-white shadow-lg md:p-12 p-6 rounded-2xl md:min-w-[440px] w-full'>
          <h1 className='font-bold text-2xl text-gray-800'>
            Create Your Account
          </h1>
          <form className='flex flex-col gap-4' onSubmit={handleRegister}>
            {/* Name Field */}
            <input
              placeholder='Enter Your Name'
              type='text'
              name='user-name'
              id='user-name'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.userName}
              onChange={(e) => {
                handleData('userName', e.target.value)
              }}
            />
            {/* Email Field */}
            <input
              placeholder='Enter Your Email'
              type='email'
              name='user-email'
              id='user-email'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.email}
              onChange={(e) => {
                handleData('email', e.target.value)
              }}
            />
            {/* Address Field */}
            <input
              placeholder='Enter Your Address'
              type='text'
              name='user-address'
              id='user-address'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.address}
              onChange={(e) => {
                handleData('address', e.target.value)
              }}
            />
            {/* Phone Number Field */}
            <input
              placeholder='Enter Your Phone Number'
              type='tel'
              name='user-phone'
              id='user-phone'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.phoneNumber}
              onChange={(e) => {
                handleData('phoneNumber', e.target.value)
              }}
            />
            {/* Password Field */}
            <input
              placeholder='Enter Your Password'
              type='password'
              name='user-password'
              id='user-password'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.password}
              onChange={(e) => handleData('password', e.target.value)}
            />
            {/* Register Button */}
            <button
              type='submit'
              className={`bg-[#F96176] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#FF728A] transition-colors duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? 'Registering....' : 'Register'}
            </button>
          </form>
          <div className='flex justify-between'>
            <Link href={`/login`}>
              <button className='font-semibold text-sm text-pink-600 hover:underline'>
                Already have an account? Login
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
