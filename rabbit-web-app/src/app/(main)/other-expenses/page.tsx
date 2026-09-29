"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { ProfileValues } from "@/types/types";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import {
  FaArrowLeft,
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaFileExcel,
  FaArrowUp,
  FaArrowDown,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
  FaWallet,
} from "react-icons/fa";
import { utils, writeFile } from "xlsx";
import AddOtherExpenseModal, {
  OtherExpenseRecord,
  OtherExpenseServiceOption,
} from "@/components/records/AddOtherExpenseModal";

const DEFAULT_SERVICES: string[] = [
  "Fuel / Gas Surcharge",
  "Tolls & Permits",
  "Driver Reimbursement",
  "Cash Advance",
  "Equipment Rental",
  "Loading / Unloading (Lumper)",
  "Detention / Layover",
  "Office & Misc Supplies",
  "Safety & Inspection",
  "Insurance & Legal",
  "Other",
];

const formatDateSafe = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const trimmed = String(dateStr).trim();
    if (!trimmed) return "";

    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
      const parts = trimmed.includes("-")
        ? trimmed.split("-")
        : trimmed.split("/");
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const yyyy = parts[2];
      if (p0 > 12) {
        return `${String(p1).padStart(2, "0")}-${String(p0).padStart(
          2,
          "0"
        )}-${yyyy}`;
      }
      return `${String(p0).padStart(2, "0")}-${String(p1).padStart(
        2,
        "0"
      )}-${yyyy}`;
    }

    const isoParsed = parseISO(trimmed);
    if (!isNaN(isoParsed.getTime())) {
      return format(isoParsed, "MM-dd-yyyy");
    }

    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "MM-dd-yyyy");
    }

    return trimmed;
  } catch {
    return dateStr ? String(dateStr) : "";
  }
};

const parseCustomDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
    const parts = trimmed.includes("-")
      ? trimmed.split("-")
      : trimmed.split("/");
    const mm = Number(parts[0]);
    const dd = Number(parts[1]);
    const yyyy = Number(parts[2]);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function OtherExpensesPage() {
  const auth = useAuth();
  const user = auth?.user;
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userData, setUserData] = useState<ProfileValues | null>(null);

  // Data states
  const [records, setRecords] = useState<OtherExpenseRecord[]>([]);
  const [servicesList, setServicesList] = useState<OtherExpenseServiceOption[]>(
    []
  );
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Credit" | "Debit">(
    "All"
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] =
    useState<OtherExpenseRecord | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<OtherExpenseRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 1. Fetch effective user ID
  useEffect(() => {
    if (!user?.uid) return;

    const fetchEffectiveUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data() as ProfileValues;
          setUserData(uData);

          if (uData.role === "SubOwner" && uData.createdBy) {
            setEffectiveUserId(uData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setEffectiveUserId(user.uid);
      }
    };

    fetchEffectiveUserData();
  }, [user?.uid]);

  // 2. Fetch predefined services from otherExpensesServices collection
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const colRef = collection(db, "otherExpensesServices");
        const snapshot = await getDocs(colRef);

        const fetchedServices: OtherExpenseServiceOption[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const sName =
            data.sName || data.serviceName || data.name || d.id || "";
          if (sName.trim()) {
            fetchedServices.push({
              id: d.id,
              sName: sName.trim(),
            });
          }
        });

        const hasOther = fetchedServices.some(
          (s) => s.sName.toLowerCase() === "other"
        );

        if (fetchedServices.length === 0) {
          const defaults = DEFAULT_SERVICES.map((name, idx) => ({
            id: `default_${idx}`,
            sName: name,
          }));
          setServicesList(defaults);
        } else {
          if (!hasOther) {
            fetchedServices.push({ id: "custom_other", sName: "Other" });
          }
          setServicesList(fetchedServices);
        }
      } catch (error) {
        console.error("Error fetching otherExpensesServices:", error);
        setServicesList(
          DEFAULT_SERVICES.map((name, idx) => ({
            id: `default_${idx}`,
            sName: name,
          }))
        );
      }
    };

    fetchServices();
  }, []);

  // 3. Realtime listener for user other expenses
  useEffect(() => {
    if (!effectiveUserId) return;

    setIsLoadingRecords(true);
    const expensesRef = collection(
      db,
      "Users",
      effectiveUserId,
      "record_otherExpenses"
    );

    const unsubscribe = onSnapshot(
      expensesRef,
      (snapshot) => {
        const loaded: OtherExpenseRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.active !== false) {
            loaded.push({
              id: d.id,
              userId: data.userId || effectiveUserId,
              serviceId: data.serviceId || "",
              serviceName: data.serviceName || "Other Expense",
              isCustomService: !!data.isCustomService,
              date: data.date || "",
              amount: Number(data.amount) || 0,
              type: data.type === "Credit" ? "Credit" : "Debit",
              description: data.description || "",
              createdAt: data.createdAt || "",
              updatedAt: data.updatedAt || "",
              active: data.active !== false,
              addedFrom: data.addedFrom || "Web",
            });
          }
        });

        loaded.sort((a, b) => {
          const dateA = parseCustomDate(a.date)?.getTime() || 0;
          const dateB = parseCustomDate(b.date)?.getTime() || 0;
          return dateB - dateA;
        });

        setRecords(loaded);
        setIsLoadingRecords(false);
      },
      (error) => {
        console.error("Error listening to record_otherExpenses:", error);
        toast.error("Failed to load other expenses");
        setIsLoadingRecords(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveUserId]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (typeFilter !== "All" && rec.type !== typeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (rec.serviceName || "").toLowerCase().includes(q);
        const matchesDesc = (rec.description || "").toLowerCase().includes(q);
        const matchesAmount = rec.amount.toString().includes(q);
        if (!matchesName && !matchesDesc && !matchesAmount) {
          return false;
        }
      }

      if (startDate || endDate) {
        const recDate = parseCustomDate(rec.date);
        if (!recDate) return false;

        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (recDate < s) return false;
        }

        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (recDate > e) return false;
        }
      }

      return true;
    });
  }, [records, typeFilter, searchQuery, startDate, endDate]);

  // Summary calculations
  const { totalCredit, totalDebit, netBalance } = useMemo(() => {
    let credit = 0;
    let debit = 0;

    filteredRecords.forEach((rec) => {
      if (rec.type === "Credit") {
        credit += Number(rec.amount) || 0;
      } else {
        debit += Number(rec.amount) || 0;
      }
    });

    const net = credit - debit;
    return {
      totalCredit: credit,
      totalDebit: debit,
      netBalance: net,
    };
  }, [filteredRecords]);

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (rec: OtherExpenseRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !effectiveUserId) return;
    setIsDeleting(true);
    try {
      const docRef = doc(
        db,
        "Users",
        effectiveUserId,
        "record_otherExpenses",
        deleteTarget.id
      );

      await updateDoc(docRef, {
        active: false,
        updatedAt: new Date().toISOString(),
      });

      toast.success("Expense record deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting other expense:", error);
      toast.error("Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records available to export");
      return;
    }

    try {
      const exportData = filteredRecords.map((r, index) => ({
        "S.No": index + 1,
        Date: formatDateSafe(r.date),
        "Service / Expense": r.serviceName,
        Type: r.type === "Credit" ? "Credit (Cash In)" : "Debit (Cash Out)",
        "Amount ($)": Number(r.amount).toFixed(2),
        Description: r.description || "-",
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Other Expenses");
      writeFile(
        wb,
        `other_expenses_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/records"
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-150 flex items-center justify-center shadow-xs"
                title="Back to Records"
              >
                <FaArrowLeft className="text-sm" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Other Expenses
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                    Cash In / Cash Out
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record and manage additional inflows and outflows not tied to
                  regular service invoices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportExcel}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FaFileExcel className="text-sm" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                <FaPlus className="text-xs" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Credit (Cash In) */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Credit (Cash In)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shadow-xs">
                <FaArrowDown className="text-sm transform rotate-45" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                {formatCurrency(totalCredit)}
              </p>
              <p className="text-[11px] text-emerald-700/90 font-medium mt-1">
                Income, reimbursements & incoming cash
              </p>
            </div>
          </div>

          {/* Total Debit (Cash Out) */}
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Total Debit (Cash Out)
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100/90 text-rose-700 flex items-center justify-center shadow-xs">
                <FaArrowUp className="text-sm transform rotate-45" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                {formatCurrency(totalDebit)}
              </p>
              <p className="text-[11px] text-rose-700/90 font-medium mt-1">
                Purchases, expenses & outgoing cash
              </p>
            </div>
          </div>

          {/* Net Balance */}
          <div
            className={`border rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm ${
              netBalance >= 0
                ? "bg-white border-emerald-200/90"
                : "bg-white border-rose-200/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  netBalance >= 0 ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Net Balance
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                  netBalance >= 0
                    ? "bg-emerald-100/80 text-emerald-700"
                    : "bg-rose-100/80 text-rose-700"
                }`}
              >
                <FaWallet className="text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(netBalance)}
              </p>
              <p
                className={`text-[11px] font-medium mt-1 ${
                  netBalance >= 0 ? "text-emerald-600/90" : "text-rose-600/90"
                }`}
              >
                {netBalance >= 0
                  ? "Net Cash Positive (Total Credit − Debit)"
                  : "Net Cash Deficit (Total Credit − Debit)"}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Type Filter Buttons */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto self-start">
              {(["All", "Credit", "Debit"] as const).map((tab) => {
                const isActive = typeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setTypeFilter(tab)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? tab === "Credit"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : tab === "Debit"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-gray-900 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab === "All"
                      ? "All Types"
                      : tab === "Credit"
                        ? "Credit (Cash In)"
                        : "Debit (Cash Out)"}
                  </button>
                );
              })}
            </div>

            {/* Right Side: Search & Date Range */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search expense or notes..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                <FaCalendarAlt className="text-gray-400 text-xs ml-1" />
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  placeholderText="Start Date"
                  dateFormat="MM-dd-yyyy"
                  className="w-24 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400 py-1"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                <span className="text-gray-400 text-xs">-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  placeholderText="End Date"
                  dateFormat="MM-dd-yyyy"
                  className="w-24 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400 py-1"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Clear date filter"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {isLoadingRecords ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#F96176] border-t-transparent mb-3"></div>
              <p className="text-sm font-medium text-gray-500">
                Loading other expenses...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                <FaMoneyBillWave className="text-2xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                {searchQuery || typeFilter !== "All" || startDate || endDate
                  ? "No matching expenses found"
                  : "No other expenses recorded yet"}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                {searchQuery || typeFilter !== "All" || startDate || endDate
                  ? "Try adjusting your search query, filter type, or date range."
                  : "Record cash inflows (Credit) and cash outflows (Debit) to keep your financials organized."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <FaPlus className="text-xs" />
                <span>Add Other Expense</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Service / Expense</th>
                    <th className="py-3.5 px-4 sm:px-6">Type</th>
                    <th className="py-3.5 px-4 sm:px-6">Amount</th>
                    <th className="py-3.5 px-4 sm:px-6">Description / Notes</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredRecords.map((record) => {
                    const isCredit = record.type === "Credit";
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Date */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span>{formatDateSafe(record.date)}</span>
                          </div>
                        </td>

                        {/* Service / Expense Name */}
                        <td className="py-4 px-4 sm:px-6 font-semibold text-gray-900">
                          <div>
                            <span>{record.serviceName}</span>
                            {record.isCustomService && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                Custom
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          {isCredit ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Credit (Cash In)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Debit (Cash Out)
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span
                            className={`font-black text-base ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatCurrency(record.amount)}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 sm:px-6 max-w-xs text-xs text-gray-500 truncate">
                          {record.description || (
                            <span className="text-gray-300 italic">
                              No notes
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(record)}
                              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(record)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal Component */}
      <AddOtherExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        effectiveUserId={effectiveUserId}
        editingRecord={editingRecord}
        preloadedServices={servicesList}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete Expense Record?
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Are you sure you want to delete this{" "}
              <strong className="text-gray-800">
                {deleteTarget.serviceName}
              </strong>{" "}
              record ({formatCurrency(deleteTarget.amount)})? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
