"use client";

import React, { useState } from "react";
import {
  Wrench,
  Search,
  Check,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Save,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMechanicServices, ServiceItem } from "@/lib/hooks/useMechanicServices";
import AddEditCustomServiceModal from "./AddEditCustomServiceModal";
import Link from "next/link";

export default function MyServicesView() {
  const {
    allServices,
    filteredServices,
    selectedServices,
    customServices,
    isLoading,
    isSaving,
    hasChanges,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    toggleService,
    selectAll,
    deselectAll,
    addCustomService,
    editCustomService,
    removeCustomService,
    saveServices,
  } = useMechanicServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);

  const handleOpenAdd = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  const handleDelete = (service: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove "${service.title}"?`)) {
      removeCustomService(service.title);
    }
  };

  const handleModalSave = (title: string, category?: string, description?: string) => {
    if (serviceToEdit) {
      return editCustomService(serviceToEdit.title, title, category, description);
    } else {
      return addCustomService(title, category, description);
    }
  };

  const totalCount = allServices.length;
  const selectedCount = selectedServices.length;
  const unselectedCount = Math.max(0, totalCount - selectedCount);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Banner / Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
            <Wrench size={14} />
            <span>Workshop Operations & Repair Capabilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 tracking-tight">
            My Workshop Services
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-3xl">
            Select the heavy-duty roadside repair and shop bay services you provide. Highway fleets and owner-operators will be matched and dispatched to your workshop based on these active services.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Custom Service</span>
          </button>

          <button
            type="button"
            onClick={saveServices}
            disabled={isSaving || !hasChanges}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              hasChanges
                ? "bg-[#58BB87] hover:bg-[#48a674] text-white shadow-emerald-500/20 ring-2 ring-emerald-400/40 animate-pulse"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{hasChanges ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Active Offered Services
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#58BB87] mt-0.5 block">
              {selectedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Catalog Total Services
            </span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5 block">
              {totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#F96176] flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Custom Specialty Services
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5 block">
              {customServices.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by keyword or system..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-1 focus:ring-[#F96176] text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("selected")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "selected"
                ? "bg-[#58BB87] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Selected ({selectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("unselected")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "unselected"
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Unselected ({unselectedCount})
          </button>

          {/* Quick Select Actions */}
          <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={selectAll}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#F96176] animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Loading workshop repair services...
          </p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">No Services Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No services match your search or filter. Try a different query or add a custom service.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition"
          >
            <Plus size={14} /> Add Custom Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredServices.map((service) => {
            const isSelected = selectedServices.includes(service.title);

            return (
              <div
                key={service.id || service.title}
                onClick={() => toggleService(service.title)}
                className={`p-4 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none group relative ${
                  isSelected
                    ? "border-[#58BB87] bg-emerald-50/40 shadow-xs"
                    : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60"
                }`}
              >
                {/* Left: Checkbox + Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#58BB87] text-white shadow-xs"
                        : "border-2 border-gray-300 group-hover:border-gray-400 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isSelected ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {service.title}
                      </h4>
                      {service.isCustom && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    {service.category && (
                      <span className="text-[11px] text-gray-400 block truncate">
                        {service.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Badge & Custom Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {service.isCustom && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(service, e)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                        title="Edit Custom Service"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(service, e)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Custom Service"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                      isSelected
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isSelected ? "Active" : "Off"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center font-bold text-xs shrink-0">
              {selectedCount}
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                {selectedCount} of {totalCount} Services Offered
              </span>
              <span className="text-[11px] text-gray-500">
                {hasChanges ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved selections — click Save Changes to persist
                  </span>
                ) : (
                  "All changes saved to your workshop profile"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition hidden sm:inline-block"
            >
              Return to Dashboard
            </Link>

            <button
              type="button"
              onClick={saveServices}
              disabled={isSaving || !hasChanges}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                hasChanges
                  ? "bg-[#58BB87] hover:bg-[#48a674] text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{hasChanges ? "Save Changes" : "Saved"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Adding / Editing Custom Service */}
      <AddEditCustomServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceToEdit={serviceToEdit}
        onSave={handleModalSave}
      />
    </div>
  );
}
