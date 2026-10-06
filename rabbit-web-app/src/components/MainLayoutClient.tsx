"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContexts";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/AppSidebar";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth() || { user: null };
  const isLoggedIn = Boolean(user);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* If Logged In, Render AppSidebar on Desktop (hidden on mobile) */}
      {isLoggedIn && (
        <div className="hidden md:block">
          <AppSidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isLoggedIn ? "md:ml-16" : ""
        }`}
      >
        <TopBar />
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
