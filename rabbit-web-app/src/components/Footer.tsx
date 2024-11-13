/* eslint-disable @next/next/no-img-element */
import React from "react";
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
            <p className="mb-2 flex items-center">
              <FaPhoneAlt className="mr-2 text-[#F96176]" />
              (+1)202 555 088
            </p>
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
                <a href="#" className="text-black hover:text-[#F96176]">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-[#F96176]">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-[#F96176]">
                  Contact us
                </a>
              </li>
            </ul>
          </div>
          {/* Services Section */}
          <div>
            <h4 className="text-black text-lg font-semibold mb-4">Our Terms</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-black hover:text-[#F96176]">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-[#F96176]">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-[#F96176]">
                  Refund Policy
                </a>
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
                RabbitService
              </a>
              , All Right Reserved.
            </p>
            <p className="text-black">
              Designed by{" "}
              <a
                href="https://www.mylexinfotech.com/"
                className="hover:underline text-[#F96176] font-mono font-semibold"
              >
                Mylex Infotech
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
