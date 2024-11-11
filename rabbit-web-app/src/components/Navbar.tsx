"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import Profile from "./Layout/Profile";
import { Button } from "@nextui-org/react";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between bg-white shadow-md py-4 px-6 relative">
      {/* Left Section: Logo */}
      <Link href={`/`}>
        <div className="flex items-center cursor-pointer">
          <Image
            src="/Logo_Topbar.png"
            alt="logo"
            className="h-10 w-auto rounded-lg"
            height={40}
            width={40}
            sizes="100vw"
          />
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="flex relative items-center">
        <div className="hidden sm:flex sm:items-center sm:space-x-8 text-gray-700 ml-auto font-semibold">
          <Link href="/" className="hover:text-[#F96176]">
            Home
          </Link>
          <Link href="/about-us" className="hover:text-[#F96176]">
            About us
          </Link>
          <Link href="/" className="hover:text-[#F96176]">
            Contact us
          </Link>
          {isLoggedIn && (
            <>
              <Link href="/" className="hover:text-[#F96176]">
                My Jobs
              </Link>
              <Link href="/" className="hover:text-[#F96176]">
                History
              </Link>
              {/* Profile Icon with Hover Effect */}
              <div
                className="relative"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <FaUserCircle className="text-3xl text-[#F96176] cursor-pointer" />
                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-lg p-2 rounded-lg z-10">
                    <Profile
                      user={{
                        name: "Sachin Minhas",
                        phone: "9569368066",
                        avatarUrl: "/profile.png",
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          {!isLoggedIn && (
            <Link href="/login">
              <Button className="bg-[#F96176] text-white px-4 py-2 rounded hover:bg-[#e05065]">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hamburger Icon (Mobile only) */}
      <div className="sm:hidden flex items-center">
        <button onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? (
            <FaTimes className="text-2xl text-[#F96176]" />
          ) : (
            <FaBars className="text-2xl text-[#F96176]" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Links (Dropdown style) */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-0 left-0 w-full bg-white shadow-lg py-4 px-6 mt-16 z-10">
          <Link
            href="/"
            className="block py-2 text-gray-700 hover:text-[#F96176]"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <Link
            href="/about-us"
            className="block py-2 text-gray-700 hover:text-[#F96176]"
            onClick={toggleMenu}
          >
            About Us
          </Link>
          <Link
            href="/"
            className="block py-2 text-gray-700 hover:text-[#F96176]"
            onClick={toggleMenu}
          >
            Contact Us
          </Link>
          {isLoggedIn && (
            <>
              <Link
                href="/"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                My Jobs
              </Link>
              <Link
                href="/"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                History
              </Link>
              {/* Mobile-only Logout Button */}
              <Link href="/logout">
                <button
                  className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
                  onClick={toggleMenu}
                >
                  Logout
                </button>
              </Link>
            </>
          )}
          {!isLoggedIn && (
            <Link href="/login">
              <button
                className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
                onClick={toggleMenu}
              >
                Login
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
