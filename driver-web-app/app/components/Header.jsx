import Link from 'next/link'

export default function Header() {
  const menuList = [
    {
      name: 'Home',
      link: '/',
    },
    {
      name: 'About Us',
      link: '/about',
    },
    {
      name: 'Contact Us',
      link: '/contact',
    },
  ]

  return (
    <nav className='sticky top-0 z-50 bg-white bg-opacity-65 backdrop-blur-2xl py-3 px-4 md:py-4 md:px-16 border-b flex items-center justify-between'>
      <Link href={'/'}>
        <img className='h-12 md:h-5' src='/logo.png' alt='Logo' />
      </Link>
      <div className='hidden md:flex gap-2 items-center font-semibold'>
        {menuList?.map((item) => {
          return (
            <Link href={item?.link} key={item?.name}>
              <button className='text-sm px-4 py-2 rounded-lg hover:bg-gray-50'>
                {item?.name}
              </button>
            </Link>
          )
        })}
      </div>
      <Link href={'/login'}>
        <button
          className='px-4 py-1 rounded-full text-white'
          style={{ backgroundColor: '#F96176' }}
        >
          Login
        </button>
      </Link>
    </nav>
  )
}
