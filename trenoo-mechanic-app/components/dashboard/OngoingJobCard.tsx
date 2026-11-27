"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Wrench,
  Truck,
  Star,
  Banknote,
  UserCheck,
} from "lucide-react";
import { FirestoreJob } from "@/types/job";
import {
  JOB_STATUS,
  getJobPhase,
  getJobRelation,
  getMechanicPhaseLabel,
  isDelegatedOffer,
} from "@/lib/jobWorkflow";
import { ExecutorActions, SupervisorActions } from "./JobFieldActions";
import { toMillis } from "@/lib/hooks/useMechanicDashboard";
import { describeCommission } from "@/lib/commission";

interface OngoingJobCardProps {
  job: FirestoreJob;
  currentUId: string;
  isOwner?: boolean;
  onMarkArrived: (job: FirestoreJob) => void | Promise<void>;
  onInspectClick: (job: FirestoreJob) => void;
  onMarkRepairFinished: (job: FirestoreJob) => void | Promise<void>;
  onHandoverClick: (job: FirestoreJob) => void;
  onReassignClick: (job: FirestoreJob) => void;
  onCancelClick: (job: FirestoreJob) => void;
  onRateClick: (job: FirestoreJob) => void;
}

export default function OngoingJobCard({
  job,
  currentUId,
  isOwner = true,
  onMarkArrived,
  onInspectClick,
  onMarkRepairFinished,
  onHandoverClick,
  onReassignClick,
  onCancelClick,
  onRateClick,
}: OngoingJobCardProps) {
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // How the signed-in mechanic relates to this job (only the ACCEPTED offer
  // counts once dispatched, so another workshop's delegation never leaks in)
  const { relation, offer } = getJobRelation(job, currentUId);
  const phase = getJobPhase(job);
  const isDelegated = isDelegatedOffer(offer);
  const techName = (isDelegated && offer?.assignedMemberName) || "Technician";
  const techPhone = isDelegated ? offer?.assignedMemberPhone || "" : "";
  const techCity = (isDelegated && offer?.assignedMemberCity) || "";
  const isSupervisingOwner = isOwner && relation === "supervisor";

  // Refresh progress clock every 10 seconds while repairing
  useEffect(() => {
    if (phase !== "repairing") return;
    const interval = setInterval(() => setNowTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [phase]);

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

  // Live repair progress: the clock starts when the customer pays
  const progressDetails = (() => {
    if (phase !== "repairing") return null;
    const startMs = toMillis(job.activeJobStartedAt) || toMillis(job.paidAt);
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

          <span
            className={`mt-1 px-2.5 py-1 rounded-full border font-extrabold text-[11px] ${
              phase === "completed"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : phase === "cancelled" || offer?.status === JOB_STATUS.CANCELLED
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : phase === "awaiting_payment" || phase === "open"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-sky-50 border-sky-200 text-sky-700"
            }`}
          >
            {offer?.status === JOB_STATUS.CANCELLED && phase === "open"
              ? "Quote Withdrawn"
              : getMechanicPhaseLabel(job)}
          </span>
        </div>
      </div>

      {/* ASSIGNED TECHNICIAN BADGE (Team Dispatch) */}
      {isDelegated && (
        <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#58BB87]" />
            <span className="text-gray-500 font-medium">Assigned Technician:</span>
            <span className="font-bold text-gray-900">{techName}</span>
          </div>
          {techCity && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#F96176]">
              📍 {techCity}
            </span>
          )}
        </div>
      )}

      {/* EMERGENCY HANDOVER NOTIFICATION (Scenario 3) */}
      {job.handoverRequested && phase !== "completed" && phase !== "cancelled" && (
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

          {isOwner && offer?.mId === currentUId && (
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

        {offer && (
          <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <DollarSign size={13} className="text-[#58BB87]" /> Workshop Quote:
            </span>
            <span className="font-bold text-gray-800">
              {offer.fixPrice && Number(offer.fixPrice) > 0
                ? `$${offer.fixPrice} Flat`
                : `Arrival: $${offer.arrivalCharges} | $${offer.perHourCharges}/hr`}
            </span>
          </div>
        )}

        {job.finalDiagnosedAmount ? (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Wrench size={13} className="text-[#58BB87]" /> Verified Work Order:
            </span>
            <span className="font-black text-gray-900">${job.finalDiagnosedAmount}</span>
          </div>
        ) : null}

        {/* Commission & net earning (locked when the work order was issued) */}
        {job.finalDiagnosedAmount && typeof job.mechanicCommission === "number" ? (
          <div className="flex flex-col gap-1 border-t border-gray-200/60 pt-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">
                Platform commission ({describeCommission(job.mechanicCommissionRule)}
                {job.mechanicCommissionRule?.planName ? ` · ${job.mechanicCommissionRule.planName}` : ""}):
              </span>
              <span className="font-bold text-rose-600">
                −${job.mechanicCommission.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Workshop net earning:</span>
              <span className="font-black text-[#58BB87]">
                ${(job.mechanicNetEarning ?? job.finalDiagnosedAmount - job.mechanicCommission).toFixed(2)}
              </span>
            </div>
          </div>
        ) : null}

        {job.isPaid && (job.customerServiceFee || 0) > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Customer service fee (platform):</span>
              <span className="font-bold text-gray-800">
                ${(job.customerServiceFee || 0).toFixed(2)}
              </span>
            </div>
            {job.payMode === "cash" && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                Cash collected ${(job.paidAmount || 0).toFixed(2)} includes the platform&apos;s
                service fee and commission; this balance appears under Earnings &amp; Settlements.
              </p>
            )}
          </div>
        )}

        {job.isPaid && job.payMode && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Banknote size={13} className="text-gray-400" /> Payment Mode:
            </span>
            <span className="font-black text-gray-900">{job.payMode}</span>
          </div>
        )}
      </div>

      {/* ACTION TOOLBAR (phase + role driven) */}
      <div className="pt-3 border-t border-gray-100">
        {relation === "executor" && (
          <ExecutorActions
            job={job}
            offer={offer}
            onMarkArrived={onMarkArrived}
            onInspectClick={onInspectClick}
            onMarkRepairFinished={onMarkRepairFinished}
            onHandoverClick={onHandoverClick}
          />
        )}

        {isSupervisingOwner && (
          <SupervisorActions
            job={job}
            techName={techName}
            techPhone={techPhone}
            onReassignClick={onReassignClick}
          />
        )}

        {/* Owner's quote still waiting for the driver */}
        {relation === "bidder" && phase === "open" && offer?.status === JOB_STATUS.QUOTED && (
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
              <Clock size={14} className="text-amber-500" />
              <span>
                {isDelegated
                  ? `Quote sent • ${techName} will be dispatched on acceptance`
                  : "Offer sent. Awaiting driver confirmation..."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={() => onReassignClick(job)}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck size={13} className="text-[#F96176]" />
                  <span>Change Tech</span>
                </button>
              )}
              <button
                onClick={() => onCancelClick(job)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#F96176] font-bold text-xs transition cursor-pointer"
              >
                Withdraw Offer
              </button>
            </div>
          </div>
        )}

        {/* Completed & signed off: both parties can rate */}
        {phase === "completed" && (relation === "executor" || relation === "supervisor") && (
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
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
            <button
              onClick={() => onRateClick(job)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              <Star size={13} className="text-amber-500" />
              <span>{job.mReviewSubmitted ? "Edit Driver Review" : "Rate Driver"}</span>
            </button>
          </div>
        )}

        {phase === "cancelled" && job.cancelReason && (
          <p className="text-xs text-rose-700 font-medium">
            Cancelled{job.cancelBy ? ` by ${job.cancelBy}` : ""}: {job.cancelReason}
          </p>
        )}
      </div>
    </div>
  );
}
