"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  DollarSign,
  AlertCircle,
  Send,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Check,
} from "lucide-react";
import { FirestoreJob, SubmitOfferParams } from "@/types/job";
import { MechanicProfile } from "@/types/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { calculateDistance } from "@/lib/hooks/useMechanicDashboard";

interface JobOfferModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: SubmitOfferParams) => Promise<void>;
  defaultPerHour?: number;
  ownerId?: string;
  isOwner?: boolean;
}

export default function JobOfferModal({
  job,
  isOpen,
  onClose,
  onSubmit,
  defaultPerHour = 50,
  ownerId,
  isOwner = true,
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

  // Team Dispatch state
  const [teamMembers, setTeamMembers] = useState<MechanicProfile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("self");
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Fetch team members if user is workshop owner
  useEffect(() => {
    if (!isOpen || !ownerId || !isOwner) return;

    setLoadingTeam(true);
    const fetchTeam = async () => {
      try {
        const q = query(
          collection(db, "Mechanics"),
          where("ownerId", "==", ownerId),
          where("isTeamMember", "==", true)
        );
        const snap = await getDocs(q);
        const list: MechanicProfile[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as MechanicProfile), uid: d.id }));
        setTeamMembers(list);

        // Auto-select nearest US technician based on exact GPS distance or city match
        let bestMember: MechanicProfile | null = null;
        let minDistance = Infinity;

        list.forEach((m) => {
          if (
            m.location?.latitude &&
            m.location?.longitude &&
            job?.userLat &&
            job?.userLong
          ) {
            const km = calculateDistance(
              job.userLat,
              job.userLong,
              m.location.latitude,
              m.location.longitude
            );
            const miles = km * 0.621371;
            if (miles < minDistance) {
              minDistance = miles;
              bestMember = m;
            }
          }
        });

        if (!bestMember && job?.userDeliveryAddress) {
          const addressLower = job.userDeliveryAddress.toLowerCase();
          bestMember =
            list.find((m) => {
              const city = (m.baseCity || m.city || "").toLowerCase().trim();
              return city && addressLower.includes(city);
            }) || null;
        }

        if (bestMember && !checkIsBlockedBy70PercentRule(bestMember)) {
          setSelectedMemberId((bestMember as any).uid);
        }
      } catch (err) {
        console.error("Failed to fetch team members for dispatch:", err);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeam();
  }, [isOpen, ownerId, isOwner, job]);

  if (!isOpen || !job) return null;

  const isFixedPrice = Boolean(job.fixPriceEnabled);

  // 70% Progress Threshold Queueing Rule Check
  function checkIsBlockedBy70PercentRule(member: MechanicProfile): boolean {
    if (!member.currentActiveJobId) return false; // Idle: ready to accept

    const startTime = member.activeJobStartedAt?.toMillis
      ? member.activeJobStartedAt.toMillis()
      : member.activeJobStartedAt?.seconds
      ? member.activeJobStartedAt.seconds * 1000
      : Date.now();

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startTime) / 60000));
    const estimatedMinutes = member.activeJobEstimatedMinutes || 60;
    const progressPercent = (elapsedMinutes / estimatedMinutes) * 100;

    // Rule: Must be >= 70% completed to queue the next job
    return progressPercent < 70;
  }

  function getMemberProgressDetails(member: MechanicProfile) {
    if (!member.currentActiveJobId) {
      return { isBusy: false, progress: 100, elapsed: 0, estimated: 0, allowed: true };
    }

    const startTime = member.activeJobStartedAt?.toMillis
      ? member.activeJobStartedAt.toMillis()
      : member.activeJobStartedAt?.seconds
      ? member.activeJobStartedAt.seconds * 1000
      : Date.now();

    const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 60000));
    const estimated = member.activeJobEstimatedMinutes || 60;
    const progress = Math.min(100, Math.round((elapsed / estimated) * 100));
    const allowed = progress >= 70;

    return { isBusy: true, progress, elapsed, estimated, allowed };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let assignedMemberId: string | undefined = undefined;
    let assignedMemberName: string | undefined = undefined;
    let assignedMemberCity: string | undefined = undefined;
    let assignedMemberPhone: string | undefined = undefined;

    if (selectedMemberId !== "self") {
      const selected = teamMembers.find((m) => m.uid === selectedMemberId);
      if (selected) {
        if (checkIsBlockedBy70PercentRule(selected)) {
          alert(
            "Cannot assign to this technician: Their current job has not reached 70% completion yet."
          );
          return;
        }
        assignedMemberId = selected.uid;
        assignedMemberName = selected.name || selected.userName;
        assignedMemberCity = selected.baseCity || selected.city;
        assignedMemberPhone = selected.cellPhone || selected.phoneNumber;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        jobId: job.id,
        userId: job.userId,
        arrivalCharges: isFixedPrice ? 0 : arrivalCharges,
        perHourCharges: isFixedPrice ? 0 : perHourCharges,
        fixPrice: isFixedPrice ? fixPrice : 0,
        arrivalTime: arrivalTime || "15",
        assignedMemberId,
        assignedMemberName,
        assignedMemberCity,
        assignedMemberPhone,
      });
      onClose();
    } catch {
      // error handled by hook toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col gap-5 my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isFixedPrice ? "Submit Fixed Price Quote" : "Submit Service Offer"}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Order #{job.orderId} • {job.selectedService} • {job.userDeliveryAddress || "Location"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TEAM MEMBER DISPATCH SELECTOR (For Workshop Owners) */}
        {isOwner && teamMembers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-[#F96176]" />
                Dispatch & Assign Technician (Proximity Radar)
              </label>
              <span className="text-[11px] text-gray-400">70% Queueing Rule Active</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Option 1: Owner Self */}
              <div
                onClick={() => setSelectedMemberId("self")}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedMemberId === "self"
                    ? "border-[#58BB87] bg-emerald-50/50 shadow-xs"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                    ME
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      Myself (Workshop Owner)
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Direct roadside dispatch
                    </span>
                  </div>
                </div>
                {selectedMemberId === "self" && (
                  <Check className="w-4 h-4 text-[#58BB87]" />
                )}
              </div>

              {/* Option 2..N: Team Members */}
              {teamMembers.map((member) => {
                const isSelected = selectedMemberId === member.uid;
                const { isBusy, progress, elapsed, estimated, allowed } =
                  getMemberProgressDetails(member);

                const city = member.baseCity || member.city || "";
                const state = member.baseState || member.state || "";

                // Compute exact distance in miles if coordinates exist
                const milesAway =
                  member.location?.latitude &&
                  member.location?.longitude &&
                  job.userLat &&
                  job.userLong
                    ? Math.round(
                        calculateDistance(
                          job.userLat,
                          job.userLong,
                          member.location.latitude,
                          member.location.longitude
                        ) * 0.621371
                      )
                    : null;

                const isProximityMatch =
                  (milesAway !== null && milesAway <= 50) ||
                  (job.userDeliveryAddress &&
                    city &&
                    job.userDeliveryAddress.toLowerCase().includes(city.toLowerCase()));

                const isBlocked = isBusy && !allowed;

                return (
                  <div
                    key={member.uid}
                    onClick={() => {
                      if (!isBlocked) setSelectedMemberId(member.uid);
                    }}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      isBlocked
                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-[#58BB87] bg-emerald-50/50 shadow-xs cursor-pointer"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#F96176] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(member.name || "T").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">
                            {member.name || member.userName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#F96176]">
                            📍 {city} {state ? `(${state})` : ""}
                          </span>
                          {milesAway !== null && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                              ⚡ {milesAway} mi away
                            </span>
                          )}
                          {isProximityMatch && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF8F1] text-[#58BB87] border border-emerald-200">
                              🎯 Nearest Match
                            </span>
                          )}
                        </div>

                        {/* Status & 70% Progress Indicator */}
                        <div className="text-[11px] mt-0.5">
                          {!isBusy ? (
                            <span className="text-[#58BB87] font-semibold">
                              ● Available On-Duty
                            </span>
                          ) : allowed ? (
                            <span className="text-amber-700 font-bold">
                              ⚠️ Busy ({elapsed}m/{estimated}m • {progress}%) —{" "}
                              <b className="text-emerald-700">✓ Queueing Allowed (≥70%)</b>
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold">
                              ⛔ Busy ({elapsed}m/{estimated}m • {progress}%) —{" "}
                              Blocked until 70% complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isSelected && !isBlocked && (
                        <Check className="w-4 h-4 text-[#58BB87]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Advisory message */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold">
          <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <span>
            Kindly reach within time to get more jobs and avoid negative feedback.
          </span>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="15"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-[#F96176]"
              />
            </div>
          </div>

          {isFixedPrice ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Fixed Price Quote ($)
              </label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={fixPrice}
                  onChange={(e) => setFixPrice(e.target.value)}
                  placeholder="150"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-hidden focus:border-[#F96176]"
                />
              </div>
            </div>
          ) : (
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
                    required
                    value={arrivalCharges}
                    onChange={(e) => setArrivalCharges(e.target.value)}
                    placeholder="30"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-[#F96176]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hourly Rate ($/hr)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    required
                    value={perHourCharges}
                    onChange={(e) => setPerHourCharges(e.target.value)}
                    placeholder="50"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-[#F96176]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold shadow-md shadow-[#F96176]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isSubmitting ? "Submitting..." : "Send Offer & Dispatch"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
