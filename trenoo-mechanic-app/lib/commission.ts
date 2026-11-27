/**
 * Plan-based commission engine, shared by `rabbit-web-app` (src/lib/commission.ts)
 * and `trenoo-mechanic-app` (lib/commission.ts). Keep both copies identical.
 *
 * Money flow per completed job (no Stripe Connect; settled through a ledger):
 *
 *   workOrderAmount     verified final amount the technician submitted on site
 *   customerServiceFee  from the CUSTOMER's plan (trenoops), added ON TOP of the work order
 *   totalCharged        workOrderAmount + customerServiceFee  (what the customer pays)
 *   mechanicCommission  from the WORKSHOP OWNER's plan (treno_mechanic), deducted from payout
 *   mechanicNetEarning  workOrderAmount - mechanicCommission
 *   platformRevenue     customerServiceFee + mechanicCommission
 *
 *   payMode "online" → platform collected totalCharged → platform owes mechanicNetEarning
 *   payMode "cash"   → mechanic collected totalCharged → mechanic owes platformRevenue
 *
 * One ledger document per job: `jobSettlements/{jobId without '#'}`.
 */

export type CommissionType = "percentage" | "flat";

export interface CommissionRuleConfig {
  type: CommissionType;
  value: number;
}

export interface ServiceCommissionRuleConfig extends CommissionRuleConfig {
  enabled: boolean;
}

/** The commission part of a plan, also snapshotted onto `currentSubscription.commission`. */
export interface PlanCommissionConfig {
  planId?: string;
  planName?: string;
  defaultCommission?: CommissionRuleConfig | null;
  serviceCommissions?: Record<string, ServiceCommissionRuleConfig> | null;
}

/** The rule that was actually applied to a job (stored for audit). */
export interface AppliedCommission {
  amount: number;
  type: CommissionType;
  rate: number;
  source: "service" | "default" | "none";
  planId?: string;
  planName?: string;
}

export const ZERO_COMMISSION: AppliedCommission = {
  amount: 0,
  type: "percentage",
  rate: 0,
  source: "none",
};

/** Round to cents (half away from zero). */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
}

function sanitizeRule(rule: CommissionRuleConfig | null | undefined): CommissionRuleConfig | null {
  if (!rule) return null;
  const type: CommissionType = rule.type === "flat" ? "flat" : "percentage";
  const raw = Number(rule.value);
  if (!Number.isFinite(raw) || raw <= 0) return { type, value: 0 };
  return { type, value: type === "percentage" ? Math.min(raw, 100) : raw };
}

/** Pick only the commission fields from a plan or a subscription snapshot. */
export function extractCommissionConfig(
  source:
    | (PlanCommissionConfig & { id?: string; name?: string; commission?: PlanCommissionConfig | null })
    | null
    | undefined
): PlanCommissionConfig | null {
  if (!source) return null;
  if (source.commission) return source.commission;
  if (!source.defaultCommission && !source.serviceCommissions) return null;
  return {
    planId: source.planId || source.id,
    planName: source.planName || source.name,
    defaultCommission: source.defaultCommission ?? null,
    serviceCommissions: source.serviceCommissions ?? null,
  };
}

/**
 * Resolve the commission for one job.
 *  - A service-specific rule (enabled) wins over the plan default.
 *  - `capAtBase`: a deduction can never exceed the amount it is taken from.
 */
export function resolveCommission(
  config: PlanCommissionConfig | null | undefined,
  serviceTitle: string | undefined,
  baseAmount: number,
  options: { capAtBase?: boolean } = {}
): AppliedCommission {
  const base = roundMoney(Number(baseAmount) || 0);
  if (!config || base <= 0) return { ...ZERO_COMMISSION };

  const serviceRule = serviceTitle ? config.serviceCommissions?.[serviceTitle] : undefined;
  const useService = Boolean(serviceRule && serviceRule.enabled);
  const rule = sanitizeRule(useService ? serviceRule : config.defaultCommission);
  if (!rule || rule.value <= 0) {
    return { ...ZERO_COMMISSION, planId: config.planId, planName: config.planName };
  }

  let amount = rule.type === "percentage" ? (base * rule.value) / 100 : rule.value;
  if (options.capAtBase) amount = Math.min(amount, base);

  return {
    amount: roundMoney(amount),
    type: rule.type,
    rate: rule.value,
    source: useService ? "service" : "default",
    planId: config.planId,
    planName: config.planName,
  };
}

/** Human label, e.g. "7%" or "$15 flat". */
export function describeCommission(applied: AppliedCommission | null | undefined): string {
  if (!applied || applied.source === "none" || applied.rate <= 0) return "none";
  return applied.type === "percentage" ? `${applied.rate}%` : `$${applied.rate} flat`;
}

/** A subscription counts while it is active (cancelled / expired plans charge nothing). */
export function isSubscriptionActive(
  sub: { status?: string | null; planId?: string | null } | null | undefined
): boolean {
  if (!sub || !sub.planId) return false;
  return !sub.status || sub.status === "active" || sub.status === "renewed";
}

