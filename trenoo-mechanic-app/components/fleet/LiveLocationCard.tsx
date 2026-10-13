"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Radio,
  Truck,
  PhoneCall,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function LiveLocationCard() {
  const [copied, setCopied] = useState(false);
  const fullAddress = `${APP_CONFIG.contact.address}`;
  const coordinates = "36.8450° N, 119.8240° W";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0B132B] rounded-3xl p-6 sm:p-7 text-white border border-gray-800 shadow-xl relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#F96176]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-[#58BB87]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-6">
        {/* Left Column: Live Current Address Information */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F96176]/20 border border-[#F96176]/40 text-[#F96176] text-xs font-black uppercase tracking-wider">
              <Radio size={12} className="animate-pulse" />
              Live Depot Telemetry
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#58BB87] font-semibold bg-[#58BB87]/15 px-2.5 py-1 rounded-full border border-[#58BB87]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#58BB87] animate-ping" />
              Beacon Online
            </span>
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">
              Current Live Terminal Address
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
              <MapPin size={26} className="text-[#F96176] shrink-0" />
              <span>{fullAddress}</span>
            </h3>
            <p className="text-xs text-gray-300 mt-1.5 font-medium">
              Central Valley Heavy-Duty Commercial Bay & Rapid Mobile Roadside Dispatch Hub
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#1C2541]/90 border border-gray-700/80">
              <div className="text-[11px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Compass size={12} className="text-[#58BB87]" /> GPS Coordinates
              </div>
              <div className="text-xs font-mono font-bold text-gray-200 mt-0.5">
                {coordinates}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1C2541]/90 border border-gray-700/80">
              <div className="text-[11px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Clock size={12} className="text-[#F96176]" /> Roadside ETA
              </div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">
                22 Min Avg on I-5 / CA-99
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1C2541]/90 border border-gray-700/80 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Truck size={12} className="text-[#0078A6]" /> Service Radius
              </div>
              <div className="text-xs font-mono font-bold text-gray-200 mt-0.5">
                50-Mile Commercial Zone
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C2541] hover:bg-[#273469] text-xs font-bold text-gray-200 border border-gray-700 transition-colors cursor-pointer"
            >
              <Navigation size={14} className="text-[#F96176]" />
              <span>{copied ? "Address Copied!" : "Copy Depot Address"}</span>
            </button>

            <a
              href={APP_CONFIG.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-xs font-black text-white shadow-lg shadow-[#58BB87]/30 transition-all cursor-pointer"
            >
              <PhoneCall size={14} />
              <span>Roadside Dispatch Hotline: {APP_CONFIG.contact.phoneDisplay}</span>
            </a>
          </div>
        </div>

        {/* Right Column: Visual Radar & Freight Corridor Map Graphic */}
        <div className="lg:w-80 w-full rounded-2xl bg-[#1C2541] p-4 border border-gray-700/80 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700 text-xs">
            <span className="font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#F96176]" /> Corridor Radar
            </span>
            <span className="text-[11px] font-mono text-[#58BB87]">District 4</span>
          </div>

          {/* Stylized Visual Dispatch Map */}
          <div className="relative h-44 w-full my-3 rounded-xl bg-[#0B132B] border border-gray-800 p-3 overflow-hidden flex flex-col justify-between">
            {/* Radar Grid Lines */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <div className="w-full h-full border border-gray-600 rounded-full scale-150 animate-pulse" />
              <div className="w-full h-full border border-gray-600 rounded-full scale-100" />
              <div className="w-full h-full border border-gray-600 rounded-full scale-50" />
            </div>

            {/* Highway Routes Representation */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span className="bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700">
                I-5 North / South
              </span>
              <span className="bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700">
                CA-99 Corridor
              </span>
            </div>

            {/* Central Depot Beacon Marker */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2">
              <div className="relative flex items-center justify-center">
                <span className="absolute h-9 w-9 rounded-full bg-[#F96176]/30 animate-ping" />
                <span className="relative h-6 w-6 rounded-full bg-[#F96176] text-white flex items-center justify-center shadow-lg shadow-[#F96176]/50">
                  <MapPin size={14} />
                </span>
              </div>
              <span className="text-xs font-black text-white mt-1.5 tracking-tight">
                Trenoo Fleet Depot
              </span>
              <span className="text-[10px] text-[#58BB87] font-semibold">
                California, 93711, USA
              </span>
            </div>

            {/* Mobile Units Status Chips */}
            <div className="relative z-10 flex items-center justify-between text-[10px]">
              <span className="text-[#58BB87] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#58BB87]" /> Mobile Truck #1 (CA-99)
              </span>
              <span className="text-[#0078A6] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0078A6]" /> Bay #1-#6 Ready
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>DOT Compliance Audit Station:</span>
            <span className="font-bold text-[#58BB87] flex items-center gap-1">
              <ShieldCheck size={12} /> Certified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
