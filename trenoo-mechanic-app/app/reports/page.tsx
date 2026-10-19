"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
              <BarChart3 size={14} />
              <span>Fleet Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mt-1">
              Shop Reports & Fleet Analytics
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Bay utilization metrics, turnaround averages, parts margin, and DOT compliance history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Exporting monthly analytics report.")}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span>Export Full Analytics</span>
            </button>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Bay Turnaround Average</span>
            <div className="text-3xl font-black text-gray-900 mt-2">3.4 Hours</div>
            <p className="text-xs text-[#58BB87] font-semibold mt-1">
              ↓ 18% reduction in truck downtime
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Monthly DOT Pass Rate</span>
            <div className="text-3xl font-black text-[#58BB87] mt-2">99.4%</div>
            <p className="text-xs text-gray-500 mt-1">
              142 passed out of 143 total inspections
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Commercial Fleet Uptime</span>
            <div className="text-3xl font-black text-[#F96176] mt-2">98.8%</div>
            <p className="text-xs text-gray-500 mt-1">
              Measured across 48 commercial carrier accounts
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
