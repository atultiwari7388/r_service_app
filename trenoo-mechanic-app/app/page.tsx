"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/dashboard/HeroSection";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpcomingJobs from "@/components/dashboard/UpcomingJobs";
import CurrentLocationCard from "@/components/dashboard/CurrentLocationCard";
import ServiceCarousel from "@/components/dashboard/ServiceCarousel";
import ServiceShowcase from "@/components/dashboard/ServiceShowcase";
import DashboardCta from "@/components/dashboard/DashboardCta";
import ActiveWorkOrdersTable from "@/components/fleet/ActiveWorkOrdersTable";
import { PhoneCall, Flame } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function HomePage() {
  const { contact } = APP_CONFIG;
  const [isMechanicActive, setIsMechanicActive] = useState<boolean>(true);

  return (
    <MainLayout>
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* 1. TOP 24/7 EMERGENCY DISPATCH TICKER */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] p-3 sm:p-4 text-white border border-gray-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F96176] text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
              <Flame size={12} /> 24/7 Roadside Hotline
            </span>
            <span className="text-gray-200 hidden md:inline">
              Immediate heavy-duty truck & trailer emergency dispatch across freight corridors.
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-gray-400 hidden sm:inline">Direct Dispatch:</span>
            <a
              href={contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs transition-colors shadow-xs"
            >
              <PhoneCall size={13} />
              <span>{contact.phoneDisplay}</span>
            </a>
          </div>
        </div>

        {/* 2. 3D-INSPIRED HERO SECTION (Headline, dimensional truck visual & availability card) */}
        <HeroSection
          isActive={isMechanicActive}
          onToggleAvailability={setIsMechanicActive}
          pendingJobsCount={3}
        />

        {/* 3. DASHBOARD STATISTICS (Upcoming, Completed, Monthly, Rating) */}
        <DashboardStats />

        {/* 4. UPCOMING JOB REQUESTS (3 realistic cards, interactive acceptance, details modal) */}
        <UpcomingJobs />

        {/* 5. CURRENT SERVICE LOCATION CARD (Static demonstration address with map visual) */}
        <CurrentLocationCard />

        {/* 6. TRUCK & TRAILER SERVICE CAROUSEL ("Built for Every Mile") */}
        <ServiceCarousel />

        {/* 7. 3D SERVICE SHOWCASE ("Heavy-Duty Expertise. Reliable Service.") */}
        <ServiceShowcase />

        {/* 8. ACTIVE IN-BAY WORK ORDERS OVERVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight">
                Active Bay Work Orders
              </h2>
              <p className="text-xs text-gray-500">
                Live monitoring of commercial vehicles currently undergoing repairs in shop bays
              </p>
            </div>
          </div>
          <ActiveWorkOrdersTable />
        </div>

        {/* 9. BOTTOM CTA ("Ready to Keep Moving?") */}
        <DashboardCta />
      </div>
    </MainLayout>
  );
}
