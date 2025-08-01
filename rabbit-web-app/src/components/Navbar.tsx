// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import React, { useEffect, useState } from "react";
// import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
// import Profile from "./Layout/Profile";
// import { Button } from "@nextui-org/react";
// import { useAuth } from "@/contexts/AuthContexts";
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import { HashLoader } from "react-spinners";
// import { IoMdNotificationsOutline } from "react-icons/io";

// interface UserData {
//   profilePicture: string;
//   userName: string;
//   phoneNumber: string;
//   email: string;
//   wallet: number;
// }

// interface Notification {
//   id: string;
//   isRead: boolean;
//   date: Timestamp;
// }

// export default function NavBar() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [notifications, setNotifications] = useState<Notification[]>([]);

//   const router = useRouter();

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const { user, logout = async () => {} } = useAuth() || { user: null };

//   const handleLogout = async () => {
//     if (logout) {
//       try {
//         await logout();
//         toast.success("Logout Successful");
//         router.push("/login");
//       } catch (error) {
//         console.error("Error during logout:", error);
//       }
//     } else {
//       console.error("Logout function is undefined.");
//     }
//   };

//   useEffect(() => {
//     if (user !== null && user !== undefined) {
//       setIsLoggedIn(true);
//       const fetchUserData = async () => {
//         try {
//           const docRef = doc(db, "Users", user.uid);
//           const docSnap = await getDoc(docRef);
//           if (docSnap.exists()) {
//             setUserData(docSnap.data() as UserData);
//           } else {
//             console.log("No such document!");
//           }
//         } catch (error) {
//           console.error("Error fetching user data: ", error);
//         } finally {
//           setIsLoading(false);
//         }
//       };

//       fetchUserData();
//     } else {
//       setIsLoggedIn(false);
//       setIsLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     if (!user?.uid) return;

//     const notificationsRef = collection(
//       db,
//       "Users",
//       user.uid,
//       "UserNotifications"
//     );
//     const q = query(
//       notificationsRef,
//       where("isRead", "==", false),
//       orderBy("date", "desc")
//     );

//     const unsubscribe = onSnapshot(q, (querySnapshot) => {
//       const notificationsData: Notification[] = [];
//       querySnapshot.forEach((doc) => {
//         notificationsData.push({
//           id: doc.id,
//           ...doc.data(),
//         } as Notification);
//       });
//       console.log("Notifications:", notifications);
//       setNotifications(notificationsData);
//       setUnreadCount(notificationsData.length);
//     });

//     return () => unsubscribe();
//   }, [user?.uid]);

//   if (isLoading) {
//     return (
//       <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
//         <HashLoader color="#F96176" />
//       </div>
//     );
//   }

//   return (
//     <nav className="flex items-center justify-between bg-white shadow-md py-4 px-6 relative">
//       {/* Left Section: Logo */}
//       <Link href={isLoggedIn ? "/" : "/"}>
//         <div className="flex items-center cursor-pointer">
//           <Image
//             src="/Logo_Topbar.png"
//             alt="logo"
//             className="h-10 w-auto rounded-lg"
//             height={40}
//             width={40}
//             sizes="100vw"
//           />
//         </div>
//       </Link>

//       {/* Desktop Navigation Links */}
//       <div className="flex relative items-center">
//         <div className="hidden sm:flex sm:items-center sm:space-x-8 text-gray-700 ml-auto font-semibold">
//           {!isLoggedIn ? (
//             <>
//               <Link href="/" className="hover:text-[#F96176]">
//                 Home
//               </Link>
//               <Link href="/about-us" className="hover:text-[#F96176]">
//                 About us
//               </Link>
//               <Link href="/contact-us" className="hover:text-[#F96176]">
//                 Contact us
//               </Link>
//             </>
//           ) : (
//             <>
//               <Link
//                 href="/records"
//                 className="hover:text-[#F96176] transition-all duration-300 transform hover:scale-105 animate-fadeIn"
//               >
//                 Records
//               </Link>
//               <Link
//                 href="/account/my-vehicles"
//                 className="hover:text-[#F96176]"
//               >
//                 Vehicles
//               </Link>

//               <Link
//                 href="/account/manage-team"
//                 className="hover:text-[#F96176]"
//               >
//                 Manage Team
//               </Link>
//               <Link
//                 href="/account/manage-trip"
//                 className="hover:text-[#F96176]"
//               >
//                 My Trip
//               </Link>

//               <Link
//                 href="/account/trip-wise-vehicle"
//                 className="hover:text-[#F96176]"
//               >
//                 Tripwise vehicle
//               </Link>
//               <Link
//                 href="/account/manage-check"
//                 className="hover:text-[#F96176]"
//               >
//                 Write Check
//               </Link>
//               <Link href="/find-mechanic" className="hover:text-[#F96176]">
//                 Find Mechanic
//               </Link>
//               <Link href="/my-jobs" className="hover:text-[#F96176]">
//                 My Jobs
//               </Link>
//               <Link href="/history" className="hover:text-[#F96176]">
//                 History
//               </Link>

//               <Link href="/account/notifications" className="relative">
//                 <IoMdNotificationsOutline className="font-semibold text-xl" />
//                 {unreadCount > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {unreadCount}
//                   </span>
//                 )}
//               </Link>
//             </>
//           )}

