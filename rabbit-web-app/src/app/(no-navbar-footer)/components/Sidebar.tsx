"use client";

import clsx from "clsx";
import { Truck, Users, Home } from "lucide-react";

export type Screen = "truck-dispatch" | "carriers";

type SidebarProps = {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
};

const NAV_ITEMS: {
  key: Screen;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "truck-dispatch",
    label: "Truck Dispatch",
    icon: <Truck size={20} />,
  },
  {
    key: "carriers",
    label: "Carriers",
    icon: <Users size={20} />,
  },
];

export default function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 bg-[#0B132B] flex flex-col items-center py-6">
      {/* Logo / Home */}
      <div className="mb-10">
        <button
          aria-label="Home"
          className="h-10 w-10 rounded-xl bg-[#1C2541] flex items-center justify-center text-white hover:bg-[#273469] transition"
        >
          <Home size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.key;

          return (
            <button
              key={item.key}
              aria-label={item.label}
              onClick={() => onNavigate(item.key)}
              className={clsx(
                "group relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-[#F96176] text-white"
                  : "text-gray-400 hover:bg-[#F96176] hover:text-white"
              )}
            >
              {item.icon}

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-md bg-[#F96176] px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
