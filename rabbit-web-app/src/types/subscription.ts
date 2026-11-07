export type SubscriptionPlanType = "trenoops" | "treno_mechanic";

export type SubscriptionDuration =
  | "Monthly"
  | "Quarterly"
  | "Semi-Annually"
  | "Yearly"
  | "Weekly"
  | "Lifetime"
  | string;

export interface SubscriptionPlan {
  id?: string;
  name: string;
  type: SubscriptionPlanType; // "trenoops" for Owners/Drivers, "treno_mechanic" for Mechanics
  description?: string;
  duration: SubscriptionDuration;
  price: number;
  discountPrice?: number | null;
  currency: string; // e.g. "USD"
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
