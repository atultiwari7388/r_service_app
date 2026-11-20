"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight, Truck } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { recordAndActivateOwnerSubscription } from "@/lib/services/subscriptionActivation";
import { SubscriptionPlan } from "@/types/subscription";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const ownerUid = searchParams.get("ownerUid");

  const [loading, setLoading] = useState(true);
  const [verifiedPlanName, setVerifiedPlanName] = useState<string>("Fleet Membership");
  const [fleetDetails, setFleetDetails] = useState<{
    range: string;
    trucks: number;
    trailers: number;
    amount: number;
    currency: string;
  }>({
    range: "1 to 5",
    trucks: 0,
    trailers: 0,
    amount: 0,
    currency: "USD",
  });
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndFinalize() {
      if (!sessionId) {
        setError("Invalid checkout session.");
        setLoading(false);
        return;
      }

      try {
        // 1. Verify with backend
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok && data.verified) {
          if (isMounted) {
            setVerifiedPlanName(data.planName || "Fleet Membership");
            setFleetDetails({
              range: data.vehicleRange || "1 to 5",
              trucks: data.trucksCount || 0,
              trailers: data.trailersCount || 0,
              amount: data.amountPaid || 0,
              currency: data.currency || "USD",
            });
          }

          const targetOwnerUid =
            data.ownerUid || ownerUid || auth.currentUser?.uid;

          if (targetOwnerUid) {
            // Fetch the full plan from Firestore to preserve its features
            let planObj: SubscriptionPlan = {
              id: data.planId || "plan",
              name: data.planName || "Fleet Subscription Plan",
              type: "trenoops",
              duration: data.duration || "Monthly",
              price: data.amountPaid || 0,
              currency: data.currency || "USD",
              isActive: true,
              features: [],
              termsAndConditions: [],
            };

            if (data.planId) {
              try {
                const planSnap = await getDoc(doc(db, "subscriptionPlans", data.planId));
                if (planSnap.exists()) {
                  const pData = planSnap.data();
                  planObj = {
                    ...planObj,
                    features: pData.features || [],
                    termsAndConditions: pData.termsAndConditions || [],
                  };
                }
              } catch (pErr) {
                console.warn("Could not fetch plan features from Firestore:", pErr);
              }
            }

            // Client-side recording for instant update
            try {
              await recordAndActivateOwnerSubscription({
                ownerUid: targetOwnerUid,
                userEmail: data.userEmail || auth.currentUser?.email || "",
                plan: planObj,
                vehicleRange: data.vehicleRange || "1 to 5",
                trucksCount: data.trucksCount || 0,
                trailersCount: data.trailersCount || 0,
                amountPaid: data.amountPaid || 0,
                currency: data.currency || "USD",
                stripeCustomerId: data.stripeCustomerId,
                stripeSubscriptionId: data.stripeSubscriptionId,
                stripeSessionId: data.stripeSessionId,
                currentPeriodStart: data.currentPeriodStart,
                currentPeriodEnd: data.currentPeriodEnd,
                autoPay: true,
              });
            } catch (actErr) {
              console.warn("Client activation call warning:", actErr);
            }
          }
        } else {
          setError(data.error || "Failed to verify payment session.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err?.message || "An unexpected error occurred during verification.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyAndFinalize();

    return () => {
      isMounted = false;
    };
  }, [sessionId, ownerUid]);

  // Countdown timer for automatic redirect
  useEffect(() => {
    if (loading || error) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/records");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, error, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Finalizing Your Membership...</h2>
        <p className="text-xs text-gray-500 mt-1">Activating fleet permissions and syncing team seats</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <span className="text-2xl font-black">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Error</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              href="/choose-plan"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold text-white bg-[#F96176] hover:bg-[#e04f63] shadow-md transition-all text-sm"
            >
              Return to Plan Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center space-y-6">
        {/* Animated Success Badge */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#58BB87]/10 text-[#58BB87] flex items-center justify-center shadow-inner">
          <CheckCircle2 size={44} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#58BB87]/10 text-[#58BB87] text-xs font-bold">
            <ShieldCheck size={14} />
            <span>Membership Activated Successfully</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome to Treno Fleet!
          </h1>
          <p className="text-sm text-gray-600">
            Your subscription to <span className="font-bold text-gray-900">{verifiedPlanName}</span> is now active. All routes, team permissions, and dispatch tools have been unlocked.
          </p>
        </div>

        {/* Fleet Composition Summary Pill */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pb-2 border-b border-slate-200">
            <span>Fleet Range Capacity</span>
            <span className="font-bold text-gray-800">{fleetDetails.range} Vehicles</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-slate-600" />
              Power Units (Trucks):
            </span>
            <span className="font-bold">{fleetDetails.trucks} Trucks</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-slate-400" />
              Trailed Units (Trailers):
            </span>
            <span className="font-bold">{fleetDetails.trailers} Trailers</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-900 pt-2 border-t border-slate-200">
            <span>Amount Paid:</span>
            <span className="text-[#58BB87] text-sm">
              ${fleetDetails.amount} {fleetDetails.currency}
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/records"
            className="w-full py-4 px-6 rounded-xl font-bold text-white bg-[#F96176] hover:bg-[#e04f63] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Dashboard ({countdown}s)</span>
            <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-gray-400">
            Auto-redirecting to dashboard in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