//           {isLoggedIn && userData && (
//             <div
//               className="relative"
//               onMouseEnter={() => setIsProfileOpen(true)}
//               onMouseLeave={() => setIsProfileOpen(false)}
//             >
//               <FaUserCircle className="text-3xl text-[#F96176] cursor-pointer" />
//               {isProfileOpen && (
//                 <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-lg p-2 rounded-lg z-10">
//                   <Profile user={userData} />
//                 </div>
//               )}
//             </div>
//           )}
//           {!isLoggedIn && (
//             <Link href="/login">
//               <Button className="bg-[#F96176] text-white px-4 py-2 rounded hover:bg-[#e05065]">
//                 Login
//               </Button>
//             </Link>
//           )}
//         </div>
//       </div>

//       {/* Hamburger Icon (Mobile only) */}
//       <div className="sm:hidden flex items-center">
//         <button onClick={toggleMenu} aria-label="Toggle menu">
//           {isMenuOpen ? (
//             <FaTimes className="text-2xl text-[#F96176]" />
//           ) : (
//             <FaBars className="text-2xl text-[#F96176]" />
//           )}
//         </button>
//       </div>

//       {/* Mobile Navigation Links (Dropdown style) */}
//       {isMenuOpen && (
//         <div className="sm:hidden absolute top-0 left-0 w-full bg-white shadow-lg py-4 px-6 mt-16 z-10">
//           {!isLoggedIn ? (
//             <>
//               <Link
//                 href="/"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Home
//               </Link>
//               <Link
//                 href="/about-us"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 About Us
//               </Link>
//               <Link
//                 href="/contact-us"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Contact Us
//               </Link>
//             </>
//           ) : (
//             <>
//               <Link
//                 href="/vehicles"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Vehicles
//               </Link>
//               <Link
//                 href="/records"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Records
//               </Link>
//               <Link
//                 href="/manage-team"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Manage Team
//               </Link>
//               <Link
//                 href="/manage-trip"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Manage Trip
//               </Link>
//               <Link
//                 href="/write-check"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Write Check
//               </Link>
//               <Link
//                 href="/find-mechanic"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Find Mechanic
//               </Link>
//               <Link
//                 href="/my-jobs"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 My Jobs
//               </Link>
//               <Link
//                 href="/history"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 History
//               </Link>
//               <Link
//                 href="/account/notifications"
//                 className="block py-2 text-gray-700 hover:text-[#F96176] flex items-center"
//                 onClick={toggleMenu}
//               >
//                 Notifications
//                 {unreadCount > 0 && (
//                   <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {unreadCount}
//                   </span>
//                 )}
//               </Link>
//             </>
//           )}

//           {isLoggedIn ? (
//             <button
//               className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
//               onClick={() => {
//                 handleLogout();
//                 toggleMenu();
//               }}
//             >
//               Logout
//             </button>
//           ) : (
//             <Link href="/login">
//               <button
//                 className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
//                 onClick={toggleMenu}
//               >
//                 Login
//               </button>
//             </Link>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// }

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
}

interface Notification {
  id: string;
  isRead: boolean;
  date: Timestamp;
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // const { user, logout = async () => {} } = useAuth() || { user: null };
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
          setIsLoading(false);
        }
      };

      fetchUserData();
    } else {
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(
      db,
      "Users",
      user.uid,
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
      console.log("Notifications:", notifications);
      setUnreadCount(notificationsData.length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/Logo_Topbar.png"
                alt="logo"
                className="h-10 w-auto"
                height={40}
                width={40}
                sizes="100vw"
              />
            </Link>

            {/* Desktop Navigation - Logged In */}
            {isLoggedIn && (
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <NavLink href="/records">Records</NavLink>
                <NavLink href="/account/my-vehicles">Vehicles</NavLink>
                <NavLink href="/account/manage-team">Manage Team</NavLink>
                <NavLink href="/account/manage-trip">My Trip</NavLink>
                <NavLink href="/account/trip-wise-vehicle">
                  Tripwise Vehicle
                </NavLink>
                <NavLink href="/account/manage-check">Write Check</NavLink>
                <NavLink href="/find-mechanic">Find Mechanic</NavLink>
                <NavLink href="/my-jobs">My Jobs</NavLink>
                <NavLink href="/history">History</NavLink>
              </div>
            )}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                <div className="flex items-center space-x-6">
                  {/* <NavLink href="/my-jobs">My Jobs</NavLink>
                  <NavLink href="/history">History</NavLink> */}

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
                        {/* <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button> */}
                      </div>
                    )}
                  </div>
                </div>
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
                <MobileNavLink href="/records" onClick={toggleMenu}>
                  Records
                </MobileNavLink>
                <MobileNavLink href="/account/my-vehicles" onClick={toggleMenu}>
                  Vehicles
                </MobileNavLink>
                <MobileNavLink href="/account/manage-team" onClick={toggleMenu}>
                  Manage Team
                </MobileNavLink>
                <MobileNavLink href="/account/manage-trip" onClick={toggleMenu}>
                  My Trip
                </MobileNavLink>
                <MobileNavLink
                  href="/account/trip-wise-vehicle"
                  onClick={toggleMenu}
                >
                  Tripwise Vehicle
                </MobileNavLink>
                <MobileNavLink
                  href="/account/manage-check"
                  onClick={toggleMenu}
                >
                  Write Check
                </MobileNavLink>
                <MobileNavLink href="/find-mechanic" onClick={toggleMenu}>
                  Find Mechanic
                </MobileNavLink>
                <MobileNavLink href="/my-jobs" onClick={toggleMenu}>
                  My Jobs
                </MobileNavLink>
                <MobileNavLink href="/history" onClick={toggleMenu}>
                  History
                </MobileNavLink>
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
