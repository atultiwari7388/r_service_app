"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Truck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Check,
  CreditCard,
  LogOut,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  SubscriptionPlan,
  PackageVehicleSlab,
  GlobalVehiclePricingConfig,
  DEFAULT_GLOBAL_VEHICLE_PRICING,
} from "@/types/subscription";
import {
  fetchOwnerSubscriptionPlans,
  fetchGlobalVehiclePricing,
  calculatePackageSlabPrice,
  normalizeCountryCode,
} from "@/lib/services/subscriptionService";
import CustomFleetRequestModal from "./CustomFleetRequestModal";

export default function OwnerChoosePlanView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [globalPricing, setGlobalPricing] = useState<GlobalVehiclePricingConfig>(
    DEFAULT_GLOBAL_VEHICLE_PRICING
  );

  // Selected package slab & fleet composition
  const [selectedSlab, setSelectedSlab] = useState<PackageVehicleSlab | null>(null);
  const [trucksCount, setTrucksCount] = useState<number>(1);
  const [trailersCount, setTrailersCount] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Yearly">("Monthly");
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // 1. Listen to Auth & load profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        try {
          const userDocSnap = await getDoc(doc(db, "Users", fbUser.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserProfile(data);
          }
        } catch (profileErr) {
          console.error("Error loading user profile:", profileErr);
        }
      }
      loadData();
    });

    return () => unsub();
  }, []);

  // 2. Load Plans and Global Pricing
  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, pricingConfig] = await Promise.all([
        fetchOwnerSubscriptionPlans(),
        fetchGlobalVehiclePricing(),
      ]);
      setPlans(plansData);
      setGlobalPricing(pricingConfig);
    } catch (err: any) {
      console.error("Error loading subscription data:", err);
      toast.error("Failed to load subscription plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Extract all configured package slabs from plans
  const availableSlabs = useMemo<PackageVehicleSlab[]>(() => {
    const list: PackageVehicleSlab[] = [];
    const seen = new Set<string>();

    plans.forEach((p) => {
      (p.packageVehicleSlabs || []).forEach((slab) => {
        const key = `${slab.fromUnit}-${slab.toUnit}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(slab);
        }
      });
    });

    if (list.length === 0) {
      // Default fallback slabs if none configured in DB
      return [
        {
          id: "slab-1",
          fromUnit: 1,
          toUnit: 1,
          truckMonthlyRate: 0,
          trailerMonthlyRate: 0,
          truckYearlyRate: 0,
          trailerYearlyRate: 0,
        },
        {
          id: "slab-2",
          fromUnit: 2,
          toUnit: 2,
          truckMonthlyRate: 0,
          trailerMonthlyRate: 0,
          truckYearlyRate: 0,
          trailerYearlyRate: 0,
        },
        {
          id: "slab-3",
          fromUnit: 3,
          toUnit: 5,
          truckMonthlyRate: 0,
          trailerMonthlyRate: 0,
          truckYearlyRate: 0,
          trailerYearlyRate: 0,
        },
      ];
    }

    return list.sort((a, b) => a.fromUnit - b.fromUnit);
  }, [plans]);

  // 4. Auto-select first slab on load
  useEffect(() => {
    if (availableSlabs.length > 0 && !selectedSlab) {
      const first = availableSlabs[0];
      setSelectedSlab(first);
      const initialTrucks = Math.max(1, first.fromUnit);
      setTrucksCount(initialTrucks);
      setTrailersCount(0);
    }
  }, [availableSlabs, selectedSlab]);

  // Normalized Country Code ("USA", "CA", "MX", "UK", "AU")
  const userCountry = useMemo(() => {
    return normalizeCountryCode(userProfile?.country);
  }, [userProfile?.country]);

  // Total vehicles
  const totalVehicles = trucksCount + trailersCount;

  // Selected slab boundary checks
  const isSlabOverLimit = Boolean(selectedSlab && totalVehicles > selectedSlab.toUnit);
  const isSlabUnderLimit = Boolean(selectedSlab && totalVehicles < selectedSlab.fromUnit);
  const isOutOfSelectedSlab = isSlabOverLimit || isSlabUnderLimit;
  const isValidComposition = !isOutOfSelectedSlab && totalVehicles > 0;

  // Matching slab for current total vehicles (if out of current selected slab)
  const matchingSlabForCount = useMemo(() => {
    return availableSlabs.find(
      (s) => totalVehicles >= s.fromUnit && totalVehicles <= s.toUnit
    );
  }, [availableSlabs, totalVehicles]);

  // Handle slab selection
  const handleSelectSlab = (slab: PackageVehicleSlab) => {
    setSelectedSlab(slab);
    const total = trucksCount + trailersCount;
    // Auto-adjust vehicles count so it starts inside the new slab
    if (total < slab.fromUnit || total > slab.toUnit) {
      const newTrucks = Math.max(1, slab.fromUnit);
      setTrucksCount(newTrucks);
      setTrailersCount(0);
    }
  };

  // Handle Checkout
  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!currentUser) {
      toast.error("Please login to purchase a subscription.");
      router.push("/login?redirect=/choose-plan");
      return;
    }

    if (!isValidComposition) {
      if (isOutOfSelectedSlab && selectedSlab) {
        toast.error(
          `Your fleet count (${totalVehicles}) is outside the selected ${selectedSlab.fromUnit}-${selectedSlab.toUnit} package range.`
        );
      } else {
        toast.error("Please specify at least 1 truck or trailer.");
      }
      return;
    }

    try {
      setPurchasingPlanId(plan.id || "loading");

      // Calculate exact package pricing for the chosen slab
      const calc = calculatePackageSlabPrice({
        plan,
        trucks: trucksCount,
        trailers: trailersCount,
        billingCycle,
        countryCode: userCountry,
        selectedSlab,
        globalPricing,
      });

      const matchedRangeStr = selectedSlab
        ? `${selectedSlab.fromUnit} to ${selectedSlab.toUnit}`
        : `${totalVehicles} Vehicles`;

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUid: currentUser.uid,
          planId: plan.id,
          email: currentUser.email || userProfile?.email || "",
          planName: `${plan.name} (${selectedSlab ? `${selectedSlab.fromUnit}-${selectedSlab.toUnit} Units` : `${totalVehicles} Units`})`,
          duration: billingCycle,
          price: calc.subtotal,
          discountPrice: calc.discountPrice,
          currency: calc.currency || plan.currency || "USD",
          vehicleRange: matchedRangeStr,
          trucksCount,
          trailersCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to initialize payment session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err?.message || "Failed to start checkout. Please try again.");
      setPurchasingPlanId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 pb-20">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-gray-900">
                TRENO<span className="text-[#F96176]">OPS</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F96176]/10 text-[#F96176]">
              Fleet Membership
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-[200px]">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-[#F96176] hover:underline"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58BB87]/10 text-[#58BB87] text-xs font-semibold mb-3">
            <Sparkles size={14} />
            <span>Tailored To Your Exact Fleet Size</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Choose Your Fleet Membership Plan
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            Scale your operations with automated maintenance tracking, dispatch, driver management,
            and 24/7 roadside assistance coverage.
          </p>
        </div>

        {/* Step 1: Package Slabs & Fleet Composition Selector Card */}
        <section className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-10">
          <div className="pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#F96176]/10 text-[#F96176]">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Step 1: Select Your Package
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tap any package slab below to configure fleet units & pricing.
                  </p>
                </div>
              </div>

              {/* Animated Tooltip */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#F96176] text-xs font-bold animate-pulse shadow-xs">
                <span>👆 Select your package</span>
              </div>
            </div>

            {/* Slabs Chips & Custom Request Button in the SAME LINE */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {availableSlabs.map((slab) => {
                const isSelected =
                  selectedSlab?.fromUnit === slab.fromUnit &&
                  selectedSlab?.toUnit === slab.toUnit;
                const label =
                  slab.fromUnit === slab.toUnit
                    ? `${slab.fromUnit} ${slab.fromUnit === 1 ? "Vehicle" : "Vehicles"}`
                    : `${slab.fromUnit} - ${slab.toUnit} Vehicles`;

                return (
                  <button
                    key={`${slab.fromUnit}-${slab.toUnit}`}
                    type="button"
                    onClick={() => handleSelectSlab(slab)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#F96176] text-white shadow-md shadow-[#F96176]/25 scale-[1.02]"
                        : "bg-gray-100/90 text-gray-700 hover:bg-gray-200/90 border border-gray-200"
                    }`}
                  >
                    <Layers size={14} className={isSelected ? "text-white" : "text-gray-400"} />
                    <span>{label}</span>
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom Package Option in the SAME LINE */}
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[#58BB87] text-xs sm:text-sm font-bold text-[#58BB87] bg-emerald-50/70 hover:bg-emerald-100/80 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Need another slab? Custom Package</span>
              </button>
            </div>
          </div>

          {/* Stepper Inputs for Trucks and Trailers */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Fleet Units Composition
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedSlab
                    ? `Specify trucks and trailers for the ${
                        selectedSlab.fromUnit === selectedSlab.toUnit
                          ? `${selectedSlab.fromUnit} Vehicle`
                          : `${selectedSlab.fromUnit} - ${selectedSlab.toUnit} Vehicles`
                      } package.`
                    : "Specify your active trucks and trailers."}
                </p>
              </div>

              {/* Country Badge */}
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5">
                <span>Country:</span>
                <span className="text-[#F96176] font-black">{userCountry}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trucks Input */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#F96176] text-white flex items-center justify-center font-bold shadow-sm">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Power Units (Trucks)</h4>
                      <p className="text-xs text-gray-500">Active semi-trucks & daycabs</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-700">
                    {trucksCount} {trucksCount === 1 ? "Truck" : "Trucks"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTrucksCount((prev) => Math.max(0, prev - 1))}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-lg flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                    disabled={trucksCount <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={trucksCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTrucksCount(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="flex-1 text-center py-2 bg-white border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setTrucksCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Trailers Input */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#58BB87] text-white flex items-center justify-center font-bold shadow-sm">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Trailed Units (Trailers)</h4>
                      <p className="text-xs text-gray-500">Dry vans, reefers & flatbeds</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-700">
                    {trailersCount} {trailersCount === 1 ? "Trailer" : "Trailers"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTrailersCount((prev) => Math.max(0, prev - 1))}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-lg flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                    disabled={trailersCount <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={trailersCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTrailersCount(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="flex-1 text-center py-2 bg-white border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setTrailersCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Validation & Out of Slab Warning */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500">Configured Fleet:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#58BB87] border border-emerald-200">
                  {trucksCount} Trucks + {trailersCount} Trailers = {totalVehicles} Total
                </span>
                {selectedSlab && (
                  <span className="text-xs text-gray-400">
                    (Selected Package Slab: {selectedSlab.fromUnit} to {selectedSlab.toUnit} Units)
                  </span>
                )}
              </div>

              {isOutOfSelectedSlab && selectedSlab && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <AlertCircle size={14} className="shrink-0 text-amber-600" />
                    <span>
                      {totalVehicles} vehicles is outside the {selectedSlab.fromUnit}-{selectedSlab.toUnit} package slab.
                    </span>
                  </div>

                  {matchingSlabForCount ? (
                    <button
                      type="button"
                      onClick={() => handleSelectSlab(matchingSlabForCount)}
                      className="px-3 py-1.5 rounded-xl bg-[#F96176] text-white text-xs font-bold hover:bg-[#e04f63] transition shadow-xs cursor-pointer"
                    >
                      Switch to {matchingSlabForCount.fromUnit}-{matchingSlabForCount.toUnit} Package
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#58BB87] text-white text-xs font-bold hover:bg-[#4ca877] transition shadow-xs cursor-pointer"
                    >
                      Request Custom Package
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Plans Cards Grid */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Step 2: Select Your Preferred Billing Plan
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                All plans include full platform access, team seat synchronization, and road service leads.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle("Monthly")}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === "Monthly"
                    ? "bg-[#F96176] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("Yearly")}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === "Yearly"
                    ? "bg-[#58BB87] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>Yearly Billing</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    billingCycle === "Yearly"
                      ? "bg-white text-[#58BB87]"
                      : "bg-emerald-100 text-[#58BB87]"
                  }`}
                >
                  Save ~20%
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-500">Loading available plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <Layers size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Active Plans Available</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-6">
                No active subscription plans found for fleet operations. Please contact administration.
              </p>
              <button
                onClick={loadData}
                className="px-4 py-2 rounded-xl bg-[#F96176] text-white text-xs font-semibold hover:bg-[#e04f63] transition-all cursor-pointer"
              >
                Check Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const pricing = calculatePackageSlabPrice({
                  plan,
                  trucks: trucksCount,
                  trailers: trailersCount,
                  billingCycle,
                  countryCode: userCountry,
                  selectedSlab,
                  globalPricing,
                });
                const currencySym = pricing.currencySymbol;

                const isPurchasingThis = purchasingPlanId === plan.id;
                const ctaButtonLabel = plan.buttonName || plan.btnName || "Subscribe Now";

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl border flex flex-col transition-all duration-200 ${
                      plan.isPopular
                        ? "border-[#F96176] shadow-xl ring-2 ring-[#F96176]/20"
                        : "border-gray-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F96176] text-white text-xs font-black tracking-wide uppercase shadow-md flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>Most Popular</span>
                      </div>
                    )}

                    <div className="p-6 sm:p-8 flex-1 flex flex-col">
                      {/* Plan Header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            {plan.name}
                          </h3>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#F96176] border border-rose-200">
                            {billingCycle}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {/* Pricing Display */}
                      <div className="bg-rose-50/40 rounded-2xl p-4 my-4 border border-rose-100">
                        {selectedSlab && (
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                              ✓ {selectedSlab.fromUnit === selectedSlab.toUnit
                                ? `${selectedSlab.fromUnit} Vehicle Slab`
                                : `${selectedSlab.fromUnit} - ${selectedSlab.toUnit} Vehicles Slab`}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">
                              {userCountry} ({pricing.currency})
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-gray-900">
                            {currencySym}
                            {pricing.finalPrice}
                          </span>
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            /{billingCycle.toLowerCase()}
                          </span>

                          {pricing.discountPrice !== null &&
                            pricing.discountPrice < pricing.subtotal && (
                              <span className="text-xs sm:text-sm font-semibold line-through text-gray-400 ml-auto">
                                {currencySym}
                                {pricing.subtotal}
                              </span>
                            )}
                        </div>

                        {/* Breakdown pill */}
                        <div className="mt-3 pt-2.5 border-t border-rose-100/90 space-y-1 text-[11px] text-gray-600">
                          {trucksCount > 0 && (
                            <div className="flex items-center justify-between">
                              <span>
                                Trucks Package ({trucksCount}{" "}
                                {trucksCount === 1 ? "unit" : "units"}):
                              </span>
                              <span className="font-bold text-gray-900">
                                {currencySym}
                                {pricing.truckPayable}
                              </span>
                            </div>
                          )}
                          {trailersCount > 0 && (
                            <div className="flex items-center justify-between">
                              <span>
                                Trailers Package ({trailersCount}{" "}
                                {trailersCount === 1 ? "unit" : "units"}):
                              </span>
                              <span className="font-bold text-gray-900">
                                {currencySym}
                                {pricing.trailerPayable}
                              </span>
                            </div>
                          )}
                          {pricing.discountPrice !== null &&
                            pricing.subtotal > pricing.finalPrice && (
                              <div className="flex items-center justify-between font-bold text-[#58BB87] pt-1 border-t border-rose-100/90">
                                <span>Total Package Savings:</span>
                                <span>
                                  Save {currencySym}
                                  {pricing.subtotal - pricing.finalPrice}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="flex-1 mt-4 space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Included Features
                        </p>
                        {plan.features && plan.features.length > 0 ? (
                          plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                              <div className="p-0.5 rounded-full bg-[#58BB87]/15 text-[#58BB87] mt-0.5 shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                              <span className="leading-snug">{feat}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Standard platform access</p>
                        )}
                      </div>

                      {/* Terms & Conditions accordion */}
                      {plan.termsAndConditions && plan.termsAndConditions.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTerms((prev) => ({
                                ...prev,
                                [plan.id || ""]: !prev[plan.id || ""],
                              }))
                            }
                            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                          >
                            <span>Terms & Conditions</span>
                            {expandedTerms[plan.id || ""] ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                          {expandedTerms[plan.id || ""] && (
                            <ul className="mt-2 space-y-1.5 pl-3 list-disc text-[11px] text-gray-500">
                              {plan.termsAndConditions.map((term, tIdx) => (
                                <li key={tIdx}>{term}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* CTA Purchase Button */}
                      <div className="mt-6 pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(plan)}
                          disabled={!isValidComposition || isPurchasingThis}
                          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer ${
                            !isValidComposition
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                              : plan.isPopular
                              ? "bg-[#F96176] hover:bg-[#e04f63] text-white shadow-md hover:shadow-lg active:scale-[0.99]"
                              : "bg-[#58BB87] hover:bg-[#4ca877] text-white shadow-md hover:shadow-lg active:scale-[0.99]"
                          }`}
                        >
                          {isPurchasingThis ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Securing Checkout...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={16} />
                              <span>{ctaButtonLabel}</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Custom Fleet Plan Request Modal */}
      <CustomFleetRequestModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userAuth={currentUser}
        userProfile={userProfile}
        initialTrucks={trucksCount}
        initialTrailers={trailersCount}
        billingCycle={billingCycle}
      />
    </div>
  );
}
