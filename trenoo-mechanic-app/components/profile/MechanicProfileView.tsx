"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  FileText,
  Camera,
  Lock,
  Globe,
  Wallet,
  Star,
  ShieldAlert,
  Loader2,
  Save,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Sparkles,
  CreditCard,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useMechanicProfile } from "@/lib/hooks/useMechanicProfile";
import Link from "next/link";

// Strict MM/DD/YYYY Date Formatter
function formatToMMDDYYYY(dateInput: any): string {
  if (!dateInput) return "N/A";
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
  } else if (dateInput instanceof Date) {
    date = dateInput;
  }
  if (!date || isNaN(date.getTime())) return "N/A";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function getRenewalDate(sub: any): Date | null {
  if (!sub) return null;
  if (sub.currentPeriodEnd) {
    const parsed = new Date(sub.currentPeriodEnd);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const baseDate = sub.purchasedAt
    ? new Date(sub.purchasedAt)
    : sub.purchasedTimestamp
    ? new Date(sub.purchasedTimestamp)
    : new Date();
  if (isNaN(baseDate.getTime())) return null;
  const duration = (sub.duration || "").toLowerCase();
  const renewal = new Date(baseDate.getTime());
  if (duration.includes("year") || duration.includes("annual")) {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else if (duration.includes("quarter")) {
    renewal.setMonth(renewal.getMonth() + 3);
  } else if (duration.includes("semi") || duration.includes("6 month")) {
    renewal.setMonth(renewal.getMonth() + 6);
  } else if (duration.includes("week")) {
    renewal.setDate(renewal.getDate() + 7);
  } else {
    renewal.setMonth(renewal.getMonth() + 1);
  }
  return renewal;
}

function getDaysRemaining(renewalDate: Date | null): number {
  if (!renewalDate || isNaN(renewalDate.getTime())) return 0;
  const diffMs = renewalDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export default function MechanicProfileView() {
  const {
    user,
    mechanicProfile,
    formData,
    wallet,
    profilePicture,
    availableLanguages,
    isLoading,
    isSaving,
    isUploadingPhoto,
    passwordState,
    setPasswordState,
    subscription,
    isSubscriptionPurchase,
    handleInputChange,
    handleLanguageToggle,
    handleActiveToggle,
    handleImageUpload,
    saveProfile,
    handlePasswordChange,
    deactivateAccount,
    deleteAccountPermanently,
  } = useMechanicProfile();

  const isMember =
    mechanicProfile?.role === "member" ||
    !!mechanicProfile?.ownerId ||
    mechanicProfile?.isTeamMember === true;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "details" | "subscription" | "languages" | "security" | "account"
  >("details");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "subscription" || tabParam === "membership" || tabParam === "1") {
      setActiveTab("subscription");
    }
  }, [searchParams]);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const renewalDate = getRenewalDate(subscription);
  const daysRemaining = getDaysRemaining(renewalDate);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#F96176]" />
        <p className="text-gray-500 font-medium text-sm">
          Loading mechanic profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-[#F96176] flex items-center justify-center font-bold text-2xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Authentication Required
        </h2>
        <p className="text-gray-500 text-sm">
          You must be logged in as a registered mechanic to view and manage your
          profile.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#F96176] text-white font-semibold shadow-xs hover:bg-[#e0485d] transition"
          >
            Go to Mechanic Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />

      {/* TOP HEADER / HERO PROFILE CARD - CLEAN LIGHT STYLING (NO DARK BLUE) */}
      <div className="relative overflow-hidden rounded-3xl bg-white text-gray-900 p-6 sm:p-8 shadow-xs border border-gray-200">
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Avatar with Camera Icon */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-gray-100 overflow-hidden bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={formData.userName || "Mechanic"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#F96176] to-[#ff8c42] flex items-center justify-center text-3xl font-extrabold text-white">
                    {(
                      formData.userName ||
                      formData.workshopName ||
                      user.email ||
                      "M"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-[#F96176] text-white shadow-md hover:bg-[#e0485d] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Change Profile Photo"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Profile Core Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 truncate">
                  {isMember
                    ? formData.userName || "Technician"
                    : formData.workshopName ||
                      formData.userName ||
                      "Mechanic Workshop"}
                </h1>
                {isMember && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                    Field Technician • Team Member
                  </span>
                )}
                {formData.active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-[#58BB87] animate-pulse" />
                    Available / Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Offline / Busy
                  </span>
                )}
              </div>

              <p className="text-gray-600 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                <User className="w-4 h-4 text-[#F96176]" />
                <span className="text-gray-900 font-bold">
                  {formData.userName || "Registered Specialist"}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {formData.email}
                </span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-600 pt-1">
                {formData.cellPhone && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                    <Phone className="w-3.5 h-3.5 text-[#58BB87]" />
                    {formData.cellPhone}
                  </span>
                )}
                {(formData.city || formData.state) && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#F96176]" />
                    {[formData.city, formData.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {mechanicProfile?.rating ? Number(mechanicProfile.rating).toFixed(1) : "5.0"} Rating
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action & Wallet Widget */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end gap-3 shrink-0">
            {/* Subscription Quick Badge */}
            {isMember ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-[#58BB87] border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#58BB87]" />
                <span>Team Seat Active</span>
              </div>
            ) : isSubscriptionPurchase && subscription ? (
              <button
                type="button"
                onClick={() => setActiveTab("subscription")}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-[#F96176] border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="View Subscription Details"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F96176]" />
                <span className="truncate max-w-[120px]">
                  {subscription.planName || "Active Plan"}
                </span>
                <span className="text-[10px] bg-[#58BB87] text-white px-1.5 py-0.5 rounded-full uppercase font-black tracking-wide">
                  Active
                </span>
              </button>
            ) : (
              <Link
                href={
                  user
                    ? `/choose-plan?mechanicId=${
                        user.uid
                      }&email=${encodeURIComponent(user.email || "")}`
                    : "/choose-plan"
                }
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>No Active Plan</span>
                <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full uppercase font-black">
                  Choose Plan
                </span>
              </Link>
            )}

            {/* Wallet Box */}
            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
              <div className="p-2 rounded-xl bg-emerald-100 text-[#58BB87]">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-bold">
                  Wallet Balance
                </span>
                <span className="text-xl font-black text-emerald-950">
                  ${wallet.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-700 font-medium">
                Service Dispatch:
              </span>
              <button
                type="button"
                onClick={() => handleActiveToggle(!formData.active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  formData.active ? "bg-[#58BB87]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "details"
              ? "border-[#F96176] text-[#F96176] bg-rose-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Building className="w-4 h-4" />
          {isMember ? "Personal Profile" : "Personal & Workshop Info"}
        </button>

        {!isMember && (
          <button
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "subscription"
                ? "border-[#58BB87] text-[#58BB87] bg-emerald-50/50"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Subscription Plan
            {isSubscriptionPurchase && (
              <span className="w-2 h-2 rounded-full bg-[#58BB87] animate-pulse" />
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab("languages")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "languages"
              ? "border-[#F96176] text-[#F96176] bg-rose-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Globe className="w-4 h-4" />
          Languages Spoken
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "border-[#F96176] text-[#F96176] bg-rose-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Lock className="w-4 h-4" />
          Password & Security
        </button>

        {!isMember && (
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "account"
                ? "border-red-600 text-red-600 bg-red-50/50"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Account & Deactivation
          </button>
        )}
      </div>

      {/* TAB CONTENT: 1. DETAILS */}
      {activeTab === "details" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Mechanic & Workshop Details
              </h2>
              <p className="text-xs text-gray-500">
                Update your business representation and dispatch parameters
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-xs hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#F96176]" />
                Mechanic Name *
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Workshop Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#F96176]" />
                Workshop / Business Name *
              </label>
              <input
                type="text"
                name="workshopName"
                value={formData.workshopName}
                onChange={handleInputChange}
                placeholder="Apex Heavy Duty Repair"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Email (Read only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email Address (Account ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Cell Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#58BB87]" />
                Cell Phone Number *
              </label>
              <input
                type="tel"
                name="cellPhone"
                value={formData.cellPhone}
                onChange={handleInputChange}
                placeholder="+1 555-0199"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Telephone (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Office Telephone (Optional)
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="+1 555-0144"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#58BB87]" />
                Hourly Labor Charge ($)
              </label>
              <input
                type="number"
                name="perHCharge"
                value={formData.perHCharge}
                onChange={handleInputChange}
                placeholder="95"
                min="0"
                step="5"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#F96176]" />
                Date of Birth
              </label>
              <input
                type="text"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                placeholder="YYYY-MM-DD"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Years of Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#F96176]" />
                Years of Experience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="8 years in diesel & trailer suspensions"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F96176]" />
                Shop Bay Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="104 Industrial Pkwy"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Dallas"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="TX"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="United States"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Postal / Zip Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="75001"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>
          </div>

          {/* Description / Bio */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#F96176]" />
              Workshop Bio & Specializations
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell fleet managers and drivers about your mobile capabilities, equipment, certifications, and service bay capacity..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none resize-none"
            />
          </div>

          {/* Bottom Action */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-xs hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Profile Details
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. SUBSCRIPTION PLAN DETAILS */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          {isSubscriptionPurchase && subscription ? (
            <>
              {/* Plan Hero Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-[#58BB87] animate-pulse" />
                        Active Membership
                      </span>
                      {subscription.autoPay ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#F96176] border border-rose-200">
                          <RefreshCw className="w-3 h-3 text-[#F96176]" />
                          Auto-Debit Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          Manual Billing
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {subscription.planName || "Pro Mechanic Plan"}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">
                      Billing Cycle:{" "}
                      <span className="font-bold text-gray-800">
                        {subscription.duration || "Monthly"}
                      </span>{" "}
                      • Priority Dispatch Access & US Workshop Privileges
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={
                        user
                          ? `/choose-plan?mechanicId=${
                              user.uid
                            }&email=${encodeURIComponent(user.email || "")}`
                          : "/choose-plan"
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F96176] text-white font-bold text-sm shadow-xs hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Change / Upgrade Plan
                    </Link>
                  </div>
                </div>

                {/* 3 Metric Cards: Subscribed On, Next Renewal Date, Days Remaining */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  {/* Metric 1: Valid From / Subscribed On (MM/DD/YYYY) */}
                  <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Subscribed On
                      </span>
                      <div className="p-2 rounded-xl bg-white text-[#F96176] shadow-2xs border border-rose-100">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {formatToMMDDYYYY(
                        subscription.purchasedAt ||
                          subscription.purchasedTimestamp
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Plan activation date on Trenoo
                    </p>
                  </div>

                  {/* Metric 2: Next Renewal Date (MM/DD/YYYY) */}
                  <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Next Renewal Date
                      </span>
                      <div className="p-2 rounded-xl bg-white text-[#58BB87] shadow-2xs border border-emerald-100">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {formatToMMDDYYYY(renewalDate)}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {subscription.autoPay
                        ? "Auto-charges on renewal date"
                        : "Expires on renewal date"}
                    </p>
                  </div>

                  {/* Metric 3: Validity Period / Days Remaining */}
                  <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        Validation Remaining
                      </span>
                      <div className="p-2 rounded-xl bg-white text-amber-600 shadow-2xs border border-amber-100">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {daysRemaining} Days Left
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Valid through {formatToMMDDYYYY(renewalDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial & Workshop Privileges Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Billing Summary Box */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-50 text-[#F96176]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Billing & Payment Summary
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                      Stripe Protected
                    </span>
                  </div>

                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-medium">
                        Amount Paid:
                      </span>
                      <span className="font-extrabold text-gray-900 text-base">
                        ${subscription.amountPaid?.toFixed(2) || "0.00"}{" "}
                        {subscription.currency?.toUpperCase() || "USD"}
                      </span>
                    </div>

                    {subscription.originalPrice &&
                      subscription.originalPrice > subscription.amountPaid && (
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-500 font-medium">
                            Standard Price:
                          </span>
                          <span className="line-through text-gray-400 font-medium">
                            ${subscription.originalPrice.toFixed(2)}
                          </span>
                        </div>
                      )}

                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-medium">
                        Billing Period:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {subscription.duration || "Monthly"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-medium">
                        Payment Gateway:
                      </span>
                      <span className="font-semibold text-gray-800">
                        Stripe Auto-Pay (US ACH / Card)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 font-medium">
                        Plan Status:
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#58BB87]">
                        <CheckCircle2 className="w-4 h-4 text-[#58BB87]" />
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workshop Privileges & Limits */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-[#58BB87]">
                        <Building className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Workshop Privileges
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-[#58BB87] border border-emerald-200">
                      Full Access
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Bay Capacity */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Service Bays
                      </span>
                      <span className="text-sm font-extrabold text-gray-900">
                        {subscription.maxBays === -1 ||
                        subscription.maxBays === undefined
                          ? "Unlimited Bays"
                          : `${subscription.maxBays} Active Bays`}
                      </span>
                    </div>

                    {/* Coverage Radius */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Dispatch Radius
                      </span>
                      <span className="text-sm font-extrabold text-gray-900">
                        {subscription.serviceRadiusMiles === -1 ||
                        subscription.serviceRadiusMiles === undefined
                          ? "Nationwide / Unlimited"
                          : `${subscription.serviceRadiusMiles} Miles Radius`}
                      </span>
                    </div>

                    {/* Priority Leads */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Job Leads
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#58BB87]" />
                        {subscription.priorityJobLeads !== false
                          ? "Priority Dispatch"
                          : "Standard Queue"}
                      </span>
                    </div>

                    {/* Carrier Invoicing */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Carrier Billing
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#58BB87]" />
                        {subscription.directCarrierInvoicing !== false
                          ? "Direct Invoicing"
                          : "Manual Invoicing"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Features & Benefits */}
              {subscription.features && subscription.features.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F96176]" />
                    Included Plan Features & Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {subscription.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#58BB87] shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              {subscription.termsAndConditions &&
                subscription.termsAndConditions.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Subscription Terms & Policy
                    </h3>
                    <ul className="space-y-1.5 text-xs text-gray-500 list-disc list-inside">
                      {subscription.termsAndConditions.map((term, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          ) : (
            /* No Active Subscription Card */
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xs border border-gray-200 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#F96176] flex items-center justify-center mx-auto shadow-xs border border-rose-100">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">
                  No Active Subscription Plan
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Choose a subscription plan to unlock full roadside dispatch
                  privileges, priority truck driver leads, unlimited service
                  bays, and direct carrier invoicing.
                </p>
              </div>
              <div>
                <Link
                  href={
                    user
                      ? `/choose-plan?mechanicId=${
                          user.uid
                        }&email=${encodeURIComponent(user.email || "")}`
                      : "/choose-plan"
                  }
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F96176] text-white font-bold text-sm shadow-md hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Choose Subscription Plan
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. LANGUAGES */}
      {activeTab === "languages" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Supported Languages
              </h2>
              <p className="text-xs text-gray-500">
                Drivers often filter mechanics by spoken languages for clear
                roadside communication
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-xs hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Languages
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableLanguages.map((lang) => {
              const isChecked = Boolean(formData.languages[lang]);
              return (
                <label
                  key={lang}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "border-[#F96176] bg-red-50/50 shadow-2xs ring-1 ring-[#F96176]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleLanguageToggle(lang)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176] border-gray-300 cursor-pointer"
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isChecked ? "text-[#F96176]" : "text-gray-700"
                    }`}
                  >
                    {lang}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Tip:</strong> Selecting multilingual proficiencies
              improves dispatch matching for cross-border freight routes (e.g.
              English, Spanish, Punjabi).
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. SECURITY */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Change Portal Password
            </h2>
            <p className="text-xs text-gray-500">
              Ensure your account uses a secure password of at least 6
              characters
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={passwordState.newPassword}
                onChange={(e) =>
                  setPasswordState((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordState.confirmPassword}
                onChange={(e) =>
                  setPasswordState((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordState.isUpdating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-xs hover:bg-[#e0485d] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {passwordState.isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. ACCOUNT & DANGER ZONE - NO BLUE */}
      {activeTab === "account" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Account Management & Lifecycle
            </h2>
            <p className="text-xs text-gray-500">
              Manage account deactivation, visibility, or complete removal from
              the Treno platform
            </p>
          </div>

          <div className="space-y-4">
            {/* Temporary Deactivation Card (Warm Amber/Neutral - No Blue) */}
            <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-600" />
                  Temporary Account Deactivation
                </h3>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-xl">
                  Temporarily hides your workshop from search queries and pauses
                  job dispatch notifications. All data, past invoices, and
                  history are preserved for when you return.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 active:scale-95 transition shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Deactivate Account
              </button>
            </div>

            {/* Permanent Deletion Card */}
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Permanent Account Deletion
                </h3>
                <p className="text-xs text-red-800/90 leading-relaxed max-w-xl">
                  Irreversible action. Permanently purges your mechanic account,
                  linked team profiles, and certifications according to data
                  privacy retention standards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 active:scale-95 transition shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Delete Account Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DEACTIVATE (Warm Amber theme - No Blue) */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Temporarily Deactivate Account?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your workshop will be set to offline and will not receive new
              service requests. You can reactivate anytime simply by signing
              back into the portal.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deactivateAccount}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PERMANENT DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-red-600">
              Permanent Account Deletion
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete your account? This
              action cannot be reversed. All mechanic profile records, bay
              assignments, and credentials will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccountPermanently}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
