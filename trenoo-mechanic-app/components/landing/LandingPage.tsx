"use client";

import React from "react";
import LandingNavbar from "./LandingNavbar";
import LandingHero from "./LandingHero";
import LandingAbout from "./LandingAbout";
import LandingAppFeatures from "./LandingAppFeatures";
import LandingDownloadApp from "./LandingDownloadApp";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] w-full max-w-full overflow-x-hidden selection:bg-[#F96176] selection:text-white">
      {/* Landing Navigation with TopBar + Logo + Links + Login/Register (NO Sidebar) */}
      <LandingNavbar />

      {/* Main Landing Page Content */}
      <main className="flex-1 w-full">
        {/* 1. Hero Component */}
        <LandingHero />

        {/* 2. About Component */}
        <LandingAbout />

        {/* 3. App Features Component with 3 Phone Screenshots */}
        <LandingAppFeatures />

        {/* 4. Android & iOS App Download Component */}
        <LandingDownloadApp />
      </main>

      {/* Standard Complete Footer */}
      <Footer />
    </div>
  );
}
