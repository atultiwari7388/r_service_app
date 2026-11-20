"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  Sparkles,
  Send,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CustomFleetPlanRequest } from "@/types/subscription";

interface CustomFleetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrucks?: number;
  initialTrailers?: number;
  userProfile?: any;
  userAuth?: any;
  billingCycle?: "Monthly" | "Yearly";
}

export default function CustomFleetRequestModal({
  isOpen,
  onClose,
  initialTrucks = 0,
  initialTrailers = 0,
  userProfile,
  userAuth,
  billingCycle = "Monthly",
}: CustomFleetRequestModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("USA");
  const [trucks, setTrucks] = useState<number>(initialTrucks);
  const [trailers, setTrailers] = useState<number>(initialTrailers);
  const [preferredBilling, setPreferredBilling] = useState<"Monthly" | "Yearly">(billingCycle);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(userProfile?.companyName || "");
      setContactNumber(userProfile?.phoneNumber || userProfile?.phone || "");
      setEmail(userAuth?.email || userProfile?.email || "");
      setCountry(userProfile?.country || "USA");
      setTrucks(initialTrucks > 0 ? initialTrucks : 5);
      setTrailers(initialTrailers > 0 ? initialTrailers : 3);
      setPreferredBilling(billingCycle);
      setNotes("");
      setSubmittedId(null);
    }
  }, [isOpen, userProfile, userAuth, initialTrucks, initialTrailers, billingCycle]);

  if (!isOpen) return null;

  const totalUnits = trucks + trailers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Please enter your Company / Carrier Name");
      return;
    }
    if (!contactNumber.trim()) {
      toast.error("Please enter a valid contact phone number");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (totalUnits <= 0) {
      toast.error("Please specify at least 1 truck or trailer");
      return;
    }

    setLoading(true);
    try {
      const payload: Omit<CustomFleetPlanRequest, "id"> = {
        userId: userAuth?.uid || userProfile?.uid || "anonymous",
        userEmail: email.trim().toLowerCase(),
        userName: userProfile?.fullName || userProfile?.name || companyName.trim(),
        companyName: companyName.trim(),
        contactNumber: contactNumber.trim(),
        country: country.trim(),
        requestedTrucks: trucks,
        requestedTrailers: trailers,
        totalUnits,
        preferredBilling,
        notes: notes.trim(),
        status: "pending",
        quotedAmount: null,
        quotedDuration: null,
        stripePaymentLink: null,
        adminNotes: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "vehicleCustomPlanRequests"), payload);
      setSubmittedId(docRef.id);
      toast.success("Custom fleet plan request submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting custom fleet request:", err);
      toast.error(err?.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-rose-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-r from-rose-50 via-white to-emerald-50 border-b border-rose-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F96176] text-white flex items-center justify-center font-bold shadow-md shadow-[#F96176]/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#F96176] bg-rose-100 px-2.5 py-0.5 rounded-full mb-1">
                  Enterprise Fleet Quote
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Request a Custom Fleet Package
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Need coverage for large or mixed fleets? Our dispatch team will tailor a package with volume pricing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {submittedId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#58BB87] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                Request Submitted Successfully!
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
                Thank you for your inquiry. Our senior dispatch team is preparing a custom volume quote for your{" "}
                <strong className="text-gray-900">{totalUnits} units fleet ({trucks} Trucks + {trailers} Trailers)</strong>.
              </p>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 max-w-md mx-auto text-left space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-gray-500">Reference ID:</span>
                <span className="font-bold text-[#F96176]">{submittedId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Destination Email:</span>
                <span className="font-bold text-gray-900">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Billing Preference:</span>
                <span className="font-bold text-[#58BB87]">{preferredBilling}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a776] text-white text-xs font-bold transition shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {/* Fleet Composition Steppers */}
            <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#F96176]" />
                  Your Fleet Requirements
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-[#F96176] border border-rose-200">
                  Total: {totalUnits} Commercial Units
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Trucks */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2">
                    Power Units (Trucks)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTrucks((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-base flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={trucks}
                      onChange={(e) => setTrucks(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 text-center py-1.5 rounded-lg border border-gray-300 text-sm font-black text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTrucks((prev) => prev + 1)}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-base flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trailers */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2">
                    Trailed Units (Trailers)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTrailers((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-base flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={trailers}
                      onChange={(e) => setTrailers(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 text-center py-1.5 rounded-lg border border-gray-300 text-sm font-black text-gray-900 focus:ring-2 focus:ring-[#58BB87] focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTrailers((prev) => prev + 1)}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-base flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Company / Carrier Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                  <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Transport LLC"
                    className="w-full text-xs font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                  <Phone className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                  <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full text-xs font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Operating Country
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                  <Globe className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                  >
                    <option value="USA">🇺🇸 United States (USD)</option>
                    <option value="Canada">🇨🇦 Canada (CAD)</option>
                    <option value="Mexico">🇲🇽 Mexico (MXN)</option>
                    <option value="UK">🇬🇧 United Kingdom (GBP)</option>
                    <option value="Australia">🇦🇺 Australia (AUD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preferred Billing Interval */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Preferred Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredBilling("Monthly")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    preferredBilling === "Monthly"
                      ? "border-[#F96176] bg-rose-50/60 text-[#F96176] ring-1 ring-[#F96176]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Monthly Invoicing</span>
                  </div>
                  {preferredBilling === "Monthly" && <span className="text-[10px]">●</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredBilling("Yearly")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    preferredBilling === "Yearly"
                      ? "border-[#58BB87] bg-emerald-50/60 text-[#58BB87] ring-1 ring-[#58BB87]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Yearly Contract (Discounted)</span>
                  </div>
                  {preferredBilling === "Yearly" && <span className="text-[10px]">●</span>}
                </button>
              </div>
            </div>

            {/* Special Notes / Fleet Requirements */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Special Operations / Dispatch Notes (Optional)
              </label>
              <div className="rounded-xl border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about your terminals, regional routes, driver assignment needs, or specific modules required..."
                  className="w-full text-xs text-gray-800 bg-transparent border-0 outline-none focus:ring-0 resize-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                🔒 Enterprise confidentiality guaranteed. No automated billing.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-md shadow-[#F96176]/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Custom Quote Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
