'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const kPrimary = '#F96176' // Define primary color

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [data, setData] = useState({
    email: '',
    password: '',
  })

  const handleData = (key, value) => {
    setData({
      ...data,
      [key]: value,
    })
  }

  const handleLogin = async (event) => {
    event.preventDefault() // Prevent default form submission
    setIsLoading(true)

    if (!data.email || !data.password) {
      // Basic validation
      toast.error('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      // Attempt to sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data?.email,
        data?.password
      )
      const user = userCredential.user

      // Check if the user's email is verified
      if (!user.emailVerified) {
        // If email is not verified, send a verification email
        await sendEmailVerification(user)
        toast.error(
          'Your email is not verified. A verification email has been sent.'
        )

        // Sign the user out to prevent unverified access
        await auth.signOut()
        setIsLoading(false)
        return
      }

      // If verified, log the user in
      toast.success('Logged in successfully')
      router.push('/dashboard') // Redirect to dashboard
    } catch (error) {
      toast.error(error?.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user])

  return (
    <main className='w-full flex justify-center items-center bg-gray-100 md:p-24 p-10 min-h-screen'>
      <section className='flex flex-col gap-4'>
        <div className='flex justify-center'>
          <img className='h-16' src='/logo.png' alt='Logo' />
        </div>
        <div className='flex flex-col gap-4 bg-white shadow-lg md:p-12 p-6 rounded-2xl md:min-w-[440px] w-full'>
          <h1 className='font-bold text-2xl text-gray-800'>Login With Email</h1>
          <form className='flex flex-col gap-4' onSubmit={handleLogin}>
            <input
              placeholder='Enter Your Email'
              type='email'
              name='user-email'
              id='user-email'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.email}
              onChange={(e) => handleData('email', e.target.value)} // Bind input to state
            />
            <input
              placeholder='Enter Your Password'
              type='password'
              name='user-password'
              id='user-password'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
              value={data.password}
              onChange={(e) => handleData('password', e.target.value)} // Bind input to state
            />
            <button
              type='submit'
              className={`bg-[#F96176] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#FF728A] transition-colors duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className='flex justify-between'>
            <Link href={`/register`}>
              <button className='font-semibold text-sm text-pink-600 hover:underline'>
                New? Create Account
              </button>
            </Link>
            <Link href={`/forgot`}>
              <button className='font-semibold text-sm text-pink-600 hover:underline'>
                Forget Password?
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
