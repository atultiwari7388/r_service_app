"use client";

import React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Database, User, LogOut } from "lucide-react";
import AuthContextProvider, { useAuth } from "@/contexts/AuthContexts";

function AdminHeader() {
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/records"
            className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </Link>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F96176] flex items-center justify-center font-bold text-white shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                TrenoOps Admin Console
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F96176] text-white rounded-full">
                  PROTECTED
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                metadata &rarr; serviceData &rarr; data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
              <User className="w-3.5 h-3.5 text-[#F96176]" />
              <span className="text-slate-300 font-mono text-[11px] max-w-[150px] sm:max-w-xs truncate" title={user.email || ""}>
                {user.email || "Authenticated User"}
              </span>
              {logout && (
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="ml-1 text-slate-400 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster position="top-right" />
      <NextUIProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
          <AdminHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </NextUIProvider>
    </AuthContextProvider>
  );
}
