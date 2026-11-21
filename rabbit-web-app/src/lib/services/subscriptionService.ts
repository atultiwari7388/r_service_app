import { db } from "@/lib/firebase";
import { isSubscriptionBypassedEmail } from "@/lib/adminConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  SubscriptionPlan,
  GlobalVehiclePricingConfig,
  DEFAULT_GLOBAL_VEHICLE_PRICING,
  FleetVehicleTier,
  PackageVehicleSlab,
  getCurrencySymbol,
} from "@/types/subscription";

/**
 * Fetch all active plans meant for Fleet Owners & Drivers (type === "trenoops").
 */
export async function fetchOwnerSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plansRef = collection(db, "subscriptionPlans");
    const q = query(
      plansRef,
      where("type", "==", "trenoops"),
      where("isActive", "==", true)
    );
    const snap = await getDocs(q);

    const plans: SubscriptionPlan[] = [];
    snap.forEach((docSnap) => {
      plans.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as SubscriptionPlan);
    });

    // Sort by sortOrder if available, else by price
    return plans.sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return (a.price || 0) - (b.price || 0);
    });
  } catch (error) {
    console.error("Error fetching owner subscription plans:", error);
    return [];
  }
}

/**
 * Fetch current Global Vehicle Pricing config from `appSettings/globalVehiclePricing`.
 */
export async function fetchGlobalVehiclePricing(): Promise<GlobalVehiclePricingConfig> {
  try {
    const snap = await getDoc(doc(db, "appSettings", "globalVehiclePricing"));
    if (snap.exists()) {
      const data = snap.data() as GlobalVehiclePricingConfig;
      return {
        truckPriceUSD: data.truckPriceUSD ?? DEFAULT_GLOBAL_VEHICLE_PRICING.truckPriceUSD,
        trailerPriceUSD: data.trailerPriceUSD ?? DEFAULT_GLOBAL_VEHICLE_PRICING.trailerPriceUSD,
        currencyMultipliers: data.currencyMultipliers || DEFAULT_GLOBAL_VEHICLE_PRICING.currencyMultipliers,
      };
    }
  } catch (error) {
    console.warn("Error fetching global vehicle pricing, using default:", error);
  }
  return DEFAULT_GLOBAL_VEHICLE_PRICING;
}

/**
 * Parses numeric bounds from vehicleRange string (e.g. "1 to 5" -> { from: 1, to: 5 }).
 */
export function parseVehicleRange(rangeStr: string): { from: number; to: number } {
  if (!rangeStr) return { from: 1, to: 5 };

  const clean = rangeStr.toLowerCase().trim();

  // Pattern "1 to 5" or "1-5"
  const match = clean.match(/(\d+)\s*(?:to|-)\s*(\d+)/i);
  if (match) {
    return {
      from: parseInt(match[1], 10),
      to: parseInt(match[2], 10),
    };
  }

  // Pattern "above 500"
  if (clean.includes("above")) {
    const num = clean.match(/\d+/);
    const from = num ? parseInt(num[0], 10) : 500;
    return { from, to: from + 100 };
  }

  // Fallback
  return { from: 1, to: 5 };
}

/**
 * Calculate dynamic price for given fleet composition (trucks + trailers) against a plan
 * using plan's fleetVehicleTiers or global vehicle unit rates.
 */
