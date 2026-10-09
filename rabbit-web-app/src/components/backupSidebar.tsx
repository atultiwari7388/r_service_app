"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Wrench,
  Search,
  Truck,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Home,
  FileText,
  Clock,
  Car,
  Users,
  Building,
  CreditCard,
  CheckSquare,
} from "lucide-react";
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

interface UserData {
  profilePicture: string;
  userName: string;
  phoneNumber: string;
  email: string;
  wallet: number;
  role: string;
  createdBy?: string;
  isGuest?: boolean;
}

interface Notification {
  id: string;
  isRead: boolean;
  date: Timestamp;
}

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: SubMenuItem[];
  roles?: string[]; // Allowed roles. undefined means all registered roles
}

export default function backupSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth() || { user: null };
  const [userData, setUserData] = useState<UserData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch User Data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);

          if (data.role === "SubOwner" && data.createdBy) {
            setEffectiveUserId(data.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data in AppSidebar:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Notifications listener
  useEffect(() => {
    if (!effectiveUserId) return;

    const notificationsRef = collection(
      db,
      "Users",
      effectiveUserId,
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
      setUnreadCount(notificationsData.length);
    });

    return () => unsubscribe();
  }, [effectiveUserId]);

  // Close profile dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
        toast.success("Logout Successful");
        router.push("/login");
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
  };

  const isGuest = userData?.role === "Guest" || userData?.isGuest === true;

  // Define Navigation Categories
  const guestNavItems: NavCategory[] = [
    {
      key: "find-mechanic",
      label: "Find Mechanic",
      icon: <Wrench size={20} />,
      href: "/find-mechanic",
    },
    {
      key: "my-jobs",
      label: "My Jobs",
      icon: <FileText size={20} />,
      href: "/my-jobs",
    },
    {
      key: "history",
      label: "History",
      icon: <Clock size={20} />,
      href: "/history",
    },
  ];

  const fullNavCategories: NavCategory[] = [
    {
      key: "home",
      label: "Home",
      icon: <Home size={20} />,
      href: "/",
    },
    {
      key: "maintenance",
      label: "Maintenance",
      icon: <Wrench size={20} />,
      subItems: [
        { label: "Records", href: "/records", icon: <FileText size={16} /> },
        {
          label: "Vehicles",
          href: "/account/my-vehicles",
          icon: <Car size={16} />,
        },
        {
          label: "Tripwise Vehicle",
          href: "/account/trip-wise-vehicle",
          icon: <Truck size={16} />,
        },
      ],
    },
    {
      key: "mechanic",
      label: "Mechanic",
      icon: <Search size={20} />,
      subItems: [
        {
          label: "Find Mechanic",
          href: "/find-mechanic",
          icon: <Search size={16} />,
        },
        { label: "My Jobs", href: "/my-jobs", icon: <FileText size={16} /> },
      ],
    },
    {
      key: "dispatch",
      label: "Dispatch",
      icon: <Truck size={20} />,
      roles: ["Owner", "SubOwner"],
      subItems: [
        {
          label: "Create Load",
          href: "/create-new-load",
          icon: <Truck size={16} />,
        },
        {
          label: "View Load",
          href: "/truck-dispatch",
          icon: <Truck size={16} />,
        },
        // { label: "Carriers", href: "/carriers", icon: <Users size={16} /> },
        {
          label: "Reports",
          href: "/dispatch-reports",
          icon: <Users size={16} />,
        },
      ],
    },
    {
      key: "financial",
      label: "Financial",
      icon: <DollarSign size={20} />,
      subItems: [
        {
          label: "Other Expenses",
          href: "/other-expenses",
          icon: <DollarSign size={16} />,
        },
        {
          label: "Write Check",
          href: "/account/manage-check",
          icon: <CheckSquare size={16} />,
        },
        {
          label: "Pay Invoice",
          href: "/account/pay-invoice",
          icon: <CreditCard size={16} />,
        },
      ],
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={20} />,
      subItems: [
        {
          label: "Manage Team",
          href: "/account/manage-team",
          icon: <Users size={16} />,
        },
        {
          label: "My Companies",
          href: "/my-companies",
          icon: <Building size={16} />,
        },
        {
          label: "Dispatch Settings",
          href: "/dispatch-settings",
          icon: <Settings size={16} />,
        },
      ],
    },
  ];

  const currentNavCategories = isGuest
    ? guestNavItems
    : fullNavCategories.filter((cat) => {
        if (!cat.roles) return true;
        return userData?.role ? cat.roles.includes(userData.role) : false;
      });

  const handleMouseEnter = (key: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredCategory(key);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  const isCategoryActive = (category: NavCategory) => {
    if (category.href) {
      if (category.href === "/" && pathname === "/") return true;
      if (category.href !== "/" && pathname.startsWith(category.href))
        return true;
    }
    if (category.subItems) {
      return category.subItems.some((item) => pathname.startsWith(item.href));
    }
    return false;
  };

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 bg-[#0B132B] flex flex-col items-center py-4 justify-between border-r border-gray-800 select-none print:hidden no-print">
      {/* Top: Logo / Home Link */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          href="/"
          className="h-10 w-10 rounded-xl bg-[#1C2541] flex items-center justify-center text-white hover:bg-[#273469] transition shadow-md"
          title="Rabbit App"
        >
          <Image
            src="/logo-new.png"
            alt="Logo"
            width={28}
            height={28}
            className="object-contain"
          />
        </Link>

        {/* Navigation Categories */}
        <nav className="flex flex-col gap-3 w-full items-center">
          {currentNavCategories.map((cat) => {
            const isActive = isCategoryActive(cat);
            const isHovered = hoveredCategory === cat.key;
            const hasSubItems = Boolean(
              cat.subItems && cat.subItems.length > 0
            );

            return (
              <div
                key={cat.key}
                className="relative flex items-center justify-center w-full"
                onMouseEnter={() => handleMouseEnter(cat.key)}
                onMouseLeave={handleMouseLeave}
              >
                {cat.href ? (
                  <Link
                    href={cat.href}
                    className={clsx(
                      "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-[#F96176] text-white shadow-lg"
                        : "text-gray-400 hover:bg-[#1C2541] hover:text-white"
                    )}
                  >
                    {cat.icon}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={clsx(
                      "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-[#F96176] text-white shadow-lg"
                        : "text-gray-400 hover:bg-[#1C2541] hover:text-white"
                    )}
                  >
                    {cat.icon}
                  </button>
                )}

                {/* Direct Tooltip (if NO subItems) */}
                {!hasSubItems && isHovered && (
                  <div className="pointer-events-none absolute left-16 z-50 ml-1 whitespace-nowrap rounded-lg bg-[#F96176] px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-left-2 duration-150">
                    {cat.label}
                  </div>
                )}

                {/* Flyout Submenu (if HAS subItems) */}
                {hasSubItems && isHovered && cat.subItems && (
                  <div
                    className="absolute left-16 top-0 z-50 ml-2 min-w-[200px] rounded-xl bg-[#0B132B] p-2 shadow-2xl border border-gray-700/80 animate-in fade-in slide-in-from-left-2 duration-150"
                    onMouseEnter={() => handleMouseEnter(cat.key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#F96176] border-b border-gray-800 mb-1">
                      {cat.label}
                    </div>
                    <div className="flex flex-col gap-1">
                      {cat.subItems.map((sub) => {
                        const isSubActive =
                          pathname === sub.href ||
                          pathname.startsWith(sub.href + "/");
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={clsx(
                              "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                              isSubActive
                                ? "bg-[#F96176] text-white font-medium"
                                : "text-gray-300 hover:bg-[#1C2541] hover:text-white"
                            )}
                          >
                            {sub.icon && (
                              <span
                                className={clsx(
                                  isSubActive ? "text-white" : "text-gray-400"
                                )}
                              >
                                {sub.icon}
                              </span>
                            )}
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Notifications, Profile, Logout */}
      <div className="flex flex-col items-center gap-3 w-full pb-2">
        {/* Notifications */}
        <div
          className="relative flex items-center justify-center w-full"
          onMouseEnter={() => handleMouseEnter("notifications")}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href="/account/notifications"
            className={clsx(
              "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
              pathname.startsWith("/account/notifications")
                ? "bg-[#F96176] text-white shadow-lg"
                : "text-gray-400 hover:bg-[#1C2541] hover:text-white"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          {hoveredCategory === "notifications" && (
            <div className="pointer-events-none absolute left-16 z-50 ml-1 whitespace-nowrap rounded-lg bg-[#F96176] px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-left-2 duration-150">
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
            </div>
          )}
        </div>

        {/* Profile Avatar / Quick Menu */}
        <div
          ref={profileMenuRef}
          className="relative flex items-center justify-center w-full"
        >
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="group relative h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-[#F96176] transition-all overflow-hidden focus:outline-none"
            title="My Profile"
          >
            {userData?.profilePicture ? (
              <Image
                src={userData.profilePicture}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full object-cover h-full w-full"
              />
            ) : (
              <div className="h-full w-full bg-[#1C2541] text-gray-300 flex items-center justify-center rounded-full">
                <UserIcon size={20} />
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute left-16 bottom-0 z-50 ml-2 w-64 rounded-xl bg-[#0B132B] p-4 shadow-2xl border border-gray-700/80 animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                {userData?.profilePicture ? (
                  <Image
                    src={userData.profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-[#1C2541] text-gray-300 flex items-center justify-center rounded-full">
                    <UserIcon size={22} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {userData?.userName || user?.displayName || "User"}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {userData?.phoneNumber ||
                      user?.phoneNumber ||
                      user?.email ||
                      ""}
                  </p>
                  {userData?.wallet !== undefined && (
                    <p className="text-xs font-semibold text-[#F96176] mt-0.5">
                      Wallet: ${userData.wallet.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-3">
                <Link
                  href="/account/my-profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <UserIcon size={16} />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/my-companies"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <Building size={16} />
                  <span>My Companies</span>
                </Link>
                <Link
                  href="/account/ratings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <CheckSquare size={16} />
                  <span>Ratings</span>
                </Link>
                <Link
                  href="/history"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <Clock size={16} />
                  <span>History</span>
                </Link>

                <div className="border-t border-gray-800 my-1 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#F96176] hover:bg-[#1C2541] rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div
          className="relative flex items-center justify-center w-full"
          onMouseEnter={() => handleMouseEnter("logout")}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={handleLogout}
            className="group relative h-10 w-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-900/40 hover:text-[#F96176] transition-all duration-200"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
          {hoveredCategory === "logout" && (
            <div className="pointer-events-none absolute left-16 z-50 ml-1 whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-left-2 duration-150">
              Logout
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
