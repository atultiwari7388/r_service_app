// import React from "react";
// import { FaCertificate, FaUsersCog, FaTools } from "react-icons/fa";

// const ServiceComponent = () => {
//   return (
//     <div className="py-16 bg-gray-100">
//       <div className="container mx-auto px-6">
//         {/* Use grid to display items step-by-step in mobile and multiple columns in desktop */}
//         <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Service Item 1 */}
//           <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
//             <FaCertificate className="text-[#F96176] text-5xl" />
//             <div className="text-center">
//               <h5 className="text-2xl font-semibold text-gray-800">
//                 Quality Servicing
//               </h5>
//               <p className="text-gray-500 mt-2">
//                 Diam dolor diam ipsum sit amet diam et eos erat ipsum
//               </p>
//               <a
//                 className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
//                 href="#"
//               >
//                 Read More
//               </a>
//             </div>
//           </div>

//           {/* Service Item 2 */}
//           <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
//             <FaUsersCog className="text-[#F96176] text-5xl" />
//             <div className="text-center">
//               <h5 className="text-2xl font-semibold text-gray-800">
//                 Expert Workers
//               </h5>
//               <p className="text-gray-500 mt-2">
//                 Diam dolor diam ipsum sit amet diam et eos erat ipsum
//               </p>
//               <a
//                 className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
//                 href="#"
//               >
//                 Read More
//               </a>
//             </div>
//           </div>

//           {/* Service Item 3 */}
//           <div className="flex flex-col items-center space-y-6 bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transform transition duration-300 ease-in-out hover:scale-105">
//             <FaTools className="text-[#F96176] text-5xl" />
//             <div className="text-center">
//               <h5 className="text-2xl font-semibold text-gray-800">
//                 Modern Equipment
//               </h5>
//               <p className="text-gray-500 mt-2">
//                 Diam dolor diam ipsum sit amet diam et eos erat ipsum
//               </p>
//               <a
//                 className="text-[#F96176] border-b-2 border-transparent hover:border-[#F96176] transition-colors mt-4 inline-block"
//                 href="#"
//               >
//                 Read More
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceComponent;

"use client";

import React from "react";
import {
  FaTools,
  FaTruck,
  FaUserCog,
  FaBell,
  FaMapMarkerAlt,
  FaChartLine,
} from "react-icons/fa";
import { motion } from "framer-motion";

const ServiceComponent = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const services = [
    {
      icon: <FaTools className="text-4xl" />,
      title: "Comprehensive Maintenance",
      description:
        "Track truck service, get maintenance alerts & find roadside help across America & Canada with Rabbit Mechanic – the smart app for truckers & owners.",
      color: "bg-[#F96176]",
    },
    {
      icon: <FaTruck className="text-4xl" />,
      title: "Fleet Management",
      description:
        "Manage truck repairs, drivers & road service all in one app. Rabbit Mechanic makes truck maintenance easy for owners & mechanics.",
      color: "bg-[#58BB87]",
    },
    {
      icon: <FaUserCog className="text-4xl" />,
      title: "All-In-One Solution",
      description:
        "Your complete truck maintenance app – designed for semi trucks and trailers, helping fleet owners, truck drivers, and roadside mechanics stay ahead of every service.",
      color: "bg-[#F96176]",
    },
    {
      icon: <FaBell className="text-4xl" />,
      title: "Smart Alerts",
      description:
        "Never miss maintenance deadlines with automated DOT compliance alerts and service reminders tailored to your vehicles.",
      color: "bg-[#F59E0B]",
    },
    {
      icon: <FaMapMarkerAlt className="text-4xl" />,
      title: "Roadside Assistance",
      description:
        "Find trusted mechanics anywhere in America & Canada with our on-demand service locator and real-time availability tracking.",
      color: "bg-[#8B5CF6]",
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: "Performance Analytics",
      description:
        "Monitor your fleet's health with detailed reports on maintenance costs, downtime, and service history across all vehicles.",
      color: "bg-[#EC4899]",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeIn}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            <span className="text-[#F96176]">A New Era </span>
            of Smart Trucking.
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Everything you need to keep your fleet moving efficiently across
            America, Canada & Mexico
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ y: -10 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className={`${service.color} h-2`}></div>
              <div className="p-8 text-center">
                <div
                  className={`${service.color} text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  {service.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                {/* <a
                  href="#"
                  className={`text-${service.color.replace(
                    "bg-",
                    ""
                  )} font-medium hover:underline`}
                >
                  Learn more →
                </a>
               */}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceComponent;
