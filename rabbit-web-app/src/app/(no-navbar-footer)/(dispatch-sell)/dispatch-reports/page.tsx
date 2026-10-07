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
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Date Presets Filter Logic
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
      if (selectedCompany !== "all") {
        const matchesComp =
          load.companyName.toLowerCase() === selectedCompany.toLowerCase() ||
          load.truck.toLowerCase().includes(selectedCompany.toLowerCase());
        if (!matchesComp) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== "all") {
        if (selectedStatus === "completed" && load.statusGroup !== "Completed") {
          return false;
        }
        if (selectedStatus === "active" && load.statusGroup !== "Active") {
          return false;
        }
        if (selectedStatus === "ready" && load.statusGroup !== "Ready") {
          return false;
        }
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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
    selectedCompany,
    selectedStatus,
    searchQuery,
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
  }, [filteredLoads, sortField, sortOrder]);

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
  }, [filteredLoads, sortField, sortOrder]);

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
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredLoads]);

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
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-30 shadow-sm print:hidden">
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
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          {/* Timeframe Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(
              [
                { key: "this_month", label: "This Month" },
                { key: "this_quarter", label: "This Quarter" },
                { key: "this_year", label: "This Year" },
                { key: "this_week", label: "This Week" },
                { key: "today", label: "Today" },
                { key: "last_month", label: "Last Month" },
                { key: "all", label: "All Time" },
                { key: "custom", label: "Custom Date" },
              ] as const
            ).map((preset) => (
              <button
                key={preset.key}
                onClick={() => setTimeframe(preset.key)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                  timeframe === preset.key
                    ? "bg-[#F96176] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Company, Status, Search */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Custom Date Inputs if Custom is selected */}
            {timeframe === "custom" && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
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

            {/* Company Dropdown */}
            {userCompanies.length > 0 && (
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#F96176] transition"
              >
                <option value="all">All Companies</option>
                {userCompanies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#F96176] transition"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="active">Active / In Transit</option>
              <option value="ready">Ready / Assigned</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 lg:flex-initial">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search truck, driver, load #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#F96176] transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-6 print:max-w-none print:p-0">
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
                <div className="overflow-x-auto">
                  {truckStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No truck records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3.5">Truck / Vehicle</th>
                          <th className="px-6 py-3.5">Trailer</th>
                          <th className="px-6 py-3.5">Company</th>
                          <th className="px-6 py-3.5 text-right">Total Earnings</th>
                          <th className="px-6 py-3.5 text-right">Total Miles</th>
                          <th className="px-6 py-3.5 text-right">Avg. RPM</th>
                          <th className="px-6 py-3.5 text-center">Loads (Comp / Act)</th>
                          <th className="px-6 py-3.5 text-right print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {truckStats.map((item) => {
                          const isExpanded = expandedRowKey === item.truckKey;
                          return (
                            <React.Fragment key={item.truckKey}>
                              <tr className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-bold print:hidden">
                                      <Truck size={18} />
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900">
                                        {item.truckNumber}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                  {item.trailer}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  {item.companyName}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                                  ${item.totalEarnings.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                  {item.totalMiles.toLocaleString(undefined, {
                                    maximumFractionDigits: 1,
                                  })}{" "}
                                  <span className="text-xs text-gray-400 font-normal">
                                    mi
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-teal-700">
                                  ${item.avgRpm.toFixed(2)}/mi
                                </td>
                                <td className="px-6 py-4 text-center">
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
                                <td className="px-6 py-4 text-right print:hidden">
                                  <button
                                    onClick={() => toggleExpandRow(item.truckKey)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>{isExpanded ? "Hide" : "View Loads"}</span>
                                    <ChevronDown
                                      size={14}
                                      className={clsx(
                                        "transition-transform",
                                        isExpanded && "rotate-180"
                                      )}
                                    />
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Load List for Truck */}
                              {isExpanded && (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="bg-gray-50/90 px-8 py-4 border-y border-gray-200/60"
                                  >
                                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                                      <span>
                                        Loads Assigned to {item.truckNumber} ({item.loads.length})
                                      </span>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {item.loads.map((l) => (
                                        <div
                                          key={l.id}
                                          className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between hover:border-gray-300 transition"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900 text-sm">
                                              {l.loadNumber}
                                            </span>
                                            <span
                                              className={clsx(
                                                "px-2 py-0.5 rounded text-[11px] font-bold",
                                                l.statusGroup === "Completed"
                                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                  : l.statusGroup === "Active"
                                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                  : "bg-gray-100 text-gray-700"
                                              )}
                                            >
                                              {l.status}
                                            </span>
                                            <span className="text-gray-500">
                                              {l.origin} → {l.destination}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <span className="text-gray-600">
                                              {l.miles.toFixed(1)} mi
                                            </span>
                                            <span className="font-bold text-emerald-600">
                                              ${l.revenue.toLocaleString()}
                                            </span>
                                            <Link
                                              href={`/view-load-info/${l.id}`}
                                              className="text-xs text-[#F96176] hover:underline font-semibold flex items-center gap-1"
                                            >
                                              Details <ExternalLink size={11} />
                                            </Link>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 2: DRIVER & CARRIER PERFORMANCE */}
              {activeTab === "drivers" && (
                <div className="overflow-x-auto">
                  {driverStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No driver records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3.5">Driver Name</th>
                          <th className="px-6 py-3.5">Carrier Company</th>
                          <th className="px-6 py-3.5 text-right">Total Miles</th>
                          <th className="px-6 py-3.5 text-right">Carrier Pay / Earnings</th>
                          <th className="px-6 py-3.5 text-right font-semibold text-gray-700">Customer Revenue</th>
                          <th className="px-6 py-3.5 text-right font-semibold text-gray-700">Avg. RPM</th>
                          <th className="px-6 py-3.5 text-center font-semibold text-gray-700">Loads (Comp / Act)</th>
                          <th className="px-6 py-3.5 text-right print:hidden font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {driverStats.map((item) => {
                          const isExpanded = expandedRowKey === item.driverKey;
                          return (
                            <React.Fragment key={item.driverKey}>
                              <tr className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold print:hidden">
                                      <User size={18} />
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900">
                                        {item.driverName}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                  {item.carrierName}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                  {item.totalMiles.toLocaleString(undefined, {
                                    maximumFractionDigits: 1,
                                  })}{" "}
                                  <span className="text-xs text-gray-400 font-normal">
                                    mi
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                                  ${item.totalEarnings.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-700">
                                  ${item.customerRevenue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-teal-700">
                                  ${item.avgRpm.toFixed(2)}/mi
                                </td>
                                <td className="px-6 py-4 text-center">
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
                                <td className="px-6 py-4 text-right print:hidden">
                                  <button
                                    onClick={() => toggleExpandRow(item.driverKey)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>{isExpanded ? "Hide" : "View Loads"}</span>
                                    <ChevronDown
                                      size={14}
                                      className={clsx(
                                        "transition-transform",
                                        isExpanded && "rotate-180"
                                      )}
                                    />
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Load List for Driver */}
                              {isExpanded && (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="bg-gray-50/90 px-8 py-4 border-y border-gray-200/60"
                                  >
                                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                      Loads Completed by {item.driverName} ({item.loads.length})
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {item.loads.map((l) => (
                                        <div
                                          key={l.id}
                                          className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between hover:border-gray-300 transition"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900 text-sm">
                                              {l.loadNumber}
                                            </span>
                                            <span className="text-gray-500">
                                              {l.origin} → {l.destination}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                              ({l.truck})
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <span className="text-gray-600">
                                              {l.miles.toFixed(1)} mi
                                            </span>
                                            <span className="font-bold text-emerald-600">
                                              ${l.revenue.toLocaleString()}
                                            </span>
                                            <Link
                                              href={`/view-load-info/${l.id}`}
                                              className="text-xs text-[#F96176] hover:underline font-semibold flex items-center gap-1 print:hidden"
                                            >
                                              Details <ExternalLink size={11} />
                                            </Link>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: COMPANY PERFORMANCE */}
              {activeTab === "companies" && (
                <div className="overflow-x-auto">
                  {companyStats.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No company records found for the selected timeframe.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3.5">Company Name</th>
                          <th className="px-6 py-3.5 text-right">Total Revenue</th>
                          <th className="px-6 py-3.5 text-right">Carrier Pay</th>
                          <th className="px-6 py-3.5 text-right">Net Profit</th>
                          <th className="px-6 py-3.5 text-right">Total Miles</th>
                          <th className="px-6 py-3.5 text-center">Trucks / Drivers</th>
                          <th className="px-6 py-3.5 text-center">Total Loads</th>
                          <th className="px-6 py-3.5 text-right">Avg. RPM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {companyStats.map((item) => (
                          <tr
                            key={item.companyName}
                            className="hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold print:hidden">
                                  <Building size={18} />
                                </div>
                                <span className="font-bold text-gray-900">
                                  {item.companyName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                              ${item.totalRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-700">
                              ${item.totalCarrierPay.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-rose-600">
                              ${item.totalProfit.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              {item.totalMiles.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}{" "}
                              <span className="text-xs text-gray-400 font-normal">
                                mi
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-700 font-medium">
                              {item.truckCount} trucks / {item.driverCount} drivers
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                {item.totalLoads} loads (
                                <span className="text-emerald-600">
                                  {item.completedLoads}
                                </span>{" "}
                                comp)
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-teal-700">
                              ${item.avgRpm.toFixed(2)}/mi
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
                <div className="overflow-x-auto">
                  {filteredLoads.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No matching loads found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3.5">Load #</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5">Route</th>
                          <th className="px-6 py-3.5">Truck / Trailer</th>
                          <th className="px-6 py-3.5">Driver / Carrier</th>
                          <th className="px-6 py-3.5 text-right">Miles</th>
                          <th className="px-6 py-3.5 text-right">Revenue</th>
                          <th className="px-6 py-3.5 text-right print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredLoads.map((load) => (
                          <tr
                            key={load.id}
                            className="hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-gray-900">
                              {load.loadNumber}
                            </td>
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4 text-gray-700">
                              <div className="font-medium">
                                {load.origin} → {load.destination}
                              </div>
                              <div className="text-xs text-gray-400">
                                {load.pickupDateStr}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {load.truck}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tr: {load.trailer}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {load.driver}
                              </div>
                              <div className="text-xs text-gray-500">
                                {load.carrier}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              {load.miles.toFixed(1)} mi
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                              ${load.revenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-6 py-4 text-right print:hidden">
                              <Link
                                href={`/view-load-info/${load.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                              >
                                <span>View Load</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
