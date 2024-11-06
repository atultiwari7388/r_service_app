import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";

export default function TopBar() {
  return (
    <div className="bg-[#F96176] text-white py-2 px-4">
      {/* Flex container to align left and right sections */}
      <div className="flex flex-col sm:flex-row items-center justify-between">
        {/* Left Section: Contact Info */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <FaPhone />
            <a href="">
              <span>(+1)202 555 088</span>
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaEnvelope />
            <a href="">
              <span>info@rabbitmechanicservices.com</span>
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaMapMarkerAlt />
            <span>New York, NY 10001, USA</span>
          </div>
        </div>

        {/* Right Section: Social Links */}
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
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
