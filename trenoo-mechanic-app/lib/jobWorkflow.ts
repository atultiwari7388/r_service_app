/**
 * Roadside job state machine: single source of truth for the job lifecycle.
 *
 * Shared contract between `trenoo-mechanic-app` (lib/jobWorkflow.ts) and
 * `rabbit-web-app` (src/lib/jobWorkflow.ts). Keep the two copies identical in
 * everything above the "App-specific helpers" marker.
 *
 *  status 0  Open request                 (customer posted; workshops quote → offer.status 1)
 *  status 2  Dispatched / en route        (customer accepted an offer; NO payment yet)
 *  status 3  On site / diagnosing         (technician tapped "Arrived at Destination")
 *  status 4  Work order issued            (inspection submitted with verified amount)
 *              isPaid false → awaiting customer payment
 *              isPaid true  → repair in progress
 *              repairCompletedByTechnician → awaiting customer sign-off
 *  status 5  Completed                    (customer quality sign-off)
 *  status -1 Cancelled
 *
 * The job document keeps `status: 0` while offers are pending so every
 * eligible workshop can still quote; each quote is an offer with `status: 1`.
 */

export const JOB_STATUS = {
  OPEN: 0,
  QUOTED: 1,
  DISPATCHED: 2,
  ON_SITE: 3,
  WORK_ORDER: 4,
  COMPLETED: 5,
  CANCELLED: -1,
} as const;

export type JobStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | -1;

export type AssignmentStatus =
  | "pending_member_acceptance"
  | "en_route"
  | "arrived"
  | "inspecting"
  | "awaiting_payment"
  | "repairing"
  | "completed";

export type JobPhase =
  | "open"
  | "en_route"
  | "on_site_inspecting"
  | "awaiting_payment"
  | "repairing"
  | "awaiting_signoff"
  | "completed"
  | "cancelled";

/** Minimal structural shapes so both apps' richer types satisfy them. */
export interface WorkflowOffer {
  mId: string;
  status: number;
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberPhone?: string;
  isAssignedByOwner?: boolean;
}

export interface WorkflowJob {
  status: number;
  isPaid?: boolean;
  repairCompletedByTechnician?: boolean;
  customerSignOff?: boolean;
  finalDiagnosedAmount?: number;
  mechanicsOffer?: WorkflowOffer[];
}

/** True when the offer was delegated by the workshop owner to a team member. */
export function isDelegatedOffer(offer: WorkflowOffer | undefined | null): boolean {
  const memberId = (offer?.assignedMemberId || "").trim();
  return Boolean(memberId && memberId !== "self" && memberId !== offer?.mId);
}

/** UID of the person physically doing the job for this offer. */
export function getExecutingTechnicianId(offer: WorkflowOffer | undefined | null): string {
  if (!offer) return "";
  return isDelegatedOffer(offer) ? (offer.assignedMemberId as string) : offer.mId;
}

/**
 * The offer the customer accepted. Only exists once the job left the open
 * phase; losing bids keep `status: 1` and are never returned here.
 */
export function getAcceptedOffer<O extends WorkflowOffer>(
  job: { status: number; mechanicsOffer?: O[] } | null | undefined
): O | undefined {
  if (!job || !Array.isArray(job.mechanicsOffer)) return undefined;
  if (job.status === JOB_STATUS.OPEN) return undefined;
  return (
    job.mechanicsOffer.find((o) => o.status >= JOB_STATUS.DISPATCHED) ||
    // Cancelled after acceptance: the engaged offer is the one marked -1
    (job.status === JOB_STATUS.CANCELLED
      ? job.mechanicsOffer.find((o) => o.status === JOB_STATUS.CANCELLED)
      : undefined)
  );
}

