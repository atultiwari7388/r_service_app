"use client";

import React, { useState } from "react";
import {
  Power,
  MapPin,
  Clock,
  Radio,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

interface MechanicDutyControlProps {
  onStatusChange?: (isActive: boolean) => void;
}

export default function MechanicDutyControl({
  onStatusChange,
}: MechanicDutyControlProps) {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [lastToggled, setLastToggled] = useState<string>("Today, 07:00 AM PST");

  const handleToggle = (newStatus: boolean) => {
    setIsActive(newStatus);
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastToggled(`Today, ${now} PST`);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4 sm:p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Mechanic Bay Info & Live Address */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
              isActive
                ? "bg-[#EAF8F1] text-[#58BB87] border border-[#58BB87]/30 shadow-xs"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <Truck size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-[#0B132B] tracking-tight">
                Bay #3 & Mobile Unit 01 — Heavy-Duty Dispatch
              </h2>
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide uppercase transition-colors duration-300 ${
                  isActive
                    ? "bg-[#EAF8F1] text-[#58BB87] border border-[#58BB87]/40"
                    : "bg-red-50 text-[#F96176] border border-[#F96176]/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-[#58BB87] animate-pulse" : "bg-[#F96176]"
                  }`}
                />
                {isActive ? "ACTIVE • DISPATCH READY" : "INACTIVE • ON BREAK"}
              </span>
            </div>

            {/* Live Address & Shift Details */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 flex-wrap">
              <div className="flex items-center gap-1 font-semibold text-gray-800">
                <MapPin size={13} className="text-[#F96176]" />
                <span>Live Address:</span>
                <span className="text-[#0B132B] font-bold">
                  {APP_CONFIG.contact.address}
                </span>
                <span className="text-gray-400 font-normal hidden sm:inline">
                  (Fresno Commercial Corridor)
                </span>
              </div>

              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={13} />
                <span>Shift log: {lastToggled}</span>
              </div>

              <div className="flex items-center gap-1 text-[#58BB87] font-semibold">
                <Radio size={13} className={isActive ? "animate-pulse" : ""} />
                <span>{isActive ? "Telemetry GPS Active" : "GPS Paused"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: ACTIVE / INACTIVE Toggle Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 bg-gray-100/90 p-1.5 rounded-xl border border-gray-200">
          {/* Active Button */}
          <button
            onClick={() => handleToggle(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-[#58BB87] text-white shadow-md shadow-[#58BB87]/30 scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>ACTIVE (ON-DUTY)</span>
          </button>

          {/* Inactive Button */}
          <button
            onClick={() => handleToggle(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isActive
                ? "bg-[#F96176] text-white shadow-md shadow-[#F96176]/30 scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <Power size={15} />
            <span>INACTIVE (OFF-DUTY)</span>
          </button>
        </div>
      </div>

      {/* Operational Warning when Inactive */}
      {!isActive && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-amber-700 bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-200/80 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            <span>
              <strong>Mechanic status is Inactive:</strong> New emergency roadside & in-bay dispatch alerts are currently muted for this bay.
            </span>
          </div>
          <button
            onClick={() => handleToggle(true)}
            className="text-xs font-bold text-amber-900 underline hover:no-underline cursor-pointer"
          >
            Switch to Active
          </button>
        </div>
      )}
    </div>
  );
}
