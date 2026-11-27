import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import {
  AppliedCommission,
  JobSettlement,
  PlanCommissionConfig,
  buildSettlement,
  extractCommissionConfig,
  isSubscriptionActive,
  resolveCommission,
} from "@/lib/commission";
import { getAcceptedOffer, getExecutingTechnicianId } from "@/lib/jobWorkflow";
import type { HistoryItem } from "@/types/types";

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

/** Customer (fleet owner / driver) plan → service fee config. */
export async function loadCustomerCommissionConfig(
  customerUid?: string | null
): Promise<PlanCommissionConfig | null> {
  if (!customerUid) return null;
  try {
    const snap = await getDoc(doc(db, "Users", customerUid));
    if (!snap.exists()) return null;
    return resolveSubscriptionCommission(snap.data()?.currentSubscription);
  } catch (err) {
    console.warn("Could not load customer subscription:", err);
    return null;
  }
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

// ─── Job settlement ledger ────────────────────────────────────────────────────

/**
 * Create the ledger entry for a completed (signed-off) job.
 * Idempotent: an existing settlement is never overwritten (it may already be settled).
 * Rates come from what was locked on the job; anything missing (jobs from
 * before commissions existed) is resolved from the current plans.
 */
export async function recordJobSettlement(params: {
  /** jobs doc id (with or without '#'); preferred over job.orderId */
  jobId?: string;
  job: HistoryItem;
  customerId: string;
  completedAt?: string;
}): Promise<JobSettlement | null> {
  const { job, customerId } = params;
  const accepted = getAcceptedOffer(job);
  const workOrderAmount = Number(job.finalDiagnosedAmount) || 0;
  if (!accepted || workOrderAmount <= 0) return null;

  const rawId = String(params.jobId || job.id || job.orderId || "").replace(/^#/, "");
  if (!rawId) return null;
  const settlementRef = doc(db, "jobSettlements", rawId);

  const existing = await getDoc(settlementRef);
  if (existing.exists()) return existing.data() as JobSettlement;

  const mechanicRule: AppliedCommission =
    job.mechanicCommissionRule ??
    resolveCommission(
      await loadWorkshopCommissionConfig(accepted.mId),
      job.selectedService,
      workOrderAmount,
      { capAtBase: true }
    );

  const settlement = buildSettlement({
    jobId: rawId,
    orderId: job.orderId,
    selectedService: job.selectedService,
    currency: job.paidCurrency || "USD",
    customerId,
    customerName: job.userName,
    workshopOwnerId: accepted.mId,
    workshopName: accepted.workshopName || accepted.mName,
    technicianId: getExecutingTechnicianId(accepted),
    technicianName: accepted.assignedMemberName || accepted.mName,
    workOrderAmount,
    // Jobs paid before service fees existed were charged no fee
    customerServiceFeeRule: job.customerServiceFeeRule ?? null,
    mechanicCommissionRule: mechanicRule,
    payMode: job.payMode,
    completedAt: params.completedAt,
  });

  await setDoc(settlementRef, { ...settlement, createdAt: serverTimestamp() });

  // Link the job copies to their ledger entry
  const link = { settlementId: rawId };
  for (const ref of [
    doc(db, "jobs", `#${rawId}`),
    doc(db, "jobs", rawId),
    doc(db, "Users", customerId, "history", `#${rawId}`),
  ]) {
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) await updateDoc(ref, link);
    } catch (err) {
      console.warn("Could not link settlement on", ref.path, err);
    }
  }

  return settlement;
}
