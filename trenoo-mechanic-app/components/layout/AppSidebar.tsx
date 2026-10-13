"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { SIDEBAR_MENU_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Map icons to the 7 menus
const MENU_ICONS: Record<string, React.ReactNode> = {
  "find-jobs": <Briefcase size={20} />,
  invoice: <FileText size={20} />,
  check: <CheckSquare size={20} />,
  inspections: <ClipboardCheck size={20} />,
  team: <Users size={20} />,
  reports: <BarChart3 size={20} />,
  export: <Download size={20} />,
};

export default function AppSidebar() {
  const pathname = usePathname();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount] = useState(3);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
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

  const isMenuLinkActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 bg-[#0B132B] flex flex-col items-center py-3.5 justify-between border-r border-gray-800/90 select-none shadow-2xl">
      {/* Top Section: Brand Logo & 7 Menu Items (Direct links, NO submenus) */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Brand Home Button */}
        <Link
          href="/"
          className="group relative h-11 w-11 rounded-xl bg-[#1C2541] flex items-center justify-center text-white hover:bg-[#F96176] transition-all duration-300 shadow-md ring-1 ring-white/10"
          title="Trenoo Fleet & Trailer Hub"
          onMouseEnter={() => setHoveredKey("brand")}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <Image
            src="/logo-new.png"
            alt="Trenoo Logo"
            width={26}
            height={26}
            className="object-contain group-hover:scale-110 transition-transform"
          />
          {/* Logo Tooltip */}
          {hoveredKey === "brand" && (
            <div className="pointer-events-none absolute left-16 z-50 ml-2 whitespace-nowrap rounded-lg bg-[#0B132B] border border-gray-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
              <span className="text-[#F96176] font-extrabold">Trenoo</span> Fleet & Trailer Hub
            </div>
          )}
        </Link>

        {/* 7 Sidebar Menus: Find Jobs, Invoice, Check, Inspections, Team, Reports, Export */}
        <nav className="flex flex-col gap-2 w-full items-center">
          {SIDEBAR_MENU_ITEMS.map((item) => {
            const isActive = isMenuLinkActive(item.href);
            const isHovered = hoveredKey === item.key;

            return (
              <div
                key={item.key}
                className="relative flex items-center justify-center w-full"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-[#F96176] text-white shadow-lg shadow-[#F96176]/30 font-semibold"
                      : "text-gray-400 hover:bg-[#1C2541] hover:text-white"
                  )}
                  aria-label={item.label}
                >
                  {MENU_ICONS[item.key] || <FileText size={20} />}

                  {/* Active Indicator Bar on Left */}
                  {isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-[#F96176]" />
                  )}
                </Link>

                {/* Direct Single-Line Tooltip (No submenus) */}
                {isHovered && (
                  <div className="pointer-events-none absolute left-16 z-50 ml-2 whitespace-nowrap rounded-lg bg-[#0B132B] border border-gray-700/80 px-3 py-1.5 text-xs font-bold text-white shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F96176]" />
                    <span>{item.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: LOGIN BUTTON, Notifications & Profile Avatar */}
      <div className="flex flex-col items-center gap-2.5 w-full pb-1">
        {/* LOGIN BUTTON IN SIDEBAR */}
        <div
          className="relative flex items-center justify-center w-full"
          onMouseEnter={() => setHoveredKey("login-action")}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <Link
            href="/login"
            className={cn(
              "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
              pathname === "/login"
                ? "bg-[#58BB87] text-white shadow-lg shadow-[#58BB87]/30"
                : "bg-[#1C2541] text-[#58BB87] hover:bg-[#58BB87] hover:text-white border border-[#58BB87]/40 shadow-xs"
            )}
            aria-label="Login"
          >
            <LogIn size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
          {hoveredKey === "login-action" && (
            <div className="pointer-events-none absolute left-16 z-50 ml-2 whitespace-nowrap rounded-lg bg-[#58BB87] px-3 py-1.5 text-xs font-bold text-white shadow-xl">
              Portal Sign In / Login
            </div>
          )}
        </div>

        {/* Notifications Icon with Unread Badge */}
        <div
          className="relative flex items-center justify-center w-full"
          onMouseEnter={() => setHoveredKey("notifications")}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <Link
            href="/find-jobs"
            className="group relative h-10 w-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#1C2541] hover:text-white transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F96176] text-[10px] font-bold text-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
          {hoveredKey === "notifications" && (
            <div className="pointer-events-none absolute left-16 z-50 ml-2 whitespace-nowrap rounded-lg bg-[#0B132B] border border-gray-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
              Fleet Alerts ({unreadCount} new requests)
            </div>
          )}
        </div>

        {/* Profile Avatar with Popover */}
        <div ref={profileMenuRef} className="relative flex items-center justify-center w-full">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="group relative h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-[#F96176] transition-all overflow-hidden focus:outline-none bg-[#1C2541] shadow-md cursor-pointer"
            title="Fleet Manager Profile"
            aria-label="Profile"
          >
            <div className="h-full w-full bg-gradient-to-tr from-[#0B132B] to-[#1C2541] text-white flex items-center justify-center text-xs font-bold">
              TM
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#58BB87] ring-2 ring-[#0B132B]" />
          </button>

          {/* Profile Dropdown Card */}
          {isProfileOpen && (
            <div className="absolute left-16 bottom-0 z-50 ml-2 w-72 rounded-2xl bg-[#0B132B] p-4 shadow-2xl border border-gray-700/80 animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#F96176] to-[#ff9900] text-white flex items-center justify-center font-bold text-sm shadow">
                  HD
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-white truncate">
                    Master Fleet Technician
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    team@trenoops.com
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400">
                      <Star size={12} fill="currentColor" /> 4.98
                    </span>
                    <span className="text-[10px] text-gray-400">• Fresno Bay #3</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="my-3 p-2.5 rounded-xl bg-[#1C2541] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Fleet Shop Status
                  </span>
                  <p className="text-xs font-bold text-[#58BB87]">DOT Certified Bay</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#58BB87]/20 text-[#58BB87] text-[11px] font-bold">
                  Online
                </span>
              </div>

              {/* Menu Links */}
              <div className="flex flex-col gap-1 text-xs">
                <Link
                  href="/team"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <Users size={14} className="text-gray-400" />
                  <span>Manage Mechanics & Bays</span>
                </Link>
                <Link
                  href="/inspections"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-[#1C2541] hover:text-white rounded-lg transition-colors"
                >
                  <ShieldCheck size={14} className="text-[#58BB87]" />
                  <span>DOT Annual Certifications</span>
                </Link>
                <div className="border-t border-gray-800 my-1 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[#F96176] hover:bg-red-950/40 rounded-lg transition-colors font-semibold"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
