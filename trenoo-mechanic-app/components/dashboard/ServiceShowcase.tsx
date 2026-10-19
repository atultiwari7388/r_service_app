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
  Activity,
} from "lucide-react";

export default function ServiceShowcase() {
  return (
    <section className="relative rounded-3xl bg-white text-gray-900 p-6 sm:p-10 lg:p-12 border border-gray-200 shadow-xs overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#F96176]/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-gradient-to-tr from-[#58BB87]/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headline & Technical Depth */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#58BB87] text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Certified Commercial Infrastructure</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-gray-900">
            Heavy-Duty Expertise. Reliable Service.
          </h2>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
            Whether roadside on an interstate shoulder or in a dedicated commercial bay, our master technicians use high-torque diagnostic tools, OEM calibration harnesses, and heavy hydraulic recovery units.
          </p>

          {/* Core Feature Bullet Points */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-red-50 text-[#F96176] flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                <Cpu size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  OEM Electronic Engine Diagnostics
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Full ECM fault decoding and live injector flow testing for Cummins, Detroit, and PACCAR.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                <Flame size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  24/7 Roadside Heavy Support
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mobile diagnostic vans and rapid service trucks equipped for emergency highway repairs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                <Wrench size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Preventive Maintenance & DOT Safety
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comprehensive 100-point DOT annual certifications and tailored PM maintenance cycles.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/inspections"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>Explore Fleet Inspection Protocols</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Layered Showcase with Floating Information Cards */}
        <div className="lg:col-span-6 relative min-h-[360px] sm:min-h-[440px] flex items-center justify-center">
          {/* Visual Container */}
          <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl bg-gray-50 p-6 border border-gray-200 shadow-xs flex items-center justify-center">
            {/* Truck Visual Asset */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Image
                src="/assets/slider_2.png"
                alt="Heavy Commercial Truck and Trailer"
                width={440}
                height={270}
                className="object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.1)]"
              />
            </div>

            {/* Floating Card 1: Engine Diagnostics (Top Left) */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-md flex items-center gap-3 max-w-[210px]">
              <div className="h-9 w-9 rounded-xl bg-red-50 text-[#F96176] flex items-center justify-center shrink-0">
                <Cpu size={18} />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-black text-gray-900">Engine Diagnostics</h5>
                <p className="text-[10px] text-gray-500">Live ECM Fault Scan</p>
                <span className="text-[10px] font-bold text-[#58BB87] flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={10} /> Calibrated
                </span>
              </div>
            </div>

            {/* Floating Card 2: Roadside Support (Bottom Right) */}
            <div className="absolute -bottom-3 -right-3 sm:-right-6 z-20 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-md flex items-center gap-3 max-w-[220px]">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-black text-gray-900">Roadside Support</h5>
                <p className="text-[10px] text-gray-500">24/7 Mobile Air & Tires</p>
                <span className="text-[10px] font-bold text-[#F96176] flex items-center gap-0.5 mt-0.5">
                  <Activity size={10} /> Active Patrol
                </span>
              </div>
            </div>

            {/* Floating Card 3: Preventive Maintenance (Bottom Left) */}
            <div className="absolute -bottom-4 left-6 z-20 bg-white p-3 rounded-xl border border-gray-200 shadow-md hidden sm:flex items-center gap-2.5">
              <Wrench size={16} className="text-[#F96176]" />
              <div className="text-left">
                <span className="text-xs font-bold text-gray-900 block">
                  Preventive Maintenance
                </span>
                <span className="text-[10px] text-gray-500">
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