export function calculateFleetCompositionPrice(params: {
  plan: SubscriptionPlan;
  trucks: number;
  trailers: number;
  globalPricing?: GlobalVehiclePricingConfig;
}): {
  subtotal: number;
  discountPrice: number | null;
  finalPrice: number;
  matchedTier?: FleetVehicleTier;
  truckRate: number;
  trailerRate: number;
} {
  const { plan, trucks, trailers, globalPricing } = params;
  const totalVehicles = trucks + trailers;

  // 1. Try to find matching tier in plan.fleetVehicleTiers
  if (plan.fleetVehicleTiers && plan.fleetVehicleTiers.length > 0) {
    const tier = plan.fleetVehicleTiers.find(
      (t) => totalVehicles >= t.fromVehicles && totalVehicles <= t.toVehicles
    );

    if (tier) {
      const truckRate = tier.truckRate || globalPricing?.truckPriceUSD || 10;
      const trailerRate = tier.trailerRate || globalPricing?.trailerPriceUSD || 6;
      const subtotal = trucks * truckRate + trailers * trailerRate;

      // Calculate proportional discount if tier had a discount
      let finalPrice = subtotal;
      let discountPrice: number | null = null;

      if (tier.discountPrice && tier.subtotal > 0 && tier.discountPrice < tier.subtotal) {
        const discountRatio = tier.discountPrice / tier.subtotal;
        discountPrice = Math.round(subtotal * discountRatio * 100) / 100;
        finalPrice = discountPrice;
      }

      return {
        subtotal,
        discountPrice,
        finalPrice,
        matchedTier: tier,
        truckRate,
        trailerRate,
      };
    }
  }

  // 2. Fallback to global unit rates
  const truckRate = globalPricing?.truckPriceUSD ?? 10;
  const trailerRate = globalPricing?.trailerPriceUSD ?? 6;
  const subtotal = trucks * truckRate + trailers * trailerRate;

  let finalPrice = subtotal;
  let discountPrice: number | null = null;

  if (plan.discountPrice !== undefined && plan.discountPrice !== null && plan.price > 0) {
    const discountRatio = plan.discountPrice / plan.price;
    discountPrice = Math.round(subtotal * discountRatio * 100) / 100;
    finalPrice = discountPrice;
  }

  return {
    subtotal,
    discountPrice,
    finalPrice,
    truckRate,
    trailerRate,
  };
}

export interface PackagePriceCalculationResult {
  subtotal: number;
  discountPrice: number | null;
  finalPrice: number;
  matchedSlab?: PackageVehicleSlab;
  truckSlab?: PackageVehicleSlab | null;
  trailerSlab?: PackageVehicleSlab | null;
  isExactMatch?: boolean;
  billingCycle: "Monthly" | "Yearly";
  currency: string;
  currencySymbol: string;
  trucksCount: number;
  trailersCount: number;
  truckRate: number;
  truckDiscountRate: number | null;
  trailerRate: number;
  trailerDiscountRate: number | null;
  truckPayable: number;
  trailerPayable: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponPercent?: number;
  couponError?: string | null;
}

/**
 * Finds the package vehicle slab matching a given unit quantity.
 */
export function findMatchingSlabForQuantity(
  quantity: number,
  slabs?: PackageVehicleSlab[]
): PackageVehicleSlab | null {
  if (!slabs || slabs.length === 0 || quantity <= 0) return null;
  const sorted = [...slabs].sort((a, b) => a.fromUnit - b.fromUnit);
  const match = sorted.find((s) => quantity >= s.fromUnit && quantity <= s.toUnit);
  return match || null;
}

/**
 * Normalizes any country string (e.g. "USA", "usa", "US", "United States", "canada", "CA", "Mexico", etc.)
 * into standard plan country codes: "USA", "CA", "MX", "UK", "AU".
 */
export function normalizeCountryCode(country?: string | null): string {
  if (!country) return "USA";
  const clean = country.trim().toLowerCase();
  if (
    clean === "usa" ||
    clean === "us" ||
    clean === "united states" ||
    clean === "united states of america" ||
    clean === "america"
  ) {
    return "USA";
  }
  if (clean === "ca" || clean === "canada" || clean === "can") {
    return "CA";
  }
  if (clean === "au" || clean === "australia" || clean === "aus") {
    return "AU";
  }
  if (clean === "mx" || clean === "mexico" || clean === "mex") {
    return "MX";
  }
  if (
    clean === "uk" ||
    clean === "gb" ||
    clean === "great britain" ||
    clean === "united kingdom" ||
    clean === "england"
  ) {
    return "UK";
  }
  if (clean.length <= 3) {
    return clean.toUpperCase();
  }
  return "USA";
}

