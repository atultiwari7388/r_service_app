"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Truck,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ChevronDown,
  User,
  Building,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  ArrowUpDown,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { GlobalToastError } from "@/utils/globalErrorToast";

interface NormalizedLoad {
  id: string;
  loadNumber: string;
  customer: string;
  status: string;
  statusGroup: "Completed" | "Active" | "Ready" | "Pre-Planned" | "Other";
  truck: string;
  truckId: string;
  trailer: string;
  trailerId: string;
  driver: string;
  driverId: string;
  carrier: string;
  carrierId: string;
  companyName: string;
  pickupDateStr: string;
  deliveryDateStr: string;
  dateObj: Date | null;
  miles: number;
  revenue: number;
  carrierPay: number;
  profit: number;
  origin: string;
  destination: string;
  equipmentType?: string;
}

interface TruckStat {
  truckKey: string;
  truckNumber: string;
  trailer: string;
  companyName: string;
  totalEarnings: number;
  totalMiles: number;
  avgRpm: number;
  totalLoads: number;
  completedLoads: number;
  activeLoads: number;
  avgRevenuePerLoad: number;
  loads: NormalizedLoad[];
}

interface DriverStat {
  driverKey: string;
  driverName: string;
  carrierName: string;
  totalMiles: number;
  totalEarnings: number;
  customerRevenue: number;
  avgRpm: number;
  totalLoads: number;
  completedLoads: number;
  activeLoads: number;
  avgMilesPerLoad: number;
  loads: NormalizedLoad[];
}

interface CompanyStat {
  companyName: string;
  totalRevenue: number;
  totalCarrierPay: number;
  totalProfit: number;
  totalMiles: number;
  totalLoads: number;
  completedLoads: number;
  avgRpm: number;
  truckCount: number;
  driverCount: number;
  loads: NormalizedLoad[];
}

type TimeframePreset =
  | "all"
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "custom";

type TabType = "trucks" | "drivers" | "companies" | "all_loads";

