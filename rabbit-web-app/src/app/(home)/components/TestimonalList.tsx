// "use client";

// import React from "react";
// import { motion } from "framer-motion";
// import { FaQuoteLeft, FaStar } from "react-icons/fa";
// import Image from "next/image";

// const testimonialsData = [
//   {
//     name: "Jack T.",
//     role: "Fleet Owner, Texas",
//     message:
//       "Saved me thousands in emergency repairs! I manage a fleet of 12 trucks, and Rabbit Mechanic has completely changed the way we handle maintenance. The alerts are accurate, and now we never miss a service. My team loves it!",
//     rating: 5,
//     avatar: "/jack-t.png",
//   },
//   {
//     name: "Carlos M.",
//     role: "Owner-Operator, California",
//     message:
//       "Feels like a personal assistant for my truck. I used to forget oil changes or filter replacements. Now the app reminds me in time. No more guesswork. 10/10!",
//     rating: 5,
//     avatar: "/carlos.png",
//   },
//   {
//     name: "Maria L.",
//     role: "Dispatcher, Florida",
//     message:
//       "Affordable and super easy to use. We track 7 trucks and Rabbit Mechanic is so simple, even our drivers who aren't tech-savvy use it daily.",
//     rating: 4,
//     avatar: "/maria.png",
//   },
//   {
//     name: "Chris D.",
//     role: "Roadside Technician, Illinois",
//     message:
//       "Mechanic side is brilliant! As a mobile diesel mechanic, this app brought me regular clients without spending a penny on ads. Best thing I did for my business.",
//     rating: 5,
//     avatar: "/chris.png",
//   },
//   {
//     name: "Thomas R.",
//     role: "Owner-Operator",
//     message:
//       "Everything I need is right there — service logs, cost tracking, and alerts. I've stopped using notebooks and spreadsheets.",
//     rating: 5,
//     avatar: "/thomas.png",
//   },
// ];

// const TestimonialsList = () => {
//   const fadeIn = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.6 },
//     },
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
//     <section className="py-16 bg-gradient-to-b from-white to-gray-50">
//       <div className="container mx-auto px-6">
//         <motion.div
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//           variants={staggerContainer}
//           className="text-center mb-16"
//         >
//           <motion.h2
//             variants={fadeIn}
//             className="text-4xl font-bold text-gray-800 mb-4"
//           >
//             <span className="text-[#F96176]">Real People,</span> Real Results
//           </motion.h2>
//           <motion.p
//             variants={fadeIn}
//             className="text-xl text-gray-600 max-w-3xl mx-auto"
//           >
//             Hear from truckers, fleet managers, and mechanics who use Rabbit
//             Mechanic daily
//           </motion.p>
//         </motion.div>

//         <motion.div
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//           variants={staggerContainer}
//           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
//         >
//           {testimonialsData.map((testimonial, index) => (
//             <motion.div
//               key={index}
//               variants={fadeIn}
//               whileHover={{ y: -10 }}
//               className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
//             >
//               <div className="p-8">
//                 <div className="flex items-center mb-6">
//                   <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
//                     <Image
//                       src={testimonial.avatar}
//                       alt={testimonial.name}
//                       layout="fill"
//                       objectFit="cover"
//                       className="absolute inset-0"
//                     />
//                   </div>
//                   <div>
//                     <h4 className="text-lg font-semibold text-gray-800">
//                       {testimonial.name}
//                     </h4>
//                     <p className="text-gray-500">{testimonial.role}</p>
//                   </div>
//                 </div>

//                 <div className="relative mb-6">
//                   <FaQuoteLeft className="text-[#F96176] text-2xl opacity-20 absolute -top-2 -left-2" />
//                   <p className="text-gray-600 italic relative z-10 pl-6">
//                     &quot;{testimonial.message}&quot;
//                   </p>
//                 </div>

//                 <div className="flex items-center">
//                   {[...Array(5)].map((_, i) => (
//                     <FaStar
//                       key={i}
//                       className={`text-lg ${
//                         i < testimonial.rating
//                           ? "text-yellow-400"
//                           : "text-gray-300"
//                       }`}
//                     />
//                   ))}
//                   <span className="ml-2 text-gray-600">
//                     {testimonial.rating}/5
//                   </span>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>

//         {/* Trust Badge */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           whileInView={{ opacity: 1, scale: 1 }}
//           viewport={{ once: true }}
//           transition={{ delay: 0.4 }}
//           className="mt-16 text-center"
//         >
//           <div className="inline-block bg-white rounded-full px-6 py-3 shadow-md">
//             <p className="text-gray-600 font-medium">
//               Trusted by <span className="text-[#F96176] font-bold">500+</span>{" "}
//               fleets across North America
//             </p>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };

