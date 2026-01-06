"use client";

import React from "react";
import { Truck, X, Users } from "lucide-react";

/* ---------------- TYPES ---------------- */

export type Screen = "truck-dispatch" | "carriers";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

/* ---------------- MENU CONFIG ---------------- */

const menuItems: {
  id: Screen;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "truck-dispatch",
    label: "Dispatch",
    icon: <Truck className="w-5 h-5" />,
  },
  {
    id: "carriers",
    label: "Carriers",
    icon: <Users className="w-5 h-5" />,
  },
];

/* ---------------- COMPONENT ---------------- */

export default function Sidebar({
  isOpen,
  onClose,
  activeScreen,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      {/* Overlay (mobile) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-48 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F96176] rounded-md flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm">Dispatch</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                activeScreen === item.id
                  ? "bg-[#F96176] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
            <div>
              <p className="text-xs font-medium">John Doe</p>
              <p className="text-[10px] text-gray-500">Manager</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
