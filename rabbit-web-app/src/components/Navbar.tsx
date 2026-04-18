"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import Profile from "./Layout/Profile";
import { Button } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContexts";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";
import { IoMdNotificationsOutline } from "react-icons/io";

interface UserData {
  profilePicture: string;
  userName: string;
  phoneNumber: string;
  email: string;
  wallet: number;
  role: string; // Add role field
  createdBy?: string; // Add createdBy field for SubOwner
}

interface Notification {
  id: string;
  isRead: boolean;
  date: Timestamp;
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [effectiveUserId, setEffectiveUserId] = useState(""); // Add effectiveUserId state

  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const { user, logout = async () => {} } = useAuth() || { user: null };

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
        toast.success("Logout Successful");
        router.push("/login");
      } catch (error) {
        console.error("Error during logout:", error);
      }
    } else {
      console.error("Logout function is undefined.");
    }
  };

  useEffect(() => {
    if (user !== null && user !== undefined) {
      setIsLoggedIn(true);
      setIsEmailVerified(user.emailVerified || false);

      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserData;
            setUserData(userData);

            // Determine effectiveUserId based on role
            if (userData.role === "SubOwner" && userData.createdBy) {
              setEffectiveUserId(userData.createdBy);
              console.log(
                "SubOwner detected, using effectiveUserId:",
                userData.createdBy
              );
            } else {
              setEffectiveUserId(user.uid);
              console.log("Regular user, using own uid:", user.uid);
            }
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    } else {
      setIsLoggedIn(false);
      setIsEmailVerified(false);
      setIsLoading(false);
    }
  }, [user]);

  // Update notifications useEffect to use effectiveUserId
  useEffect(() => {
    if (!effectiveUserId || !isEmailVerified) return; // Use effectiveUserId instead of user.uid

    const notificationsRef = collection(
      db,
      "Users",
      effectiveUserId, // Use effectiveUserId
      "UserNotifications"
    );
    const q = query(
      notificationsRef,
      where("isRead", "==", false),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });
      setNotifications(notificationsData);
      console.log(
        "Notifications:",
        notificationsData,
        "notifications:",
        notifications
      );
      setUnreadCount(notificationsData.length);
    });

    return () => unsubscribe();
  }, [effectiveUserId, isEmailVerified]); // Change dependency to effectiveUserId

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/logo-new.png"
                alt="logo"
                className="h-10 w-auto"
                height={40}
                width={80}
                sizes="100vw"
              />
            </Link>

            {/* Desktop Navigation - Logged In and Email Verified */}
            {isLoggedIn && isEmailVerified && (
              <div className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:space-x-8">
                {/* Maintenance */}
                <div className="relative group">
                  <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors cursor-pointer">
                    Maintenance
                  </span>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border">
                    <Link
                      href="/records"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Records
                    </Link>
                    <Link
                      href="/account/my-vehicles"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Vehicles
                    </Link>
                    <Link
                      href="/account/manage-trip"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      My Trip
                    </Link>
                    <Link
                      href="/account/trip-wise-vehicle"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Tripwise Vehicle
                    </Link>
                  </div>
                </div>

                {/* Mechanic */}
                <div className="relative group">
                  <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors cursor-pointer">
                    Mechanic
                  </span>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border">
                    <Link
                      href="/find-mechanic"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Find Mechanic
                    </Link>
                    <Link
                      href="/my-jobs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      My Jobs
                    </Link>
                  </div>
                </div>

                {(userData?.role === "Owner" ||
                  userData?.role === "SubOwner") && (
                  <div className="relative group">
                    <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors cursor-pointer">
                      Dispatch
                    </span>
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border">
                      <Link
                        href="/dispatch/create-load"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                      >
                        Create Load
                      </Link>
                      <Link
                        href="/dispatch/view-load"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                      >
                        View Load
                      </Link>
                    </div>
                  </div>
                )}

                {/* Financial */}
                <div className="relative group">
                  <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors cursor-pointer">
                    Financial
                  </span>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border">
                    <Link
                      href="/account/manage-check"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Write Check
                    </Link>
                    <Link
                      href=""
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Payments
                    </Link>
                  </div>
                </div>

                {/* Settings */}
                <div className="relative group">
                  <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors cursor-pointer">
                    Settings
                  </span>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border">
                    <Link
                      href="/account/manage-team"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Manage Team
                    </Link>
                    <Link
                      href="/dispatch-settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#F96176]"
                    >
                      Dispatch
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                {isEmailVerified ? (
                  <div className="flex items-center space-x-6">
                    <Link href="/account/notifications" className="relative">
                      <IoMdNotificationsOutline className="text-2xl text-gray-600 hover:text-[#F96176] transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 focus:outline-none"
                      >
                        {userData?.profilePicture ? (
                          <Image
                            src={userData.profilePicture}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <FaUserCircle className="text-3xl text-[#F96176]" />
                        )}
                      </button>

                      {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                          {userData && <Profile user={userData} />}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-orange-600">
                      Please verify your email
                    </span>
                    <Button
                      className="bg-[#F96176] text-white px-4 py-1 rounded-md hover:bg-[#e05065] transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <NavLink href="/about-us">About Us</NavLink>
                <NavLink href="/contact-us">Contact Us</NavLink>
                <Link href="/login">
                  <Button className="bg-[#F96176] text-white px-6 py-2 rounded-md hover:bg-[#e05065] transition-colors">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#F96176] focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {isLoggedIn ? (
              <>
                {isEmailVerified ? (
                  <>
                    {/* Maintenance */}
                    <div className="pl-3 py-2 text-base font-medium text-gray-900 font-semibold">
                      Maintenance
                    </div>
                    <MobileNavLink href="/records" onClick={toggleMenu}>
                      ↳ Records
                    </MobileNavLink>
                    <MobileNavLink
                      href="/account/my-vehicles"
                      onClick={toggleMenu}
                    >
                      ↳ Vehicles
                    </MobileNavLink>
                    <MobileNavLink
                      href="/account/manage-trip"
                      onClick={toggleMenu}
                    >
                      ↳ My Trip
                    </MobileNavLink>
                    <MobileNavLink
                      href="/account/trip-wise-vehicle"
                      onClick={toggleMenu}
                    >
                      ↳ Tripwise Vehicle
                    </MobileNavLink>

                    {/* Mechanic */}
                    <div className="pl-3 py-2 text-base font-medium text-gray-900 font-semibold">
                      Mechanic
                    </div>
                    <MobileNavLink href="/find-mechanic" onClick={toggleMenu}>
                      ↳ Find Mechanic
                    </MobileNavLink>
                    <MobileNavLink href="/my-jobs" onClick={toggleMenu}>
                      ↳ My Jobs
                    </MobileNavLink>

                    {/* Financial */}
                    <div className="pl-3 py-2 text-base font-medium text-gray-900 font-semibold">
                      Financial
                    </div>
                    <MobileNavLink
                      href="/account/manage-check"
                      onClick={toggleMenu}
                    >
                      ↳ Write Check
                    </MobileNavLink>
                    <MobileNavLink
                      href="/account/payments"
                      onClick={toggleMenu}
                    >
                      ↳ Payments
                    </MobileNavLink>

                    {/* Settings */}
                    <div className="pl-3 py-2 text-base font-medium text-gray-900 font-semibold">
                      Settings
                    </div>
                    <MobileNavLink
                      href="/account/manage-team"
                      onClick={toggleMenu}
                    >
                      ↳ Manage Team
                    </MobileNavLink>

                    {(userData?.role === "Owner" ||
                      userData?.role === "SubOwner") && (
                      <>
                        <div className="pl-3 py-2 text-base font-medium text-gray-900 font-semibold">
                          Dispatch
                        </div>
                        <MobileNavLink
                          href="/dispatch/create-load"
                          onClick={toggleMenu}
                        >
                          ↳ Create Load
                        </MobileNavLink>
                        <MobileNavLink
                          href="/dispatch/view-load"
                          onClick={toggleMenu}
                        >
                          ↳ View Load
                        </MobileNavLink>
                        <MobileNavLink
                          href="/dispatch/settings"
                          onClick={toggleMenu}
                        >
                          ↳ Settings
                        </MobileNavLink>
                      </>
                    )}
                    <MobileNavLink
                      href="/account/notifications"
                      onClick={toggleMenu}
                    >
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </MobileNavLink>

                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[#F96176] hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    {/* <div className="px-3 py-2 text-sm text-orange-600">
                      Please verify your email
                    </div> */}

                    <div className="flex items-center space-x-6">
                      <NavLink href="/about-us">About Us</NavLink>
                      <NavLink href="/contact-us">Contact Us</NavLink>
                      <Link href="/login">
                        <Button className="bg-[#F96176] text-white px-6 py-2 rounded-md hover:bg-[#e05065] transition-colors">
                          Login
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <MobileNavLink href="/" onClick={toggleMenu}>
                  Home
                </MobileNavLink>
                <MobileNavLink href="/about-us" onClick={toggleMenu}>
                  About Us
                </MobileNavLink>
                <MobileNavLink href="/contact-us" onClick={toggleMenu}>
                  Contact Us
                </MobileNavLink>
                <Link href="/login">
                  <button
                    onClick={toggleMenu}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#F96176] hover:bg-gray-50"
                  >
                    Login
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Reusable NavLink component
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-[#F96176] hover:border-[#F96176] transition-colors"
  >
    {children}
  </Link>
);

// Reusable MobileNavLink component
const MobileNavLink = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[#F96176] hover:bg-gray-50"
  >
    {children}
  </Link>
);
