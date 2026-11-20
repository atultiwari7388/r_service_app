"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  DollarSign,
  Tag,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Globe,
  Percent,
  Lock,
  Unlock,
  Building2,
  Car,
  Search,
  Check,
  RotateCcw,
  Gift,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  SubscriptionPlan,
  SubscriptionPlanType,
  SUPPORTED_PLAN_COUNTRIES,
  CountryPriceConfig,
  CommissionType,
  ServiceCommissionConfig,
  MECHANIC_PAGES_LIST,
  CORE_ROADSIDE_PAGES,
  CancellationPenaltyConfig,
  FleetVehicleTier,
  PackageVehicleSlab,
  CountryPackageRate,
  DEFAULT_PACKAGE_SLABS,
  GlobalVehiclePricingConfig,
  DEFAULT_GLOBAL_VEHICLE_PRICING,
} from "@/types/subscription";
import GlobalVehiclePricingModal from "./GlobalVehiclePricingModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SubscriptionPlan | null;
  defaultType?: SubscriptionPlanType;
  lockType?: boolean;
}

const VEHICLE_RANGE_OPTIONS = Array.from({ length: 300 }, (_, i) => i + 1);

const DURATION_PRESETS = [
  "Daily",
  "2 Days",
  "Monthly",
  "Quarterly",
  "Semi-Annually",
  "Yearly",
  "Weekly",
  "Lifetime",
];

const DEFAULT_SERVICES_FALLBACK = [
  { title: "Tire Repair & Replacement" },
  { title: "Brake System & Air Brakes" },
  { title: "Engine Diagnostics & Repair" },
  { title: "Battery, Jump Start & Electrical" },
  { title: "Mobile Welding & Fabrication" },
  { title: "Hydraulic Hose Repair" },
  { title: "DEF & Fuel Delivery" },
  { title: "Transmission & Drivetrain" },
  { title: "DOT Inspections & PM Service" },
  { title: "Lockout & Cabin Services" },
  { title: "Oil Change & Lube" },
  { title: "AC & Heating Repair" },
  { title: "Cooling System & Radiator" },
  { title: "Exhaust & Emissions System" },
  { title: "Suspension & Steering" },
];

export const COUNTRY_PACKAGE_OPTIONS = [
  { code: "USA", name: "United States", currency: "USD", symbol: "$", flag: "🇺🇸", multiplier: 1.0 },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$", flag: "🇨🇦", multiplier: 1.35 },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "Mex$", flag: "🇲🇽", multiplier: 18.0 },
  { code: "UK", name: "United Kingdom", currency: "GBP", symbol: "£", flag: "🇬🇧", multiplier: 0.8 },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$", flag: "🇦🇺", multiplier: 1.5 },
];

export const computeCountryRatesForSlab = (
  slab: PackageVehicleSlab,
  multipliers?: Record<string, number>
): Record<string, CountryPackageRate> => {
  const result: Record<string, CountryPackageRate> = {};

  // Automatically store USA rates (currency: USD, symbol: $)
  result["USA"] = {
    currency: "USD",
    symbol: "$",
    truckMonthlyRate: slab.truckMonthlyRate || 0,
    truckMonthlyDiscount: slab.truckMonthlyDiscount || null,
    truckYearlyRate: slab.truckYearlyRate || 0,
    truckYearlyDiscount: slab.truckYearlyDiscount || null,
    trailerMonthlyRate: slab.trailerMonthlyRate || 0,
    trailerMonthlyDiscount: slab.trailerMonthlyDiscount || null,
    trailerYearlyRate: slab.trailerYearlyRate || 0,
    trailerYearlyDiscount: slab.trailerYearlyDiscount || null,
  };

  COUNTRY_PACKAGE_OPTIONS.filter((c) => c.code !== "USA").forEach((c) => {
    let mult = c.multiplier;
    if (multipliers) {
      if (c.code === "CA" && multipliers.CAD) mult = multipliers.CAD;
      if (c.code === "MX" && multipliers.MXN) mult = multipliers.MXN;
      if (c.code === "UK" && multipliers.GBP) mult = multipliers.GBP;
      if (c.code === "AU" && multipliers.AUD) mult = multipliers.AUD;
    }
    const calcRate = (val?: number | null) =>
      val !== undefined && val !== null && val > 0 ? Math.round(val * mult) : null;

    result[c.code] = {
      currency: c.currency,
      symbol: c.symbol,
      truckMonthlyRate: slab.truckMonthlyRate ? Math.round(slab.truckMonthlyRate * mult) : 0,
      truckMonthlyDiscount: calcRate(slab.truckMonthlyDiscount),
      truckYearlyRate: slab.truckYearlyRate ? Math.round(slab.truckYearlyRate * mult) : 0,
      truckYearlyDiscount: calcRate(slab.truckYearlyDiscount),
      trailerMonthlyRate: slab.trailerMonthlyRate ? Math.round(slab.trailerMonthlyRate * mult) : 0,
      trailerMonthlyDiscount: calcRate(slab.trailerMonthlyDiscount),
      trailerYearlyRate: slab.trailerYearlyRate ? Math.round(slab.trailerYearlyRate * mult) : 0,
      trailerYearlyDiscount: calcRate(slab.trailerYearlyDiscount),
    };
  });
  return result;
};

