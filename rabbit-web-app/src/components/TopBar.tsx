"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";

export default function TopBar() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    contactMail?: string;
    contactNumber?: string;
    address?: string;
  }>({});

  const fetchContactUs = async () => {
    if (user) {
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
    }
  };

  useEffect(() => {
    fetchContactUs();
  }, [user]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="bg-[#F96176] text-white py-2 px-4">
      {/* Flex container to align left and right sections */}
      <div className="flex flex-col sm:flex-row items-center justify-between">
        {/* Left Section: Contact Info */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            {contactInfo.contactNumber && <FaPhoneAlt />}
            <a href="">
              {contactInfo.contactNumber && (
                <span>{contactInfo.contactNumber}</span>
              )}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaEnvelope />
            <a href="">
              {user === null ? (
                <span>info@trenoops.com</span>
              ) : (
                <span>{contactInfo.contactMail}</span>
              )}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaMapMarkerAlt />
            {user === null ? (
              <span>New York, NY 10001, USA</span>
            ) : (
              <span>{contactInfo.address}</span>
            )}
          </div>
        </div>

        {/* Right Section: Social Links */}
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          {/* <Link href="/account/notifications">
            <IoMdNotificationsOutline className="font-semibold text-xl" />
          </Link> */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            <FaFacebook />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            <FaTwitter />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            <FaInstagram />
          </a>
        </div>
      </div>
    </div>
  );
}
