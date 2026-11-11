"use client";

import React, { useState } from "react";
import { Clock, PlayCircle, X, AlertCircle } from "lucide-react";
import { FirestoreJob } from "@/types/job";

interface StartJobDurationModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (estimatedMinutes: number) => Promise<void>;
}

export default function StartJobDurationModal({
  job,
  isOpen,
  onClose,
  onConfirm,
}: StartJobDurationModalProps) {
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estimatedMinutes < 5) return;

    setIsSubmitting(true);
    try {
      await onConfirm(estimatedMinutes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const PRESET_DURATIONS = [30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#58BB87] text-white flex items-center justify-center shadow-xs">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Start Repair Work
              </h3>
              <p className="text-xs text-gray-500">
                Order #{job.orderId} • {job.selectedService}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-xs text-emerald-900 mb-4 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-[#58BB87] shrink-0 mt-0.5" />
          <span>
            Please estimate how long this repair will take. Your workshop owner will use this progress timer to manage smart dispatch queueing.
          </span>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Estimated Duration (Minutes)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="5"
                max="600"
                required
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#58BB87] focus:ring-2 focus:ring-[#58BB87]/20 transition"
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESET_DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setEstimatedMinutes(dur)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  estimatedMinutes === dur
                    ? "bg-[#58BB87] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {dur} mins
              </button>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a574] text-white text-xs font-bold shadow-md shadow-[#58BB87]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Confirm & Start Repair</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
