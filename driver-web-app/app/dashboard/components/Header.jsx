'use client'

import Link from 'next/link'

export default function Header() {
  const menuList = [
    {
      name: 'Home',
      link: '/',
    },
    {
      name: 'My Jobs',
      link: '/my-jobs',
    },
    {
      name: 'History',
      link: '/history',
    },
  ]

  return (
    <nav className='sticky top-0 z-50 bg-white bg-opacity-65 backdrop-blur-2xl py-3 px-4 md:py-4 md:px-16 border-b flex items-center justify-between'>
      <Link href={'/'}>
        <img className='h-12 md:h-5' src='/logo.png' alt='Logo' />
      </Link>
      <div className='hidden md:flex gap-2 items-center font-semibold'>
        {/* {menuList?.map((item) => {
          return (
            <Link href={item?.link} key={item?.name}>
              <button className='text-sm px-4 py-2 rounded-lg hover:bg-gray-50'>
                {item?.name}
              </button>
            </Link>
          )
        })} */}
        {/* Profile Icon */}
        <Link href='/profile'>
          <button className='flex items-center text-sm px-4 py-2 rounded-lg hover:bg-gray-50'>
            <span className='lucida-icon lucida-icon-user mr-1'></span>
            Profile
          </button>
        </Link>
        {/* Logout Icon */}
        <Link href='/logout'>
          <button className='flex items-center text-sm px-4 py-2 rounded-lg hover:bg-gray-50'>
            <span className='lucida-icon lucida-icon-logout mr-1'></span>
            Logout
          </button>
        </Link>
      </div>
    </nav>
  )
}
