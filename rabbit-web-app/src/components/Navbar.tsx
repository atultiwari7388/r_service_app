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
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";

interface UserData {
  profilePicture: string;
  userName: string;
  phoneNumber: string;
  email: string;
  wallet: number;
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <nav className="flex items-center justify-between bg-white shadow-md py-4 px-6 relative">
      {/* Left Section: Logo */}
      <Link href={isLoggedIn ? "/" : "/"}>
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
          {!isLoggedIn ? (
            <>
              <Link href="/" className="hover:text-[#F96176]">
                Home
              </Link>
              <Link href="/about-us" className="hover:text-[#F96176]">
                About us
              </Link>
              <Link href="/contact-us" className="hover:text-[#F96176]">
                Contact us
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/records"
                className="hover:text-[#F96176] transition-all duration-300 transform hover:scale-105 animate-fadeIn"
              >
                Records
              </Link>
              <Link
                href="/account/my-vehicles"
                className="hover:text-[#F96176]"
              >
                Vehicles
              </Link>

              <Link
                href="/account/manage-team"
                className="hover:text-[#F96176]"
              >
                Manage Team
              </Link>
              <Link
                href="/account/manage-trip"
                className="hover:text-[#F96176]"
              >
                My Trip
              </Link>

              <Link
                href="/account/trip-wise-vehicle"
                className="hover:text-[#F96176]"
              >
                Tripwise vehicle
              </Link>
              <Link
                href="/account/manage-check"
                className="hover:text-[#F96176]"
              >
                Write Check
              </Link>
              <Link href="/find-mechanic" className="hover:text-[#F96176]">
                Find Mechanic
              </Link>
              <Link href="/my-jobs" className="hover:text-[#F96176]">
                My Jobs
              </Link>
              <Link href="/history" className="hover:text-[#F96176]">
                History
              </Link>
            </>
          )}

          {isLoggedIn && userData && (
            <div
              className="relative"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <FaUserCircle className="text-3xl text-[#F96176] cursor-pointer" />
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-lg p-2 rounded-lg z-10">
                  <Profile user={userData} />
                </div>
              )}
            </div>
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
          {!isLoggedIn ? (
            <>
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
                href="/contact-us"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Contact Us
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/vehicles"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Vehicles
              </Link>
              <Link
                href="/records"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Records
              </Link>
              <Link
                href="/manage-team"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Manage Team
              </Link>
              <Link
                href="/manage-trip"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Manage Trip
              </Link>
              <Link
                href="/write-check"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Write Check
              </Link>
              <Link
                href="/find-mechanic"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                Find Mechanic
              </Link>
              <Link
                href="/my-jobs"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                My Jobs
              </Link>
              <Link
                href="/history"
                className="block py-2 text-gray-700 hover:text-[#F96176]"
                onClick={toggleMenu}
              >
                History
              </Link>
            </>
          )}

          {isLoggedIn ? (
            <button
              className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
              onClick={() => {
                handleLogout();
                toggleMenu();
              }}
            >
              Logout
            </button>
          ) : (
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

// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import React, { useEffect, useState } from "react";
// import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
// import Profile from "./Layout/Profile";
// import { Button } from "@nextui-org/react";
// import { useAuth } from "@/contexts/AuthContexts";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import { HashLoader } from "react-spinners";

// interface UserData {
//   profilePicture: string;
//   userName: string;
//   phoneNumber: string;
//   email: string;
//   wallet: number;
// }

// export default function NavBar() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const router = useRouter();

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const { user, logout = async () => {} } = useAuth() || { user: null };

//   // Function to handle the logout logic
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
//       // User is logged in, fetch user data
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
//       // No user, so logged out
//       setIsLoggedIn(false);
//       setIsLoading(false);
//     }
//   }, [user]);

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
//       <Link href={`/`}>
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
//           <Link href="/" className="hover:text-[#F96176]">
//             Home
//           </Link>
//           <Link href="/about-us" className="hover:text-[#F96176]">
//             About us
//           </Link>
//           <Link href="/contact-us" className="hover:text-[#F96176]">
//             Contact us
//           </Link>
//           <Link
//             href="/records"
//             className="hover:text-[#F96176] transition-all duration-300 transform hover:scale-105 animate-fadeIn"
//           >
//             Records
//           </Link>
//           {isLoggedIn && userData && (
//             <>
//               <Link href="/my-jobs" className="hover:text-[#F96176]">
//                 My Jobs
//               </Link>
//               <Link href="/history" className="hover:text-[#F96176]">
//                 History
//               </Link>

//               {/* Profile Icon with Hover Effect */}
//               <div
//                 className="relative"
//                 onMouseEnter={() => setIsProfileOpen(true)}
//                 onMouseLeave={() => setIsProfileOpen(false)}
//               >
//                 <FaUserCircle className="text-3xl text-[#F96176] cursor-pointer" />
//                 {isProfileOpen && (
//                   <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-lg p-2 rounded-lg z-10">
//                     {/* Pass the user data to Profile component */}
//                     <Profile user={userData} />
//                   </div>
//                 )}
//               </div>
//             </>
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
//           <Link
//             href="/"
//             className="block py-2 text-gray-700 hover:text-[#F96176]"
//             onClick={toggleMenu}
//           >
//             Home
//           </Link>
//           <Link
//             href="/about-us"
//             className="block py-2 text-gray-700 hover:text-[#F96176]"
//             onClick={toggleMenu}
//           >
//             About Us
//           </Link>
//           <Link
//             href="/contact-us"
//             className="block py-2 text-gray-700 hover:text-[#F96176]"
//             onClick={toggleMenu}
//           >
//             Contact Us
//           </Link>
//           {isLoggedIn && userData && (
//             <>
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
//                 href="/records"
//                 className="block py-2 text-gray-700 hover:text-[#F96176]"
//                 onClick={toggleMenu}
//               >
//                 Records
//               </Link>
//               {/* Mobile-only Logout Button */}
//               <Link href="/logout">
//                 <button
//                   className="block w-full bg-[#F96176] text-white py-2 rounded hover:bg-[#e05065] mt-4"
//                   onClick={() => {
//                     handleLogout();
//                     toggleMenu();
//                   }}
//                 >
//                   Logout
//                 </button>
//               </Link>
//             </>
//           )}
//           {!isLoggedIn && (
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
