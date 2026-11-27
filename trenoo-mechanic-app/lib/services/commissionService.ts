import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  PlanCommissionConfig,
  extractCommissionConfig,
  isSubscriptionActive,
} from "@/lib/commission";

type SubscriptionLike = {
  planId?: string | null;
  planName?: string | null;
  status?: string | null;
  commission?: PlanCommissionConfig | null;
} | null | undefined;

/** Live commission settings of a plan document (`subscriptionPlans/{planId}`). */
export async function loadPlanCommissionConfig(
  planId?: string | null
): Promise<PlanCommissionConfig | null> {
  if (!planId) return null;
  try {
    const snap = await getDoc(doc(db, "subscriptionPlans", planId));
    if (!snap.exists()) return null;
    return extractCommissionConfig({ ...(snap.data() as PlanCommissionConfig), id: snap.id, name: snap.data()?.name });
  } catch (err) {
    console.warn(`Could not load commission config for plan ${planId}:`, err);
    return null;
  }
}

/** Snapshot to store on `currentSubscription.commission` when a plan is activated. */
export async function buildCommissionSnapshot(
  plan: (PlanCommissionConfig & { id?: string; name?: string }) | null | undefined
): Promise<PlanCommissionConfig | null> {
  return extractCommissionConfig(plan) ?? (await loadPlanCommissionConfig(plan?.id));
}

/**
 * Commission config of an active subscription: the purchase-time snapshot,
 * or (for subscriptions bought before snapshots existed) the live plan.
 */
export async function resolveSubscriptionCommission(
  subscription: SubscriptionLike
): Promise<PlanCommissionConfig | null> {
  if (!subscription || !isSubscriptionActive(subscription)) return null;
  if (subscription.commission) return subscription.commission;
  return loadPlanCommissionConfig(subscription.planId);
}

/** Workshop owner plan → mechanic commission config (team members use their owner's plan). */
export async function loadWorkshopCommissionConfig(
  workshopOwnerUid?: string | null
): Promise<PlanCommissionConfig | null> {
  if (!workshopOwnerUid) return null;
  try {
    const snap = await getDoc(doc(db, "Mechanics", workshopOwnerUid));
    if (!snap.exists()) return null;
    return resolveSubscriptionCommission(snap.data()?.currentSubscription);
  } catch (err) {
    console.warn("Could not load workshop subscription:", err);
    return null;
  }
}
