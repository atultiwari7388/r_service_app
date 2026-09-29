"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";

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
]);

// Auth-specific pages (accessible when not logged in)
const AUTH_ROUTES = new Set([
  "/login",
  "/sign-up",
  "/forgot-password",
]);

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
  // Normalize pathname: remove trailing slash except root "/"
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
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = isPublicRoute(pathname);
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const isAuthPage = AUTH_ROUTES.has(normalizedPath);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isPublic) {
      // User is not logged in and route is protected -> redirect to /login
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${returnUrl}`);
    } else if (user && isAuthPage) {
      // User is already logged in but visits /login, /sign-up -> redirect to /records
      router.replace("/records");
    }
  }, [user, isLoading, pathname, isPublic, isAuthPage, router]);

  // If auth is still resolving on a protected route, show clean loading state
  if (isLoading && !isPublic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500 tracking-wide">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // If user is definitely not logged in on a protected route, show redirecting state
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

  return <>{children}</>;
}
