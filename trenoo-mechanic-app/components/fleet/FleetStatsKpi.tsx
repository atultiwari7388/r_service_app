"use client";

import React from "react";
import {
  Briefcase,
  Activity,
  BellRing,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";

interface FleetStatsKpiProps {
  totalJobs?: number;
  ongoingJobs?: number;
  newRequestsCount?: number;
  completedToday?: number;
}

export default function FleetStatsKpi({
  totalJobs = 1842,
  ongoingJobs = 14,
  newRequestsCount = 4,
  completedToday = 6,
}: FleetStatsKpiProps) {
  const stats = [
    {
      id: "total-jobs",
      label: "TOTAL JOBS",
      headline: totalJobs.toLocaleString(),
      subtext: "1,210 Semi-Trucks • 632 53' Trailers",
      badge: "+18.4% MoM",
      badgeType: "positive",
      icon: <Briefcase size={24} className="text-[#F96176]" />,
      iconBg: "bg-[#FFEBF3]",
      borderColor: "border-[#F96176]/20",
      highlight: true,
    },
    {
      id: "ongoing-jobs",
      label: "ONGOING JOBS",
      headline: ongoingJobs.toString(),
      subtext: "9 In-Shop Bays • 5 Roadside Units",
      badge: "In-Progress",
      badgeType: "active",
      icon: <Activity size={24} className="text-[#58BB87]" />,
      iconBg: "bg-[#EAF8F1]",
      borderColor: "border-[#58BB87]/20",
      highlight: true,
    },
    {
      id: "new-requests",
      label: "NEW JOBS REQUESTS",
      headline: newRequestsCount.toString(),
      subtext: "Awaiting bay & roadside dispatch",
      badge: "Action Needed",
      badgeType: "urgent",
      icon: <BellRing size={24} className="text-amber-500" />,
      iconBg: "bg-amber-50",
      borderColor: "border-amber-200/80",
      highlight: false,
    },
    {
      id: "completed-today",
      label: "COMPLETED TODAY",
      headline: completedToday.toString(),
      subtext: "100% DOT Certified & Cleared",
      badge: "Avg 2.2 hrs",
      badgeType: "success",
      icon: <CheckCircle2 size={24} className="text-[#0078A6]" />,
      iconBg: "bg-cyan-50",
      borderColor: "border-cyan-200/80",
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`bg-white rounded-2xl p-5 border ${stat.borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group`}
        >
          {stat.highlight && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F96176] to-[#58BB87] opacity-80" />
          )}

          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-xl ${stat.iconBg} border border-gray-100 group-hover:scale-105 transition-transform`}
            >
              {stat.icon}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
                stat.badgeType === "positive"
                  ? "bg-[#FFEBF3] text-[#F96176]"
                  : stat.badgeType === "active"
                  ? "bg-[#EAF8F1] text-[#58BB87]"
                  : stat.badgeType === "urgent"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-cyan-50 text-[#0078A6]"
              }`}
            >
              {stat.badge}
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-[#0B132B] tracking-tight">
              {stat.headline}
            </div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span>{stat.label}</span>
              {stat.id === "ongoing-jobs" && (
                <span className="h-2 w-2 rounded-full bg-[#58BB87] animate-ping" />
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1 font-medium">
              {stat.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
