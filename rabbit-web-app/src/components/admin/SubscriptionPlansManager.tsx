"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Truck,
  Wrench,
  DollarSign,
  Tag,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  SlidersHorizontal,
  ExternalLink,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  SubscriptionPlan,
  SubscriptionPlanType,
  SUPPORTED_PLAN_COUNTRIES,
  getCurrencySymbol,
} from "@/types/subscription";
import SubscriptionPlanModal from "./SubscriptionPlanModal";

interface Props {
  forcedType?: SubscriptionPlanType;
  title: string;
  subtitle: string;
}

export default function SubscriptionPlansManager({
  forcedType,
  title,
  subtitle,
}: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>(
    forcedType || "all"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("ALL");
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    try {
      setRefreshing(true);
      const colRef = collection(db, "subscriptionPlans");
      let q = query(colRef);

      if (forcedType) {
        q = query(colRef, where("type", "==", forcedType));
      }

      const snapshot = await getDocs(q);
      const list: SubscriptionPlan[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SubscriptionPlan, "id">),
        });
      });

      // Sort by sortOrder ascending, then price ascending
      list.sort((a, b) => {
        const orderA = a.sortOrder ?? 0;
        const orderB = b.sortOrder ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.price || 0) - (b.price || 0);
      });

      setPlans(list);
    } catch (err: any) {
      console.error("Error fetching subscription plans:", err);
      toast.error("Failed to load subscription plans: " + (err?.message || ""));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [forcedType]);

  // Toggle active status
  const handleToggleActive = async (plan: SubscriptionPlan) => {
    if (!plan.id) return;
    try {
      const nextStatus = !plan.isActive;
      await updateDoc(doc(db, "subscriptionPlans", plan.id), {
        isActive: nextStatus,
        updatedAt: new Date(),
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextStatus } : p))
      );
      toast.success(
        `Plan "${plan.name}" is now ${nextStatus ? "Active" : "Inactive"}`
      );
    } catch (err: any) {
      console.error("Error toggling plan status:", err);
      toast.error("Failed to update status");
    }
  };

  // Delete plan
  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!plan.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "subscriptionPlans", plan.id));
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success(`Plan "${plan.name}" deleted successfully.`);
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      toast.error("Failed to delete plan");
    }
  };

  // Open Edit
  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  // Open Create
  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  // Toggle Terms accordion
  const toggleTerms = (planId: string) => {
    setExpandedTerms((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  // Filtered List
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Type Filter (only relevant if not forcedType)
      if (!forcedType && selectedTypeFilter !== "all") {
        if (plan.type !== selectedTypeFilter) return false;
      }
      // Country / Currency filter
      if (selectedCountryFilter !== "ALL") {
        if (plan.countryPrices && Object.keys(plan.countryPrices).length > 0) {
          if (!plan.countryPrices[selectedCountryFilter]?.enabled) return false;
        } else if (selectedCountryFilter !== "USA") {
          // Legacy plans without countryPrices only have USD (USA)
          return false;
        }
      }

      // Status filter
      if (statusFilter === "active" && !plan.isActive) return false;
      if (statusFilter === "inactive" && plan.isActive) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = plan.name?.toLowerCase().includes(q);
        const matchesDesc = plan.description?.toLowerCase().includes(q);
        const matchesDuration = plan.duration?.toLowerCase().includes(q);
        const matchesFeatures = plan.features?.some((f) =>
          f.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDesc && !matchesDuration && !matchesFeatures) {
          return false;
        }
      }
      return true;
    });
  }, [plans, forcedType, selectedTypeFilter, selectedCountryFilter, statusFilter, searchQuery]);

  // Statistics
  const totalCount = plans.length;
  const activeCount = plans.filter((p) => p.isActive).length;
  const trenoopsCount = plans.filter((p) => p.type === "trenoops").length;
  const mechanicCount = plans.filter((p) => p.type === "treno_mechanic").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                forcedType === "trenoops"
                  ? "bg-[#F96176] shadow-[#F96176]/25"
                  : forcedType === "treno_mechanic"
                  ? "bg-[#58BB87] shadow-[#58BB87]/25"
                  : "bg-gray-900 shadow-gray-900/25"
              }`}
            >
              {forcedType === "trenoops" ? (
                <Truck className="w-5 h-5" />
              ) : forcedType === "treno_mechanic" ? (
                <Wrench className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleCreateNew}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center gap-2 ${
              forcedType === "treno_mechanic"
                ? "bg-[#58BB87] hover:bg-[#48a875] shadow-[#58BB87]/25"
                : "bg-[#F96176] hover:bg-[#e04f63] shadow-[#F96176]/25"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {forcedType === "treno_mechanic"
                ? "Create Mechanic Plan"
                : forcedType === "trenoops"
                ? "Create Owner/Driver Plan"
                : "Create New Plan"}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Plans
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            in Firestore &quot;subscriptionPlans&quot;
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Active Packages
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            Live and available for checkout
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#F96176]">
            Owners / Drivers
          </p>
          <p className="text-2xl font-black text-[#F96176] mt-1">{trenoopsCount}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            type: <code className="font-semibold text-rose-500">trenoops</code>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#58BB87]">
            Mechanic Shops
          </p>
          <p className="text-2xl font-black text-[#58BB87] mt-1">{mechanicCount}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            type: <code className="font-semibold text-emerald-600">treno_mechanic</code>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans, features, interval..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {!forcedType && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedTypeFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setSelectedTypeFilter("trenoops")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedTypeFilter === "trenoops"
                    ? "bg-[#F96176] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Truck className="w-3 h-3" />
                Owners / Drivers
              </button>
              <button
                onClick={() => setSelectedTypeFilter("treno_mechanic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedTypeFilter === "treno_mechanic"
                    ? "bg-[#58BB87] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Wrench className="w-3 h-3" />
                Mechanics
              </button>
            </div>
          )}

          {/* Country / Currency Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none border-none cursor-pointer py-1"
            >
              <option value="ALL">🌐 Currency: Base / All</option>
              {SUPPORTED_PLAN_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.currency} - {c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none border-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-600">Loading subscription plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Subscription Plans Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {searchQuery || statusFilter !== "all"
                ? "No plans match your current search and filter criteria. Try adjusting the filters."
                : "No subscription plans have been created yet. Click below to add your first plan!"}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-[#F96176] text-white font-bold text-xs shadow-md hover:bg-[#e04f63] transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const isOwner = plan.type === "trenoops";

            // Resolve display price & currency based on selected country or fallback
            const matchedCountryPrice =
              selectedCountryFilter !== "ALL" && plan.countryPrices?.[selectedCountryFilter]?.enabled
                ? plan.countryPrices[selectedCountryFilter]
                : plan.countryPrices?.["USA"]?.enabled
                ? plan.countryPrices["USA"]
                : plan.countryPrices
                ? Object.values(plan.countryPrices).find((c) => c.enabled)
                : undefined;

            const displayPrice = matchedCountryPrice ? matchedCountryPrice.price : plan.price;
            const displayDiscountPrice = matchedCountryPrice
              ? matchedCountryPrice.discountPrice
              : plan.discountPrice;
            const displaySymbol = matchedCountryPrice
              ? matchedCountryPrice.symbol
              : getCurrencySymbol(plan.currency);
            const displayCurrency = matchedCountryPrice
              ? matchedCountryPrice.currency
              : plan.currency || "USD";

            const hasDiscount =
              displayDiscountPrice !== undefined &&
              displayDiscountPrice !== null &&
              displayDiscountPrice < displayPrice;
            const savingsPercent = hasDiscount
              ? Math.round(((displayPrice - (displayDiscountPrice || 0)) / displayPrice) * 100)
              : 0;

            const termsOpen = expandedTerms[plan.id || ""] || false;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 shadow-xs transition-all flex flex-col overflow-hidden relative ${
                  plan.isActive
                    ? isOwner
                      ? "border-rose-100 hover:border-rose-300 hover:shadow-md"
                      : "border-emerald-100 hover:border-emerald-300 hover:shadow-md"
                    : "border-gray-200 opacity-80"
                }`}
              >
                {/* Popular Ribbon / Banner */}
                {plan.isPopular && (
                  <div
                    className={`py-1 text-center text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                      isOwner ? "bg-gradient-to-r from-rose-500 to-[#F96176]" : "bg-gradient-to-r from-emerald-600 to-[#58BB87]"
                    }`}
                  >
                    ★ Most Popular Choice ★
                  </div>
                )}

                {/* Card Header */}
                <div className="p-5 border-b border-gray-100 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isOwner
                            ? "bg-rose-50 text-[#F96176] border border-rose-200"
                            : "bg-emerald-50 text-[#58BB87] border border-emerald-200"
                        }`}
                      >
                        {isOwner ? (
                          <>
                            <Truck className="w-3 h-3" /> Owners & Drivers
                          </>
                        ) : (
                          <>
                            <Wrench className="w-3 h-3" /> Mechanics & Shops
                          </>
                        )}
                      </span>
                      <h3 className="text-lg font-black text-gray-900 mt-2">
                        {plan.name}
                      </h3>
                    </div>

                    {/* Status Pill Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                        plan.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                      }`}
                      title="Click to toggle active/inactive"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          plan.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {plan.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {plan.description}
                    </p>
                  )}

                  {/* Pricing Box */}
                  <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-200/70 mb-4">
                    <div className="flex items-baseline gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-2xl font-black text-gray-900">
                            {displaySymbol}{displayDiscountPrice?.toFixed(2)}
                          </span>
                          <span className="text-sm font-semibold text-gray-400 line-through">
                            {displaySymbol}{displayPrice.toFixed(2)}
                          </span>
                          <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Save {savingsPercent}%
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-gray-900">
                          {displaySymbol}{displayPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-500">
                        / {plan.duration}
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gray-200/80 text-gray-700 rounded ml-1">
                        {displayCurrency}
                      </span>
                    </div>

                    {/* Multi-Currency Badges */}
                    {plan.countryPrices && Object.keys(plan.countryPrices).length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-gray-400">Currencies:</span>
                        {SUPPORTED_PLAN_COUNTRIES.map((c) => {
                          const cp = plan.countryPrices?.[c.code];
                          if (!cp || !cp.enabled) return null;
                          const isSelected = selectedCountryFilter === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => setSelectedCountryFilter(c.code)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? "bg-[#F96176] text-white shadow-2xs"
                                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-400"
                              }`}
                              title={`${c.name} (${c.currency}): ${cp.symbol}${cp.discountPrice || cp.price}`}
                            >
                              <span>{c.flag}</span>
                              <span>{cp.symbol}{cp.discountPrice || cp.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Scope Badges */}
                  {isOwner ? (
                    <div className="space-y-1.5 text-xs text-gray-700 bg-rose-50/40 p-3 rounded-xl border border-rose-100/80 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600">Max Vehicles:</span>
                        <span className="font-extrabold text-gray-900">
                          {plan.maxVehicles === -1 || plan.maxVehicles === undefined
                            ? "Unlimited"
                            : `${plan.maxVehicles} Vehicles`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600">Scope:</span>
                        <span className="font-bold text-[#F96176] uppercase text-[11px]">
                          {plan.vehicleTypeScope || "Both (Truck & Trailer)"}
                        </span>
                      </div>
                      {(plan.truckLimit !== undefined || plan.trailerLimit !== undefined) && (
                        <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-rose-100/80 pt-1.5">
                          <span>
                            Trucks:{" "}
                            <b>{plan.truckLimit === -1 ? "Unlimited" : plan.truckLimit}</b>
                          </span>
                          <span>
                            Trailers:{" "}
                            <b>
                              {plan.trailerLimit === -1 ? "Unlimited" : plan.trailerLimit}
                            </b>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs text-gray-700 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600">Service Bays:</span>
                        <span className="font-extrabold text-gray-900">
                          {plan.maxBays === -1 || plan.maxBays === undefined
                            ? "Unlimited"
                            : `${plan.maxBays} Bays`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600">Radius:</span>
                        <span className="font-bold text-[#58BB87]">
                          {plan.serviceRadiusMiles === -1 ||
                          plan.serviceRadiusMiles === undefined
                            ? "Nationwide"
                            : `${plan.serviceRadiusMiles} Miles`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-600 border-t border-emerald-100/80 pt-1.5">
                        <span
                          className={`font-semibold ${
                            plan.priorityJobLeads ? "text-emerald-700" : "text-gray-400"
                          }`}
                        >
                          ✓ Priority Leads
                        </span>
                        <span
                          className={`font-semibold ${
                            plan.directCarrierInvoicing
                              ? "text-emerald-700"
                              : "text-gray-400"
                          }`}
                        >
                          ✓ Carrier Invoicing
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Features List */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Included Features
                      </p>
                      <ul className="space-y-1.5">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-700 flex items-start gap-2"
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                isOwner ? "text-[#F96176]" : "text-[#58BB87]"
                              }`}
                            />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-[11px] font-semibold text-gray-400 pl-5">
                            + {plan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Terms & Conditions Collapsible */}
                  {plan.termsAndConditions && plan.termsAndConditions.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleTerms(plan.id || "")}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-gray-800 transition py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                          Terms & Conditions ({plan.termsAndConditions.length})
                        </span>
                        {termsOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {termsOpen && (
                        <ul className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 text-[11px] text-gray-600">
                          {plan.termsAndConditions.map((t, idx) => (
                            <li key={idx} className="list-disc">
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-gray-400 font-medium truncate">
                    Sort: {plan.sortOrder ?? 0}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan)}
                      className="p-1.5 rounded-lg border border-red-200 bg-rose-50/40 text-red-600 hover:bg-red-100 transition shadow-2xs"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Plan Modal */}
      <SubscriptionPlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        onSaved={fetchPlans}
        initialData={editingPlan}
        defaultType={forcedType || "trenoops"}
        lockType={!!forcedType}
      />
    </div>
  );
}
