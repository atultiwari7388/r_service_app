"use client";

import React from "react";
import { Menu, Bell, HelpCircle } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
  onMenuClick: () => void;
  children?: React.ReactNode;
}

export default function Header({
  title,
  description,
  onMenuClick,
  children,
}: HeaderProps) {
  return (
    <div className="sticky top-0 z-40 px-4 sm:px-6 bg-white border-b border-gray-200 py-3 sm:py-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block truncate">
              {description}
            </p>
          </div>
        </div>

        {/* Right side: Icons and action buttons */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Action buttons passed as children */}
          {children}

          {/* Optional: Notification and Help icons */}
          <button
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition hidden sm:flex"
            title="Help"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Description on mobile - shown below header */}
      <p className="text-xs text-gray-500 mt-1 sm:hidden">{description}</p>
    </div>
  );
}
