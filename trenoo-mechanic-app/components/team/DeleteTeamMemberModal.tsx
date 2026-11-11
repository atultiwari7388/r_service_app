"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import toast from "react-hot-toast";
import { MechanicProfile } from "@/types/auth";

interface DeleteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MechanicProfile | null;
  onSuccess?: () => void;
}

export default function DeleteTeamMemberModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: DeleteTeamMemberModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const deleteFn = httpsCallable(functions, "deleteMechanicTeamMember");
      const result: any = await deleteFn({
        memberUid: member.uid,
      });

      if (result?.data?.success) {
        toast.success(`Member ${member.name || member.userName} removed successfully`);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result?.data?.message || "Failed to remove team member");
      }
    } catch (err: any) {
      console.error("Delete member error:", err);
      toast.error(err?.message || "Failed to remove team member");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-[#F96176] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          Remove Team Member?
        </h3>

        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Are you sure you want to remove <b className="text-gray-800">{member.name || member.userName}</b> ({member.email}) from your workshop team? Their account credentials and access will be revoked immediately.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold shadow-md shadow-[#F96176]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
