"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import Profile from "./Layout/Profile";
import { Button } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContexts";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
  profilePicture: string;
  userName: string;
  phoneNumber: string;
  email: string;
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const { user } = useAuth() || { user: null }; // Safely fallback to null

  useEffect(() => {
    if (user !== null && user !== undefined) {
      // User is logged in, fetch user data
      setIsLoggedIn(true);
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        } finally {
          setIsLoading(false); // Ensure loading is false after fetching
        }
      };

      fetchUserData();
    } else {
      // No user, so logged out
      setIsLoggedIn(false);
      setIsLoading(false); // Set loading to false if no user is logged in
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <span className="loading loading-spinner text-error"></span>
      </div>
    );
  }

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
          {isLoggedIn && userData && (
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
                    {/* Pass the user data to Profile component */}
                    <Profile user={userData} />
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
          {isLoggedIn && userData && (
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
