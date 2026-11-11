"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Users,
  BarChart3,
  Download,
  LogIn,
  Star,
  LogOut,
  User as UserIcon,
  ChevronRight,
  X,
} from "lucide-react";
import { SIDEBAR_MENU_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContexts";
import { useSidebar } from "@/contexts/SidebarContext";
import toast from "react-hot-toast";

// Map icons to the 7 menus
const MENU_ICONS: Record<string, React.ReactNode> = {
  "find-jobs": <Briefcase size={18} />,
  invoice: <FileText size={18} />,
  check: <CheckSquare size={18} />,
  inspections: <ClipboardCheck size={18} />,
  team: <Users size={18} />,
  reports: <BarChart3 size={18} />,
  export: <Download size={18} />,
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanic = auth?.mechanicProfile;
  const logout = auth?.logout;

  const { isMobileOpen, closeMobile } = useSidebar();

  const isMember =
    mechanic?.role === "member" ||
    !!mechanic?.ownerId ||
    mechanic?.isTeamMember === true;

  // Filter menu items: Members ONLY see "Find Jobs", Owners see all 7 items
  const menuItems = isMember
    ? SIDEBAR_MENU_ITEMS.filter((item) => item.key === "find-jobs")
    : SIDEBAR_MENU_ITEMS;

  const isMenuLinkActive = (href: string) => {
    if (href === "/find-jobs" && (pathname === "/find-jobs" || pathname === "/")) {
      return true;
    }
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs transition-opacity duration-300"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR ASIDE - STREAMLINED WIDTH (w-56) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-56 bg-white flex flex-col justify-between border-r border-gray-200 select-none shadow-xs transition-transform duration-300 ease-in-out",
          // Mobile responsive drawer: slide in / out
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* TOP SECTION: LOGO + NAVIGATION */}
        <div className="flex flex-col w-full overflow-y-auto no-scrollbar">
          {/* Header with Treno Mechanic Logo */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <Link
              href={isMember ? "/find-jobs" : "/"}
              onClick={closeMobile}
              className="flex items-center group transition-transform hover:opacity-90"
            >
              <div className="relative h-8 w-auto flex items-center">
                <Image
                  src="/assets/treno_mechanic_logo.png"
                  alt="Treno Mechanic Logo"
                  width={140}
                  height={35}
                  priority
                  className="h-8 w-auto max-w-[145px] object-contain drop-shadow-2xs"
                />
              </div>
            </Link>

            {/* Mobile Close Drawer Button */}
            <button
              type="button"
              onClick={closeMobile}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Category Label */}
          <div className="px-4 pt-4 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {isMember ? "Technician Portal" : "Operations & Jobs"}
            </span>
          </div>

          {/* Menus + Profile Link (Members ONLY see Find Jobs & My Profile) */}
          <nav className="flex flex-col gap-1 px-2.5 w-full">
            {menuItems.map((item) => {
              const isActive = isMenuLinkActive(item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150",
                    isActive
                      ? "bg-[#F96176] text-white shadow-xs font-semibold"
                      : "text-gray-600 hover:bg-gray-100/90 hover:text-gray-900 font-medium"
                  )}
                  aria-label={item.label}
                >
                  <span
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-105",
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-900"
                    )}
                  >
                    {MENU_ICONS[item.key] || <FileText size={17} />}
                  </span>

                  <span className="truncate flex-1">{item.label}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </Link>
              );
            })}

            {/* Profile Link */}
            <Link
              href="/profile"
              onClick={closeMobile}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 mt-1",
                pathname === "/profile"
                  ? "bg-[#F96176] text-white shadow-xs font-semibold"
                  : "text-gray-600 hover:bg-gray-100/90 hover:text-gray-900 font-medium"
              )}
              aria-label="My Profile"
            >
              <UserIcon
                size={17}
                className={cn(
                  "shrink-0",
                  pathname === "/profile"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-900"
                )}
              />
              <span className="truncate flex-1">My Profile</span>
              {pathname === "/profile" && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              )}
            </Link>
          </nav>
        </div>

        {/* BOTTOM SECTION: REAL MECHANIC CARD & LOGOUT / LOGIN */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70 flex flex-col gap-2 w-full">
          {user ? (
            <>
              {/* Profile Card */}
              <Link
                href="/profile"
                onClick={closeMobile}
                className="flex items-center gap-2.5 p-2 rounded-2xl bg-white border border-gray-200/90 hover:border-gray-300 transition group cursor-pointer"
                title={
                  mechanic?.workshopName || mechanic?.userName || "My Profile"
                }
              >
                {/* Avatar with Status Ring */}
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 shadow-2xs">
                    {mechanic?.profilePicture || mechanic?.mDp ? (
                      <img
                        src={mechanic.profilePicture || mechanic.mDp}
                        alt={mechanic.userName || "Mechanic"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as any).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-[#F96176] font-extrabold text-xs">
                        {(
                          mechanic?.userName ||
                          mechanic?.workshopName ||
                          user?.email ||
                          "ME"
                        )
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                      mechanic?.active !== false
                        ? "bg-[#58BB87]"
                        : "bg-gray-400"
                    )}
                  />
                </div>

                {/* Profile Text */}
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#F96176] transition-colors">
                      {mechanic?.userName ||
                        mechanic?.workshopName ||
                        "Technician"}
                    </h4>
                    {isMember && (
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-[#58BB87] border border-emerald-200 rounded text-[9px] font-bold shrink-0">
                        Tech
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">
                    {mechanic?.email || user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="flex items-center text-[10px] font-bold text-amber-500">
                      <Star
                        size={10}
                        className="fill-amber-400 text-amber-400 mr-0.5"
                      />
                      {mechanic?.rating ? Number(mechanic.rating).toFixed(1) : "5.0"}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-gray-500 font-medium truncate">
                      {mechanic?.baseCity ||
                        [mechanic?.city, mechanic?.state]
                          .filter(Boolean)
                          .join(", ") ||
                        "USA Bay"}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-gray-400 group-hover:text-gray-600 shrink-0"
                />
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 py-2 px-3 w-full rounded-xl border border-red-200 bg-red-50 text-[#F96176] hover:bg-red-100 font-semibold text-xs transition cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            /* Guest / Login prompt */
            <div className="flex flex-col gap-2 w-full">
              <div className="p-2 rounded-xl bg-white border border-gray-200 text-center">
                <span className="text-xs font-bold text-gray-800 block">
                  Not Signed In
                </span>
                <span className="text-[10px] text-gray-500 block">
                  Access work orders
                </span>
              </div>
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 py-2 px-3 w-full rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-semibold text-xs shadow-xs transition"
                title="Portal Sign In"
                aria-label="Portal Sign In"
              >
                <LogIn size={16} />
                <span>Sign In to Portal</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
