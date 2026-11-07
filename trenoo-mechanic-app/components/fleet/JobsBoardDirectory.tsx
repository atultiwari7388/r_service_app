"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  MapPin,
  Phone,
  Truck,
  Eye,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Check,
  X,
  FileText,
  DollarSign,
  User,
} from "lucide-react";
import { useMechanicDashboard } from "@/lib/hooks/useMechanicDashboard";
import { FirestoreJob, MechanicOffer } from "@/types/job";
import JobOfferModal from "@/components/dashboard/JobOfferModal";
import CancelReasonModal from "@/components/dashboard/CancelReasonModal";
import DriverRatingModal from "@/components/dashboard/DriverRatingModal";

type JobTab = "upcoming" | "ongoing" | "completed" | "cancelled";

export default function JobsBoardDirectory() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as JobTab) || "upcoming";

  const {
    currentUId,
    isLoadingJobs,
    upcomingJobs,
    ongoingJobs,
    completedJobs,
    cancelledJobs,
    submitOffer,
    updateJobStatus,
    cancelJob,
    submitRating,
    cancelReasons,
  } = useMechanicDashboard();

  // Tab state
  const [activeTab, setActiveTab] = useState<JobTab>(
    ["upcoming", "ongoing", "completed", "cancelled"].includes(initialTab)
      ? initialTab
      : "upcoming"
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "distance">("newest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<FirestoreJob | null>(null);
  const [offerModalJob, setOfferModalJob] = useState<FirestoreJob | null>(null);
  const [cancelModalJob, setCancelModalJob] = useState<FirestoreJob | null>(null);
  const [rateModalJob, setRateModalJob] = useState<FirestoreJob | null>(null);
  const [isAdvancingStatus, setIsAdvancingStatus] = useState(false);

  // Sync tab from URL if changed
  useEffect(() => {
    const tabParam = searchParams.get("tab") as JobTab;
    if (tabParam && ["upcoming", "ongoing", "completed", "cancelled"].includes(tabParam)) {
      setActiveTab(tabParam);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Reset page when tab, search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedService, sortBy]);

  // Current list based on active tab
  const currentTabList = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return upcomingJobs;
      case "ongoing":
        return ongoingJobs;
      case "completed":
        return completedJobs;
      case "cancelled":
        return cancelledJobs;
      default:
        return [];
    }
  }, [activeTab, upcomingJobs, ongoingJobs, completedJobs, cancelledJobs]);

  // Unique services in the current tab for filter dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    currentTabList.forEach((j) => {
      if (j.selectedService) set.add(j.selectedService);
    });
    return Array.from(set).sort();
  }, [currentTabList]);

  // Filtered and sorted list
  const filteredJobs = useMemo(() => {
    let list = [...currentTabList];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((j) => {
        return (
          j.orderId?.toLowerCase().includes(q) ||
          j.selectedService?.toLowerCase().includes(q) ||
          j.userName?.toLowerCase().includes(q) ||
          j.companyName?.toLowerCase().includes(q) ||
          j.vehicleNumber?.toLowerCase().includes(q) ||
          j.vehicleModel?.toLowerCase().includes(q) ||
          j.userDeliveryAddress?.toLowerCase().includes(q)
        );
      });
    }

    // Service category filter
    if (selectedService !== "all") {
      list = list.filter((j) => j.selectedService === selectedService);
    }

    // Sorting
    list.sort((a, b) => {
      const timeA = a.orderDate?.seconds || 0;
      const timeB = b.orderDate?.seconds || 0;

      if (sortBy === "oldest") {
        return timeA - timeB;
      }
      if (sortBy === "distance") {
        return (a.calculatedDistance || 9999) - (b.calculatedDistance || 9999);
      }
      // default: newest
      return timeB - timeA;
    });

    return list;
  }, [currentTabList, searchQuery, selectedService, sortBy]);

  // Pagination calculations
  const totalItems = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Format date helper
  const formatDate = (orderDate: any) => {
    try {
      let d: Date;
      if (orderDate?.toDate) {
        d = orderDate.toDate();
      } else if (orderDate?.seconds) {
        d = new Date(orderDate.seconds * 1000);
      } else if (orderDate instanceof Date) {
        d = orderDate;
      } else {
        return "N/A";
      }
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Status Badge Component
  const renderStatusBadge = (job: FirestoreJob) => {
    const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
    const offerStatus = myOffer?.status ?? job.status;

    if (offerStatus === 5 || job.status === 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#58BB87] text-xs font-semibold border border-[#58BB87]/30">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    }

    if (offerStatus === -1 || job.status === -1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          <XCircle size={12} />
          Cancelled
        </span>
      );
    }

    switch (offerStatus) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            New Request
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            Offer Submitted
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
            Driver Choosing Pay
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            En Route
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
            Status #{offerStatus}
          </span>
        );
    }
  };

  const handleAdvanceStatus = async (job: FirestoreJob, targetStatus: number) => {
    setIsAdvancingStatus(true);
    try {
      await updateJobStatus(job.id, job.userId, targetStatus);
    } finally {
      setIsAdvancingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 MAIN TABS WITH COUNTERS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200">
        {/* Tab 1: Upcoming */}
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "upcoming"
              ? "bg-[#F96176] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Briefcase size={15} />
          <span>Upcoming</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "upcoming"
                ? "bg-white text-[#F96176]"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {upcomingJobs.length}
          </span>
        </button>

        {/* Tab 2: Ongoing */}
        <button
          onClick={() => setActiveTab("ongoing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "ongoing"
              ? "bg-[#F96176] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <Clock size={15} />
          <span>Ongoing</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "ongoing"
                ? "bg-white text-[#F96176]"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {ongoingJobs.length}
          </span>
        </button>

        {/* Tab 3: Completed */}
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "completed"
              ? "bg-[#F96176] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Completed</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "completed"
                ? "bg-white text-[#F96176]"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {completedJobs.length}
          </span>
        </button>

        {/* Tab 4: Cancelled */}
        <button
          onClick={() => setActiveTab("cancelled")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "cancelled"
              ? "bg-[#F96176] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <XCircle size={15} />
          <span>Cancelled</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "cancelled"
                ? "bg-white text-[#F96176]"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {cancelledJobs.length}
          </span>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, vehicle, service, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Service Filter */}
            <div className="relative">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F96176] cursor-pointer"
              >
                <option value="all">All Services ({currentTabList.length})</option>
                {uniqueServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F96176] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="distance">Closest Distance</option>
              </select>
              <ArrowUpDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Clear filters button if active */}
            {(searchQuery || selectedService !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedService("all");
                  setSortBy("newest");
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[#F96176] hover:bg-rose-50 border border-rose-100 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTENT */}
        {isLoadingJobs ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold text-gray-500">
              Loading live jobs data...
            </span>
          </div>
        ) : paginatedJobs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              {activeTab === "upcoming" && <Briefcase size={28} />}
              {activeTab === "ongoing" && <Clock size={28} />}
              {activeTab === "completed" && <CheckCircle2 size={28} />}
              {activeTab === "cancelled" && <XCircle size={28} />}
            </div>
            <h4 className="text-base font-bold text-gray-800">
              No {activeTab} jobs found
            </h4>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery || selectedService !== "all"
                ? "No jobs match your search or filter criteria. Try adjusting your filters."
                : `There are currently no ${activeTab} jobs in this category.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-5 sm:px-6">Order ID & Unit</th>
                  <th className="py-3 px-4">Customer & Fleet</th>
                  <th className="py-3 px-4">Service Required</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedJobs.map((job) => {
                  const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
                  const offerStatus = myOffer?.status ?? job.status;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedJobForDetails(job)}
                    >
                      {/* Order ID & Unit */}
                      <td className="py-3.5 px-5 sm:px-6">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <Truck size={15} className="text-[#F96176] shrink-0" />
                          <span className="font-mono">#{job.orderId}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[150px]">
                          {job.vehicleNumber || job.vehicleModel || "Vehicle #N/A"}
                        </div>
                      </td>

                      {/* Customer & Fleet */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{job.userName}</div>
                        {job.companyName && (
                          <div className="text-[11px] text-gray-500 truncate max-w-[140px]">
                            {job.companyName}
                          </div>
                        )}
                        {job.userPhoneNumber && (
                          <a
                            href={`tel:${job.userPhoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-[#58BB87] hover:underline"
                          >
                            <Phone size={10} />
                            <span>{job.userPhoneNumber}</span>
                          </a>
                        )}
                      </td>

                      {/* Service Required */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold truncate max-w-full">
                          {job.selectedService}
                        </span>
                        {job.description && (
                          <p className="text-[11px] text-gray-500 truncate mt-0.5" title={job.description}>
                            {job.description}
                          </p>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="flex items-start gap-1">
                          <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700 truncate" title={job.userDeliveryAddress}>
                              {job.userDeliveryAddress || "N/A"}
                            </p>
                            {typeof job.calculatedDistance === "number" && (
                              <span className="text-[10px] font-semibold text-[#F96176]">
                                ~{job.calculatedDistance} km away
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(job.orderDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(job)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-5 sm:px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedJobForDetails(job)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#F96176] hover:text-white text-gray-600 transition"
                            title="View Full Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Quick action button depending on tab */}
                          {activeTab === "upcoming" && (
                            <button
                              onClick={() => setOfferModalJob(job)}
                              className="px-3 py-1.5 rounded-lg bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-semibold transition shadow-xs flex items-center gap-1"
                            >
                              <Send size={12} />
                              <span>Offer</span>
                            </button>
                          )}

                          {activeTab === "ongoing" && (
                            <>
                              {offerStatus === 3 && (
                                <button
                                  onClick={() => handleAdvanceStatus(job, 4)}
                                  disabled={isAdvancingStatus}
                                  className="px-3 py-1.5 rounded-lg bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-semibold transition shadow-xs"
                                >
                                  Reached Bay
                                </button>
                              )}
                              {offerStatus === 4 && (
                                <button
                                  onClick={() => handleAdvanceStatus(job, 5)}
                                  disabled={isAdvancingStatus}
                                  className="px-3 py-1.5 rounded-lg bg-[#58BB87] hover:bg-[#48a674] text-white text-xs font-semibold transition shadow-xs"
                                >
                                  Complete
                                </button>
                              )}
                            </>
                          )}

                          {activeTab === "completed" && !job.mReviewSubmitted && (
                            <button
                              onClick={() => setRateModalJob(job)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition border border-amber-200 flex items-center gap-1"
                            >
                              <Star size={12} />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PROPER PAGINATION CONTROLS */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{startIndex + 1}</strong> to{" "}
              <strong className="text-gray-900">{endIndex}</strong> of{" "}
              <strong className="text-gray-900">{totalItems}</strong> jobs
            </span>

            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // Show pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-semibold transition ${
                        currentPage === pageNum
                          ? "bg-[#F96176] text-white shadow-xs"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <span key={pageNum} className="text-gray-400 px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJobForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col gap-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F96176] uppercase">
                    Order #{selectedJobForDetails.orderId}
                  </span>
                  {renderStatusBadge(selectedJobForDetails)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedJobForDetails.selectedService}
                </h3>
                <span className="text-xs text-gray-400">
                  Created {formatDate(selectedJobForDetails.orderDate)}
                </span>
              </div>
              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="font-semibold text-gray-500 uppercase text-[10px]">
                  Customer & Fleet
                </span>
                <div className="font-bold text-gray-900 text-sm">
                  {selectedJobForDetails.userName}
                </div>
                {selectedJobForDetails.companyName && (
                  <div className="text-gray-600">
                    Company: <strong className="text-gray-800">{selectedJobForDetails.companyName}</strong>
                  </div>
                )}
                {selectedJobForDetails.userPhoneNumber && (
                  <a
                    href={`tel:${selectedJobForDetails.userPhoneNumber}`}
                    className="inline-flex items-center gap-1.5 text-[#58BB87] font-semibold hover:underline mt-1"
                  >
                    <Phone size={12} />
                    <span>{selectedJobForDetails.userPhoneNumber}</span>
                  </a>
                )}
              </div>

              {/* Vehicle Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="font-semibold text-gray-500 uppercase text-[10px]">
                  Vehicle Information
                </span>
                <div className="font-bold text-gray-900 text-sm">
                  {selectedJobForDetails.vehicleNumber || "No plate provided"}
                </div>
                <div className="text-gray-600">
                  Model: <strong className="text-gray-800">{selectedJobForDetails.vehicleModel || "Standard Commercial"}</strong>
                </div>
              </div>

              {/* Location Card */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">
                    Breakdown / Service Location
                  </span>
                  {selectedJobForDetails.userLat && selectedJobForDetails.userLong && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedJobForDetails.userLat},${selectedJobForDetails.userLong}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#F96176] font-semibold hover:underline"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="font-medium text-gray-800">
                  {selectedJobForDetails.userDeliveryAddress || "N/A"}
                </p>
                {typeof selectedJobForDetails.calculatedDistance === "number" && (
                  <span className="text-[#F96176] font-semibold block text-[11px]">
                    Distance from your current depot: ~{selectedJobForDetails.calculatedDistance} km
                  </span>
                )}
              </div>

              {/* Problem Description */}
              {selectedJobForDetails.description && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">
                    Problem Notes / Driver Issue
                  </span>
                  <p className="text-gray-800 leading-relaxed font-normal">
                    {selectedJobForDetails.description}
                  </p>
                </div>
              )}

              {/* Uploaded Damage Photos */}
              {selectedJobForDetails.images && selectedJobForDetails.images.length > 0 && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">
                    Customer Attached Photos ({selectedJobForDetails.images.length})
                  </span>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {selectedJobForDetails.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-20 w-20 rounded-xl overflow-hidden border border-gray-200 shrink-0 block"
                      >
                        <img src={img} alt="Vehicle issue" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Offer Details if already submitted */}
              {selectedJobForDetails.mechanicsOffer && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <span className="font-semibold text-[#F96176] uppercase text-[10px]">
                    Mechanic Offer History
                  </span>
                  {selectedJobForDetails.mechanicsOffer.map((offer, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-700">
                        {offer.mName} ({offer.mNumber || "Mechanic"})
                      </span>
                      <span className="font-bold text-[#F96176]">
                        {offer.fixPrice
                          ? `$${offer.fixPrice} Flat Rate`
                          : `$${offer.arrivalCharges} Arrival + $${offer.perHourCharges}/hr`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {selectedJobForDetails.status === -1 && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-red-50 border border-red-100 space-y-1">
                  <span className="font-semibold text-red-700 uppercase text-[10px]">
                    Cancellation Details
                  </span>
                  <p className="text-red-900 font-medium">
                    Reason: {selectedJobForDetails.cancelReason || "Cancelled by user/driver"}
                  </p>
                </div>
              )}

              {/* Rating & Review if completed */}
              {selectedJobForDetails.mReviewSubmitted && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={14} className="fill-amber-400" />
                    <span>{selectedJobForDetails.mRating || 5}.0 Rating</span>
                  </div>
                  {selectedJobForDetails.mReview && (
                    <p className="text-emerald-900 font-medium">
                      "{selectedJobForDetails.mReview}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition"
              >
                Close
              </button>

              {/* Action buttons inside details modal */}
              {selectedJobForDetails.status === 0 && (
                <button
                  onClick={() => {
                    const j = selectedJobForDetails;
                    setSelectedJobForDetails(null);
                    setOfferModalJob(j);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Submit Offer Quote</span>
                </button>
              )}

              {[1, 2, 3, 4].includes(selectedJobForDetails.status) && (
                <button
                  onClick={() => {
                    const j = selectedJobForDetails;
                    setSelectedJobForDetails(null);
                    setCancelModalJob(j);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition"
                >
                  Cancel Work Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModalJob && (
        <JobOfferModal
          job={offerModalJob}
          isOpen={Boolean(offerModalJob)}
          onClose={() => setOfferModalJob(null)}
          onSubmit={submitOffer}
        />
      )}

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        isOpen={Boolean(cancelModalJob)}
        orderId={cancelModalJob?.orderId || ""}
        reasons={cancelReasons}
        onClose={() => setCancelModalJob(null)}
        onConfirm={(reason) =>
          cancelJob({
            jobId: cancelModalJob?.id || "",
            userId: cancelModalJob?.userId || "",
            reason,
          })
        }
      />

      {/* Driver Rating Modal */}
      <DriverRatingModal
        isOpen={Boolean(rateModalJob)}
        jobId={rateModalJob?.id || ""}
        userId={rateModalJob?.userId || ""}
        orderId={rateModalJob?.orderId || ""}
        existingRating={rateModalJob?.mRating}
        existingReview={rateModalJob?.mReview}
        onClose={() => setRateModalJob(null)}
        onSubmit={submitRating}
      />
    </div>
  );
}
