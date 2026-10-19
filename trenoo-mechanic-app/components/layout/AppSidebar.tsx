"use client";

import React, { useState } from "react";
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
  Bell,
  Star,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { SIDEBAR_MENU_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContexts";
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

  const [unreadCount] = useState(3);

  const isMenuLinkActive = (href: string) => {
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
    <aside className="fixed left-0 top-0 z-50 h-screen w-60 bg-white flex flex-col justify-between border-r border-gray-200 select-none shadow-xs">
      {/* TOP SECTION: BRAND LOGO + NAVIGATION */}
      <div className="flex flex-col w-full overflow-y-auto no-scrollbar">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-1.5 shadow-2xs group-hover:border-[#F96176] transition-colors">
              <Image
                src="/logo-new.png"
                alt="Trenoo Logo"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-gray-900 tracking-tight leading-tight">
                TRENO<span className="text-[#F96176]">OPS</span>
              </span>
              <span className="text-[10px] font-bold text-[#58BB87] uppercase tracking-wider">
                Fleet Mechanic Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Category Label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
            Operations & Jobs
          </span>
        </div>

        {/* 7 Menus with Icon + Name Together */}
        <nav className="flex flex-col gap-1 px-3 w-full">
          {SIDEBAR_MENU_ITEMS.map((item) => {
            const isActive = isMenuLinkActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-[#F96176] text-white shadow-xs shadow-[#F96176]/25 font-bold"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 transition-transform group-hover:scale-105",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-800"
                  )}
                >
                  {MENU_ICONS[item.key] || <FileText size={18} />}
                </span>
                <span className="truncate flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Profile & Settings direct link */}
          <Link
            href="/profile"
            className={cn(
              "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 mt-1",
              pathname === "/profile"
                ? "bg-[#F96176] text-white shadow-xs shadow-[#F96176]/25 font-bold"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            )}
          >
            <UserIcon
              size={18}
              className={cn(
                "shrink-0",
                pathname === "/profile" ? "text-white" : "text-gray-500 group-hover:text-gray-800"
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
      <div className="p-3 border-t border-gray-100 bg-gray-50/60 flex flex-col gap-2.5 w-full">
        {user ? (
          <>
            {/* Real Mechanic Profile Box */}
            <Link
              href="/profile"
              className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-gray-200/90 hover:border-gray-300 hover:shadow-xs transition group cursor-pointer"
            >
              {/* Avatar with Status Dot */}
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 shadow-2xs">
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
                    <span className="text-[#F96176] font-extrabold">
                      {(mechanic?.userName || mechanic?.workshopName || user?.email || "ME")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                    mechanic?.active !== false ? "bg-[#58BB87]" : "bg-gray-400"
                  )}
                  title={mechanic?.active !== false ? "Active / Online" : "Offline / Busy"}
                />
              </div>

              {/* Info */}
              <div className="overflow-hidden min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#F96176] transition-colors">
                  {mechanic?.workshopName || mechanic?.userName || "Mechanic Account"}
                </h4>
                <p className="text-[11px] text-gray-500 truncate">
                  {mechanic?.email || user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center text-[10px] font-bold text-amber-500">
                    <Star size={10} className="fill-amber-400 text-amber-400 mr-0.5" />
                    4.98
                  </span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-500 font-medium truncate">
                    {[mechanic?.city, mechanic?.state].filter(Boolean).join(", ") || "Bay Hub"}
                  </span>
                </div>
              </div>

              <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
            </Link>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-[#F96176] hover:bg-red-100 font-semibold text-xs transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          /* Guest / Logged Out Action */
          <div className="flex flex-col gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-center">
              <span className="text-xs font-bold text-gray-800 block">Not Signed In</span>
              <span className="text-[11px] text-gray-500 block">
                Access work orders & bay logs
              </span>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-semibold text-xs shadow-xs transition"
            >
              <LogIn size={14} />
              <span>Log In to Portal</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
