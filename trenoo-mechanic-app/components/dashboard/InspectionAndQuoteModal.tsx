"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ClipboardCheck,
  DollarSign,
  Clock,
  Wrench,
  AlertCircle,
  FileText,
  Truck,
} from "lucide-react";
import { FirestoreJob, MechanicOffer } from "@/types/job";

interface InspectionAndQuoteModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  currentOffer?: MechanicOffer;
  onSubmit: (params: {
    finalAmount: number;
    inspectionNotes: string;
    estimatedMinutes: number;
  }) => Promise<void>;
}

export default function InspectionAndQuoteModal({
  job,
  isOpen,
  onClose,
  currentOffer,
  onSubmit,
}: InspectionAndQuoteModalProps) {
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const quoteReference = (() => {
    const fix = Number(currentOffer?.fixPrice) || 0;
    if (fix > 0) return `$${fix} flat`;
    const arrival = Number(currentOffer?.arrivalCharges) || 0;
    const hourly = Number(currentOffer?.perHourCharges) || 0;
    if (arrival || hourly) return `$${arrival} arrival + $${hourly}/hr`;
    return "";
  })();

  useEffect(() => {
    if (job && isOpen) {
      // The technician must enter the verified amount after inspecting the vehicle.
      // Only a previously submitted verified amount is pre-filled; quotes are shown as reference.
      setFinalAmount(Number(job.finalDiagnosedAmount) || 0);
      setInspectionNotes(job.inspectionNotes || "");
      setEstimatedMinutes(job.estimatedRepairMinutes || 45);
      setFormError("");
    }
  }, [job, isOpen, currentOffer]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionNotes.trim()) {
      setFormError("Diagnostic notes are required.");
      return;
    }
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
      setFormError("Enter the estimated repair time in minutes.");
      return;
    }
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      setFormError("Enter the verified final amount (greater than $0).");
      return;
    }
    setFormError("");

    setIsSubmitting(true);
    try {
      await onSubmit({
        finalAmount: Number(finalAmount),
        inspectionNotes: inspectionNotes.trim(),
        estimatedMinutes: Number(estimatedMinutes),
      });
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col gap-5 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-[#58BB87] flex items-center justify-center">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                On-Site Vehicle Inspection & Final Invoice
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Conduct physical diagnostic check & set verified repair amount
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vehicle & Job Summary Badge */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Truck size={14} className="text-gray-400" /> Unit:
            </span>
            <span className="font-extrabold text-gray-900">
              {job.companyName
                ? `${job.companyName} (${job.vehicleNumber || "Unit"})`
                : job.vehicleNumber || "Commercial Vehicle"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Wrench size={14} className="text-[#F96176]" /> Service:
            </span>
            <span className="font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
              {job.selectedService}
            </span>
          </div>
        </div>

        {/* Notice to Technician */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Customer Work Authorization:</strong> Once you submit this final
            inspection amount, the customer will receive the verified invoice on their
            portal to authorize and pay (Online Stripe / Cash).
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Field 1: Diagnostic Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <FileText size={14} className="text-[#F96176]" />
              <span>Diagnostic Notes: physical fault discovered *</span>
            </label>
            <textarea
              required
              rows={3}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="e.g., Primary airline fitting cracked at the trailer gladhand. Replace 3/8 brass union and leak-check at 120 PSI."
              className="w-full p-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20"
            />
          </div>

          {/* Field 2: Estimated Repair Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-500" />
              <span>Estimated Repair Minutes *</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEstimatedMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    estimatedMinutes === mins
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {mins}m
                </button>
              ))}
              <input
                type="number"
                min="1"
                step="1"
                required
                value={estimatedMinutes || ""}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 0)}
                aria-label="Custom repair minutes"
                className="w-full px-2 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 text-center focus:outline-hidden focus:border-blue-300"
              />
            </div>
          </div>

          {/* Field 3: Verified Final Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <DollarSign size={14} className="text-[#58BB87]" />
              <span>Verified Final Amount ($) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={finalAmount || ""}
                onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 275.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-black text-gray-900 focus:outline-hidden focus:border-[#58BB87] focus:ring-2 focus:ring-[#58BB87]/20"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Exact final bill for parts + labor.
              {quoteReference ? ` Original quote: ${quoteReference}.` : ""}
            </p>
          </div>

          {formError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-extrabold transition shadow-md shadow-[#58BB87]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ClipboardCheck size={15} />
              <span>
                {isSubmitting
                  ? "Submitting Work Order..."
                  : "Submit Work Order & Send Invoice"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
