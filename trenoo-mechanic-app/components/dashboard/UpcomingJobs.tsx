"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  X,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import { MockJob, MOCK_UPCOMING_JOBS } from "@/data/mockJobs";
import JobRequestCard from "./JobRequestCard";

export default function UpcomingJobs() {
  const [jobs, setJobs] = useState<MockJob[]>(MOCK_UPCOMING_JOBS);
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAccept = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "Accepted" } : j))
    );
    const target = jobs.find((j) => j.id === jobId);
    setToastMessage(
      `Job #${jobId} (${target?.vehicleModel || "Vehicle"}) accepted & dispatched to your bay schedule!`
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  return (
    <section id="upcoming-jobs" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F96176]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#F96176]">
              Dispatch Pipeline
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] mt-1 tracking-tight">
            Upcoming Job Requests
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Commercial truck and trailer service dispatches awaiting bay allocation and roadside response.
          </p>
        </div>

        {/* Mock Data Note Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
          <Info size={14} className="text-[#0078A6]" />
          <span>Interactive Mock Data (Demo Only)</span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#EAF8F1] border border-[#58BB87]/40 text-[#58BB87] text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#58BB87]" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-500 hover:text-gray-800 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Sample Cards Grid */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-gray-200">
          <CheckCircle2 size={36} className="mx-auto text-[#58BB87] mb-2" />
          <h3 className="text-base font-bold text-gray-900">
            No Upcoming Job Requests
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            All pending service orders have been accepted or scheduled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobRequestCard
              key={job.id}
              job={job}
              onAccept={handleAccept}
              onViewDetails={(j) => setSelectedJob(j)}
            />
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-500">
          Showing 3 sample commercial requests
        </span>
        <Link
          href="/find-jobs"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#F96176] hover:text-[#e0485d] transition-colors"
        >
          <span>Open Full Fleet Job Board</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Accessible Job Details Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-job-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-mono font-black text-gray-400">
                  WORK ORDER #{selectedJob.id}
                </span>
                <h3
                  id="modal-job-title"
                  className="text-lg font-black text-[#0B132B] mt-0.5"
                >
                  {selectedJob.vehicleModel}
                </h3>
                <p className="text-xs font-semibold text-[#F96176]">
                  {selectedJob.customerName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Service & Issue Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Reported Issue Description
                </span>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {selectedJob.issueDescription}
                </p>
              </div>

              {selectedJob.requiredParts && (
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                    Recommended Parts & Tools
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requiredParts.map((part) => (
                      <span
                        key={part}
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Wrench size={11} className="text-[#0B132B]" />
                        <span>{part}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location & Payout Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Location & Radius
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedJob.location}
                  </p>
                  <p className="text-[11px] text-[#58BB87] font-semibold">
                    {selectedJob.estimatedDistance}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Estimated Labor & Payout
                  </span>
                  <p className="text-lg font-black text-[#0B132B] mt-0.5">
                    ${selectedJob.estimatedPayment.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Direct Account Billing
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedJob.status === "Pending" && (
                <button
                  type="button"
                  onClick={() => {
                    handleAccept(selectedJob.id);
                    handleCloseModal();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-black text-xs shadow-md shadow-[#58BB87]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Accept This Job</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
