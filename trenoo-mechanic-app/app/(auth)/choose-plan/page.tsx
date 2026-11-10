"use client";

import React, { Suspense } from "react";
import ChoosePlanView from "@/components/subscription/ChoosePlanView";

export default function ChoosePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-3 border-[#58BB87] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-600">
            Loading subscription plans...
          </p>
        </div>
      }
    >
      <ChoosePlanView />
    </Suspense>
  );
}
