"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  DollarSign,
  Tag,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Globe,
} from "lucide-react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  SubscriptionPlan,
  SubscriptionPlanType,
  SUPPORTED_PLAN_COUNTRIES,
  CountryPriceConfig,
} from "@/types/subscription";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SubscriptionPlan | null;
  defaultType?: SubscriptionPlanType;
  lockType?: boolean;
}

const DURATION_PRESETS = [
  "Monthly",
  "Quarterly",
  "Semi-Annually",
  "Yearly",
  "Weekly",
  "Lifetime",
];

export default function SubscriptionPlanModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  defaultType = "trenoops",
  lockType = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [type, setType] = useState<SubscriptionPlanType>(defaultType);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("Monthly");
  const [customDuration, setCustomDuration] = useState("");
  const [price, setPrice] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("0");

  // Multi-Currency / Country-wise Pricing State
  const buildDefaultCountryPrices = (): Record<
    string,
    { enabled: boolean; price: string; discountPrice: string }
  > => {
    const res: Record<string, { enabled: boolean; price: string; discountPrice: string }> = {};
    SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
      res[c.code] = { enabled: c.code === "USA", price: "", discountPrice: "" };
    });
    return res;
  };

  const [activeCountryTab, setActiveCountryTab] = useState<string>("USA");
  const [countryPrices, setCountryPrices] = useState<
    Record<
      string,
      {
        enabled: boolean;
        price: string;
        discountPrice: string;
      }
    >
  >(buildDefaultCountryPrices);

  // Owner / Driver specific
  const [maxVehicles, setMaxVehicles] = useState<string>("5");
  const [vehicleTypeScope, setVehicleTypeScope] = useState<"both" | "truck_only" | "trailer_only" | "all">("both");
  const [truckLimit, setTruckLimit] = useState<string>("5");
  const [trailerLimit, setTrailerLimit] = useState<string>("5");
  const [isUnlimitedVehicles, setIsUnlimitedVehicles] = useState(false);

  // Mechanic specific
  const [maxBays, setMaxBays] = useState<string>("2");
  const [isUnlimitedBays, setIsUnlimitedBays] = useState(false);
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState<string>("50");
  const [isUnlimitedRadius, setIsUnlimitedRadius] = useState(false);
  const [priorityJobLeads, setPriorityJobLeads] = useState(true);
  const [directCarrierInvoicing, setDirectCarrierInvoicing] = useState(true);

  // Features list
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Terms and Conditions list
  const [termsAndConditions, setTermsAndConditions] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");

  useEffect(() => {
    const activeType = lockType ? defaultType : (initialData?.type || defaultType);
    setType(activeType);

    if (initialData) {
      setName(initialData.name || "");
      if (DURATION_PRESETS.includes(initialData.duration)) {
        setDuration(initialData.duration);
        setCustomDuration("");
      } else {
        setDuration("Custom");
        setCustomDuration(initialData.duration || "");
      }
      setPrice(initialData.price !== undefined ? String(initialData.price) : "");
      setDiscountPrice(
        initialData.discountPrice !== undefined && initialData.discountPrice !== null
          ? String(initialData.discountPrice)
          : ""
      );
      setCurrency(initialData.currency || "USD");
      setDescription(initialData.description || "");
      setIsActive(initialData.isActive ?? true);
      setIsPopular(initialData.isPopular ?? false);
      setSortOrder(initialData.sortOrder !== undefined ? String(initialData.sortOrder) : "0");

      // Owner fields
      setIsUnlimitedVehicles(initialData.maxVehicles === -1);
      setMaxVehicles(initialData.maxVehicles === -1 ? "" : String(initialData.maxVehicles ?? 5));
      setVehicleTypeScope(initialData.vehicleTypeScope || "both");
      setTruckLimit(initialData.truckLimit === -1 ? "" : String(initialData.truckLimit ?? 5));
      setTrailerLimit(initialData.trailerLimit === -1 ? "" : String(initialData.trailerLimit ?? 5));

      // Mechanic fields
      setIsUnlimitedBays(initialData.maxBays === -1);
      setMaxBays(initialData.maxBays === -1 ? "" : String(initialData.maxBays ?? 2));
      setIsUnlimitedRadius(initialData.serviceRadiusMiles === -1);
      setServiceRadiusMiles(
        initialData.serviceRadiusMiles === -1 ? "" : String(initialData.serviceRadiusMiles ?? 50)
      );
      setPriorityJobLeads(initialData.priorityJobLeads ?? true);
      setDirectCarrierInvoicing(initialData.directCarrierInvoicing ?? true);

      setFeatures(initialData.features || []);
      setTermsAndConditions(initialData.termsAndConditions || []);

      // Country Prices initialization
      const initialCP: Record<
        string,
        { enabled: boolean; price: string; discountPrice: string }
      > = {};

      SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
        const existing = initialData.countryPrices?.[c.code];
        if (existing) {
          initialCP[c.code] = {
            enabled: existing.enabled !== false,
            price: existing.price !== undefined ? String(existing.price) : "",
            discountPrice:
              existing.discountPrice !== undefined &&
              existing.discountPrice !== null
                ? String(existing.discountPrice)
                : "",
          };
        } else if (
          c.code === "USA" ||
          (initialData.currency && c.currency === initialData.currency)
        ) {
          // Backward compatibility for plans saved with only base price
          initialCP[c.code] = {
            enabled: true,
            price:
              initialData.price !== undefined ? String(initialData.price) : "",
            discountPrice:
              initialData.discountPrice !== undefined &&
              initialData.discountPrice !== null
                ? String(initialData.discountPrice)
                : "",
          };
        } else {
          initialCP[c.code] = { enabled: false, price: "", discountPrice: "" };
        }
      });
      setCountryPrices(initialCP);
      const firstEnabled =
        Object.keys(initialCP).find((k) => initialCP[k].enabled) || "USA";
      setActiveCountryTab(firstEnabled);
    } else {
      // Default reset
      setName("");
      setDuration("Monthly");
      setCustomDuration("");
      setPrice("");
      setDiscountPrice("");
      setCurrency("USD");
      setDescription("");
      setIsActive(true);
      setIsPopular(false);
      setSortOrder("0");

      setCountryPrices(buildDefaultCountryPrices());
      setActiveCountryTab("USA");

      if (activeType === "trenoops") {
        setIsUnlimitedVehicles(false);
        setMaxVehicles("5");
        setVehicleTypeScope("both");
        setTruckLimit("5");
        setTrailerLimit("5");
        setFeatures([
          "Full Fleet Health & Diagnostic Management",
          "Automated PM Service Reminders",
          "Direct Mechanic Dispatch Network",
          "Digital Maintenance Work Orders",
        ]);
        setTermsAndConditions([
          "Subscription renews automatically at selected duration interval.",
          "Cancellation must be submitted 24 hours prior to billing cycle.",
          "Fleet limits apply strictly to active registered units.",
        ]);
      } else {
        setIsUnlimitedBays(false);
        setMaxBays("3");
        setIsUnlimitedRadius(false);
        setServiceRadiusMiles("50");
        setPriorityJobLeads(true);
        setDirectCarrierInvoicing(true);
        setFeatures([
          "Priority Roadside Emergency Job Broadcasts",
          "Direct Fleet & Carrier Billing Invoicing",
          "Workshop Bay & Tech Scheduling Portal",
          "Parts & Labor Digital Estimates",
        ]);
        setTermsAndConditions([
          "Mechanic shop must maintain valid liability insurance.",
          "All jobs completed via platform follow standard warranty policy.",
          "Subscription fee is non-refundable after activation.",
        ]);
      }
    }
  }, [initialData, defaultType, lockType, isOpen]);

  if (!isOpen) return null;

  // Add Feature
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures([...features, newFeature.trim()]);
    setNewFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Add Term
  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setTermsAndConditions([...termsAndConditions, newTerm.trim()]);
    setNewTerm("");
  };

  const handleRemoveTerm = (idx: number) => {
    setTermsAndConditions(termsAndConditions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a plan name");
      return;
    }

    // Validate Country-Wise Prices
    const configuredCountries: Record<string, CountryPriceConfig> = {};
    let hasAtLeastOneValidPrice = false;

    for (const c of SUPPORTED_PLAN_COUNTRIES) {
      const entry = countryPrices[c.code];
      if (entry && entry.enabled) {
        if (!entry.price || entry.price.trim() === "") {
          toast.error(
            `Please enter a price for enabled country: ${c.name} (${c.code})`
          );
          setActiveCountryTab(c.code);
          return;
        }
        const p = parseFloat(entry.price);
        if (isNaN(p) || p < 0) {
          toast.error(`Please enter a valid price for ${c.name} (${c.code})`);
          setActiveCountryTab(c.code);
          return;
        }

        const d =
          entry.discountPrice.trim() !== ""
            ? parseFloat(entry.discountPrice)
            : null;
        if (d !== null && (isNaN(d) || d < 0)) {
          toast.error(
            `Please enter a valid discounted price for ${c.name} (${c.code})`
          );
          setActiveCountryTab(c.code);
          return;
        }
        if (d !== null && d > p) {
          toast.error(
            `Discounted price cannot exceed regular price for ${c.name} (${c.code})`
          );
          setActiveCountryTab(c.code);
          return;
        }

        configuredCountries[c.code] = {
          countryCode: c.code,
          currency: c.currency,
          symbol: c.symbol,
          price: p,
          discountPrice: d,
          enabled: true,
        };
        hasAtLeastOneValidPrice = true;
      }
    }

    if (!hasAtLeastOneValidPrice) {
      toast.error(
        "Please enable and enter pricing for at least one country (e.g. USA)."
      );
      return;
    }

    const baseEntry =
      configuredCountries["USA"] || Object.values(configuredCountries)[0];

    const finalDuration =
      duration === "Custom" ? customDuration.trim() || "Monthly" : duration;

    setLoading(true);
    try {
      const payload: Partial<SubscriptionPlan> = {
        name: name.trim(),
        type,
        duration: finalDuration,
        price: baseEntry.price,
        discountPrice: baseEntry.discountPrice ?? null,
        currency: baseEntry.currency,
        countryPrices: configuredCountries,
        description: description.trim(),
        isActive,
        isPopular,
        sortOrder: parseInt(sortOrder, 10) || 0,
        features,
        termsAndConditions,
        updatedAt: serverTimestamp(),
      };

      if (type === "trenoops") {
        payload.maxVehicles = isUnlimitedVehicles
          ? -1
          : parseInt(maxVehicles, 10) || 1;
        payload.vehicleTypeScope = vehicleTypeScope;
        payload.truckLimit = isUnlimitedVehicles
          ? -1
          : parseInt(truckLimit, 10) || 0;
        payload.trailerLimit = isUnlimitedVehicles
          ? -1
          : parseInt(trailerLimit, 10) || 0;
      } else {
        payload.maxBays = isUnlimitedBays ? -1 : parseInt(maxBays, 10) || 1;
        payload.serviceRadiusMiles = isUnlimitedRadius
          ? -1
          : parseInt(serviceRadiusMiles, 10) || 25;
        payload.priorityJobLeads = priorityJobLeads;
        payload.directCarrierInvoicing = directCarrierInvoicing;
      }

      if (initialData?.id) {
        // Update existing plan
        const planRef = doc(db, "subscriptionPlans", initialData.id);
        await updateDoc(planRef, payload);
        toast.success(`Plan "${name}" updated successfully!`);
      } else {
        // Create new plan
        await addDoc(collection(db, "subscriptionPlans"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success(`Plan "${name}" created successfully!`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error saving subscription plan:", err);
      toast.error(err?.message || "Failed to save subscription plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                type === "trenoops"
                  ? "bg-[#F96176] shadow-[#F96176]/25"
                  : "bg-[#58BB87] shadow-[#58BB87]/25"
              }`}
            >
              {type === "trenoops" ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Wrench className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {initialData ? "Edit Subscription Plan" : "Create Subscription Plan"}
              </h2>
              <p className="text-xs text-gray-500">
                {type === "trenoops"
                  ? "Configuring plan for Owners, Drivers & Fleets (TrenoOps)"
                  : "Configuring plan for Mechanics & Repair Shops (Treno Mechanic)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Plan Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Plan Audience & Type <span className="text-red-500">*</span>
            </label>
            {lockType ? (
              type === "treno_mechanic" ? (
                <div className="p-3.5 rounded-xl border-2 border-[#58BB87] bg-emerald-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#58BB87] text-white shadow-xs">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">For Mechanics & Repair Shops</span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Mechanics Only
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Target Audience: Service stations & mobile techs (type: <code className="text-[#58BB87] font-semibold">treno_mechanic</code>)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border-2 border-[#F96176] bg-rose-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F96176] text-white shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">For Owners / Drivers & Fleets</span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Owners/Drivers Only
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Target Audience: Motor carriers, owner-operators & fleet drivers (type: <code className="text-[#F96176] font-semibold">trenoops</code>)
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("trenoops")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition text-left ${
                    type === "trenoops"
                      ? "border-[#F96176] bg-rose-50/60 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      type === "trenoops"
                        ? "bg-[#F96176] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">For Owners / Drivers</div>
                    <div className="text-[11px] text-gray-500">
                      type: <code className="text-[#F96176] font-semibold">trenoops</code> (Trucks & Trailers)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType("treno_mechanic")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition text-left ${
                    type === "treno_mechanic"
                      ? "border-[#58BB87] bg-emerald-50/60 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      type === "treno_mechanic"
                        ? "bg-[#58BB87] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">For Mechanics</div>
                    <div className="text-[11px] text-gray-500">
                      type: <code className="text-[#58BB87] font-semibold">treno_mechanic</code> (Shops & Techs)
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-500" /> Basic Plan Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === "trenoops"
                      ? "e.g., Starter Fleet, Owner-Operator Pro, Enterprise"
                      : "e.g., Mobile Tech, Workshop Pro, Master Station"
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm font-medium"
                />
              </div>

              {/* Tagline / Short Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Ideal for independent carriers managing up to 5 commercial vehicles"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm font-medium"
                >
                  {DURATION_PRESETS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Custom">Custom Interval</option>
                </select>
                {duration === "Custom" && (
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. 6 Months or Bi-Weekly"
                    className="w-full mt-2 px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
                  />
                )}
              </div>

              {/* Multi-Currency Country-Wise Pricing Section */}
              <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-100 text-[#F96176]">
                        <Globe className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">
                        Country-Wise Currency Pricing
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure custom rates and discounts per country ({SUPPORTED_PLAN_COUNTRIES.map((c) => c.code).join(", ")})
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_PLAN_COUNTRIES.map((c) => {
                      const cp = countryPrices[c.code];
                      const isSet = cp?.enabled && cp?.price;
                      return (
                        <span
                          key={c.code}
                          onClick={() => setActiveCountryTab(c.code)}
                          className={`cursor-pointer px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            activeCountryTab === c.code
                              ? "bg-[#F96176] text-white shadow-xs"
                              : isSet
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200/70 text-gray-400 hover:bg-gray-200"
                          }`}
                          title={`Click to edit ${c.name} (${c.currency}) pricing`}
                        >
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                          {isSet && (
                            <span className="text-[10px] opacity-90">
                              {c.symbol}{cp.discountPrice || cp.price}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Country Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUPPORTED_PLAN_COUNTRIES.map((c) => {
                    const cp = countryPrices[c.code];
                    const isSelected = activeCountryTab === c.code;
                    const isConfigured = cp?.enabled && cp?.price;

                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setActiveCountryTab(c.code)}
                        className={`p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                          isSelected
                            ? "border-[#F96176] bg-white shadow-sm ring-2 ring-[#F96176]/15"
                            : isConfigured
                            ? "border-emerald-200 bg-white hover:border-emerald-300"
                            : "border-gray-200 bg-gray-100/60 hover:bg-white hover:border-gray-300 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-lg">{c.flag}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConfigured
                                ? "bg-emerald-500"
                                : cp?.enabled
                                ? "bg-amber-400"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-xs font-bold text-gray-900 leading-tight">
                            {c.code} <span className="text-[10px] text-gray-500 font-normal">({c.currency})</span>
                          </div>
                          <div className="text-[11px] font-semibold text-gray-700 mt-0.5 truncate">
                            {isConfigured ? `${c.symbol}${cp.discountPrice || cp.price}` : "Not set"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Country Config Card */}
                {(() => {
                  const activeCountry =
                    SUPPORTED_PLAN_COUNTRIES.find((c) => c.code === activeCountryTab) ||
                    SUPPORTED_PLAN_COUNTRIES[0];
                  const cData = countryPrices[activeCountry.code] || {
                    enabled: false,
                    price: "",
                    discountPrice: "",
                  };

                  return (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{activeCountry.flag}</span>
                          <div>
                            <span className="text-sm font-bold text-gray-900">
                              {activeCountry.name} ({activeCountry.code})
                            </span>
                            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              Currency: {activeCountry.currency} ({activeCountry.symbol})
                            </span>
                          </div>
                        </div>

                        {/* Enable for Country Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={cData.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCountryPrices((prev) => ({
                                ...prev,
                                [activeCountry.code]: {
                                  ...prev[activeCountry.code],
                                  enabled: checked,
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176] border-gray-300"
                          />
                          <span className="text-xs font-bold text-gray-700">
                            Enable Pricing
                          </span>
                        </label>
                      </div>

                      {cData.enabled ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Regular Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Regular Price ({activeCountry.currency}) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent bg-white px-3.5 py-2.5 transition">
                              <span className="text-gray-500 font-bold text-sm select-none mr-2 shrink-0">
                                {activeCountry.symbol}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cData.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCountryPrices((prev) => ({
                                    ...prev,
                                    [activeCountry.code]: {
                                      ...prev[activeCountry.code],
                                      price: val,
                                    },
                                  }));
                                }}
                                placeholder={
                                  activeCountry.defaultPrice
                                    ? String(activeCountry.defaultPrice)
                                    : "49.99"
                                }
                                required
                                className="w-full p-0 border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold bg-transparent text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Discounted Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Discounted / Promo Price ({activeCountry.currency})
                            </label>
                            <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent bg-white px-3.5 py-2.5 transition">
                              <span className="text-gray-500 font-bold text-sm select-none mr-2 shrink-0">
                                {activeCountry.symbol}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cData.discountPrice}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCountryPrices((prev) => ({
                                    ...prev,
                                    [activeCountry.code]: {
                                      ...prev[activeCountry.code],
                                      discountPrice: val,
                                    },
                                  }));
                                }}
                                placeholder="Optional promo price"
                                className="w-full p-0 border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold bg-transparent text-emerald-600"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Pricing for <strong>{activeCountry.name}</strong> is currently disabled. Check the box above to enable and set custom rates in {activeCountry.currency}.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176]"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Active Plan (Visible to Users)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Badge as &quot;Most Popular / Recommended&quot;
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Conditional Scope: Owners / Drivers Specific Settings */}
          {type === "trenoops" && (
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F96176] flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Owner & Driver Fleet Limits
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={isUnlimitedVehicles}
                    onChange={(e) => setIsUnlimitedVehicles(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176]"
                  />
                  Unlimited Vehicles
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Max Vehicles Total */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Total Vehicles
                  </label>
                  <input
                    type="number"
                    disabled={isUnlimitedVehicles}
                    value={isUnlimitedVehicles ? "" : maxVehicles}
                    onChange={(e) => setMaxVehicles(e.target.value)}
                    placeholder={isUnlimitedVehicles ? "Unlimited" : "e.g. 10"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>

                {/* Truck Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Truck Limit
                  </label>
                  <input
                    type="number"
                    disabled={isUnlimitedVehicles}
                    value={isUnlimitedVehicles ? "" : truckLimit}
                    onChange={(e) => setTruckLimit(e.target.value)}
                    placeholder={isUnlimitedVehicles ? "Unlimited" : "e.g. 5"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>

                {/* Trailer Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trailer Limit
                  </label>
                  <input
                    type="number"
                    disabled={isUnlimitedVehicles}
                    value={isUnlimitedVehicles ? "" : trailerLimit}
                    onChange={(e) => setTrailerLimit(e.target.value)}
                    placeholder={isUnlimitedVehicles ? "Unlimited" : "e.g. 5"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Vehicle Scope Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Vehicle Type Scope
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "both", label: "Truck & Trailer" },
                    { id: "truck_only", label: "Truck Only" },
                    { id: "trailer_only", label: "Trailer Only" },
                    { id: "all", label: "All Fleet Units" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setVehicleTypeScope(s.id as any)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition text-center border ${
                        vehicleTypeScope === s.id
                          ? "bg-[#F96176] text-white border-[#F96176] shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conditional Scope: Mechanics Specific Settings */}
          {type === "treno_mechanic" && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#58BB87] flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Mechanic & Workshop Scope
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Max Bays */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Service Bays / Workstations
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={isUnlimitedBays}
                        onChange={(e) => setIsUnlimitedBays(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#58BB87] focus:ring-[#58BB87]"
                      />
                      Unlimited
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedBays}
                    value={isUnlimitedBays ? "" : maxBays}
                    onChange={(e) => setMaxBays(e.target.value)}
                    placeholder={isUnlimitedBays ? "Unlimited Bays" : "e.g. 3"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>

                {/* Service Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Service Radius (Miles)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={isUnlimitedRadius}
                        onChange={(e) => setIsUnlimitedRadius(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#58BB87] focus:ring-[#58BB87]"
                      />
                      Nationwide / Unlimited
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedRadius}
                    value={isUnlimitedRadius ? "" : serviceRadiusMiles}
                    onChange={(e) => setServiceRadiusMiles(e.target.value)}
                    placeholder={isUnlimitedRadius ? "Unlimited Miles" : "e.g. 50"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Additional Mechanic Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priorityJobLeads}
                    onChange={(e) => setPriorityJobLeads(e.target.checked)}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87]"
                  />
                  <div className="text-xs font-bold text-gray-800">
                    Priority Roadside Job Leads
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directCarrierInvoicing}
                    onChange={(e) => setDirectCarrierInvoicing(e.target.checked)}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87]"
                  />
                  <div className="text-xs font-bold text-gray-800">
                    Direct Carrier & Fleet Invoicing
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Plan Features / Highlights ({features.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Type a feature and press Add (e.g. Automated PM Schedule)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {features.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No features added yet.</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Terms & Conditions ({termsAndConditions.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                placeholder="Type a policy or term and press Add"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {termsAndConditions.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {termsAndConditions.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove term"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No terms added yet.</p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center gap-2 ${
                type === "trenoops"
                  ? "bg-[#F96176] hover:bg-[#e04f63] shadow-[#F96176]/25"
                  : "bg-[#58BB87] hover:bg-[#48a875] shadow-[#58BB87]/25"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                "Update Subscription Plan"
              ) : (
                "Create Subscription Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
