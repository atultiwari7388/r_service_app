'use client'
import { useState } from 'react'

export default function FindMechanicForm({
  allServices,
  filteredServices,
  filteredvehicles,
  setQuery,
}) {
  const [selectedService, setSelectedService] = useState('')
  const [selectedVehicle, setselectedVehicle] = useState('')

  return (
    <div className='bg-white p-8 rounded-2xl shadow-lg'>
      <h2 className='text-2xl font-bold mb-4 text-gray-800'>
        Find Your Mechanic
      </h2>
      <div className='mb-6'>
        <label className='block text-gray-700 text-sm font-semibold mb-2'>
          Select your Vehicle
        </label>

        <div className='flex'>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className='w-full px-3 py-2 border rounded-lg focus:outline-none mb-4'
          >
            <option value='' disabled>
              Select Vehicle
            </option>
            {filteredvehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.companyName}>
                {vehicle.companyName}
              </option>
            ))}
          </select>

          <button className='ml-1 bg-red-500 text-white h-[42px] px-3 rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center'>
            +
          </button>
        </div>
      </div>

      <div className='mb-6'>
        <label className='block text-gray-700 text-sm font-semibold mb-2'>
          Select Service
        </label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className='w-full px-3 py-2 border rounded-lg focus:outline-none mb-4'
        >
          <option value='' disabled>
            Select Service
          </option>
          {filteredServices.map((service, index) => (
            <option key={index} value={service.title}>
              {service.title}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-6'>
        <label className='block text-gray-700 text-sm font-semibold mb-2'>
          Select your Location
        </label>
        <input
          type='text'
          placeholder='Search for a service'
          onChange={(e) => setQuery(e.target.value)}
          className='w-full px-3 py-2 border rounded-lg focus:outline-none mb-4'
        />
      </div>

      <button className='w-full bg-[#F96176] text-white py-3 rounded-full shadow-md hover:bg-[#e64b5f] transition duration-200'>
        Find Mechanic
      </button>
    </div>
  )
}
