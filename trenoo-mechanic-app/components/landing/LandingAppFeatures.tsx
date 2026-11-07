"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Power,
  DollarSign,
  Navigation,
  Layers,
  ArrowRight,
  Filter,
  User,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function LandingAppFeatures() {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  const screens = [
    {
      id: "dashboard",
      title: "1. Mechanic Command Hub",
      subtitle: "Active Status, Live Location & New Jobs",
      badge: "Command Center",
      badgeColor: "bg-[#EAF8F1] text-[#58BB87] border-[#58BB87]/30",
      imageSrc: "/assets/appScreenshots/new_dashboard.png",
      tagline:
        "Manage your on-duty availability, inspect your live GPS terminal location, and browse filtered commercial truck work orders.",
      keyFeatures: [
        {
          title: "Active / Inactive Toggle Switch",
          desc: "Switch between On-Duty (receiving real-time fleet emergency calls) and Off-Duty (notifications paused) with one tap.",
          icon: Power,
          color: "text-[#58BB87]",
          bg: "bg-[#EAF8F1]",
        },
        {
          title: "Real-Time Terminal & Service Location",
          desc: "Live GPS pin displaying your workshop bay or mobile service radius so nearby stranded truckers can find you instantly.",
          icon: MapPin,
          color: "text-[#F96176]",
          bg: "bg-[#FFEBF3]",
        },
        {
          title: "Mechanic Profile & Ratings",
          desc: "Displays your ASE certifications, 5-star customer ratings, and custom hourly labor rate directly on your dashboard.",
          icon: User,
          color: "text-[#0078A6]",
          bg: "bg-blue-50",
        },
        {
          title: "KPI Counters: Total & Ongoing Jobs",
          desc: "Track completed lifetime jobs, active bays, and vehicles currently in repair at a single glance.",
          icon: CheckCircle2,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          title: "New Jobs Feed with Category Filters",
          desc: "Filter incoming calls by Engine, Brake, Reefer, Trailer, Air Leak, or 24/7 Roadside breakdown.",
          icon: Filter,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
      ],
    },
    {
      id: "upcoming",
      title: "2. 5-Min Urgent Dispatch Alert",
      subtitle: "Auto-Cancel Countdown, Custom Quotes & GPS Route",
      badge: "Rapid Response",
      badgeColor: "bg-[#FFEBF3] text-[#F96176] border-[#F96176]/30",
      imageSrc: "/assets/appScreenshots/new_upcoming_job.png",
      tagline:
        "When an emergency roadside request arrives, respond with custom rates and live route tracking before the 5-minute safety window closes.",
      keyFeatures: [
        {
          title: "5-Minute Auto-Cancellation Timer",
          desc: "Guarantees rapid response for stranded commercial rigs. If not accepted within 5 minutes, it automatically reroutes to the next closest mechanic.",
          icon: Clock,
          color: "text-[#F96176]",
          bg: "bg-[#FFEBF3]",
        },
        {
          title: "Interactive 'Interested' Quote Button",
          desc: "Tap 'Interested' to submit your custom labor charges, travel fee, or hourly rates directly to the carrier for instant approval.",
          icon: DollarSign,
          color: "text-[#58BB87]",
          bg: "bg-[#EAF8F1]",
        },
        {
          title: "Interactive 'Map' Distance Tracker",
          desc: "Tap 'Map' to immediately launch GPS navigation, tracking exact driving distance and estimated highway arrival time to the disabled truck.",
          icon: Navigation,
          color: "text-[#0078A6]",
          bg: "bg-blue-50",
        },
        {
          title: "Comprehensive Breakdown Details",
          desc: "Review vehicle unit #, license, commercial fleet carrier, and diagnostic issue description before rolling out.",
          icon: ShieldCheck,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
      ],
    },
    {
      id: "my_jobs",
      title: "3. My Jobs & Workflow Management",
      subtitle: "Lifecycle Tracking, History & Customer Ratings",
      badge: "Work Order Management",
      badgeColor: "bg-blue-50 text-[#0078A6] border-blue-200",
      imageSrc: "/assets/appScreenshots/new_my_jobs.png",
      tagline:
        "Track every active work order through its complete lifecycle from departure to final invoice sign-off and reviews.",
      keyFeatures: [
        {
          title: "Multi-Stage Status Progression",
          desc: "Update status step-by-step: Accepted → En-Route → Arrived at Breakdown Site → Work in Progress → Completed.",
          icon: Zap,
          color: "text-[#0078A6]",
          bg: "bg-blue-50",
        },
        {
          title: "Organized Job Lifecycle Tabs",
          desc: "Seamlessly navigate between Upcoming dispatches, Ongoing active repairs, and Completed job history.",
          icon: Layers,
          color: "text-[#58BB87]",
          bg: "bg-[#EAF8F1]",
        },
        {
          title: "Accurate Service Invoicing & Documentation",
          desc: "Document parts replaced (air hoses, filters, brake pads) and attach commercial invoices for quick carrier payouts.",
          icon: CheckCircle2,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          title: "Driver Rating & Feedback System",
          desc: "Review customer feedback, rate fleet drivers, and build your certified mechanic reputation across the national network.",
          icon: ShieldCheck,
          color: "text-[#F96176]",
          bg: "bg-[#FFEBF3]",
        },
      ],
    },
  ];

  const currentScreen = screens[activeTab];

  return (
    <section
      id="features"
      className="py-20 sm:py-28 bg-white relative overflow-hidden border-t border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F1] border border-[#58BB87]/30 text-xs font-black uppercase tracking-wider text-[#58BB87]">
            <Smartphone size={13} />
            <span>Real Mobile Application Screenshots</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B132B] tracking-tight leading-tight">
            Designed for the{" "}
            <span className="text-[#F96176]">Modern Mechanic</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            Take a look inside the official Treno Mechanic mobile app. Built
            with high-contrast, glove-friendly controls and intelligent dispatch
            automation.
          </p>

          {/* Interactive Screen Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {screens.map((screen, idx) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setActiveTab(idx as 0 | 1 | 2)}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                  activeTab === idx
                    ? "bg-[#0B132B] text-white border-[#0B132B] shadow-md shadow-[#0B132B]/20 scale-102"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeTab === idx ? "bg-[#F96176]" : "bg-gray-400"
                  }`}
                />
                <span>{screen.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Screen Showcase Component */}
        <div className="bg-[#FAFAFC] rounded-3xl p-6 sm:p-10 lg:p-12 border border-gray-200/90 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Authentic Smartphone Frame with Exact Screenshot */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[290px] sm:max-w-[320px] aspect-[1/2.05] rounded-[48px] bg-gradient-to-b from-[#1C2541] to-[#0B132B] p-3 sm:p-3.5 shadow-2xl ring-1 ring-white/20">
                {/* Outer Phone Bezel Shine */}
                <div className="absolute inset-0 rounded-[48px] border-4 border-gray-800 pointer-events-none" />

                {/* Speaker & Dynamic Island Top Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-900 border border-gray-800 ml-auto mr-3" />
                </div>

                {/* Phone Display Screen */}
                <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black shadow-inner">
                  <Image
                    src={currentScreen.imageSrc}
                    alt={currentScreen.title}
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 290px, 320px"
                  />
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/70 rounded-full z-30" />
              </div>
            </div>

            {/* Right Column: Detailed Feature Callouts as Described by User */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${currentScreen.badgeColor}`}
                  >
                    {currentScreen.badge}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Screen {activeTab + 1} of 3
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
                  {currentScreen.title}
                </h3>

                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {currentScreen.tagline}
                </p>
              </div>

              {/* Bullet Features Grid */}
              <div className="space-y-3 pt-2">
                {currentScreen.keyFeatures.map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:shadow-sm transition-all flex items-start gap-3.5 group"
                    >
                      <div
                        className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
                      >
                        <ItemIcon size={20} className={item.color} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-[#0B132B]">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed font-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Download App Shortcut */}
              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <a
                  href="#download"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-black shadow-md shadow-[#F96176]/25 transition"
                >
                  <Smartphone size={15} />
                  <span>Download App for Android & iOS</span>
                  <ArrowRight size={14} />
                </a>

                <div className="text-xs text-gray-500 font-medium">
                  Available for all certified mechanics & fleet technicians.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 App Screens Gallery Preview Row */}
        <div className="pt-6 space-y-4">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">
              Interactive Screen Tour
            </span>
            <h4 className="text-xl font-black text-[#0B132B] mt-0.5">
              Tap any screen below to inspect its features
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {screens.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setActiveTab(idx as 0 | 1 | 2)}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  activeTab === idx
                    ? "bg-[#0B132B] text-white border-transparent shadow-xl ring-2 ring-[#F96176]"
                    : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-2xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        activeTab === idx
                          ? "bg-[#F96176] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Step 0{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        activeTab === idx ? "text-[#58BB87]" : "text-gray-400"
                      }`}
                    >
                      {activeTab === idx ? "● Active View" : "Click to view"}
                    </span>
                  </div>

                  <h5 className="text-base font-black tracking-tight">
                    {s.title}
                  </h5>
                  <p
                    className={`text-xs line-clamp-2 ${
                      activeTab === idx ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {s.subtitle}
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t text-xs font-bold flex items-center justify-between ${
                    activeTab === idx
                      ? "border-gray-800 text-[#F96176]"
                      : "border-gray-100 text-gray-700"
                  }`}
                >
                  <span>Inspect Screenshot</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
