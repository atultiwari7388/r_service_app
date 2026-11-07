"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Flame,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Smartphone,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function LandingHero() {
  const handleScrollToDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target =
      document.getElementById("download-buttons") ||
      document.getElementById("download-card") ||
      document.getElementById("download");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFF5F7] via-[#FAFAFC] to-white text-gray-900">
      {/* Background Image with Light Semi-Transparent Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/find_mec_new.png"
          alt="Heavy Duty Commercial Fleet & Trailer Workshop"
          fill
          priority
          className="object-cover object-center opacity-10 scale-105 transform motion-safe:animate-pulse-slow"
        />
        {/* Layered Subtle Pink and Green Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F96176]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[#58BB87]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines, Text, Login & Register CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F1] border border-[#58BB87]/40 text-xs font-black uppercase tracking-wider text-[#58BB87] shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58BB87] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58BB87]" />
              </span>
              <span>Commercial Fleet & Semi-Trailer Platform</span>
            </div>

            {/* Main Brand Title: Treno Mechanic */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-gray-950">
                Treno <span className="text-[#F96176]">Mechanic</span>
              </h1>
              <p className="text-xl sm:text-2xl font-extrabold text-[#58BB87]">
                On-Demand Heavy-Duty Mobile & Shop Vehicle Repair
              </p>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Built exclusively for{" "}
              <strong className="text-gray-900 font-bold">
                Class 8 Semi-Trucks and 53ft Trailers
              </strong>
              . Connect with nearby verified mechanics for 24/7 roadside
              breakdown calls, scheduled PM services, and certified DOT
              inspections. Keep America&apos;s freight moving with zero
              downtime.
            </p>

            {/* Primary Action Buttons: Login (Pink) & Register (Green) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-black text-sm shadow-xl shadow-[#F96176]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
              >
                <LogIn
                  size={18}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
                <span>Mechanic Login</span>
              </Link>

              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#58BB87] hover:bg-[#48a674] text-white font-black text-sm shadow-xl shadow-[#58BB87]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <UserPlus size={18} />
                <span>Register as Mechanic</span>
              </Link>

              <a
                href="#download-buttons"
                onClick={handleScrollToDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border-2 border-gray-200 transition-colors shadow-xs cursor-pointer"
              >
                <Smartphone size={17} className="text-[#F96176]" />
                <span>Get App</span>
              </a>
            </div>

            {/* Trust Highlights Badges */}
            <div className="pt-6 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-left bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="p-2 rounded-xl bg-[#EAF8F1] text-[#58BB87] shrink-0">
                  <Flame size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">
                    24/7 Roadside
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Emergency Dispatch
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="p-2 rounded-xl bg-[#FFEBF3] text-[#F96176] shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">
                    DOT Certified
                  </div>
                  <div className="text-[11px] text-gray-500">
                    FMCSA Part 396
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-500 shrink-0">
                  <Star size={18} fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">
                    4.98 Rating
                  </div>
                  <div className="text-[11px] text-gray-500">500+ Fleets</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="p-2 rounded-xl bg-[#EAF8F1] text-[#58BB87] shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">
                    5-Min Timer
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Rapid Response
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Light 3D-Styled Fleet Dispatch Command Card Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Ambient Platform Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#F96176] to-[#58BB87] rounded-3xl blur-xl opacity-20 animate-pulse-slow" />

            <div className="relative w-full max-w-md rounded-3xl bg-white border-2 border-gray-100 p-6 sm:p-7 shadow-2xl space-y-5 text-left">
              {/* Card Header: Live Dispatch Radar */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58BB87] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#58BB87]" />
                  </span>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Live Mechanic Terminal
                    </h2>
                    <p className="text-[11px] text-[#58BB87] font-bold">
                      Bay #3 &amp; Mobile Unit Online
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#EAF8F1] border border-[#58BB87]/40 text-[#58BB87] text-[10px] font-black uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Live Location Visual */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#FFEBF3] text-[#F96176] flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Current GPS Service Radius
                    </span>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {APP_CONFIG.contact.address}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#58BB87] shrink-0 bg-[#EAF8F1] px-2 py-0.5 rounded border border-[#58BB87]/30">
                  50-Mi Radius
                </span>
              </div>

              {/* Sample Dispatch Call Preview */}
              <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#F96176]/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#F96176] text-white text-[10px] font-black uppercase flex items-center gap-1">
                    <Flame size={11} /> Urgent Request
                  </span>
                  <span className="text-[11px] font-mono text-[#F96176] font-bold flex items-center gap-1">
                    <Clock size={12} /> Auto-Cancel: 04:38
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-950">
                    Freightliner Cascadia • 53ft Reefer
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                    Blown air brake hose &amp; pressure drop on Interstate
                    Highway
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-500 font-medium">
                    Est. Payout:
                  </span>
                  <span className="text-base font-black text-[#58BB87]">
                    $480.00
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    className="py-2 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200 transition flex items-center justify-center gap-1 cursor-default shadow-xs"
                  >
                    <MapPin size={13} className="text-[#F96176]" />
                    <span>View Map</span>
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-black transition flex items-center justify-center gap-1 cursor-default shadow-md shadow-[#58BB87]/25"
                  >
                    <CheckCircle2 size={13} />
                    <span>Accept Job</span>
                  </button>
                </div>
              </div>

              {/* Quick stats mini row */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-[#FFEBF3]/50 border border-[#F96176]/20">
                  <span className="text-lg font-black text-[#F96176]">
                    1,480+
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-gray-600">
                    Jobs Completed
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EAF8F1]/60 border border-[#58BB87]/25">
                  <span className="text-lg font-black text-[#58BB87]">
                    14 Active
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-gray-600">
                    Bays Servicing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
