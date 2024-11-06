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
    <div className="flex items-center justify-between bg-[#F96176] text-white py-2 px-4">
      {/* Left Section: Contact Info */}
      <div className="flex items-center space-x-6">
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
          <span>Sahibzada Ajit Singh Nagar, Punjab 160071</span>
        </div>
      </div>

      {/* Right Section: Social Links */}
      <div className="flex items-center space-x-4">
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
  );
}
