"use client";

import React, { useState, useEffect } from "react";
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
  UserCheck,
  Radio,
  Send,
} from "lucide-react";
import { FirestoreJob, MechanicOffer } from "@/types/job";

interface OngoingJobCardProps {
  job: FirestoreJob;
  currentUId: string;
  isOwner?: boolean;
  onUpdateStatus: (jobId: string, userId: string, newStatus: number) => Promise<void>;
  onStartJobClick: (job: FirestoreJob) => void;
  onHandoverClick: (job: FirestoreJob) => void;
  onReassignClick: (job: FirestoreJob) => void;
  onCancelClick: (job: FirestoreJob) => void;
  onRateClick: (job: FirestoreJob) => void;
}

export default function OngoingJobCard({
  job,
  currentUId,
  isOwner = true,
  onUpdateStatus,
  onStartJobClick,
  onHandoverClick,
  onReassignClick,
  onCancelClick,
  onRateClick,
}: OngoingJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Retrieve mechanic's specific offer
  const myOffer = job.mechanicsOffer?.find(
    (o) => o.mId === currentUId || o.assignedMemberId === currentUId
  );
  const offerStatus = myOffer?.status ?? job.status;

  // Refresh progress clock every 10 seconds for live progress bar
  useEffect(() => {
    if (offerStatus === 4) {
      const interval = setInterval(() => setNowTime(Date.now()), 10000);
      return () => clearInterval(interval);
    }
  }, [offerStatus]);

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

  // Calculate live repair progress
  const progressDetails = (() => {
    if (offerStatus !== 4) return null;
    const startMs = job.activeJobStartedAt?.toMillis
      ? job.activeJobStartedAt.toMillis()
      : job.activeJobStartedAt?.seconds
      ? job.activeJobStartedAt.seconds * 1000
      : null;

    if (!startMs) return null;
    const elapsedMinutes = Math.max(0, Math.floor((nowTime - startMs) / 60000));
    const estimated = job.estimatedRepairMinutes || 45;
    const progressPercent = Math.min(100, Math.round((elapsedMinutes / estimated) * 100));

    return {
      elapsedMinutes,
      estimated,
      progressPercent,
      canQueueNext: progressPercent >= 70,
    };
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
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col gap-4">
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

      {/* ASSIGNED TECHNICIAN BADGE (Team Dispatch) */}
      {job.assignedMemberName && (
        <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#58BB87]" />
            <span className="text-gray-500 font-medium">Assigned Technician:</span>
            <span className="font-bold text-gray-900">{job.assignedMemberName}</span>
          </div>
          {job.assignedMemberCity && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#F96176]">
              📍 {job.assignedMemberCity}
            </span>
          )}
        </div>
      )}

      {/* EMERGENCY HANDOVER NOTIFICATION (Scenario 3) */}
      {job.handoverRequested && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">🚨 Emergency Handover Requested!</span>
              <p className="text-[11px] text-amber-800">
                Reason: {job.handoverReason || "Technician unable to complete on-site repair."}
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => onReassignClick(job)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
            >
              Reassign Now
            </button>
          )}
        </div>
      )}

      {/* LIVE PROGRESS TIMER & 70% THRESHOLD (Scenario 2) */}
      {progressDetails && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-gray-700">
              <Clock size={14} className="text-[#58BB87]" />
              Repair Progress:
            </span>
            <span className="text-gray-900">
              {progressDetails.elapsedMinutes}m / {progressDetails.estimated}m (
              {progressDetails.progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressDetails.canQueueNext ? "bg-[#58BB87]" : "bg-amber-500"
              }`}
              style={{ width: `${progressDetails.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500">70% Queueing Rule Threshold:</span>
            {progressDetails.canQueueNext ? (
              <span className="text-[#58BB87] font-extrabold">
                ✓ Ready for next job assignment
              </span>
            ) : (
              <span className="text-amber-700 font-bold">
                Blocked until 70% reached ({Math.round(progressDetails.estimated * 0.7)}m)
              </span>
            )}
          </div>
        </div>
      )}

      {/* SERVICE SPECIFICATION */}
      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2 text-xs">
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

      {/* ACTION TOOLBAR BY STATUS */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 flex-wrap">
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
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
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
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                <Navigation size={13} className="text-[#58BB87]" />
                <span>Map</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onHandoverClick(job)}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition cursor-pointer"
                title="Request Emergency Handover"
              >
                <AlertTriangle size={13} />
                <span>Handover</span>
              </button>

              <button
                onClick={() => onStartJobClick(job)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <PlayCircle size={15} />
                <span>Arrived & Set Duration</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Service in progress */}
        {offerStatus === 4 && (
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
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
              <button
                onClick={() => onHandoverClick(job)}
                className="inline-flex items-center gap-1 py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition cursor-pointer"
                title="Request Emergency Handover"
              >
                <AlertTriangle size={13} />
                <span>Handover</span>
              </button>
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
