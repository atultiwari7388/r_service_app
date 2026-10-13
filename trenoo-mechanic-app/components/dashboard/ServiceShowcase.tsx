"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Cpu,
  Flame,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Truck,
  Activity,
} from "lucide-react";

export default function ServiceShowcase() {
  return (
    <section className="relative rounded-3xl bg-[#0B132B] text-white p-6 sm:p-10 lg:p-12 border border-gray-800 shadow-2xl overflow-hidden">
      {/* 3D Perspective Light Cone */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#F96176]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-gradient-to-tr from-[#58BB87]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headline & Technical Depth */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58BB87]/20 border border-[#58BB87]/40 text-[#58BB87] text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Certified Commercial Infrastructure</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Heavy-Duty Expertise. Reliable Service.
          </h2>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-normal">
            Whether roadside on an interstate shoulder or in a dedicated commercial bay, our master technicians use high-torque diagnostic tools, OEM calibration harnesses, and heavy hydraulic recovery units.
          </p>

          {/* Core Feature Bullet Points */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#F96176]/20 text-[#F96176] flex items-center justify-center shrink-0 mt-0.5">
                <Cpu size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  OEM Electronic Engine Diagnostics
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Full ECM fault decoding and live injector flow testing for Cummins, Detroit, and PACCAR.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#58BB87]/20 text-[#58BB87] flex items-center justify-center shrink-0 mt-0.5">
                <Flame size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  24/7 Roadside Heavy Support
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mobile diagnostic vans and rapid service trucks equipped for emergency highway repairs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#0078A6]/25 text-[#0078A6] flex items-center justify-center shrink-0 mt-0.5">
                <Wrench size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Preventive Maintenance & DOT Safety
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Comprehensive 100-point DOT annual certifications and tailored PM maintenance cycles.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/inspections"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-lg shadow-[#F96176]/25 transition-all"
            >
              <span>Explore Fleet Inspection Protocols</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Layered 3D Showcase with Floating Information Cards */}
        <div className="lg:col-span-6 relative perspective-1000 min-h-[360px] sm:min-h-[440px] flex items-center justify-center">
          {/* 3D Visual Container */}
          <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl bg-gradient-to-tr from-[#1C2541] to-[#0B132B] p-6 border border-gray-700/80 shadow-2xl flex items-center justify-center card-3d">
            
            {/* Ground Shadow & Elevation */}
            <div className="absolute bottom-4 w-3/4 h-10 bg-black/80 rounded-full blur-xl pointer-events-none" />

            {/* Truck Visual Asset */}
            <div className="relative z-10 w-full h-full flex items-center justify-center animate-float">
              <Image
                src="/assets/slider_2.png"
                alt="Heavy Commercial Truck and Trailer"
                width={440}
                height={270}
                className="object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.7)]"
              />
            </div>

            {/* Floating Card 1: Engine Diagnostics (Top Left) */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 glass-navy p-3.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 animate-float-slow max-w-[210px]">
              <div className="h-9 w-9 rounded-xl bg-[#F96176]/20 text-[#F96176] flex items-center justify-center shrink-0">
                <Cpu size={18} />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-black text-white">Engine Diagnostics</h5>
                <p className="text-[10px] text-gray-300">Live ECM Fault Scan</p>
                <span className="text-[10px] font-bold text-[#58BB87] flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={10} /> Calibrated
                </span>
              </div>
            </div>

            {/* Floating Card 2: Roadside Support (Bottom Right) */}
            <div className="absolute -bottom-3 -right-3 sm:-right-6 z-20 glass-navy p-3.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 max-w-[220px]">
              <div className="h-9 w-9 rounded-xl bg-[#58BB87]/20 text-[#58BB87] flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-black text-white">Roadside Support</h5>
                <p className="text-[10px] text-gray-300">24/7 Mobile Air & Tires</p>
                <span className="text-[10px] font-bold text-[#F96176] flex items-center gap-0.5 mt-0.5">
                  <Activity size={10} /> Active Patrol
                </span>
              </div>
            </div>

            {/* Floating Card 3: Preventive Maintenance (Bottom Left) */}
            <div className="absolute -bottom-4 left-6 z-20 bg-[#0B132B]/95 p-3 rounded-xl border border-gray-700 shadow-xl hidden sm:flex items-center gap-2.5">
              <Wrench size={16} className="text-[#0078A6]" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">
                  Preventive Maintenance
                </span>
                <span className="text-[10px] text-gray-400">
                  DOT 100-Point Pass Guaranteed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
