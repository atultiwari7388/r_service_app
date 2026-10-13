"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Wrench,
} from "lucide-react";

export interface JobRequestItem {
  id: string;
  unit: string;
  type: "Semi-Truck" | "53ft Trailer" | "Reefer" | "Chassis";
  carrier: string;
  issue: string;
  location: string;
  distance: string;
  timeAgo: string;
  urgency: "Emergency Roadside" | "High Priority Reefer" | "In-Shop PM" | "Trailer Structural";
  payoutEst: number;
}

const INITIAL_REQUESTS: JobRequestItem[] = [
  {
    id: "req-01",
    unit: "Kenworth T680 • Unit #KW-8921",
    type: "Semi-Truck",
    carrier: "Swift Transportation",
    issue: "Blown Air Brake Diaphragm & Chamber Pressure Drop (Truck immobilized on highway shoulder)",
    location: "Interstate 5 NB MM 214 (Near Coalinga Exit)",
    distance: "14 miles away",
    timeAgo: "2 mins ago",
    urgency: "Emergency Roadside",
    payoutEst: 540,
  },
  {
    id: "req-02",
    unit: "Great Dane 53' Reefer • Unit #GD-4109",
    type: "Reefer",
    carrier: "Prime Inc. Cold Chain",
    issue: "Thermo King PreTrip Fault Code 17 (Reefer Engine Temp High - Frozen Produce Cargo at Risk)",
    location: "CA-99 Southbound Exit 132 Commercial Truck Plaza",
    distance: "8 miles away",
    timeAgo: "7 mins ago",
    urgency: "High Priority Reefer",
    payoutEst: 1150,
  },
  {
    id: "req-03",
    unit: "Freightliner Cascadia • Fleet #FL-3310",
    type: "Semi-Truck",
    carrier: "JB Hunt Intermodal",
    issue: "Cummins X15 DEF Header Sensor Fault & 5 MPH Derate Countdown (Needs forced regen + diagnostic)",
    location: "Shop Bay Receiving Yard • 7420 N Palm Ave",
    distance: "On-Site Yard",
    timeAgo: "15 mins ago",
    urgency: "In-Shop PM",
    payoutEst: 780,
  },
  {
    id: "req-04",
    unit: "Wabash 53' Dry Van • Unit #WB-9022",
    type: "53ft Trailer",
    carrier: "Schneider National",
    issue: "Bent Landing Gear Crank & Cracked Rear Swing-Door Hinge (Requires structural welding)",
    location: "Fresno Industrial Distribution Center",
    distance: "11 miles away",
    timeAgo: "28 mins ago",
    urgency: "Trailer Structural",
    payoutEst: 620,
  },
];

