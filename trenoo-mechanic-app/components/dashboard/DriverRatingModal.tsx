"use client";

import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { SubmitRatingParams } from "@/types/job";

interface DriverRatingModalProps {
  isOpen: boolean;
  jobId: string;
  userId: string;
  orderId: string;
  existingRating?: number;
  existingReview?: string;
  onClose: () => void;
  onSubmit: (params: SubmitRatingParams) => Promise<void>;
}

export default function DriverRatingModal({
  isOpen,
  jobId,
  userId,
  orderId,
  existingRating = 5,
  existingReview = "",
  onClose,
  onSubmit,
}: DriverRatingModalProps) {
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>(existingReview || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        jobId,
        userId,
        orderId,
        rating,
        review,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Rate Customer / Driver</h3>
            <p className="text-xs text-gray-500 font-medium">Order #{orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="text-xs font-bold text-gray-600">Select Rating</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 hover:text-gray-400"
                      }
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {rating === 5
                ? "5.0 - Excellent Experience"
                : rating === 4
                ? "4.0 - Good"
                : rating === 3
                ? "3.0 - Average"
                : rating === 2
                ? "2.0 - Poor"
                : "1.0 - Terrible"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Review & Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Driver was prompt, vehicle was parked safely on the shoulder..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/10 outline-hidden text-xs text-gray-900 resize-none font-medium"
            />
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
