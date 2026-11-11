"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, X } from "lucide-react";
import { FirestoreJob } from "@/types/job";
import toast from "react-hot-toast";

interface EmergencyHandoverModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobId: string, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  "Feeling unwell / sudden illness",
  "Specialized tool / diagnostic equipment failure",
  "Severe safety hazard on highway site",
  "Incorrect parts required for commercial unit",
];

export default function EmergencyHandoverModal({
  job,
  isOpen,
  onClose,
  onSubmit,
}: EmergencyHandoverModalProps) {
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim()
      ? `${reason} - ${customNote.trim()}`
      : reason;

    setIsSubmitting(true);
    try {
      await onSubmit(job.id, finalReason);
      toast.success("Emergency handover requested. Owner notified.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit handover request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Request Job Handover
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

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          If you are unable to complete this repair due to sudden health issues or equipment breakdown, request a handover. Your workshop owner will immediately reassign another technician to this location.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Select Primary Reason
            </label>
            <div className="space-y-2">
              {COMMON_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    reason === r
                      ? "border-amber-500 bg-amber-50/60 font-semibold text-amber-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="handoverReason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-amber-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Diagnosed air leak on driver side brake chamber..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Handover</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
