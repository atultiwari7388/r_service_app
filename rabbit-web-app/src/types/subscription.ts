export type SubscriptionPlanType = "trenoops" | "treno_mechanic";

export type SubscriptionDuration =
  | "Daily"
  | "2 Days"
  | "Monthly"
  | "Quarterly"
  | "Semi-Annually"
  | "Yearly"
  | "Weekly"
  | "Lifetime"
  | string;

export interface CountryPriceConfig {
  countryCode: "USA" | "CA" | "MX" | "UK" | "AU" | string;
  currency: string;
  symbol: string;
  price: number;
  discountPrice?: number | null;
  enabled: boolean;
}

export interface SupportedCountryItem {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  defaultPrice?: number;
}

export const SUPPORTED_PLAN_COUNTRIES: SupportedCountryItem[] = [
  { code: "USA", name: "United States", currency: "USD", symbol: "$", flag: "🇺🇸", defaultPrice: 49.99 },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$", flag: "🇨🇦", defaultPrice: 59.99 },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "Mex$", flag: "🇲🇽", defaultPrice: 899 },
  { code: "UK", name: "United Kingdom", currency: "GBP", symbol: "£", flag: "🇬🇧", defaultPrice: 39.99 },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$", flag: "🇦🇺", defaultPrice: 69.99 },
];

export const getCurrencySymbol = (currency?: string, countryCode?: string): string => {
  if (!currency && !countryCode) return "$";
  const normCurr = (currency || "").toUpperCase();
  const normCountry = (countryCode || "").toUpperCase();
  const match = SUPPORTED_PLAN_COUNTRIES.find(
    (c) => c.currency === normCurr || c.code === normCountry
  );
  if (match) return match.symbol;
  if (normCurr === "CAD") return "C$";
  if (normCurr === "GBP") return "£";
  if (normCurr === "EUR") return "€";
  if (normCurr === "AUD") return "A$";
  if (normCurr === "MXN") return "Mex$";
  if (normCurr === "INR") return "₹";
  return "$";
};

export type CommissionType = "percentage" | "flat";

export interface ServiceCommissionConfig {
  enabled: boolean;
  type: CommissionType;
  value: number; // e.g. 7 for 7% or 15 for $15 flat
}

export interface DefaultCommissionConfig {
  type: CommissionType;
  value: number;
}

export interface MechanicPagePermission {
  key: string;
  label: string;
  description: string;
  isCore?: boolean;
}

export const MECHANIC_PAGES_LIST: MechanicPagePermission[] = [
  { key: "dashboard", label: "Dashboard", description: "Home terminal & active status", isCore: true },
  { key: "jobs", label: "Jobs", description: "Highway repair leads & job board", isCore: true },
  { key: "my-services", label: "My Services", description: "Workshop service capabilities", isCore: true },
  { key: "profile", label: "My Profile", description: "Technician credentials & workshop info", isCore: true },
  { key: "invoice", label: "Invoice & Billing", description: "Fleet invoicing & accounts receivable" },
  { key: "check", label: "Vendor Checks", description: "Check registers & driver payouts" },
  { key: "inspections", label: "DOT Inspections", description: "90-day BIT & trailer inspections" },
  { key: "team", label: "Team Management", description: "Shop technician seats & bays" },
  { key: "reports", label: "Reports & Analytics", description: "Performance & fleet turnaround" },
  { key: "export", label: "Accounting Export", description: "QuickBooks & audit exports" },
];

export const CORE_ROADSIDE_PAGES = ["dashboard", "jobs", "my-services", "profile"];

export interface CancellationPenaltyConfig {
  enabled: boolean;
  gracePeriodMinutes: number; // e.g. 3 minutes - free cancellation window
  feeType: "percentage" | "flat"; // "%" percentage of estimated job, or "$" flat fee
  feeValue: number; // e.g. 5 for 5% or 25 for $25 flat
  penaltyRecipient?: "admin"; // Penalty goes directly to platform admin
  description?: string;
}

export interface GlobalVehiclePricingConfig {
  truckPriceUSD: number; // default: 10
  trailerPriceUSD: number; // default: 6
  currencyMultipliers?: {
    CAD?: number;
    MXN?: number;
    GBP?: number;
    AUD?: number;
  };
  updatedAt?: any;
  updatedBy?: string;
}

export const DEFAULT_GLOBAL_VEHICLE_PRICING: GlobalVehiclePricingConfig = {
  truckPriceUSD: 10,
  trailerPriceUSD: 6,
  currencyMultipliers: {
    CAD: 1.35,
    MXN: 18.0,
    GBP: 0.8,
    AUD: 1.5,
  },
};

