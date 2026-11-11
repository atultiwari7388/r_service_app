"use client";

import React, { useState } from "react";
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Phone,
  MapPin,
  DollarSign,
  Wrench,
  ShieldCheck,
  Eye,
  EyeOff,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import toast from "react-hot-toast";
import GooglePlacesInput, { SelectedPlaceData } from "./GooglePlacesInput";
import { formatUSPhoneNumber } from "@/lib/utils";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_SPECIALTIES = [
  "Diesel Engine",
  "Tire Service",
  "Air Brakes",
  "Transmission",
  "Electrical & Battery",
  "Reefer Cooling",
  "DOT Inspection",
  "Hydraulics",
  "Towing Support",
];

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTeamMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cellPhone, setCellPhone] = useState("");

  // Location via Google Places
  const [placeQuery, setPlaceQuery] = useState("");
  const [baseCity, setBaseCity] = useState("Dallas");
  const [baseState, setBaseState] = useState("TX");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number>(32.7767);
  const [longitude, setLongitude] = useState<number>(-96.797);

  const [perHCharge, setPerHCharge] = useState<number>(55);
  const [allowDirectJobAcceptance, setAllowDirectJobAcceptance] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Diesel Engine",
    "Tire Service",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSpecialty = (item: string) => {
    setSelectedServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handlePlaceSelect = (data: SelectedPlaceData) => {
    setBaseCity(data.city);
    setBaseState(data.state);
    setFormattedAddress(data.formattedAddress);
    setPostalCode(data.postalCode);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUSPhoneNumber(e.target.value);
    setCellPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      toast.error("Please enter technician's full name");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast.error("Please provide a valid technician email");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!cellPhone.trim()) {
      toast.error("Please enter a contact phone number");
      return;
    }
    if (!baseCity) {
      toast.error("Please select an operating US city / territory");
      return;
    }

    setIsSubmitting(true);

    try {
      const createMemberFn = httpsCallable(functions, "createMechanicTeamMember");
      const result: any = await createMemberFn({
        name: trimmedName,
        email: trimmedEmail,
        password: password,
        phone: cellPhone.trim(),
        baseCity: baseCity.trim(),
        baseState: baseState.trim(),
        address: formattedAddress.trim() || `${baseCity}, ${baseState} USA`,
        postalCode: postalCode.trim(),
        country: "USA",
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        perHCharge: Number(perHCharge) || 0,
        selectedServices,
        allowDirectJobAcceptance,
      });

      if (result?.data?.success) {
        toast.success(`Technician ${trimmedName} created successfully!`);
        onClose();
        if (onSuccess) onSuccess();
        // Reset state
        setName("");
        setEmail("");
        setPassword("");
        setCellPhone("");
        setPlaceQuery("");
        setFormattedAddress("");
      } else {
        toast.error(result?.data?.message || "Failed to create team member");
      }
    } catch (err: any) {
      console.error("Create member error:", err);
      toast.error(err?.message || "Failed to create team member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 my-8 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/70 via-white to-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F96176] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Add Team Technician
              </h2>
              <p className="text-xs text-gray-500">
                Create US technician profile with exact GPS coordinates for proximity dispatch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Identity & Credentials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#58BB87]" />
              Technician Credentials & Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  US Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="(555) 234-5678"
                    value={cellPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Login Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="technician@workshop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Assign Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Base Location via Google Places */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F96176]" />
                Operating Base & GPS Geolocation (Google Places)
              </h3>
              <span className="text-[11px] text-[#58BB87] font-semibold flex items-center gap-1">
                <Navigation size={12} /> Auto Lat/Lng
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Search US City, State, or Station Address <span className="text-rose-500">*</span>
              </label>
              <GooglePlacesInput
                value={placeQuery}
                onChange={setPlaceQuery}
                onPlaceSelect={handlePlaceSelect}
                placeholder="e.g. Dallas, TX or 1200 Main St, Chicago, IL"
                required
              />
            </div>

            {/* Resolved GPS Territory Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Base City:</span>
                <span className="font-bold text-gray-900">{baseCity || "Not selected"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">State / Zip:</span>
                <span className="font-bold text-gray-900">
                  {baseState || "—"} {postalCode ? `(${postalCode})` : ""}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Latitude:</span>
                <span className="font-mono text-gray-700">{latitude ? latitude.toFixed(4) : "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Longitude:</span>
                <span className="font-mono text-gray-700">{longitude ? longitude.toFixed(4) : "—"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Hourly Billing Rate ($/hr)
              </label>
              <div className="relative max-w-xs">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  placeholder="55"
                  value={perHCharge}
                  onChange={(e) => setPerHCharge(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] transition"
                />
              </div>
            </div>
          </div>

          {/* Specialties & Services */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#58BB87]" />
              Technician Skills & Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECIALTIES.map((spec) => {
                const isSelected = selectedServices.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-rose-50 border-[#F96176] text-[#F96176] font-semibold"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F96176]" />}
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Autonomous Direct-Accept Dispatch Mode */}
          <div className="pt-4 border-t border-gray-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">
                    Enable Autonomous Direct Job Acceptance
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF8F1] text-[#58BB87]">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  When enabled, this technician can directly view and accept commercial roadside requests within their US dispatch radius without waiting for manual owner dispatch.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={allowDirectJobAcceptance}
                  onChange={(e) => setAllowDirectJobAcceptance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#58BB87]"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#F96176]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Technician...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Technician</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
