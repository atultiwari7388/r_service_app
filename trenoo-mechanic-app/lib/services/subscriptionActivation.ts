import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  SubscriptionPlan,
  MechanicCurrentSubscription,
  MechanicSubscriptionHistoryItem,
  GlobalSubscriptionPurchase,
} from "@/types/subscription";

export interface ActivationParams {
  mechanicId: string;
  userEmail?: string;
  plan: SubscriptionPlan;
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
 * Idempotent activation & recording function.
 * Updates 3 locations:
 * 1. Global collection `subscriptionPurchases` (docId = stripeSubscriptionId or sessionId)
 * 2. Main document `Mechanics/{mechanicId}` (isSubscriptionPurchase = true + currentSubscription)
 * 3. Subcollection `Mechanics/{mechanicId}/subscriptions` (docId = stripeSubscriptionId or sessionId)
 */
export async function recordAndActivateSubscription(
  params: ActivationParams
): Promise<{ success: boolean; message: string }> {
  const {
    mechanicId,
    userEmail = "",
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSessionId,
    stripeInvoiceId,
    currentPeriodEnd,
    currentPeriodStart,
    autoPay = true,
  } = params;

  if (!mechanicId) {
    throw new Error("Activation error: mechanicId is required");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const nowTimestamp = Date.now();

  const finalAmount =
    plan.discountPrice !== null &&
    plan.discountPrice !== undefined &&
    plan.discountPrice > 0
      ? plan.discountPrice
      : plan.price;

  // Determine unique document ID for idempotency (Stripe Subscription ID or Session ID)
  const purchaseId =
    stripeSubscriptionId || stripeSessionId || `sub_${nowTimestamp}_${mechanicId}`;

  // 1. Prepare Global Record for `subscriptionPurchases`
  const globalRecord: GlobalSubscriptionPurchase = {
    purchaseId,
    userId: mechanicId,
    userEmail: (userEmail || "").toLowerCase().trim(),
    userType: "mechanic",
    planId: plan.id,
    planName: plan.name,
    duration: plan.duration,
    amountPaid: finalAmount,
    currency: plan.currency || "USD",
    status: "active",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeSessionId: stripeSessionId || undefined,
    stripeInvoiceId: stripeInvoiceId || undefined,
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    currentPeriodStart: currentPeriodStart || nowIso,
    currentPeriodEnd: currentPeriodEnd || "",
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
    updatedAt: serverTimestamp(),
  };

  // 2. Prepare Current Subscription Snapshot for `Mechanics/{mechanicId}`
  const currentSub: MechanicCurrentSubscription = {
    planId: plan.id,
    planName: plan.name,
    duration: plan.duration,
    amountPaid: finalAmount,
    originalPrice: plan.price,
    discountPrice: plan.discountPrice ?? null,
    currency: plan.currency || "USD",
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    status: "active",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeSessionId: stripeSessionId || undefined,
    currentPeriodEnd: currentPeriodEnd || "",
    maxBays: plan.maxBays ?? -1,
    serviceRadiusMiles: plan.serviceRadiusMiles ?? -1,
    priorityJobLeads: plan.priorityJobLeads ?? false,
    directCarrierInvoicing: plan.directCarrierInvoicing ?? false,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

  // 3. Prepare History Item for `Mechanics/{mechanicId}/subscriptions/{purchaseId}`
  const historyItem: MechanicSubscriptionHistoryItem = {
    planId: plan.id,
    planName: plan.name,
    duration: plan.duration,
    amountPaid: finalAmount,
    originalPrice: plan.price,
    discountPrice: plan.discountPrice ?? null,
    currency: plan.currency || "USD",
    purchasedAt: nowIso,
    purchasedTimestamp: nowTimestamp,
    status: "active",
    paymentMethod: "stripe",
    autoPay,
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    stripeInvoiceId: stripeInvoiceId || undefined,
    currentPeriodEnd: currentPeriodEnd || "",
    maxBays: plan.maxBays ?? -1,
    serviceRadiusMiles: plan.serviceRadiusMiles ?? -1,
    priorityJobLeads: plan.priorityJobLeads ?? false,
    directCarrierInvoicing: plan.directCarrierInvoicing ?? false,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

  try {
    // 1. Write to Global Collection `subscriptionPurchases` (sanitized without undefined)
    const globalDocRef = doc(db, "subscriptionPurchases", purchaseId);
    await setDoc(
      globalDocRef,
      cleanForFirestore({
        ...globalRecord,
        createdAt: serverTimestamp(),
      }),
      { merge: true }
    );

    // 2. Update Main Document `Mechanics/{mechanicId}`
    const mechanicDocRef = doc(db, "Mechanics", mechanicId);
    await setDoc(
      mechanicDocRef,
      cleanForFirestore({
        isSubscriptionPurchase: true,
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        currentSubscription: currentSub,
        updated_at: now,
      }),
      { merge: true }
    );

    // 3. Write to Subcollection `Mechanics/{mechanicId}/subscriptions/{purchaseId}`
    const subDocRef = doc(db, "Mechanics", mechanicId, "subscriptions", purchaseId);
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
      message: `Plan "${plan.name}" successfully activated on Treno Mechanic platform.`,
    };
  } catch (error: any) {
    console.error("Error activating and recording subscription:", error);
    throw new Error(error?.message || "Failed to record subscription");
  }
}
