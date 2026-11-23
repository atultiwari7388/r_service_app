"use client";

import React, { useState, useEffect } from "react";
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
  Truck,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { Vehicle } from "@/types/vehicle";
import toast from "react-hot-toast";
// GOOGLE PLACES API AUTOCOMPLETE (COMMENTED OUT TO AVOID HIGH API CHARGES)
// import GooglePlacesInput, { SelectedPlaceData } from "./GooglePlacesInput";
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
  const auth = useAuth();
  const currentUser = auth?.user;
  const effectiveOwnerId = currentUser?.uid;

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

  // Vehicle Fleet Assignment State
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicles, setAssignedVehicles] = useState<string[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load workshop vehicles in real-time when modal is open
  useEffect(() => {
    if (!isOpen || !effectiveOwnerId) return;

    setLoadingVehicles(true);
    const vehiclesRef = collection(db, "Mechanics", effectiveOwnerId, "Vehicles");
    const unsubscribe = onSnapshot(
      vehiclesRef,
      (snapshot) => {
        const list: Vehicle[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Vehicle);
        });
        // Sort vehicles by vehicleNumber
        list.sort((a, b) =>
          (a.vehicleNumber || "").localeCompare(b.vehicleNumber || "")
        );
        setAvailableVehicles(list);
        setLoadingVehicles(false);
      },
      (err) => {
        console.error("Error loading workshop vehicles:", err);
        setLoadingVehicles(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, effectiveOwnerId]);

  if (!isOpen) return null;

  const toggleSpecialty = (item: string) => {
    setSelectedServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handleVehicleSelection = (vehicleId: string) => {
    setAssignedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSelectAllVehicles = () => {
    if (assignedVehicles.length === availableVehicles.length) {
      setAssignedVehicles([]);
    } else {
      setAssignedVehicles(availableVehicles.map((v) => v.id));
    }
  };

  // Google Places select handler (commented out to avoid API usage charges)
  // const handlePlaceSelect = (data: SelectedPlaceData) => {
  //   setBaseCity(data.city);
  //   setBaseState(data.state);
  //   setFormattedAddress(data.formattedAddress);
  //   setPostalCode(data.postalCode);
  //   setLatitude(data.latitude);
  //   setLongitude(data.longitude);
  // };

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
        selectedVehicles: assignedVehicles,
        assignedVehicles: assignedVehicles,
        allowDirectJobAcceptance,
      });

      const memberUid = result?.data?.memberUid;

      if (result?.data?.success) {
        // Direct client-side sync to guarantee vehicle assignments in subcollection
        if (memberUid && effectiveOwnerId && assignedVehicles.length > 0) {
          const now = new Date();
          for (const vId of assignedVehicles) {
            const vData = availableVehicles.find((v) => v.id === vId);
            if (vData) {
              await updateDoc(
                doc(db, "Mechanics", effectiveOwnerId, "Vehicles", vId),
                {
                  assignedTo: memberUid,
                  assignedMemberName: trimmedName,
                  assigned_at: now,
                }
              ).catch(() => {});

              await setDoc(
                doc(db, "Mechanics", memberUid, "Vehicles", vId),
                {
                  ...vData,
                  assignedTo: memberUid,
                  assignedMemberName: trimmedName,
                  assigned_at: now,
                },
                { merge: true }
              ).catch(() => {});
            }
          }

          await updateDoc(doc(db, "Mechanics", memberUid), {
            assignedVehicles: assignedVehicles,
          }).catch(() => {});
        }

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
        setAssignedVehicles([]);
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
                Create technician profile with assigned workshop fleet vehicles.
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
                  Phone Number <span className="text-rose-500">*</span>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Base Location (Manual Address) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F96176]" />
                Operating Base & Address
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                USA Territory
              </span>
            </div>

            {/* GOOGLE PLACES AUTOCOMPLETE (COMMENTED OUT TO AVOID API BILLING CHARGES) */}
            {/*
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
            */}

            {/* Manual Street Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Street Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1200 Main St, Suite 400"
                value={formattedAddress}
                onChange={(e) => setFormattedAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Base City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dallas"
                  value={baseCity}
                  onChange={(e) => setBaseCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TX"
                  value={baseState}
                  onChange={(e) => setBaseState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 75201"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition"
                />
              </div>
            </div>

            {/* Optional GPS Coordinates */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Latitude <span className="text-gray-400 font-normal">(Optional GPS)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 32.7767"
                  value={latitude !== undefined ? latitude : ""}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#F96176] transition font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Longitude <span className="text-gray-400 font-normal">(Optional GPS)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. -96.7970"
                  value={longitude !== undefined ? longitude : ""}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#F96176] transition font-mono"
                />
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

          {/* Vehicle Assignment Section (matching rabbit-web-app style) */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#F96176]" />
                Assign Vehicles (Optional)
              </label>
              {availableVehicles.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {assignedVehicles.length} of {availableVehicles.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllVehicles}
                    className="font-bold text-[#F96176] hover:text-[#e0485d] transition cursor-pointer"
                  >
                    {assignedVehicles.length === availableVehicles.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              )}
            </div>

            {loadingVehicles ? (
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-center">
                <div className="w-5 h-5 border-2 border-[#F96176] border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                <span className="text-xs text-gray-500">Loading workshop fleet vehicles...</span>
              </div>
            ) : availableVehicles.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-slate-50/60 text-xs text-gray-500 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <span>
                  No vehicles currently registered in your workshop fleet. You can assign vehicles anytime later after adding them in <b>My Vehicles</b>.
                </span>
              </div>
            ) : (
              <div className="space-y-2 border border-gray-200 rounded-2xl p-3 max-h-56 overflow-y-auto bg-slate-50/40">
                {availableVehicles.map((vehicle) => {
                  const isSelected = assignedVehicles.includes(vehicle.id);
                  return (
                    <label
                      key={vehicle.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "bg-rose-50/70 border-[#F96176] shadow-xs"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleVehicleSelection(vehicle.id)}
                          className="w-4 h-4 rounded text-[#F96176] accent-[#F96176] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">
                              Unit #{vehicle.vehicleNumber}
                            </span>
                            {vehicle.vehicleType && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                {vehicle.vehicleType}
                              </span>
                            )}
                            {vehicle.assignedMemberName && !isSelected && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Assigned to: {vehicle.assignedMemberName}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {vehicle.companyName || "Workshop"} {vehicle.licensePlate ? `• Plate: ${vehicle.licensePlate}` : ""} {vehicle.vin ? `• VIN: ${vehicle.vin.slice(-6)}` : ""}
                          </p>
                        </div>
                      </div>
                      <Truck className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#F96176]" : "text-gray-400"}`} />
                    </label>
                  );
                })}
              </div>
            )}
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
