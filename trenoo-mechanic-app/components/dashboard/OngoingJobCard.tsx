"use client";

import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Phone,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Wrench,
  Truck,
  Star,
  PlayCircle,
  Banknote,
} from "lucide-react";
import { FirestoreJob, MechanicOffer } from "@/types/job";

interface OngoingJobCardProps {
  job: FirestoreJob;
  currentUId: string;
  onUpdateStatus: (jobId: string, userId: string, newStatus: number) => Promise<void>;
  onCancelClick: (job: FirestoreJob) => void;
  onRateClick: (job: FirestoreJob) => void;
}

export default function OngoingJobCard({
  job,
  currentUId,
  onUpdateStatus,
  onCancelClick,
  onRateClick,
}: OngoingJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Retrieve mechanic's specific offer
  const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
  const offerStatus = myOffer?.status ?? job.status;

  // Format date
  const formattedDate = (() => {
    try {
      let d: Date;
      if (job.orderDate?.toDate) {
        d = job.orderDate.toDate();
      } else if (job.orderDate?.seconds) {
        d = new Date(job.orderDate.seconds * 1000);
      } else if (job.orderDate instanceof Date) {
        d = job.orderDate;
      } else {
        d = new Date();
      }
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Active";
    }
  })();

  const handleAdvanceStatus = async (targetStatus: number) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(job.id, job.userId, targetStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const openDirections = () => {
    const lat = job.userLat || 0;
    const lng = job.userLong || 0;
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
    } else if (job.userDeliveryAddress) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          job.userDeliveryAddress
        )}`,
        "_blank"
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col gap-4">
      {/* HEADER: Avatar, ID, Status Badge & Date */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-700">
            {job.userPhoto ? (
              <img
                src={job.userPhoto}
                alt={job.userName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as any).style.display = "none";
                }}
              />
            ) : (
              <span className="text-[#58BB87] text-xs font-black">
                {(job.userName || "CU").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-500">
                #{job.orderId}
              </span>
              <span className="text-[11px] font-bold text-gray-400">•</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {job.calculatedDistance || 1} km away
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 truncate">
              {job.myCompany || job.userName || "Commercial Customer"}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
              <MapPin size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">{job.userDeliveryAddress || "Highway Breakdown"}</span>
            </div>
          </div>
        </div>

        {/* Step Status Badge */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Calendar size={11} /> {formattedDate}
          </span>

          {offerStatus === 1 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] animate-pulse">
              1/4 Waiting for Driver
            </span>
          )}
          {offerStatus === 2 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-[11px]">
              2/4 Driver Choosing Payment
            </span>
          )}
          {offerStatus === 3 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-[#58BB87]/15 border border-[#58BB87]/30 text-[#58BB87] font-extrabold text-[11px]">
              3/4 Driver Confirmed • En Route
            </span>
          )}
          {offerStatus === 4 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-[11px]">
              4/4 Service In Progress
            </span>
          )}
          {offerStatus === 5 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px]">
              ✓ Completed
            </span>
          )}
          {offerStatus === -1 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[11px]">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* SERVICE SPECIFICATION */}
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500 flex items-center gap-1.5">
            <Wrench size={13} className="text-[#F96176]" /> Service:
          </span>
          <span className="font-extrabold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
            {job.selectedService}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500 flex items-center gap-1.5">
            <Truck size={13} className="text-gray-400" /> Unit:
          </span>
          <span className="font-bold text-gray-800">
            {job.companyName
              ? `${job.companyName} (${job.vehicleNumber || "Unit"})`
              : job.vehicleNumber || "Class 8 Semi-Truck"}
          </span>
        </div>

        {myOffer && (
          <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <DollarSign size={13} className="text-[#58BB87]" /> Your Quote:
            </span>
            <span className="font-bold text-gray-800">
              {myOffer.fixPrice && Number(myOffer.fixPrice) > 0
                ? `$${myOffer.fixPrice} Flat`
                : `Arrival: $${myOffer.arrivalCharges} | $${myOffer.perHourCharges}/hr`}
            </span>
          </div>
        )}

        {job.payMode && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Banknote size={13} className="text-gray-400" /> Payment Mode:
            </span>
            <span className="font-black text-gray-900">{job.payMode}</span>
          </div>
        )}
      </div>

      {/* STATUS-SPECIFIC MESSAGES & INSTRUCTIONS (from Flutter) */}
      {offerStatus === 3 && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs text-emerald-900 font-medium">
          <span className="font-bold block mb-0.5">✓ Driver confirmed your offer!</span>
          Click the Map button to navigate to the vehicle location immediately.
        </div>
      )}

      {offerStatus === -1 && job.cancelReason && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
          <span className="font-bold">Cancellation Reason:</span> {job.cancelReason}
        </div>
      )}

      {/* ACTION TOOLBAR BY STATUS */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
        {/* Step 1: Waiting for driver acceptance */}
        {offerStatus === 1 && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
              <Clock size={14} className="animate-spin text-amber-500" />
              <span>Offer sent. Awaiting driver confirmation...</span>
            </div>
            <button
              onClick={() => onCancelClick(job)}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#F96176] font-bold text-xs transition cursor-pointer"
            >
              Cancel Offer
            </button>
          </>
        )}

        {/* Step 2: Driver is selecting payment mode */}
        {offerStatus === 2 && (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-gray-600 font-semibold">
              Driver selected you and is choosing payment method...
            </span>
            <button
              onClick={() => onCancelClick(job)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Step 3: Driver confirmed, mechanic on the way */}
        {offerStatus === 3 && (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5">
              {job.userPhoneNumber && (
                <a
                  href={`tel:${job.userPhoneNumber}`}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
                >
                  <Phone size={13} className="text-[#58BB87]" />
                  <span>Call Driver</span>
                </a>
              )}
              <button
                onClick={openDirections}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
              >
                <Navigation size={13} className="text-[#58BB87]" />
                <span>Map</span>
              </button>
            </div>

            <button
              onClick={() => handleAdvanceStatus(4)}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <PlayCircle size={15} />
              <span>Arrived & Start Job</span>
            </button>
          </div>
        )}

        {/* Step 4: Service in progress */}
        {offerStatus === 4 && (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5">
              {job.userPhoneNumber && (
                <a
                  href={`tel:${job.userPhoneNumber}`}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
                >
                  <Phone size={13} className="text-[#58BB87]" />
                  <span>Call</span>
                </a>
              )}
            </div>

            <button
              onClick={() => handleAdvanceStatus(5)}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle size={16} />
              <span>
                {job.payMode === "COD"
                  ? "Collect Cash & Complete Job"
                  : "Complete Service Now"}
              </span>
            </button>
          </div>
        )}

        {/* Step 5: Completed */}
        {offerStatus === 5 && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                <CheckCircle size={14} /> Completed
              </span>
              {job.mRating && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {job.mRating} Rating Given
                </span>
              )}
            </div>

            <button
              onClick={() => onRateClick(job)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              <Star size={13} className="text-amber-500" />
              <span>{job.mReviewSubmitted ? "Edit Driver Review" : "Rate Driver"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
