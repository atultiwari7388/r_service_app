"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, MapPin, X, AlertCircle, Wrench, ShieldCheck, Check } from "lucide-react";
import { FirestoreJob } from "@/types/job";
import { MechanicProfile } from "@/types/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

interface ReassignMemberModalProps {
  job: FirestoreJob | null;
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  onReassign: (
    jobId: string,
    newMemberId: string | null,
    newMemberName: string
  ) => Promise<void>;
}

export default function ReassignMemberModal({
  job,
  isOpen,
  onClose,
  ownerId,
  onReassign,
}: ReassignMemberModalProps) {
  const [members, setMembers] = useState<MechanicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("self");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !ownerId) return;

    setLoading(true);
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
        setMembers(list);
      } catch (err) {
        console.error("Failed to load team for reassignment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [isOpen, ownerId]);

  if (!isOpen || !job) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (selectedMemberId === "self") {
        await onReassign(job.id, null, "Workshop Owner (Self)");
      } else {
        const found = members.find((m) => m.uid === selectedMemberId);
        await onReassign(
          job.id,
          selectedMemberId,
          found?.name || found?.userName || "Assigned Technician"
        );
      }
      toast.success("Job reassigned successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reassign job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#58BB87] text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Reassign Breakdown Job
              </h3>
              <p className="text-xs text-gray-500">
                Order #{job.orderId} • {job.selectedService}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {job.handoverReason && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4">
            <span className="font-bold block mb-1">Handover Request Reason:</span>
            <p>{job.handoverReason}</p>
          </div>
        )}

        <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
          <label className="block text-xs font-bold text-gray-700">
            Select Replacement Technician
          </label>

          {/* Self Option */}
          <div
            onClick={() => setSelectedMemberId("self")}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              selectedMemberId === "self"
                ? "border-[#58BB87] bg-emerald-50/50 shadow-xs"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                OWN
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Assign to Myself (Owner)
                </span>
                <span className="text-[11px] text-gray-500">
                  Take over and complete on-site repair directly
                </span>
              </div>
            </div>
            {selectedMemberId === "self" && (
              <Check className="w-5 h-5 text-[#58BB87]" />
            )}
          </div>

          {/* Team Members */}
          {members
            .filter((m) => m.uid !== job.assignedMemberId)
            .map((m) => {
              const isSelected = selectedMemberId === m.uid;
              const isBusy = !!m.currentActiveJobId;
              return (
                <div
                  key={m.uid}
                  onClick={() => setSelectedMemberId(m.uid)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-[#58BB87] bg-emerald-50/50 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F96176] text-white flex items-center justify-center text-xs font-bold">
                      {(m.name || "T").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {m.name || m.userName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#F96176]">
                          📍 {m.baseCity || m.city || "Field"}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {isBusy ? "⚠️ Busy on another job" : "✓ Available On-Duty"}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[#58BB87]" />}
                </div>
              );
            })}
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a574] text-white text-xs font-bold shadow-md shadow-[#58BB87]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Reassigning...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Confirm Reassignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
