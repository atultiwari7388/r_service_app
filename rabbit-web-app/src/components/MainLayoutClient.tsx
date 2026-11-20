"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/AppSidebar";
import { Lock, ArrowRight } from "lucide-react";
import { isAllowedAdminEmail } from "@/lib/adminConfig";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user, isSubscriptionActive, isOwner, isTeamMember } = auth || {
    user: null,
    isSubscriptionActive: false,
    isOwner: false,
    isTeamMember: false,
  };
  const pathname = usePathname();
  const isLoggedIn = Boolean(user);
  const isAdminUser = Boolean(user && isAllowedAdminEmail(user.email));

  const showUnpaidBanner =
    isLoggedIn &&
    !isSubscriptionActive &&
    !isAdminUser &&
    pathname !== "/choose-plan" &&
    pathname !== "/choose-plan/success";

  return (
    <div className="min-h-screen flex flex-col bg-white w-full max-w-full overflow-x-hidden">
      {/* If Logged In, Render AppSidebar on Desktop (hidden on mobile) */}
      {isLoggedIn && (
        <div className="hidden md:block">
          <AppSidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-200 ${
          isLoggedIn ? "md:ml-16" : ""
        }`}
      >
        {/* Sticky Unpaid Subscription Banner */}
        {showUnpaidBanner && (
          <div className="bg-[#F96176] text-white px-4 py-2.5 flex flex-wrap items-center justify-between text-xs sm:text-sm font-bold shadow-md z-40 sticky top-0">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-white shrink-0" />
              <span>
                {isOwner
                  ? "Active Fleet Subscription Required. All operational tools are locked."
                  : "Company Subscription Inactive: Please notify your Company Administrator to renew."}
              </span>
            </div>
            {isOwner && (
              <Link
                href="/choose-plan"
                className="mt-1 sm:mt-0 px-3.5 py-1.5 bg-white text-[#F96176] rounded-lg hover:bg-gray-50 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span>Choose Plan & Unlock</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}

        <TopBar />
        <NavBar />
        <main className="flex-1 min-w-0 w-full">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
