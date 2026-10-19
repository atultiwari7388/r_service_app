"use client";

import React from "react";
import {
  Briefcase,
  CheckCircle2,
  Calendar,
  Star,
  Info,
  TrendingUp,
} from "lucide-react";
import { MOCK_DASHBOARD_STATS } from "@/data/mockServices";

export default function DashboardStats() {
  const stats = [
    {
      id: "upcoming",
      label: MOCK_DASHBOARD_STATS.upcomingJobsLabel,
      value: MOCK_DASHBOARD_STATS.upcomingJobs.toString(),
      subtext: MOCK_DASHBOARD_STATS.upcomingJobsSub,
      icon: <Briefcase size={22} className="text-[#F96176]" />,
      iconBg: "bg-[#FFEBF3]",
      badge: "Action Required",
      badgeColor: "bg-[#FFEBF3] text-[#F96176]",
    },
    {
      id: "completed",
      label: MOCK_DASHBOARD_STATS.completedJobsLabel,
      value: MOCK_DASHBOARD_STATS.completedJobs.toLocaleString(),
      subtext: MOCK_DASHBOARD_STATS.completedJobsSub,
      icon: <CheckCircle2 size={22} className="text-[#58BB87]" />,
      iconBg: "bg-[#EAF8F1]",
      badge: "Lifetime Units",
      badgeColor: "bg-[#EAF8F1] text-[#58BB87]",
    },
    {
      id: "month",
      label: MOCK_DASHBOARD_STATS.jobsThisMonthLabel,
      value: MOCK_DASHBOARD_STATS.jobsThisMonth.toString(),
      subtext: MOCK_DASHBOARD_STATS.jobsThisMonthSub,
      icon: <Calendar size={22} className="text-[#F96176]" />,
      iconBg: "bg-blue-50",
      badge: "+16.8%",
      badgeColor: "bg-blue-50 text-[#F96176]",
    },
    {
      id: "rating",
      label: MOCK_DASHBOARD_STATS.averageRatingLabel,
      value: `${MOCK_DASHBOARD_STATS.averageRating} ★`,
      subtext: MOCK_DASHBOARD_STATS.averageRatingSub,
      icon: <Star size={22} className="text-amber-500 fill-amber-500" />,
      iconBg: "bg-amber-50",
      badge: "Top Rated",
      badgeColor: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <section className="space-y-4">
      {/* Header with Demo Disclosure */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#F96176]" />
          Operational Performance Metrics
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
          <Info size={12} className="text-gray-400" />
          <span>Sample Metrics (Demonstration Data)</span>
        </span>
      </div>

      {/* 4 Responsive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between card-3d"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} border border-gray-100`}>
                {stat.icon}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${stat.badgeColor}`}
              >
                {stat.badge}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-black text-gray-600 uppercase tracking-wider mt-0.5">
                {stat.label}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-medium">
                {stat.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
