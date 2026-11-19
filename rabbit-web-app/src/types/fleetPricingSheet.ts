/**
 * Official Treno Fleet Pricing Matrix (Truck & Trailer Rate Card)
 * Matches the official spreadsheet specification:
 * - 10 Fleet Size Tiers (1 to 200 units)
 * - Monthly and Yearly rates for Trucks & Trailers
 * - Official discount coupons: TRENO100 (100% off) & TRENO50 (50% off yearly)
 */

export interface FleetTierPricing {
  tierId: string;
  label: string; // "1 TO 1", "2 TO 2", "3 TO 5", etc.
  minVehicles: number;
  maxVehicles: number;
  monthlyTruckPrice: number;
  yearlyTruckPrice: number;
  monthlyTrailerPrice: number;
  yearlyTrailerPrice: number;
  couponDec31: "TRENO100";
  couponJan1: "TRENO50";
  discountedYearlyTruckPrice: number; // 50% discount on yearly truck
  discountedYearlyTrailerPrice: number; // 50% discount on yearly trailer
}

export const FLEET_PRICING_TIERS: FleetTierPricing[] = [
  {
    tierId: "1-to-1",
    label: "1 TO 1",
    minVehicles: 1,
    maxVehicles: 1,
    monthlyTruckPrice: 10,
    yearlyTruckPrice: 120,
    monthlyTrailerPrice: 6,
    yearlyTrailerPrice: 72,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 60,
    discountedYearlyTrailerPrice: 36,
  },
  {
    tierId: "2-to-2",
    label: "2 TO 2",
    minVehicles: 2,
    maxVehicles: 2,
    monthlyTruckPrice: 20,
    yearlyTruckPrice: 240,
    monthlyTrailerPrice: 12,
    yearlyTrailerPrice: 144,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 120,
    discountedYearlyTrailerPrice: 72,
  },
  {
    tierId: "3-to-5",
    label: "3 TO 5",
    minVehicles: 3,
    maxVehicles: 5,
    monthlyTruckPrice: 40,
    yearlyTruckPrice: 480,
    monthlyTrailerPrice: 24,
    yearlyTrailerPrice: 288,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 240,
    discountedYearlyTrailerPrice: 144,
  },
  {
    tierId: "6-to-10",
    label: "6 TO 10",
    minVehicles: 6,
    maxVehicles: 10,
    monthlyTruckPrice: 60,
    yearlyTruckPrice: 720,
    monthlyTrailerPrice: 32,
    yearlyTrailerPrice: 360,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 360,
    discountedYearlyTrailerPrice: 180,
  },
  {
    tierId: "11-to-20",
    label: "11 TO 20",
    minVehicles: 11,
    maxVehicles: 20,
    monthlyTruckPrice: 100,
    yearlyTruckPrice: 1200,
    monthlyTrailerPrice: 41,
    yearlyTrailerPrice: 600,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 600,
    discountedYearlyTrailerPrice: 300,
  },
  {
    tierId: "21-to-30",
    label: "21 TO 30",
    minVehicles: 21,
    maxVehicles: 30,
    monthlyTruckPrice: 160,
    yearlyTruckPrice: 1920,
    monthlyTrailerPrice: 50,
    yearlyTrailerPrice: 960,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 960,
    discountedYearlyTrailerPrice: 480,
  },
  {
    tierId: "31-to-50",
    label: "31 TO 50",
    minVehicles: 31,
    maxVehicles: 50,
    monthlyTruckPrice: 240,
    yearlyTruckPrice: 2880,
    monthlyTrailerPrice: 59,
    yearlyTrailerPrice: 1440,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 1440,
    discountedYearlyTrailerPrice: 720,
  },
  {
    tierId: "51-to-75",
    label: "51 TO 75",
    minVehicles: 51,
    maxVehicles: 75,
    monthlyTruckPrice: 350,
    yearlyTruckPrice: 4200,
    monthlyTrailerPrice: 68,
    yearlyTrailerPrice: 1920,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 2100,
    discountedYearlyTrailerPrice: 960,
  },
  {
    tierId: "76-to-100",
    label: "76 TO 100",
    minVehicles: 76,
    maxVehicles: 100,
    monthlyTruckPrice: 400,
    yearlyTruckPrice: 4800,
    monthlyTrailerPrice: 77,
    yearlyTrailerPrice: 2400,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 2400,
    discountedYearlyTrailerPrice: 1200,
  },
  {
    tierId: "101-to-200",
    label: "101 TO 200",
    minVehicles: 101,
    maxVehicles: 200,
    monthlyTruckPrice: 600,
    yearlyTruckPrice: 7200,
    monthlyTrailerPrice: 86,
    yearlyTrailerPrice: 3600,
    couponDec31: "TRENO100",
    couponJan1: "TRENO50",
    discountedYearlyTruckPrice: 3600,
    discountedYearlyTrailerPrice: 1800,
  },
];

