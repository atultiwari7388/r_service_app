"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  CreditCard,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Navigation,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  SubscriptionPlan,
  SUPPORTED_PLAN_COUNTRIES,
  getCurrencySymbol,
} from "@/types/subscription";
import { fetchMechanicSubscriptionPlans } from "@/lib/services/subscriptionService";

interface HomeSubscriptionPlansProps {
  mechanicId: string;
  email?: string;
  userCountry?: string;
}

export default function HomeSubscriptionPlans({
  mechanicId,
  email,
  userCountry,
}: HomeSubscriptionPlansProps) {
  // Match userCountry to one of the 5 supported countries, or fallback to USA
  const initialCountryCode = (() => {
    if (!userCountry) return "USA";
    const found = SUPPORTED_PLAN_COUNTRIES.find(
      (c) =>
        c.code.toUpperCase() === userCountry.toUpperCase() ||
        c.name.toLowerCase() === userCountry.toLowerCase()
    );
    return found ? found.code : "USA";
  })();

  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryCode);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  // Load plans from Firestore / API
  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchMechanicSubscriptionPlans();
      setPlans(data);
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      toast.error("Unable to load membership plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activeCountry =
    SUPPORTED_PLAN_COUNTRIES.find((c) => c.code === selectedCountry) ||
    SUPPORTED_PLAN_COUNTRIES[0];

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!mechanicId) {
      toast.error("Account information missing. Please log in again.");
      return;
    }

    // Resolve country-specific pricing
    const cp = plan.countryPrices?.[activeCountry.code];
    const isCountryEnabled = cp?.enabled && cp?.price > 0;

    const chargePrice = isCountryEnabled ? cp.price : plan.price;
    const chargeDiscount = isCountryEnabled ? cp.discountPrice : plan.discountPrice;
    const chargeCurrency = isCountryEnabled ? activeCountry.currency : plan.currency || "USD";

    setPurchasingPlanId(plan.id);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanicId,
          planId: plan.id,
          email: email || "",
          planName: plan.name,
          duration: plan.duration,
          price: chargePrice,
          discountPrice: chargeDiscount,
          currency: chargeCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to initialize payment gateway");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Purchase error:", err);
      toast.error(err?.message || "Failed to start payment session");
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/70 rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Membership Plan Required to Unlock Dispatch & Operations</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Select Your Mechanic Membership Plan
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Unlock the operations portal, activate live highway breakdown leads, and dispatch mobile technicians.
        </p>
      </div>

      {/* 5-Country Selector Tabs */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Select Pricing Region & Currency
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/80 max-w-full">
          {SUPPORTED_PLAN_COUNTRIES.map((c) => {
            const isSelected = selectedCountry === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCountry(c.code)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span>{c.code}</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({c.currency})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#F96176] animate-spin" />
          <p className="text-xs font-semibold text-gray-500">
            Loading membership plans for {activeCountry.name}...
          </p>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 max-w-md mx-auto space-y-3">
          <CreditCard className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No active plans found</p>
          <button
            onClick={loadPlans}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition"
          >
            Refresh Plans
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-6 items-stretch ${
            plans.length === 1
              ? "max-w-md mx-auto"
              : plans.length === 2
              ? "max-w-4xl mx-auto grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {plans.map((plan) => {
            // Resolve price for the selected country
            const cp = plan.countryPrices?.[activeCountry.code];
            const isCountryEnabled = cp?.enabled && cp?.price > 0;

            const displayPrice = isCountryEnabled ? cp.price : plan.price;
            const displayDiscount = isCountryEnabled
              ? cp.discountPrice
              : plan.discountPrice;
            const symbol = isCountryEnabled
              ? cp.symbol || activeCountry.symbol
              : getCurrencySymbol(plan.currency);

            const hasDiscount =
              displayDiscount !== undefined &&
              displayDiscount !== null &&
              displayDiscount < displayPrice;

            const finalPrice = hasDiscount ? displayDiscount : displayPrice;
            const savingsPercent = hasDiscount
              ? Math.round(((displayPrice - displayDiscount!) / displayPrice) * 100)
              : 0;

            const isPurchasing = purchasingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl border-2 shadow-xs transition-all duration-300 flex flex-col overflow-hidden relative ${
                  plan.isPopular
                    ? "border-[#58BB87] shadow-lg shadow-[#58BB87]/10 ring-2 ring-[#58BB87]/20"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="bg-gradient-to-r from-[#58BB87] to-emerald-600 py-1.5 px-4 text-center text-[11px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Plan</span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#58BB87] border border-emerald-200 mb-2">
                        Mechanic & Shop Bay
                      </span>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 mb-5">
                      <div className="flex items-baseline gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-3xl font-black text-gray-900 tracking-tight">
                              {symbol}
                              {finalPrice}
                            </span>
                            <span className="text-sm font-semibold text-gray-400 line-through">
                              {symbol}
                              {displayPrice}
                            </span>
                            <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              Save {savingsPercent}%
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-black text-gray-900 tracking-tight">
                            {symbol}
                            {displayPrice}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-500">
                          / {plan.duration}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium mt-1">
                        Billed in {activeCountry.currency} • Automatic Renewal
                      </div>
                    </div>

                    {/* Service & Bay Specifications */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <span className="text-[10px] font-semibold text-gray-400 block uppercase">
                          Shop Bays
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">
                          {plan.maxBays === -1 || plan.maxBays === undefined
                            ? "Unlimited Bays"
                            : `${plan.maxBays} Bays`}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <span className="text-[10px] font-semibold text-gray-400 block uppercase">
                          Coverage Radius
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">
                          {plan.serviceRadiusMiles === -1 ||
                          plan.serviceRadiusMiles === undefined
                            ? "Nationwide"
                            : `${plan.serviceRadiusMiles} Miles`}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                          Included Privileges:
                        </span>
                        <ul className="space-y-1.5">
                          {plan.features.slice(0, 5).map((f, i) => (
                            <li
                              key={i}
                              className="text-xs text-gray-700 flex items-start gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-[#58BB87] shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Purchase CTA */}
                  <button
                    type="button"
                    onClick={() => handlePurchase(plan)}
                    disabled={isPurchasing}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      plan.isPopular
                        ? "bg-[#58BB87] hover:bg-[#48a674] text-white shadow-emerald-500/20"
                        : "bg-[#F96176] hover:bg-[#e0485d] text-white shadow-rose-500/20"
                    }`}
                  >
                    {isPurchasing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Redirecting to Checkout...</span>
                      </>
                    ) : (
                      <>
                        <span>Choose {plan.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
