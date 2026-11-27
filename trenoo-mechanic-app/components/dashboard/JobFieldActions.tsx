"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  UserCheck,
  Wrench,
} from "lucide-react";
import { FirestoreJob, MechanicOffer } from "@/types/job";
import { getJobPhase } from "@/lib/jobWorkflow";

/**
 * Phase-driven action toolbars shared by UpcomingJobCard and OngoingJobCard.
 *
 *  ExecutorActions   → assigned team member, or owner who kept the job ("Self")
 *  SupervisorActions → workshop owner watching a job delegated to a team member
 */

const btnNeutral =
  "inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer";
const btnHandover =
  "inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition cursor-pointer";
const btnPrimary =
  "inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export function openJobDirections(job: FirestoreJob) {
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
}

function CallDriverButton({ job }: { job: FirestoreJob }) {
  if (!job.userPhoneNumber) return null;
  return (
    <a href={`tel:${job.userPhoneNumber}`} className={btnNeutral}>
      <Phone size={13} className="text-[#58BB87]" />
      <span>Call Driver</span>
    </a>
  );
}

function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "blue" | "indigo" | "emerald";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    amber: "text-amber-800 bg-amber-50 border-amber-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    indigo: "text-indigo-700 bg-indigo-50 border-indigo-200",
    emerald: "text-emerald-800 bg-emerald-50 border-emerald-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-xl ${tones[tone]}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}

const finalAmountOf = (job: FirestoreJob, offer?: MechanicOffer) =>
  job.finalDiagnosedAmount || offer?.finalDiagnosedAmount || 0;

interface ExecutorActionsProps {
  job: FirestoreJob;
  offer?: MechanicOffer;
  onMarkArrived?: (job: FirestoreJob) => void | Promise<void>;
  onInspectClick?: (job: FirestoreJob) => void;
  onMarkRepairFinished?: (job: FirestoreJob) => void | Promise<void>;
  onHandoverClick?: (job: FirestoreJob) => void;
}

export function ExecutorActions({
  job,
  offer,
  onMarkArrived,
  onInspectClick,
  onMarkRepairFinished,
  onHandoverClick,
}: ExecutorActionsProps) {
  const [busy, setBusy] = useState(false);
  const phase = getJobPhase(job);

  const run = async (fn?: (job: FirestoreJob) => void | Promise<void>) => {
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn(job);
    } catch {
      // surfaced by the hook's toast
    } finally {
      setBusy(false);
    }
  };

  const handover = onHandoverClick &&
    !job.handoverRequested &&
    (phase === "en_route" || phase === "on_site_inspecting" || phase === "repairing") && (
      <button
        type="button"
        onClick={() => onHandoverClick(job)}
        className={btnHandover}
        title="Request Emergency Handover"
      >
        <AlertTriangle size={13} />
        <span>Handover</span>
      </button>
    );

  if (phase === "en_route") {
    return (
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CallDriverButton job={job} />
          <button
            type="button"
            onClick={() => openJobDirections(job)}
            className={btnNeutral}
            title="Open GPS navigation to the breakdown"
          >
            <Navigation size={13} className="text-[#58BB87]" />
            <span>Map Direction</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {handover}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(onMarkArrived)}
            className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20`}
          >
            <MapPin size={14} />
            <span>{busy ? "Recording..." : "Arrived at Destination"}</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "on_site_inspecting") {
    return (
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CallDriverButton job={job} />
          <StatusPill tone="emerald" icon={<Wrench size={13} />}>
            On-Site: Diagnosing
          </StatusPill>
        </div>
        <div className="flex items-center gap-2">
          {handover}
          <button
            type="button"
            onClick={() => onInspectClick?.(job)}
            className={`${btnPrimary} bg-[#58BB87] hover:bg-[#48a674]`}
          >
            <Wrench size={14} />
            <span>Inspection & Final Amount</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "awaiting_payment") {
    return (
      <div className="flex items-center justify-between w-full gap-2 bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600 animate-pulse shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">
              Awaiting Customer Payment Authorization
            </p>
            <p className="text-amber-700">
              Final work order ${finalAmountOf(job, offer)} sent. Do not start
              repairs until payment is confirmed.
            </p>
          </div>
        </div>
        <CallDriverButton job={job} />
      </div>
    );
  }

  if (phase === "repairing") {
    return (
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusPill tone="emerald" icon={<CheckCircle size={13} />}>
            Paid ${job.paidAmount || finalAmountOf(job, offer)} (
            {(job.payMode || "paid").toUpperCase()}) • Repair in Progress
          </StatusPill>
          <CallDriverButton job={job} />
        </div>
        <div className="flex items-center gap-2">
          {handover}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(onMarkRepairFinished)}
            className={`${btnPrimary} bg-[#58BB87] hover:bg-[#48a674]`}
          >
            <CheckCircle size={15} />
            <span>{busy ? "Saving..." : "Mark Repair Finished"}</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "awaiting_signoff") {
    return (
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <StatusPill tone="indigo" icon={<ShieldCheck size={13} />}>
          Repair finished • Awaiting customer quality sign-off
        </StatusPill>
        <CallDriverButton job={job} />
      </div>
    );
  }

  return null;
}

interface SupervisorActionsProps {
  job: FirestoreJob;
  techName: string;
  techPhone?: string;
  onReassignClick?: (job: FirestoreJob) => void;
}

const supervisorStatusLine = (job: FirestoreJob, techName: string) => {
  switch (getJobPhase(job)) {
    case "en_route":
      return `Technician en route to vehicle site (${techName})`;
    case "on_site_inspecting":
      return `${techName} on-site • diagnosing vehicle`;
    case "awaiting_payment":
      return "Awaiting Customer Payment Authorization";
    case "repairing":
      return `Repair in progress by ${techName}`;
    case "awaiting_signoff":
      return "Repair finished • Awaiting customer sign-off";
    default:
      return "";
  }
};

export function SupervisorActions({
  job,
  techName,
  techPhone,
  onReassignClick,
}: SupervisorActionsProps) {
  const phase = getJobPhase(job);
  const canReassign =
    phase === "en_route" ||
    phase === "on_site_inspecting" ||
    phase === "awaiting_payment" ||
    phase === "repairing";

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
        <Clock size={13} className="text-[#58BB87] shrink-0" />
        <span>{supervisorStatusLine(job, techName)}</span>
      </div>
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CallDriverButton job={job} />
          {techPhone && (
            <a
              href={`tel:${techPhone}`}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
            >
              <Phone size={13} className="text-blue-600" />
              <span>Call Tech</span>
            </a>
          )}
        </div>
        {canReassign && onReassignClick && (
          <button
            type="button"
            onClick={() => onReassignClick(job)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <UserCheck size={13} className="text-[#F96176]" />
            <span>Reassign Tech</span>
          </button>
        )}
      </div>
    </div>
  );
}
