"use client";

import React from "react";
import TopBar from "./TopBar";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] w-full max-w-full overflow-x-hidden selection:bg-[#F96176] selection:text-white">
      {/* Fixed AppSidebar on the Left */}
      <AppSidebar />

      {/* Main Content Area shifted right by sidebar width */}
      <div className="flex-1 min-w-0 flex flex-col ml-60 transition-all duration-200">
        <TopBar />
        <main className="flex-1 min-w-0 w-full">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
