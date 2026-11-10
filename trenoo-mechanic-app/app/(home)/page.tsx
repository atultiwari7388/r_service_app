"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import MainLayout from "@/components/layout/MainLayout";
import MechanicDashboardView from "@/components/dashboard/MechanicDashboardView";
import LandingPage from "@/components/landing/LandingPage";

export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanic = auth?.mechanicProfile;
  const isLoading = auth?.isLoading ?? false;

  useEffect(() => {
    if (!isLoading && user && mechanic) {
      if (mechanic.isSubscriptionPurchase !== true) {
        router.push(
          `/choose-plan?mechanicId=${user.uid}&email=${encodeURIComponent(user.email || "")}`
        );
      }
    }
  }, [isLoading, user, mechanic, router]);

  // While checking auth state, show a clean, non-intrusive loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B132B] flex items-center justify-center shadow-lg border border-gray-800">
            <span className="w-6 h-6 border-2 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Loading Treno Mechanic...
          </span>
        </div>
      </div>
    );
  }

  // If user is authenticated, check subscription before rendering dashboard
  if (user) {
    if (mechanic && mechanic.isSubscriptionPurchase !== true) {
      return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <span className="w-6 h-6 border-2 border-[#F96176] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Redirecting to plan selection...
            </span>
          </div>
        </div>
      );
    }

    return (
      <MainLayout>
        <MechanicDashboardView />
      </MainLayout>
    );
  }

  // If user is not logged in (first time / visitor), render the static landing page (NO sidebar)
  return <LandingPage />;
}
