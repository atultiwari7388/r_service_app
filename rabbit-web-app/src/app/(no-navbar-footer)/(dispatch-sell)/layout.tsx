"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { Screen } from "../components/Sidebar";
import TruckDispatchScreen from "../screens/TruckDispatchScreen";
import CarriersScreen from "../screens/CarriersScreen";

const SCREEN_BY_PATH: Record<string, Screen> = {
  "/truck-dispatch": "truck-dispatch",
  "/carriers": "carriers",
};

const PATH_BY_SCREEN: Record<Screen, string> = {
  "truck-dispatch": "/truck-dispatch",
  carriers: "/carriers",
};

export default function DispatchShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>("truck-dispatch");

  /* URL → SCREEN */
  useEffect(() => {
    const screen = SCREEN_BY_PATH[pathname];
    if (screen) setActiveScreen(screen);
  }, [pathname]);

  const handleNavigate = (screen: Screen) => {
    setActiveScreen(screen);
    router.replace(PATH_BY_SCREEN[screen]);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar
        // isOpen={sidebarOpen}
        // onClose={() => setSidebarOpen(false)}
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 ml-16">
        {activeScreen === "truck-dispatch" && (
          <TruckDispatchScreen onMenuClick={() => setSidebarOpen(true)} />
        )}

        {activeScreen === "carriers" && (
          <CarriersScreen onMenuClick={() => setSidebarOpen(true)} />
        )}

        {children}
      </main>
    </div>
  );
}
