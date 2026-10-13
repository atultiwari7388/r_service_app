"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Users, Plus, ShieldCheck, Phone } from "lucide-react";
import { TechnicianMember } from "@/types";

const MOCK_TEAM: TechnicianMember[] = [
  {
    id: "tech-1",
    name: "Marcus Vance",
    title: "Lead Master Technician",
    specialty: "Heavy Duty Diesel",
    assignedBay: "Bay #1 & Bay #2",
    status: "in_bay",
    aseCertified: true,
    phone: "+1 (559) 388-6914",
  },
  {
    id: "tech-2",
    name: "Elena Rostova",
    title: "Commercial Trailer Specialist",
    specialty: "Trailer & Air Brakes",
    assignedBay: "Bay #3 (Air Brake Line)",
    status: "in_bay",
    aseCertified: true,
    phone: "+1 (559) 388-6915",
  },
  {
    id: "tech-3",
    name: "David Kim",
    title: "Reefer & Electronics Tech",
    specialty: "Reefer Master",
    assignedBay: "Bay #4 (Reefer Service)",
    status: "available",
    aseCertified: true,
    phone: "+1 (559) 388-6916",
  },
  {
    id: "tech-4",
    name: "Carlos Mendez",
    title: "DOT Certified Inspector",
    specialty: "DOT Inspector",
    assignedBay: "Bay #5 (DOT Certification)",
    status: "available",
    aseCertified: true,
    phone: "+1 (559) 388-6917",
  },
];

export default function TeamPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
              <Users size={14} />
              <span>Workshop Personnel</span>
            </div>
            <h1 className="text-3xl font-black text-[#0B132B] mt-1">
              Heavy Duty Technician Team
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage ASE-certified diesel mechanics, trailer specialists, and bay assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Add Technician modal opened.")}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Technician</span>
            </button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_TEAM.map((tech) => (
            <div
              key={tech.id}
              className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      tech.status === "in_bay"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-[#EAF8F1] text-[#58BB87]"
                    }`}
                  >
                    ● {tech.status === "in_bay" ? "In Bay" : "Available"}
                  </span>
                  {tech.aseCertified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#0078A6]">
                      <ShieldCheck size={14} /> ASE
                    </span>
                  )}
                </div>

                <div className="h-12 w-12 rounded-xl bg-[#0B132B] text-white flex items-center justify-center font-bold text-base mb-3 shadow">
                  {tech.name.split(" ").map((n) => n[0]).join("")}
                </div>

                <h3 className="text-base font-black text-[#0B132B]">
                  {tech.name}
                </h3>
                <p className="text-xs text-gray-500 font-semibold mb-2">
                  {tech.title}
                </p>

                <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Specialty:</span>
                    <span className="font-bold text-gray-800">{tech.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned:</span>
                    <span className="font-bold text-[#F96176]">{tech.assignedBay}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100">
                <a
                  href={`tel:${tech.phone}`}
                  className="w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Call Bay</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