export type SettlementDirection = "platform_owes_mechanic" | "mechanic_owes_platform";
export type SettlementStatus = "pending" | "settled";

export interface JobSettlement {
  id: string;
  jobId: string;
  orderId: string;
  selectedService: string;
  currency: string;

  customerId: string;
  customerName?: string;
  workshopOwnerId: string;
  workshopName?: string;
  technicianId: string;
  technicianName?: string;

  workOrderAmount: number;
  customerServiceFee: number;
  customerServiceFeeRule: AppliedCommission;
  totalCharged: number;
  mechanicCommission: number;
  mechanicCommissionRule: AppliedCommission;
  mechanicNetEarning: number;
  platformRevenue: number;

  payMode: "cash" | "online";
  collectedBy: "platform" | "mechanic";
  direction: SettlementDirection;
  balanceDue: number;

  status: SettlementStatus;
  completedAt: string; // ISO
  createdAt?: unknown;
  settledAt?: string | null;
  settledBy?: string | null;
  settlementNote?: string | null;
}

export interface BuildSettlementInput {
  jobId: string;
  orderId?: string;
  selectedService?: string;
  currency?: string;
  customerId: string;
  customerName?: string;
  workshopOwnerId: string;
  workshopName?: string;
  technicianId: string;
  technicianName?: string;
  workOrderAmount: number;
  customerServiceFeeRule?: AppliedCommission | null;
  mechanicCommissionRule?: AppliedCommission | null;
  payMode?: string;
  completedAt?: string;
}

export function buildSettlement(input: BuildSettlementInput): JobSettlement {
  const workOrderAmount = roundMoney(input.workOrderAmount);
  const customerRule = input.customerServiceFeeRule || { ...ZERO_COMMISSION };
  const mechanicRule = input.mechanicCommissionRule || { ...ZERO_COMMISSION };
  const customerServiceFee = roundMoney(Math.max(0, customerRule.amount));
  const mechanicCommission = roundMoney(
    Math.min(Math.max(0, mechanicRule.amount), workOrderAmount)
  );
  const totalCharged = roundMoney(workOrderAmount + customerServiceFee);
  const mechanicNetEarning = roundMoney(workOrderAmount - mechanicCommission);
  const platformRevenue = roundMoney(customerServiceFee + mechanicCommission);

  const payMode: "cash" | "online" = input.payMode === "online" ? "online" : "cash";
  const collectedBy = payMode === "online" ? "platform" : "mechanic";
  const direction: SettlementDirection =
    collectedBy === "platform" ? "platform_owes_mechanic" : "mechanic_owes_platform";
  const balanceDue = collectedBy === "platform" ? mechanicNetEarning : platformRevenue;
  const id = input.jobId.replace(/^#/, "");

  return {
    id,
    jobId: input.jobId,
    orderId: input.orderId || id,
    selectedService: input.selectedService || "",
    currency: (input.currency || "USD").toUpperCase(),
    customerId: input.customerId,
    customerName: input.customerName || "",
    workshopOwnerId: input.workshopOwnerId,
    workshopName: input.workshopName || "",
    technicianId: input.technicianId,
    technicianName: input.technicianName || "",
    workOrderAmount,
    customerServiceFee,
    customerServiceFeeRule: { ...customerRule, amount: customerServiceFee },
    totalCharged,
    mechanicCommission,
    mechanicCommissionRule: { ...mechanicRule, amount: mechanicCommission },
    mechanicNetEarning,
    platformRevenue,
    payMode,
    collectedBy,
    direction,
    balanceDue,
    // Nothing to settle when no money changes hands between platform and workshop
    status: balanceDue > 0 ? "pending" : "settled",
    completedAt: input.completedAt || new Date().toISOString(),
    settledAt: balanceDue > 0 ? null : input.completedAt || new Date().toISOString(),
    settledBy: balanceDue > 0 ? null : "system",
    settlementNote: balanceDue > 0 ? null : "Nothing due",
  };
}

/** Net position per workshop: positive → platform owes workshop, negative → workshop owes platform. */
export function summarizeSettlements(rows: JobSettlement[]) {
  let pendingPlatformOwes = 0;
  let pendingMechanicOwes = 0;
  let platformRevenue = 0;
  let workOrderVolume = 0;
  let mechanicNet = 0;
  for (const r of rows) {
    platformRevenue += r.platformRevenue;
    workOrderVolume += r.workOrderAmount;
    mechanicNet += r.mechanicNetEarning;
    if (r.status !== "pending") continue;
    if (r.direction === "platform_owes_mechanic") pendingPlatformOwes += r.balanceDue;
    else pendingMechanicOwes += r.balanceDue;
  }
  return {
    jobs: rows.length,
    workOrderVolume: roundMoney(workOrderVolume),
    platformRevenue: roundMoney(platformRevenue),
    mechanicNet: roundMoney(mechanicNet),
    pendingPlatformOwes: roundMoney(pendingPlatformOwes),
    pendingMechanicOwes: roundMoney(pendingMechanicOwes),
    netPosition: roundMoney(pendingPlatformOwes - pendingMechanicOwes),
  };
}
