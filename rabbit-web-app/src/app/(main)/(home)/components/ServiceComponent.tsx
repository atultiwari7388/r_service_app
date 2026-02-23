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
      title: "Comprehensive Maintenance Management Tools",
      description:
        "Access online software tools that enable users to organize vehicle service records, configure maintenance schedules, and manage roadside assistance activities through a centralized cloud-based platform.",
      color: "bg-[#F96176]",
    },
    {
      icon: <FaTruck className="text-4xl" />,
      title: "Fleet Operations Management Tools",
      description:
        "Utilize interactive software tools designed to help fleet operators configure repair workflows, coordinate driver activities, and manage service operations within a customizable online environment.",
      color: "bg-[#58BB87]",
    },
    {
      icon: <FaUserCog className="text-4xl" />,
      title: "All-in-One Online Software Toolset",
      description:
        "A unified suite of online, non-downloadable software tools that allow fleet owners, drivers, and mechanics to develop and maintain structured vehicle maintenance systems and service coordination processes.",
      color: "bg-[#F96176]",
    },
    {
      icon: <FaBell className="text-4xl" />,
      title: "Automated Monitoring & Alert Configuration Tools",
      description:
        "Configure automated compliance alerts and service reminders using online software tools that monitor vehicle status and maintenance timelines based on user-defined operational settings.",
      color: "bg-[#F59E0B]",
    },
    {
      icon: <FaMapMarkerAlt className="text-4xl" />,
      title: "Service Location & Coordination Tools",
      description:
        "Access platform-based tools that enable users to locate service providers, manage assistance requests, and coordinate roadside support through real-time software-enabled matching functions.",
      color: "bg-[#8B5CF6]",
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: "Analytics and Reporting Tools",
      description:
        "Use integrated software analysis tools to generate operational reports, evaluate maintenance performance, and monitor fleet efficiency through data-driven dashboards accessible online.",
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
              <div className="p-8">
                <div
                  className={`${service.color} text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  {service.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceComponent;
