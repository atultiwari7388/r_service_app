"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import ActiveWorkOrdersTable from "@/components/fleet/ActiveWorkOrdersTable";
import { Briefcase, Plus } from "lucide-react";

export default function FindJobsPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
              <Briefcase size={14} />
              <span>Fleet Operations</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mt-1">
              Find Jobs & Work Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Commercial semi-truck and trailer bay allocations, diagnostics, and repairs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("New Work Order modal will open.")}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>New Work Order</span>
            </button>
          </div>
        </div>

        {/* Live Work Orders Table */}
        <ActiveWorkOrdersTable />
      </div>
    </MainLayout>
  );
}
