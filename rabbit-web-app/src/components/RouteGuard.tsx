"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import { isAllowedAdminEmail } from "@/lib/adminConfig";
import { ShieldAlert, LogOut } from "lucide-react";

// Publicly accessible pages without requiring login
const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/about-us",
  "/contact-us",
  "/find-mechanic",
  "/privacy-policy",
  "/terms-condition",
  "/rating-policy",
  "/refund-policy",
  "/choose-plan",
  "/choose-plan/success",
]);

// Auth-specific pages (accessible when not logged in)
const AUTH_ROUTES = new Set([
  "/login",
  "/sign-up",
  "/forgot-password",
]);

// Protected routes that Guest / Phone Auth users are permitted to access
const GUEST_ROUTE_PREFIXES = [
  "/my-jobs",
  "/history",
];

const isGuestRoute = (pathname: string): boolean => {
  if (!pathname) return false;
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return GUEST_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
};

// Prefixes that are public (static assets, API endpoints, etc.)
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/fonts",
  "/images",
  "/icons",
];

const isPublicRoute = (pathname: string): boolean => {
  if (!pathname) return true;
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (PUBLIC_EXACT_ROUTES.has(normalized) || AUTH_ROUTES.has(normalized)) {
    return true;
  }

  for (const prefix of PUBLIC_PREFIXES) {
    if (normalized.startsWith(prefix)) return true;
  }

  return false;
};

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading ?? true;
  const isSubscriptionActive = auth?.isSubscriptionActive ?? false;
  const isOwner = auth?.isOwner ?? false;
  const isTeamMember = auth?.isTeamMember ?? false;
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = isPublicRoute(pathname);
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const isAuthPage = AUTH_ROUTES.has(normalizedPath);
  const isGuestAllowed = isGuestRoute(normalizedPath) || isPublic;
  const isAdminUser = Boolean(user && isAllowedAdminEmail(user.email));

  useEffect(() => {
    if (isLoading) return;

    // Detect user authentication type
    const isPhoneOrGuestUser = Boolean(
      user && (user.phoneNumber || user.isAnonymous)
    );
    const isEmailVerifiedUser = Boolean(user && user.emailVerified);

    // 1. Not logged in at all
    if (!user) {
      if (!isPublic) {
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?redirect=${returnUrl}`);
      }
      return;
    }

    // 2. Phone Auth / Guest User (verified via Phone OTP)
    if (isPhoneOrGuestUser) {
      if (normalizedPath === "/login") {
        router.replace("/my-jobs");
      } else if (normalizedPath === "/sign-up") {
        return;
      } else if (!isGuestAllowed) {
        router.replace("/my-jobs");
      }
      return;
    }

    // 3. Email User who is verified
    if (isEmailVerifiedUser) {
      // If user is on an Auth page (like /login or /sign-up)
      if (isAuthPage) {
        if (!isSubscriptionActive) {
          router.replace("/choose-plan");
        } else {
          router.replace("/records");
        }
        return;
      }

      // ==============================================================
      // STRICT SUBSCRIPTION PAYWALL ENFORCEMENT FOR LOGGED-IN USERS
      // (Admin bypass disabled as requested to test checkout flow)
      // ==============================================================
      if (!isSubscriptionActive) {
        const isAllowedUnpaid =
          normalizedPath === "/choose-plan" ||
          normalizedPath === "/choose-plan/success" ||
          normalizedPath === "/account/my-profile";

        if (!isAllowedUnpaid) {
          router.replace("/choose-plan");
          return;
        }
      }

      return;
    }

    // 4. Email User who has NOT verified their email
    if (!isPublic) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${returnUrl}`);
    }
  }, [
    user,
    isLoading,
    isSubscriptionActive,
    isOwner,
    isAdminUser,
    pathname,
    isPublic,
    isAuthPage,
    isGuestAllowed,
    normalizedPath,
    router,
  ]);

  // Loading state when checking authentication
  if (isLoading && !isPublic && normalizedPath !== "/choose-plan") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500 tracking-wide">
            Verifying account permissions...
          </p>
        </div>
      </div>
    );
  }

  // Redirecting state when not logged in
  if (!isLoading && !user && !isPublic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500 tracking-wide">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Lockout screen for Team Members if their Company Owner has not purchased a plan
  const isTeamMemberUnpaid =
    !isLoading &&
    user &&
    isTeamMember &&
    !isSubscriptionActive &&
    !(isAdminUser && normalizedPath.startsWith("/admin")) &&
    normalizedPath !== "/account/my-profile" &&
    normalizedPath !== "/login";

  if (isTeamMemberUnpaid) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Company Subscription Inactive
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your company administrator has not activated or renewed their fleet membership subscription yet. Protected fleet tools are temporarily locked.
          </p>
          <p className="text-xs text-gray-400">
            Please ask your company owner to log in and renew their subscription plan.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => auth?.logout?.()}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