export default function DispatchReportsPage() {
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<NormalizedLoad[]>([]);
  const [userCompanies, setUserCompanies] = useState<string[]>([]);

  // Filter States
  const [activeTab, setActiveTab] = useState<TabType>("trucks");
  const [timeframe, setTimeframe] = useState<TimeframePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [quickSearchText, setQuickSearchText] = useState<string>("");
  const [quickCompanyFilter, setQuickCompanyFilter] = useState<string>("all");
  const [quickVehicleFilter, setQuickVehicleFilter] = useState<string>("all");
  const [quickTypeFilter, setQuickTypeFilter] = useState<"all" | "truck" | "trailer">("all");
  const [quickStatusFilter, setQuickStatusFilter] = useState<string>("all");
  const [quickDriverFilter, setQuickDriverFilter] = useState<string>("all");
  const [quickSortOption, setQuickSortOption] = useState<string>("earnings_desc");

  // Expandable rows state
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<string>("earnings");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const resolveUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (e) {
        setEffectiveUserId(user.uid);
      }
    };

    resolveUser();
  }, [user]);

  // Fetch Loads and Driver/Vehicle mappings
  const fetchReportData = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);

    try {
      // 1. Fetch Loads
      const loadsSnap = await getDocs(
        query(
          collection(db, "dispatch_loads"),
          where("effectiveUserId", "==", effectiveUserId)
        )
      );

      const rawDocs = loadsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<Record<string, any>>;

      // 2. Fetch Driver info & Vehicle info
      const driverMap: Record<string, string> = {};
      const vehicleMap: Record<string, string> = {};
      const companiesSet = new Set<string>();

      // Unique driver IDs
      const uniqueDriverIds = Array.from(
        new Set(
          rawDocs
            .map((r) => r.driverId || "")
            .filter((id) => typeof id === "string" && id.trim().length > 0)
        )
      );

      await Promise.all(
        uniqueDriverIds.map(async (driverId) => {
          try {
            const driverSnap = await getDoc(doc(db, "Users", driverId));
            if (driverSnap.exists()) {
              const dData = driverSnap.data();
              driverMap[driverId] = (
                dData.userName ||
                dData.email ||
                driverId
              ).trim();
            } else {
              driverMap[driverId] = driverId;
            }

            const vSnap = await getDocs(
              collection(db, "Users", driverId, "Vehicles")
            );
            vSnap.docs.forEach((vDoc) => {
              const vData = vDoc.data();
              const vNum = (vData.vehicleNumber || "").trim();
              const cName = (vData.companyName || "").trim();
              const myComp = (vData.myCompany || "").trim();
              if (myComp) companiesSet.add(myComp);
              if (cName) companiesSet.add(cName);

              if (vNum && cName) {
                vehicleMap[vDoc.id] = `${vNum} (${cName})${
                  myComp ? ` - ${myComp}` : ""
                }`;
              } else if (vNum) {
                vehicleMap[vDoc.id] = vNum;
              }
            });
          } catch (_) {}
        })
      );

      // Also fetch owner's direct vehicles
      try {
        const ownerVehiclesSnap = await getDocs(
          collection(db, "Users", effectiveUserId, "Vehicles")
        );
        ownerVehiclesSnap.docs.forEach((vDoc) => {
          const vData = vDoc.data();
          const vNum = (vData.vehicleNumber || "").trim();
          const cName = (vData.companyName || "").trim();
          const myComp = (vData.myCompany || "").trim();
          if (myComp) companiesSet.add(myComp);
          if (cName) companiesSet.add(cName);

          if (vNum && cName) {
            vehicleMap[vDoc.id] = `${vNum} (${cName})${
              myComp ? ` - ${myComp}` : ""
            }`;
          } else if (vNum) {
            vehicleMap[vDoc.id] = vNum;
          }
        });
      } catch (_) {}

      // Also check user's my_companies
      try {
        const compSnap = await getDocs(
          collection(db, "Users", effectiveUserId, "my_companies")
        );
        compSnap.docs.forEach((cDoc) => {
          const cData = cDoc.data();
          const cName = (cData.companyName || cData.name || "").trim();
          if (cName) companiesSet.add(cName);
        });
      } catch (_) {}

      // Normalize Loads
      const normalized: NormalizedLoad[] = rawDocs.map((record) => {
        const pickups = Array.isArray(record.pickups) ? record.pickups : [];
        const deliveries = Array.isArray(record.deliveries)
          ? record.deliveries
          : [];
        const firstPickup = pickups[0] || {};
        const lastDelivery = deliveries[deliveries.length - 1] || deliveries[0] || {};

        // Parse miles safely
        const rawMiles =
          record.loadedMiles ??
          record.tenderedMiles ??
          record.distance ??
          record.miles ??
          0;
        const cleanMiles =
          typeof rawMiles === "number"
            ? rawMiles
            : parseFloat(String(rawMiles).replace(/[^0-9.]/g, "")) || 0;

        // Parse revenue safely
        const primaryFee = Number(record.primaryFees || record.lineHaul || 0);
        const calcRevenue =
          primaryFee +
          Number(record.fuelSurcharge || 0) +
          Number(record.detention || 0) +
          Number(record.layover || 0) +
          Number(record.tonu || 0) +
          Number(record.accessorials || 0);
        const revenue = Number(
          record.totalCustomerRate ||
            record.revenue ||
            calcRevenue ||
            primaryFee ||
            0
        );

        // Carrier pay
        const carrierPay = Number(
          record.totalCarrierPay || record.carrierPay || 0
        );
        const profit = revenue - carrierPay;

        // Origin and Destination
        const originCity =
          firstPickup.cityStateZip ||
          firstPickup.locationName ||
          firstPickup.address ||
          record.pickupLocation ||
          "Origin";
        const destCity =
          lastDelivery.cityStateZip ||
          lastDelivery.locationName ||
          lastDelivery.address ||
          record.dropLocation ||
          "Destination";

        // Date resolution
        const rawDateStr =
          firstPickup.date ||
          record.pickupDate ||
          record.date ||
          record.createdAtDate ||
          "";
        let dateObj: Date | null = null;
        if (record.createdAt?.seconds) {
          dateObj = new Date(record.createdAt.seconds * 1000);
        } else if (rawDateStr) {
          const parsed = new Date(rawDateStr);
          if (!isNaN(parsed.getTime())) dateObj = parsed;
        }

        // Status group
        const statusStr = String(record.status || "Draft").trim();
        let statusGroup: NormalizedLoad["statusGroup"] = "Other";
        const lowerStatus = statusStr.toLowerCase();
        if (
          lowerStatus === "completed" ||
          lowerStatus === "delivered" ||
          lowerStatus === "paid" ||
          lowerStatus === "invoiced"
        ) {
          statusGroup = "Completed";
        } else if (
          lowerStatus === "in transit" ||
          lowerStatus === "active" ||
          lowerStatus === "picked up"
        ) {
          statusGroup = "Active";
        } else if (lowerStatus === "assigned" || lowerStatus === "ready") {
          statusGroup = "Ready";
        } else if (lowerStatus === "draft" || lowerStatus === "posted") {
          statusGroup = "Pre-Planned";
        }

        // Truck & Trailer
        const truckLabel =
          (record.truckId && vehicleMap[record.truckId]) ||
          record.truck ||
          record.truckId ||
          "Unassigned";
        const trailerLabel =
          (record.trailerId && vehicleMap[record.trailerId]) ||
          record.trailer ||
          record.trailerId ||
          "-";

        // Driver
        const driverLabel =
          (record.driverId && driverMap[record.driverId]) ||
          record.driverName ||
          record.driver ||
          record.driverContact?.name ||
          "Unassigned";

        // Carrier & Company
        const carrierLabel =
          record.carrierName ||
          record.carrier ||
          record.carrierContact?.company ||
          "-";
        const compName =
          record.companyName ||
          record.myCompany ||
          record.bookingAuthority ||
          record.brokerInfo?.companyName ||
          "Default Company";

        if (compName && compName !== "Default Company") {
          companiesSet.add(compName);
        }

        return {
          id: record.id,
          loadNumber: record.loadNumber || `LD-${record.id.slice(0, 6)}`,
          customer: record.customerName || record.customer || "-",
          status: statusStr,
          statusGroup,
          truck: truckLabel,
          truckId: record.truckId || "",
          trailer: trailerLabel,
          trailerId: record.trailerId || "",
          driver: driverLabel,
          driverId: record.driverId || "",
          carrier: carrierLabel,
          carrierId: record.carrierId || "",
          companyName: compName,
          pickupDateStr: rawDateStr || "-",
          deliveryDateStr: lastDelivery.date || record.dropDate || "-",
          dateObj,
          miles: cleanMiles,
          revenue,
          carrierPay,
          profit,
          origin: originCity,
          destination: destCity,
          equipmentType: record.vanType || record.type || record.equipmentType,
        };
      });

      setLoads(normalized);
      setUserCompanies(Array.from(companiesSet).filter(Boolean));
    } catch (err) {
      GlobalToastError(err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Derived unique companies
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    userCompanies.forEach((c) => c && set.add(c.trim()));
    loads.forEach((l) => {
      if (l.companyName && l.companyName !== "Default Company") {
        set.add(l.companyName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [userCompanies, loads]);

  // Derived available vehicles based on quickCompanyFilter & quickTypeFilter
  const availableVehiclesForQuickFilter = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; type: "Truck" | "Trailer"; company: string }
    >();

    loads.forEach((l) => {
      if (l.truck && l.truck !== "Unassigned" && l.truck !== "-") {
        const id = l.truck;
        if (!map.has(id)) {
          map.set(id, { id, label: l.truck, type: "Truck", company: l.companyName });
        }
      }
      if (l.trailer && l.trailer !== "Unassigned" && l.trailer !== "-") {
        const id = l.trailer;
        if (!map.has(id)) {
          map.set(id, { id, label: l.trailer, type: "Trailer", company: l.companyName });
        }
      }
    });

    let list = Array.from(map.values());

    if (quickTypeFilter === "truck") {
      list = list.filter((v) => v.type === "Truck");
    } else if (quickTypeFilter === "trailer") {
      list = list.filter((v) => v.type === "Trailer");
    }

    if (quickCompanyFilter !== "all") {
      const targetCompanyLower = quickCompanyFilter.toLowerCase().trim();
      list = list.filter((v) => {
        const vComp = (v.company || "").toLowerCase().trim();
        const vLabel = v.label.toLowerCase().trim();
        return vComp === targetCompanyLower || vLabel.includes(targetCompanyLower);
      });
    }

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [loads, quickCompanyFilter, quickTypeFilter]);

  // Derived available drivers
  const availableDrivers = useMemo(() => {
    const set = new Set<string>();
    loads.forEach((l) => {
      if (l.driver && l.driver !== "Unassigned" && l.driver !== "-") {
        set.add(l.driver.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [loads]);

  // Handle Quick Company filter change with smart vehicle reset
  const handleQuickCompanyFilterChange = (selectedCompany: string) => {
    setQuickCompanyFilter(selectedCompany);
    if (selectedCompany !== "all" && quickVehicleFilter !== "all") {
      const exists = availableVehiclesForQuickFilter.some(
        (v) => v.id === quickVehicleFilter || v.label === quickVehicleFilter
      );
      if (!exists) {
        setQuickVehicleFilter("all");
      }
    }
  };

  // Handle Quick Type filter change with smart vehicle reset
  const handleQuickTypeFilterChange = (
    selectedType: "all" | "truck" | "trailer"
  ) => {
    setQuickTypeFilter(selectedType);
    if (selectedType !== "all" && quickVehicleFilter !== "all") {
      const selectedVeh = availableVehiclesForQuickFilter.find(
        (v) => v.id === quickVehicleFilter || v.label === quickVehicleFilter
      );
      if (selectedVeh && selectedVeh.type.toLowerCase() !== selectedType) {
        setQuickVehicleFilter("all");
      }
    }
  };

  const isQuickFilterActive =
    quickSearchText !== "" ||
    quickCompanyFilter !== "all" ||
    quickVehicleFilter !== "all" ||
    quickTypeFilter !== "all" ||
    quickStatusFilter !== "all" ||
    quickDriverFilter !== "all" ||
    timeframe !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    quickSortOption !== "earnings_desc";

  const clearQuickFilters = () => {
    setQuickSearchText("");
    setQuickCompanyFilter("all");
    setQuickVehicleFilter("all");
    setQuickTypeFilter("all");
    setQuickStatusFilter("all");
    setQuickDriverFilter("all");
    setTimeframe("all");
    setStartDate("");
    setEndDate("");
    setQuickSortOption("earnings_desc");
  };

  // Date Presets & Quick Filter Logic
  const filteredLoads = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return loads.filter((load) => {
      // 1. Timeframe Filter
      if (timeframe !== "all" && load.dateObj) {
        const loadTime = load.dateObj.getTime();

        if (timeframe === "today") {
          if (loadTime < todayStart.getTime()) return false;
        } else if (timeframe === "this_week") {
          const dayOfWeek = now.getDay();
          const startOfWeek = new Date(todayStart);
          startOfWeek.setDate(todayStart.getDate() - dayOfWeek);
          if (loadTime < startOfWeek.getTime()) return false;
        } else if (timeframe === "this_month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (loadTime < startOfMonth.getTime()) return false;
        } else if (timeframe === "last_month") {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          if (
            loadTime < startOfLastMonth.getTime() ||
            loadTime > endOfLastMonth.getTime()
          ) {
            return false;
          }
        } else if (timeframe === "this_quarter") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          if (loadTime < startOfQuarter.getTime()) return false;
        } else if (timeframe === "this_year") {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (loadTime < startOfYear.getTime()) return false;
        } else if (timeframe === "custom") {
          if (startDate) {
            const start = new Date(startDate);
            if (loadTime < start.getTime()) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (loadTime > end.getTime()) return false;
          }
        }
      }

      // 2. Company Filter
      if (quickCompanyFilter !== "all") {
        const targetCompany = quickCompanyFilter.toLowerCase().trim();
        const matchesComp =
          load.companyName.toLowerCase().trim() === targetCompany ||
          load.truck.toLowerCase().includes(targetCompany);
        if (!matchesComp) return false;
      }

      // 3. Vehicle Filter
      if (quickVehicleFilter !== "all") {
        const targetVeh = quickVehicleFilter.toLowerCase().trim();
        const matchesVeh =
          load.truckId === quickVehicleFilter ||
          load.trailerId === quickVehicleFilter ||
          load.truck.toLowerCase().includes(targetVeh) ||
          load.trailer.toLowerCase().includes(targetVeh);
        if (!matchesVeh) return false;
      }

      // 4. Vehicle Type Filter (Truck or Trailer)
      if (quickTypeFilter === "truck") {
        const hasTruck =
          load.truck &&
          load.truck !== "Unassigned" &&
          load.truck !== "-" &&
          load.truck.trim().length > 0;
        if (!hasTruck) return false;
      } else if (quickTypeFilter === "trailer") {
        const hasTrailer =
          load.trailer &&
          load.trailer !== "Unassigned" &&
          load.trailer !== "-" &&
          load.trailer.trim().length > 0;
        if (!hasTrailer) return false;
      }

      // 5. Status Filter
      if (quickStatusFilter !== "all") {
        if (quickStatusFilter === "completed" && load.statusGroup !== "Completed") {
          return false;
        }
        if (quickStatusFilter === "active" && load.statusGroup !== "Active") {
          return false;
        }
        if (quickStatusFilter === "ready" && load.statusGroup !== "Ready") {
          return false;
        }
        if (quickStatusFilter === "pre-planned" && load.statusGroup !== "Pre-Planned") {
          return false;
        }
      }

      // 6. Driver Filter
      if (quickDriverFilter !== "all") {
        const targetDriver = quickDriverFilter.toLowerCase().trim();
        const matchesDriver =
          load.driverId === quickDriverFilter ||
          load.driver.toLowerCase().trim() === targetDriver ||
          load.carrier.toLowerCase().trim() === targetDriver;
        if (!matchesDriver) return false;
      }

      // 7. Quick Search Text
      if (quickSearchText.trim()) {
        const q = quickSearchText.toLowerCase().trim();
        const matchesQuery =
          load.loadNumber.toLowerCase().includes(q) ||
          load.truck.toLowerCase().includes(q) ||
          load.trailer.toLowerCase().includes(q) ||
          load.driver.toLowerCase().includes(q) ||
          load.carrier.toLowerCase().includes(q) ||
          load.customer.toLowerCase().includes(q) ||
          load.companyName.toLowerCase().includes(q) ||
          load.origin.toLowerCase().includes(q) ||
          load.destination.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [
    loads,
    timeframe,
    startDate,
    endDate,
    quickCompanyFilter,
    quickVehicleFilter,
    quickTypeFilter,
    quickStatusFilter,
    quickDriverFilter,
    quickSearchText,
  ]);

  // Overall KPI Metrics
  const summaryKPIs = useMemo(() => {
    let totalRevenue = 0;
    let totalCarrierPay = 0;
    let totalMiles = 0;
    let completedCount = 0;
    let activeCount = 0;

    filteredLoads.forEach((load) => {
      totalRevenue += load.revenue;
      totalCarrierPay += load.carrierPay;
      totalMiles += load.miles;
      if (load.statusGroup === "Completed") completedCount++;
      if (load.statusGroup === "Active") activeCount++;
    });

    const netProfit = totalRevenue - totalCarrierPay;
    const avgRpm = totalMiles > 0 ? totalRevenue / totalMiles : 0;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCarrierPay,
      netProfit,
      totalMiles,
      avgRpm,
      totalLoads: filteredLoads.length,
      completedCount,
      activeCount,
      profitMargin,
    };
  }, [filteredLoads]);

  // Grouped by Truck / Trailer
  const truckStats = useMemo<TruckStat[]>(() => {
    const map = new Map<string, TruckStat>();

    filteredLoads.forEach((load) => {
      const key = `${load.truck}_${load.trailer}`;
      if (!map.has(key)) {
        map.set(key, {
          truckKey: key,
          truckNumber: load.truck,
          trailer: load.trailer,
          companyName: load.companyName,
          totalEarnings: 0,
          totalMiles: 0,
          avgRpm: 0,
          totalLoads: 0,
          completedLoads: 0,
          activeLoads: 0,
          avgRevenuePerLoad: 0,
          loads: [],
        });
      }

      const stat = map.get(key)!;
      stat.totalEarnings += load.revenue;
      stat.totalMiles += load.miles;
      stat.totalLoads += 1;
      if (load.statusGroup === "Completed") stat.completedLoads += 1;
      if (load.statusGroup === "Active") stat.activeLoads += 1;
      stat.loads.push(load);
    });

    // Calculate averages & sort
    return Array.from(map.values())
      .map((stat) => ({
        ...stat,
        avgRpm: stat.totalMiles > 0 ? stat.totalEarnings / stat.totalMiles : 0,
        avgRevenuePerLoad:
          stat.totalLoads > 0 ? stat.totalEarnings / stat.totalLoads : 0,
      }))
      .sort((a, b) => {
        if (quickSortOption === "miles_desc") return b.totalMiles - a.totalMiles;
        if (quickSortOption === "miles_asc") return a.totalMiles - b.totalMiles;
        if (quickSortOption === "loads_desc") return b.totalLoads - a.totalLoads;
        if (quickSortOption === "rpm_desc") return b.avgRpm - a.avgRpm;
        if (quickSortOption === "earnings_asc") return a.totalEarnings - b.totalEarnings;
        if (quickSortOption === "earnings_desc") return b.totalEarnings - a.totalEarnings;

        if (sortField === "miles") {
          return sortOrder === "desc"
            ? b.totalMiles - a.totalMiles
            : a.totalMiles - b.totalMiles;
        }
        if (sortField === "loads") {
          return sortOrder === "desc"
            ? b.totalLoads - a.totalLoads
            : a.totalLoads - b.totalLoads;
        }
        if (sortField === "rpm") {
          return sortOrder === "desc" ? b.avgRpm - a.avgRpm : a.avgRpm - b.avgRpm;
        }
        return sortOrder === "desc"
          ? b.totalEarnings - a.totalEarnings
          : a.totalEarnings - b.totalEarnings;
      });
  }, [filteredLoads, sortField, sortOrder, quickSortOption]);

  // Grouped by Driver / Carrier
  const driverStats = useMemo<DriverStat[]>(() => {
    const map = new Map<string, DriverStat>();

    filteredLoads.forEach((load) => {
      const key = `${load.driver}_${load.carrier}`;
      if (!map.has(key)) {
        map.set(key, {
          driverKey: key,
          driverName: load.driver,
          carrierName: load.carrier,
          totalMiles: 0,
          totalEarnings: 0,
          customerRevenue: 0,
          avgRpm: 0,
          totalLoads: 0,
          completedLoads: 0,
          activeLoads: 0,
          avgMilesPerLoad: 0,
          loads: [],
        });
      }

      const stat = map.get(key)!;
      stat.totalMiles += load.miles;
      stat.totalEarnings += load.carrierPay || load.revenue;
      stat.customerRevenue += load.revenue;
      stat.totalLoads += 1;
      if (load.statusGroup === "Completed") stat.completedLoads += 1;
      if (load.statusGroup === "Active") stat.activeLoads += 1;
      stat.loads.push(load);
    });

    return Array.from(map.values())
      .map((stat) => ({
        ...stat,
        avgRpm: stat.totalMiles > 0 ? stat.totalEarnings / stat.totalMiles : 0,
        avgMilesPerLoad:
          stat.totalLoads > 0 ? stat.totalMiles / stat.totalLoads : 0,
      }))
      .sort((a, b) => {
        if (quickSortOption === "miles_desc") return b.totalMiles - a.totalMiles;
        if (quickSortOption === "miles_asc") return a.totalMiles - b.totalMiles;
        if (quickSortOption === "loads_desc") return b.totalLoads - a.totalLoads;
        if (quickSortOption === "rpm_desc") return b.avgRpm - a.avgRpm;
        if (quickSortOption === "earnings_asc") return a.totalEarnings - b.totalEarnings;
        if (quickSortOption === "earnings_desc") return b.totalEarnings - a.totalEarnings;

        if (sortField === "miles") {
          return sortOrder === "desc"
            ? b.totalMiles - a.totalMiles
            : a.totalMiles - b.totalMiles;
        }
        if (sortField === "loads") {
          return sortOrder === "desc"
            ? b.totalLoads - a.totalLoads
            : a.totalLoads - b.totalLoads;
        }
        if (sortField === "rpm") {
          return sortOrder === "desc" ? b.avgRpm - a.avgRpm : a.avgRpm - b.avgRpm;
        }
        return sortOrder === "desc"
          ? b.totalEarnings - a.totalEarnings
          : a.totalEarnings - b.totalEarnings;
      });
  }, [filteredLoads, sortField, sortOrder, quickSortOption]);

  // Grouped by Company
  const companyStats = useMemo<CompanyStat[]>(() => {
    const map = new Map<string, CompanyStat>();

    filteredLoads.forEach((load) => {
      const key = load.companyName || "Default Company";
      if (!map.has(key)) {
        map.set(key, {
          companyName: key,
          totalRevenue: 0,
          totalCarrierPay: 0,
          totalProfit: 0,
          totalMiles: 0,
          totalLoads: 0,
          completedLoads: 0,
          avgRpm: 0,
          truckCount: 0,
          driverCount: 0,
          loads: [],
        });
      }

      const stat = map.get(key)!;
      stat.totalRevenue += load.revenue;
      stat.totalCarrierPay += load.carrierPay;
      stat.totalProfit += load.profit;
      stat.totalMiles += load.miles;
      stat.totalLoads += 1;
      if (load.statusGroup === "Completed") stat.completedLoads += 1;
      stat.loads.push(load);
    });

    return Array.from(map.values())
      .map((stat) => {
        const uniqueTrucks = new Set(stat.loads.map((l) => l.truck));
        const uniqueDrivers = new Set(stat.loads.map((l) => l.driver));
        return {
          ...stat,
          avgRpm: stat.totalMiles > 0 ? stat.totalRevenue / stat.totalMiles : 0,
          truckCount: uniqueTrucks.size,
          driverCount: uniqueDrivers.size,
        };
      })
      .sort((a, b) => {
        if (quickSortOption === "miles_desc") return b.totalMiles - a.totalMiles;
        if (quickSortOption === "miles_asc") return a.totalMiles - b.totalMiles;
        if (quickSortOption === "loads_desc") return b.totalLoads - a.totalLoads;
        if (quickSortOption === "rpm_desc") return b.avgRpm - a.avgRpm;
        if (quickSortOption === "earnings_asc") return a.totalRevenue - b.totalRevenue;
        return b.totalRevenue - a.totalRevenue;
      });
  }, [filteredLoads, quickSortOption]);

  // Sorted Loads for All Loads Tab
  const sortedLoads = useMemo(() => {
    return [...filteredLoads].sort((a, b) => {
      if (quickSortOption === "date_asc") {
        const tA = a.dateObj ? a.dateObj.getTime() : 0;
        const tB = b.dateObj ? b.dateObj.getTime() : 0;
        return tA - tB;
      }
      if (quickSortOption === "earnings_desc") {
        return b.revenue - a.revenue;
      }
      if (quickSortOption === "earnings_asc") {
        return a.revenue - b.revenue;
      }
      if (quickSortOption === "miles_desc") {
        return b.miles - a.miles;
      }
      if (quickSortOption === "miles_asc") {
        return a.miles - b.miles;
      }
      // default newest date
      const tA = a.dateObj ? a.dateObj.getTime() : 0;
      const tB = b.dateObj ? b.dateObj.getTime() : 0;
      return tB - tA;
    });
  }, [filteredLoads, quickSortOption]);

  // Toggle Row Expansion
  const toggleExpandRow = (key: string) => {
    setExpandedRowKey((prev) => (prev === key ? null : key));
  };

  // Export to CSV Handler
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "trucks") {
      csvContent +=
        "Truck,Trailer,Company,Total Earnings ($),Total Miles,Avg RPM ($/mi),Completed Loads,Active Loads,Total Loads\n";
      truckStats.forEach((t) => {
        csvContent += `"${t.truckNumber}","${t.trailer}","${
          t.companyName
        }",${t.totalEarnings.toFixed(2)},${t.totalMiles.toFixed(
          1
        )},${t.avgRpm.toFixed(2)},${t.completedLoads},${t.activeLoads},${
          t.totalLoads
        }\n`;
      });
    } else if (activeTab === "drivers") {
      csvContent +=
        "Driver,Carrier,Completed Miles,Earnings ($),Customer Revenue ($),Avg RPM ($/mi),Completed Loads,Active Loads,Total Loads\n";
      driverStats.forEach((d) => {
        csvContent += `"${d.driverName}","${d.carrierName}",${d.totalMiles.toFixed(
          1
        )},${d.totalEarnings.toFixed(2)},${d.customerRevenue.toFixed(2)},${d.avgRpm.toFixed(
          2
        )},${d.completedLoads},${d.activeLoads},${d.totalLoads}\n`;
      });
    } else if (activeTab === "companies") {
      csvContent +=
        "Company,Total Revenue ($),Carrier Pay ($),Net Profit ($),Total Miles,Completed Loads,Total Loads,Avg RPM ($/mi)\n";
      companyStats.forEach((c) => {
        csvContent += `"${c.companyName}",${c.totalRevenue.toFixed(
          2
        )},${c.totalCarrierPay.toFixed(2)},${c.totalProfit.toFixed(
          2
        )},${c.totalMiles.toFixed(1)},${c.completedLoads},${c.totalLoads},${c.avgRpm.toFixed(
          2
        )}\n`;
      });
    } else {
      csvContent +=
        "Load #,Customer,Status,Truck,Trailer,Driver,Carrier,Company,Origin,Destination,Miles,Revenue ($),Carrier Pay ($),Profit ($),Date\n";
      filteredLoads.forEach((l) => {
        csvContent += `"${l.loadNumber}","${l.customer}","${l.status}","${
          l.truck
        }","${l.trailer}","${l.driver}","${l.carrier}","${
          l.companyName
        }","${l.origin}","${l.destination}",${l.miles.toFixed(
          1
        )},${l.revenue.toFixed(2)},${l.carrierPay.toFixed(2)},${l.profit.toFixed(
          2
        )},"${l.pickupDateStr}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dispatch_report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 print:bg-white print:pb-0 print:p-0">
      {/* Print-Only Professional Document Header */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Dispatch Analytics & Earnings Report
            </h1>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Timeframe:{" "}
              <span className="font-bold text-gray-900">
                {timeframe === "all"
                  ? "All Time"
                  : timeframe.replace("_", " ").toUpperCase()}
              </span>{" "}
              | Generated: {new Date().toLocaleDateString()} | Active Tab:{" "}
              <span className="font-bold uppercase text-gray-900">{activeTab}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-[#F96176] tracking-wider">
              RABBIT DISPATCH
            </span>
          </div>
        </div>
      </div>

      {/* Top Header (Hidden on Print) */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#F96176]/10 text-[#F96176] rounded-xl">
                <TrendingUp size={24} />
              </span>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Dispatch Analytics & Reports
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Complete performance and earnings overview across Trucks, Trailers,
              Drivers, Carriers, and Companies.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition shadow-sm cursor-pointer"
              title="Export Current Table as CSV"
            >
              <Download size={16} className="text-gray-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow-sm cursor-pointer"
              title="Print Summary Report"
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-3">
          {/* Top Row: Timeframe Presets & Custom Date Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {(
                [
                  { key: "all", label: "All Time" },
                  { key: "this_month", label: "This Month" },
                  { key: "this_quarter", label: "This Quarter" },
                  { key: "this_year", label: "This Year" },
                  { key: "this_week", label: "This Week" },
                  { key: "today", label: "Today" },
                  { key: "last_month", label: "Last Month" },
                  { key: "custom", label: "Custom Date" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setTimeframe(preset.key)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                    timeframe === preset.key
                      ? "bg-[#F96176] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs if Custom is selected */}
            {timeframe === "custom" && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-300">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 outline-none"
                  placeholder="Start date"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 outline-none"
                  placeholder="End date"
                />
              </div>
            )}
          </div>

          {/* Bottom Row: Quick / Short Filters (matching /records styling) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Quick Search */}
            <div className="relative col-span-2 sm:col-span-1 w-full sm:w-[160px] md:w-[180px]">
              <input
                type="text"
                value={quickSearchText}
                onChange={(e: any) => setQuickSearchText(e.target.value)}
                placeholder="Quick search..."
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white text-gray-800 transition"
              />
              {quickSearchText && (
                <button
                  onClick={() => setQuickSearchText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Company Filter Dropdown */}
            <select
              value={quickCompanyFilter}
              onChange={(e: any) =>
                handleQuickCompanyFilterChange(e.target.value)
              }
              className={`w-full sm:w-auto sm:max-w-[170px] truncate px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                quickCompanyFilter !== "all"
                  ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <option value="all">All Companies</option>
              {availableCompanies.map((compName) => (
                <option key={compName} value={compName}>
                  🏢 {compName}
                </option>
              ))}
            </select>

            {/* Vehicle Filter Dropdown */}
            <select
              value={quickVehicleFilter}
              onChange={(e: any) => setQuickVehicleFilter(e.target.value)}
              className={`w-full sm:w-auto sm:max-w-[170px] truncate px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                quickVehicleFilter !== "all"
                  ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <option value="all">All Vehicles</option>
              {availableVehiclesForQuickFilter.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.type === "Trailer" ? "🚚" : "🚛"} {v.label}
                </option>
              ))}
            </select>

            {/* Vehicle Type Filter Dropdown (Truck or Trailer) */}
            <select
              value={quickTypeFilter}
              onChange={(e: any) =>
                handleQuickTypeFilterChange(
                  e.target.value as "all" | "truck" | "trailer"
                )
              }
              className={`w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                quickTypeFilter !== "all"
                  ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <option value="all">Vehicle Type: All</option>
              <option value="truck">🚛 Truck</option>
              <option value="trailer">🚚 Trailer</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={quickStatusFilter}
              onChange={(e: any) => setQuickStatusFilter(e.target.value)}
              className={`w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                quickStatusFilter !== "all"
                  ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <option value="all">Status: All</option>
              <option value="completed">Completed Only</option>
              <option value="active">Active / In Transit</option>
              <option value="ready">Ready / Assigned</option>
              <option value="pre-planned">Pre-Planned / Draft</option>
            </select>

            {/* Driver Filter Dropdown */}
            {availableDrivers.length > 0 && (
              <select
                value={quickDriverFilter}
                onChange={(e: any) => setQuickDriverFilter(e.target.value)}
                className={`w-full sm:w-auto sm:max-w-[170px] truncate px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                  quickDriverFilter !== "all"
                    ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <option value="all">Driver: All</option>
                {availableDrivers.map((d) => (
                  <option key={d} value={d}>
                    👤 {d}
                  </option>
                ))}
              </select>
            )}

            {/* Sort By Dropdown */}
            <select
              value={quickSortOption}
              onChange={(e: any) => setQuickSortOption(e.target.value)}
              className={`w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                quickSortOption !== "earnings_desc"
                  ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <option value="earnings_desc">Earnings: High to Low</option>
              <option value="earnings_asc">Earnings: Low to High</option>
              <option value="miles_desc">Miles: Highest</option>
              <option value="miles_asc">Miles: Lowest</option>
              <option value="loads_desc">Loads: Most</option>
              <option value="rpm_desc">Avg RPM: Highest</option>
              <option value="date_desc">Date: Newest</option>
              <option value="date_asc">Date: Oldest</option>
            </select>

            {/* Reset / Clear All Filters */}
            {isQuickFilterActive && (
              <button
                onClick={clearQuickFilters}
                className="col-span-2 sm:col-span-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition shadow-2xs cursor-pointer"
                title="Reset all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:max-w-none print:p-0">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 print:grid-cols-4 print:gap-3 print:mb-6">
          {/* Card 1: Gross Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={20} />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-gray-900">
                ${summaryKPIs.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">
                  {summaryKPIs.totalLoads}
                </span>{" "}
                total dispatched loads
              </p>
            </div>
          </div>

          {/* Card 2: Total Dispatched Miles */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Miles Run
              </span>
              <span className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <Truck size={20} />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-gray-900">
                {summaryKPIs.totalMiles.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-sm font-semibold text-gray-400">mi</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Avg. RPM:{" "}
                <span className="font-semibold text-orange-600">
                  ${summaryKPIs.avgRpm.toFixed(2)} / mi
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Completed vs Active */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Load Status
              </span>
              <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <CheckCircle2 size={20} />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-emerald-600">
                {summaryKPIs.completedCount}
              </h3>
              <span className="text-xs text-gray-500">Completed</span>
              <span className="text-gray-300">|</span>
              <h3 className="text-2xl font-black text-amber-500">
                {summaryKPIs.activeCount}
              </h3>
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Completion rate:{" "}
              {summaryKPIs.totalLoads > 0
                ? `${Math.round(
                    (summaryKPIs.completedCount / summaryKPIs.totalLoads) * 100
                  )}%`
                : "0%"}
            </p>
          </div>

          {/* Card 4: Net Margin & Profit */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Net Profit & Margin
              </span>
              <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingUp size={20} />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-gray-900">
                ${summaryKPIs.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Margin:{" "}
                <span className="font-semibold text-rose-600">
                  {summaryKPIs.profitMargin.toFixed(1)}%
                </span>{" "}
                (Carrier Pay: ${summaryKPIs.totalCarrierPay.toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 print:border-none print:shadow-none">
          <div className="flex border-b border-gray-200 px-6 pt-3 gap-6 print:hidden">
            <button
              onClick={() => {
                setActiveTab("trucks");
                setExpandedRowKey(null);
              }}
              className={clsx(
                "pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer",
                activeTab === "trucks"
                  ? "border-[#F96176] text-[#F96176]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              <Truck size={17} />
              <span>Truck & Trailer Report</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {truckStats.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("drivers");
                setExpandedRowKey(null);
              }}
              className={clsx(
                "pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer",
                activeTab === "drivers"
                  ? "border-[#F96176] text-[#F96176]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              <User size={17} />
              <span>Driver & Carrier Report</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {driverStats.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("companies");
                setExpandedRowKey(null);
              }}
              className={clsx(
                "pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer",
                activeTab === "companies"
                  ? "border-[#F96176] text-[#F96176]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              <Building size={17} />
              <span>Company Performance</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {companyStats.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("all_loads");
                setExpandedRowKey(null);
              }}
              className={clsx(
                "pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer",
                activeTab === "all_loads"
                  ? "border-[#F96176] text-[#F96176]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              <Layers size={17} />
              <span>All Dispatched Loads</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {filteredLoads.length}
              </span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-[#F96176] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-semibold text-gray-600">
                Loading dispatch analytics...
              </p>
            </div>
          ) : (
            <div>
              {/* TAB 1: TRUCK & TRAILER PERFORMANCE */}
              {activeTab === "trucks" && (
                <div className="overflow-x-auto relative">
                  {truckStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No truck records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Truck / Vehicle</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Trailer</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Company</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Total Earnings</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Total Miles</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Avg. RPM</th>
                          <th className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">Loads (Comp / Act)</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {truckStats.map((item) => (
                          <tr
                            key={item.truckKey}
                            className="group hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-bold shrink-0 print:hidden">
                                  <Truck size={16} />
                                </div>
                                <div className="min-w-0">
                                  {item.truckNumber.includes(" - ") ? (
                                    <>
                                      <span className="font-bold text-gray-900 block truncate max-w-[200px]" title={item.truckNumber}>
                                        {item.truckNumber.split(" - ")[0]}
                                      </span>
                                      <span className="text-[11px] text-gray-400 font-normal block truncate max-w-[180px]" title={item.truckNumber.split(" - ").slice(1).join(" - ")}>
                                        {item.truckNumber.split(" - ").slice(1).join(" - ")}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-bold text-gray-900 block truncate max-w-[220px]" title={item.truckNumber}>
                                      {item.truckNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">
                              {item.trailer.includes(" - ") ? (
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-800 block truncate max-w-[200px]" title={item.trailer}>
                                    {item.trailer.split(" - ")[0]}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-normal block truncate max-w-[180px]" title={item.trailer.split(" - ").slice(1).join(" - ")}>
                                    {item.trailer.split(" - ").slice(1).join(" - ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="block truncate max-w-[220px]" title={item.trailer}>
                                  {item.trailer}
                                </span>
                              )}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-gray-600 whitespace-nowrap">
                              {item.companyName}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-emerald-600 text-base whitespace-nowrap">
                              ${item.totalEarnings.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {item.totalMiles.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              <span className="text-xs text-gray-400 font-normal">
                                mi
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-teal-700 whitespace-nowrap">
                              ${item.avgRpm.toFixed(2)}/mi
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                {item.totalLoads} loads (
                                <span className="text-emerald-600">
                                  {item.completedLoads}
                                </span>
                                /
                                <span className="text-amber-500">
                                  {item.activeLoads}
                                </span>
                                )
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] transition-colors">
                              <Link
                                href={`/dispatch-reports/details?type=truck&key=${encodeURIComponent(
                                  item.truckNumber
                                )}&timeframe=${encodeURIComponent(timeframe)}${
                                  startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""
                                }${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                                title="View Full Truck Report & Loads (Opens in new tab)"
                              >
                                <span>View Loads</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 2: DRIVER & CARRIER PERFORMANCE */}
              {activeTab === "drivers" && (
                <div className="overflow-x-auto relative">
                  {driverStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No driver records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Driver Name</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Carrier Company</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Total Miles</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Carrier Pay / Earnings</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-700 whitespace-nowrap">Customer Revenue</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-700 whitespace-nowrap">Avg. RPM</th>
                          <th className="px-4 sm:px-5 py-3.5 text-center font-semibold text-gray-700 whitespace-nowrap">Loads (Comp / Act)</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right print:hidden font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {driverStats.map((item) => (
                          <tr
                            key={item.driverKey}
                            className="group hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 print:hidden">
                                  <User size={16} />
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 block truncate max-w-[200px]" title={item.driverName}>
                                    {item.driverName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">
                              <span className="block truncate max-w-[200px]" title={item.carrierName}>
                                {item.carrierName}
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-gray-900 whitespace-nowrap">
                              {item.totalMiles.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              <span className="text-xs text-gray-400 font-normal">
                                mi
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-emerald-600 text-base whitespace-nowrap">
                              ${item.totalEarnings.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-700 whitespace-nowrap">
                              ${item.customerRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-teal-700 whitespace-nowrap">
                              ${item.avgRpm.toFixed(2)}/mi
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                {item.totalLoads} loads (
                                <span className="text-emerald-600">
                                  {item.completedLoads}
                                </span>
                                /
                                <span className="text-amber-500">
                                  {item.activeLoads}
                                </span>
                                )
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] transition-colors">
                              <Link
                                href={`/dispatch-reports/details?type=driver&key=${encodeURIComponent(
                                  item.driverName
                                )}&timeframe=${encodeURIComponent(timeframe)}${
                                  startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""
                                }${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                                title="View Full Driver Report & Loads (Opens in new tab)"
                              >
                                <span>View Loads</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: COMPANY PERFORMANCE */}
              {activeTab === "companies" && (
                <div className="overflow-x-auto relative">
                  {companyStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No company records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Company Name</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Total Revenue</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Carrier Pay</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Net Profit</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Total Miles</th>
                          <th className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">Trucks / Drivers</th>
                          <th className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">Total Loads</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Avg. RPM</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right print:hidden font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {companyStats.map((item) => (
                          <tr
                            key={item.companyName}
                            className="group hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold shrink-0 print:hidden">
                                  <Building size={16} />
                                </div>
                                <span className="font-bold text-gray-900 block truncate max-w-[220px]" title={item.companyName}>
                                  {item.companyName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-emerald-600 text-base whitespace-nowrap">
                              ${item.totalRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-700 whitespace-nowrap">
                              ${item.totalCarrierPay.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                              ${item.totalProfit.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {item.totalMiles.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              <span className="text-xs text-gray-400 font-normal">
                                mi
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-center text-gray-700 font-medium whitespace-nowrap">
                              {item.truckCount} trucks / {item.driverCount} drivers
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                {item.totalLoads} loads (
                                <span className="text-emerald-600">
                                  {item.completedLoads}
                                </span>{" "}
                                comp)
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-teal-700 whitespace-nowrap">
                              ${item.avgRpm.toFixed(2)}/mi
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] transition-colors">
                              <Link
                                href={`/dispatch-reports/details?type=company&key=${encodeURIComponent(
                                  item.companyName
                                )}&timeframe=${encodeURIComponent(timeframe)}${
                                  startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""
                                }${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                                title="View Full Company Report & Loads (Opens in new tab)"
                              >
                                <span>View Loads</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 4: ALL DISPATCHED LOADS REGISTRY */}
              {activeTab === "all_loads" && (
                <div className="overflow-x-auto relative">
                  {sortedLoads.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No matching loads found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Load #</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Status</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Route</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Truck / Trailer</th>
                          <th className="px-4 sm:px-5 py-3.5 whitespace-nowrap">Driver / Carrier</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Miles</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">Revenue</th>
                          <th className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedLoads.map((load) => (
                          <tr
                            key={load.id}
                            className="group hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 sm:px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                              {load.loadNumber}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <span
                                className={clsx(
                                  "px-2.5 py-1 rounded-md text-xs font-bold",
                                  load.statusGroup === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : load.statusGroup === "Active"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-gray-100 text-gray-700"
                                )}
                              >
                                {load.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-gray-700 whitespace-nowrap">
                              <div className="font-medium text-xs">
                                {load.origin} → {load.destination}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {load.pickupDateStr}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-gray-900 text-xs truncate max-w-[160px]" title={load.truck}>
                                {load.truck}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate max-w-[160px]" title={load.trailer}>
                                Tr: {load.trailer}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-gray-900 text-xs truncate max-w-[160px]" title={load.driver}>
                                {load.driver}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate max-w-[160px]" title={load.carrier}>
                                {load.carrier}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {load.miles.toFixed(1)} mi
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right font-bold text-emerald-600 text-base whitespace-nowrap">
                              ${load.revenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right print:hidden whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] transition-colors">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/view-load-info/${load.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                                  title="View Full Load Details (Opens in new page)"
                                >
                                  <span>View</span>
                                  <ExternalLink size={12} />
                                </Link>
                                <Link
                                  href={`/view-load-info/${load.id}?action=print`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-semibold text-xs rounded-lg transition cursor-pointer"
                                  title="Print Load Sheet"
                                >
                                  <Printer size={13} />
                                  <span>Print</span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
