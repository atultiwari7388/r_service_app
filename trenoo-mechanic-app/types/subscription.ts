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

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: SubscriptionPlanType;
  description?: string;
  duration: string; // e.g. "Monthly", "Quarterly", "Yearly"
  price: number;
  discountPrice?: number | null;
  currency: string; // e.g. "USD"
  countryPrices?: Record<string, CountryPriceConfig>;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  features: string[];
  termsAndConditions: string[];

  // Mechanic specific fields
  maxBays?: number; // -1 for unlimited
  serviceRadiusMiles?: number; // -1 for nationwide/unlimited
  priorityJobLeads?: boolean;
  directCarrierInvoicing?: boolean;

  // Owner/Driver specific fields (for parity)
  maxVehicles?: number;
  vehicleTypeScope?: string;
  truckLimit?: number;
  trailerLimit?: number;

  createdAt?: any;
  updatedAt?: any;
}

export interface MechanicCurrentSubscription {
  planId: string;
  planName: string;
  duration: string;
  amountPaid: number;
  originalPrice: number;
  discountPrice?: number | null;
  currency: string;
  purchasedAt: string;
  purchasedTimestamp: number;
  status: "active" | "expired" | "renewed" | "cancelled";
  autoPay?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  currentPeriodEnd?: string;
  maxBays?: number;
  serviceRadiusMiles?: number;
  priorityJobLeads?: boolean;
  directCarrierInvoicing?: boolean;
  features?: string[];
  termsAndConditions?: string[];
}

export interface MechanicSubscriptionHistoryItem {
  id?: string;
  planId: string;
  planName: string;
  duration: string;
  amountPaid: number;
  originalPrice: number;
  discountPrice?: number | null;
  currency: string;
  purchasedAt: string;
  purchasedTimestamp: number;
  status: "active" | "expired" | "renewed" | "cancelled";
  paymentMethod: string; // "stripe" | "direct_activation"
  autoPay?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  currentPeriodEnd?: string;
  maxBays?: number;
  serviceRadiusMiles?: number;
  priorityJobLeads?: boolean;
  directCarrierInvoicing?: boolean;
  features?: string[];
  termsAndConditions?: string[];
  createdAt?: any;
}

/**
 * Schema for Global Collection `subscriptionPurchases`
 * Stores platform-wide purchases across all users (mechanics, owners, drivers).
 */
export interface GlobalSubscriptionPurchase {
  id?: string;
  purchaseId: string; // Stripe Subscription ID or unique session ID
  userId: string; // mechanicId / driverId
  userEmail: string;
  userType: "mechanic" | "owner_driver";
  planId: string;
  planName: string;
  duration: string;
  amountPaid: number;
  currency: string;
  status: "active" | "expired" | "cancelled" | "past_due";
  autoPay: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  purchasedAt: string; // ISO 8601
  purchasedTimestamp: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  features?: string[];
  termsAndConditions?: string[];
  createdAt?: any;
  updatedAt?: any;
}
