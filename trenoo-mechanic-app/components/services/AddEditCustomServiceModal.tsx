"use client";

import React, { useState, useEffect } from "react";
import { X, Wrench, Tag, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { ServiceItem } from "@/lib/hooks/useMechanicServices";

interface AddEditCustomServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: ServiceItem | null;
  onSave: (title: string, category?: string, description?: string) => boolean;
}

const COMMON_CATEGORIES = [
  "Engine & Diagnostics",
  "Tires & Wheels",
  "Brakes & Pneumatics",
  "Transmission & Drivetrain",
  "Electrical & Batteries",
  "Trailer & Chassis",
  "Reefer & HVAC",
  "Fuel & Fluids",
  "Emergency & Roadside",
  "Welding & Fabrication",
];

export default function AddEditCustomServiceModal({
  isOpen,
  onClose,
  serviceToEdit,
  onSave,
}: AddEditCustomServiceModalProps) {
  const isEditing = Boolean(serviceToEdit);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Engine & Diagnostics");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (serviceToEdit) {
      setTitle(serviceToEdit.title || "");
      setCategory(serviceToEdit.category || "Engine & Diagnostics");
      setDescription(serviceToEdit.description || "");
    } else {
      setTitle("");
      setCategory("Engine & Diagnostics");
      setDescription("");
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const success = onSave(title, category, description);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F96176]/10 text-[#F96176] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? "Edit Workshop Service" : "Add Custom Service"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Update the name or details of this service"
                  : "Add a specialty service your technicians offer to highway fleets"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Service Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Service Name / Specialty <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mobile Aluminum Welding, DEF Flush, DPF Regeneration"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#F96176] focus:ring-1 focus:ring-[#F96176] text-sm text-gray-900 placeholder:text-gray-400 outline-none transition"
              />
            </div>
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#F96176] focus:ring-1 focus:ring-[#F96176] text-sm text-gray-900 outline-none transition bg-white cursor-pointer"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide brief details, required bay tools, or mobile unit capability..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F96176] focus:ring-1 focus:ring-[#F96176] text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none transition"
            />
          </div>

          {/* Quick Suggestions */}
          {!isEditing && (
            <div className="pt-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#58BB87]" /> Quick Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Mobile Welding",
                  "Trailer Roof Patch",
                  "Air Dryer Replacement",
                  "EGR Valve Cleaning",
                  "Liftgate Hydraulic Repair",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTitle(sug)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 hover:bg-rose-50 hover:text-[#F96176] text-gray-700 transition cursor-pointer border border-gray-200"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F96176] hover:bg-[#e0485d] shadow-sm shadow-[#F96176]/20 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? "Update Service" : "Add to My Services"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
