import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className='w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-10 px-6'>
      <div className='max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12'>
        {/* Logo and Branding */}
        <div className='flex flex-col lg:flex-row items-start lg:items-center'>
          <img className='h-12 mr-4 mb-4 lg:mb-0' src='/logo.png' alt='Logo' />
        </div>

        {/* Contact Information */}
        <div className='flex flex-col md:flex-row md:items-center gap-6'>
          <div className='flex items-center space-x-3'>
            <Phone size={24} className='text-coral-300' />
            <a
              href='tel:+919569368066'
              className='hover:text-coral-100 transition text-sm font-medium'
            >
              +919569368066
            </a>
          </div>
          <div className='flex items-center space-x-3'>
            <Mail size={24} className='text-coral-300' />
            <a
              href='mailto:mylexinfotech@gmail.com'
              className='hover:text-coral-100 transition text-sm font-medium'
            >
              mylexinfotech@gmail.com
            </a>
          </div>
          <div className='flex items-center space-x-3'>
            <MapPin size={24} className='text-coral-300' />
            <span className='text-sm font-medium'>Chandigarh</span>
          </div>
        </div>

        {/* Social Media Links */}
        <div className='flex space-x-6 mt-6 lg:mt-0'>
          <a
            href='https://facebook.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-coral-300 transition transform hover:scale-110'
            aria-label='Facebook'
          >
            <Facebook size={28} />
          </a>
          <a
            href='https://twitter.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-coral-300 transition transform hover:scale-110'
            aria-label='Twitter'
          >
            <Twitter size={28} />
          </a>
          <a
            href='https://instagram.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-coral-300 transition transform hover:scale-110'
            aria-label='Instagram'
          >
            <Instagram size={28} />
          </a>
          <a
            href='https://linkedin.com'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-coral-300 transition transform hover:scale-110'
            aria-label='LinkedIn'
          >
            <Linkedin size={28} />
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className='mt-12 border-t border-gray-400'></div>

      {/* Copyright */}
      <div className='mt-6 text-center'>
        <p className='text-sm'>
          © 2024 All rights reserved by{' '}
          <span className='font-semibold'>Mylex Infotech</span>
        </p>
      </div>
    </footer>
  )
}