export default function SubscriptionPlanModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  defaultType = "trenoops",
  lockType = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [type, setType] = useState<SubscriptionPlanType>(defaultType);
  const [name, setName] = useState("");
  const [buttonName, setButtonName] = useState("Purchase Plan");
  const [duration, setDuration] = useState("Monthly");
  const [customDuration, setCustomDuration] = useState("");
  const [price, setPrice] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("0");

  // Free Tier Option
  const [isFree, setIsFree] = useState(false);

  // Multi-Currency / Country-wise Pricing State
  const buildDefaultCountryPrices = (): Record<
    string,
    { enabled: boolean; price: string; discountPrice: string }
  > => {
    const res: Record<string, { enabled: boolean; price: string; discountPrice: string }> = {};
    SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
      res[c.code] = { enabled: c.code === "USA", price: "", discountPrice: "" };
    });
    return res;
  };

  const [activeCountryTab, setActiveCountryTab] = useState<string>("USA");
  const [countryPrices, setCountryPrices] = useState<
    Record<
      string,
      {
        enabled: boolean;
        price: string;
        discountPrice: string;
      }
    >
  >(buildDefaultCountryPrices);

  // Global Vehicle Pricing configuration state (Method 2)
  const [globalPricing, setGlobalPricing] = useState<GlobalVehiclePricingConfig>(
    DEFAULT_GLOBAL_VEHICLE_PRICING
  );
  const [isGlobalPricingModalOpen, setIsGlobalPricingModalOpen] = useState(false);

  // Owner / Driver Package Vehicle Slabs (type: "trenoops")
  const [packageVehicleSlabs, setPackageVehicleSlabs] = useState<PackageVehicleSlab[]>(() =>
    DEFAULT_PACKAGE_SLABS.map((s) => ({
      ...s,
      countryRates: computeCountryRatesForSlab(s),
    }))
  );
  const [activeSlabCountryTab, setActiveSlabCountryTab] = useState<string>("USA");
  const [fleetVehicleTiers, setFleetVehicleTiers] = useState<FleetVehicleTier[]>([]);
  const [minVehicles, setMinVehicles] = useState<string>("1");
  const [maxVehicles, setMaxVehicles] = useState<string>("5");
  const [vehicleTypeScope, setVehicleTypeScope] = useState<"both" | "truck_only" | "trailer_only" | "all">("both");
  const [truckLimit, setTruckLimit] = useState<string>("5");
  const [trailerLimit, setTrailerLimit] = useState<string>("5");
  const [isUnlimitedVehicles, setIsUnlimitedVehicles] = useState(false);

  // Mechanic specific
  const [mechanicCategory, setMechanicCategory] = useState<"roadside" | "company">("roadside");
  const [maxBays, setMaxBays] = useState<string>("2");
  const [isUnlimitedBays, setIsUnlimitedBays] = useState(false);
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState<string>("50");
  const [isUnlimitedRadius, setIsUnlimitedRadius] = useState(false);
  const [priorityJobLeads, setPriorityJobLeads] = useState(true);
  const [directCarrierInvoicing, setDirectCarrierInvoicing] = useState(true);

  // Commission Config (Per-Job on Selected Services)
  const [defaultCommissionType, setDefaultCommissionType] = useState<CommissionType>("percentage");
  const [defaultCommissionValue, setDefaultCommissionValue] = useState<string>("7");
  const [serviceCommissions, setServiceCommissions] = useState<
    Record<string, { enabled: boolean; type: CommissionType; value: string }>
  >({});
  const [showServiceCustomization, setShowServiceCustomization] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [availableServices, setAvailableServices] = useState<Array<{ title: string; price_type?: number; price?: string }>>(
    DEFAULT_SERVICES_FALLBACK
  );

  // RBAC Page Permissions
  const [allowedPages, setAllowedPages] = useState<string[]>([...CORE_ROADSIDE_PAGES]);
  const [hasAllPagesAccess, setHasAllPagesAccess] = useState<boolean>(false);

  // Cancellation Penalty Policy
  const [penaltyEnabled, setPenaltyEnabled] = useState(false);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<string>("3");
  const [penaltyFeeType, setPenaltyFeeType] = useState<"percentage" | "flat">("percentage");
  const [penaltyFeeValue, setPenaltyFeeValue] = useState<string>("5");

  // Features list
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Terms and Conditions list
  const [termsAndConditions, setTermsAndConditions] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");

  // Fetch dynamic services list from Firestore metadata/servicesList
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const snap = await getDoc(doc(db, "metadata", "servicesList"));
        if (snap.exists() && Array.isArray(snap.data()?.data)) {
          const list = snap.data().data.filter((s: any) => s && s.title);
          if (isMounted && list.length > 0) {
            setAvailableServices(list);
          }
        }
      } catch (err) {
        console.error("Error loading servicesList in SubscriptionPlanModal:", err);
      }
    };

    const fetchGlobalPricing = async () => {
      try {
        const snap = await getDoc(doc(db, "appSettings", "globalVehiclePricing"));
        if (snap.exists() && isMounted) {
          const data = snap.data() as GlobalVehiclePricingConfig;
          const mergedConfig: GlobalVehiclePricingConfig = {
            ...DEFAULT_GLOBAL_VEHICLE_PRICING,
            ...data,
            currencyMultipliers: {
              ...DEFAULT_GLOBAL_VEHICLE_PRICING.currencyMultipliers,
              ...(data.currencyMultipliers || {}),
            },
          };
          setGlobalPricing(mergedConfig);

          // New plan package slabs initialization if not present
          if (!initialData?.packageVehicleSlabs || initialData.packageVehicleSlabs.length === 0) {
            setPackageVehicleSlabs(
              DEFAULT_PACKAGE_SLABS.map((s) => ({
                ...s,
                countryRates: computeCountryRatesForSlab(s, mergedConfig.currencyMultipliers),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error loading globalVehiclePricing:", err);
      }
    };

    fetchServices();
    if (isOpen) {
      fetchGlobalPricing();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Package Vehicle Slabs Handlers (Method: Package Based Pricing)
  const handleAddSlab = () => {
    const currentCount = packageVehicleSlabs.length;
    let newSlab: PackageVehicleSlab;

    if (currentCount === 1) {
      // Tap 1: Add 2 to 2 Units slab
      newSlab = {
        id: `slab-${Date.now()}-2to2`,
        fromUnit: 2,
        toUnit: 2,
        truckMonthlyRate: 0,
        truckMonthlyDiscount: null,
        truckYearlyRate: 0,
        truckYearlyDiscount: null,
        trailerMonthlyRate: 0,
        trailerMonthlyDiscount: null,
        trailerYearlyRate: 0,
        trailerYearlyDiscount: null,
      };
    } else if (currentCount === 2) {
      // Tap 2: Add 3 to 5 Units slab
      newSlab = {
        id: `slab-${Date.now()}-3to5`,
        fromUnit: 3,
        toUnit: 5,
        truckMonthlyRate: 0,
        truckMonthlyDiscount: null,
        truckYearlyRate: 0,
        truckYearlyDiscount: null,
        trailerMonthlyRate: 0,
        trailerMonthlyDiscount: null,
        trailerYearlyRate: 0,
        trailerYearlyDiscount: null,
      };
    } else {
      // Tap 3+: Add sequential slab (e.g. 6 to 10)
      const last = packageVehicleSlabs[packageVehicleSlabs.length - 1];
      const nextFrom = last ? last.toUnit + 1 : 1;
      const nextTo = Math.min(300, nextFrom + 4);

      newSlab = {
        id: `slab-${Date.now()}-${nextFrom}to${nextTo}`,
        fromUnit: nextFrom,
        toUnit: nextTo,
        truckMonthlyRate: 0,
        truckMonthlyDiscount: null,
        truckYearlyRate: 0,
        truckYearlyDiscount: null,
        trailerMonthlyRate: 0,
        trailerMonthlyDiscount: null,
        trailerYearlyRate: 0,
        trailerYearlyDiscount: null,
      };
    }

    newSlab.countryRates = computeCountryRatesForSlab(newSlab, globalPricing.currencyMultipliers);
    setPackageVehicleSlabs((prev) => [...prev, newSlab]);
  };

  const handleUpdateSlab = (index: number, field: string, value: any) => {
    setPackageVehicleSlabs((prev) => {
      const copy = [...prev];
      const slab = { ...copy[index] };

      if (field === "fromUnit" || field === "toUnit") {
        const numVal = Math.max(1, parseInt(value, 10) || 1);
        (slab as any)[field] = numVal;
        if (field === "fromUnit" && slab.toUnit < numVal) {
          slab.toUnit = numVal;
        }
      } else if (activeSlabCountryTab === "USA") {
        const isDiscount = field.includes("Discount");
        const parsedVal =
          value === "" || value === null || value === undefined
            ? isDiscount ? null : 0
            : Math.max(0, parseFloat(value) || 0);

        (slab as any)[field] = parsedVal;

        // Auto-recalculate country rates from USD
        const newCountryRates = computeCountryRatesForSlab(
          slab,
          globalPricing.currencyMultipliers
        );
        slab.countryRates = {
          ...(slab.countryRates || {}),
          ...newCountryRates,
        };
      } else {
        // Editing a specific international country
        const cCode = activeSlabCountryTab;
        const currentCountryRates = slab.countryRates || computeCountryRatesForSlab(slab, globalPricing.currencyMultipliers);
        const curCountry = { ...(currentCountryRates[cCode] || {}) };

        const isDiscount = field.includes("Discount");
        const parsedVal =
          value === "" || value === null || value === undefined
            ? isDiscount ? null : 0
            : Math.max(0, parseFloat(value) || 0);

        (curCountry as any)[field] = parsedVal;
        slab.countryRates = {
          ...currentCountryRates,
          [cCode]: curCountry as CountryPackageRate,
        };
      }

      copy[index] = slab;
      return copy;
    });
  };

  const handleRemoveSlab = (index: number) => {
    if (packageVehicleSlabs.length <= 1) return;
    setPackageVehicleSlabs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSyncSlabFromUSD = (index: number) => {
    setPackageVehicleSlabs((prev) => {
      const copy = [...prev];
      const slab = { ...copy[index] };
      slab.countryRates = computeCountryRatesForSlab(slab, globalPricing.currencyMultipliers);
      copy[index] = slab;
      return copy;
    });
    toast.success("Slab rates re-synced from US base rates.");
  };

  const handleSyncAllSlabsFromUSD = () => {
    setPackageVehicleSlabs((prev) =>
      prev.map((s) => ({
        ...s,
        countryRates: computeCountryRatesForSlab(s, globalPricing.currencyMultipliers),
      }))
    );
    toast.success("All slabs re-synced from US base rates.");
  };

  // Backwards compatibility tier stubs
  const syncCountryPricesFromTiers = (_tiersToSync?: any, _overrideConfig?: any) => {};
  const handleAddTier = handleAddSlab;
  const handleUpdateTier = (_index?: number, _field?: any, _value?: any) => {};
  const handleRemoveTier = handleRemoveSlab;

  useEffect(() => {
    const activeType = lockType ? defaultType : (initialData?.type || defaultType);
    setType(activeType);

    if (initialData) {
      setName(initialData.name || "");
      setButtonName(initialData.buttonName || initialData.btnName || "Purchase Plan");
      if (DURATION_PRESETS.includes(initialData.duration)) {
        setDuration(initialData.duration);
        setCustomDuration("");
      } else {
        setDuration("Custom");
        setCustomDuration(initialData.duration || "");
      }
      setPrice(initialData.price !== undefined ? String(initialData.price) : "");
      setDiscountPrice(
        initialData.discountPrice !== undefined && initialData.discountPrice !== null
          ? String(initialData.discountPrice)
          : ""
      );
      setCurrency(initialData.currency || "USD");
      setDescription(initialData.description || "");
      setIsActive(initialData.isActive ?? true);
      setIsPopular(initialData.isPopular ?? false);
      setSortOrder(initialData.sortOrder !== undefined ? String(initialData.sortOrder) : "0");

      // Free Tier
      setIsFree(initialData.isFree ?? false);

      // Owner fields
      setIsUnlimitedVehicles(initialData.maxVehicles === -1);
      setMinVehicles(
        initialData.minVehicles !== undefined
          ? String(initialData.minVehicles)
          : "1"
      );
      setMaxVehicles(initialData.maxVehicles === -1 ? "" : String(initialData.maxVehicles ?? 2));
      setVehicleTypeScope(initialData.vehicleTypeScope || "both");

      if (initialData.packageVehicleSlabs && initialData.packageVehicleSlabs.length > 0) {
        setPackageVehicleSlabs(
          initialData.packageVehicleSlabs.map((s, idx) => ({
            ...s,
            id: s.id || `slab-${idx + 1}`,
            countryRates: s.countryRates || computeCountryRatesForSlab(s, globalPricing.currencyMultipliers),
          }))
        );
      } else if (initialData.fleetVehicleTiers && initialData.fleetVehicleTiers.length > 0) {
        // Convert legacy tiers to packageVehicleSlabs
        const converted: PackageVehicleSlab[] = initialData.fleetVehicleTiers.map((t, idx) => {
          const tRate = t.truckRate || 10;
          const trRate = t.trailerRate || 6;
          const slab: PackageVehicleSlab = {
            id: t.id || `slab-${idx + 1}`,
            fromUnit: t.fromVehicles || 1,
            toUnit: t.toVehicles || 2,
            truckMonthlyRate: tRate,
            truckMonthlyDiscount: t.discountPrice ? Math.round(tRate * 0.8) : null,
            truckYearlyRate: tRate * 10,
            truckYearlyDiscount: t.discountPrice ? Math.round(tRate * 8) : null,
            trailerMonthlyRate: trRate,
            trailerMonthlyDiscount: t.discountPrice ? Math.round(trRate * 0.8) : null,
            trailerYearlyRate: trRate * 10,
            trailerYearlyDiscount: t.discountPrice ? Math.round(trRate * 8) : null,
          };
          slab.countryRates = computeCountryRatesForSlab(slab, globalPricing.currencyMultipliers);
          return slab;
        });
        setPackageVehicleSlabs(converted);
      } else if (activeType === "trenoops") {
        setPackageVehicleSlabs(
          DEFAULT_PACKAGE_SLABS.map((s) => ({
            ...s,
            countryRates: computeCountryRatesForSlab(s, globalPricing.currencyMultipliers),
          }))
        );
      }

      // Mechanic fields
      const cat = initialData.mechanicCategory || "roadside";
      setMechanicCategory(cat);
      setIsUnlimitedBays(initialData.maxBays === -1);
      setMaxBays(initialData.maxBays === -1 ? "" : String(initialData.maxBays ?? 2));
      setIsUnlimitedRadius(initialData.serviceRadiusMiles === -1);
      setServiceRadiusMiles(
        initialData.serviceRadiusMiles === -1 ? "" : String(initialData.serviceRadiusMiles ?? 50)
      );
      setPriorityJobLeads(initialData.priorityJobLeads ?? true);
      setDirectCarrierInvoicing(initialData.directCarrierInvoicing ?? true);

      // Commission fields
      if (initialData.defaultCommission) {
        setDefaultCommissionType(initialData.defaultCommission.type || "percentage");
        setDefaultCommissionValue(
          initialData.defaultCommission.value !== undefined
            ? String(initialData.defaultCommission.value)
            : "7"
        );
      } else {
        setDefaultCommissionType("percentage");
        setDefaultCommissionValue("7");
      }

      if (initialData.serviceCommissions) {
        const scMap: Record<string, { enabled: boolean; type: CommissionType; value: string }> = {};
        Object.entries(initialData.serviceCommissions).forEach(([srvTitle, cfg]) => {
          scMap[srvTitle] = {
            enabled: cfg.enabled !== false,
            type: cfg.type || "percentage",
            value: cfg.value !== undefined ? String(cfg.value) : "7",
          };
        });
        setServiceCommissions(scMap);
      } else {
        setServiceCommissions({});
      }

      // Page Permissions
      setHasAllPagesAccess(
        initialData.hasAllPagesAccess ?? (cat === "company")
      );
      setAllowedPages(
        initialData.allowedPages && initialData.allowedPages.length > 0
          ? initialData.allowedPages
          : cat === "company"
          ? MECHANIC_PAGES_LIST.map((p) => p.key)
          : [...CORE_ROADSIDE_PAGES]
      );

      // Cancellation Penalty Policy
      if (initialData.cancellationPenalty) {
        setPenaltyEnabled(initialData.cancellationPenalty.enabled ?? false);
        setGracePeriodMinutes(
          initialData.cancellationPenalty.gracePeriodMinutes !== undefined
            ? String(initialData.cancellationPenalty.gracePeriodMinutes)
            : "3"
        );
        setPenaltyFeeType(initialData.cancellationPenalty.feeType || "percentage");
        setPenaltyFeeValue(
          initialData.cancellationPenalty.feeValue !== undefined
            ? String(initialData.cancellationPenalty.feeValue)
            : "5"
        );
      } else {
        setPenaltyEnabled(false);
        setGracePeriodMinutes("3");
        setPenaltyFeeType("percentage");
        setPenaltyFeeValue("5");
      }

      setFeatures(initialData.features || []);
      setTermsAndConditions(initialData.termsAndConditions || []);

      // Country Prices initialization
      const initialCP: Record<
        string,
        { enabled: boolean; price: string; discountPrice: string }
      > = {};

      SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
        const existing = initialData.countryPrices?.[c.code];
        if (existing) {
          initialCP[c.code] = {
            enabled: existing.enabled !== false,
            price: existing.price !== undefined ? String(existing.price) : "",
            discountPrice:
              existing.discountPrice !== undefined &&
              existing.discountPrice !== null
                ? String(existing.discountPrice)
                : "",
          };
        } else if (
          c.code === "USA" ||
          (initialData.currency && c.currency === initialData.currency)
        ) {
          // Backward compatibility for plans saved with only base price
          initialCP[c.code] = {
            enabled: true,
            price:
              initialData.price !== undefined ? String(initialData.price) : "",
            discountPrice:
              initialData.discountPrice !== undefined &&
              initialData.discountPrice !== null
                ? String(initialData.discountPrice)
                : "",
          };
        } else {
          initialCP[c.code] = { enabled: false, price: "", discountPrice: "" };
        }
      });
      setCountryPrices(initialCP);
      const firstEnabled =
        Object.keys(initialCP).find((k) => initialCP[k].enabled) || "USA";
      setActiveCountryTab(firstEnabled);
    } else {
      // Default reset
      setName("");
      setButtonName("Purchase Plan");
      setDuration("Monthly");
      setCustomDuration("");
      setPrice("");
      setDiscountPrice("");
      setCurrency("USD");
      setDescription("");
      setIsActive(true);
      setIsPopular(false);
      setSortOrder("0");
      setIsFree(false);

      setCountryPrices(buildDefaultCountryPrices());
      setActiveCountryTab("USA");

      if (activeType === "trenoops") {
        setPackageVehicleSlabs(
          DEFAULT_PACKAGE_SLABS.map((s) => ({
            ...s,
            countryRates: computeCountryRatesForSlab(s, globalPricing.currencyMultipliers),
          }))
        );
        setName("Owner-Operator & Fleet Plan");
        setDescription(
          "Custom fleet coverage for motor carriers, owner-operators and dispatch fleets."
        );
        setDuration("Monthly");
        setMinVehicles("1");
        setMaxVehicles("2");
        setVehicleTypeScope("both");
        setPrice("");
        setDiscountPrice("");
        setFeatures([
          "Full 24/7 Roadside & Workshop Dispatch Access",
          "Dedicated Fleet Management Dashboard",
          "Real-time Job Tracking & GPS Routing",
          "Priority Technician Dispatch",
        ]);
        setTermsAndConditions([
          "Subscription renews automatically at selected billing interval.",
          "Fleet limits apply strictly to active registered commercial units.",
          "Cancellation must be submitted 24 hours prior to billing cycle.",
        ]);
      } else {
        setMechanicCategory("roadside");
        setIsUnlimitedBays(false);
        setMaxBays("3");
        setIsUnlimitedRadius(false);
        setServiceRadiusMiles("50");
        setPriorityJobLeads(true);
        setDirectCarrierInvoicing(true);
        setDefaultCommissionType("percentage");
        setDefaultCommissionValue("7");
        setServiceCommissions({});
        setAllowedPages([...CORE_ROADSIDE_PAGES]);
        setHasAllPagesAccess(false);
        setPenaltyEnabled(false);
        setGracePeriodMinutes("3");
        setPenaltyFeeType("percentage");
        setPenaltyFeeValue("5");

        setFeatures([
          "Priority Roadside Emergency Job Broadcasts",
          "Direct Fleet & Carrier Billing Invoicing",
          "Workshop Bay & Tech Scheduling Portal",
          "Parts & Labor Digital Estimates",
        ]);
        setTermsAndConditions([
          "Mechanic shop must maintain valid liability insurance.",
          "All jobs completed via platform follow standard warranty policy.",
          "Subscription fee is non-refundable after activation.",
        ]);
      }
    }
  }, [initialData, defaultType, lockType, isOpen]);

  // Filtered services for search (unconditionally at top level)
  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return availableServices;
    const q = serviceSearchQuery.toLowerCase();
    return availableServices.filter((s) => s.title.toLowerCase().includes(q));
  }, [availableServices, serviceSearchQuery]);

  // Add Feature
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures([...features, newFeature.trim()]);
    setNewFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Add Term
  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setTermsAndConditions([...termsAndConditions, newTerm.trim()]);
    setNewTerm("");
  };

  const handleRemoveTerm = (idx: number) => {
    setTermsAndConditions(termsAndConditions.filter((_, i) => i !== idx));
  };

  // Toggle Free Tier
  const handleToggleFree = (free: boolean) => {
    setIsFree(free);
    if (free && type === "treno_mechanic" && mechanicCategory === "roadside") {
      setAllowedPages([...CORE_ROADSIDE_PAGES]);
      setHasAllPagesAccess(false);
    }
  };

  // Mechanic Category Switch
  const handleCategoryChange = (cat: "roadside" | "company") => {
    setMechanicCategory(cat);
    if (cat === "roadside") {
      setAllowedPages([...CORE_ROADSIDE_PAGES]);
      setHasAllPagesAccess(false);
    } else {
      setAllowedPages(MECHANIC_PAGES_LIST.map((p) => p.key));
      setHasAllPagesAccess(true);
    }
  };

  // Apply default commission to all available services
  const handleApplyDefaultCommissionToAll = () => {
    const updated: Record<
      string,
      { enabled: boolean; type: CommissionType; value: string }
    > = {};
    availableServices.forEach((s) => {
      updated[s.title] = {
        enabled: true,
        type: defaultCommissionType,
        value: defaultCommissionValue,
      };
    });
    setServiceCommissions(updated);
    toast.success(
      `Applied default ${defaultCommissionValue}${
        defaultCommissionType === "percentage" ? "%" : "$"
      } commission to all ${availableServices.length} services`
    );
  };

  // Update specific service commission override
  const handleServiceCommissionChange = (
    serviceTitle: string,
    patch: Partial<{ enabled: boolean; type: CommissionType; value: string }>
  ) => {
    setServiceCommissions((prev) => {
      const existing = prev[serviceTitle] || {
        enabled: true,
        type: defaultCommissionType,
        value: defaultCommissionValue,
      };
      return {
        ...prev,
        [serviceTitle]: {
          ...existing,
          ...patch,
        },
      };
    });
  };

  // Reset service commission override back to default
  const handleResetServiceCommission = (serviceTitle: string) => {
    setServiceCommissions((prev) => {
      const next = { ...prev };
      delete next[serviceTitle];
      return next;
    });
  };

  // Toggle individual page permission
  const handleTogglePage = (pageKey: string) => {
    if (allowedPages.includes(pageKey)) {
      setAllowedPages(allowedPages.filter((k) => k !== pageKey));
      setHasAllPagesAccess(false);
    } else {
      setAllowedPages([...allowedPages, pageKey]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a plan name");
      return;
    }

    // Validate Pricing based on plan type
    const configuredCountries: Record<string, CountryPriceConfig> = {};
    let hasAtLeastOneValidPrice = false;

    if (type === "trenoops") {
      // Package Based Pricing for Owners & Drivers:
      // Pricing is managed entirely inside packageVehicleSlabs (with target country rates).
      if (!packageVehicleSlabs || packageVehicleSlabs.length === 0) {
        toast.error("Please add at least one vehicle slab for this package.");
        return;
      }

      for (let i = 0; i < packageVehicleSlabs.length; i++) {
        const slab = packageVehicleSlabs[i];
        if (slab.fromUnit > slab.toUnit) {
          toast.error(
            `Slab #${i + 1} (${slab.fromUnit} - ${slab.toUnit}): 'From' unit cannot exceed 'To' unit.`
          );
          return;
        }
      }

      // Populate default countryPrices for DB compatibility without blocking on flat prices
      SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
        const firstSlab = packageVehicleSlabs[0];
        const isUSA = c.code === "USA";
        const cRate = !isUSA && firstSlab?.countryRates?.[c.code] ? firstSlab.countryRates[c.code] : null;
        const p = isUSA ? (firstSlab?.truckMonthlyRate || 0) : (cRate?.truckMonthlyRate || 0);
        const d = isUSA ? (firstSlab?.truckMonthlyDiscount || null) : (cRate?.truckMonthlyDiscount || null);

        configuredCountries[c.code] = {
          countryCode: c.code,
          currency: c.currency,
          symbol: c.symbol,
          price: p,
          discountPrice: d,
          enabled: true,
        };
      });
      hasAtLeastOneValidPrice = true;
    } else if (isFree) {
      // For Free plans, automatically configure 0 price across enabled/all countries
      SUPPORTED_PLAN_COUNTRIES.forEach((c) => {
        configuredCountries[c.code] = {
          countryCode: c.code,
          currency: c.currency,
          symbol: c.symbol,
          price: 0,
          discountPrice: null,
          enabled: true,
        };
      });
      hasAtLeastOneValidPrice = true;
    } else {
      // Mechanic flat pricing validation
      for (const c of SUPPORTED_PLAN_COUNTRIES) {
        const entry = countryPrices[c.code];
        if (entry && entry.enabled) {
          if (!entry.price || entry.price.trim() === "") {
            toast.error(
              `Please enter a price for enabled country: ${c.name} (${c.code})`
            );
            setActiveCountryTab(c.code);
            return;
          }
          const p = parseFloat(entry.price);
          if (isNaN(p) || p < 0) {
            toast.error(`Please enter a valid price for ${c.name} (${c.code})`);
            setActiveCountryTab(c.code);
            return;
          }

          const d =
            entry.discountPrice.trim() !== ""
              ? parseFloat(entry.discountPrice)
              : null;
          if (d !== null && (isNaN(d) || d < 0)) {
            toast.error(
              `Please enter a valid discounted price for ${c.name} (${c.code})`
            );
            setActiveCountryTab(c.code);
            return;
          }
          if (d !== null && d > p) {
            toast.error(
              `Discounted price cannot exceed regular price for ${c.name} (${c.code})`
            );
            setActiveCountryTab(c.code);
            return;
          }

          configuredCountries[c.code] = {
            countryCode: c.code,
            currency: c.currency,
            symbol: c.symbol,
            price: p,
            discountPrice: d,
            enabled: true,
          };
          hasAtLeastOneValidPrice = true;
        }
      }

      if (!hasAtLeastOneValidPrice) {
        toast.error(
          "Please enable and enter pricing for at least one country (e.g. USA)."
        );
        return;
      }
    }

    const baseEntry =
      configuredCountries["USA"] || Object.values(configuredCountries)[0];

    const finalDuration =
      duration === "Custom" ? customDuration.trim() || "Monthly" : duration;

    setLoading(true);
    try {
      const payload: Partial<SubscriptionPlan> = {
        name: name.trim(),
        buttonName: buttonName.trim() || "Purchase Plan",
        btnName: buttonName.trim() || "Purchase Plan",
        type,
        duration: finalDuration,
        price: isFree ? 0 : baseEntry.price,
        discountPrice: isFree ? null : baseEntry.discountPrice ?? null,
        currency: baseEntry.currency,
        countryPrices: configuredCountries,
        description: description.trim(),
        isFree,
        isActive,
        isPopular,
        sortOrder: parseInt(sortOrder, 10) || 0,
        features,
        termsAndConditions,
        updatedAt: serverTimestamp(),
      };

      if (type === "trenoops") {
        payload.packageVehicleSlabs = packageVehicleSlabs.map((slab) => {
          const currentRates = { ...(slab.countryRates || {}) };
          currentRates["USA"] = {
            currency: "USD",
            symbol: "$",
            truckMonthlyRate: slab.truckMonthlyRate || 0,
            truckMonthlyDiscount: slab.truckMonthlyDiscount || null,
            truckYearlyRate: slab.truckYearlyRate || 0,
            truckYearlyDiscount: slab.truckYearlyDiscount || null,
            trailerMonthlyRate: slab.trailerMonthlyRate || 0,
            trailerMonthlyDiscount: slab.trailerMonthlyDiscount || null,
            trailerYearlyRate: slab.trailerYearlyRate || 0,
            trailerYearlyDiscount: slab.trailerYearlyDiscount || null,
          };
          return {
            ...slab,
            countryRates: currentRates,
          };
        });
        const sortedMin = packageVehicleSlabs[0]?.fromUnit || 1;
        const sortedMax = isUnlimitedVehicles
          ? -1
          : packageVehicleSlabs[packageVehicleSlabs.length - 1]?.toUnit || 300;
        payload.minVehicles = sortedMin;
        payload.maxVehicles = sortedMax;
        payload.vehicleTypeScope = vehicleTypeScope;
        payload.truckLimit = isUnlimitedVehicles ? -1 : sortedMax;
        payload.trailerLimit = isUnlimitedVehicles ? -1 : sortedMax;
        payload.price = packageVehicleSlabs[0]?.truckMonthlyRate || 0;
        payload.discountPrice = packageVehicleSlabs[0]?.truckMonthlyDiscount || null;
      } else {
        payload.mechanicCategory = mechanicCategory;
        payload.maxBays = isUnlimitedBays ? -1 : parseInt(maxBays, 10) || 1;
        payload.serviceRadiusMiles = isUnlimitedRadius
          ? -1
          : parseInt(serviceRadiusMiles, 10) || 25;
        payload.priorityJobLeads = priorityJobLeads;
        payload.directCarrierInvoicing = directCarrierInvoicing;

        // Save Commission configuration
        const defCommVal = parseFloat(defaultCommissionValue);
        payload.defaultCommission = {
          type: defaultCommissionType,
          value: isNaN(defCommVal) ? 0 : defCommVal,
        };

        const cleanServiceCommissions: Record<string, ServiceCommissionConfig> = {};
        Object.entries(serviceCommissions).forEach(([srvTitle, cfg]) => {
          const val = parseFloat(cfg.value);
          cleanServiceCommissions[srvTitle] = {
            enabled: cfg.enabled,
            type: cfg.type,
            value: isNaN(val) ? 0 : val,
          };
        });
        payload.serviceCommissions = cleanServiceCommissions;

        // Save Page RBAC Access Permissions
        payload.allowedPages = allowedPages;
        payload.hasAllPagesAccess = hasAllPagesAccess;
      }

      // Save Cancellation Penalty Policy (Applies to both Driver/Owner & Mechanic plans, goes to Admin)
      const graceMin = parseInt(gracePeriodMinutes, 10);
      const feeVal = parseFloat(penaltyFeeValue);
      payload.cancellationPenalty = {
        enabled: penaltyEnabled,
        gracePeriodMinutes: isNaN(graceMin) || graceMin < 0 ? 3 : graceMin,
        feeType: penaltyFeeType,
        feeValue: isNaN(feeVal) || feeVal < 0 ? 0 : feeVal,
        penaltyRecipient: "admin",
      };

      // Recursively strip out any undefined fields so Firestore addDoc/updateDoc never fails
      const sanitizeData = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sanitizeData);
        } else if (
          obj !== null &&
          typeof obj === "object" &&
          !(obj instanceof Date) &&
          typeof (obj as any).isEqual !== "function"
        ) {
          const clean: Record<string, any> = {};
          Object.entries(obj).forEach(([key, val]) => {
            if (val !== undefined) {
              clean[key] = sanitizeData(val);
            }
          });
          return clean;
        }
        return obj;
      };

      const sanitizedPayload = sanitizeData(payload);

      if (initialData?.id) {
        // Update existing plan
        const planRef = doc(db, "subscriptionPlans", initialData.id);
        await updateDoc(planRef, sanitizedPayload);
        toast.success(`Plan "${name}" updated successfully!`);
      } else {
        // Create new plan
        await addDoc(collection(db, "subscriptionPlans"), {
          ...sanitizedPayload,
          createdAt: serverTimestamp(),
        });
        toast.success(`Plan "${name}" created successfully!`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error saving subscription plan:", err);
      toast.error(err?.message || "Failed to save subscription plan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl xl:max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                type === "trenoops"
                  ? "bg-[#F96176] shadow-[#F96176]/25"
                  : "bg-[#58BB87] shadow-[#58BB87]/25"
              }`}
            >
              {type === "trenoops" ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Wrench className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {initialData ? "Edit Subscription Plan" : "Create Subscription Plan"}
              </h2>
              <p className="text-xs text-gray-500">
                {type === "trenoops"
                  ? "Configuring plan for Owners, Drivers & Fleets (TrenoOps)"
                  : "Configuring plan for Mechanics & Repair Shops (Treno Mechanic)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Plan Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Plan Audience & Type <span className="text-red-500">*</span>
            </label>
            {lockType ? (
              type === "treno_mechanic" ? (
                <div className="p-3.5 rounded-xl border-2 border-[#58BB87] bg-emerald-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#58BB87] text-white shadow-xs">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">For Mechanics & Repair Shops</span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Mechanics Only
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Target Audience: Service stations & mobile techs (type: <code className="text-[#58BB87] font-semibold">treno_mechanic</code>)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border-2 border-[#F96176] bg-rose-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F96176] text-white shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">For Owners / Drivers & Fleets</span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Owners/Drivers Only
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Target Audience: Motor carriers, owner-operators & fleet drivers (type: <code className="text-[#F96176] font-semibold">trenoops</code>)
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("trenoops")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition text-left ${
                    type === "trenoops"
                      ? "border-[#F96176] bg-rose-50/60 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      type === "trenoops"
                        ? "bg-[#F96176] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">For Owners / Drivers</div>
                    <div className="text-[11px] text-gray-500">
                      type: <code className="text-[#F96176] font-semibold">trenoops</code> (Trucks & Trailers)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType("treno_mechanic")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition text-left ${
                    type === "treno_mechanic"
                      ? "border-[#58BB87] bg-emerald-50/60 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      type === "treno_mechanic"
                        ? "bg-[#58BB87] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">For Mechanics</div>
                    <div className="text-[11px] text-gray-500">
                      type: <code className="text-[#58BB87] font-semibold">treno_mechanic</code> (Shops & Techs)
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-500" /> Basic Plan Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Name */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === "trenoops"
                      ? "e.g., Starter Fleet, Owner-Operator Pro"
                      : "e.g., Mobile Tech, Workshop Pro, Master Station"
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm font-medium"
                />
              </div>

              {/* Button Name (CTA Label for Frontend) */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Button Name (CTA on Frontend)
                </label>
                <input
                  type="text"
                  value={buttonName}
                  onChange={(e) => setButtonName(e.target.value)}
                  placeholder="e.g., Purchase Plan, Get Started, Subscribe Now"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#58BB87] text-sm font-medium"
                />
              </div>

              {/* Tagline / Short Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Ideal for independent carriers managing up to 5 commercial vehicles"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm font-medium"
                >
                  {DURATION_PRESETS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Custom">Custom Interval</option>
                </select>
                {duration === "Custom" && (
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. 6 Months or Bi-Weekly"
                    className="w-full mt-2 px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
                  />
                )}
              </div>

              {/* Free Tier Option Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pricing Tier
                </label>
                <div
                  onClick={() => handleToggleFree(!isFree)}
                  className={`px-3.5 py-2.5 rounded-xl border-2 transition flex items-center justify-between cursor-pointer select-none ${
                    isFree
                      ? "bg-emerald-50/90 border-[#58BB87] shadow-xs"
                      : "bg-white border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gift
                      className={`w-4 h-4 ${
                        isFree ? "text-[#58BB87]" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isFree ? "text-emerald-950" : "text-gray-700"
                      }`}
                    >
                      {isFree ? "100% Free Plan ($0.00)" : "Paid Subscription"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => handleToggleFree(e.target.checked)}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87] cursor-pointer"
                  />
                </div>
              </div>

              {/* Multi-Currency Country-Wise Pricing Section (Hidden for Owners/Drivers package pricing) */}
              {type !== "trenoops" && (
              <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
                {isFree ? (
                  <div className="bg-emerald-50/90 border-2 border-dashed border-[#58BB87]/50 rounded-xl p-5 text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-[#58BB87] shadow-xs">
                      <Gift className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                      100% Free Plan Tier Active
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto">
                      All regional prices are set to $0.00 across all 5 countries (USA, Canada, Mexico, UK, Australia). Users subscribing to this plan will not be charged.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleToggleFree(false)}
                      className="mt-2 text-xs font-bold text-[#58BB87] hover:text-emerald-800 underline cursor-pointer"
                    >
                      Switch back to Paid Subscription with Country-Wise Pricing
                    </button>
                  </div>
                ) : (
                  <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-100 text-[#F96176]">
                        <Globe className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">
                        Country-Wise Currency Pricing
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure custom rates and discounts per country ({SUPPORTED_PLAN_COUNTRIES.map((c) => c.code).join(", ")})
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_PLAN_COUNTRIES.map((c) => {
                      const cp = countryPrices[c.code];
                      const isSet = cp?.enabled && cp?.price;
                      return (
                        <span
                          key={c.code}
                          onClick={() => setActiveCountryTab(c.code)}
                          className={`cursor-pointer px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            activeCountryTab === c.code
                              ? "bg-[#F96176] text-white shadow-xs"
                              : isSet
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200/70 text-gray-400 hover:bg-gray-200"
                          }`}
                          title={`Click to edit ${c.name} (${c.currency}) pricing`}
                        >
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                          {isSet && (
                            <span className="text-[10px] opacity-90">
                              {c.symbol}{cp.discountPrice || cp.price}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Country Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUPPORTED_PLAN_COUNTRIES.map((c) => {
                    const cp = countryPrices[c.code];
                    const isSelected = activeCountryTab === c.code;
                    const isConfigured = cp?.enabled && cp?.price;

                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setActiveCountryTab(c.code)}
                        className={`p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                          isSelected
                            ? "border-[#F96176] bg-white shadow-sm ring-2 ring-[#F96176]/15"
                            : isConfigured
                            ? "border-emerald-200 bg-white hover:border-emerald-300"
                            : "border-gray-200 bg-gray-100/60 hover:bg-white hover:border-gray-300 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-lg">{c.flag}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConfigured
                                ? "bg-emerald-500"
                                : cp?.enabled
                                ? "bg-amber-400"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-xs font-bold text-gray-900 leading-tight">
                            {c.code} <span className="text-[10px] text-gray-500 font-normal">({c.currency})</span>
                          </div>
                          <div className="text-[11px] font-semibold text-gray-700 mt-0.5 truncate">
                            {isConfigured ? `${c.symbol}${cp.discountPrice || cp.price}` : "Not set"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Country Config Card */}
                {(() => {
                  const activeCountry =
                    SUPPORTED_PLAN_COUNTRIES.find((c) => c.code === activeCountryTab) ||
                    SUPPORTED_PLAN_COUNTRIES[0];
                  const cData = countryPrices[activeCountry.code] || {
                    enabled: false,
                    price: "",
                    discountPrice: "",
                  };

                  return (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{activeCountry.flag}</span>
                          <div>
                            <span className="text-sm font-bold text-gray-900">
                              {activeCountry.name} ({activeCountry.code})
                            </span>
                            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              Currency: {activeCountry.currency} ({activeCountry.symbol})
                            </span>
                          </div>
                        </div>

                        {/* Enable for Country Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={cData.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCountryPrices((prev) => ({
                                ...prev,
                                [activeCountry.code]: {
                                  ...prev[activeCountry.code],
                                  enabled: checked,
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176] border-gray-300"
                          />
                          <span className="text-xs font-bold text-gray-700">
                            Enable Pricing
                          </span>
                        </label>
                      </div>

                      {cData.enabled ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Regular Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Regular Price ({activeCountry.currency}) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent bg-white px-3.5 py-2.5 transition">
                              <span className="text-gray-500 font-bold text-sm select-none mr-2 shrink-0">
                                {activeCountry.symbol}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cData.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCountryPrices((prev) => ({
                                    ...prev,
                                    [activeCountry.code]: {
                                      ...prev[activeCountry.code],
                                      price: val,
                                    },
                                  }));
                                }}
                                placeholder={
                                  activeCountry.defaultPrice
                                    ? String(activeCountry.defaultPrice)
                                    : "49.99"
                                }
                                required
                                className="w-full p-0 border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold bg-transparent text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Discounted Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Discounted / Promo Price ({activeCountry.currency})
                            </label>
                            <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent bg-white px-3.5 py-2.5 transition">
                              <span className="text-gray-500 font-bold text-sm select-none mr-2 shrink-0">
                                {activeCountry.symbol}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cData.discountPrice}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCountryPrices((prev) => ({
                                    ...prev,
                                    [activeCountry.code]: {
                                      ...prev[activeCountry.code],
                                      discountPrice: val,
                                    },
                                  }));
                                }}
                                placeholder="Optional promo price"
                                className="w-full p-0 border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold bg-transparent text-emerald-600"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Pricing for <strong>{activeCountry.name}</strong> is currently disabled. Check the box above to enable and set custom rates in {activeCountry.currency}.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                  </>
                )}
              </div>
              )}

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176]"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Active Plan (Visible to Users)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Badge as &quot;Most Popular / Recommended&quot;
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Conditional Scope: Owners / Drivers Specific Settings */}
          {type === "trenoops" && (
            <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200 space-y-5">
              {/* Header with Title and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-[#F96176]">
                      <Truck className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Package-Based Vehicle Slabs & Pricing
                      </h3>
                      <p className="text-xs text-gray-500">
                        1 unit = 1 vehicle (Truck or Trailer). Enter flat package rates for Trucks and Trailers across Monthly &amp; Yearly billing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSyncAllSlabsFromUSD}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:border-[#58BB87] hover:text-[#58BB87] shadow-xs transition"
                    title="Auto-calculate CA, MX, UK, AU from Base USD"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#58BB87]" />
                    Auto-Calculate All from US
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSlab}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F96176] text-white hover:bg-[#e04f63] shadow-md shadow-[#F96176]/25 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Vehicle Slab
                  </button>
                </div>
              </div>

              {/* Multi-Country Currency Selector Pills */}
              <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#F96176]" />
                    Target Country Pricing:
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    US rates automatically calculate international currencies. Click a country to customize.
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {COUNTRY_PACKAGE_OPTIONS.map((c) => {
                    const isActive = activeSlabCountryTab === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setActiveSlabCountryTab(c.code)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#F96176] text-white shadow-sm ring-2 ring-[#F96176]/30"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <span className="text-sm">{c.flag}</span>
                        <span>{c.code === "USA" ? "USA (USD Base)" : `${c.name} (${c.currency})`}</span>
                      </button>
                    );
                  })}
                </div>
                {activeSlabCountryTab !== "USA" && (
                  <div className="flex items-center gap-2 text-[11px] text-[#58BB87] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Viewing <strong>{activeSlabCountryTab}</strong> pricing. Edits to this country are saved as custom overrides without modifying US base rates.
                    </span>
                  </div>
                )}
              </div>

              {/* Package Vehicle Slabs Cards */}
              <div className="space-y-4">
                {packageVehicleSlabs.map((slab, idx) => {
                  const isUSA = activeSlabCountryTab === "USA";
                  const cCode = activeSlabCountryTab;
                  const countryItem = COUNTRY_PACKAGE_OPTIONS.find((c) => c.code === cCode);
                  const currSym = isUSA ? "$" : (slab.countryRates?.[cCode]?.symbol || countryItem?.symbol || "$");

                  const tMonthlyRate = isUSA ? slab.truckMonthlyRate : (slab.countryRates?.[cCode]?.truckMonthlyRate ?? 0);
                  const tMonthlyDisc = isUSA ? slab.truckMonthlyDiscount : (slab.countryRates?.[cCode]?.truckMonthlyDiscount ?? null);
                  const tYearlyRate = isUSA ? slab.truckYearlyRate : (slab.countryRates?.[cCode]?.truckYearlyRate ?? 0);
                  const tYearlyDisc = isUSA ? slab.truckYearlyDiscount : (slab.countryRates?.[cCode]?.truckYearlyDiscount ?? null);

                  const trMonthlyRate = isUSA ? slab.trailerMonthlyRate : (slab.countryRates?.[cCode]?.trailerMonthlyRate ?? 0);
                  const trMonthlyDisc = isUSA ? slab.trailerMonthlyDiscount : (slab.countryRates?.[cCode]?.trailerMonthlyDiscount ?? null);
                  const trYearlyRate = isUSA ? slab.trailerYearlyRate : (slab.countryRates?.[cCode]?.trailerYearlyRate ?? 0);
                  const trYearlyDisc = isUSA ? slab.trailerYearlyDiscount : (slab.countryRates?.[cCode]?.trailerYearlyDiscount ?? null);

                  const effTruckM = tMonthlyDisc && tMonthlyDisc > 0 ? tMonthlyDisc : tMonthlyRate;
                  const effTrailerM = trMonthlyDisc && trMonthlyDisc > 0 ? trMonthlyDisc : trMonthlyRate;
                  const effTruckY = tYearlyDisc && tYearlyDisc > 0 ? tYearlyDisc : tYearlyRate;
                  const effTrailerY = trYearlyDisc && trYearlyDisc > 0 ? trYearlyDisc : trYearlyRate;

                  return (
                    <div
                      key={slab.id || idx}
                      className="bg-white rounded-2xl border border-rose-200/90 shadow-2xs overflow-hidden"
                    >
                      {/* Slab Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/60 border-b border-rose-100">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-[#F96176] text-white">
                            Slab #{idx + 1}
                          </span>

                          {/* From Unit */}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                            <span>From:</span>
                            <select
                              value={slab.fromUnit}
                              onChange={(e) => handleUpdateSlab(idx, "fromUnit", e.target.value)}
                              className="px-2 py-1 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:ring-1 focus:ring-[#F96176]"
                            >
                              {VEHICLE_RANGE_OPTIONS.map((num) => (
                                <option key={num} value={num}>
                                  {num} {num === 1 ? "Unit" : "Units"}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* To Unit */}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                            <span>To:</span>
                            <select
                              value={slab.toUnit}
                              onChange={(e) => handleUpdateSlab(idx, "toUnit", e.target.value)}
                              className="px-2 py-1 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:ring-1 focus:ring-[#F96176]"
                            >
                              {VEHICLE_RANGE_OPTIONS.map((num) => (
                                <option key={num} value={num}>
                                  {num} {num === 1 ? "Unit" : "Units"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-rose-200 text-[#F96176]">
                            {slab.fromUnit === slab.toUnit
                              ? `${slab.fromUnit} Unit Slab`
                              : `${slab.fromUnit} to ${slab.toUnit} Units Slab`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isUSA && (
                            <button
                              type="button"
                              onClick={() => handleSyncSlabFromUSD(idx)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-gray-600 border border-gray-200 hover:text-[#58BB87] hover:border-[#58BB87] transition shadow-2xs"
                              title="Recompute this slab from US base rates"
                            >
                              <RotateCcw className="w-3 h-3 text-[#58BB87]" />
                              <span>Sync from US</span>
                            </button>
                          )}

                          {packageVehicleSlabs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlab(idx)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-rose-100/60 transition"
                              title="Delete this slab"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Slab Card Content - Truck & Trailer Side-by-Side */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Truck Section */}
                        <div className="p-3.5 rounded-xl border border-rose-100 bg-[#F8FAFC]">
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-rose-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#F96176] text-white flex items-center justify-center font-bold text-xs">
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-extrabold text-gray-900">
                                Truck (Power Unit) Rates
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-500 font-mono">
                              {countryItem?.flag} {currSym} {countryItem?.currency}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Monthly Rate
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!tMonthlyRate || tMonthlyRate === 0 ? "" : tMonthlyRate}
                                  onChange={(e) => handleUpdateSlab(idx, "truckMonthlyRate", e.target.value)}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Monthly Discount
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#58BB87] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!tMonthlyDisc || tMonthlyDisc === 0 ? "" : tMonthlyDisc}
                                  onChange={(e) => handleUpdateSlab(idx, "truckMonthlyDiscount", e.target.value)}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Yearly Rate
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!tYearlyRate || tYearlyRate === 0 ? "" : tYearlyRate}
                                  onChange={(e) => handleUpdateSlab(idx, "truckYearlyRate", e.target.value)}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Yearly Discount
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#58BB87] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!tYearlyDisc || tYearlyDisc === 0 ? "" : tYearlyDisc}
                                  onChange={(e) => handleUpdateSlab(idx, "truckYearlyDiscount", e.target.value)}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Trailer Section */}
                        <div className="p-3.5 rounded-xl border border-emerald-100 bg-[#F8FAFC]">
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#58BB87] text-white flex items-center justify-center font-bold text-xs">
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-extrabold text-gray-900">
                                Trailer (Trailed Unit) Rates
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-500 font-mono">
                              {countryItem?.flag} {currSym} {countryItem?.currency}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Monthly Rate
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!trMonthlyRate || trMonthlyRate === 0 ? "" : trMonthlyRate}
                                  onChange={(e) => handleUpdateSlab(idx, "trailerMonthlyRate", e.target.value)}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Monthly Discount
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#58BB87] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!trMonthlyDisc || trMonthlyDisc === 0 ? "" : trMonthlyDisc}
                                  onChange={(e) => handleUpdateSlab(idx, "trailerMonthlyDiscount", e.target.value)}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Yearly Rate
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!trYearlyRate || trYearlyRate === 0 ? "" : trYearlyRate}
                                  onChange={(e) => handleUpdateSlab(idx, "trailerYearlyRate", e.target.value)}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Yearly Discount
                              </label>
                              <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#58BB87] focus-within:border-transparent overflow-hidden shadow-2xs">
                                <span className="px-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border-r border-gray-200 shrink-0 select-none min-w-[34px] text-center">
                                  {currSym}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={!trYearlyDisc || trYearlyDisc === 0 ? "" : trYearlyDisc}
                                  onChange={(e) => handleUpdateSlab(idx, "trailerYearlyDiscount", e.target.value)}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Slab Card Footer - Effective Rate Summary */}
                      <div className="px-4 py-2.5 bg-rose-50/40 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-4 flex-wrap font-mono font-medium text-[11px]">
                          <span>
                            <strong>Monthly:</strong> Truck {currSym}{effTruckM} · Trailer {currSym}{effTrailerM}
                            <span className="text-[#58BB87] font-bold ml-1.5">
                              (Combined: {currSym}{effTruckM + effTrailerM})
                            </span>
                          </span>
                          <span>
                            <strong>Yearly:</strong> Truck {currSym}{effTruckY} · Trailer {currSym}{effTrailerY}
                            <span className="text-[#58BB87] font-bold ml-1.5">
                              (Combined: {currSym}{effTruckY + effTrailerY})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Info & Unlimited Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-rose-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#F96176] shrink-0" />
                  <span>
                    Users will select their truck &amp; trailer count on signup/dashboard. The matching slab determines their monthly or yearly billing package.
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-[11px] text-gray-700 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-[#F96176] border border-rose-200">
                    {packageVehicleSlabs.length} Slabs Configured
                  </span>
                  <span>
                    Range: {packageVehicleSlabs[0]?.fromUnit || 1} to{" "}
                    {packageVehicleSlabs[packageVehicleSlabs.length - 1]?.toUnit || 300} Units
                  </span>
                </div>
              </div>

              {/* Unlimited Fleet Checkbox */}
              <div className="flex items-center justify-end pt-2 border-t border-rose-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={isUnlimitedVehicles}
                    onChange={(e) => setIsUnlimitedVehicles(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176]"
                  />
                  <span>Unlimited Fleet (Disables upper limit restriction)</span>
                </label>
              </div>
            </div>
          )}

          {/* Conditional Scope: Mechanics Specific Settings */}
          {type === "treno_mechanic" && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#58BB87] flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Mechanic & Workshop Scope
                </h3>
              </div>

              {/* Mechanic Plan Category: Roadside vs Registered Company */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Plan Scope & Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Roadside Mechanic Card */}
                  <div
                    onClick={() => handleCategoryChange("roadside")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      mechanicCategory === "roadside"
                        ? "border-amber-500 bg-amber-50/80 shadow-xs ring-1 ring-amber-500"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        mechanicCategory === "roadside"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">
                          Roadside Mechanic
                        </span>
                        {mechanicCategory === "roadside" && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Independent mobile breakdown techs. Restricted to 4 core pages (Dashboard, Find Jobs, My Services, Profile).
                      </p>
                    </div>
                  </div>

                  {/* Registered Company Mechanic Card */}
                  <div
                    onClick={() => handleCategoryChange("company")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      mechanicCategory === "company"
                        ? "border-[#58BB87] bg-emerald-50/60 shadow-xs ring-1 ring-[#58BB87]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        mechanicCategory === "company"
                          ? "bg-[#58BB87] text-white shadow-xs"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">
                          Registered Company
                        </span>
                        {mechanicCategory === "company" && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#58BB87] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Full-service repair garage & fleet workshop. Unlocks all 10 platform modules + all future modules automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Bays & Radius */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Max Bays */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Service Bays / Workstations
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-600 select-none">
                      <input
                        type="checkbox"
                        checked={isUnlimitedBays}
                        onChange={(e) => setIsUnlimitedBays(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#58BB87] focus:ring-[#58BB87]"
                      />
                      Unlimited
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedBays}
                    value={isUnlimitedBays ? "" : maxBays}
                    onChange={(e) => setMaxBays(e.target.value)}
                    placeholder={isUnlimitedBays ? "Unlimited Bays" : "e.g. 3"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>

                {/* Service Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Service Radius (Miles)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-600 select-none">
                      <input
                        type="checkbox"
                        checked={isUnlimitedRadius}
                        onChange={(e) => setIsUnlimitedRadius(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#58BB87] focus:ring-[#58BB87]"
                      />
                      Nationwide / Unlimited
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedRadius}
                    value={isUnlimitedRadius ? "" : serviceRadiusMiles}
                    onChange={(e) => setServiceRadiusMiles(e.target.value)}
                    placeholder={isUnlimitedRadius ? "Unlimited Miles" : "e.g. 50"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Additional Mechanic Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={priorityJobLeads}
                    onChange={(e) => setPriorityJobLeads(e.target.checked)}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87]"
                  />
                  <div className="text-xs font-bold text-gray-800">
                    Priority Roadside Job Leads
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={directCarrierInvoicing}
                    onChange={(e) => setDirectCarrierInvoicing(e.target.checked)}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87]"
                  />
                  <div className="text-xs font-bold text-gray-800">
                    Direct Carrier & Fleet Invoicing
                  </div>
                </label>
              </div>

              {/* Per-Job Commission Section */}
              <div className="bg-white rounded-xl p-4 border border-emerald-200/90 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#58BB87] flex items-center justify-center shrink-0">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Per-Job Commission (Selected Services)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Set platform commission per roadside / repair job lead
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDefaultCommissionToAll}
                    className="text-xs font-bold text-[#58BB87] hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Apply Default to All
                  </button>
                </div>

                {/* Default Commission Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Default Commission Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDefaultCommissionType("percentage")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          defaultCommissionType === "percentage"
                            ? "bg-[#58BB87] text-white border-[#58BB87] shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" /> Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultCommissionType("flat")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          defaultCommissionType === "flat"
                            ? "bg-[#58BB87] text-white border-[#58BB87] shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Flat Fee ($)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Default Commission Rate / Amount
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#58BB87]">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={defaultCommissionValue}
                        onChange={(e) => setDefaultCommissionValue(e.target.value)}
                        placeholder={
                          defaultCommissionType === "percentage" ? "e.g. 7" : "e.g. 20"
                        }
                        className="w-full text-sm font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-gray-500 shrink-0 ml-1">
                        {defaultCommissionType === "percentage" ? "% per job" : "flat / job"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Per-Service Customization */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowServiceCustomization(!showServiceCustomization)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-lg border border-gray-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      Customize Commission per Specific Service ({availableServices.length} Services available)
                    </span>
                    {showServiceCustomization ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {showServiceCustomization && (
                    <div className="mt-2.5 p-3 rounded-lg border border-gray-200 bg-white space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={serviceSearchQuery}
                          onChange={(e) => setServiceSearchQuery(e.target.value)}
                          placeholder="Search services (e.g. Tire, Brake, Welding, Oil)..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#58BB87]"
                        />
                      </div>

                      {/* Services List Table */}
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                        {filteredServices.map((srv) => {
                          const cfg = serviceCommissions[srv.title];
                          const isEnabled = cfg ? cfg.enabled : true;
                          const currentType = cfg ? cfg.type : defaultCommissionType;
                          const currentVal = cfg ? cfg.value : defaultCommissionValue;
                          const isCustomized = !!cfg;

                          return (
                            <div
                              key={srv.title}
                              className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) =>
                                    handleServiceCommissionChange(srv.title, {
                                      enabled: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87] cursor-pointer"
                                />
                                <span
                                  className={`font-semibold truncate ${
                                    isEnabled
                                      ? "text-gray-900"
                                      : "text-gray-400 line-through"
                                  }`}
                                >
                                  {srv.title}
                                </span>
                                {isCustomized && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                    Custom
                                  </span>
                                )}
                              </div>

                              {isEnabled && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <select
                                    value={currentType}
                                    onChange={(e) =>
                                      handleServiceCommissionChange(srv.title, {
                                        type: e.target.value as CommissionType,
                                      })
                                    }
                                    className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 bg-white"
                                  >
                                    <option value="percentage">% Percent</option>
                                    <option value="flat">$ Flat</option>
                                  </select>

                                  <div className="flex items-center border border-gray-300 rounded px-2 py-1 w-20 bg-white">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={currentVal}
                                      onChange={(e) =>
                                        handleServiceCommissionChange(srv.title, {
                                          value: e.target.value,
                                        })
                                      }
                                      className="w-full text-xs font-bold text-gray-900 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-gray-500 font-bold ml-0.5">
                                      {currentType === "percentage" ? "%" : "$"}
                                    </span>
                                  </div>

                                  {isCustomized && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleResetServiceCommission(srv.title)
                                      }
                                      className="text-[11px] text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                      title="Reset to default rate"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Access RBAC Section */}
              <div className="bg-white rounded-xl p-4 border border-emerald-200/90 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#58BB87] flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Page Access Permissions (Web & App)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Select which platform pages are unlocked for this plan
                      </p>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setAllowedPages([...CORE_ROADSIDE_PAGES]);
                        setHasAllPagesAccess(false);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                    >
                      Roadside Preset (4 Pages)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAllowedPages(MECHANIC_PAGES_LIST.map((p) => p.key));
                        setHasAllPagesAccess(true);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#58BB87] text-white border border-[#58BB87] hover:bg-[#48a776] transition cursor-pointer"
                    >
                      Full Access (All Pages)
                    </button>
                  </div>
                </div>

                {/* All Current + Future Pages Switch */}
                <label className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 cursor-pointer select-none">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#58BB87] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        Include all future pages & modules automatically
                      </span>
                      <p className="text-[11px] text-gray-600">
                        When new features or pages are released, mechanics with this plan get automatic access without plan edits.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasAllPagesAccess}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasAllPagesAccess(checked);
                      if (checked) {
                        setAllowedPages(MECHANIC_PAGES_LIST.map((p) => p.key));
                      }
                    }}
                    className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87] ml-2 cursor-pointer"
                  />
                </label>

                {/* Page Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {MECHANIC_PAGES_LIST.map((p) => {
                    const isChecked = allowedPages.includes(p.key) || hasAllPagesAccess;
                    const isCore = p.isCore;

                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition cursor-pointer select-none ${
                          isChecked
                            ? "bg-emerald-50/60 border-emerald-300 shadow-2xs"
                            : "bg-white border-gray-200 hover:border-gray-300 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={hasAllPagesAccess}
                          onChange={() => handleTogglePage(p.key)}
                          className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87] mt-0.5 shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {p.label}
                            </span>
                            {isCore && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                Core
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">
                            {p.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Job Cancellation Penalty Policy Section (Applies to both Driver/Owner & Mechanic plans, goes to Admin) */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    Job Cancellation Penalty & Grace Period (Admin Revenue)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {type === "trenoops"
                      ? "Penalty fee charged if driver/carrier cancels after technician accepts the dispatch"
                      : "Penalty fee charged if mechanic cancels an accepted service job"}
                  </p>
                </div>
              </div>

              {/* Enable / Disable Penalty Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={penaltyEnabled}
                  onChange={(e) => setPenaltyEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#58BB87] focus:ring-[#58BB87]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Enable Penalty Policy
                </span>
              </label>
            </div>

            {penaltyEnabled ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Grace Period Window in Minutes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Free Grace Window (Minutes) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#58BB87]">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={gracePeriodMinutes}
                        onChange={(e) => setGracePeriodMinutes(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full text-xs font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-[11px] font-semibold text-gray-500 ml-1 shrink-0">
                        min
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Cancellation within this window has <strong>$0 penalty</strong>.
                    </p>
                  </div>

                  {/* Penalty Fee Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Penalty Fee Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPenaltyFeeType("percentage")}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                          penaltyFeeType === "percentage"
                            ? "bg-[#58BB87] text-white border-[#58BB87] shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <Percent className="w-3 h-3" /> Percent (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPenaltyFeeType("flat")}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                          penaltyFeeType === "flat"
                            ? "bg-[#58BB87] text-white border-[#58BB87] shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <DollarSign className="w-3 h-3" /> Flat ($)
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Percentage of estimated job or flat dollar fee.
                    </p>
                  </div>

                  {/* Penalty Amount / Value */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Penalty Amount / Rate <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#58BB87]">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={penaltyFeeValue}
                        onChange={(e) => setPenaltyFeeValue(e.target.value)}
                        placeholder={penaltyFeeType === "percentage" ? "e.g. 5" : "e.g. 25"}
                        className="w-full text-xs font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-gray-500 ml-1 shrink-0">
                        {penaltyFeeType === "percentage" ? "% per cancel" : "$ flat"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Charged if cancelled after grace window.
                    </p>
                  </div>
                </div>

                {/* Live Rule Preview Summary Banner */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-900">Active Rule Summary: </span>
                    {type === "trenoops" ? (
                      <>
                        Driver gets a <strong>{gracePeriodMinutes || "3"}-minute free grace window</strong> after mechanic accepts. If cancelled after {gracePeriodMinutes || "3"} minutes, a <strong>{penaltyFeeValue || "0"}{penaltyFeeType === "percentage" ? "%" : "$"} penalty fee</strong> is charged to the driver and <strong>goes directly to Platform Admin revenue</strong>.
                      </>
                    ) : (
                      <>
                        Mechanic gets a <strong>{gracePeriodMinutes || "3"}-minute free grace window</strong> after accepting the dispatch. If cancelled after {gracePeriodMinutes || "3"} minutes, a <strong>{penaltyFeeValue || "0"}{penaltyFeeType === "percentage" ? "%" : "$"} penalty fee</strong> is charged to the mechanic and <strong>goes directly to Platform Admin revenue</strong>.
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-gray-400" />
                <span>
                  Cancellation penalty is disabled for this plan. Cancellations occur with zero penalty.
                </span>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Plan Features / Highlights ({features.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Type a feature and press Add (e.g. Automated PM Schedule)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-[#F96176] text-white rounded-xl text-xs font-bold hover:bg-[#e04f63] flex items-center gap-1.5 transition shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {features.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No features added yet.</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Terms & Conditions ({termsAndConditions.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                placeholder="Type a policy or term and press Add"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#58BB87] text-sm"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 py-2 bg-[#58BB87] text-white rounded-xl text-xs font-bold hover:bg-[#48a776] flex items-center gap-1.5 transition shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {termsAndConditions.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {termsAndConditions.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove term"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No terms added yet.</p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center gap-2 ${
                type === "trenoops"
                  ? "bg-[#F96176] hover:bg-[#e04f63] shadow-[#F96176]/25"
                  : "bg-[#58BB87] hover:bg-[#48a875] shadow-[#58BB87]/25"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                "Update Subscription Plan"
              ) : (
                "Create Subscription Plan"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Global Vehicle Base Pricing Modal commented out */}
      {/* <GlobalVehiclePricingModal
        isOpen={isGlobalPricingModalOpen}
        onClose={() => setIsGlobalPricingModalOpen(false)}
        onUpdated={(updatedConfig) => {
          setGlobalPricing(updatedConfig);
        }}
      /> */}
    </div>
  );
}
