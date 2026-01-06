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
    <div className="sticky top-0 z-40 md:px-6 bg-white border-b border-gray-200 py-4">
      <div className="flex items-center justify-between ">
        {/* Left side: Hamburger + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
            aria-label="Toggle menu"
          >
            <Menu />
          </button>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-sm text-gray-600 hidden md:block">
              {description}
            </p>
          </div>
        </div>

        {/* Right side: Icons and action buttons */}
        <div className="flex items-center gap-4">
          {/* Action buttons passed as children */}
          {children}

          {/* Optional: Notification and Help icons */}
          <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description on mobile - shown below the header */}
      <p className="text-sm text-gray-600 mt-2 md:hidden">{description}</p>
    </div>
  );
}
