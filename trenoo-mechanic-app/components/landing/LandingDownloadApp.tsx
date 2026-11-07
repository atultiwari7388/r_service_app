"use client";

import React from "react";
import Image from "next/image";
import {
  Download,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Star,
  MapPin,
  Wrench,
  Smartphone,
} from "lucide-react";
import { FaGooglePlay, FaApple } from "react-icons/fa";

export default function LandingDownloadApp() {
  const ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.trenoops.trenoops_mechanic";
  const IOS_URL =
    "https://apps.apple.com/us/app/rabbit-mechanic/id6739818816";

  const benefits = [
    {
      title: "Real-Time Push Alerts",
      desc: "Instant notifications for emergency truck & trailer roadside calls within 50 miles.",
      icon: Flame,
    },
    {
      title: "In-App Navigation & Maps",
      desc: "One-tap GPS routing straight to the driver's breakdown location.",
      icon: MapPin,
    },
    {
      title: "Fast Custom Quotes",
      desc: "Submit your service rate, parts pricing, and estimated arrival time in seconds.",
      icon: Wrench,
    },
    {
      title: "DOT & FMCSA Compliant",
      desc: "Generate professional service inspection records and maintenance logs.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="download" className="py-20 sm:py-28 bg-gradient-to-b from-[#FAFAFC] via-[#FFF5F7]/30 to-[#EAF8F1]/40 text-gray-900 relative overflow-hidden border-t border-gray-200">
      {/* Background Lighting & Subtle Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#F96176]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#58BB87]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFEBF3] border border-[#F96176]/30 text-xs font-black uppercase tracking-wider text-[#F96176]">
            <Download size={13} className="text-[#F96176]" />
            <span>Available on iOS &amp; Android</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight">
            Take Your Service on the Road with the{" "}
            <span className="text-[#F96176]">Treno Mechanic App</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            Whether in your bay or responding on Interstate highways, get the official mobile app to manage quotes, navigate to breakdowns, and log completed jobs.
          </p>
        </div>

        {/* Main Store Download Card */}
        <div
          id="download-card"
          className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-gray-100 shadow-xl scroll-mt-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Download Buttons, Description & Store Links */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#58BB87] bg-[#EAF8F1] px-3 py-1 rounded-full border border-[#58BB87]/30">
                  <Star size={13} fill="currentColor" />
                  <span>Official Mobile Suite for Commercial Technicians &amp; Mechanics</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-gray-950">
                  Built for Quick Highway Roadside Execution
                </h3>

                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
                  Download today to start receiving dispatched semi-truck and 53ft trailer repair requests from fleets across your regional coverage area.
                </p>
              </div>

              {/* Official Download Buttons: Green for Play, Pink for Apple */}
              <div
                id="download-buttons"
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 scroll-mt-32"
              >
                {/* Android Google Play Link */}
                <a
                  href={ANDROID_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-[#58BB87] hover:bg-[#48a674] text-white shadow-xl shadow-[#58BB87]/25 transition-all transform hover:-translate-y-0.5 group cursor-pointer"
                >
                  <FaGooglePlay className="text-3xl text-white group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-white/80 uppercase tracking-wider">
                      GET IT ON
                    </span>
                    <span className="block text-base font-black text-white -mt-0.5">
                      Google Play
                    </span>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-white/80 group-hover:text-white transition" />
                </a>

                {/* iOS App Store Link */}
                <a
                  href={IOS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white shadow-xl shadow-[#F96176]/25 transition-all transform hover:-translate-y-0.5 group cursor-pointer"
                >
                  <FaApple className="text-3xl text-white group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-white/80 uppercase tracking-wider">
                      Download on the
                    </span>
                    <span className="block text-base font-black text-white -mt-0.5">
                      Apple App Store
                    </span>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-white/80 group-hover:text-white transition" />
                </a>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {benefits.map((b, idx) => {
                  const BIcon = b.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-[#EAF8F1] text-[#58BB87] flex items-center justify-center shrink-0 mt-0.5">
                        <BIcon size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-gray-900">{b.title}</h4>
                        <p className="text-[11px] text-gray-500 leading-snug">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: App Highlights Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-[#FAFAFC] border-2 border-gray-200 p-7 shadow-lg text-left space-y-6">
                {/* Card Header with Logo */}
                <div className="pb-4 border-b border-gray-200">
                  <Image
                    src="/assets/treno_mechanic_logo.png"
                    alt="Treno Mechanic Logo"
                    width={170}
                    height={42}
                    className="h-9 w-auto object-contain"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-[#58BB87] font-semibold">
                      Official Technician Mobile Suite
                    </p>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      ★★★★★ <span className="text-gray-500 text-[10px] ml-1">Version 2.4.0</span>
                    </div>
                  </div>
                </div>

                {/* Key In-App Highlights */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                    <div className="p-1.5 rounded-lg bg-[#FFEBF3] text-[#F96176] shrink-0 mt-0.5">
                      <Flame size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">Immediate Roadside Alerts</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Get notified the moment a highway emergency happens nearby.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                    <div className="p-1.5 rounded-lg bg-[#EAF8F1] text-[#58BB87] shrink-0 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">5-Minute Response Window</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Accept jobs fast or submit custom quotes directly from the field.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                    <div className="p-1.5 rounded-lg bg-[#FFEBF3] text-[#F96176] shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">Direct Carrier Payouts</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        No middleman delays. Work orders are verified and billed smoothly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Trust Meta */}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1 text-[#58BB87] font-semibold">
                    <CheckCircle2 size={13} /> Verified Fleet Network
                  </span>
                  <span>DOT &amp; FMCSA Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
