export default function OurServicesComponent() {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg'>
      <h2 className='text-2xl font-bold mb-4 text-gray-800'>Our Services</h2>
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-6'>
        {[
          { name: 'Tires', icon: '/tire.png' },
          { name: 'Air Leak', icon: '/air_leak.png' },
          { name: 'Battery', icon: '/battery_truck.png' },
          { name: 'Engine Sign', icon: '/engine_2.png' },
          { name: 'Electrical', icon: '/electrical.png' },
          { name: 'Towing', icon: '/towing_truck.png' },
        ].map((service) => (
          <div
            key={service.name}
            className='bg-green-200 p-4 rounded-xl text-center shadow-md transition-transform transform hover:scale-105 hover:bg-green-300'
          >
            <img
              src={service.icon}
              alt={service.name}
              className='w-16 h-16 mx-auto mb-2'
            />
            <p className='text-md font-semibold text-gray-800'>
              {service.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