/**
 * Calculates package-based pricing for given fleet composition (trucks + trailers)
 * where Truck quantity matches a Truck Package Slab and Trailer quantity matches a Trailer Package Slab independently.
 * Also evaluates static coupon codes:
 * - TRENO100: 100% OFF (Monthly only)
 * - TRENO50: 50% OFF (Monthly only)
 */
export function calculatePackageSlabPrice(params: {
  plan: SubscriptionPlan;
  trucks: number;
  trailers: number;
  billingCycle?: "Monthly" | "Yearly";
  countryCode?: string;
  selectedSlab?: PackageVehicleSlab | null;
  globalPricing?: GlobalVehiclePricingConfig;
  couponCode?: string | null;
}): PackagePriceCalculationResult {
  const {
    plan,
    trucks,
    trailers,
    billingCycle = "Monthly",
    countryCode = "USA",
    globalPricing,
    couponCode,
  } = params;

  const cCode = normalizeCountryCode(countryCode);
  const isUSA = cCode === "USA";
  const isMonthly = billingCycle === "Monthly";

  const slabs = plan.packageVehicleSlabs || [];

  if (slabs.length > 0) {
    // 1. Independent slab lookup for Trucks & Trailers
    const truckSlab = findMatchingSlabForQuantity(trucks, slabs);
    const trailerSlab = findMatchingSlabForQuantity(trailers, slabs);

    let currency = plan.currency || "USD";
    let currencySymbol = getCurrencySymbol(plan.currency, cCode);

    // Truck Rates
    let rawTruckRate = 0;
    let rawTruckDisc: number | null = null;
    if (truckSlab && trucks > 0) {
      const countryData =
        truckSlab.countryRates?.[cCode] ||
        (!isUSA ? null : truckSlab.countryRates?.["US"]) ||
        null;
      if (countryData) {
        currency = countryData.currency;
        currencySymbol = countryData.symbol;
        rawTruckRate = isMonthly
          ? countryData.truckMonthlyRate
          : countryData.truckYearlyRate;
        rawTruckDisc = isMonthly
          ? (countryData.truckMonthlyDiscount ?? null)
          : (countryData.truckYearlyDiscount ?? null);
      } else {
        rawTruckRate = isMonthly
          ? truckSlab.truckMonthlyRate
          : truckSlab.truckYearlyRate;
        rawTruckDisc = isMonthly
          ? (truckSlab.truckMonthlyDiscount ?? null)
          : (truckSlab.truckYearlyDiscount ?? null);
      }
    }

    // Trailer Rates
    let rawTrailerRate = 0;
    let rawTrailerDisc: number | null = null;
    if (trailerSlab && trailers > 0) {
      const countryData =
        trailerSlab.countryRates?.[cCode] ||
        (!isUSA ? null : trailerSlab.countryRates?.["US"]) ||
        null;
      if (countryData) {
        if (!truckSlab) {
          currency = countryData.currency;
          currencySymbol = countryData.symbol;
        }
        rawTrailerRate = isMonthly
          ? countryData.trailerMonthlyRate
          : countryData.trailerYearlyRate;
        rawTrailerDisc = isMonthly
          ? (countryData.trailerMonthlyDiscount ?? null)
          : (countryData.trailerYearlyDiscount ?? null);
      } else {
        rawTrailerRate = isMonthly
          ? trailerSlab.trailerMonthlyRate
          : trailerSlab.trailerYearlyRate;
        rawTrailerDisc = isMonthly
          ? (trailerSlab.trailerMonthlyDiscount ?? null)
          : (trailerSlab.trailerYearlyDiscount ?? null);
      }
    }

    const truckPayableUnit =
      rawTruckDisc && rawTruckDisc > 0 ? rawTruckDisc : rawTruckRate;
    const trailerPayableUnit =
      rawTrailerDisc && rawTrailerDisc > 0 ? rawTrailerDisc : rawTrailerRate;

    const truckSubtotal = trucks > 0 ? rawTruckRate : 0;
    const truckPayable = trucks > 0 ? truckPayableUnit : 0;

    const trailerSubtotal = trailers > 0 ? rawTrailerRate : 0;
    const trailerPayable = trailers > 0 ? trailerPayableUnit : 0;

    const baseSubtotal = truckSubtotal + trailerSubtotal;
    let baseFinalPrice = truckPayable + trailerPayable;

    // 2. Coupon Validation & Discount Calculation
    let couponDiscountAmount = 0;
    let couponPercent = 0;
    let couponError: string | null = null;
    const cleanCoupon = (couponCode || "").trim().toUpperCase();

    if (cleanCoupon) {
      if (!isMonthly) {
        couponError = "Coupons are valid only on Monthly billing plans.";
      } else if (cleanCoupon === "TRENO100") {
        couponPercent = 100;
        couponDiscountAmount = baseFinalPrice;
        baseFinalPrice = 0;
      } else if (cleanCoupon === "TRENO50") {
        couponPercent = 50;
        couponDiscountAmount = Math.round(baseFinalPrice * 0.5 * 100) / 100;
        baseFinalPrice = Math.max(0, baseFinalPrice - couponDiscountAmount);
      } else {
        couponError = "Invalid coupon code.";
      }
    }

    const discountPrice =
      baseFinalPrice < baseSubtotal ? baseFinalPrice : null;

    return {
      subtotal: baseSubtotal,
      discountPrice,
      finalPrice: baseFinalPrice,
      matchedSlab: truckSlab || trailerSlab || undefined,
      truckSlab,
      trailerSlab,
      billingCycle,
      currency,
      currencySymbol,
      trucksCount: trucks,
      trailersCount: trailers,
      truckRate: rawTruckRate,
      truckDiscountRate: rawTruckDisc,
      trailerRate: rawTrailerRate,
      trailerDiscountRate: rawTrailerDisc,
      truckPayable,
      trailerPayable,
      couponCode: cleanCoupon || null,
      couponDiscountAmount,
      couponPercent,
      couponError,
    };
  }

  // Fallback to legacy calculation
  const legacy = calculateFleetCompositionPrice({
    plan,
    trucks,
    trailers,
    globalPricing,
  });

  const currencySymbol = getCurrencySymbol(plan.currency, cCode);
  const multiplier = billingCycle === "Yearly" ? 10 : 1;

  const baseSubtotal = legacy.subtotal * multiplier;
  let baseFinalPrice = legacy.finalPrice * multiplier;

  // Coupon application on legacy fallback
  let couponDiscountAmount = 0;
  let couponPercent = 0;
  let couponError: string | null = null;
  const cleanCoupon = (couponCode || "").trim().toUpperCase();

  if (cleanCoupon) {
    if (!isMonthly) {
      couponError = "Coupons are valid only on Monthly billing plans.";
    } else if (cleanCoupon === "TRENO100") {
      couponPercent = 100;
      couponDiscountAmount = baseFinalPrice;
      baseFinalPrice = 0;
    } else if (cleanCoupon === "TRENO50") {
      couponPercent = 50;
      couponDiscountAmount = Math.round(baseFinalPrice * 0.5 * 100) / 100;
      baseFinalPrice = Math.max(0, baseFinalPrice - couponDiscountAmount);
    } else {
      couponError = "Invalid coupon code.";
    }
  }

  const discountPrice =
    baseFinalPrice < baseSubtotal ? baseFinalPrice : null;

  return {
    subtotal: baseSubtotal,
    discountPrice,
    finalPrice: baseFinalPrice,
    billingCycle,
    currency: plan.currency || "USD",
    currencySymbol,
    trucksCount: trucks,
    trailersCount: trailers,
    truckRate: legacy.truckRate * multiplier,
    truckDiscountRate: null,
    trailerRate: legacy.trailerRate * multiplier,
    trailerDiscountRate: null,
    truckPayable: trucks * legacy.truckRate * multiplier,
    trailerPayable: trailers * legacy.trailerRate * multiplier,
    couponCode: cleanCoupon || null,
    couponDiscountAmount,
    couponPercent,
    couponError,
  };
}

