"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContexts";
import MainLayout from "@/components/layout/MainLayout";
import MechanicDashboardView from "@/components/dashboard/MechanicDashboardView";
import LandingPage from "@/components/landing/LandingPage";

export default function HomePage() {
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading ?? false;

  // While checking auth state, show a clean, non-intrusive loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B132B] flex items-center justify-center shadow-lg border border-gray-800">
            <span className="w-6 h-6 border-2 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Loading Trenoo Mechanic...
          </span>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the full mechanic dashboard with sidebar
  if (user) {
    return (
      <MainLayout>
        <MechanicDashboardView />
      </MainLayout>
    );
  }

  // If user is not logged in (first time / visitor), render the static landing page (NO sidebar)
  return <LandingPage />;
}
