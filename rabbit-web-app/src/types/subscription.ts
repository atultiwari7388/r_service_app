export type SubscriptionPlanType = "trenoops" | "treno_mechanic";

export type SubscriptionDuration =
  | "Monthly"
  | "Quarterly"
  | "Semi-Annually"
  | "Yearly"
  | "Weekly"
  | "Lifetime"
  | string;

export interface CountryPriceConfig {
  countryCode: "USA" | "IN" | "MX" | "UK" | "AU" | string;
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
  { code: "IN", name: "India", currency: "INR", symbol: "₹", flag: "🇮🇳", defaultPrice: 3999 },
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
  if (normCurr === "INR") return "₹";
  if (normCurr === "GBP") return "£";
  if (normCurr === "EUR") return "€";
  if (normCurr === "AUD") return "A$";
  if (normCurr === "MXN") return "Mex$";
  return "$";
};

export interface SubscriptionPlan {
  id?: string;
  name: string;
  type: SubscriptionPlanType; // "trenoops" for Owners/Drivers, "treno_mechanic" for Mechanics
  description?: string;
  duration: SubscriptionDuration;
  price: number;
  discountPrice?: number | null;
  currency: string; // Base currency, e.g. "USD"

  // Multi-Currency / Country-Wise Pricing
  countryPrices?: Record<string, CountryPriceConfig>;

  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  features: string[];
  termsAndConditions: string[];

  // Owners / Drivers specific fields (type: "trenoops")
  maxVehicles?: number; // total vehicles included (-1 for unlimited)
  vehicleTypeScope?: "both" | "truck_only" | "trailer_only" | "all"; // Scope
  truckLimit?: number; // allowed trucks (-1 for unlimited)
  trailerLimit?: number; // allowed trailers (-1 for unlimited)

  // Mechanics specific fields (type: "treno_mechanic")
  maxBays?: number; // number of service bays (-1 for unlimited)
  serviceRadiusMiles?: number; // service coverage radius in miles (-1 for unlimited)
  priorityJobLeads?: boolean; // priority roadside & workshop repair leads
  directCarrierInvoicing?: boolean; // in-app direct carrier invoicing

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
