"use client";

import React, { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import MechanicProfileView from "@/components/profile/MechanicProfileView";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#F96176]" />
            <p className="text-gray-500 font-medium text-sm">
              Loading mechanic profile...
            </p>
          </div>
        }
      >
        <MechanicProfileView />
      </Suspense>
    </MainLayout>
  );
}
