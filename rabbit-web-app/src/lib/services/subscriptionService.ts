import { db } from "@/lib/firebase";
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
 * matching the user's unit count to a plan's packageVehicleSlabs.
 */
export function calculatePackageSlabPrice(params: {
  plan: SubscriptionPlan;
  trucks: number;
  trailers: number;
  billingCycle?: "Monthly" | "Yearly";
  countryCode?: string;
  selectedSlab?: PackageVehicleSlab | null;
  globalPricing?: GlobalVehiclePricingConfig;
}): PackagePriceCalculationResult {
  const { plan, trucks, trailers, billingCycle = "Monthly", countryCode = "USA", selectedSlab, globalPricing } = params;
  const totalVehicles = trucks + trailers;

  const cCode = normalizeCountryCode(countryCode);
  const isUSA = cCode === "USA";

  // If plan has packageVehicleSlabs
  if (plan.packageVehicleSlabs && plan.packageVehicleSlabs.length > 0) {
    let slab: PackageVehicleSlab | undefined;

    // If an explicit slab was chosen by the user, find that slab in this plan
    if (selectedSlab) {
      slab = plan.packageVehicleSlabs.find(
        (s) => s.id === selectedSlab.id || (s.fromUnit === selectedSlab.fromUnit && s.toUnit === selectedSlab.toUnit)
      );
    }

    // Otherwise find slab matching unit count
    if (!slab) {
      slab = plan.packageVehicleSlabs.find(
        (s) => totalVehicles >= s.fromUnit && totalVehicles <= s.toUnit
      );
    }

    const isExactMatch = slab ? totalVehicles >= slab.fromUnit && totalVehicles <= slab.toUnit : false;

    // If totalVehicles exceeds highest slab or is 0 and no slab selected, pick closest boundary
    if (!slab && totalVehicles > 0) {
      const sorted = [...plan.packageVehicleSlabs].sort((a, b) => a.fromUnit - b.fromUnit);
      if (totalVehicles < sorted[0].fromUnit) {
        slab = sorted[0];
      } else {
        slab = sorted[sorted.length - 1];
      }
    }

    if (slab) {
      // Look up countryData from slab.countryRates (works for USA as well as international)
      const countryData = slab.countryRates?.[cCode] || (!isUSA ? null : slab.countryRates?.["US"]) || null;

      const currency = countryData ? countryData.currency : (plan.currency || "USD");
      const currencySymbol = countryData ? countryData.symbol : getCurrencySymbol(plan.currency, cCode);

      const isMonthly = billingCycle === "Monthly";

      // Raw rates from slab
      let rawTruckRate = 0;
      let rawTruckDisc: number | null = null;
      let rawTrailerRate = 0;
      let rawTrailerDisc: number | null = null;

      if (countryData) {
        rawTruckRate = isMonthly ? countryData.truckMonthlyRate : countryData.truckYearlyRate;
        rawTruckDisc = isMonthly ? (countryData.truckMonthlyDiscount ?? null) : (countryData.truckYearlyDiscount ?? null);
        rawTrailerRate = isMonthly ? countryData.trailerMonthlyRate : countryData.trailerYearlyRate;
        rawTrailerDisc = isMonthly ? (countryData.trailerMonthlyDiscount ?? null) : (countryData.trailerYearlyDiscount ?? null);
      } else {
        rawTruckRate = isMonthly ? slab.truckMonthlyRate : slab.truckYearlyRate;
        rawTruckDisc = isMonthly ? (slab.truckMonthlyDiscount ?? null) : (slab.truckYearlyDiscount ?? null);
        rawTrailerRate = isMonthly ? slab.trailerMonthlyRate : slab.trailerYearlyRate;
        rawTrailerDisc = isMonthly ? (slab.trailerMonthlyDiscount ?? null) : (slab.trailerYearlyDiscount ?? null);
      }

      const truckPayableUnit = rawTruckDisc && rawTruckDisc > 0 ? rawTruckDisc : rawTruckRate;
      const trailerPayableUnit = rawTrailerDisc && rawTrailerDisc > 0 ? rawTrailerDisc : rawTrailerRate;

      // Flat package calculation:
      // If user has > 0 trucks, they pay the flat truck package rate for this slab.
      // If user has > 0 trailers, they pay the flat trailer package rate for this slab.
      const truckSubtotal = trucks > 0 ? rawTruckRate : 0;
      const truckPayable = trucks > 0 ? truckPayableUnit : 0;

      const trailerSubtotal = trailers > 0 ? rawTrailerRate : 0;
      const trailerPayable = trailers > 0 ? trailerPayableUnit : 0;

      const subtotal = truckSubtotal + trailerSubtotal;
      const finalPrice = truckPayable + trailerPayable;
      const discountPrice = finalPrice < subtotal ? finalPrice : null;

      return {
        subtotal,
        discountPrice,
        finalPrice,
        matchedSlab: slab,
        isExactMatch,
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
      };
    }
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

  const subtotal = legacy.subtotal * multiplier;
  const finalPrice = legacy.finalPrice * multiplier;
  const discountPrice = legacy.discountPrice !== null ? legacy.discountPrice * multiplier : null;

  return {
    subtotal,
    discountPrice,
    finalPrice,
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
  };
}
