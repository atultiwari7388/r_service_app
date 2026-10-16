"use client";

import React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import AuthContextProvider from "@/contexts/AuthContexts";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster position="top-right" />
      <NextUIProvider>
        <AdminGuard>
          <div className="min-h-screen bg-gray-50/60 text-gray-900 flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen lg:overflow-y-auto">
              <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </AdminGuard>
      </NextUIProvider>
    </AuthContextProvider>
  );
}
