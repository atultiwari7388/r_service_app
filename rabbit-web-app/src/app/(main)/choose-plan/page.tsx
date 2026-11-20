"use client";

import React, { Suspense } from "react";
import OwnerChoosePlanView from "@/components/subscription/OwnerChoosePlanView";

export default function ChoosePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">
            Loading subscription plans...
          </p>
        </div>
      }
    >
      <OwnerChoosePlanView />
    </Suspense>
  );
}
