export type SubscriptionPlanType = "trenoops" | "treno_mechanic";

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: SubscriptionPlanType;
  description?: string;
  duration: string; // e.g. "Monthly", "Quarterly", "Yearly"
  price: number;
  discountPrice?: number | null;
  currency: string; // e.g. "USD"
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
