"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Truck,
  User,
  Building,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function ReportDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportType = (searchParams.get("type") || "truck").toLowerCase() as
    | "truck"
    | "driver"
    | "company";
  const entityKey = searchParams.get("key") || searchParams.get("name") || "";
  const initialTimeframe = searchParams.get("timeframe") || "all";

  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loads, setLoads] = useState<NormalizedLoad[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("date_desc");

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

  // Fetch Loads & mapping
  const fetchReportDetails = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);

    try {
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

      const driverMap: Record<string, string> = {};
      const vehicleMap: Record<string, string> = {};

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
            }

            const vSnap = await getDocs(
              collection(db, "Users", driverId, "Vehicles")
            );
            vSnap.docs.forEach((vDoc) => {
              const vData = vDoc.data();
              const vNum = (vData.vehicleNumber || "").trim();
              if (vNum) vehicleMap[vDoc.id] = vNum;
            });
          } catch (_) {}
        })
      );

      try {
        const ownerVehiclesSnap = await getDocs(
          collection(db, "Users", effectiveUserId, "Vehicles")
        );
        ownerVehiclesSnap.docs.forEach((vDoc) => {
          const vData = vDoc.data();
          const vNum = (vData.vehicleNumber || "").trim();
          if (vNum) vehicleMap[vDoc.id] = vNum;
        });
      } catch (_) {}

      // Normalize Loads
      const normalized: NormalizedLoad[] = rawDocs.map((record) => {
        const pickups = Array.isArray(record.pickups) ? record.pickups : [];
        const deliveries = Array.isArray(record.deliveries)
          ? record.deliveries
          : [];
        const firstPickup = pickups[0] || {};
        const lastDelivery =
          deliveries[deliveries.length - 1] || deliveries[0] || {};

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

        const carrierPay = Number(
          record.totalCarrierPay || record.carrierPay || 0
        );
        const profit = revenue - carrierPay;

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

        const driverLabel =
          (record.driverId && driverMap[record.driverId]) ||
          record.driverName ||
          record.driver ||
          record.driverContact?.name ||
          "Unassigned";

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
    } catch (err) {
      GlobalToastError(err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchReportDetails();
  }, [fetchReportDetails]);

  // Filter loads specifically for this entity
  const entityLoads = useMemo(() => {
    if (!entityKey) return loads;
    const target = decodeURIComponent(entityKey).toLowerCase().trim();

    return loads.filter((load) => {
      if (reportType === "truck") {
        const trk = load.truck.toLowerCase().trim();
        const trl = load.trailer.toLowerCase().trim();
        return (
          trk === target ||
          trl === target ||
          trk.includes(target) ||
          trl.includes(target) ||
          target.includes(trk)
        );
      }
      if (reportType === "driver") {
        const drv = load.driver.toLowerCase().trim();
        const car = load.carrier.toLowerCase().trim();
        return (
          drv === target ||
          car === target ||
          drv.includes(target) ||
          car.includes(target) ||
          target.includes(drv)
        );
      }
      if (reportType === "company") {
        const comp = load.companyName.toLowerCase().trim();
        return comp === target || comp.includes(target) || target.includes(comp);
      }
      return true;
    });
  }, [loads, entityKey, reportType]);

  // Filter & Search inside this entity's loads
  const filteredAndSortedLoads = useMemo(() => {
    return entityLoads
      .filter((l) => {
        if (statusFilter !== "all") {
          if (statusFilter === "completed" && l.statusGroup !== "Completed") {
            return false;
          }
          if (statusFilter === "active" && l.statusGroup !== "Active") {
            return false;
          }
          if (statusFilter === "ready" && l.statusGroup !== "Ready") {
            return false;
          }
        }

        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase().trim();
          const matches =
            l.loadNumber.toLowerCase().includes(q) ||
            l.customer.toLowerCase().includes(q) ||
            l.origin.toLowerCase().includes(q) ||
            l.destination.toLowerCase().includes(q) ||
            l.truck.toLowerCase().includes(q) ||
            l.trailer.toLowerCase().includes(q) ||
            l.driver.toLowerCase().includes(q) ||
            l.pickupDateStr.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "revenue_desc") return b.revenue - a.revenue;
        if (sortOption === "revenue_asc") return a.revenue - b.revenue;
        if (sortOption === "miles_desc") return b.miles - a.miles;
        if (sortOption === "miles_asc") return a.miles - b.miles;
        if (sortOption === "date_asc") {
          const tA = a.dateObj ? a.dateObj.getTime() : 0;
          const tB = b.dateObj ? b.dateObj.getTime() : 0;
          return tA - tB;
        }
        // date_desc
        const tA = a.dateObj ? a.dateObj.getTime() : 0;
        const tB = b.dateObj ? b.dateObj.getTime() : 0;
        return tB - tA;
      });
  }, [entityLoads, searchFilter, statusFilter, sortOption]);

  // Specific Entity KPIs
  const entityKPIs = useMemo(() => {
    let totalRevenue = 0;
    let totalCarrierPay = 0;
    let totalMiles = 0;
    let completedCount = 0;
    let activeCount = 0;

    entityLoads.forEach((load) => {
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
      totalLoads: entityLoads.length,
      completedCount,
      activeCount,
      profitMargin,
    };
  }, [entityLoads]);

  // Export CSV Handler
  const handleExportEntityCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Load #,Status,Customer,Origin,Destination,Truck,Trailer,Driver,Carrier,Company,Miles,Revenue ($),Carrier Pay ($),Net Profit ($),Pickup Date\n";

    filteredAndSortedLoads.forEach((l) => {
      csvContent += `"${l.loadNumber}","${l.status}","${l.customer}","${
        l.origin
      }","${l.destination}","${l.truck}","${l.trailer}","${l.driver}","${
        l.carrier
      }","${l.companyName}",${l.miles.toFixed(1)},${l.revenue.toFixed(
        2
      )},${l.carrierPay.toFixed(2)},${l.profit.toFixed(2)},"${l.pickupDateStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dispatch_report_${reportType}_${decodeURIComponent(entityKey).replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayName = decodeURIComponent(entityKey || "All Loads");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 print:bg-white print:pb-0 print:p-0">
      {/* Print Document Header */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {reportType.toUpperCase()} DISPATCH PERFORMANCE REPORT
            </h1>
            <p className="text-sm font-bold text-gray-700 mt-1">
              Target: <span className="text-gray-900">{displayName}</span> |
              Generated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-[#F96176] tracking-wider">
              RABBIT DISPATCH
            </span>
          </div>
        </div>
      </div>

      {/* Top Navbar Header (Hidden on Print) */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider",
                    reportType === "truck"
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : reportType === "driver"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}
                >
                  {reportType === "truck"
                    ? "🚛 Truck / Vehicle Report"
                    : reportType === "driver"
                    ? "👤 Driver / Carrier Report"
                    : "🏢 Company Report"}
                </span>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {displayName}
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Detailed load ledger and analytics for this {reportType}.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportEntityCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition shadow-xs cursor-pointer"
              title="Export Loads as CSV"
            >
              <Download size={15} className="text-gray-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition shadow-xs cursor-pointer"
              title="Print Full Summary"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:max-w-none print:p-0">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-3">
          {/* Card 1: Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={18} />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-gray-900">
                ${entityKPIs.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                From {entityKPIs.totalLoads} total dispatched loads
              </p>
            </div>
          </div>

          {/* Card 2: Miles Run */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Miles Run
              </span>
              <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Truck size={18} />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-gray-900">
                {entityKPIs.totalMiles.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-sm font-medium text-gray-400">mi</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Avg. RPM:{" "}
                <span className="font-semibold text-orange-600">
                  ${entityKPIs.avgRpm.toFixed(2)} / mi
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Completed vs Active */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Load Status
              </span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-emerald-600">
                {entityKPIs.completedCount}
              </h3>
              <span className="text-xs text-gray-500">Completed</span>
              <span className="text-gray-300">|</span>
              <h3 className="text-2xl font-black text-amber-500">
                {entityKPIs.activeCount}
              </h3>
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Completion Rate:{" "}
              {entityKPIs.totalLoads > 0
                ? `${Math.round(
                    (entityKPIs.completedCount / entityKPIs.totalLoads) * 100
                  )}%`
                : "0%"}
            </p>
          </div>

          {/* Card 4: Net Margin */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Net Profit
              </span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-gray-900">
                ${entityKPIs.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Margin:{" "}
                <span className="font-semibold text-rose-600">
                  {entityKPIs.profitMargin.toFixed(1)}%
                </span>{" "}
                (Carrier: ${entityKPIs.totalCarrierPay.toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar & Search (Hidden on Print) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-6 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search load #, route, customer..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white text-gray-800 transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 text-xs sm:text-sm border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer ${
                  statusFilter !== "all"
                    ? "bg-rose-50 border-[#F96176] text-[#F96176]"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <option value="all">Status: All</option>
                <option value="completed">Completed Only</option>
                <option value="active">Active / In Transit</option>
                <option value="ready">Ready / Assigned</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F96176] cursor-pointer"
              >
                <option value="date_desc">Date: Newest</option>
                <option value="date_asc">Date: Oldest</option>
                <option value="revenue_desc">Revenue: High to Low</option>
                <option value="revenue_asc">Revenue: Low to High</option>
                <option value="miles_desc">Miles: Highest</option>
                <option value="miles_asc">Miles: Lowest</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-gray-500">
              Showing{" "}
              <span className="text-gray-900 font-bold">
                {filteredAndSortedLoads.length}
              </span>{" "}
              of {entityLoads.length} loads
            </div>
          </div>
        </div>

        {/* Full Dispatched Loads Ledger Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-[#F96176] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-sm font-semibold text-gray-600">
                Loading dispatched loads...
              </p>
            </div>
          ) : filteredAndSortedLoads.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              No matching dispatched loads found for {displayName}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 whitespace-nowrap">Load #</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Customer</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Route</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Truck / Trailer</th>
                    <th className="px-5 py-3.5 whitespace-nowrap">Driver / Carrier</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Miles</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Revenue</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Carrier Pay</th>
                    <th className="px-5 py-3.5 text-right print:hidden whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedLoads.map((load) => (
                    <tr
                      key={load.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {load.loadNumber}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-[11px] font-bold",
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
                      <td className="px-5 py-4 text-gray-700 font-medium truncate max-w-[150px]" title={load.customer}>
                        {load.customer}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        <div className="font-medium text-xs">
                          {load.origin} → {load.destination}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {load.pickupDateStr}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-gray-900">
                          {load.truck}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          Tr: {load.trailer}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-gray-900">
                          {load.driver}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {load.carrier}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 text-xs">
                        {load.miles.toFixed(1)} mi
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 text-sm">
                        ${load.revenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-600 text-xs">
                        ${load.carrierPay.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/view-load-info/${load.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F96176]/10 text-[#F96176] hover:bg-[#F96176]/20 font-semibold text-xs rounded-lg transition cursor-pointer"
                            title="View Full Load Details (Opens in new page)"
                          >
                            <span>View</span>
                            <ExternalLink size={11} />
                          </Link>
                          <Link
                            href={`/view-load-info/${load.id}?action=print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-semibold text-xs rounded-lg transition cursor-pointer"
                            title="Print Load Sheet (Opens Print Preview)"
                          >
                            <Printer size={12} />
                            <span>Print</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DispatchReportDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-16 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#F96176] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ReportDetailsContent />
    </Suspense>
  );
}
