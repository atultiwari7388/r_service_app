"use client";

import React from "react";
import { Power, CheckCircle2, Radio, BellRing, BellOff } from "lucide-react";

interface AvailabilityCardProps {
  isActive: boolean;
  onToggle: (newStatus: boolean) => void;
  className?: string;
  variant?: "hero" | "standalone";
}

export default function AvailabilityCard({
  isActive,
  onToggle,
  className = "",
  variant = "standalone",
}: AvailabilityCardProps) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 relative overflow-hidden ${
        variant === "hero"
          ? "bg-[#1C2541]/90 backdrop-blur-md border border-gray-700/80 shadow-2xl p-5 text-white"
          : "bg-white border border-gray-200/90 shadow-sm hover:shadow-md p-5 text-gray-900"
      } ${className}`}
      role="region"
      aria-label="Availability Status Control"
    >
      {/* Top Header: Title & Indicator Badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive
                ? "bg-[#58BB87] shadow-lg shadow-[#58BB87]/50 animate-ping"
                : "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          <h2
            className={`text-sm font-black uppercase tracking-wider ${
              variant === "hero" ? "text-gray-200" : "text-[#0B132B]"
            }`}
          >
            Your Availability
          </h2>
        </div>

        {/* Live Pill Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase transition-all duration-200 ${
            isActive
              ? "bg-[#58BB87]/20 text-[#58BB87] border border-[#58BB87]/40"
              : "bg-red-50 text-[#F96176] border border-[#F96176]/30"
          }`}
          aria-live="polite"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-[#58BB87] animate-pulse" : "bg-[#F96176]"
            }`}
            aria-hidden="true"
          />
          {isActive ? "Online" : "Offline"}
        </span>
      </div>

      {/* Contextual Status Text */}
      <p
        className={`text-xs sm:text-sm font-semibold mb-4 leading-relaxed ${
          variant === "hero" ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {isActive
          ? "You're online and ready for new jobs."
          : "You're offline and won't receive new job requests."}
      </p>

      {/* Segmented / Toggle Control */}
      <div
        className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
          variant === "hero"
            ? "bg-[#0B132B]/80 border-gray-700"
            : "bg-gray-100 border-gray-200"
        }`}
        role="group"
        aria-label="Set availability state"
      >
        {/* Active Option */}
        <button
          type="button"
          onClick={() => onToggle(true)}
          aria-pressed={isActive}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
            isActive
              ? "bg-[#58BB87] text-white shadow-md shadow-[#58BB87]/30 scale-[1.01]"
              : variant === "hero"
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Active</span>
        </button>

        {/* Inactive Option */}
        <button
          type="button"
          onClick={() => onToggle(false)}
          aria-pressed={!isActive}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
            !isActive
              ? "bg-[#F96176] text-white shadow-md shadow-[#F96176]/30 scale-[1.01]"
              : variant === "hero"
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Power size={15} />
          <span>Inactive</span>
        </button>
      </div>

      {/* Footer Meta indicator */}
      <div
        className={`flex items-center justify-between text-[11px] font-medium mt-3 pt-2.5 border-t ${
          variant === "hero"
            ? "border-gray-800 text-gray-400"
            : "border-gray-100 text-gray-500"
        }`}
      >
        <span className="flex items-center gap-1">
          {isActive ? (
            <>
              <BellRing size={12} className="text-[#58BB87]" />
              <span>Receiving roadside & bay requests</span>
            </>
          ) : (
            <>
              <BellOff size={12} className="text-[#F96176]" />
              <span>Notifications muted</span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <Radio size={11} className={isActive ? "text-[#58BB87] animate-pulse" : "text-gray-400"} />
          {isActive ? "Telemetry 4G" : "Standby"}
        </span>
      </div>
    </div>
  );
}
