"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  Wrench,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Download,
  CreditCard,
  Building,
  User,
  Phone,
  Mail,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";
import {
  SubscriptionPurchaseRecord,
  SubscriberUserType,
} from "@/types/subscription";
import SubscriptionDetailsModal from "@/components/admin/SubscriptionDetailsModal";

// Strict MM/DD/YYYY date formatting
const formatDateMMDDYYYY = (val: any): string => {
  if (!val) return "N/A";
  try {
    let d: Date | null = null;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds) {
      d = new Date(val.seconds * 1000);
    } else if (typeof val === "number") {
      d = new Date(val < 10000000000 ? val * 1000 : val);
    } else if (typeof val === "string") {
      d = new Date(val);
    } else if (val instanceof Date) {
      d = val;
    }

    if (!d || isNaN(d.getTime())) return "N/A";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return "N/A";
  }
};

const getRenewalDate = (sub: SubscriptionPurchaseRecord): Date | null => {
  if (sub.currentPeriodEnd) {
    let d: Date | null = null;
    if (typeof sub.currentPeriodEnd?.toDate === "function") {
      d = sub.currentPeriodEnd.toDate();
    } else if (sub.currentPeriodEnd?.seconds) {
      d = new Date(sub.currentPeriodEnd.seconds * 1000);
    } else if (typeof sub.currentPeriodEnd === "string") {
      d = new Date(sub.currentPeriodEnd);
    }
    if (d && !isNaN(d.getTime())) return d;
  }

  // Fallback calculation based on duration
  let base: Date | null = null;
  if (sub.purchasedAt) {
    if (typeof sub.purchasedAt?.toDate === "function") {
      base = sub.purchasedAt.toDate();
    } else if (sub.purchasedAt?.seconds) {
      base = new Date(sub.purchasedAt.seconds * 1000);
    } else if (typeof sub.purchasedAt === "string") {
      base = new Date(sub.purchasedAt);
    }
  }
  if (!base && sub.purchasedTimestamp) {
    base = new Date(
      sub.purchasedTimestamp < 10000000000
        ? sub.purchasedTimestamp * 1000
        : sub.purchasedTimestamp
    );
  }
  if (!base || isNaN(base.getTime())) return null;

  const duration = (sub.duration || "").toLowerCase();
  const renewal = new Date(base.getTime());
  if (duration.includes("year") || duration.includes("annual")) {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else if (duration.includes("quarter")) {
    renewal.setMonth(renewal.getMonth() + 3);
  } else if (duration.includes("semi") || duration.includes("6 month")) {
    renewal.setMonth(renewal.getMonth() + 6);
  } else if (duration.includes("week")) {
    renewal.setDate(renewal.getDate() + 7);
  } else {
    renewal.setMonth(renewal.getMonth() + 1);
  }
  return renewal;
};

const getDaysRemaining = (renewalDate: Date | null): number | null => {
  if (!renewalDate || isNaN(renewalDate.getTime())) return null;
  const diffMs = renewalDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriptionPurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "mechanic" | "driver">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "autopay">("all");
  const [sortBy, setSortBy] = useState<"newest" | "renewal" | "amount" | "name">("newest");

  // Selected subscriber for detail modal
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriptionPurchaseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchSubscribers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch global subscription purchases
      const purchasesSnap = await getDocs(collection(db, "subscriptionPurchases"));
      // 2. Fetch mechanics & users for enrichment and standalone activations
      const [mechanicsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "Mechanics")),
        getDocs(collection(db, "Users")),
      ]);

      const mechanicMap = new Map<string, any>();
      mechanicsSnap.forEach((doc) => {
        mechanicMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const userMap = new Map<string, any>();
      usersSnap.forEach((doc) => {
        userMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const recordsMap = new Map<string, SubscriptionPurchaseRecord>();

      // A) Process Global Purchases
      purchasesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId || "";
        const userType: SubscriberUserType =
          data.userType === "mechanic" || data.planType === "treno_mechanic"
            ? "mechanic"
            : "driver";

        let userName = data.userName || "";
        let businessName = data.businessName || "";
        let userPhone = data.userPhone || "";
        let userLocation = "";

        if (userType === "mechanic" && mechanicMap.has(userId)) {
          const m = mechanicMap.get(userId);
          userName = m.userName || m.name || userName;
          businessName = m.workshopName || businessName;
          userPhone = m.cellPhone || m.telephone || m.phone || userPhone;
          userLocation = [m.city, m.state].filter(Boolean).join(", ");
        } else if (userMap.has(userId)) {
          const u = userMap.get(userId);
          userName = u.name || u.userName || userName;
          businessName = u.companyName || businessName;
          userPhone = u.phone || u.cellPhone || userPhone;
          userLocation = [u.city, u.state].filter(Boolean).join(", ");
        }

        const record: SubscriptionPurchaseRecord = {
          id: docSnap.id,
          userId,
          userEmail: (data.userEmail || "").toLowerCase().trim(),
          userName,
          businessName,
          userPhone,
          userLocation,
          userType,
          planId: data.planId || "",
          planName: data.planName || "Subscription Plan",
          planType: data.planType || (userType === "mechanic" ? "treno_mechanic" : "trenoops"),
          duration: data.duration || "Monthly",
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : parseFloat(data.amountPaid || "0"),
          originalPrice: data.originalPrice,
          currency: data.currency || "USD",
          status: data.status || "active",
          autoPay: data.autoPay ?? true,
          purchasedAt: data.purchasedAt,
          purchasedTimestamp: data.purchasedTimestamp,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripeSessionId: data.stripeSessionId,
          stripeInvoiceId: data.stripeInvoiceId,
          features: data.features || [],
          termsAndConditions: data.termsAndConditions || [],
          maxBays: data.maxBays,
          serviceRadiusMiles: data.serviceRadiusMiles,
          priorityJobLeads: data.priorityJobLeads,
          directCarrierInvoicing: data.directCarrierInvoicing,
          maxVehicles: data.maxVehicles,
          truckLimit: data.truckLimit,
          trailerLimit: data.trailerLimit,
          vehicleTypeScope: data.vehicleTypeScope,
          updatedAt: data.updatedAt,
        };

        recordsMap.set(docSnap.id, record);
      });

      // B) Also process Mechanics who have `isSubscriptionPurchase === true` (in case not in purchases collection)
      mechanicMap.forEach((m, mId) => {
        if (m.isSubscriptionPurchase === true) {
          // Check if already captured by purchaseId matching userId
          const alreadyCaptured = Array.from(recordsMap.values()).some(
            (r) => r.userId === mId
          );
          if (!alreadyCaptured) {
            const currentSub = m.currentSubscription || {};
            const record: SubscriptionPurchaseRecord = {
              id: `mech_${mId}`,
              userId: mId,
              userEmail: (m.email || "").toLowerCase().trim(),
              userName: m.userName || m.name || "Mechanic",
              businessName: m.workshopName || "",
              userPhone: m.cellPhone || m.telephone || "",
              userLocation: [m.city, m.state].filter(Boolean).join(", "),
              userType: "mechanic",
              planId: currentSub.planId || "direct_plan",
              planName: currentSub.planName || "Active Mechanic Plan",
              planType: "treno_mechanic",
              duration: currentSub.duration || "Monthly",
              amountPaid: currentSub.amountPaid || 0,
              currency: currentSub.currency || "USD",
              status: currentSub.status || "active",
              autoPay: currentSub.autoPay ?? true,
              purchasedAt: currentSub.purchasedAt || m.created_at || m.createdAt,
              purchasedTimestamp: currentSub.purchasedTimestamp,
              currentPeriodEnd: currentSub.currentPeriodEnd,
              maxBays: currentSub.maxBays ?? m.maxBays,
              serviceRadiusMiles: currentSub.serviceRadiusMiles ?? m.serviceRadiusMiles,
              priorityJobLeads: currentSub.priorityJobLeads ?? true,
              directCarrierInvoicing: currentSub.directCarrierInvoicing ?? true,
              features: currentSub.features || [],
            };
            recordsMap.set(`mech_${mId}`, record);
          }
        }
      });

      // C) Also process Drivers/Users who have `isSubscriptionPurchase === true`
      userMap.forEach((u, uId) => {
        if (u.isSubscriptionPurchase === true) {
          const alreadyCaptured = Array.from(recordsMap.values()).some(
            (r) => r.userId === uId
          );
          if (!alreadyCaptured) {
            const currentSub = u.currentSubscription || {};
            const record: SubscriptionPurchaseRecord = {
              id: `user_${uId}`,
              userId: uId,
              userEmail: (u.email || "").toLowerCase().trim(),
              userName: u.name || u.userName || "Driver / Owner",
              businessName: u.companyName || "",
              userPhone: u.phone || "",
              userLocation: [u.city, u.state].filter(Boolean).join(", "),
              userType: "driver",
              planId: currentSub.planId || "direct_plan",
              planName: currentSub.planName || "Fleet Owner Plan",
              planType: "trenoops",
              duration: currentSub.duration || "Monthly",
              amountPaid: currentSub.amountPaid || 0,
              currency: currentSub.currency || "USD",
              status: currentSub.status || "active",
              autoPay: currentSub.autoPay ?? true,
              purchasedAt: currentSub.purchasedAt || u.createdAt || u.created_at,
              purchasedTimestamp: currentSub.purchasedTimestamp,
              currentPeriodEnd: currentSub.currentPeriodEnd,
              maxVehicles: currentSub.maxVehicles,
              truckLimit: currentSub.truckLimit,
              trailerLimit: currentSub.trailerLimit,
              vehicleTypeScope: currentSub.vehicleTypeScope,
              features: currentSub.features || [],
            };
            recordsMap.set(`user_${uId}`, record);
          }
        }
      });

      const list = Array.from(recordsMap.values());
      setSubscribers(list);
      if (isManual) toast.success(`Refreshed ${list.length} subscribers`);
    } catch (err: any) {
      console.error("Error loading subscribers:", err);
      toast.error(err?.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filter & Search Logic
  const filteredSubscribers = useMemo(() => {
    let result = [...subscribers];

    // 1. Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.businessName?.toLowerCase().includes(q) ||
          s.userEmail.toLowerCase().includes(q) ||
          s.planName.toLowerCase().includes(q) ||
          s.userPhone?.toLowerCase().includes(q) ||
          s.stripeSubscriptionId?.toLowerCase().includes(q) ||
          s.stripeCustomerId?.toLowerCase().includes(q) ||
          s.userId.toLowerCase().includes(q)
      );
    }

    // 2. Type filter
    if (typeFilter !== "all") {
      result = result.filter((s) => s.userType === typeFilter);
    }

    // 3. Status filter
    if (statusFilter === "active") {
      result = result.filter((s) => {
        const renewal = getRenewalDate(s);
        const days = getDaysRemaining(renewal);
        return days === null || days > 0;
      });
    } else if (statusFilter === "expired") {
      result = result.filter((s) => {
        const renewal = getRenewalDate(s);
        const days = getDaysRemaining(renewal);
        return days !== null && days <= 0;
      });
    } else if (statusFilter === "autopay") {
      result = result.filter((s) => s.autoPay === true);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.businessName || a.userName || a.userEmail;
        const nameB = b.businessName || b.userName || b.userEmail;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "amount") {
        return (b.amountPaid || 0) - (a.amountPaid || 0);
      }
      if (sortBy === "renewal") {
        const renA = getRenewalDate(a)?.getTime() || 0;
        const renB = getRenewalDate(b)?.getTime() || 0;
        return renA - renB;
      }
      // "newest" by default
      const dateA = a.purchasedTimestamp || (a.purchasedAt ? new Date(a.purchasedAt).getTime() : 0);
      const dateB = b.purchasedTimestamp || (b.purchasedAt ? new Date(b.purchasedAt).getTime() : 0);
      return dateB - dateA;
    });

    return result;
  }, [subscribers, searchText, typeFilter, statusFilter, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscribers.slice(start, start + pageSize);
  }, [filteredSubscribers, currentPage, pageSize]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    let mechanicsCount = 0;
    let driversCount = 0;
    let totalRevenue = 0;
    let autoPayCount = 0;

    subscribers.forEach((s) => {
      if (s.userType === "mechanic") mechanicsCount++;
      else driversCount++;
      totalRevenue += s.amountPaid || 0;
      if (s.autoPay) autoPayCount++;
    });

    return {
      total: subscribers.length,
      mechanics: mechanicsCount,
      drivers: driversCount,
      revenue: totalRevenue,
      autoPay: autoPayCount,
    };
  }, [subscribers]);

  // CSV Exporter
  const exportToCSV = () => {
    if (filteredSubscribers.length === 0) {
      toast.error("No subscribers to export");
      return;
    }

    const headers = [
      "User Type",
      "Name",
      "Workshop/Company",
      "Email",
      "Phone",
      "Location",
      "Plan Name",
      "Duration",
      "Amount Paid",
      "Currency",
      "Auto Pay",
      "Purchased On (MM/DD/YYYY)",
      "Next Renewal (MM/DD/YYYY)",
      "Stripe Subscription ID",
      "Status",
    ];

    const rows = filteredSubscribers.map((s) => {
      const renewal = getRenewalDate(s);
      return [
        `"${s.userType}"`,
        `"${s.userName || ""}"`,
        `"${s.businessName || ""}"`,
        `"${s.userEmail}"`,
        `"${s.userPhone || ""}"`,
        `"${s.userLocation || ""}"`,
        `"${s.planName}"`,
        `"${s.duration}"`,
        `"${s.amountPaid}"`,
        `"${s.currency}"`,
        `"${s.autoPay ? "Yes" : "No"}"`,
        `"${formatDateMMDDYYYY(s.purchasedAt || s.purchasedTimestamp)}"`,
        `"${renewal ? formatDateMMDDYYYY(renewal) : "N/A"}"`,
        `"${s.stripeSubscriptionId || ""}"`,
        `"${s.status || "active"}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `treno_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully");
  };

  const openDetails = (sub: SubscriptionPurchaseRecord) => {
    setSelectedSubscriber(sub);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#F96176] flex items-center justify-center font-bold shadow-2xs border border-rose-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Subscription Purchases
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Monitor all mechanics & fleet owners who have purchased subscription plans
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchSubscribers(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#F96176]" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#58BB87]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/admin/subscription-plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Manage Plans Catalog</span>
            </Link>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-6">
          {/* Card 1: Total Subscribers */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Total Subscribers
            </span>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.total}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">All platform tiers</span>
          </div>

          {/* Card 2: Mechanics */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-[#F96176]" />
              Mechanics
            </span>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.mechanics}
            </div>
            <span className="text-[10px] text-[#F96176] font-medium">Active workshops</span>
          </div>

          {/* Card 3: Drivers / Owners */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#58BB87]" />
              Drivers / Owners
            </span>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.drivers}
            </div>
            <span className="text-[10px] text-[#58BB87] font-medium">Fleet memberships</span>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-600" />
              Total Revenue
            </span>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              ${stats.revenue.toFixed(2)}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">USD Gross Sales</span>
          </div>

          {/* Card 5: Auto-Pay Active */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-purple-600" />
              Auto-Debit
            </span>
            <div className="text-2xl font-black text-purple-950 tracking-tight">
              {stats.autoPay}
            </div>
            <span className="text-[10px] text-purple-700 font-medium">Stripe recurring</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, workshop, plan, Stripe ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition outline-none"
          />
        </div>

        {/* Filter Pills & Selects */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subscriber Type Filter */}
          <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-semibold">
            <button
              onClick={() => {
                setTypeFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === "all" ? "bg-white text-gray-900 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Types ({subscribers.length})
            </button>
            <button
              onClick={() => {
                setTypeFilter("mechanic");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === "mechanic" ? "bg-white text-[#F96176] shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wrench className="w-3 h-3" />
              Mechanics ({stats.mechanics})
            </button>
            <button
              onClick={() => {
                setTypeFilter("driver");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === "driver" ? "bg-white text-[#58BB87] shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Truck className="w-3 h-3" />
              Drivers ({stats.drivers})
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:border-[#F96176] transition outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Plans</option>
            <option value="expired">Expired Plans</option>
            <option value="autopay">Auto-Pay Enabled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:border-[#F96176] transition outline-none cursor-pointer"
          >
            <option value="newest">Sort: Newest Purchase</option>
            <option value="renewal">Sort: Renewal Date</option>
            <option value="amount">Sort: Amount Paid</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <HashLoader size={40} color="#F96176" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Loading purchased subscription records...
            </p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Purchased Subscribers Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No subscription purchases match your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Subscriber</th>
                  <th className="py-4 px-5">Type</th>
                  <th className="py-4 px-5">Purchased Plan</th>
                  <th className="py-4 px-5">Amount</th>
                  <th className="py-4 px-5">Purchased (MM/DD/YYYY)</th>
                  <th className="py-4 px-5">Renewal (MM/DD/YYYY)</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedList.map((sub) => {
                  const isMechanic = sub.userType === "mechanic";
                  const renewal = getRenewalDate(sub);
                  const days = getDaysRemaining(renewal);
                  const isExpired = days !== null && days <= 0;
                  const isExpiringSoon = days !== null && days > 0 && days <= 7;

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Subscriber Info */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                            <span>{sub.businessName || sub.userName || "Subscriber"}</span>
                          </div>
                          {sub.userName && sub.businessName && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{sub.userName}</span>
                            </p>
                          )}
                          <p className="text-[11px] text-[#F96176] font-semibold flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{sub.userEmail}</span>
                          </p>
                          {sub.userLocation && (
                            <p className="text-[10px] text-gray-400">
                              {sub.userLocation}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isMechanic
                              ? "bg-rose-50 text-[#F96176] border border-rose-200"
                              : "bg-emerald-50 text-[#58BB87] border border-emerald-200"
                          }`}
                        >
                          {isMechanic ? (
                            <Wrench className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          <span>{isMechanic ? "Mechanic" : "Driver / Owner"}</span>
                        </span>
                      </td>

                      {/* Purchased Plan */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <span className="font-extrabold text-gray-900 text-xs block">
                            {sub.planName}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                              {sub.duration}
                            </span>
                            {sub.autoPay ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                Auto-Debit
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                Manual
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-black text-gray-900 text-sm">
                            ${sub.amountPaid?.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-bold">
                            {sub.currency?.toUpperCase() || "USD"}
                          </span>
                        </div>
                      </td>

                      {/* Purchased On (Strict MM/DD/YYYY) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#F96176]" />
                            {formatDateMMDDYYYY(sub.purchasedAt || sub.purchasedTimestamp)}
                          </span>
                          <span className="text-[10px] text-gray-400 block">Activation</span>
                        </div>
                      </td>

                      {/* Next Renewal Date (Strict MM/DD/YYYY) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-[#58BB87]" />
                            {renewal ? formatDateMMDDYYYY(renewal) : "N/A"}
                          </span>
                          {days !== null && (
                            <span
                              className={`text-[10px] font-bold block ${
                                isExpired
                                  ? "text-red-600"
                                  : isExpiringSoon
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {days > 0 ? `${days} days left` : "Expired"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58BB87] animate-pulse" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetails(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredSubscribers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50/50">
            <span>
              Showing <b>{(currentPage - 1) * pageSize + 1}</b> to{" "}
              <b>{Math.min(currentPage * pageSize, filteredSubscribers.length)}</b> of{" "}
              <b>{filteredSubscribers.length}</b> subscribers
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 font-bold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubscriber && (
        <SubscriptionDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubscriber(null);
          }}
          subscriber={selectedSubscriber}
          formatDate={formatDateMMDDYYYY}
          renewalDate={getRenewalDate(selectedSubscriber)}
          daysRemaining={getDaysRemaining(getRenewalDate(selectedSubscriber))}
        />
      )}
    </div>
  );
}