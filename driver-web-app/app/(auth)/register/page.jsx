'use client'

import Link from 'next/link'

const kPrimary = '#F96176'; // Define primary color

export default function Page() {
  return (
    <main className='w-full flex justify-center items-center bg-gray-100 md:p-24 p-10 min-h-screen'>
      <section className='flex flex-col gap-4'>
        <div className='flex justify-center'>
          <img className='h-16' src='/logo.png' alt='Logo' />
        </div>
        <div className='flex flex-col gap-4 bg-white shadow-lg md:p-12 p-6 rounded-2xl md:min-w-[440px] w-full'>
          <h1 className='font-bold text-2xl text-gray-800'>Create Your Account</h1>
          <form className='flex flex-col gap-4'>
            {/* Name Field */}
            <input
              placeholder='Enter Your Name'
              type='text'
              name='user-name'
              id='user-name'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
            />
            {/* Email Field */}
            <input
              placeholder='Enter Your Email'
              type='email'
              name='user-email'
              id='user-email'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
            />
            {/* Address Field */}
            <input
              placeholder='Enter Your Address'
              type='text'
              name='user-address'
              id='user-address'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
            />
            {/* Phone Number Field */}
            <input
              placeholder='Enter Your Phone Number'
              type='tel'
              name='user-phone'
              id='user-phone'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
            />
            {/* Password Field */}
            <input
              placeholder='Enter Your Password'
              type='password'
              name='user-password'
              id='user-password'
              className='px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full text-gray-700'
            />
            {/* Register Button */}
            <button
              type='submit'
              className='bg-[#F96176] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#FF728A] transition-colors duration-300'
            >
              Register
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
