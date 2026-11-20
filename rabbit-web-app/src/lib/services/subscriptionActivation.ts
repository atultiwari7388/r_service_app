import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  SubscriptionPlan,
  OwnerCurrentSubscription,
  OwnerSubscriptionHistoryItem,
} from "@/types/subscription";

export interface OwnerActivationParams {
  ownerUid: string;
  userEmail?: string;
  plan: SubscriptionPlan;
  vehicleRange: string;
  trucksCount: number;
  trailersCount: number;
  amountPaid: number;
  originalPrice?: number;
  currency?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  currentPeriodEnd?: string; // ISO string
  currentPeriodStart?: string; // ISO string
  autoPay?: boolean;
}

/**
 * Removes all `undefined` values from an object, which Firestore strictly disallows.
 */
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Idempotent activation & recording function for Fleet Owners.
 * Updates 3 locations:
 * 1. Global collection `subscriptionPurchases` (docId = stripeSubscriptionId or sessionId)
 * 2. Main document `Users/{ownerUid}` (isSubscriptionPurchase = true + currentSubscription)
 * 3. Subcollection `Users/{ownerUid}/subscriptions` (docId = stripeSubscriptionId or sessionId)
 */
export async function recordAndActivateOwnerSubscription(
  params: OwnerActivationParams
): Promise<{ success: boolean; message: string }> {
  const {
    ownerUid,
    userEmail = "",
    plan,
    vehicleRange,
    trucksCount,
    trailersCount,
    amountPaid,
    originalPrice,
    currency = "USD",
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSessionId,
    stripeInvoiceId,
    currentPeriodEnd,
    currentPeriodStart,
    autoPay = true,
  } = params;

  if (!ownerUid) {
    throw new Error("Activation error: ownerUid is required");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const nowTimestamp = Date.now();

  const totalFleetCount = trucksCount + trailersCount;

  // Determine unique document ID for idempotency
  const purchaseId =
    stripeSubscriptionId || stripeSessionId || `sub_${nowTimestamp}_${ownerUid}`;

  // 1. Prepare Global Record for `subscriptionPurchases`
  const globalRecord = {
    purchaseId,
    userId: ownerUid,
    userEmail: (userEmail || "").toLowerCase().trim(),
    userType: "owner",
    planId: plan.id,
    planName: plan.name,
    planType: "trenoops",
    duration: plan.duration,
    amountPaid,
    currency: currency.toUpperCase(),
    status: "active",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeSessionId: stripeSessionId || undefined,
    stripeInvoiceId: stripeInvoiceId || undefined,
    vehicleRange,
    trucksCount,
    trailersCount,
    totalFleetCount,
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    currentPeriodStart: currentPeriodStart || nowIso,
    currentPeriodEnd: currentPeriodEnd || "",
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

  // 2. Prepare Current Subscription Snapshot for `Users/{ownerUid}`
  const currentSub: OwnerCurrentSubscription = {
    planId: plan.id || "",
    planName: plan.name,
    planType: "trenoops",
    duration: plan.duration,
    amountPaid,
    originalPrice: originalPrice ?? amountPaid,
    discountPrice: plan.discountPrice ?? null,
    currency: currency.toUpperCase(),
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    status: "active",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeSessionId: stripeSessionId || undefined,
    currentPeriodStart: currentPeriodStart || nowIso,
    currentPeriodEnd: currentPeriodEnd || "",
    vehicleRange,
    trucksCount,
    trailersCount,
    totalFleetCount,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

  // 3. Prepare History Item for `Users/{ownerUid}/subscriptions/{purchaseId}`
  const historyItem: OwnerSubscriptionHistoryItem = {
    purchaseId,
    planId: plan.id || "",
    planName: plan.name,
    planType: "trenoops",
    duration: plan.duration,
    amountPaid,
    originalPrice: originalPrice ?? amountPaid,
    discountPrice: plan.discountPrice ?? null,
    currency: currency.toUpperCase(),
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    status: "active",
    paymentMethod: "stripe",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeInvoiceId: stripeInvoiceId || undefined,
    stripeSessionId: stripeSessionId || undefined,
    currentPeriodStart: currentPeriodStart || nowIso,
    currentPeriodEnd: currentPeriodEnd || "",
    vehicleRange,
    trucksCount,
    trailersCount,
    totalFleetCount,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

  try {
    // 1. Write to Global Collection `subscriptionPurchases`
    const globalDocRef = doc(db, "subscriptionPurchases", purchaseId);
    await setDoc(
      globalDocRef,
      cleanForFirestore({
        ...globalRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    // 2. Update Main Document `Users/{ownerUid}`
    const userDocRef = doc(db, "Users", ownerUid);
    await setDoc(
      userDocRef,
      cleanForFirestore({
        isSubscriptionPurchase: true,
        currentSubscription: currentSub,
        vehicleRange, // Ensure vehicleRange is synced to user profile
        updated_at: serverTimestamp(),
      }),
      { merge: true }
    );

    // 3. Write to Subcollection `Users/{ownerUid}/subscriptions/{purchaseId}`
    const subDocRef = doc(db, "Users", ownerUid, "subscriptions", purchaseId);
    await setDoc(
      subDocRef,
      cleanForFirestore({
        ...historyItem,
        createdAt: serverTimestamp(),
      }),
      { merge: true }
    );

    return {
      success: true,
      message: `Plan "${plan.name}" successfully activated for fleet range ${vehicleRange}.`,
    };
  } catch (error: any) {
    console.error("Error activating and recording owner subscription:", error);
    throw new Error(error?.message || "Failed to record subscription");
  }
}
