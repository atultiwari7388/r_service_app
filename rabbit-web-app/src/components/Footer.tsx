"use client";

import { db } from "@/lib/firebase";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaTwitter,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
  // FaTruck,
  // FaTools,
  // FaShieldAlt,
} from "react-icons/fa";
// import { motion } from "framer-motion";
// import Image from "next/image";

const Footer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    contactMail?: string;
    contactNumber?: string;
    address?: string;
  }>({});

  // const { user } = useAuth() || { user: null };

  const fetchContactUs = async () => {
    setIsLoading(true);
    try {
      const contactUsRef = doc(db, "metadata", "helpCenter");
      const contactUsSnapshot = await getDoc(contactUsRef);

      if (contactUsSnapshot.exists()) {
        const contactMail = contactUsSnapshot.data()?.mail || "";
        const contactNumber = contactUsSnapshot.data()?.phone || "";
        const address = contactUsSnapshot.data()?.address || "";
        setContactInfo({ contactMail, contactNumber, address });
      }
    } catch (error) {
      // GlobalToastError(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactUs();
  }, []);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  // const fadeIn = {
  //   hidden: { opacity: 0, y: 20 },
  //   visible: {
  //     opacity: 1,
  //     y: 0,
  //     transition: { duration: 0.6 },
  //   },
  // };

  // const staggerContainer = {
  //   hidden: { opacity: 0 },
  //   visible: {
  //     opacity: 1,
  //     transition: {
  //       staggerChildren: 0.2,
  //     },
  //   },
  // };

  // const socialLinks = [
  //   { icon: <FaTwitter />, url: "#" },
  //   { icon: <FaFacebookF />, url: "#" },
  //   { icon: <FaYoutube />, url: "#" },
  //   { icon: <FaLinkedinIn />, url: "#" },
  // ];

  // const quickLinks = [
  //   { name: "Home", url: "/" },
  //   { name: "About us", url: "/about-us" },
  //   { name: "Contact us", url: "/contact-us" },
  //   { name: "Services", url: "/services" },
  // ];

  // const legalLinks = [
  //   { name: "Terms & Conditions", url: "/terms-condition" },
  //   { name: "Privacy Policy", url: "/privacy-policy" },
  //   { name: "Refund Policy", url: "/refund-policy" },
  // ];

  return (
    <footer className="bg-[#F5F5F5] text-black pt-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {/* Address Section */}
          <div>
            <h4 className="text-black text-lg font-semibold mb-4">Address</h4>
            <p className="mb-2 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-[#F96176]" />
              New York, NY 10001, USA
            </p>
            {contactInfo.contactNumber &&
              +(
                <p className="mb-2 flex items-center">
                  <FaPhoneAlt className="mr-2 text-[#F96176]" />
                  {contactInfo.contactNumber}
                </p>
              )}
            <p className="mb-2 flex items-center">
              <FaEnvelope className="mr-2 text-[#F96176]" />
              info@rabbitmechanicservices.com
            </p>
          </div>
          {/* Quick links Section */}
          <div>
            <h4 className="text-black text-lg font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-black hover:text-[#F96176]">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-black hover:text-[#F96176]"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-black hover:text-[#F96176]"
                >
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
          {/* Services Section */}
          <div>
            <h4 className="text-black text-lg font-semibold mb-4">Our Terms</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms-condition"
                  className="text-black hover:text-[#F96176]"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-black hover:text-[#F96176]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-black hover:text-[#F96176]"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
          {/* Newsletter Section */}
          <div>
            <h4 className="text-black text-lg font-semibold mb-4">Reach Us</h4>
            {/* <p className="text-gray-300 mb-4">
              Stay updated with our latest services and offers.
            </p> */}
            <div className="relative max-w-xs">
              <div className="flex space-x-4 mt-4">
                <a
                  href="#"
                  className="text-[#F96176] hover:text-[#F96176] rounded bg-white py-2 px-2 hover:animate-bounce"
                >
                  <FaTwitter />
                </a>
                <a
                  href="#"
                  className="text-[#F96176] hover:text-[#F96176] rounded bg-white py-2 px-2 hover:animate-bounce"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="#"
                  className="text-[#F96176] hover:text-[#F96176] rounded bg-white py-2 px-2 hover:animate-bounce"
                >
                  <FaYoutube />
                </a>
                <a
                  href="#"
                  className="text-[#F96176] hover:text-[#F96176] rounded bg-white py-2 px-2 hover:animate-bounce"
                >
                  <FaLinkedinIn />
                </a>
              </div>
              <div className="flex max-w-xs gap-2 mt-5 items-center">
                <Link
                  href="https://play.google.com/store/apps/details?id=com.rabbit_u_d_app.rabbit_services_app"
                  target="_blank"
                >
                  <img
                    src="/play-store.png"
                    alt="play-store"
                    height={70}
                    width={120}
                  />
                </Link>
                <Link
                  href={
                    "https://apps.apple.com/us/app/rabbit-mechanic-service/id6739995003"
                  }
                  target="_blank"
                >
                  <img
                    src="/app-store.png"
                    alt="app-store"
                    height={70}
                    width={120}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className="border-t border-gray-700 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-center text-sm">
            <p className="text-black">
              &copy;{" "}
              <a
                href="#"
                className="hover:underline text-[#F96176] font-mono font-semibold"
              >
                Regal Application LLC
              </a>
              , All Right Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );

  // return (
  //   <motion.footer
  //     initial="hidden"
  //     whileInView="visible"
  //     viewport={{ once: true }}
  //     variants={staggerContainer}
  //     className="bg-gray-900 text-white pt-16 pb-8"
  //   >
  //     <div className="container mx-auto px-6 md:px-12">
  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
  //         {/* Company Info */}
  //         <motion.div variants={fadeIn}>
  //           <div className="flex items-center mb-6">
  //             <FaTruck className="text-3xl text-[#F96176] mr-3" />
  //             <h3 className="text-2xl font-bold">Rabbit Mechanic</h3>
  //           </div>
  //           <p className="text-gray-300 mb-6">
  //             Your trusted partner for semi truck and trailer maintenance across
  //             North America.
  //           </p>
  //           <div className="space-y-3">
  //             <p className="flex items-center text-gray-300">
  //               <FaMapMarkerAlt className="mr-3 text-[#F96176]" />
  //               New York, NY 10001, USA
  //             </p>
  //             <p className="flex items-center text-gray-300">
  //               <FaPhoneAlt className="mr-3 text-[#F96176]" />
  //               +1 (555) 123-4567
  //             </p>
  //             <p className="flex items-center text-gray-300">
  //               <FaEnvelope className="mr-3 text-[#F96176]" />
  //               info@rabbitmechanicservices.com
  //             </p>
  //           </div>
  //         </motion.div>

  //         {/* Quick Links */}
  //         <motion.div variants={fadeIn}>
  //           <h4 className="text-xl font-semibold mb-6 pb-2 border-b border-[#F96176] inline-block">
  //             Quick Links
  //           </h4>
  //           <ul className="space-y-3">
  //             {quickLinks.map((link, index) => (
  //               <li key={index}>
  //                 <Link
  //                   href={link.url}
  //                   className="text-gray-300 hover:text-[#F96176] transition-colors flex items-center"
  //                 >
  //                   <FaTools className="mr-2 text-sm" />
  //                   {link.name}
  //                 </Link>
  //               </li>
  //             ))}
  //           </ul>
  //         </motion.div>

  //         {/* Legal Links */}
  //         <motion.div variants={fadeIn}>
  //           <h4 className="text-xl font-semibold mb-6 pb-2 border-b border-[#F96176] inline-block">
  //             Legal
  //           </h4>
  //           <ul className="space-y-3">
  //             {legalLinks.map((link, index) => (
  //               <li key={index}>
  //                 <Link
  //                   href={link.url}
  //                   className="text-gray-300 hover:text-[#F96176] transition-colors flex items-center"
  //                 >
  //                   <FaShieldAlt className="mr-2 text-sm" />
  //                   {link.name}
  //                 </Link>
  //               </li>
  //             ))}
  //           </ul>
  //         </motion.div>

  //         {/* Social & App Downloads */}
  //         <motion.div variants={fadeIn}>
  //           <h4 className="text-xl font-semibold mb-6 pb-2 border-b border-[#F96176] inline-block">
  //             Connect With Us
  //           </h4>
  //           <div className="mb-6">
  //             <p className="text-gray-300 mb-4">Follow us on social media:</p>
  //             <div className="flex space-x-4">
  //               {socialLinks.map((social, index) => (
  //                 <motion.a
  //                   key={index}
  //                   href={social.url}
  //                   className="bg-gray-800 text-white p-3 rounded-full hover:bg-[#F96176] transition-colors"
  //                   whileHover={{ y: -5 }}
  //                   whileTap={{ scale: 0.9 }}
  //                 >
  //                   {social.icon}
  //                 </motion.a>
  //               ))}
  //             </div>
  //           </div>
  //           <div>
  //             <p className="text-gray-300 mb-3">Download our app:</p>
  //             <div className="flex flex-col space-y-3">
  //               <motion.a
  //                 href="https://play.google.com/store/apps/details?id=com.rabbit_u_d_app.rabbit_services_app"
  //                 target="_blank"
  //                 whileHover={{ scale: 1.05 }}
  //                 className="inline-block"
  //               >
  //                 <Image
  //                   src="/play-store.png"
  //                   alt="Get on Google Play"
  //                   width={150}
  //                   height={50}
  //                   className="rounded-lg"
  //                 />
  //               </motion.a>
  //               <motion.a
  //                 href="https://apps.apple.com/us/app/rabbit-mechanic-service/id6739995003"
  //                 target="_blank"
  //                 whileHover={{ scale: 1.05 }}
  //                 className="inline-block"
  //               >
  //                 <Image
  //                   src="/app-store.png"
  //                   alt="Download on the App Store"
  //                   width={150}
  //                   height={50}
  //                   className="rounded-lg"
  //                 />
  //               </motion.a>
  //             </div>
  //           </div>
  //         </motion.div>
  //       </div>

  //       {/* Copyright Section */}
  //       <motion.div
  //         variants={fadeIn}
  //         className="border-t border-gray-700 pt-8 text-center"
  //       >
  //         <p className="text-gray-400">
  //           &copy; {new Date().getFullYear()}{" "}
  //           <span className="text-[#F96176] font-semibold">
  //             Regal Application LLC
  //           </span>
  //           . All Rights Reserved.
  //         </p>
  //         <p className="text-gray-500 text-sm mt-2">
  //           Designed for truckers, by truckers.
  //         </p>
  //       </motion.div>
  //     </div>
  //   </motion.footer>
  // );
};

export default Footer;
