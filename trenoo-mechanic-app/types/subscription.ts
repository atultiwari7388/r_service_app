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
  paymentMethod: string;
  maxBays?: number;
  serviceRadiusMiles?: number;
  priorityJobLeads?: boolean;
  directCarrierInvoicing?: boolean;
  features?: string[];
  termsAndConditions?: string[];
  createdAt?: any;
}
