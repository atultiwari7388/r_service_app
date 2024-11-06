import React from "react";
import { FaCertificate, FaUsersCog, FaTools } from "react-icons/fa";

const ServiceComponent = () => {
  return (
    <div className="py-16 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex justify-between space-x-6">
          {/* Service Item 1 */}
          <div className="flex items-center space-x-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105 w-full sm:w-1/3">
            <FaCertificate className="text-[#F96176] text-5xl" />
            <div>
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
          <div className="flex items-center space-x-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105 w-full sm:w-1/3">
            <FaUsersCog className="text-[#F96176] text-5xl" />
            <div>
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
          <div className="flex items-center space-x-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105 w-full sm:w-1/3">
            <FaTools className="text-[#F96176] text-5xl" />
            <div>
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
