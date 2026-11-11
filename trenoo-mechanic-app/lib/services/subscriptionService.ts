import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import {
  SubscriptionPlan,
  MechanicCurrentSubscription,
  MechanicSubscriptionHistoryItem,
} from "@/types/subscription";

/**
 * Fetch all active subscription plans configured for mechanics.
 * Tries server-side API route first (bypassing browser permission issues),
 * with client-side Firestore fallback.
 */
export async function fetchMechanicSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // 1. Try server API route first (bulletproof against unauthenticated client permission denials)
  try {
    const res = await fetch("/api/subscription-plans", {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.plans) && json.plans.length > 0) {
        return json.plans;
      }
    }
  } catch (apiErr) {
    console.warn("Server API fetch for plans failed, falling back to direct Firestore:", apiErr);
  }

  // 2. Direct Firestore fallback
  try {
    const plansRef = collection(db, "subscriptionPlans");
    const q = query(
      plansRef,
      where("type", "==", "treno_mechanic"),
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const plans: SubscriptionPlan[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      plans.push({
        id: docSnap.id,
        name: data.name || "Mechanic Plan",
        type: data.type || "treno_mechanic",
        description: data.description || "",
        duration: data.duration || "Monthly",
        price: typeof data.price === "number" ? data.price : parseFloat(data.price || "0"),
        discountPrice:
          data.discountPrice !== undefined && data.discountPrice !== null && data.discountPrice !== ""
            ? Number(data.discountPrice)
            : null,
        currency: data.currency || "USD",
        isActive: data.isActive ?? true,
        isPopular: data.isPopular ?? false,
        sortOrder: data.sortOrder ?? 0,
        features: Array.isArray(data.features) ? data.features : [],
        termsAndConditions: Array.isArray(data.termsAndConditions) ? data.termsAndConditions : [],
        maxBays: data.maxBays,
        serviceRadiusMiles: data.serviceRadiusMiles,
        priorityJobLeads: data.priorityJobLeads,
        directCarrierInvoicing: data.directCarrierInvoicing,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    plans.sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.price || 0) - (b.price || 0);
    });

    return plans;
  } catch (error) {
    console.error("Error fetching mechanic subscription plans:", error);
    throw error;
  }
}

/**
 * Activate/Purchase a subscription plan for a mechanic.
 * 1. Updates main document in `Mechanics/{mechanicId}`:
 *    - isSubscriptionPurchase: true
 *    - currentSubscription: MechanicCurrentSubscription
 * 2. Adds permanent audit & renewal history in subcollection `Mechanics/{mechanicId}/subscriptions`:
 *    - Complete transaction record with timing and plan details.
 */
export async function purchaseMechanicPlan(
  mechanicId: string,
  plan: SubscriptionPlan
): Promise<{ success: boolean; message: string }> {
  if (!mechanicId) {
    throw new Error("Invalid mechanic ID");
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
    maxBays: plan.maxBays,
    serviceRadiusMiles: plan.serviceRadiusMiles,
    priorityJobLeads: plan.priorityJobLeads,
    directCarrierInvoicing: plan.directCarrierInvoicing,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
  };

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
    paymentMethod: "direct_activation",
    maxBays: plan.maxBays,
    serviceRadiusMiles: plan.serviceRadiusMiles,
    priorityJobLeads: plan.priorityJobLeads,
    directCarrierInvoicing: plan.directCarrierInvoicing,
    features: plan.features || [],
    termsAndConditions: plan.termsAndConditions || [],
    createdAt: serverTimestamp(),
  };

  try {
    // 1. Update Mechanic's main profile in Mechanics collection
    const mechanicDocRef = doc(db, "Mechanics", mechanicId);
    await updateDoc(mechanicDocRef, {
      isSubscriptionPurchase: true,
      currentSubscription: currentSub,
      updated_at: now,
    });

    // 2. Add record in Mechanics/{mechanicId}/subscriptions subcollection
    const subColRef = collection(db, "Mechanics", mechanicId, "subscriptions");
    await addDoc(subColRef, historyItem);

    return {
      success: true,
      message: `Plan "${plan.name}" has been activated successfully!`,
    };
  } catch (error: any) {
    console.error("Error activating subscription plan:", error);
    throw new Error(error?.message || "Failed to process subscription purchase");
  }
}
