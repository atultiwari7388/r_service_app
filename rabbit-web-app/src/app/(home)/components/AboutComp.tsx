// import React from "react";
// import Image from "next/image";
// import { FaAward, FaCheckCircle, FaUsers } from "react-icons/fa"; // Importing icons

// const AboutSection = () => {
//   return (
//     <div className="py-5">
//       <div className="container mx-auto px-4">
//         <div className="flex flex-col lg:flex-row gap-5">
//           {/* Image Section */}
//           <div
//             className="lg:w-1/3 pt-4 relative"
//             style={{ minHeight: "450px" }} // Increased the height
//           >
//             <Image
//               className="absolute top-0 left-0 w-full h-full object-cover"
//               src="/about-img.jpg"
//               alt="About"
//               layout="intrinsic"
//               width={450}
//               height={450}
//               objectFit="cover"
//             />

//             <div
//               className="absolute top-0 right-0 mt-n4 mr-n4 py-4 px-5"
//               style={{ background: "rgba(0, 0, 0, .08)" }}
//             >
//               <h1 className="text-white text-4xl mb-0">
//                 15 <span className="text-xl">Years</span>
//               </h1>
//               <h4 className="text-white">Experience</h4>
//             </div>
//           </div>

//           <div className="lg:w-2/3 mt-6">
//             {" "}
//             {/* Added margin-top for spacing */}
//             <h6 className="text-[#F96176] text-2xl text-uppercase font-bold text-center">
//               About Us
//             </h6>
//             {/* <h1 className="mb-4 text-3xl">
//               <span className="text-[#F96176] font-bold">
//                 Rabbit Mechanic Service
//               </span>{" "}
//               Is The Best Place For Your Auto Care
//             </h1> */}
//             <p className="mb-4 text-lg">
//               DOT (Department of Transportation) compliance is not just a legal
//               requirement — it’s your shield against costly fines, breakdowns,
//               and delays. With Rabbit Mechanic’s automatic maintenance alerts,
//               you can stay fully compliant, effortlessly. Whether you&apos;re an
//               independent trucker or manage a fleet of 500, keeping your trucks
//               road-ready is critical. Thankfully, there are smart apps that can
//               help track maintenance, alert you about services, and even find
//               roadside help. If you&apos;re looking for simple, smart and
//               affordable truck maintenance – especially with roadside mechanic
//               finder, Rabbit Mechanic is your top choice in 2025. 1. Track every
//               penny spent on parts and labor. Download maintenance reports and
//               plan your budget. 2. Find on-road truck mechanics across USA,
//               Canada & Mexico– like booking an Uber! 3. Easily assign trucks to
//               drivers and track who drove what vehicle and when. Great for fleet
//               owners.
//             </p>
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-3 pb-3">
//               {/* Point 1: Professional & Expert */}
//               <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
//                 <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
//                   <FaCheckCircle className="text-[#F96176] " />
//                 </div>
//                 <h6 className="text-xl font-semibold text-black text-center mt-4">
//                   Professional & Expert
//                 </h6>
//                 <p className="text-gray-600 text-center mt-2">
//                   Find Roadside Assistance for Semi Trucks Anywhere in USA &
//                   Canada
//                 </p>
//               </div>

//               {/* Point 2: Quality Assurance */}
//               <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
//                 <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
//                   <FaAward className="text-[#F96176] " />
//                 </div>
//                 <h6 className="text-xl font-semibold text-black text-center mt-4">
//                   Quality Assurance
//                 </h6>
//                 <p className="text-gray-600 text-center mt-2">
//                   Paperwork is Over – Rabbit Mechanic App Saves You Hours Each
//                   Month. Keep a complete service history for each truck and
//                   trailer. No more paperwork or lost records.
//                 </p>
//               </div>

//               {/* Point 3: Award-Winning Workers */}
//               <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
//                 <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
//                   <FaUsers className="text-[#F96176]" />
//                 </div>
//                 <h6 className="text-xl font-semibold text-black text-center mt-4">
//                   Award-Winning Workers
//                 </h6>
//                 <p className="text-gray-600 text-center mt-2">
//                   Join our nationwide network of trusted roadside mechanics and
//                   grow your business with on-demand service requests. register
//                   as truck mechanic, mechanic app for roadside service, truck
//                   technician lead generator.
//                 </p>
//               </div>
//             </div>
//             <div className="flex justify-center">
//               <a
//                 href="#"
//                 className="bg-[#F96176] text-white py-3 px-5 inline-block mt-4 hover:bg-opacity-80 rounded transition-all duration-300"
//               >
//                 Read More
//                 <i className="fa fa-arrow-right ml-3"></i>
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AboutSection;

