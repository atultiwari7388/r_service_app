"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between bg-white shadow-md py-4 px-6 relative">
      {/* Left Section: Logo */}
      <Link href={`/`}>
        <div className="flex items-center">
          <Image
            src="/Logo_Topbar.png"
            alt="logo"
            className="h-10 w-auto rounded-lg"
            height={0}
            width={0}
            sizes="100vw"
          />
        </div>
      </Link>
      {/* Desktop Navigation Links (on screens larger than sm) */}
      <div className="hidden sm:flex sm:items-center sm:space-x-8 text-gray-700 ml-auto font-semibold">
        <Link href={`/`} className="hover:text-[#F96176]">
          Home
        </Link>

        <Link href={`/about-us`} className="hover:text-[#F96176]">
          About us
        </Link>
        <Link href={`/`} className="hover:text-[#F96176]">
          Contact us
        </Link>
      </div>

      {/* Desktop Login Button */}
      <Link href={`/login`}>
        <div className="hidden sm:block ml-4">
          <button className="bg-[#F96176] text-white px-4 py-2 rounded hover:bg-[#e05065]">
            Login
          </button>
        </div>
      </Link>

      {/* Hamburger Icon (Mobile only) */}
      <div className="sm:hidden flex items-center">
        <button onClick={toggleMenu}>
          {isMenuOpen ? (
            <FaTimes className="text-2xl text-[#F96176]" />
          ) : (
            <FaBars className="text-2xl text-[#F96176]" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Links (Dropdown style) */}
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } sm:hidden absolute top-0 left-0 w-full bg-white shadow-lg py-4 px-6 mt-16 z-10`}
      >
        <a
          href="#home"
          className="block py-2 text-gray-700 hover:text-[#F96176]"
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </a>
        <a
          href="#about"
          className="block py-2 text-gray-700 hover:text-[#F96176]"
          onClick={() => setIsMenuOpen(false)}
        >
          About Us
        </a>
        <a
          href="#contact"
          className="block py-2 text-gray-700 hover:text-[#F96176]"
          onClick={() => setIsMenuOpen(false)}
        >
          Contact Us
        </a>

        {/* Mobile Login Button */}

        <Link href={`/login`}>
          <div className="mt-4">
            <button
              className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065]"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </button>
          </div>
        </Link>
      </div>
    </nav>
  );
}