export default function NewJobRequests() {
  const [requests, setRequests] = useState<JobRequestItem[]>(INITIAL_REQUESTS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [acceptedJobIds, setAcceptedJobIds] = useState<string[]>([]);
  const [declinedJobIds, setDeclinedJobIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAccept = (id: string, unit: string) => {
    setAcceptedJobIds((prev) => [...prev, id]);
    setActionNotice(`Dispatched: ${unit} has been accepted and assigned to Bay #3!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDecline = (id: string, unit: string) => {
    setDeclinedJobIds((prev) => [...prev, id]);
    setActionNotice(`Declined: ${unit} was routed to regional backup technician.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredRequests = requests.filter((req) => {
    if (declinedJobIds.includes(req.id)) return false;
    if (activeFilter === "emergency") return req.urgency === "Emergency Roadside";
    if (activeFilter === "reefer") return req.urgency === "High Priority Reefer";
    if (activeFilter === "shop") return req.urgency === "In-Shop PM" || req.urgency === "Trailer Structural";
    return true;
  });

  const pendingCount = requests.filter(
    (r) => !acceptedJobIds.includes(r.id) && !declinedJobIds.includes(r.id)
  ).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#FFEBF3] text-[#F96176] flex items-center justify-center font-bold shadow-xs">
            <BellRing size={22} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#0B132B] tracking-tight">
                New Jobs Requests
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F96176] text-white text-xs font-black">
                {pendingCount} Pending Calls
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live commercial truck & trailer roadside breakdown and in-bay dispatch alerts
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#0B132B] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Requests ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter("emergency")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "emergency"
                ? "bg-[#F96176] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Roadside Emergency
          </button>
          <button
            onClick={() => setActiveFilter("reefer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "reefer"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Reefer Diagnostics
          </button>
          <button
            onClick={() => setActiveFilter("shop")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "shop"
                ? "bg-[#58BB87] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            In-Shop PM & Trailer
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="bg-[#EAF8F1] border border-[#58BB87]/40 text-[#58BB87] px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-[#58BB87]" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Requests Feed Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Check size={28} className="mx-auto text-[#58BB87] mb-2" />
            <p className="text-sm font-bold text-gray-700">All pending requests handled!</p>
            <p className="text-xs text-gray-400 mt-1">
              Your bay is ready for the next incoming commercial breakdown call.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isAccepted = acceptedJobIds.includes(req.id);

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                  isAccepted
                    ? "bg-[#EAF8F1]/40 border-[#58BB87] ring-1 ring-[#58BB87]/40"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Column: Unit details & Issue */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-[#0B132B]">
                        {req.unit}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {req.carrier}
                      </span>

                      {/* Urgency Badge */}
                      <span
                        className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          req.urgency === "Emergency Roadside"
                            ? "bg-[#FFEBF3] text-[#F96176] border border-[#F96176]/30"
                            : req.urgency === "High Priority Reefer"
                            ? "bg-amber-50 text-amber-700 border border-amber-300"
                            : req.urgency === "Trailer Structural"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-[#0078A6] border border-blue-200"
                        }`}
                      >
                        {req.urgency === "Emergency Roadside" && <Flame size={12} />}
                        {req.urgency === "High Priority Reefer" && <AlertTriangle size={12} />}
                        {req.urgency === "Trailer Structural" && <Wrench size={12} />}
                        <span>{req.urgency}</span>
                      </span>

                      <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto lg:ml-0">
                        <Clock size={12} />
                        {req.timeAgo}
                      </span>
                    </div>

                    {/* Breakdown Description */}
                    <p className="text-xs font-medium text-gray-800 leading-relaxed">
                      <strong className="text-gray-900">Diagnosis / Issue:</strong>{" "}
                      {req.issue}
                    </p>

                    {/* Location & Proximity */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap pt-1">
                      <div className="flex items-center gap-1 font-semibold text-[#0B132B]">
                        <MapPin size={13} className="text-[#F96176]" />
                        <span>{req.location}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs font-bold text-[#58BB87]">
                        {req.distance}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs font-extrabold text-gray-900 flex items-center gap-0.5">
                        <DollarSign size={13} className="text-[#58BB87]" />
                        Est. Payout: ${req.payoutEst.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Accept / Decline Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                    {isAccepted ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#58BB87] text-white text-xs font-black shadow-md">
                        <Check size={16} />
                        <span>Job Assigned to Bay #3</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAccept(req.id, req.unit)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-black shadow-md shadow-[#58BB87]/25 transition-all cursor-pointer"
                        >
                          <Check size={15} />
                          <span>Accept Job</span>
                        </button>

                        <button
                          onClick={() => handleDecline(req.id, req.unit)}
                          className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-[#F96176] text-xs font-bold border border-gray-200 hover:border-[#F96176]/30 transition-all cursor-pointer"
                          title="Route to backup technician"
                        >
                          <X size={15} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link to Find Jobs full table */}
      <div className="pt-2 text-center">
        <Link
          href="/find-jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#F96176] hover:text-[#e0485d] transition-colors"
        >
          <span>View all 27 fleet work orders in Find Jobs dispatch console</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
