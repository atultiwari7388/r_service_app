"use client";

import React from "react";
import TopBar from "./TopBar";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContexts";
import { Menu, PhoneCall, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { toggleMobile } = useSidebar();
  const auth = useAuth();
  const user = auth?.user;
  const mechanic = auth?.mechanicProfile;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] w-full max-w-full overflow-x-hidden selection:bg-[#F96176] selection:text-white">
      {/* AppSidebar (Handles both desktop collapsed/expanded and mobile drawer) */}
      <AppSidebar />

      {/* Main Content Area shifted right on desktop, flush on mobile */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ml-0 md:ml-64">
        {/* Mobile Header Bar (< md only) */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMobile}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition active:scale-95 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/treno_mechanic_logo.png"
                alt="Trenoo Mechanic"
                width={135}
                height={34}
                className="h-8 w-auto max-w-[135px] object-contain drop-shadow-2xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-new.png";
                }}
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={APP_CONFIG.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-emerald-50 text-[#58BB87] border border-emerald-200 transition"
              title="Roadside Hotline"
            >
              <PhoneCall size={16} />
            </a>

            <Link
              href={user ? "/profile" : "/login"}
              className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
              title={user ? "Profile" : "Sign In"}
            >
              {mechanic?.profilePicture ? (
                <img
                  src={mechanic.profilePicture}
                  alt="Profile"
                  className="w-6 h-6 rounded-lg object-cover"
                />
              ) : (
                <UserIcon size={16} className="text-gray-600" />
              )}
            </Link>
          </div>
        </header>

        <TopBar />
        <main className="flex-1 min-w-0 w-full">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
