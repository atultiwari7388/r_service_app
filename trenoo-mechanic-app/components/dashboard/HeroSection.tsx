"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Briefcase,
  Activity,
  ArrowRight,
  Wrench,
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
    <section className="relative rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white border border-gray-800/90 shadow-2xl overflow-hidden p-6 sm:p-10 lg:p-12">
      {/* Background Dimensional Lighting & Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#F96176_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F96176]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#58BB87]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (Headline, Support text, Availability Card & CTAs) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F96176]/20 border border-[#F96176]/40 text-[#F96176] text-xs font-black uppercase tracking-wider">
            <Truck size={14} className="shrink-0" />
            <span>Heavy-Duty Commercial Fleet & Trailer Network</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Your Next Job Starts Here.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed font-normal">
            Stay available, manage incoming requests, and keep your fleet moving with <strong className="text-white font-bold">TrenoOps</strong>.
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
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-black text-sm shadow-xl shadow-[#F96176]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Briefcase size={18} />
              <span>View Job Requests ({pendingJobsCount})</span>
            </a>

            <Link
              href="/find-jobs"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#1C2541] hover:bg-[#273469] text-gray-200 font-bold text-sm border border-gray-700 transition-colors"
            >
              <span>Dispatch Console</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right Column: 3D-Inspired Truck Visual with Floating Mini-Cards */}
        <div className="lg:col-span-5 relative perspective-1000 flex items-center justify-center min-h-[340px] sm:min-h-[420px]">
          {/* Main Truck Dimensional Composition */}
          <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl bg-gradient-to-tr from-[#0B132B]/80 to-[#1C2541]/90 border border-white/10 p-6 flex items-center justify-center shadow-2xl backdrop-blur-sm card-3d">
            
            {/* Ambient Platform Glow beneath Truck */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-gradient-to-r from-[#F96176]/40 via-[#58BB87]/40 to-[#0078A6]/40 rounded-full blur-xl pointer-events-none" />

            {/* Truck Image Visual */}
            <div className="relative z-10 w-full h-full flex items-center justify-center animate-float">
              <Image
                src="/assets/slider_1.png"
                alt="Heavy-Duty Commercial Semi-Truck"
                width={460}
                height={280}
                priority
                className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)] filter transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Floating Mini-Card 1: Top Left - Engine Diagnostics */}
            <div className="absolute -top-4 -left-4 z-20 glass-navy px-3.5 py-2.5 rounded-2xl border border-white/15 shadow-xl flex items-center gap-2.5 animate-float-slow">
              <div className="h-8 w-8 rounded-xl bg-[#F96176]/25 text-[#F96176] flex items-center justify-center shrink-0">
                <Cpu size={16} />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">
                  ECM Telemetry
                </span>
                <span className="text-xs font-black text-white">Diagnostics OK</span>
              </div>
            </div>

            {/* Floating Mini-Card 2: Bottom Right - 24/7 Roadside ETA */}
            <div className="absolute -bottom-4 -right-4 z-20 glass-navy px-3.5 py-2.5 rounded-2xl border border-white/15 shadow-xl flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#58BB87]/25 text-[#58BB87] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">
                  Mobile Unit
                </span>
                <span className="text-xs font-black text-[#58BB87]">22 Min Highway ETA</span>
              </div>
            </div>

            {/* Floating Mini-Card 3: Top Right - DOT Certified */}
            <div className="absolute -top-3 right-4 z-20 bg-[#0B132B]/90 border border-gray-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-[11px] font-bold text-gray-200">
              <CheckCircle2 size={13} className="text-[#58BB87]" />
              <span>DOT Certified Bay</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
