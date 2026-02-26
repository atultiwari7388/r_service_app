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
              <div className="flex flex-col items-center justify-center h-full leading-tight space-y-0">
                <span className="text-2xl font-bold mt-2">Easy</span>
                <span className="text-2xl font-bold">To</span>
                <span className="text-2xl font-bold">Use</span>
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
                <span className="text-[#F96176] font-bold">TrenoOps</span> was
                founded by logistics professionals and built with real truckers
                in mind. We understand the daily challenges of managing
                semi-truck and trailer maintenance.
              </h2>
            </motion.div>

            <motion.p
              variants={fadeIn}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              DOT compliance isn&apos;t just a requirement — it&apos;s
              protection against costly fines, unexpected breakdowns, and
              delivery delays. That&apos;s why TrenoOps is designed to help you
              stay ahead of every service deadline.
            </motion.p>

            <motion.div variants={fadeIn}>
              <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                TrenoOps helps you:
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
