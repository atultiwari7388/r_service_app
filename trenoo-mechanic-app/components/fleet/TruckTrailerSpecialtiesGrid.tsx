"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  Wrench,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle,
  ArrowRight,
  Flame,
} from "lucide-react";

export default function TruckTrailerSpecialtiesGrid() {
  const specialties = [
    {
      icon: <Truck size={28} className="text-[#F96176]" />,
      title: "Class 8 Semi-Tractor Repair",
      badge: "Heavy Duty Diesel",
      desc: "Full engine overhauls and electronic diagnostics for Detroit DD13/DD15, Cummins X15, PACCAR MX, and Volvo D13 diesel platforms.",
      highlights: [
        "Turbocharger & EGR cooler replacement",
        "Eaton Fuller 10/13/18-speed transmissions",
        "Clutch adjustment & replacement",
        "Differential & drive axle rebuilds",
      ],
      link: "/find-jobs#semi-tractor",
    },
    {
      icon: <Layers size={28} className="text-[#F96176]" />,
      title: "Commercial Semi-Trailer Maintenance",
      badge: "Dry Van & Flatbed",
      desc: "Comprehensive repair for Great Dane, Utility, Wabash, and Hyundai commercial trailers, intermodal chassis, and specialized lowboys.",
      highlights: [
        "Air brake shoe, drum & S-cam replacements",
        "Air spring suspension & leveling valves",
        "Kingpin & fifth-wheel plate inspection",
        "Landing gear & rear impact guard repair",
      ],
      link: "/find-jobs#trailer",
    },
    {
      icon: <Flame size={28} className="text-[#FF9900]" />,
      title: "Refrigerated Reefer Trailer Units",
      badge: "Thermo King & Carrier",
      desc: "Specialized refrigeration mechanical and compressor diagnostics ensuring perishable cold chain temperature integrity.",
      highlights: [
        "Diesel reefer engine service & oil flush",
        "Compressor drive belt & clutch overhaul",
        "Microprocessor diagnostics & sensor probes",
        "Refrigerant leak detection & charging",
      ],
      link: "/find-jobs#reefer",
    },
    {
      icon: <ShieldCheck size={28} className="text-[#58BB87]" />,
      title: "Federal DOT Annual Inspections",
      badge: "49 CFR Part 396",
      desc: "Certified state and federal annual inspections for interstate commercial motor vehicles with official tamper-resistant decal issuance.",
      highlights: [
        "Digital 100-point brake stroke measurement",
        "Steering gear, tie rods & kingpins",
        "Lighting, wiring harnesses & reflector audit",
        "Instant digital PDF compliance certificate",
      ],
      link: "/inspections",
    },
    {
      icon: <Cpu size={28} className="text-[#F96176]" />,
      title: "Aftertreatment & DPF / DEF Systems",
      badge: "Emissions Certified",
      desc: "Clearing active MIL codes, forced manual regens, SCR catalyst diagnostics, and DEF doser valve replacement.",
      highlights: [
        "DPF thermal bake & ultrasonic cleaning",
        "NOx sensor & exhaust temp sensor testing",
        "DEF quality & pump pressure verification",
        "EPA emission compliance signoff",
      ],
      link: "/find-jobs#aftertreatment",
    },
    {
      icon: <Wrench size={28} className="text-gray-900" />,
      title: "Fleet Scheduled PM Services (A/B/C)",
      badge: "Fleet Volume Accounts",
      desc: "Preventative maintenance tailored for commercial freight carriers to minimize roadside downtime and maximize highway uptime.",
      highlights: [
        "15W-40 CK-4 synthetic blend oil drain",
        "High-capacity fuel & water separator filters",
        "Grease chassis, slack adjusters & U-joints",
        "Tire pressure & tread depth audit",
      ],
      link: "/find-jobs#pm-services",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider text-[#F96176]">
          Heavy Duty Repair Capabilities
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
          Specialized Commercial Fleet Bays
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Equipped with 20-ton hydraulic column lifts, 1-inch commercial torque tools, and certified OEM diagnostic software.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.map((spec) => (
          <div
            key={spec.title}
            className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {spec.icon}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                  {spec.badge}
                </span>
              </div>

              <h4 className="text-lg font-black text-gray-900 mb-2">
                {spec.title}
              </h4>
              <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                {spec.desc}
              </p>

              <div className="space-y-2 pt-4 border-t border-gray-100 mb-6">
                {spec.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle size={14} className="text-[#58BB87] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={spec.link}
              className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-[#F96176] text-gray-700 hover:text-white font-bold text-xs border border-gray-200 hover:border-[#F96176] transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Bay Work Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
