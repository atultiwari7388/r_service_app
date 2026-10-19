"use client";

import React, { useRef, useState } from "react";
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
  CheckCircle2,
  Lock,
  Globe,
  Wallet,
  Star,
  ShieldAlert,
  Loader2,
  Save,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { useMechanicProfile } from "@/lib/hooks/useMechanicProfile";
import Link from "next/link";

export default function MechanicProfileView() {
  const {
    user,
    formData,
    wallet,
    profilePicture,
    availableLanguages,
    isLoading,
    isSaving,
    isUploadingPhoto,
    passwordState,
    setPasswordState,
    handleInputChange,
    handleLanguageToggle,
    handleActiveToggle,
    handleImageUpload,
    saveProfile,
    handlePasswordChange,
    deactivateAccount,
    deleteAccountPermanently,
  } = useMechanicProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"details" | "languages" | "security" | "account">("details");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#F96176]" />
        <p className="text-gray-500 font-medium text-sm">Loading mechanic profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-[#F96176] flex items-center justify-center font-bold text-2xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B132B]">Authentication Required</h2>
        <p className="text-gray-500 text-sm">
          You must be logged in as a registered mechanic to view and manage your profile.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#F96176] text-white font-semibold shadow-md hover:bg-[#e04f63] transition"
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

      {/* TOP HEADER / HERO PROFILE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white p-6 sm:p-8 shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-[#F96176]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Avatar with Camera Icon */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white/10 overflow-hidden bg-[#1C2541] shadow-xl flex items-center justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={formData.userName || "Mechanic"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#F96176] to-[#ff8c42] flex items-center justify-center text-3xl font-extrabold text-white">
                    {(formData.userName || formData.workshopName || user.email || "M")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-[#F96176] text-white shadow-lg hover:bg-[#e04f63] hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                  {formData.workshopName || formData.userName || "Mechanic Workshop"}
                </h1>
                {formData.active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#58BB87]/20 text-[#58BB87] border border-[#58BB87]/40 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#58BB87] animate-pulse" />
                    Available / Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-700/60 text-gray-300 border border-gray-600">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Offline / Busy
                  </span>
                )}
              </div>

              <p className="text-gray-300 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                <User className="w-4 h-4 text-[#F96176]" />
                <span>{formData.userName || "Registered Specialist"}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-xs sm:text-sm">{formData.email}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-300 pt-1">
                {formData.cellPhone && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <Phone className="w-3.5 h-3.5 text-[#58BB87]" />
                    {formData.cellPhone}
                  </span>
                )}
                {(formData.city || formData.state) && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {[formData.city, formData.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 text-yellow-400 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  4.98 Rating
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action & Wallet Widget */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end gap-3 shrink-0">
            {/* Wallet Box */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-inner">
              <div className="p-2 rounded-xl bg-[#58BB87]/20 text-[#58BB87]">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-gray-300 block font-semibold">
                  Wallet Balance
                </span>
                <span className="text-xl font-extrabold text-white">
                  ${wallet.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-2.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-gray-300 font-medium">Service Call Dispatch:</span>
              <button
                type="button"
                onClick={() => handleActiveToggle(!formData.active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  formData.active ? "bg-[#58BB87]" : "bg-gray-600"
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
              ? "border-[#F96176] text-[#F96176] bg-red-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Building className="w-4 h-4" />
          Personal & Workshop Info
        </button>

        <button
          onClick={() => setActiveTab("languages")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "languages"
              ? "border-[#F96176] text-[#F96176] bg-red-50/50"
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
              ? "border-[#F96176] text-[#F96176] bg-red-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Lock className="w-4 h-4" />
          Password & Security
        </button>

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
      </div>

      {/* TAB CONTENT: 1. DETAILS */}
      {activeTab === "details" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mechanic & Workshop Details</h2>
              <p className="text-xs text-gray-500">
                Update your business representation and dispatch parameters
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-md hover:bg-[#e04f63] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-md hover:bg-[#e04f63] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Profile Details
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. LANGUAGES */}
      {activeTab === "languages" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Supported Languages</h2>
              <p className="text-xs text-gray-500">
                Drivers often filter mechanics by spoken languages for clear roadside communication
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F96176] text-white font-semibold text-sm shadow-md hover:bg-[#e04f63] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                      ? "border-[#F96176] bg-red-50/50 shadow-xs ring-1 ring-[#F96176]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleLanguageToggle(lang)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176] border-gray-300 cursor-pointer"
                  />
                  <span className={`text-sm font-semibold ${isChecked ? "text-[#F96176]" : "text-gray-700"}`}>
                    {lang}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Tip:</strong> Selecting multilingual proficiencies improves dispatch matching for cross-border freight routes (e.g. English, Spanish, Punjabi).
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. SECURITY */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Change Portal Password</h2>
            <p className="text-xs text-gray-500">
              Ensure your account uses a secure password of at least 6 characters
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
                  setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))
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
                  setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 text-sm font-medium text-gray-800 transition outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordState.isUpdating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] text-white font-semibold text-sm shadow-md hover:bg-[#1C2541] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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

      {/* TAB CONTENT: 4. ACCOUNT & DANGER ZONE */}
      {activeTab === "account" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Account Management & Lifecycle</h2>
            <p className="text-xs text-gray-500">
              Manage account deactivation, visibility, or complete removal from the Trenoo platform
            </p>
          </div>

          <div className="space-y-4">
            {/* Temporary Deactivation Card */}
            <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600" />
                  Temporary Account Deactivation
                </h3>
                <p className="text-xs text-blue-700/80 leading-relaxed max-w-xl">
                  Temporarily hides your workshop from search queries and pauses job dispatch notifications. All data, past invoices, and history are preserved for when you return.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 active:scale-95 transition shadow-xs whitespace-nowrap cursor-pointer"
              >
                Deactivate Account
              </button>
            </div>

            {/* Permanent Deletion Card */}
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Permanent Account Deletion
                </h3>
                <p className="text-xs text-red-700/80 leading-relaxed max-w-xl">
                  Irreversible action. Permanently purges your mechanic account, linked team profiles, and certifications according to data privacy retention standards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 active:scale-95 transition shadow-xs whitespace-nowrap cursor-pointer"
              >
                Delete Account Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DEACTIVATE */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Temporarily Deactivate Account?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your workshop will be set to offline and will not receive new service requests. You can reactivate anytime simply by signing back into the portal.
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
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PERMANENT DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-red-600">Permanent Account Deletion</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete your account? This action cannot be reversed. All mechanic profile records, bay assignments, and credentials will be removed.
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
