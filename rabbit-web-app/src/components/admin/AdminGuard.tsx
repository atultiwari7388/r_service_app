"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import { isAllowedAdminEmail } from "@/lib/adminConfig";
import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading ?? true;
  const router = useRouter();

  const isAuthorized = Boolean(user && isAllowedAdminEmail(user.email));

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/admin/users")}`);
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in (redirecting)
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Logged in but email not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-[#F96176] flex items-center justify-center mx-auto shadow-xs">
            <ShieldX className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              You are logged in as <span className="font-semibold text-gray-700">{user.email}</span>, which does not have permission to access the Admin Console.
            </p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] text-gray-500">
            Only authorized administrator emails can view and manage admin resources.
          </div>

          <div className="pt-2">
            <Link
              href="/records"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#F96176] hover:bg-[#F96176]/90 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
