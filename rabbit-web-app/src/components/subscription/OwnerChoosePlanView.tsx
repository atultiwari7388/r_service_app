"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  CreditCard,
  LogOut,
  Layers,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Calendar,
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
  findMatchingSlabForQuantity,
  normalizeCountryCode,
  checkHasActiveSubscription,
} from "@/lib/services/subscriptionService";
import { recordAndActivateOwnerSubscription } from "@/lib/services/subscriptionActivation";
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

  // Stepper state: 1 = Fleet Configuration, 2 = Pricing, Coupon & Checkout
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Fleet units composition
  const [trucksCount, setTrucksCount] = useState<number>(1);
  const [trailersCount, setTrailersCount] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Yearly">("Monthly");

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Handle manual / automatic subscription sync
  const handleSyncSubscription = async () => {
    if (!currentUser) {
      toast.error("Please sign in first.");
      return;
    }
    try {
      setIsSyncing(true);
      toast.loading("Verifying your subscription status...", { id: "sync-sub" });

      const syncRes = await fetch("/api/stripe/sync-user-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUid: currentUser.uid,
          email: currentUser.email,
        }),
      });

      const data = await syncRes.json();
      toast.dismiss("sync-sub");

      if (data.active) {
        toast.success("Active subscription verified in Stripe!");
        const userDocSnap = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        }
      } else {
        toast.error("No active subscription detected. Please configure a plan below.");
      }
    } catch (err: any) {
      toast.dismiss("sync-sub");
      toast.error(err?.message || "Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

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
            const existingTrucks = data.trucksCount ?? data.currentSubscription?.trucksCount;
            if (existingTrucks !== undefined && Number(existingTrucks) > 0) {
              setTrucksCount(Number(existingTrucks));
            }
            const existingTrailers = data.trailersCount ?? data.currentSubscription?.trailersCount;
            if (existingTrailers !== undefined && Number(existingTrailers) >= 0) {
              setTrailersCount(Number(existingTrailers));
            }
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
      return [
        {
          id: "slab-1",
          fromUnit: 1,
          toUnit: 1,
          truckMonthlyRate: 10,
          trailerMonthlyRate: 6,
          truckYearlyRate: 100,
          trailerYearlyRate: 60,
        },
        {
          id: "slab-2",
          fromUnit: 2,
          toUnit: 2,
          truckMonthlyRate: 20,
          trailerMonthlyRate: 12,
          truckYearlyRate: 200,
          trailerYearlyRate: 120,
        },
        {
          id: "slab-3",
          fromUnit: 3,
          toUnit: 5,
          truckMonthlyRate: 40,
          trailerMonthlyRate: 24,
          truckYearlyRate: 400,
          trailerYearlyRate: 240,
        },
      ];
    }

    return list.sort((a, b) => a.fromUnit - b.fromUnit);
  }, [plans]);

  // Normalized Country Code
  const userCountry = useMemo(() => {
    return normalizeCountryCode(userProfile?.country);
  }, [userProfile?.country]);

  // Total vehicles count
  const totalVehicles = trucksCount + trailersCount;

  // Max standard package slab unit limit (e.g. 5 if 3-5 is the top slab)
  const maxSlabUnit = useMemo(() => {
    if (!availableSlabs || availableSlabs.length === 0) return 0;
    return Math.max(...availableSlabs.map((s) => s.toUnit));
  }, [availableSlabs]);

  // Primary active plan
  const primaryPlan = useMemo<SubscriptionPlan>(() => {
    if (plans.length > 0) return plans[0];
    return {
      id: "trenoops-fleet-membership",
      name: "Fleet Membership Plan",
      type: "trenoops",
      duration: "Monthly",
      price: 49.99,
      currency: "USD",
      isActive: true,
      features: [
        "24/7 Roadside Assistance Access",
        "Automated Maintenance & DOT Record Tracking",
        "Direct In-App Mechanic Offer & Dispatch",
        "Expense & Fuel Logging Per Vehicle",
      ],
      termsAndConditions: [],
      packageVehicleSlabs: availableSlabs,
    };
  }, [plans, availableSlabs]);

  // Check if current user already has an active subscription (Upgrade / Change mode)
  const isAlreadySubscribed = Boolean(
    userProfile && checkHasActiveSubscription(userProfile)
  );

  // Independent slab matching for Trucks and Trailers
  const truckSlab = useMemo(() => {
    return findMatchingSlabForQuantity(trucksCount, availableSlabs);
  }, [trucksCount, availableSlabs]);

  const trailerSlab = useMemo(() => {
    return findMatchingSlabForQuantity(trailersCount, availableSlabs);
  }, [trailersCount, availableSlabs]);

  // Check if standard packages exist for current inputs
  const isTruckPackageAvailable = trucksCount === 0 || truckSlab !== null;
  const isTrailerPackageAvailable = trailersCount === 0 || trailerSlab !== null;
  const isAllPackagesAvailable = isTruckPackageAvailable && isTrailerPackageAvailable;
  const isValidComposition = totalVehicles > 0 && isAllPackagesAvailable;

  // Exact package price calculation (with independent slabs & coupon)
  const priceCalc = useMemo(() => {
    return calculatePackageSlabPrice({
      plan: primaryPlan,
      trucks: trucksCount,
      trailers: trailersCount,
      billingCycle,
      countryCode: userCountry,
      globalPricing,
      couponCode: appliedCoupon,
    });
  }, [
    primaryPlan,
    trucksCount,
    trailersCount,
    billingCycle,
    userCountry,
    globalPricing,
    appliedCoupon,
  ]);

  // Handle Coupon Apply
  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponCodeInput.trim().toUpperCase();

    if (!clean) {
      setCouponMessage({ text: "Please enter a coupon code.", isError: true });
      return;
    }

    if (billingCycle === "Yearly") {
      setCouponMessage({
        text: "Coupons are valid only on Monthly billing plans.",
        isError: true,
      });
      return;
    }

    if (clean === "TRENO100") {
      setAppliedCoupon("TRENO100");
      setCouponMessage({
        text: "TRENO100 applied! 100% OFF on your monthly plan.",
        isError: false,
      });
      toast.success("Coupon TRENO100 applied: 100% OFF!");
    } else if (clean === "TRENO50") {
      setAppliedCoupon("TRENO50");
      setCouponMessage({
        text: "TRENO50 applied! 50% OFF on your monthly plan.",
        isError: false,
      });
      toast.success("Coupon TRENO50 applied: 50% OFF!");
    } else {
      setCouponMessage({
        text: "Invalid coupon code. Try TRENO100 or TRENO50.",
        isError: true,
      });
      toast.error("Invalid coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponMessage(null);
    toast.success("Coupon removed.");
  };

  // When billing cycle switches, revoke coupon if switched to yearly
  const handleBillingCycleChange = (cycle: "Monthly" | "Yearly") => {
    setBillingCycle(cycle);
    if (cycle === "Yearly" && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCodeInput("");
      setCouponMessage({
        text: "Coupons were removed because they only apply to Monthly plans.",
        isError: true,
      });
    }
  };

  // Handle Checkout / Activation
  const handleCheckout = async () => {
    if (!currentUser) {
      toast.error("Please login to activate your subscription.");
      router.push("/login?redirect=/choose-plan");
      return;
    }

    if (!isValidComposition) {
      toast.error("Please select at least 1 truck or trailer.");
      return;
    }

    const matchedRangeStr = `${trucksCount} Trucks, ${trailersCount} Trailers`;

    // 1. FREE ACTIVATION FLOW (100% OFF via TRENO100)
    if (priceCalc.finalPrice === 0) {
      try {
        setPurchasingPlanId("free_activation");
        toast.loading("Activating your 100% Free Membership...", { id: "free-act" });

        await recordAndActivateOwnerSubscription({
          ownerUid: currentUser.uid,
          userEmail: currentUser.email || userProfile?.email || "",
          plan: primaryPlan,
          vehicleRange: matchedRangeStr,
          trucksCount,
          trailersCount,
          amountPaid: 0,
          currency: priceCalc.currency,
          autoPay: false,
        });

        toast.dismiss("free-act");
        toast.success("100% Free Plan activated successfully! Welcome to Trenoops.");
        router.push("/choose-plan/success?free=true");
        return;
      } catch (err: any) {
        toast.dismiss("free-act");
        console.error("Free plan activation error:", err);
        toast.error(err?.message || "Failed to activate plan. Please try again.");
        setPurchasingPlanId(null);
        return;
      }
    }

    // 2. STRIPE CHECKOUT FLOW
    try {
      setPurchasingPlanId(primaryPlan.id || "stripe_checkout");

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUid: currentUser.uid,
          planId: primaryPlan.id,
          email: currentUser.email || userProfile?.email || "",
          planName: `${primaryPlan.name} (${trucksCount} Trucks, ${trailersCount} Trailers)`,
          duration: billingCycle,
          price: priceCalc.subtotal,
          discountPrice: priceCalc.finalPrice, // Charge the discounted final price
          currency: priceCalc.currency,
          vehicleRange: matchedRangeStr,
          trucksCount,
          trailersCount,
          couponCode: appliedCoupon || undefined,
          isUpgrade: isAlreadySubscribed,
          originUrl: typeof window !== "undefined" ? window.location.origin : undefined,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-800">Loading Fleet Plans...</h2>
        <p className="text-xs text-gray-500 mt-1">Configuring vehicles & pricing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 pb-20">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                  type="button"
                  onClick={handleSyncSubscription}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#58BB87]/40 bg-[#58BB87]/10 text-xs font-semibold text-[#58BB87] hover:bg-[#58BB87] hover:text-white transition-all cursor-pointer disabled:opacity-60"
                  title="Check and restore your paid subscription from Stripe"
                >
                  <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">
                    {isSyncing ? "Syncing..." : "Sync Subscription"}
                  </span>
                </button>
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

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {/* Hero Section */}
        <div className="text-center max-w-xl mx-auto mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#58BB87]/10 text-[#58BB87] text-[11px] font-semibold mb-2">
            <Sparkles size={12} />
            <span>Automatic Package-Based Fleet Pricing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Choose Your Fleet Membership
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Specify your fleet size below. Package rates are automatically matched without manual slab selection.
          </p>
        </div>

        {/* ============================================================== */}
        {/* STEPPER PROGRESS INDICATOR */}
        {/* ============================================================== */}
        <div className="max-w-md mx-auto mb-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0" />
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#58BB87] transition-all duration-300 z-0 ${
                currentStep === 2 ? "w-full" : "w-1/2"
              }`}
            />

            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                currentStep === 1
                  ? "bg-[#F96176] text-white ring-3 ring-[#F96176]/20"
                  : "bg-[#58BB87] text-white hover:opacity-90"
              }`}
            >
              <Truck size={13} />
              <span>1. Fleet Units</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!isAllPackagesAvailable) {
                  setIsCustomModalOpen(true);
                } else if (isValidComposition) {
                  setCurrentStep(2);
                } else {
                  toast.error("Please configure at least 1 vehicle.");
                }
              }}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                currentStep === 2
                  ? "bg-[#F96176] text-white ring-3 ring-[#F96176]/20"
                  : "bg-white text-gray-500 border border-gray-300 hover:text-gray-900"
              }`}
            >
              <CreditCard size={13} />
              <span>2. Pricing & Review</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* STEP 1: FLEET UNITS CONFIGURATION */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-md p-4 sm:p-5 animate-in fade-in duration-200">
            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Step 1: Specify Fleet Quantities</h2>
                <p className="text-[11px] text-gray-500">
                  Enter your number of trucks & trailers. Package rates apply flat.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full">
                Country: <span className="text-[#F96176]">{userCountry}</span>
              </span>
            </div>

            {/* Active Subscription / Upgrade Mode Notice */}
            {isAlreadySubscribed && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#58BB87] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 block">
                        Current: {userProfile?.currentSubscription?.planName || "Active Fleet Plan"}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#58BB87]/15 text-[#58BB87]">
                        Active
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-600 block">
                      Coverage: {userProfile?.vehicleRange || userProfile?.currentSubscription?.vehicleRange || `${trucksCount} Trucks`}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#58BB87] px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-xs">
                  Upgrade Mode
                </span>
              </div>
            )}

            <div className="space-y-3">
              {/* Trucks (Power Units) Input */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-200/80 transition-all hover:border-[#F96176]/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F96176] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <Truck size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-tight">Power Units (Trucks)</h3>
                      <p className="text-[10px] text-gray-400">Semi-trucks & tractors</p>
                    </div>
                  </div>

                  {/* Compact Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrucksCount((prev) => Math.max(0, prev - 1))}
                      disabled={trucksCount <= 0}
                      className="w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                      title="Decrease Trucks"
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
                      className="w-12 text-center py-0.5 text-xs font-black text-gray-900 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTrucksCount((prev) => prev + 1)}
                      className="w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm flex items-center justify-center transition cursor-pointer"
                      title="Increase Trucks"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Auto-detected Package Badge / Warning for Trucks */}
                <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between flex-wrap gap-1.5 text-[11px]">
                  <span className="text-gray-500 font-medium">Truck Package:</span>
                  {trucksCount === 0 ? (
                    <span className="text-gray-400 font-medium">0 Trucks ($0)</span>
                  ) : truckSlab ? (
                    <span className="font-bold text-[#F96176] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                      {truckSlab.fromUnit === truckSlab.toUnit
                        ? `${truckSlab.fromUnit} Truck Package`
                        : `${truckSlab.fromUnit}-${truckSlab.toUnit} Trucks Package`}{" "}
                      • {priceCalc.currencySymbol}
                      {billingCycle === "Monthly"
                        ? truckSlab.truckMonthlyDiscount ?? truckSlab.truckMonthlyRate
                        : truckSlab.truckYearlyDiscount ?? truckSlab.truckYearlyRate}
                      /{billingCycle === "Monthly" ? "mo" : "yr"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px]">
                        Package not available for {trucksCount} Trucks (Max: {maxSlabUnit})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomModalOpen(true)}
                        className="text-[10px] font-bold text-[#F96176] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Sparkles size={11} />
                        <span>Custom Quote</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trailers (Trailed Units) Input */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-200/80 transition-all hover:border-[#58BB87]/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#58BB87] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-tight">Trailed Units (Trailers)</h3>
                      <p className="text-[10px] text-gray-400">Dry vans & flatbeds</p>
                    </div>
                  </div>

                  {/* Compact Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrailersCount((prev) => Math.max(0, prev - 1))}
                      disabled={trailersCount <= 0}
                      className="w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                      title="Decrease Trailers"
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
                      className="w-12 text-center py-0.5 text-xs font-black text-gray-900 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTrailersCount((prev) => prev + 1)}
                      className="w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm flex items-center justify-center transition cursor-pointer"
                      title="Increase Trailers"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Auto-detected Package Badge / Warning for Trailers */}
                <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between flex-wrap gap-1.5 text-[11px]">
                  <span className="text-gray-500 font-medium">Trailer Package:</span>
                  {trailersCount === 0 ? (
                    <span className="text-gray-400 font-medium">0 Trailers ($0)</span>
                  ) : trailerSlab ? (
                    <span className="font-bold text-[#58BB87] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                      {trailerSlab.fromUnit === trailerSlab.toUnit
                        ? `${trailerSlab.fromUnit} Trailer Package`
                        : `${trailerSlab.fromUnit}-${trailerSlab.toUnit} Trailers Package`}{" "}
                      • {priceCalc.currencySymbol}
                      {billingCycle === "Monthly"
                        ? trailerSlab.trailerMonthlyDiscount ?? trailerSlab.trailerMonthlyRate
                        : trailerSlab.trailerYearlyDiscount ?? trailerSlab.trailerYearlyRate}
                      /{billingCycle === "Monthly" ? "mo" : "yr"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px]">
                        Package not available for {trailersCount} Trailers (Max: {maxSlabUnit})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomModalOpen(true)}
                        className="text-[10px] font-bold text-[#58BB87] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Sparkles size={11} />
                        <span>Custom Quote</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Summary & Continue / Custom Request Button */}
            <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Configured Fleet:</span>
                <span className="font-bold px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-gray-800">
                  {trucksCount} {trucksCount === 1 ? "Truck" : "Trucks"} + {trailersCount}{" "}
                  {trailersCount === 1 ? "Trailer" : "Trailers"} ({totalVehicles} Total)
                </span>
              </div>

              {!isAllPackagesAvailable ? (
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Request Custom Fleet Quote</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (isValidComposition) setCurrentStep(2);
                    else toast.error("Please add at least 1 truck or trailer.");
                  }}
                  disabled={!isValidComposition}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue to Pricing (Step 2)</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: BILLING CYCLE, SUMMARY, COUPON & CHECKOUT */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-md p-4 sm:p-5 animate-in fade-in duration-200">
            {/* Header & Back Button */}
            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Step 2: Review & Apply Coupon</h2>
                <p className="text-[11px] text-gray-500">
                  Confirm billing cycle and apply promo coupons before checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Edit Units</span>
              </button>
            </div>

            {/* Active Subscription Upgrade Notice in Step 2 */}
            {isAlreadySubscribed && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#58BB87] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Upgrading Fleet Plan
                    </span>
                    <span className="text-[10px] text-gray-600">
                      New Fleet: {trucksCount} Trucks, {trailersCount} Trailers • Billed {billingCycle}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#58BB87] px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-xs">
                  Upgrade Summary
                </span>
              </div>
            )}

            {/* Billing Cycle Toggle */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleBillingCycleChange("Monthly")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    billingCycle === "Monthly"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Calendar size={13} />
                  <span>Monthly Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBillingCycleChange("Yearly")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    billingCycle === "Yearly"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Sparkles size={13} className="text-[#58BB87]" />
                  <span>Yearly Plan</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#58BB87]/15 text-[#58BB87]">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Price Line-Item Breakdown Card */}
            <div className="bg-[#F8FAFC] rounded-xl border border-gray-200 p-3.5 mb-4 space-y-2.5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Price Breakdown
              </h3>

              {/* Truck Line Item */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className="text-[#F96176]" />
                  <span className="text-gray-700 font-medium">
                    Truck Package (
                    {truckSlab
                      ? `${truckSlab.fromUnit === truckSlab.toUnit ? truckSlab.fromUnit : `${truckSlab.fromUnit}-${truckSlab.toUnit}`} Trucks`
                      : "0 Trucks"}
                    ):
                  </span>
                </div>
                <span className="font-bold text-gray-900">
                  {priceCalc.currencySymbol}
                  {priceCalc.truckPayable.toFixed(2)}
                </span>
              </div>

              {/* Trailer Line Item */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-[#58BB87]" />
                  <span className="text-gray-700 font-medium">
                    Trailer Package (
                    {trailerSlab
                      ? `${trailerSlab.fromUnit === trailerSlab.toUnit ? trailerSlab.fromUnit : `${trailerSlab.fromUnit}-${trailerSlab.toUnit}`} Trailers`
                      : "0 Trailers"}
                    ):
                  </span>
                </div>
                <span className="font-bold text-gray-900">
                  {priceCalc.currencySymbol}
                  {priceCalc.trailerPayable.toFixed(2)}
                </span>
              </div>

              {/* Subtotal */}
              <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-600">
                <span>Subtotal ({billingCycle}):</span>
                <span className="font-bold text-gray-800">
                  {priceCalc.currencySymbol}
                  {priceCalc.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Applied Coupon Discount Row */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-[#58BB87] font-bold bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1">
                    <Tag size={13} />
                    <span>Coupon ({appliedCoupon}):</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#58BB87] text-white">
                      {priceCalc.couponPercent}% OFF
                    </span>
                  </div>
                  <span>
                    -{priceCalc.currencySymbol}
                    {(priceCalc.couponDiscountAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total Payable */}
              <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black text-gray-900 block">Total Payable</span>
                  <span className="text-[10px] text-gray-400">
                    Billed {billingCycle.toLowerCase()} • Cancel anytime
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-gray-900">
                    {priceCalc.currencySymbol}
                    {priceCalc.finalPrice.toFixed(2)}
                  </span>
                  {appliedCoupon && priceCalc.finalPrice === 0 && (
                    <span className="block text-[10px] font-bold text-[#58BB87]">100% Free Plan</span>
                  )}
                </div>
              </div>
            </div>

            {/* Coupon Code Input Box */}
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Have a Promo / Coupon Code?
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-white border border-emerald-300 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#58BB87]">
                    <CheckCircle2 size={14} />
                    <span>Coupon "{appliedCoupon}" Active ({priceCalc.couponPercent}% OFF)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter TRENO100 or TRENO50"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value);
                      if (couponMessage) setCouponMessage(null);
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 uppercase placeholder:normal-case focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Coupon Alert Message */}
              {couponMessage && (
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    couponMessage.isError ? "text-red-500" : "text-[#58BB87]"
                  }`}
                >
                  {couponMessage.text}
                </p>
              )}

              <p className="mt-1.5 text-[10px] text-gray-400">
                Monthly coupons: <strong className="text-gray-600">TRENO100</strong> (100% off) &amp;{" "}
                <strong className="text-gray-600">TRENO50</strong> (50% off). Valid on Monthly billing only.
              </p>
            </div>

            {/* Action Checkout / Free Activation Button */}
            <div>
              {priceCalc.finalPrice === 0 ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={purchasingPlanId !== null}
                  className="w-full py-3 px-4 rounded-xl bg-[#58BB87] hover:bg-[#4ca877] text-white font-bold text-sm transition-all shadow-md shadow-[#58BB87]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {purchasingPlanId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {isAlreadySubscribed ? "Applying Plan Upgrade..." : "Activating Free Plan..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        {isAlreadySubscribed
                          ? "Activate Plan Upgrade (TRENO100 - $0.00)"
                          : "Activate Free Plan (TRENO100 - $0.00)"}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={purchasingPlanId !== null}
                  className="w-full py-3 px-4 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white font-bold text-sm transition-all shadow-md shadow-[#F96176]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {purchasingPlanId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Redirecting to Stripe...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      <span>
                        {isAlreadySubscribed ? "Confirm & Upgrade Plan (" : "Proceed to Checkout ("}
                        {priceCalc.currencySymbol}
                        {priceCalc.finalPrice.toFixed(2)})
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#58BB87]" />
                Secure Stripe Checkout
              </span>
              <span>•</span>
              <span>Instant Activation</span>
              <span>•</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        )}
      </main>

      {/* Custom Package Modal (if fleet exceeds standard limits) */}
      <CustomFleetRequestModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        initialTrucks={trucksCount}
        initialTrailers={trailersCount}
        userAuth={currentUser}
        userProfile={userProfile}
        billingCycle={billingCycle}
      />
    </div>
  );
}
