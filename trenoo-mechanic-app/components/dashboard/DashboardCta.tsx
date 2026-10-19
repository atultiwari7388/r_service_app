"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, ArrowRight, Truck, CheckCircle2 } from "lucide-react";

export default function DashboardCta() {
  return (
    <section className="rounded-3xl bg-white text-gray-900 p-8 sm:p-12 border border-gray-200 shadow-xs relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
      {/* Background Accent */}
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#F96176]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-0 w-80 h-80 bg-[#58BB87]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-gray-700 text-xs font-bold uppercase tracking-wider border border-red-100">
          <Truck size={14} className="text-[#F96176]" />
          <span>TrenoOps Heavy-Duty Dispatch Network</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Ready to Keep Moving?
        </h2>

        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
          Manage your availability and stay prepared for your next service request.
        </p>

        <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-gray-500 pt-2 font-medium flex-wrap">
          <span className="flex items-center gap-1.5 text-gray-700">
            <CheckCircle2 size={14} className="text-[#58BB87]" />
            Immediate Dispatch Alerts
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-gray-700">
            <CheckCircle2 size={14} className="text-[#58BB87]" />
            Guaranteed Fleet Invoicing
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-gray-700">
            <CheckCircle2 size={14} className="text-[#58BB87]" />
            DOT Compliance Logs
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 justify-center">
        <a
          href="#upcoming-jobs"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-extrabold text-sm shadow-md shadow-[#F96176]/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Briefcase size={18} />
          <span>View Job Requests</span>
        </a>

        <Link
          href="/find-jobs"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm border border-gray-300/80 transition-colors"
        >
          <span>Find Jobs Board</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
