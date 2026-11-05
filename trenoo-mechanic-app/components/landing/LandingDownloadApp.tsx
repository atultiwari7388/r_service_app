"use client";

import React from "react";
import Image from "next/image";
import {
  Smartphone,
  Download,
  CheckCircle2,
  BellRing,
  Navigation,
  DollarSign,
  ShieldCheck,
  Star,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { FaGooglePlay, FaApple } from "react-icons/fa";

export default function LandingDownloadApp() {
  const ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.trenoops.trenoops_mechanic";
  const IOS_URL =
    "https://apps.apple.com/in/app/treno-mechanic/id6781401458";

  const benefits = [
    {
      title: "Real-Time Emergency Alerts",
      desc: "Receive instant push alerts whenever a semi-truck or trailer breaks down within your service radius.",
      icon: BellRing,
    },
    {
      title: "Truck GPS Route Navigation",
      desc: "One-tap map routing with heavy-duty commercial truck navigation and live distance tracking.",
      icon: Navigation,
    },
    {
      title: "Submit Instant Custom Quotes",
      desc: "Quote hourly labor rates, roadside travel fees, and parts costs directly through the app.",
      icon: DollarSign,
    },
    {
      title: "Digital Work Order Sign-Off",
      desc: "Log parts replaced, capture signatures, and complete DOT safety inspections on-site.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="download" className="py-20 sm:py-28 bg-[#0B132B] text-white relative overflow-hidden">
      {/* Background Lighting & Radial Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#F96176]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#58BB87]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#58BB87_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black uppercase tracking-wider text-gray-200">
            <Download size={13} className="text-[#F96176]" />
            <span>Available on iOS & Android</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Take Your Service on the Road with the{" "}
            <span className="text-[#F96176]">Trenoo Mechanic App</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
            Whether in your bay or responding on Interstate highways, get the official mobile app to manage quotes, navigate to breakdowns, and log completed jobs.
          </p>
        </div>

        {/* Main Store Download Card */}
        <div className="bg-gradient-to-br from-[#1C2541] to-[#0B132B] rounded-3xl p-8 sm:p-12 border border-gray-700/80 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Download Buttons, Description & Store Links */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#58BB87] bg-[#58BB87]/15 px-3 py-1 rounded-full border border-[#58BB87]/30">
                  <Star size={13} fill="currentColor" />
                  <span>Official Mobile Suite for Commercial Technicians & Mechanics</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Built for Quick Highway Roadside Execution
                </h3>

                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
                  Download today to start receiving dispatched semi-truck and 53ft trailer repair requests from fleets across your regional coverage area.
                </p>
              </div>

              {/* Official Download Buttons for Android & iOS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                {/* Android Google Play Link */}
                <a
                  href={ANDROID_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-black hover:bg-gray-900 border border-gray-700 shadow-xl transition-all transform hover:-translate-y-0.5 group cursor-pointer"
                >
                  <FaGooglePlay className="text-3xl text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      GET IT ON
                    </span>
                    <span className="block text-base font-black text-white -mt-0.5">
                      Google Play
                    </span>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-gray-500 group-hover:text-white transition" />
                </a>

                {/* iOS App Store Link */}
                <a
                  href={IOS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-black hover:bg-gray-900 border border-gray-700 shadow-xl transition-all transform hover:-translate-y-0.5 group cursor-pointer"
                >
                  <FaApple className="text-3xl text-white group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Download on the
                    </span>
                    <span className="block text-base font-black text-white -mt-0.5">
                      Apple App Store
                    </span>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-gray-500 group-hover:text-white transition" />
                </a>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700/80">
                {benefits.map((b, idx) => {
                  const BIcon = b.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/10 text-[#58BB87] flex items-center justify-center shrink-0 mt-0.5">
                        <BIcon size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-white">{b.title}</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: App Highlights Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-[#0B132B]/95 border border-gray-700 p-7 shadow-2xl text-left space-y-6">
                {/* Card Header with Logo */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-gray-800">
                  <div className="h-14 w-14 rounded-2xl bg-[#1C2541] border border-gray-700 p-2.5 shadow-md flex items-center justify-center shrink-0">
                    <Image
                      src="/logo-new.png"
                      alt="Trenoo Mechanic App Logo"
                      width={42}
                      height={42}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white leading-tight">
                      Trenoo Mechanic
                    </h4>
                    <p className="text-xs text-[#58BB87] font-semibold">
                      Official Technician Mobile Suite
                    </p>
                    <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                      ★★★★★ <span className="text-gray-400 text-[10px] ml-1">Version 2.4.0</span>
                    </div>
                  </div>
                </div>

                {/* Key In-App Highlights */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="p-1.5 rounded-lg bg-[#F96176]/20 text-[#F96176] shrink-0 mt-0.5">
                      <Flame size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Immediate Roadside Alerts</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Get notified the moment a highway emergency happens nearby.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="p-1.5 rounded-lg bg-[#58BB87]/20 text-[#58BB87] shrink-0 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">5-Minute Response Window</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Accept jobs fast or submit custom quotes directly from the field.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="p-1.5 rounded-lg bg-[#0078A6]/20 text-[#0078A6] shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Direct Carrier Payouts</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        No middleman delays. Work orders are verified and billed smoothly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Trust Meta */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-[#58BB87] font-semibold">
                    <CheckCircle2 size={13} /> Verified Fleet Network
                  </span>
                  <span>DOT & FMCSA Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
