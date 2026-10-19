"use client";

import MainLayout from "@/components/layout/MainLayout";
import MechanicDashboardView from "@/components/dashboard/MechanicDashboardView";

export default function HomePage() {
  return (
    <MainLayout>
      <MechanicDashboardView />
    </MainLayout>
  );
}
