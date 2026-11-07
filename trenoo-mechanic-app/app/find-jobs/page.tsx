"use client";

import React, { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import JobsBoardDirectory from "@/components/fleet/JobsBoardDirectory";
import { Briefcase, RefreshCw } from "lucide-react";

export default function FindJobsPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
              <Briefcase size={14} />
              <span>Fleet Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Find Jobs & Work Orders Board
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Real-time commercial dispatch requests, ongoing repairs, completed work orders, and cancellation history.
            </p>
          </div>

          {/* New Work Order button commented out as requested */}
          {/*
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("New Work Order modal will open.")}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>New Work Order</span>
            </button>
          </div>
          */}
        </div>

        {/* Live 4-Tab Jobs Board Directory with Pagination & Filters */}
        <Suspense
          fallback={
            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-[#F96176]" />
              <span className="text-xs font-semibold">Loading Jobs Board...</span>
            </div>
          }
        >
          <JobsBoardDirectory />
        </Suspense>
      </div>
    </MainLayout>
  );
}
