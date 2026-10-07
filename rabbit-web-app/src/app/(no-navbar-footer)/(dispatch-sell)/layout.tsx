"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import TruckDispatchScreen from "../screens/TruckDispatchScreen";
import CarriersScreen from "../screens/CarriersScreen";
import ManageTeamPage from "@/app/(main)/account/manage-team/page";
import DispatchSettingsPage from "@/app/(main)/dispatch-settings/page";

const SCREEN_BY_PATH: Record<string, Screen> = {
  "/truck-dispatch": "truck-dispatch",
  "/carriers": "carriers",
  "/create-new-load": "create-new-load",
};

export type Screen =
  | "truck-dispatch"
  | "carriers"
  | "create-new-load"
  | "manage-team"
  | "settings";

export default function DispatchShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [activeScreen, setActiveScreen] = useState<Screen>("truck-dispatch");

  /* URL → SCREEN */
  useEffect(() => {
    const queryScreen =
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get(
            "screen"
          ) as Screen | null)
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AppSidebar />

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
