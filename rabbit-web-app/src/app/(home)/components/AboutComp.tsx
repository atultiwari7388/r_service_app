// "use client";

// import React from "react";
// import Image from "next/image";
// import {
//   FaAward,
//   FaCheckCircle,
//   FaUsers,
//   FaTools,
//   FaTruck,
//   FaChartLine,
// } from "react-icons/fa";
// import { motion } from "framer-motion";

// const AboutSection = () => {
//   const fadeIn = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
//   };

//   const staggerContainer = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.2,
//       },
//     },
//   };

//   return (
//     <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//       <div className="container mx-auto px-4">
//         <motion.div
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//           variants={staggerContainer}
//           className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center"
//         >
//           {/* Image Section with Floating Badge */}
//           <motion.div
//             variants={fadeIn}
//             className="lg:w-1/2 relative rounded-xl overflow-hidden shadow-2xl min-h-[800px] lg:min-h-[800px] md:min-h-[400px] sm:min-h-[400px]"
//           >
//             <Image
//               className="absolute inset-0 w-full h-full object-cover"
//               src="/about-new.jpg"
//               alt="Mechanic working on truck"
//               fill
//               quality={100}
//               priority
//             />

//             {/* Experience Badge */}
//             <motion.div
//               initial={{ scale: 0 }}
//               whileInView={{ scale: 1 }}
//               viewport={{ once: true }}
//               transition={{ delay: 0.4, type: "spring" }}
//               className="absolute -top-5 -right-5 bg-[#F96176] text-white p-6 rounded-full shadow-xl"
//               style={{ width: "120px", height: "120px" }}
//             >
//               <div className="flex flex-col items-center justify-center h-full">
//                 <span className="text-3xl font-bold">15</span>
//                 <span className="text-sm">Years</span>
//                 <span className="text-xs mt-1">Experience</span>
//               </div>
//             </motion.div>

//             {/* Stats Overlay */}
//             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
//               <div className="flex justify-between text-white">
//                 <div className="text-center">
//                   <FaTruck className="mx-auto text-2xl mb-2" />
//                   <span className="block text-xl font-bold">500+</span>
//                   <span className="text-sm">Fleets Served</span>
//                 </div>
//                 <div className="text-center">
//                   <FaTools className="mx-auto text-2xl mb-2" />
//                   <span className="block text-xl font-bold">1000+</span>
//                   <span className="text-sm">Mechanics</span>
//                 </div>
//                 <div className="text-center">
//                   <FaChartLine className="mx-auto text-2xl mb-2" />
//                   <span className="block text-xl font-bold">99%</span>
//                   <span className="text-sm">Satisfaction</span>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//           {/* Content Section */}
//           <motion.div variants={fadeIn} className="lg:w-1/2">
//             {/* Section Header */}
//             <motion.div variants={fadeIn}>
//               <span className="text-[#F96176] font-semibold text-lg tracking-wider">
//                 ABOUT US
//               </span>
//               <h2 className="text-lg font-normal mt-2 mb-6 text-gray-600">
//                 <span className="text-[#F96176] font-bold">
//                   {" "}
//                   Rabbit Mechanic{" "}
//                 </span>
//                 was founded by logistics professionals and built with real
//                 truckers in mind. We understand the daily challenges of managing
//                 semi-truck and trailer maintenance, whether you&apos;re an
//                 independent owner-operator or managing a large fleet. Our
//                 mission is simple — eliminate the guesswork from truck
//                 maintenance so you can stay focused on the road, not the repair
//                 shop.
//               </h2>
//             </motion.div>

//             {/* Main Content */}
//             <motion.p
//               variants={fadeIn}
//               className="text-lg text-gray-600 mb-8 leading-relaxed"
//             >
//               DOT compliance isn’t just a requirement — it’s protection against
//               costly fines, unexpected breakdowns, and delivery delays. That’s
//               why Rabbit Mechanic is designed to help you stay ahead of every
//               service deadline with automatic maintenance alerts. From oil
//               changes to inspections, filter replacements to tire rotations —
//               we’ve got you covered. But we don’t stop there.
//             </motion.p>
//             <motion.div variants={fadeIn}>
//               <h1 className="text-2xl font-semibold text-gray-800 mb-6">
//                 Rabbit Mechanic helps you:
//               </h1>
//             </motion.div>
//             <motion.div variants={fadeIn} className="mb-8">
//               <div className="flex items-start mb-1">
//                 <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
//                   <FaCheckCircle className="text-[#F96176] text-xl" />
//                 </div>
//                 <p className="text-gray-600 flex-1">
//                   Track every dollar spent on parts and labor
//                 </p>
//               </div>
//               <div className="flex items-start">
//                 <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
//                   <FaCheckCircle className="text-[#F96176] text-xl" />
//                 </div>
//                 <p className="text-gray-600 flex-1">
//                   Generate downloadable maintenance reports for smarter
//                   budgeting
//                 </p>
//               </div>

//               <div className="flex items-start">
//                 <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
//                   <FaCheckCircle className="text-[#F96176] text-xl" />
//                 </div>
//                 <p className="text-gray-600 flex-1">
//                   Easily assign trucks to drivers and monitor usage
//                 </p>
//               </div>

