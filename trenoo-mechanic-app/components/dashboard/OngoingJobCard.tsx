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
  onMarkArrived: (job: FirestoreJob) => void;
  onInspectClick: (job: FirestoreJob) => void;
  onMarkRepairFinished: (job: FirestoreJob) => void;
  onStartJobClick?: (job: FirestoreJob) => void;
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
  onMarkArrived,
  onInspectClick,
  onMarkRepairFinished,
  onStartJobClick,
  onHandoverClick,
  onReassignClick,
  onCancelClick,
  onRateClick,
}: OngoingJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Retrieve mechanic's specific offer (either made by owner or assigned to member)
  const myOffer = job.mechanicsOffer?.find(
    (o) => o.mId === currentUId || o.assignedMemberId === currentUId
  );
  const offerStatus = myOffer?.status ?? job.status;

  // Resolve delegated technician reliably from root doc or offer payload
  const effectiveAssignedMemberId =
    job.assignedMemberId ||
    myOffer?.assignedMemberId ||
    job.mechanicsOffer?.find((o) => Boolean(o.assignedMemberId))?.assignedMemberId;

  const effectiveAssignedMemberName =
    job.assignedMemberName ||
    myOffer?.assignedMemberName ||
    job.mechanicsOffer?.find((o) => Boolean(o.assignedMemberName))?.assignedMemberName ||
    "Technician";

  const effectiveAssignedMemberPhone =
    job.assignedMemberPhone ||
    myOffer?.assignedMemberPhone ||
    job.mechanicsOffer?.find((o) => Boolean(o.assignedMemberPhone))?.assignedMemberPhone ||
    "";

  const effectiveAssignedMemberCity =
    job.assignedMemberCity ||
    myOffer?.assignedMemberCity ||
    job.mechanicsOffer?.find((o) => Boolean(o.assignedMemberCity))?.assignedMemberCity ||
    "";

  // Role determination: Is this job delegated to a team member?
  const isAssignedToMember = Boolean(
    effectiveAssignedMemberId && effectiveAssignedMemberId !== "self"
  );

  // Executing technician: The assigned member, OR the owner when doing the job directly
  const isExecutingTechnician = isAssignedToMember
    ? effectiveAssignedMemberId === currentUId
    : true;

  // Supervising owner: Owner viewing a job delegated to their team member
  const isSupervisingOwner = Boolean(
    isOwner && isAssignedToMember && effectiveAssignedMemberId !== currentUId
  );

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
              1/5 Waiting for Driver
            </span>
          )}
          {offerStatus === 2 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-[11px]">
              2/5 Dispatched • En Route
            </span>
          )}
          {offerStatus === 3 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[11px]">
              3/5 On-Site • Vehicle Inspection
            </span>
          )}
          {offerStatus === 4 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-[11px]">
              {job.repairCompletedByTechnician || myOffer?.repairCompletedByTechnician
                ? "4/5 Awaiting Customer Sign-Off"
                : "4/5 Repair In Progress"}
            </span>
          )}
          {offerStatus === 5 && (
            <span className="mt-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px]">
              ✓ Completed & Signed Off
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
      {(effectiveAssignedMemberName && effectiveAssignedMemberName !== "Technician" || isAssignedToMember) && (
        <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#58BB87]" />
            <span className="text-gray-500 font-medium">Assigned Technician:</span>
            <span className="font-bold text-gray-900">{effectiveAssignedMemberName}</span>
          </div>
          {effectiveAssignedMemberCity && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#F96176]">
              📍 {effectiveAssignedMemberCity}
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
      {isSupervisingOwner ? (
        <div className="flex items-center justify-between w-full gap-2 flex-wrap pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {job.userPhoneNumber && (
              <a
                href={`tel:${job.userPhoneNumber}`}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
              >
                <Phone size={13} className="text-[#58BB87]" />
                <span>Call Driver</span>
              </a>
            )}
            {effectiveAssignedMemberPhone && (
              <a
                href={`tel:${effectiveAssignedMemberPhone}`}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                <Phone size={13} className="text-blue-600" />
                <span>Call Tech ({effectiveAssignedMemberName})</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              {offerStatus === 1
                ? "Waiting for driver confirmation"
                : offerStatus === 2
                ? "Technician en route to vehicle site"
                : offerStatus === 3
                ? "Technician conducting on-site inspection"
                : offerStatus === 4
                ? "Repair execution in progress"
                : "Work order completed"}
            </span>
            {offerStatus < 5 && (
              <button
                type="button"
                onClick={() => onReassignClick(job)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck size={13} className="text-[#F96176]" />
                <span>Reassign Tech</span>
              </button>
            )}
          </div>
        </div>
      ) : isExecutingTechnician ? (
        /* EXECUTING TECHNICIAN TOOLBAR (Assigned Team Member or Owner self-accepted) */
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

          {/* Step 2: Driver accepted offer -> Technician Dispatched & En Route */}
          {offerStatus === 2 && (
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
                  onClick={() => onMarkArrived(job)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                >
                  <MapPin size={14} />
                  <span>Arrived at Location</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Technician Arrived On-Site -> Diagnostic & Vehicle Inspection */}
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
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                  On-Site: Inspection
                </span>
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
                  onClick={() => onInspectClick(job)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  <Wrench size={14} />
                  <span>Vehicle Inspection & Final Quote</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Invoice Submitted / Repair In Progress */}
          {offerStatus === 4 && (
            <div className="flex flex-col w-full gap-3">
              {/* If customer hasn't paid yet */}
              {!job.isPaid && !job.payMode ? (
                <div className="flex items-center justify-between w-full gap-2 bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-600 animate-pulse" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-900">
                        Invoice ${job.finalDiagnosedAmount || myOffer?.finalDiagnosedAmount || 0} Sent
                      </p>
                      <p className="text-amber-700">
                        Awaiting customer payment authorization on portal...
                      </p>
                    </div>
                  </div>
                  {job.userPhoneNumber && (
                    <a
                      href={`tel:${job.userPhoneNumber}`}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs"
                    >
                      <Phone size={13} />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              ) : (
                /* Customer has paid / authorized work */
                <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                      <CheckCircle size={13} className="text-emerald-600" />
                      <span>
                        Paid ${job.finalDiagnosedAmount || job.paidAmount || myOffer?.finalDiagnosedAmount} ({job.payMode?.toUpperCase() || "PAID"})
                      </span>
                    </span>
                    {job.userPhoneNumber && (
                      <a
                        href={`tel:${job.userPhoneNumber}`}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
                      >
                        <Phone size={13} className="text-[#58BB87]" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  {job.repairCompletedByTechnician || myOffer?.repairCompletedByTechnician ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                      <Clock size={13} className="animate-spin text-indigo-500" />
                      <span>Awaiting Customer Quality Sign-Off & Release</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onMarkRepairFinished(job)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle size={15} />
                      <span>Mark Repair Finished & Request Sign-Off</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Completed */}
          {offerStatus === 5 && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle size={14} /> Completed & Signed Off by Customer
                </span>
                {job.mRating && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {job.mRating} Rating Given
                  </span>
                )}
              </div>
              {job.finalDiagnosedAmount && (
                <span className="text-xs font-bold text-gray-600">
                  Invoice Total: ${job.finalDiagnosedAmount}
                </span>
              )}
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
      ) : (
        /* TEAM MEMBER OBSERVER / NON-ASSIGNED VIEW */
        <div className="flex items-center justify-between w-full gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Assigned to {effectiveAssignedMemberName}</span>
          {job.userPhoneNumber && (
            <a
              href={`tel:${job.userPhoneNumber}`}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
            >
              <Phone size={13} className="text-[#58BB87]" />
              <span>Call Driver</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
