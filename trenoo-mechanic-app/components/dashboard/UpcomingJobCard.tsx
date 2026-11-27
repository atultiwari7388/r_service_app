"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  DollarSign,
  Wrench,
  Truck,
  Maximize2,
  X,
  Star,
  UserCheck,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { FirestoreJob } from "@/types/job";

interface UpcomingJobCardProps {
  job: FirestoreJob;
  currentUId?: string;
  isMember?: boolean;
  onInterested: (job: FirestoreJob) => void;
  onMarkArrived?: (job: FirestoreJob) => void;
  onInspectClick?: (job: FirestoreJob) => void;
  onHandoverClick?: (job: FirestoreJob) => void;
  onAcceptAssignment?: (job: FirestoreJob) => void;
  onDeclineAssignment?: (job: FirestoreJob) => void;
}

export default function UpcomingJobCard({
  job,
  currentUId,
  isMember = false,
  onInterested,
  onMarkArrived,
  onInspectClick,
  onHandoverClick,
  onAcceptAssignment,
  onDeclineAssignment,
}: UpcomingJobCardProps) {
  // Determine if this is an assigned execution job (status >= 2, or assigned to this technician)
  const isAssignedExecution =
    job.status >= 2 ||
    Boolean(job.assignedMemberId) ||
    Boolean(job.isAssignedByOwner) ||
    Boolean(
      currentUId &&
        job.mechanicsOffer?.some(
          (o) => o.assignedMemberId === currentUId || o.status >= 2
        )
    );

  // 5-minute countdown timer logic matching Flutter (ONLY applies to open status 0 bids)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isAssignedExecution) return;

    let orderDateMs: number;
    if (job.orderDate?.toMillis) {
      orderDateMs = job.orderDate.toMillis();
    } else if (job.orderDate?.seconds) {
      orderDateMs = job.orderDate.seconds * 1000;
    } else if (job.orderDate instanceof Date) {
      orderDateMs = job.orderDate.getTime();
    } else {
      orderDateMs = Date.now();
    }

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - orderDateMs) / 1000);
      const remaining = 300 - elapsedSeconds;
      if (remaining <= 0) {
        setSecondsRemaining(0);
        setIsExpired(true);
      } else {
        setSecondsRemaining(remaining);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [job.orderDate, isAssignedExecution]);

  // Flutter rule (dashboard_screen.dart lines 288-305):
  // If 5 minutes have elapsed, hide open job so mechanic cannot submit expired quote.
  // CRITICAL: An active assigned work order never expires!
  if (!isAssignedExecution && (isExpired || secondsRemaining <= 0)) {
    return null;
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  })();

  // Open Google Maps directions
  const openDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <>
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col gap-3.5">
        {/* TOP ROW: Customer Avatar + ID + Distance + Rating + Date */}
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-700">
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
                <span className="text-[#F96176] text-sm font-black">
                  {(job.userName || "CU").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Customer & Company Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-500 tracking-wide">
                  #{job.orderId}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#58BB87]/10 text-[#58BB87] text-[11px] font-bold">
                  {job.calculatedDistance || 1} km away
                </span>
                {typeof job.nearByDistance === "number" && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    (Max: {job.nearByDistance} km)
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  4.8
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate mt-0.5">
                {job.myCompany || job.userName || "Commercial Customer"}
              </h4>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate mt-0.5">
                <MapPin size={13} className="shrink-0 text-gray-400" />
                <span className="truncate">{job.userDeliveryAddress || "Highway breakdown location"}</span>
              </div>
            </div>
          </div>

          {/* Date & Countdown Pill matching Flutter Time Remaining */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>

            {isAssignedExecution ? (
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black tracking-tight shadow-2xs">
                {job.status === 3 ? "On-Site • Inspecting" : "En Route to Breakdown"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-[#F96176] text-[11px] font-black tracking-tight animate-pulse shadow-2xs">
                <Clock size={12} />
                <span>Time Remaining: {formatTimer(secondsRemaining)}</span>
              </span>
            )}
          </div>
        </div>

        {/* SERVICE & VEHICLE SPECIFICATION CARD */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Wrench size={13} className="text-[#F96176]" />
              Requested Service:
            </span>
            <span className="font-extrabold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200">
              {job.selectedService}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-500 flex items-center gap-1.5">
              <Truck size={13} className="text-gray-400" />
              Commercial Unit:
            </span>
            <span className="font-bold text-gray-800">
              {job.companyName
                ? `${job.companyName} (${job.vehicleNumber || "Unit"})`
                : job.vehicleNumber || "Class 8 Semi-Truck"}
            </span>
          </div>

          {job.fixPriceEnabled && job.fixPrice ? (
            <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <DollarSign size={13} className="text-[#58BB87]" />
                Customer Fix Price:
              </span>
              <span className="font-black text-[#58BB87] text-sm">
                ${job.fixPrice}
              </span>
            </div>
          ) : null}
        </div>

        {/* PHOTOS PREVIEW (if user attached images) */}
        {job.images && job.images.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-gray-500">
              Breakdown Photos ({job.images.length}):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {job.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className="relative group h-14 w-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 cursor-pointer shadow-2xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Breakdown photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 size={14} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKSHOP OWNER ASSIGNMENT BANNER */}
        {job.assignmentStatus === "pending_member_acceptance" && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-extrabold text-blue-950 block">Assigned by Workshop Owner</span>
                <span className="text-[11px] text-blue-800">
                  Customer accepted offer. Please accept assignment to begin dispatch.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-[10px] animate-pulse">
              Action Required
            </span>
          </div>
        )}

        {/* ISSUE DESCRIPTION */}
        {job.description && (
          <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
            <span className="font-bold text-amber-900 block mb-0.5">Driver Note:</span>
            <p className="text-gray-700 font-medium line-clamp-2">{job.description}</p>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS: Assigned Execution vs Open Solicitation */}
        {isAssignedExecution ? (
          <div className="flex items-center justify-between w-full gap-2 pt-1 border-t border-gray-100 flex-wrap">
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
                type="button"
                onClick={openDirections}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
                title="Open GPS Navigation"
              >
                <Navigation size={13} className="text-[#58BB87]" />
                <span>Map Direction</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onHandoverClick && (
                <button
                  type="button"
                  onClick={() => onHandoverClick(job)}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition cursor-pointer"
                  title="Request Emergency Handover"
                >
                  <AlertTriangle size={13} />
                  <span>Handover</span>
                </button>
              )}

              {job.status === 3 ? (
                <button
                  type="button"
                  onClick={() => onInspectClick?.(job)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  <Wrench size={14} />
                  <span>Vehicle Inspection & Quote</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onMarkArrived?.(job)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <MapPin size={14} />
                  <span>Arrived at Destination</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => onInterested(job)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-extrabold text-xs shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Interested & Submit Quote</span>
            </button>

            <button
              onClick={openDirections}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer shrink-0"
              title="Open GPS Navigation"
            >
              <Navigation size={14} className="text-[#58BB87]" />
              <span className="hidden sm:inline">Directions</span>
            </button>
          </div>
        )}
      </div>

      {/* FULLSCREEN PHOTO LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition z-10"
            >
              <X size={20} />
            </button>
            <img
              src={selectedImage}
              alt="Breakdown Detail"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
