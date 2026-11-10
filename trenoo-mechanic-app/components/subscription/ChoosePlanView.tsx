"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
  Navigation,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { signOut, sendEmailVerification } from "firebase/auth";
import { SubscriptionPlan } from "@/types/subscription";
import {
  fetchMechanicSubscriptionPlans,
  purchaseMechanicPlan,
} from "@/lib/services/subscriptionService";

export default function ChoosePlanView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryMechanicId = searchParams.get("mechanicId");
  const queryEmail = searchParams.get("email");

  const [effectiveMechanicId, setEffectiveMechanicId] = useState<string | null>(
    queryMechanicId || null
  );
  const [effectiveEmail, setEffectiveEmail] = useState<string | null>(
    queryEmail || null
  );

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  // Resolve active mechanicId from query param or auth state
  useEffect(() => {
    if (queryMechanicId) {
      setEffectiveMechanicId(queryMechanicId);
    } else if (auth.currentUser?.uid) {
      setEffectiveMechanicId(auth.currentUser.uid);
    }

    if (queryEmail) {
      setEffectiveEmail(queryEmail);
    } else if (auth.currentUser?.email) {
      setEffectiveEmail(auth.currentUser.email);
    }
  }, [queryMechanicId, queryEmail]);

  // Load plans from Firestore
  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchMechanicSubscriptionPlans();
      setPlans(data);
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      toast.error("Unable to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const toggleTerms = (planId: string) => {
    setExpandedTerms((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!effectiveMechanicId) {
      toast.error("Account information missing. Please log in or register again.");
      router.push("/login");
      return;
    }

    setPurchasingPlanId(plan.id);
    try {
      // 1. Update Mechanics/{uid} and create record in subcollection
      const res = await purchaseMechanicPlan(effectiveMechanicId, plan);

      // 2. Send email verification now that plan is purchased
      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (verErr) {
          console.warn("Error sending verification email upon plan purchase:", verErr);
        }
      }

      // 3. Sign out user to enforce email verification gate at login
      try {
        await signOut(auth);
      } catch (soErr) {
        console.warn("Sign out after purchase warning:", soErr);
      }

      toast.success(
        "Subscription activated! A verification email has been sent. Please verify your email before logging in.",
        { duration: 6000 }
      );

      // 4. Redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Purchase error:", err);
      toast.error(err?.message || "Failed to activate subscription plan");
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-50/70 overflow-x-hidden flex flex-col justify-between">
      {/* Decorative Brand Ambient Background */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full"
        style={{
          backgroundColor: "rgba(249, 97, 118, 0.15)", // Pink
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 w-96 h-96 rounded-full"
        style={{
          backgroundColor: "rgba(88, 187, 135, 0.15)", // Green
          filter: "blur(60px)",
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/assets/treno_mechanic_logo.png"
              alt="Treno Mechanic Logo"
              width={140}
              height={42}
              priority
              className="object-contain h-9 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {effectiveEmail && (
              <span className="hidden sm:inline-block text-gray-500 font-medium">
                Registered: <b className="text-gray-800">{effectiveEmail}</b>
              </span>
            )}
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#58BB87] text-xs font-extrabold uppercase tracking-wider mb-3">
            <Wrench className="w-3.5 h-3.5" />
            <span>Official Treno Mechanic Membership</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Choose Your Subscription Plan
          </h1>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Select a tailored membership plan to activate your mechanic station, access roadside job broadcasts, and enable direct fleet customer billing.
          </p>

          {!effectiveMechanicId && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Please register or sign in first to attach a subscription plan to your mechanic profile.
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-200/80 shadow-xs text-center max-w-md mx-auto">
            <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">
              Loading available membership plans...
            </p>
          </div>
        ) : plans.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#F96176]">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                No Plans Available At This Time
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Please contact support or try again shortly. Administrators are currently setting up the pricing catalog.
              </p>
            </div>
            <button
              onClick={loadPlans}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        ) : (
          /* Plans Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {plans.map((plan) => {
              const hasDiscount =
                plan.discountPrice !== undefined &&
                plan.discountPrice !== null &&
                plan.discountPrice < plan.price;

              const savingsPercent = hasDiscount
                ? Math.round(
                    ((plan.price - (plan.discountPrice || 0)) / plan.price) * 100
                  )
                : 0;

              const isPurchasing = purchasingPlanId === plan.id;
              const termsOpen = expandedTerms[plan.id] || false;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl border-2 shadow-xs transition-all duration-300 flex flex-col overflow-hidden relative ${
                    plan.isPopular
                      ? "border-[#58BB87] shadow-lg shadow-[#58BB87]/15 ring-2 ring-[#58BB87]/30"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Popular Highlight Ribbon */}
                  {plan.isPopular && (
                    <div className="bg-gradient-to-r from-[#58BB87] to-emerald-600 py-1.5 px-4 text-center text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Choice</span>
                    </div>
                  )}

                  {/* Card Main Header & Body */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="mb-4">
                      <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#58BB87] border border-emerald-200 mb-2">
                        Mechanic & Shop
                      </span>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        {plan.name}
                      </h2>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Price Section */}
                    <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 mb-6">
                      <div className="flex items-baseline gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-3xl font-black text-gray-900 tracking-tight">
                              ${plan.discountPrice?.toFixed(2)}
                            </span>
                            <span className="text-sm font-semibold text-gray-400 line-through">
                              ${plan.price.toFixed(2)}
                            </span>
                            <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              Save {savingsPercent}%
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-black text-gray-900 tracking-tight">
                            ${plan.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-500">
                          / {plan.duration}
                        </span>
                      </div>
                    </div>

                    {/* Scope & Capability Highlights */}
                    <div className="space-y-2 text-xs text-gray-700 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/80 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#58BB87]" />
                          Workstation Bays:
                        </span>
                        <span className="font-extrabold text-gray-900">
                          {plan.maxBays === -1 || plan.maxBays === undefined
                            ? "Unlimited Bays"
                            : `${plan.maxBays} Service Bays`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-[#58BB87]" />
                          Coverage Radius:
                        </span>
                        <span className="font-extrabold text-[#58BB87]">
                          {plan.serviceRadiusMiles === -1 ||
                          plan.serviceRadiusMiles === undefined
                            ? "Nationwide / Unlimited"
                            : `${plan.serviceRadiusMiles} Miles`}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            plan.priorityJobLeads
                              ? "text-emerald-800"
                              : "text-gray-400"
                          }`}
                        >
                          ✓ Priority Job Leads
                        </span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            plan.directCarrierInvoicing
                              ? "text-emerald-800"
                              : "text-gray-400"
                          }`}
                        >
                          ✓ Carrier Invoicing
                        </span>
                      </div>
                    </div>

                    {/* Features Bullet List */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2.5 mb-6 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Included In This Plan
                        </p>
                        <ul className="space-y-2">
                          {plan.features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-700 flex items-start gap-2.5"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Terms and Conditions Accordion */}
                    {plan.termsAndConditions && plan.termsAndConditions.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mb-6">
                        <button
                          type="button"
                          onClick={() => toggleTerms(plan.id)}
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
                          <ul className="mt-2 space-y-1 pl-4 border-l-2 border-emerald-200 text-[11px] text-gray-600">
                            {plan.termsAndConditions.map((term, tIdx) => (
                              <li key={tIdx} className="list-disc">
                                {term}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-auto">
                      <button
                        type="button"
                        onClick={() => handlePurchase(plan)}
                        disabled={isPurchasing || !!purchasingPlanId}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          plan.isPopular
                            ? "bg-[#58BB87] hover:bg-[#48a875] shadow-[#58BB87]/25"
                            : "bg-gray-900 hover:bg-black shadow-gray-900/20"
                        }`}
                      >
                        {isPurchasing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Activating Plan...</span>
                          </>
                        ) : (
                          <>
                            <span>Purchase Plan</span>
                            <ArrowRight className="w-4 h-4" />
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

        {/* Security & Guarantee Note */}
        <div className="mt-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Secure setup. Subscriptions renew per selected duration. You can manage or upgrade your plan anytime from your account settings.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-white border-t border-gray-200/80 px-6 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Treno Mechanic. All rights reserved.
      </footer>
    </div>
  );
}
