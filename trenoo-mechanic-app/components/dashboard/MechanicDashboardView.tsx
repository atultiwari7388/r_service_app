"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  RefreshCw,
  Power,
  Flame,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  History,
  PhoneCall,
  Search,
  ArrowUpDown,
  Navigation,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMechanicDashboard } from "@/lib/hooks/useMechanicDashboard";
import HomeSubscriptionPlans from "./HomeSubscriptionPlans";
import UpcomingJobCard from "./UpcomingJobCard";
import OngoingJobCard from "./OngoingJobCard";
import JobOfferModal from "./JobOfferModal";
import CancelReasonModal from "./CancelReasonModal";
import DriverRatingModal from "./DriverRatingModal";
import StartJobDurationModal from "./StartJobDurationModal";
import EmergencyHandoverModal from "./EmergencyHandoverModal";
import ReassignMemberModal from "./ReassignMemberModal";
import { FirestoreJob } from "@/types/job";
import { APP_CONFIG } from "@/lib/constants";

function formatRenewalDate(dateInput: any): string {
  if (!dateInput) return "Active Plan";
  let date: Date | null = null;
  if (typeof dateInput === "string") {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) date = parsed;
  } else if (typeof dateInput === "number") {
    const ms = dateInput < 10000000000 ? dateInput * 1000 : dateInput;
    date = new Date(ms);
  } else if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (dateInput && dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  }
  if (!date || isNaN(date.getTime())) return "Active Plan";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MechanicDashboardView() {
  const {
    user,
    hasActivePlan,
    isOnline,
    currentAddress,
    isUpdatingLocation,
    refreshLocation,
    toggleActive,
    isLoadingJobs,
    upcomingJobs,
    ongoingJobs,
    historyJobs,
    totalCompletedJobsCount,
    ongoingJobsCount,
    totalNewJobsCount,
    selectedSortOption,
    setSelectedSortOption,
    filterOnlyNearby,
    setFilterOnlyNearby,
    cancelReasons,
    submitOffer,
    updateJobStatus,
    cancelJob,
    submitRating,
    startJobWithDuration,
    requestEmergencyHandover,
    reassignJobMember,
    currentUId,
    mechanicProfile,
  } = useMechanicDashboard();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "ongoing" | "history"
  >("upcoming");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [offerJob, setOfferJob] = useState<FirestoreJob | null>(null);
  const [cancelModalJob, setCancelModalJob] = useState<FirestoreJob | null>(
    null
  );
  const [rateModalJob, setRateModalJob] = useState<FirestoreJob | null>(null);
  const [durationModalJob, setDurationModalJob] = useState<FirestoreJob | null>(
    null
  );
  const [handoverModalJob, setHandoverModalJob] = useState<FirestoreJob | null>(
    null
  );
  const [reassignModalJob, setReassignModalJob] = useState<FirestoreJob | null>(
    null
  );

  // Filter jobs by search
  const filterBySearch = (list: FirestoreJob[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (j) =>
        j.orderId.toLowerCase().includes(q) ||
        j.selectedService.toLowerCase().includes(q) ||
        j.userName.toLowerCase().includes(q) ||
        j.vehicleNumber?.toLowerCase().includes(q) ||
        j.userDeliveryAddress?.toLowerCase().includes(q)
    );
  };

  const filteredUpcoming = filterBySearch(upcomingJobs);
  const filteredOngoing = filterBySearch(ongoingJobs);
  const filteredHistory = filterBySearch(historyJobs);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* 1. 24/7 HOTLINE TICKER (Hidden/commented out when mechanic has purchased an active plan) */}
      {!hasActivePlan && (
        <div className="rounded-2xl bg-white p-3 sm:p-4 text-gray-800 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F96176] text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
              <Flame size={12} /> 24/7 Commercial Dispatch
            </span>
            <span className="text-gray-600 hidden md:inline">
              Direct roadside breakdown requests from highway fleets &
              owner-operators.
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-gray-400 hidden sm:inline">
              Emergency Dispatch:
            </span>
            <a
              href={APP_CONFIG.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs transition shadow-xs"
            >
              <PhoneCall size={13} />
              <span>{APP_CONFIG.contact.phoneDisplay}</span>
            </a>
          </div>
        </div>
      )}

      {/* 2. LIVE TERMINAL & MEMBERSHIP SECTION */}
      {hasActivePlan ? (
        /* TWO CARDS SIDE-BY-SIDE WHEN PLAN IS PURCHASED */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Address & Active/Inactive Duty Switch */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#F96176] shrink-0">
                  <MapPin size={22} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                      Active Service Terminal / Address
                    </span>
                    <button
                      onClick={refreshLocation}
                      disabled={isUpdatingLocation || !isOnline}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-40"
                      title="Refresh GPS Coordinates"
                    >
                      <RefreshCw
                        size={13}
                        className={isUpdatingLocation ? "animate-spin text-[#F96176]" : ""}
                      />
                    </button>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate mt-0.5">
                    {isOnline
                      ? currentAddress || "GPS Connected (Resolving Address...)"
                      : "Offline • Duty Paused (Toggle switch to activate GPS location)"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Duty Switch Controller */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Mechanic Duty Status
                </span>
                <span
                  className={`text-xs font-black ${
                    isOnline ? "text-[#58BB87]" : "text-gray-400"
                  }`}
                >
                  {isOnline ? "ONLINE • RECEIVING JOBS" : "OFFLINE • DUTY PAUSED"}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isOnline}
                onClick={() => toggleActive(!isOnline)}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isOnline ? "bg-[#58BB87]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isOnline ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  <Power
                    size={14}
                    className={isOnline ? "text-[#58BB87]" : "text-gray-400"}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: Purchased Membership Details with View Button */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white rounded-3xl border border-emerald-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-11 w-11 rounded-2xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                      Active Membership
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                      <Sparkles size={11} /> ACTIVE
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 truncate mt-0.5">
                    {mechanicProfile?.currentSubscription?.planName ||
                      "Commercial Fleet Plan"}
                  </h3>
                  <div className="text-xs text-gray-500 font-medium">
                    Duration: {mechanicProfile?.currentSubscription?.duration || "Monthly"}
                  </div>
                </div>
              </div>
            </div>

            {/* Validity and View Button */}
            <div className="flex items-center justify-between pt-3 border-t border-emerald-100/80">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Plan Validity / Renewal
                </span>
                <span className="text-xs font-black text-gray-800">
                  {mechanicProfile?.currentSubscription?.currentPeriodEnd
                    ? `Valid until ${formatRenewalDate(mechanicProfile.currentSubscription.currentPeriodEnd)}`
                    : "Auto-renewing active membership"}
                </span>
              </div>

              <Link
                href="/profile?tab=subscription"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <span>View</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* IF MECHANIC HAS NO ACTIVE PLAN: SHOW LOCKED TERMINAL + MEMBERSHIP PLANS SECTION */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Lock size={22} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                    Mechanic Terminal (Locked)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                    Plan Required
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                  Duty Status Locked • Select a membership plan below to activate GPS & receive roadside jobs
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Duty Switch
                </span>
                <span className="text-xs font-black text-amber-600">
                  LOCKED
                </span>
              </div>
              <button
                type="button"
                disabled
                onClick={() =>
                  toast.error(
                    "Please choose a membership plan below to unlock your duty status."
                  )
                }
                className="relative inline-flex h-8 w-14 shrink-0 rounded-full border-2 border-transparent bg-gray-200 opacity-60 cursor-not-allowed"
                title="Membership plan required to go online"
              >
                <span className="inline-block h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400">
                  <Lock size={12} />
                </span>
              </button>
            </div>
          </div>

          {/* Embedded Membership Plans */}
          <HomeSubscriptionPlans
            mechanicId={currentUId}
            email={mechanicProfile?.email || user?.email || undefined}
            userCountry={mechanicProfile?.country}
          />
        </div>
      )}

      {/* 3. COMPACT STATS COUNTERS (Matching Flutter _compactDashboardItem) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Completed Jobs Card */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-gray-500">
              Total Completed Jobs
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalCompletedJobsCount}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
              Successfully serviced
            </span>
          </div>
        </div>

        {/* Ongoing Jobs Card */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-gray-500">
              Ongoing Jobs
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-[#F96176] flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {ongoingJobsCount}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
              Active in transit / bay
            </span>
          </div>
        </div>
      </div>

      {/* 4. INACTIVE MECHANIC WARNING SCREEN (When toggle is OFF, matching Flutter buildInactiveMechanicScreen) */}
      {!isOnline && (
        <div className="rounded-3xl bg-white border border-gray-200 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center text-[#F96176]">
            <AlertTriangle size={40} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              You are currently OFFLINE
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1">
              Please activate the online button above to receive real-time
              roadside breakdown requests and dispatch alerts in your area.
            </p>
          </div>
          <button
            onClick={() => toggleActive(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            <Power size={15} />
            <span>Go Online Now</span>
          </button>
        </div>
      )}

      {/* 5. JOB TABS & SEARCH SECTION (When Online) */}
      {isOnline && (
        <div className="space-y-4">
          {/* TAB HEADER & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === "upcoming"
                    ? "bg-[#F96176] text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Briefcase size={14} />
                <span>Upcoming Requests</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "upcoming"
                      ? "bg-white text-[#F96176]"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {upcomingJobs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("ongoing")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === "ongoing"
                    ? "bg-[#F96176] text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock size={14} />
                <span>Ongoing ({ongoingJobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === "history"
                    ? "bg-[#F96176] text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <History size={14} />
                <span>Completed / Cancelled</span>
              </button>
            </div>

            {/* Search, Sort & Nearby Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Selector matching Flutter PopUpMenu */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
                <ArrowUpDown size={13} className="text-[#F96176]" />
                <span className="text-gray-500 font-semibold hidden sm:inline">
                  Sort:
                </span>
                <select
                  value={selectedSortOption}
                  onChange={(e) => setSelectedSortOption(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-800 outline-hidden cursor-pointer text-xs"
                >
                  <option value="Near by">Near by (Closest)</option>
                  <option value="Rating">Rating</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>

              {/* Nearby Distance Filter Toggle */}
              {activeTab === "upcoming" && (
                <button
                  type="button"
                  onClick={() => setFilterOnlyNearby(!filterOnlyNearby)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    filterOnlyNearby
                      ? "bg-emerald-50 border-emerald-200 text-[#58BB87]"
                      : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Toggle between nearby jobs (within driver radius) and all requests"
                >
                  <Navigation
                    size={12}
                    className={
                      filterOnlyNearby ? "text-[#58BB87]" : "text-gray-500"
                    }
                  />
                  <span>
                    {filterOnlyNearby
                      ? "Nearby Only (≤ radius)"
                      : "Show All Distances"}
                  </span>
                </button>
              )}

              {/* Search Input */}
              <div className="relative min-w-[180px] sm:min-w-[200px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order, vehicle..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:border-[#F96176] font-medium"
                />
              </div>
            </div>
          </div>

          {/* DISTANCE FILTER NOTICE (Explaining why out-of-range jobs are hidden) */}
          {activeTab === "upcoming" &&
            filterOnlyNearby &&
            totalNewJobsCount > upcomingJobs.length && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>
                    Filtering active dispatches by nearby driver radius.{" "}
                    {totalNewJobsCount - upcomingJobs.length} job(s) farther
                    than dispatch threshold are hidden.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOnlyNearby(false)}
                  className="text-xs font-bold text-[#F96176] hover:underline cursor-pointer ml-2 shrink-0"
                >
                  Show All Dispatches
                </button>
              </div>
            )}

          {/* TAB CONTENT */}
          {isLoadingJobs ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-[#F96176]" />
              <span className="text-xs font-bold">
                Connecting to live dispatch stream...
              </span>
            </div>
          ) : (
            <>
              {/* 1. UPCOMING REQUESTS TAB */}
              {activeTab === "upcoming" && (
                <div className="space-y-4">
                  {filteredUpcoming.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Briefcase size={28} />
                      </div>
                      <h4 className="text-base font-bold text-gray-800">
                        No Upcoming Job Requests
                      </h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        There are currently no new roadside requests waiting for
                        dispatch in your area. New emergency dispatches will
                        appear here automatically in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUpcoming.map((job) => (
                        <UpcomingJobCard
                          key={job.id}
                          job={job}
                          onInterested={(j) => setOfferJob(j)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ONGOING JOBS TAB */}
              {activeTab === "ongoing" && (
                <div className="space-y-4">
                  {filteredOngoing.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Clock size={28} />
                      </div>
                      <h4 className="text-base font-bold text-gray-800">
                        No Active Ongoing Jobs
                      </h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Jobs that you have expressed interest in or are
                        currently servicing will be tracked here across all
                        stages (acceptance, en-route, work, completion).
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredOngoing.slice(0, 6).map((job) => (
                          <OngoingJobCard
                            key={job.id}
                            job={job}
                            currentUId={currentUId}
                            isOwner={mechanicProfile?.role !== "member"}
                            onUpdateStatus={updateJobStatus}
                            onStartJobClick={(j) => setDurationModalJob(j)}
                            onHandoverClick={(j) => setHandoverModalJob(j)}
                            onReassignClick={(j) => setReassignModalJob(j)}
                            onCancelClick={(j) => setCancelModalJob(j)}
                            onRateClick={(j) => setRateModalJob(j)}
                          />
                        ))}
                      </div>

                      {filteredOngoing.length > 6 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
                          <span className="text-xs text-gray-500 font-medium">
                            Showing 6 latest ongoing jobs out of {filteredOngoing.length} total.
                          </span>
                          <Link
                            href="/find-jobs?tab=ongoing"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-semibold transition shadow-xs"
                          >
                            <span>View All in Jobs Board</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 3. HISTORY / COMPLETED TAB */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {filteredHistory.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <History size={28} />
                      </div>
                      <h4 className="text-base font-bold text-gray-800">
                        No Past Jobs in History
                      </h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Completed work orders and cancelled jobs will appear
                        here for record keeping and review management.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredHistory.slice(0, 6).map((job) => (
                          <OngoingJobCard
                            key={job.id}
                            job={job}
                            currentUId={currentUId}
                            isOwner={mechanicProfile?.role !== "member"}
                            onUpdateStatus={updateJobStatus}
                            onStartJobClick={(j) => setDurationModalJob(j)}
                            onHandoverClick={(j) => setHandoverModalJob(j)}
                            onReassignClick={(j) => setReassignModalJob(j)}
                            onCancelClick={(j) => setCancelModalJob(j)}
                            onRateClick={(j) => setRateModalJob(j)}
                          />
                        ))}
                      </div>

                      {filteredHistory.length > 6 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
                          <span className="text-xs text-gray-500 font-medium">
                            Showing 6 latest past jobs out of {filteredHistory.length} total.
                          </span>
                          <Link
                            href="/find-jobs?tab=completed"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-semibold transition shadow-xs"
                          >
                            <span>View All in Jobs Board</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Job Offer Quote Modal */}
      <JobOfferModal
        job={offerJob}
        isOpen={Boolean(offerJob)}
        onClose={() => setOfferJob(null)}
        onSubmit={submitOffer}
        defaultPerHour={mechanicProfile?.perHourCharge || 50}
        ownerId={currentUId}
        isOwner={mechanicProfile?.role !== "member"}
      />

      {/* 2. Start Job Duration Modal (Scenario 1 & 2) */}
      <StartJobDurationModal
        job={durationModalJob}
        isOpen={Boolean(durationModalJob)}
        onClose={() => setDurationModalJob(null)}
        onConfirm={(est) =>
          startJobWithDuration(
            durationModalJob?.id || "",
            durationModalJob?.userId || "",
            est
          )
        }
      />

      {/* 3. Emergency Handover Modal (Scenario 3) */}
      <EmergencyHandoverModal
        job={handoverModalJob}
        isOpen={Boolean(handoverModalJob)}
        onClose={() => setHandoverModalJob(null)}
        onSubmit={requestEmergencyHandover}
      />

      {/* 4. Reassign Member Modal (Scenario 3 - Owner action) */}
      <ReassignMemberModal
        job={reassignModalJob}
        isOpen={Boolean(reassignModalJob)}
        onClose={() => setReassignModalJob(null)}
        ownerId={currentUId}
        onReassign={reassignJobMember}
      />

      {/* 5. Cancel Job Modal */}
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

      {/* 6. Driver Rating Modal */}
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