export interface CalculatedFleetPlanDefaults {
  name: string;
  description: string;
  duration: "Monthly" | "Yearly";
  price: number;
  discountPrice?: number | null;
  minVehicles: number;
  maxVehicles: number;
  truckLimit: number;
  trailerLimit: number;
  vehicleTypeScope: "truck_only" | "trailer_only" | "both";
  fleetTierId: string;
  fleetTierLabel: string;
  discountCoupon?: string;
  features: string[];
}

/**
 * Calculates standard default plan parameters from the official rate card sheet.
 * Admin can subsequently modify any of these values in the modal.
 */
export function getFleetTierDefaults({
  tierId,
  scope = "truck_only",
  duration = "Monthly",
  applyCoupon = true,
}: {
  tierId: string;
  scope?: "truck_only" | "trailer_only" | "both";
  duration?: "Monthly" | "Yearly" | string;
  applyCoupon?: boolean;
}): CalculatedFleetPlanDefaults {
  const tier =
    FLEET_PRICING_TIERS.find((t) => t.tierId === tierId) ||
    FLEET_PRICING_TIERS[0];

  const isYearly = duration.toLowerCase().includes("year") || duration.toLowerCase().includes("annual");
  const actualDuration: "Monthly" | "Yearly" = isYearly ? "Yearly" : "Monthly";

  let price = 0;
  let discountPrice: number | null = null;
  let unitLabel = "Truck";

  if (scope === "trailer_only") {
    unitLabel = "Trailer";
    price = isYearly ? tier.yearlyTrailerPrice : tier.monthlyTrailerPrice;
    if (isYearly && applyCoupon) {
      discountPrice = tier.discountedYearlyTrailerPrice; // 50% discount with TRENO50
    }
  } else if (scope === "both") {
    unitLabel = "Fleet Unit (Truck & Trailer)";
    // If both, sum or base on truck
    price = isYearly
      ? tier.yearlyTruckPrice + tier.yearlyTrailerPrice
      : tier.monthlyTruckPrice + tier.monthlyTrailerPrice;
    if (isYearly && applyCoupon) {
      discountPrice =
        tier.discountedYearlyTruckPrice + tier.discountedYearlyTrailerPrice;
    }
  } else {
    // truck_only
    unitLabel = "Truck";
    price = isYearly ? tier.yearlyTruckPrice : tier.monthlyTruckPrice;
    if (isYearly && applyCoupon) {
      discountPrice = tier.discountedYearlyTruckPrice; // 50% discount with TRENO50
    }
  }

  const rangeText =
    tier.minVehicles === tier.maxVehicles
      ? `${tier.maxVehicles} ${unitLabel}`
      : `${tier.minVehicles} - ${tier.maxVehicles} ${unitLabel}s`;

  const name = `${unitLabel} Subscription (${rangeText}) — ${actualDuration}`;
  const description = `Standard fleet plan covering ${rangeText} with roadside repair coverage & dispatch management.`;

  const truckLimit =
    scope === "trailer_only" ? 0 : tier.maxVehicles;
  const trailerLimit =
    scope === "truck_only" ? 0 : tier.maxVehicles;

  return {
    name,
    description,
    duration: actualDuration,
    price,
    discountPrice,
    minVehicles: tier.minVehicles,
    maxVehicles: tier.maxVehicles,
    truckLimit,
    trailerLimit,
    vehicleTypeScope: scope,
    fleetTierId: tier.tierId,
    fleetTierLabel: tier.label,
    discountCoupon: isYearly && applyCoupon ? "TRENO50" : undefined,
    features: [
      `Fleet Coverage for ${rangeText}`,
      "Highway Emergency Repair Dispatches",
      "DOT Pre-Trip Inspection Work Orders",
      "Live GPS Breakdown Tracking",
      "Automated PM Service Logs",
    ],
  };
}
