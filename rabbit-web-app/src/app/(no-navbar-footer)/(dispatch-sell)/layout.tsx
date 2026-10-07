"use client";

import React from "react";
import AppSidebar from "@/components/AppSidebar";

export default function DispatchShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 print:bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16 print:ml-0 print:p-0 print:w-full">{children}</main>
    </div>
  );
}
