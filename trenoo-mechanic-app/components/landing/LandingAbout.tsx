"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BellRing,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  Gauge,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingAbout() {
  const serviceHighlights = [
    {
      title: "Automatic Service Alert System",
      description:
        "Real-time service reminders so you never miss critical upkeep: engine oil changes, wheel alignment (truck & trailer), filter replacements (air, fuel, DEF, cabin), tire rotations/replacements, tune-ups, transmission fluid, and differential oil changes.",
      icon: BellRing,
      accent: "text-[#F96176]",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      title: "Full Inspections & DOT Compliance",
      description:
        "Scheduled alerts for complete multi-point inspections, comprehensive air brake checks, and federal DOT compliance audits—preventing highway breakdowns and costly regulatory penalties.",
      icon: ShieldCheck,
      accent: "text-[#58BB87]",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Owner-Operators & Fleet Managers",
      description:
        "A powerful suite of tools including maintenance history tracking, service scheduling, fleet dashboard, trip logging, and driver team management for complete operational visibility and maximum rig longevity.",
      icon: Gauge,
      accent: "text-[#0078A6]",
      bg: "bg-cyan-50",
      border: "border-cyan-100",
    },
    {
      title: "Treno Mechanic On-Demand Network",
      description:
        "Need a mechanic fast? Treno Mechanic connects carriers with nearby verified mobile technicians and certified repair bays for immediate roadside breakdown assistance or scheduled heavy-duty repairs.",
      icon: Wrench,
      accent: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  return (
    <section
      id="about"
      className="py-20 sm:py-28 bg-[#FAFAFC] relative overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-50/50 to-transparent pointer-events-none rounded-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFEBF3] border border-[#F96176]/30 text-xs font-black uppercase tracking-wider text-[#F96176]">
            <Sparkles size={13} />
            <span>Built by Truckers, For Truckers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B132B] tracking-tight leading-tight">
            About <span className="text-[#F96176]">Treno Mechanic</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            A smart, all-in-one service application and website built
            exclusively for Semi Trucks and Trailers.
          </p>
        </div>

        {/* Narrative Card with Detailed Content Provided */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Story Column */}
            <div className="lg:col-span-7 space-y-5 text-gray-700 leading-relaxed text-sm sm:text-base">
              <div className="p-4 rounded-2xl bg-[#0B132B] text-white border border-gray-800 flex items-start gap-3.5">
                <Truck size={24} className="text-[#F96176] shrink-0 mt-0.5" />
                <p className="font-bold text-sm sm:text-base text-gray-100">
                  Treno Mechanic was founded by logistics professionals and
                  built with real truckers in mind.
                </p>
              </div>

              <p>
                <strong>Treno Mechanic</strong> is a smart, all-in-one service
                application and website built exclusively for{" "}
                <strong>Semi Trucks and Trailers</strong>, featuring an
                intelligent <strong>Automatic Service Alert System</strong> that
                keeps your fleet fully maintained and always road-ready.
              </p>

              <p>
                With Treno Mechanic, you can effortlessly track detailed service
                records for every vehicle, ensuring you stay updated on all past
                maintenance and upcoming tasks. The system sends real-time
                service reminders so you never miss critical upkeep—including
                engine oil changes, wheel alignment (truck and trailer), filter
                replacements (air, fuel, DEF, cabin), tire
                rotations/replacements, tune-ups, transmission fluid, and
                differential oil changes.
              </p>

              <p>
                It also delivers scheduled alerts for full inspections,
                including brake checks and DOT compliance, helping prevent
                breakdowns and costly regulatory issues.
              </p>

              <p>
                Designed for both owner-operators and fleet managers, Treno
                Mechanic offers a powerful suite of tools like maintenance
                history tracking, service scheduling, a fleet dashboard, and
                access to on-site or mobile mechanics. Whether you’re managing a
                single truck or an entire fleet, Treno Mechanic helps maximize
                uptime, reduce unexpected repairs, and extend the life of your
                rigs—all from one easy-to-use platform.
              </p>

              <p className="bg-[#EAF8F1] p-4 rounded-2xl border border-[#58BB87]/30 text-[#0B132B] font-medium text-sm">
                <strong>Need a mechanic fast?</strong> Use{" "}
                <strong>Treno Mechanic</strong> to find and connect with nearby
                verified mechanics, perfect for both emergency fixes and
                scheduled work. You can also track trips, monitor mileage, and
                manage your driver team for full operational visibility.
              </p>

              <p className="font-semibold text-gray-900">
                Treno Mechanic is your trusted digital co-pilot, making
                predictive maintenance and smart fleet management simple,
                efficient, and stress-free.
              </p>

              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-black shadow-md shadow-[#F96176]/25 transition"
                >
                  <span>Join as Verified Mechanic</span>
                  <ArrowRight size={14} />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
                >
                  <span>Explore App Screenshots</span>
                </a>
              </div>
            </div>

            {/* Right Visual Graphic Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-[#0B132B] to-[#1C2541] p-6 sm:p-8 text-white border border-gray-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-[#F96176]/20 text-[#F96176] flex items-center justify-center font-bold">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        Full Rig Coverage
                      </h4>
                      <p className="text-[11px] text-[#58BB87] font-semibold">
                        Tractor & 53&apos; Trailer
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#58BB87]/20 text-[#58BB87] text-[10px] font-black uppercase">
                    100% Road Ready
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300">
                      Predictive Service Alerts
                    </span>
                    <span className="font-bold text-[#58BB87] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Automated
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300">
                      Air Brake & DOT Inspection
                    </span>
                    <span className="font-bold text-[#58BB87] flex items-center gap-1">
                      <CheckCircle2 size={13} /> FMCSA Part 396
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300">
                      Engine Oil, Filter & DEF
                    </span>
                    <span className="font-bold text-[#58BB87] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Scheduled Log
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300">
                      Mobile Mechanic Dispatch
                    </span>
                    <span className="font-bold text-[#F96176] flex items-center gap-1">
                      <Clock size={13} /> 24/7 Rapid
                    </span>
                  </div>
                </div>

                {/* Mechanic Trust Quote */}
                <div className="p-4 rounded-2xl bg-[#1C2541]/80 border border-gray-700/80 text-center space-y-1">
                  <span className="text-xs font-bold text-gray-300">
                    Trusted by Over 500+ Fleets & Truck Mechanics
                  </span>
                  <div className="flex justify-center items-center gap-1 text-amber-400 text-xs">
                    ★★★★★{" "}
                    <span className="text-gray-400 text-[11px] ml-1">
                      (4.98 / 5.0)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceHighlights.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div
                    className={`h-12 w-12 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center ${feature.accent}`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-black text-[#0B132B]">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs font-bold text-[#F96176]">
                  <span>Always Road-Ready</span>
                  <CheckCircle2 size={13} className="text-[#58BB87]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