//               <div className="flex items-start">
//                 <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
//                   <FaCheckCircle className="text-[#F96176] text-xl" />
//                 </div>
//                 <p className="text-gray-600 flex-1">
//                   Instantly locate roadside mechanics across the USA & Canada —
//                   just like booking an Uber!
//                 </p>
//               </div>

//               <motion.p
//                 variants={fadeIn}
//                 className="text-lg text-gray-600 mb-8 mt-8 leading-relaxed"
//               >
//                 In 2025, truck maintenance doesn’t have to be complicated.
//                 Rabbit Mechanic makes it simple, smart, and affordable. Join the
//                 movement toward stress-free, road-ready trucking.
//               </motion.p>
//             </motion.div>

//             {/* Features Grid */}
//             <motion.div
//               variants={staggerContainer}
//               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
//             >
//               {/* Feature 1 */}
//               <motion.div
//                 variants={fadeIn}
//                 className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
//               >
//                 <div className="text-[#F96176] text-3xl mb-4">
//                   <FaCheckCircle />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2 text-gray-800">
//                   Find with a click
//                 </h3>
//                 <p className="text-gray-600">
//                   Find Roadside Assistance for Semi Trucks Anywhere in USA &
//                   Canada
//                 </p>
//               </motion.div>

//               {/* Feature 2 */}
//               <motion.div
//                 variants={fadeIn}
//                 className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
//               >
//                 <div className="text-[#F96176] text-3xl mb-4">
//                   <FaAward />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2 text-gray-800">
//                   Save Time
//                 </h3>
//                 <p className="text-gray-600">
//                   Paperwork is Over – Rabbit Mechanic App Saves You Hours Each
//                   Month.
//                 </p>
//               </motion.div>

//               {/* Feature 3 */}
//               <motion.div
//                 variants={fadeIn}
//                 className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
//               >
//                 <div className="text-[#F96176] text-3xl mb-4">
//                   <FaUsers />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2 text-gray-800">
//                   Stay DOT Compliant
//                 </h3>
//                 <p className="text-gray-600">
//                   Keep your truck road-ready with automatic service reminders
//                   and hassle-free maintenance tracking.
//                 </p>
//               </motion.div>
//             </motion.div>

//             {/* CTA Button */}
//             {/* <motion.div variants={fadeIn} className="text-center lg:text-left">
//               <button className="bg-[#F96176] hover:bg-[#e0556a] text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
//                 Discover More Features
//                 <span className="ml-2">→</span>
//               </button>
//             </motion.div>
//           */}
//           </motion.div>
//         </motion.div>
//       </div>
//     </section>
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
          {/* Image Section with 800px min-height */}
          <motion.div
            variants={fadeIn}
            className="w-full lg:w-1/2 relative rounded-xl overflow-hidden shadow-2xl"
            style={{
              minHeight: "800px",
              height: "auto",
            }}
          >
            <Image
              src="/about-new.jpg"
              alt="Mechanic working on truck"
              fill
              quality={90}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              className="object-cover"
              style={{
                objectPosition: "center center",
              }}
            />

            {/* Experience Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-5 -right-5 bg-[#F96176] text-white p-6 rounded-full shadow-xl"
              style={{
                width: "120px",
                height: "120px",
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-3xl font-bold">Easy</span>
                <span className="text-sm">To</span>
                <span className="text-xs mt-1">Operate</span>
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
          <motion.div variants={fadeIn} className="w-full lg:w-1/2">
            <motion.div variants={fadeIn}>
              <span className="text-[#F96176] font-semibold text-lg tracking-wider">
                ABOUT US
              </span>
              <h2 className="text-lg font-normal mt-2 mb-6 text-gray-600">
                <span className="text-[#F96176] font-bold">
                  Rabbit Mechanic
                </span>{" "}
                was founded by logistics professionals and built with real
                truckers in mind. We understand the daily challenges of managing
                semi-truck and trailer maintenance.
              </h2>
            </motion.div>

            <motion.p
              variants={fadeIn}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              DOT compliance isn&apos;t just a requirement — it&apos;s
              protection against costly fines, unexpected breakdowns, and
              delivery delays. That&apos;s why Rabbit Mechanic is designed to
              help you stay ahead of every service deadline.
            </motion.p>

            <motion.div variants={fadeIn}>
              <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                Rabbit Mechanic helps you:
              </h1>
            </motion.div>

            <motion.div variants={fadeIn} className="mb-8">
              {[
                "Track every dollar spent on parts and labor",
                "Generate downloadable maintenance reports",
                "Easily assign trucks to drivers",
                "Instantly locate roadside mechanics across USA & Canada",
              ].map((item, index) => (
                <div key={index} className="flex items-start mb-3">
                  <div className="bg-[#F96176] bg-opacity-10 p-2 rounded-full mr-4">
                    <FaCheckCircle className="text-[#F96176] text-xl" />
                  </div>
                  <p className="text-gray-600 flex-1">{item}</p>
                </div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {[
                {
                  icon: <FaCheckCircle />,
                  title: "Find with a click",
                  text: "Roadside Assistance Anywhere in USA & Canada",
                },
                {
                  icon: <FaAward />,
                  title: "Save Time",
                  text: "Paperwork is Over – Save Hours Each Month",
                },
                {
                  icon: <FaUsers />,
                  title: "Stay DOT Compliant",
                  text: "Automatic service reminders and maintenance tracking",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#F96176]"
                >
                  <div className="text-[#F96176] text-3xl mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
