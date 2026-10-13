"use client";

import React from "react";
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Wrench,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { MockJob } from "@/data/mockJobs";

interface JobRequestCardProps {
  job: MockJob;
  onAccept: (jobId: string) => void;
  onViewDetails: (job: MockJob) => void;
}

export default function JobRequestCard({
  job,
  onAccept,
  onViewDetails,
}: JobRequestCardProps) {
  const isAccepted = job.status === "Accepted";

  // Category Icon & Badge Colors
  const getCategoryStyles = () => {
    switch (job.category) {
      case "Emergency Roadside Assistance":
        return {
          icon: <Flame size={15} className="text-[#F96176]" />,
          bg: "bg-[#FFEBF3] text-[#F96176] border-[#F96176]/30",
        };
      case "Engine Repair":
        return {
          icon: <Wrench size={15} className="text-amber-600" />,
          bg: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "Brake Inspection":
        return {
          icon: <CheckCircle2 size={15} className="text-[#58BB87]" />,
          bg: "bg-[#EAF8F1] text-[#58BB87] border-[#58BB87]/30",
        };
      default:
        return {
          icon: <Truck size={15} className="text-[#0078A6]" />,
          bg: "bg-blue-50 text-[#0078A6] border-blue-200",
        };
    }
  };

  const categoryStyle = getCategoryStyles();

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between relative overflow-hidden card-3d ${
        isAccepted
          ? "bg-[#EAF8F1]/40 border-[#58BB87] ring-1 ring-[#58BB87]/40 shadow-sm"
          : "bg-white border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-lg"
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          job.priority === "Urgent"
            ? "bg-[#F96176]"
            : job.priority === "High"
            ? "bg-amber-500"
            : "bg-[#58BB87]"
        }`}
      />

      <div className="space-y-4">
        {/* Header: ID, Vehicle Type & Priority Badge */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-[#0B132B] bg-gray-100 px-2 py-0.5 rounded">
                #{job.id}
              </span>
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                {job.vehicleType}
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-400 font-bold px-1.5 py-0.5 rounded">
                Sample Data
              </span>
            </div>

            <h3 className="text-base font-black text-[#0B132B] mt-1 line-clamp-1">
              {job.vehicleModel}
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              Customer: <strong className="text-gray-800">{job.customerName}</strong>
            </p>
          </div>

          {/* Priority & Status Pill */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border flex items-center gap-1 ${
                job.priority === "Urgent"
                  ? "bg-red-50 text-[#F96176] border-[#F96176]/30 animate-pulse"
                  : job.priority === "High"
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-green-50 text-[#58BB87] border-[#58BB87]/30"
              }`}
            >
              {job.priority === "Urgent" && <AlertTriangle size={11} />}
              <span>{job.priority} Priority</span>
            </span>

            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                isAccepted
                  ? "bg-[#58BB87] text-white"
                  : job.status === "In Progress"
                  ? "bg-[#0B132B] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isAccepted ? "Accepted • Dispatched" : job.status}
            </span>
          </div>
        </div>

        {/* Service Category Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${categoryStyle.bg}`}
          >
            {categoryStyle.icon}
            <span>{job.category}</span>
          </span>
        </div>

        {/* Location & Distance */}
        <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex items-start gap-1.5">
            <MapPin size={14} className="text-[#F96176] shrink-0 mt-0.5" />
            <span className="font-semibold text-gray-900 leading-snug">
              {job.location}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500 border-t border-gray-200/60 font-medium">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              <span>{job.requestedDateTime}</span>
            </span>
            <span className="font-bold text-[#58BB87]">
              {job.estimatedDistance}
            </span>
          </div>
        </div>

        {/* Payment & Issue snippet */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-medium">Est. Payment:</span>
            <span className="text-base font-black text-[#0B132B]">
              ${job.estimatedPayment.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Verified Account</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(job)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>View Details</span>
          <ChevronRight size={14} />
        </button>

        {job.status === "Pending" && !isAccepted ? (
          <button
            type="button"
            onClick={() => onAccept(job.id)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-black shadow-md shadow-[#58BB87]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Accept Job</span>
          </button>
        ) : isAccepted ? (
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-[#EAF8F1] text-[#58BB87] border border-[#58BB87]/40 text-xs font-black flex items-center justify-center gap-1">
            <CheckCircle2 size={15} />
            <span>Dispatched</span>
          </div>
        ) : (
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold text-center">
            {job.status}
          </div>
        )}
      </div>
    </div>
  );
}
