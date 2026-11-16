"use client";

import React, { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import MyServicesView from "@/components/services/MyServicesView";
import { RefreshCw } from "lucide-react";

export default function MyServicesPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#F96176] animate-spin" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Loading workshop services...
            </p>
          </div>
        }
      >
        <MyServicesView />
      </Suspense>
    </MainLayout>
  );
}