"use client";

import React from "react";
import Image from "next/image";
import {
  FaAward,
  FaCheckCircle,
  FaUsers,
  FaTools,
  FaTruck,
  FaChartLine,
} from "react-icons/fa";
import { motion } from "framer-motion";

const AboutSection = () => {
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

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center"
        >
          {/* Image Section with Floating Badge */}
          <motion.div
            variants={fadeIn}
            className="lg:w-1/2 relative rounded-xl overflow-hidden shadow-2xl"
            style={{ minHeight: "500px" }}
          >
            <Image
              className="absolute inset-0 w-full h-full object-cover"
              src="/about-img.jpg"
              alt="Mechanic working on truck"
              layout="fill"
              quality={100}
              priority
            />

            {/* Experience Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-5 -right-5 bg-[#F96176] text-white p-6 rounded-full shadow-xl"
              style={{ width: "120px", height: "120px" }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-3xl font-bold">15</span>
                <span className="text-sm">Years</span>
                <span className="text-xs mt-1">Experience</span>
              </div>
            </motion.div>

            {/* Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <div className="flex justify-between text-white">
                <div className="text-center">
                  <FaTruck className="mx-auto text-2xl mb-2" />
                  <span className="block text-xl font-bold">500+</span>
                  <span className="text-sm">Fleets Served</span>
                </div>
                <div className="text-center">
                  <FaTools className="mx-auto text-2xl mb-2" />
                  <span className="block text-xl font-bold">1000+</span>
                  <span className="text-sm">Mechanics</span>
                </div>
                <div className="text-center">
                  <FaChartLine className="mx-auto text-2xl mb-2" />
                  <span className="block text-xl font-bold">99%</span>
                  <span className="text-sm">Satisfaction</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Section */}
          <motion.div variants={fadeIn} className="lg:w-1/2">
            {/* Section Header */}
            <motion.div variants={fadeIn}>
              <span className="text-[#F96176] font-semibold text-lg tracking-wider">
                ABOUT US
              </span>
              <h2 className="text-4xl font-bold mt-2 mb-6 text-gray-800">
                Revolutionizing{" "}
                <span className="text-[#F96176]">Truck Maintenance</span> Across
                North America
              </h2>
            </motion.div>

            {/* Main Content */}
            <motion.p
              variants={fadeIn}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              DOT (Department of Transportation) compliance is not just a legal
              requirement — it&apos;s your shield against costly fines,
              breakdowns, and delays. With Rabbit Mechanic&apos;s automatic
              maintenance alerts, you can stay fully compliant, effortlessly.
            </motion.p>

            <motion.div variants={fadeIn} className="mb-8">
              <div className="flex items-start mb-4">
                <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
                  <FaCheckCircle className="text-[#F96176] text-xl" />
                </div>
                <p className="text-gray-600 flex-1">
                  Whether you&apos;re an independent trucker or manage a fleet
                  of 500, keeping your trucks road-ready is critical.
                  Thankfully, there are smart apps that can help track
                  maintenance, alert you about services, and even find roadside
                  help.
                </p>
              </div>
              <div className="flex items-start">
                <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
                  <FaCheckCircle className="text-[#F96176] text-xl" />
                </div>
                <p className="text-gray-600 flex-1">
                  If you&apos;re looking for simple, smart and affordable truck
                  maintenance – especially with roadside mechanic finder, Rabbit
                  Mechanic is your top choice in 2025.
                </p>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {/* Feature 1 */}
              <motion.div
                variants={fadeIn}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
              >
                <div className="text-[#F96176] text-3xl mb-4">
                  <FaCheckCircle />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Professional & Expert
                </h3>
                <p className="text-gray-600">
                  Find Roadside Assistance for Semi Trucks Anywhere in USA &
                  Canada
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={fadeIn}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
              >
                <div className="text-[#F96176] text-3xl mb-4">
                  <FaAward />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Quality Assurance
                </h3>
                <p className="text-gray-600">
                  Paperwork is Over – Rabbit Mechanic App Saves You Hours Each
                  Month.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={fadeIn}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
              >
                <div className="text-[#F96176] text-3xl mb-4">
                  <FaUsers />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Award-Winning
                </h3>
                <p className="text-gray-600">
                  Join our nationwide network of trusted roadside mechanics.
                </p>
              </motion.div>
            </motion.div>

            {/* CTA Button */}
            {/* <motion.div variants={fadeIn} className="text-center lg:text-left">
              <button className="bg-[#F96176] hover:bg-[#e0556a] text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                Discover More Features
                <span className="ml-2">→</span>
              </button>
            </motion.div>
          */}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
