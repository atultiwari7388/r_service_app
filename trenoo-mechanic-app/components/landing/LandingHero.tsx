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
  Radio,
  Star,
  ArrowRight,
  PhoneCall,
  Smartphone,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function LandingHero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0B132B] text-white">
      {/* Background Image with High-End Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/find_mechanic.jpg"
          alt="Heavy Duty Commercial Fleet & Trailer Workshop"
          fill
          priority
          className="object-cover object-center opacity-30 mix-blend-luminosity scale-105 transform motion-safe:animate-pulse-slow"
        />
        {/* Layered Gradient Overlays to guarantee high contrast and vibrant brand colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#0B132B]/95 to-[#0B132B]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(#F96176_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F96176]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[#58BB87]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines, Text, Login & Register CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black uppercase tracking-wider text-gray-200 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58BB87] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58BB87]" />
              </span>
              <span>Commercial Fleet & Semi-Trailer Platform</span>
            </div>

            {/* Main Brand Title as Requested: Trenoo Mechanic */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Trenoo <span className="text-[#F96176]">Mechanic</span>
              </h1>
              <p className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-400">
                On-Demand Heavy-Duty Mobile & Shop Vehicle Repair
              </p>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Built exclusively for <strong className="text-white font-semibold">Class 8 Semi-Trucks and 53ft Trailers</strong>. 
              Connect with nearby verified mechanics for 24/7 roadside breakdown calls, 
              scheduled PM services, and certified DOT inspections. Keep America’s freight moving with zero downtime.
            </p>

            {/* Primary Action Buttons: Login & Register (as explicitly requested) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#F96176] hover:bg-[#e0485d] text-white font-black text-sm shadow-xl shadow-[#F96176]/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
              >
                <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
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
                href="#download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#1C2541] hover:bg-[#273469] text-gray-200 font-bold text-sm border border-gray-700/80 transition-colors"
              >
                <Smartphone size={17} className="text-[#F96176]" />
                <span>Get App</span>
              </a>
            </div>

            {/* Trust Highlights Badges */}
            <div className="pt-6 border-t border-gray-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#58BB87] shrink-0">
                  <Flame size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-white">24/7 Roadside</div>
                  <div className="text-[11px] text-gray-400">Emergency Dispatch</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#F96176] shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-white">DOT Certified</div>
                  <div className="text-[11px] text-gray-400">FMCSA Part 396</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 shrink-0">
                  <Star size={18} fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">4.98 Rating</div>
                  <div className="text-[11px] text-gray-400">500+ Fleets</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#0078A6] shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-white">5-Min Timer</div>
                  <div className="text-[11px] text-gray-400">Rapid Response</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D-Styled Fleet Dispatch Command Card Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Ambient Platform Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#F96176] to-[#58BB87] rounded-3xl blur-xl opacity-30 animate-pulse-slow" />

            <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1C2541] to-[#0B132B] border border-gray-700/80 p-6 sm:p-7 shadow-2xl space-y-5 text-left">
              {/* Card Header: Live Dispatch Radar */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-700/80">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58BB87] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#58BB87]" />
                  </span>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-200">
                      Live Mechanic Terminal
                    </h2>
                    <p className="text-[11px] text-[#58BB87] font-semibold">
                      Bay #3 & Mobile Unit Online
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#58BB87]/20 border border-[#58BB87]/40 text-[#58BB87] text-[10px] font-black uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Live Location Visual */}
              <div className="p-3.5 rounded-2xl bg-[#0B132B]/80 border border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#F96176]/20 text-[#F96176] flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Current GPS Service Radius
                    </span>
                    <p className="text-xs font-bold text-white truncate">
                      {APP_CONFIG.contact.address}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#58BB87] shrink-0 bg-[#58BB87]/15 px-2 py-0.5 rounded">
                  50-Mi Radius
                </span>
              </div>

              {/* Sample Dispatch Call Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#1C2541] to-[#273469]/50 border border-gray-700/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#F96176] text-white text-[10px] font-black uppercase flex items-center gap-1">
                    <Flame size={11} /> Urgent Request
                  </span>
                  <span className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
                    <Clock size={12} /> Auto-Cancel: 04:38
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white">
                    Freightliner Cascadia • 53ft Reefer
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
                    Blown air brake hose & pressure drop on Interstate Highway
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-400">Est. Payout:</span>
                  <span className="text-base font-black text-[#58BB87]">$480.00</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    className="py-2 px-3 rounded-xl bg-gray-700/80 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-default"
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
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-lg font-black text-white">1,480+</span>
                  <span className="block text-[10px] uppercase font-bold text-gray-400">
                    Jobs Completed
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-lg font-black text-[#58BB87]">14 Active</span>
                  <span className="block text-[10px] uppercase font-bold text-gray-400">
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