/** Derive the lifecycle phase purely from persisted fields. */
export function getJobPhase(job: WorkflowJob): JobPhase {
  switch (job.status) {
    case JOB_STATUS.CANCELLED:
      return "cancelled";
    case JOB_STATUS.COMPLETED:
      return "completed";
    case JOB_STATUS.DISPATCHED:
      return "en_route";
    case JOB_STATUS.ON_SITE:
      // Legacy records: an older Stripe handler wrote status 3 after payment.
      // A paid, priced job is a work order, never "diagnosing" again.
      if (!(job.isPaid && Number(job.finalDiagnosedAmount) > 0)) {
        return "on_site_inspecting";
      }
    // falls through
    case JOB_STATUS.WORK_ORDER:
      if (job.customerSignOff) return "completed";
      if (!job.isPaid) return "awaiting_payment";
      return job.repairCompletedByTechnician ? "awaiting_signoff" : "repairing";
    default:
      return "open";
  }
}

/** Phase-level guards used by every mutation in both apps. */
export const canMarkArrived = (job: WorkflowJob) => getJobPhase(job) === "en_route";
export const canSubmitInspection = (job: WorkflowJob) =>
  getJobPhase(job) === "on_site_inspecting";
export const canPay = (job: WorkflowJob) =>
  getJobPhase(job) === "awaiting_payment" && Number(job.finalDiagnosedAmount) > 0;
export const canMarkRepairFinished = (job: WorkflowJob) => getJobPhase(job) === "repairing";
export const canCustomerSignOff = (job: WorkflowJob) =>
  getJobPhase(job) === "awaiting_signoff";

// ─── App-specific helpers (mechanic app) ─────────────────────────────────────

/**
 * Normalised team-member detection. Firestore records use "member"/"Member",
 * or only carry `ownerId` / `isTeamMember: true`.
 */
export function isTeamMemberProfile(
  profile:
    | { role?: string | null; ownerId?: string | null; isTeamMember?: boolean | null }
    | null
    | undefined
): boolean {
  return Boolean(
    profile?.role?.toString().trim().toLowerCase() === "member" ||
      profile?.ownerId ||
      profile?.isTeamMember === true
  );
}

/**
 * How the signed-in mechanic relates to a job:
 *  - "executor":   physically does the job (assigned member, or owner who kept it)
 *  - "supervisor": workshop owner who delegated it to a team member
 *  - "bidder":     owner whose quote is still pending (job still open)
 *  - null:         unrelated (includes losing bids once another offer was accepted)
 */
export type JobRelation = "executor" | "supervisor" | "bidder" | null;

export function getJobRelation<O extends WorkflowOffer>(
  job: { status: number; mechanicsOffer?: O[] },
  uid: string
): { relation: JobRelation; offer?: O } {
  if (!uid) return { relation: null };
  const accepted = getAcceptedOffer(job);
  if (accepted) {
    if (getExecutingTechnicianId(accepted) === uid) return { relation: "executor", offer: accepted };
    if (accepted.mId === uid) return { relation: "supervisor", offer: accepted };
    return { relation: null };
  }
  const myBid = job.mechanicsOffer?.find((o) => o.mId === uid);
  if (myBid && job.status === JOB_STATUS.OPEN) return { relation: "bidder", offer: myBid };
  if (myBid && job.status === JOB_STATUS.CANCELLED) return { relation: "bidder", offer: myBid };
  return { relation: null };
}

/** Human label for the mechanic-side status badge. */
export function getMechanicPhaseLabel(job: WorkflowJob): string {
  switch (getJobPhase(job)) {
    case "open":
      return "Quote Submitted • Waiting for Driver";
    case "en_route":
      return "Technician En Route";
    case "on_site_inspecting":
      return "On-Site • Diagnosing Vehicle";
    case "awaiting_payment":
      return "Awaiting Customer Payment Authorization";
    case "repairing":
      return "Repair in Progress";
    case "awaiting_signoff":
      return "Repair Finished • Awaiting Customer Sign-Off";
    case "completed":
      return "Completed & Signed Off";
    case "cancelled":
      return "Cancelled";
  }
}
