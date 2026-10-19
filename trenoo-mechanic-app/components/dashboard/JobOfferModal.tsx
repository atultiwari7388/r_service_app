"use client";

import React, { useState } from "react";
import { X, Clock, DollarSign, AlertCircle, Send } from "lucide-react";
import { FirestoreJob, SubmitOfferParams } from "@/types/job";

interface JobOfferModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: SubmitOfferParams) => Promise<void>;
  defaultPerHour?: number;
}

export default function JobOfferModal({
  job,
  isOpen,
  onClose,
  onSubmit,
  defaultPerHour = 50,
}: JobOfferModalProps) {
  const [arrivalCharges, setArrivalCharges] = useState<string>("30");
  const [arrivalTime, setArrivalTime] = useState<string>("15");
  const [perHourCharges, setPerHourCharges] = useState<string>(
    defaultPerHour ? defaultPerHour.toString() : "50"
  );
  const [fixPrice, setFixPrice] = useState<string>(
    job?.fixPrice ? job.fixPrice.toString() : "150"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const isFixedPrice = Boolean(job.fixPriceEnabled);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        jobId: job.id,
        userId: job.userId,
        arrivalCharges: isFixedPrice ? 0 : arrivalCharges,
        perHourCharges: isFixedPrice ? 0 : perHourCharges,
        fixPrice: isFixedPrice ? fixPrice : 0,
        arrivalTime: arrivalTime || "15",
      });
      onClose();
    } catch {
      // error handled by hook toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isFixedPrice ? "Submit Fixed Price Quote" : "Submit Service Offer"}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Order #{job.orderId} • {job.selectedService}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Advisory message from app */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold">
          <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <span>
            Kindly reach within time to get more jobs and avoid negative feedback.
          </span>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Estimated Arrival Time */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Estimated Arrival Time (Minutes)
            </label>
            <div className="relative">
              <Clock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                min="1"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="e.g. 15"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/10 outline-hidden text-sm text-gray-900 font-semibold"
              />
            </div>
          </div>

          {isFixedPrice ? (
            /* Fixed Price input */
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Total Fixed Service Charge ($)
              </label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={fixPrice}
                  onChange={(e) => setFixPrice(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/10 outline-hidden text-sm text-gray-900 font-semibold"
                />
              </div>
            </div>
          ) : (
            /* Arrival Charges & Per Hour Charges */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Arrival Fee ($)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={arrivalCharges}
                    onChange={(e) => setArrivalCharges(e.target.value)}
                    placeholder="30"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/10 outline-hidden text-sm text-gray-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Per Hour Rate ($)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={perHourCharges}
                    onChange={(e) => setPerHourCharges(e.target.value)}
                    placeholder="50"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/10 outline-hidden text-sm text-gray-900 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isSubmitting ? "Submitting..." : "Send Offer to Driver"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
