import React from "react";
import { FaCertificate, FaUsersCog, FaTools } from "react-icons/fa";

const ServiceComponent = () => {
  return (
    <div className="py-16 bg-gray-100">
      <div className="container mx-auto px-6">
        {/* Use grid to display items step-by-step in mobile and multiple columns in desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-6">
          {/* Service Item 1 */}
          <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <FaCertificate className="text-[#F96176] text-5xl" />
            <div className="text-center">
              <h5 className="text-2xl font-semibold text-gray-800">
                Quality Servicing
              </h5>
              <p className="text-gray-500 mt-2">
                Diam dolor diam ipsum sit amet diam et eos erat ipsum
              </p>
              <a
                className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
                href="#"
              >
                Read More
              </a>
            </div>
          </div>

          {/* Service Item 2 */}
          <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <FaUsersCog className="text-[#F96176] text-5xl" />
            <div className="text-center">
              <h5 className="text-2xl font-semibold text-gray-800">
                Expert Workers
              </h5>
              <p className="text-gray-500 mt-2">
                Diam dolor diam ipsum sit amet diam et eos erat ipsum
              </p>
              <a
                className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
                href="#"
              >
                Read More
              </a>
            </div>
          </div>

          {/* Service Item 3 */}
          <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
            <FaTools className="text-[#F96176] text-5xl" />
            <div className="text-center">
              <h5 className="text-2xl font-semibold text-gray-800">
                Modern Equipment
              </h5>
              <p className="text-gray-500 mt-2">
                Diam dolor diam ipsum sit amet diam et eos erat ipsum
              </p>
              <a
                className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
                href="#"
              >
                Read More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceComponent;