/**
 * Checks if a user or owner document has an active subscription.
 * Validates:
 * 1. Email whitelist bypass (e.g. atul2.mylexinfotech@gmail.com)
 * 2. isSubscriptionPurchase truthy (boolean or "true" string)
 * 3. currentSubscription.status in ["active", "trialing", "paid", "complete", "completed", "succeeded"]
 * 4. currentSubscription has a valid planId or planName
 * 5. Direct planId or subscribedPlanId on document
 */
export function checkHasActiveSubscription(data: any): boolean {
  if (!data) return false;

  // 1. Email whitelist bypass
  if (data.email && isSubscriptionBypassedEmail(data.email)) return true;

  // 2. Direct boolean or truthy string for subscription purchase indicators
  if (
    data.isSubscriptionPurchase === true ||
    String(data.isSubscriptionPurchase).toLowerCase() === "true" ||
    data.isSubscriptionPurchased === true ||
    String(data.isSubscriptionPurchased).toLowerCase() === "true" ||
    data.subscriptionPurchased === true ||
    String(data.subscriptionPurchased).toLowerCase() === "true" ||
    data.subscription_purchased === true ||
    String(data.subscription_purchased).toLowerCase() === "true" ||
    data.isSubscribed === true ||
    String(data.isSubscribed).toLowerCase() === "true" ||
    data.hasActiveSubscription === true ||
    String(data.hasActiveSubscription).toLowerCase() === "true" ||
    data.planPurchased === true ||
    data.isPlanPurchased === true
  ) {
    return true;
  }

  // 3. Subscription snapshot object on user doc (currentSubscription, subscription, plan, currentPlan)
  const sub =
    data.currentSubscription ||
    data.subscription ||
    data.currentPlan ||
    data.plan ||
    data.activeSubscription;

  if (sub && typeof sub === "object") {
    const status = String(sub.status || "").toLowerCase().trim();
    if (
      status === "active" ||
      status === "trialing" ||
      status === "paid" ||
      status === "complete" ||
      status === "completed" ||
      status === "succeeded" ||
      status === "open"
    ) {
      return true;
    }
    // If status is empty/missing but a valid plan identifier exists
    if (!status && (sub.planId || sub.planName || sub.name || sub.id)) {
      return true;
    }
  }

  // 4. Any direct plan identifier or name on the user document itself
  if (
    data.planId ||
    data.subscribedPlanId ||
    data.currentPlanId ||
    data.planName ||
    data.subscribedPlanName
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a given user document belongs to a Team Member.
 * Returns true if:
 * - isTeamMember === true
 * - createdBy points to another user UID
 * - role is one of the team member roles (Dispatcher, SubOwner, Sub-Owner, Manager, Staff, Accountant, Safety, etc.)
 */
export function isUserTeamMember(data: any, currentUid?: string): boolean {
  if (!data) return false;
  if (data.isTeamMember === true) return true;

  const role = typeof data.role === "string" ? data.role.trim() : "";
  const teamMemberRoles = [
    "dispatcher",
    "subowner",
    "sub-owner",
    "manager",
    "co-owner",
    "staff",
    "accountant",
    "safety",
  ];
  if (role && teamMemberRoles.includes(role.toLowerCase())) {
    return true;
  }

  // If createdBy is provided and is different from current user uid
  const uid = currentUid || data.uid;
  if (data.createdBy && uid && data.createdBy !== uid) {
    return true;
  }

  if (role && role.toLowerCase() !== "owner" && data.createdBy) {
    return true;
  }

  return false;
}

/**
 * Determines whether a user is a Company Owner.
 */
export function isUserOwner(data: any, currentUid?: string): boolean {
  if (!data) return false;
  if (isUserTeamMember(data, currentUid)) return false;
  const role = typeof data.role === "string" ? data.role.trim().toLowerCase() : "";
  if (role === "owner" || data.isOwner === true) return true;

  const uid = currentUid || data.uid;
  if (!data.createdBy || (uid && data.createdBy === uid)) {
    return true;
  }
  return false;
}
