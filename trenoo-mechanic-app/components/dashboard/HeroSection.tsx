"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  Briefcase,
  ArrowRight,
  Cpu,
  Clock,
  CheckCircle2,
} from "lucide-react";
import AvailabilityCard from "./AvailabilityCard";

interface HeroSectionProps {
  isActive: boolean;
  onToggleAvailability: (newStatus: boolean) => void;
  pendingJobsCount?: number;
}

export default function HeroSection({
  isActive,
  onToggleAvailability,
  pendingJobsCount = 3,
}: HeroSectionProps) {
  return (
    <section className="relative rounded-3xl bg-white text-gray-900 border border-gray-200 shadow-xs overflow-hidden p-6 sm:p-10 lg:p-12">
      {/* Background Lighting & Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#F96176_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F96176]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#58BB87]/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (Headline, Support text, Availability Card & CTAs) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-[#F96176] text-xs font-black uppercase tracking-wider">
            <Truck size={14} className="shrink-0" />
            <span>Heavy-Duty Commercial Fleet & Trailer Network</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-gray-900">
            Your Next Job Starts Here.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed font-normal">
            Stay available, manage incoming requests, and keep your fleet moving with <strong className="text-gray-900 font-bold">TrenoOps</strong>.
          </p>

          {/* Prominent Availability Card in Hero */}
          <div className="max-w-md pt-2">
            <AvailabilityCard
              isActive={isActive}
              onToggle={onToggleAvailability}
              variant="hero"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3.5 flex-wrap pt-2">
            <a
              href="#upcoming-jobs"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-black text-sm shadow-md shadow-[#F96176]/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Briefcase size={18} />
              <span>View Job Requests ({pendingJobsCount})</span>
            </a>

            <Link
              href="/find-jobs"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm border border-gray-300/80 transition-colors"
            >
              <span>Dispatch Console</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right Column: 3D-Inspired Truck Visual with Floating Mini-Cards */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[340px] sm:min-h-[420px]">
          {/* Main Truck Dimensional Composition */}
          <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl bg-gray-50 border border-gray-200 p-6 flex items-center justify-center shadow-xs">
            {/* Ambient Platform Glow beneath Truck */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-gradient-to-r from-[#F96176]/20 via-[#58BB87]/20 to-[#ff8c42]/20 rounded-full blur-xl pointer-events-none" />

            {/* Truck Image Visual */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Image
                src="/assets/slider_1.png"
                alt="Heavy-Duty Commercial Semi-Truck"
                width={460}
                height={280}
                priority
                className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)] filter transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Floating Mini-Card 1: Top Left - Engine Diagnostics */}
            <div className="absolute top-2 left-2 sm:-top-4 sm:-left-4 z-20 bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-2xl border border-gray-200 shadow-md flex items-center gap-2 sm:gap-2.5">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-red-50 text-[#F96176] flex items-center justify-center shrink-0">
                <Cpu size={15} />
              </div>
              <div className="text-left">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 block leading-none">
                  ECM Telemetry
                </span>
                <span className="text-[11px] sm:text-xs font-black text-gray-900">Diagnostics OK</span>
              </div>
            </div>

            {/* Floating Mini-Card 2: Bottom Right - 24/7 Roadside ETA */}
            <div className="absolute bottom-2 right-2 sm:-bottom-4 sm:-right-4 z-20 bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-2xl border border-gray-200 shadow-md flex items-center gap-2 sm:gap-2.5">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center shrink-0">
                <Clock size={15} />
              </div>
              <div className="text-left">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 block leading-none">
                  Mobile Unit
                </span>
                <span className="text-[11px] sm:text-xs font-black text-[#58BB87]">22 Min Highway ETA</span>
              </div>
            </div>

            {/* Floating Mini-Card 3: Top Right - DOT Certified */}
            <div className="absolute top-2 right-2 sm:-top-3 sm:right-4 z-20 bg-white border border-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-800">
              <CheckCircle2 size={13} className="text-[#58BB87]" />
              <span>DOT Certified Bay</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
