import Image from "next/image";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between bg-white shadow-md py-4 px-6">
      {/* Left Section: Logo */}
      <div className="flex items-center">
        <Image
          src="/app_bar_logo.png"
          alt="logo"
          className="h-22 w-full rounded-lg"
          height={0}
          width={0}
          sizes="100vw"
        />
      </div>

      {/* Center Section: Navigation Links */}
      <div className="space-x-8 text-gray-700">
        <a href="#home" className="hover:text-[#F96176]">
          Home
        </a>
        <a href="#about" className="hover:text-[#F96176]">
          About Us
        </a>
        <a href="#contact" className="hover:text-[#F96176]">
          Contact Us
        </a>
      </div>

      {/* Right Section: Login Button */}
      <div>
        <button className="bg-[#F96176] text-white px-4 py-2 rounded hover:bg-[#e05065]">
          Login
        </button>
      </div>
    </nav>
  );
}