// export default TestimonialsList;

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaQuoteLeft,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Image from "next/image";

const testimonialsData = [
  {
    name: "Jack T.",
    role: "Fleet Owner, Texas",
    message:
      "Saved me thousands in emergency repairs! I manage a fleet of 12 trucks, and Rabbit Mechanic has completely changed the way we handle maintenance. The alerts are accurate, and now we never miss a service. My team loves it!",
    rating: 5,
    avatar: "/jack-t.png",
  },
  {
    name: "Carlos M.",
    role: "Owner-Operator, California",
    message:
      "Feels like a personal assistant for my truck. I used to forget oil changes or filter replacements. Now the app reminds me in time. No more guesswork. 10/10!",
    rating: 5,
    avatar: "/thomas.png",
  },
  {
    name: "Maria L.",
    role: "Dispatcher, Florida",
    message:
      "Affordable and super easy to use. We track 7 trucks and Rabbit Mechanic is so simple, even our drivers who aren't tech-savvy use it daily.",
    rating: 4,
    avatar: "/maria.png",
  },
  // {
  //   name: "Chris D.",
  //   role: "Roadside Technician, Illinois",
  //   message:
  //     "Mechanic side is brilliant! As a mobile diesel mechanic, this app brought me regular clients without spending a penny on ads. Best thing I did for my business.",
  //   rating: 5,
  //   avatar: "/chris.png",
  // },
  // {
  //   name: "Thomas R.",
  //   role: "Owner-Operator",
  //   message:
  //     "Everything I need is right there — service logs, cost tracking, and alerts. I've stopped using notebooks and spreadsheets.",
  //   rating: 5,
  //   avatar: "/thomas.png",
  // },
];

const TestimonialsList = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
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

  const nextTestimonials = () => {
    setCurrentIndex((prevIndex) => {
      // If we're at the end, loop back to the start
      if (prevIndex + itemsPerPage >= testimonialsData.length) {
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const prevTestimonials = () => {
    setCurrentIndex((prevIndex) => {
      // If we're at the start, loop to the end
      if (prevIndex === 0) {
        return testimonialsData.length - itemsPerPage;
      }
      return prevIndex - 1;
    });
  };

  const getVisibleTestimonials = () => {
    const endIndex = currentIndex + itemsPerPage;

    // If we're near the end, get the remaining testimonials
    if (endIndex > testimonialsData.length) {
      const remaining = testimonialsData.slice(currentIndex);
      const needed = itemsPerPage - remaining.length;
      return [...remaining, ...testimonialsData.slice(0, needed)];
    }

    return testimonialsData.slice(currentIndex, endIndex);
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
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
            <span className="text-[#F96176]">Real People,</span> Real Results
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Hear from truckers, fleet managers, and mechanics who use Rabbit
            Mechanic daily
          </motion.p>
        </motion.div>

        <div className="relative">
          <button
            onClick={prevTestimonials}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Previous testimonials"
          >
            <FaChevronLeft className="text-[#F96176]" />
          </button>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto max-w-6xl"
          >
            {visibleTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.name}-${index}`}
                variants={fadeIn}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center mb-6">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={64}
                        height={64}
                        className="absolute inset-0 object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="relative mb-6 flex-grow">
                    <FaQuoteLeft className="text-[#F96176] text-2xl opacity-20 absolute -top-2 -left-2" />
                    <p className="text-gray-600 italic relative z-10 pl-6">
                      &quot;{testimonial.message}&quot;
                    </p>
                  </div>

                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-lg ${
                          i < testimonial.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600">
                      {testimonial.rating}/5
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <button
            onClick={nextTestimonials}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Next testimonials"
          >
            <FaChevronRight className="text-[#F96176]" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({
            length: Math.ceil(testimonialsData.length / itemsPerPage),
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * itemsPerPage)}
              className={`w-3 h-3 rounded-full ${
                currentIndex === index * itemsPerPage
                  ? "bg-[#F96176]"
                  : "bg-gray-300"
              }`}
              aria-label={`Go to testimonial set ${index + 1}`}
            />
          ))}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-white rounded-full px-6 py-3 shadow-md">
            <p className="text-gray-600 font-medium">
              Trusted by <span className="text-[#F96176] font-bold">500+</span>{" "}
              fleet owners.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsList;
