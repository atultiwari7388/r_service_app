"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface CancelReasonModalProps {
  isOpen: boolean;
  orderId: string;
  reasons: string[];
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function CancelReasonModal({
  isOpen,
  orderId,
  reasons,
  onClose,
  onConfirm,
}: CancelReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    reasons[0] || "Other"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={20} />
            <h3 className="text-base font-bold text-gray-900">
              Cancel Job #{orderId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-600 font-medium">
          Please select a cancellation reason to notify dispatch and the driver:
        </p>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {reasons.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                selectedReason === reason
                  ? "border-[#F96176] bg-rose-50/50 text-gray-900"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="cancelReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className="text-[#F96176] focus:ring-[#F96176]"
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
