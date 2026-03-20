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
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white lg:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex flex-col items-center gap-6 lg:flex-row lg:gap-8"
        >
          {/* Image Section */}
          <motion.div
            variants={fadeIn}
            className="relative w-full overflow-hidden rounded-xl bg-white shadow-2xl lg:w-1/2 h-[420px] sm:h-[500px] lg:h-[620px]"
          >
            <Image
              src="/about_us_20.png"
              alt="Mechanic working on truck"
              fill
              quality={100}
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
              className="absolute -right-3 -top-3 rounded-full bg-[#F96176] p-5 text-white shadow-xl lg:-right-4 lg:-top-4"
              style={{
                width: "108px",
                height: "108px",
              }}
            >
              <div className="flex flex-col items-center justify-center h-full leading-tight space-y-0">
                <span className="mt-1 text-xl font-bold">Easy</span>
                <span className="text-xl font-bold">To</span>
                <span className="text-xl font-bold">Use</span>
              </div>
            </motion.div>

            {/* Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 lg:p-5">
              <div className="flex justify-between text-white">
                <div className="text-center">
                  <FaTruck className="mx-auto mb-2 text-xl lg:text-2xl" />
                  <span className="block text-lg font-bold lg:text-xl">
                    500+
                  </span>
                  <span className="text-sm">Fleets Served</span>
                </div>
                <div className="text-center">
                  <FaTools className="mx-auto mb-2 text-xl lg:text-2xl" />
                  <span className="block text-lg font-bold lg:text-xl">
                    1000+
                  </span>
                  <span className="text-sm">Mechanics</span>
                </div>
                <div className="text-center">
                  <FaChartLine className="mx-auto mb-2 text-xl lg:text-2xl" />
                  <span className="block text-lg font-bold lg:text-xl">
                    99%
                  </span>
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
              <h2 className="mt-2 mb-4 text-lg font-normal text-gray-600">
                <span className="text-[#F96176] font-bold">TrenoOps</span> — The
                Operating System for Modern Trucking Operations
              </h2>
            </motion.div>

            <motion.p
              variants={fadeIn}
              className="mb-5 text-base leading-relaxed text-gray-600 lg:text-lg"
            >
              “TrenoOps was founded by logistics professionals and built with
              real truckers in mind. It is an all- in-one platform designed
              specifically for Semi Trucks and Trailers to simplify fleet
              operations and keep trucks running efficiently.”
            </motion.p>

            <motion.p
              variants={fadeIn}
              className="mb-5 text-base leading-relaxed text-gray-600 lg:text-lg"
            >
              “With TrenoOps, fleet owners, dispatchers, and owner-operators can
              manage dispatch operations, track vehicle maintenance, monitor
              compliance, and connect with nearby mechanics — all from one
              easy-to-use system. The platform includes a centralized dispatch
              board to create loads, assign drivers and trucks, and track trips
              in real time.”
            </motion.p>

            <motion.p
              variants={fadeIn}
              className="mb-5 text-base leading-relaxed text-gray-600 lg:text-lg"
            >
              “TrenoOps also features an intelligent Automatic Service Alert
              System that helps fleets stay on top of maintenance such as oil
              changes, filter replacements, tire service, inspections, and DOT
              compliance requirements.”
            </motion.p>

            <motion.p
              variants={fadeIn}
              className="mb-6 text-base leading-relaxed text-gray-600 lg:text-lg"
            >
              “By combining dispatch management, maintenance tracking, and
              mechanic access into one platform, TrenoOps helps trucking
              businesses reduce downtime, stay organized, and keep their fleet
              road-ready every day.”
            </motion.p>

            {/* <motion.div variants={fadeIn}>
              <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                TrenoOps helps you:
              </h1>
            </motion.div> */}

            {/* <motion.div variants={fadeIn} className="mb-8">
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
            </motion.div> */}

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                  className="rounded-xl border-l-4 border-[#F96176] bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div className="mb-3 text-3xl text-[#F96176]">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">
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
