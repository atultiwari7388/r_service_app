"use client";

import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
/* eslint-disable @next/next/no-img-element */
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
} from "react-icons/fa";

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
      GlobalToastError(error);
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
                <img
                  src="/play-store.png"
                  alt="play-store"
                  height={70}
                  width={120}
                />
                <img
                  src="/app-store.png"
                  alt="play-store"
                  height={70}
                  width={120}
                />
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
            {/* <p className="text-black">
              Designed by{" "}
              <a
                href="https://www.mylexinfotech.com/"
                className="hover:underline text-[#F96176] font-mono font-semibold"
              >
                Mylex Infotech
              </a>
            </p>
           */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