export interface FleetVehicleTier {
  id: string; // unique row id
  fromVehicles: number; // 1 to 300
  toVehicles: number; // 1 to 300
  maxTrucks: number; // allowed trucks in this slab (e.g. 1)
  maxTrailers: number; // allowed trailers in this slab (e.g. 1)
  truckRate: number; // unit rate per truck (e.g. 10)
  trailerRate: number; // unit rate per trailer (e.g. 6)
  trucksSubtotal: number; // maxTrucks * truckRate
  trailersSubtotal: number; // maxTrailers * trailerRate
  subtotal: number; // trucksSubtotal + trailersSubtotal
  discountPrice?: number | null; // discounted final price (e.g. 13)
  finalPrice: number; // discountPrice && discountPrice > 0 ? discountPrice : subtotal
}

export interface SubscriptionPlan {
  id?: string;
  name: string;
  type: SubscriptionPlanType; // "trenoops" for Owners/Drivers, "treno_mechanic" for Mechanics
  description?: string;
  duration: SubscriptionDuration;
  price: number;
  discountPrice?: number | null;
  currency: string; // Base currency, e.g. "USD"

  // Free Tier Option
  isFree?: boolean;

  // Custom CTA button label on frontend (e.g. "Purchase Plan", "Subscribe Now", "Get Started")
  buttonName?: string;
  btnName?: string;

  // Multi-Currency / Country-Wise Pricing
  countryPrices?: Record<string, CountryPriceConfig>;

  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  features: string[];
  termsAndConditions: string[];

  // Owners / Drivers specific fields (type: "trenoops")
  fleetVehicleTiers?: FleetVehicleTier[]; // Dynamic vehicle slabs (e.g. 1-2, 3-5, 6-10)
  minVehicles?: number; // minimum vehicles in fleet tier range (e.g. 3 for "3 TO 5")
  maxVehicles?: number; // total vehicles included (-1 for unlimited, e.g. 5 for "3 TO 5")
  vehicleTypeScope?: "both" | "truck_only" | "trailer_only" | "all"; // Scope
  truckLimit?: number; // allowed trucks (-1 for unlimited)
  trailerLimit?: number; // allowed trailers (-1 for unlimited)
  fleetTierId?: string; // e.g. "1-to-1", "3-to-5", "11-to-20"
  fleetTierLabel?: string; // e.g. "3 TO 5"
  discountCoupon?: string; // e.g. "TRENO50" | "TRENO100"

  // Mechanics specific fields (type: "treno_mechanic")
  mechanicCategory?: "roadside" | "company"; // Roadside mechanic vs Registered company
  maxBays?: number; // number of service bays (-1 for unlimited)
  serviceRadiusMiles?: number; // service coverage radius in miles (-1 for unlimited)
  priorityJobLeads?: boolean; // priority roadside & workshop repair leads
  directCarrierInvoicing?: boolean; // in-app direct carrier invoicing

  // Commission configuration (per job on selected services)
  defaultCommission?: DefaultCommissionConfig;
  serviceCommissions?: Record<string, ServiceCommissionConfig>;

  // Page RBAC Access Permissions
  allowedPages?: string[]; // e.g. ["dashboard", "find-jobs", "my-services", "profile"]
  hasAllPagesAccess?: boolean; // true for company registered plans (all current + future pages)

  // Job Cancellation Penalty Policy
  cancellationPenalty?: CancellationPenaltyConfig;

  createdAt?: any;
  updatedAt?: any;
}

export type SubscriberUserType = "mechanic" | "driver" | "owner";

export interface SubscriptionPurchaseRecord {
  id: string; // purchaseId or docId
  userId: string;
  userEmail: string;
  userName?: string;
  businessName?: string; // workshopName or companyName
  userPhone?: string;
  userLocation?: string;
  userType: SubscriberUserType;
  planId: string;
  planName: string;
  planType: SubscriptionPlanType;
  duration: string;
  amountPaid: number;
  originalPrice?: number;
  currency: string;
  status: "active" | "expired" | "cancelled" | "pending";
  autoPay?: boolean;
  purchasedAt?: any;
  purchasedTimestamp?: number;
  currentPeriodStart?: any;
  currentPeriodEnd?: any;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  features?: string[];
  termsAndConditions?: string[];

  // Limits
  maxBays?: number;
  serviceRadiusMiles?: number;
  priorityJobLeads?: boolean;
  directCarrierInvoicing?: boolean;
  maxVehicles?: number;
  truckLimit?: number;
  trailerLimit?: number;
  vehicleTypeScope?: string;

  updatedAt?: any;
}
