"use client";

import React from "react";
import AppSidebar from "@/components/AppSidebar";

export default function DispatchShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 print:bg-white w-full max-w-full overflow-x-hidden">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="flex-1 min-w-0 w-full ml-0 md:ml-16 print:ml-0 print:p-0 print:w-full">
        {children}
      </main>
    </div>
  );
}
