"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { Screen } from "../components/Sidebar";
import TruckDispatchScreen from "../screens/TruckDispatchScreen";
import CarriersScreen from "../screens/CarriersScreen";
import ManageTeamPage from "@/app/(main)/account/manage-team/page";
import DispatchSettingsPage from "@/app/(main)/dispatch-settings/page";

const SCREEN_BY_PATH: Record<string, Screen> = {
  "/truck-dispatch": "truck-dispatch",
  "/carriers": "carriers",
  "/create-new-load": "create-new-load",
};

const PATH_BY_SCREEN: Record<Screen, string> = {
  "truck-dispatch": "/truck-dispatch",
  carriers: "/carriers",
  "create-new-load": "/create-new-load",
  "manage-team": "/truck-dispatch?screen=manage-team",
  settings: "/truck-dispatch?screen=settings",
};

export default function DispatchShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeScreen, setActiveScreen] = useState<Screen>("truck-dispatch");

  /* URL → SCREEN */
  useEffect(() => {
    const queryScreen =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("screen")
        : null;
    if (pathname === "/truck-dispatch") {
      if (queryScreen === "manage-team" || queryScreen === "settings") {
        setActiveScreen(queryScreen);
        return;
      }
    }

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
          <TruckDispatchScreen onMenuClick={() => {}} />
        )}

        {activeScreen === "carriers" && (
          <CarriersScreen onMenuClick={() => {}} />
        )}

        {activeScreen === "manage-team" && <ManageTeamPage />}

        {activeScreen === "settings" && <DispatchSettingsPage />}

        {children}
      </main>
    </div>
  );
}
