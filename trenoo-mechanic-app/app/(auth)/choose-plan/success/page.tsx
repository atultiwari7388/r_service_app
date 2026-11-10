"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut, sendEmailVerification } from "firebase/auth";
import { recordAndActivateSubscription } from "@/lib/services/subscriptionActivation";
import { SubscriptionPlan } from "@/types/subscription";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const mechanicId = searchParams.get("mechanicId");

  const [loading, setLoading] = useState(true);
  const [verifiedPlanName, setVerifiedPlanName] = useState<string>("Plan");
  const [error, setError] = useState<string | null>(null);

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
            setVerifiedPlanName(data.planName || "Membership");
          }

          const targetMechanicId =
            data.mechanicId || mechanicId || auth.currentUser?.uid;

          if (targetMechanicId) {
            const planMock: SubscriptionPlan = {
              id: data.planId || "plan",
              name: data.planName || "Mechanic Subscription Plan",
              type: "treno_mechanic",
              duration: data.duration || "Monthly",
              price: data.amountPaid || 0,
              currency: data.currency || "USD",
              isActive: true,
              features: [],
              termsAndConditions: [],
            };

            // Idempotent recording in Firestore with active user privileges
            try {
              await recordAndActivateSubscription({
                mechanicId: targetMechanicId,
                userEmail: data.userEmail || auth.currentUser?.email || "",
                plan: planMock,
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

          // 2. Dispatch email verification if user is still logged in
          if (auth.currentUser) {
            try {
              await sendEmailVerification(auth.currentUser);
            } catch (err) {
              console.warn("Could not dispatch email verification:", err);
            }
          }

          // 3. Sign out to enforce email verification gate at login
          try {
            await signOut(auth);
          } catch (soErr) {
            console.warn("Sign out error:", soErr);
          }
        } else {
          if (isMounted) {
            setError(data.error || "Payment verification in progress.");
          }
        }
      } catch (err: any) {
        console.error("Verification fetch error:", err);
        if (isMounted) {
          setError(err?.message || "Verification request failed.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifyAndFinalize();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  return (
    <div className="relative min-h-screen w-full bg-slate-50/80 flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative Brand Ambience */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full"
        style={{
          backgroundColor: "rgba(88, 187, 135, 0.18)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
        style={{
          backgroundColor: "rgba(249, 97, 118, 0.18)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200/90 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/assets/treno_mechanic_logo.png"
            alt="Treno Mechanic Logo"
            width={160}
            height={50}
            priority
            className="object-contain h-10 w-auto"
          />
        </div>

        {loading ? (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 border-3 border-[#58BB87] border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">
              Confirming your subscription...
            </h2>
            <p className="text-xs text-gray-500">
              Please wait while we record your membership and setup autopay.
            </p>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Subscription Status
            </h2>
            <p className="text-xs text-gray-600">{error}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#58BB87] text-white font-bold text-xs shadow-md hover:bg-[#48a875] transition"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-[#58BB87] shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Payment & Auto-Pay Confirmed
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
                Subscription Activated!
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Your <b className="text-gray-800">{verifiedPlanName}</b> plan has been successfully activated.
              </p>
            </div>

            {/* Email Verification Callout */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Mail className="w-4 h-4 text-[#58BB87]" />
                <span>Verification Email Dispatched</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                A verification link has been sent to your email address. Please click the verification link in your inbox before logging in to your dashboard.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 rounded-2xl bg-[#58BB87] hover:bg-[#48a875] text-white font-bold text-sm shadow-md shadow-[#58BB87]/25 transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChoosePlanSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-3 border-[#58BB87] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
