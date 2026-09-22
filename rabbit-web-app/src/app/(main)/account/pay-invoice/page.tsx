"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp,
  FieldValue,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiList,
  FiSearch,
  FiTruck,
  FiAlertCircle,
  FiArrowRight,
  FiCreditCard,
  FiLayers,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { FaCheck, FaMoneyBillWave, FaUniversity, FaReceipt } from "react-icons/fa";
import { SiZelle } from "react-icons/si";

export interface ServiceRecordPayment {
  paymentId: string;
  paymentMethod: string;
  amountPaid: number;
  transactionId?: string;
  description?: string;
  checkNumber?: string;
  checkId?: string;
  paidAt: string;
  paidBy: string;
  paidByName?: string;
}

export interface InvoiceRecord {
  id: string;
  userId: string;
  vehicleId: string;
  invoice?: string;
  invoiceAmount?: string | number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: "Unpaid" | "Partially Paid" | "Paid";
  paymentHistory?: ServiceRecordPayment[];
  workshopName?: string;
  date?: string;
  createdAt?: string;
  description?: string;
  vehicleDetails?: {
    vehicleNumber?: string;
    companyName?: string;
    vehicleType?: string;
  };
  services?: Array<{
    serviceName?: string;
    sName?: string;
    subServices?: Array<{ name?: string; id?: string }>;
  }>;
}

export interface PaymentLedgerItem {
  id: string;
  paymentId: string;
  ownerId: string;
  vendorName: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  checkNumber?: string;
  checkId?: string;
  invoices: Array<{
    recordId: string;
    invoiceNumber: string;
    vehicleNumber: string;
    amountPaid: number;
    remainingBalance: number;
  }>;
  createdAt: Timestamp | Date | FieldValue | null | { toDate?: () => Date };
  createdBy: string;
  createdByName?: string;
}

type TabType = "unpaid" | "paid" | "history";
type PaymentMethodType =
  | "Credit Card"
  | "Debit Card"
  | "Check"
  | "Bank Transfer"
  | "Cash"
  | "Zelle"
  | "Other";

function PayInvoiceContent() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRecordId = searchParams.get("recordId");

  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLedgerItem[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<TabType>("unpaid");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected Invoices for Payment: Record ID -> Custom Payment Amount
  const [selectedInvoices, setSelectedInvoices] = useState<{ [recordId: string]: number }>({});
  
  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("Check");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentDescription, setPaymentDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<PaymentLedgerItem | null>(null);

  // 1. Authenticate and resolve effectiveUserId (Owner vs Team Member)
  useEffect(() => {
    if (!user) {
      setIsAuthLoading(false);
      return;
    }

    const userDocRef = doc(db, "Users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setCurrentUserName(userData.userName || userData.name || "User");

          if (
            ["SubOwner", "Manager", "Accountant", "Driver"].includes(userData.role) &&
            userData.createdBy
          ) {
            setEffectiveUserId(userData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
        setIsAuthLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch DataServices records
  useEffect(() => {
    if (!effectiveUserId) return;

    setIsLoadingRecords(true);
    const dataServicesRef = collection(db, "Users", effectiveUserId, "DataServices");
    
    const unsubscribe = onSnapshot(
      dataServicesRef,
      (snapshot) => {
        const items: InvoiceRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawAmount = parseFloat(String(data.invoiceAmount || "0").replace(/[^0-9.-]+/g, "")) || 0;
          
          // Only process records that represent a valid invoice with an amount > 0
          if (rawAmount > 0) {
            const paid = typeof data.paidAmount === "number" ? data.paidAmount : 0;
            const balance = typeof data.balanceAmount === "number" ? data.balanceAmount : Math.max(0, rawAmount - paid);
            
            let status: "Unpaid" | "Partially Paid" | "Paid" = "Unpaid";
            if (data.paymentStatus) {
              status = data.paymentStatus;
            } else if (paid >= rawAmount) {
              status = "Paid";
            } else if (paid > 0) {
              status = "Partially Paid";
            }

            items.push({
              id: docSnap.id,
              userId: data.userId || effectiveUserId,
              vehicleId: data.vehicleId || "",
              invoice: data.invoice || "N/A",
              invoiceAmount: rawAmount,
              paidAmount: paid,
              balanceAmount: balance,
              paymentStatus: status,
              paymentHistory: data.paymentHistory || [],
              workshopName: data.workshopName || "Unspecified Vendor",
              date: data.date || data.createdAt || "",
              createdAt: data.createdAt || "",
              description: data.description || "",
              vehicleDetails: data.vehicleDetails || {},
              services: data.services || [],
            });
          }
        });

        // Sort by date descending
        items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setRecords(items);
        setIsLoadingRecords(false);

        // Pre-select record if navigated with ?recordId=...
        if (preselectedRecordId && !selectedInvoices[preselectedRecordId]) {
          const target = items.find((r) => r.id === preselectedRecordId);
          if (target && target.paymentStatus !== "Paid" && (target.balanceAmount || 0) > 0) {
            setSelectedInvoices({ [target.id]: target.balanceAmount || 0 });
          }
        }
      },
      (error) => {
        console.error("Error fetching invoice records:", error);
        toast.error("Failed to load invoice records");
        setIsLoadingRecords(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveUserId, preselectedRecordId]);

  // 3. Fetch Master Payment History Ledger
  useEffect(() => {
    if (!effectiveUserId || activeTab !== "history") return;

    setIsLoadingHistory(true);
    const historyRef = collection(db, "Users", effectiveUserId, "InvoicePayments");
    const q = query(historyRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const historyList: PaymentLedgerItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          historyList.push({
            id: docSnap.id,
            paymentId: d.paymentId || docSnap.id,
            ownerId: d.ownerId || effectiveUserId,
            vendorName: d.vendorName || "Unknown Vendor",
            totalAmount: d.totalAmount || 0,
            paymentMethod: d.paymentMethod || "Other",
            transactionId: d.transactionId,
            description: d.description,
            checkNumber: d.checkNumber,
            checkId: d.checkId,
            invoices: d.invoices || [],
            createdAt: d.createdAt,
            createdBy: d.createdBy || "",
            createdByName: d.createdByName || "Team Member",
          });
        });
        setPaymentHistory(historyList);
        setIsLoadingHistory(false);
      },
      (error) => {
        console.error("Error fetching payment history:", error);
        setIsLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveUserId, activeTab]);

  // Unique list of Vendors for dropdown filter
  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.workshopName && r.workshopName.trim()) {
        set.add(r.workshopName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  // KPIs
  const kpis = useMemo(() => {
    let totalOutstanding = 0;
    let partialCount = 0;
    let paidCount = 0;
    let totalPaidSum = 0;

    records.forEach((r) => {
      const balance = r.balanceAmount ?? (Number(r.invoiceAmount) - (r.paidAmount || 0));
      const paid = r.paidAmount || 0;
      totalPaidSum += paid;

      if (r.paymentStatus === "Paid" || balance <= 0) {
        paidCount++;
      } else {
        totalOutstanding += balance;
        if (r.paymentStatus === "Partially Paid" || (paid > 0 && balance > 0)) {
          partialCount++;
        }
      }
    });

    return { totalOutstanding, partialCount, paidCount, totalPaidSum };
  }, [records]);

  // Filtered Invoices according to tab, vendor, and search
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Tab filter
        if (activeTab === "unpaid") {
          if (rec.paymentStatus === "Paid" || (rec.balanceAmount || 0) <= 0) return false;
        } else if (activeTab === "paid") {
          if (rec.paymentStatus !== "Paid" && (rec.balanceAmount || 0) > 0) return false;
        }

        // Vendor filter
        if (selectedVendorFilter !== "All" && rec.workshopName !== selectedVendorFilter) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const invMatch = (rec.invoice || "").toLowerCase().includes(q);
          const vendorMatch = (rec.workshopName || "").toLowerCase().includes(q);
          const vehMatch = (rec.vehicleDetails?.vehicleNumber || "").toLowerCase().includes(q);
          const compMatch = (rec.vehicleDetails?.companyName || "").toLowerCase().includes(q);
          const descMatch = (rec.description || "").toLowerCase().includes(q);
          if (!invMatch && !vendorMatch && !vehMatch && !compMatch && !descMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const getTimeSafe = (r: InvoiceRecord): number => {
          if (r.date) {
            const t = new Date(r.date).getTime();
            if (!isNaN(t)) return t;
          }
          if (r.createdAt) {
            const t = new Date(r.createdAt).getTime();
            if (!isNaN(t)) return t;
          }
          return 0;
        };

        const timeA = getTimeSafe(a);
        const timeB = getTimeSafe(b);

        // For unpaid invoices: Oldest (top) to Newest (bottom)
        if (activeTab === "unpaid") {
          return timeA - timeB;
        }

        // For paid invoices: Newest (top) to Oldest (bottom)
        return timeB - timeA;
      });
  }, [records, activeTab, selectedVendorFilter, searchQuery]);

  // Calculate Active Selection Totals and Target Vendor
  const selectedRecordsList = useMemo(() => {
    return records.filter((r) => selectedInvoices.hasOwnProperty(r.id));
  }, [records, selectedInvoices]);

  const selectedVendor = useMemo(() => {
    if (selectedRecordsList.length === 0) return null;
    const vendorSet = new Set(selectedRecordsList.map((r) => r.workshopName || "Unspecified Vendor"));
    if (vendorSet.size === 1) {
      return Array.from(vendorSet)[0];
    }
    return `Multiple Vendors (${vendorSet.size})`;
  }, [selectedRecordsList]);

  const totalPaymentAmount = useMemo(() => {
    return Object.values(selectedInvoices).reduce((sum, val) => sum + (val || 0), 0);
  }, [selectedInvoices]);

  // Toggle invoice selection
  const handleToggleInvoice = (rec: InvoiceRecord) => {
    if (selectedInvoices.hasOwnProperty(rec.id)) {
      const next = { ...selectedInvoices };
      delete next[rec.id];
      setSelectedInvoices(next);
      return;
    }

    const defaultAmount = rec.balanceAmount || Number(rec.invoiceAmount) || 0;
    setSelectedInvoices({
      ...selectedInvoices,
      [rec.id]: defaultAmount,
    });
  };

  // Update payment amount for a specific selected invoice (Partial Payment)
  const handleUpdatePaymentAmount = (recordId: string, value: string, maxBalance: number) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      setSelectedInvoices((prev) => ({ ...prev, [recordId]: 0 }));
      return;
    }
    if (parsed > maxBalance) {
      toast.error(`Amount cannot exceed the remaining balance of $${maxBalance.toFixed(2)}`);
      setSelectedInvoices((prev) => ({ ...prev, [recordId]: maxBalance }));
      return;
    }
    setSelectedInvoices((prev) => ({ ...prev, [recordId]: parsed }));
  };

  // Select all visible unpaid invoices (across all filtered records)
  const handleSelectAllVisible = () => {
    if (filteredRecords.length === 0) return;
    
    // Select all matching unpaid invoices with positive balance
    const matchingRecords = filteredRecords.filter((r) => (r.balanceAmount || 0) > 0);

    const next: { [id: string]: number } = {};
    matchingRecords.forEach((r) => {
      next[r.id] = r.balanceAmount || Number(r.invoiceAmount) || 0;
    });

    setSelectedInvoices(next);
    toast.success(`Selected ${matchingRecords.length} invoices`);
  };

  const handleClearSelection = () => {
    setSelectedInvoices({});
  };

  // Handle Redirect to Write Check screen with pre-filled documents
  const handleRedirectToWriteCheck = () => {
    if (selectedRecordsList.length === 0) {
      toast.error("Please select at least one invoice to write a check");
      return;
    }

    const payee = selectedVendor || "Vendor";
    const invoiceItems = selectedRecordsList.map((r) => ({
      recordId: r.id,
      invoiceNumber: r.invoice || "N/A",
      vehicleNumber: r.vehicleDetails?.vehicleNumber || "",
      amount: selectedInvoices[r.id] || r.balanceAmount || 0,
      description: `Inv #${r.invoice || "N/A"} (${r.vehicleDetails?.vehicleNumber || "Vehicle"})`,
    }));

    // Encode payload safely in URL query
    const encodedPayload = encodeURIComponent(JSON.stringify(invoiceItems));
    const targetUrl = `/account/manage-check?action=writeCheck&payee=${encodeURIComponent(
      payee
    )}&totalAmount=${totalPaymentAmount}&invoices=${encodedPayload}`;

    router.push(targetUrl);
  };

  // Process and record standard Payment (Credit Card, Debit Card, Bank Transfer, Cash, Zelle, Other)
  const handleProcessPayment = async () => {
    if (selectedRecordsList.length === 0) {
      toast.error("Please select at least one invoice to pay");
      return;
    }

    if (totalPaymentAmount <= 0) {
      toast.error("Total payment amount must be greater than $0.00");
      return;
    }

    if (paymentMethod === "Other" && !paymentDescription.trim()) {
      toast.error("Please enter a description for the 'Other' payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();

      // 1. Fetch team members to sync with
      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", effectiveUserId),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnapshot = await getDocs(teamMembersQuery);
      const memberIds = teamMembersSnapshot.docs.map((docSnap) => docSnap.id);

      const invoiceLedgerDetails: Array<{
        recordId: string;
        invoiceNumber: string;
        vehicleNumber: string;
        amountPaid: number;
        remainingBalance: number;
      }> = [];

      // 2. Iterate through each selected invoice and prepare atomic batch updates
      for (const rec of selectedRecordsList) {
        const payAmount = selectedInvoices[rec.id] || 0;
        if (payAmount <= 0) continue;

        const currentPaid = rec.paidAmount || 0;
        const totalInvoice = Number(rec.invoiceAmount) || 0;
        const newPaid = Number((currentPaid + payAmount).toFixed(2));
        const newBalance = Number(Math.max(0, totalInvoice - newPaid).toFixed(2));
        const newStatus: "Paid" | "Partially Paid" | "Unpaid" =
          newBalance <= 0 ? "Paid" : "Partially Paid";

        const paymentEntry: ServiceRecordPayment = {
          paymentId: paymentId,
          paymentMethod: paymentMethod,
          amountPaid: payAmount,
          ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {}),
          ...(paymentDescription.trim() ? { description: paymentDescription.trim() } : {}),
          paidAt: nowIso,
          paidBy: user?.uid || effectiveUserId,
          paidByName: currentUserName || "User",
        };

        const existingHistory = Array.isArray(rec.paymentHistory) ? rec.paymentHistory : [];
        const updatedHistory = [...existingHistory, paymentEntry];

        const updatePayload = {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          paymentStatus: newStatus,
          paymentHistory: updatedHistory,
          updatedAt: nowIso,
        };

        // A. Owner Record
        const ownerRecordRef = doc(db, "Users", effectiveUserId, "DataServices", rec.id);
        batch.set(ownerRecordRef, updatePayload, { merge: true });

        // B. Global Record
        const globalRecordRef = doc(db, "DataServicesRecords", rec.id);
        batch.set(globalRecordRef, updatePayload, { merge: true });

        // C. Team Members Records
        for (const memberId of memberIds) {
          const memberRecordRef = doc(db, "Users", memberId, "DataServices", rec.id);
          batch.set(memberRecordRef, updatePayload, { merge: true });
        }

        invoiceLedgerDetails.push({
          recordId: rec.id,
          invoiceNumber: rec.invoice || "N/A",
          vehicleNumber: rec.vehicleDetails?.vehicleNumber || "N/A",
          amountPaid: payAmount,
          remainingBalance: newBalance,
        });
      }

      // 3. Create Master Payment Ledger entry
      const ledgerDocRef = doc(collection(db, "Users", effectiveUserId, "InvoicePayments"));
      const ledgerData: PaymentLedgerItem = {
        id: ledgerDocRef.id,
        paymentId: paymentId,
        ownerId: effectiveUserId,
        vendorName: selectedVendor || "Vendor",
        totalAmount: totalPaymentAmount,
        paymentMethod: paymentMethod,
        ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {}),
        ...(paymentDescription.trim() ? { description: paymentDescription.trim() } : {}),
        invoices: invoiceLedgerDetails,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || effectiveUserId,
        createdByName: currentUserName || "User",
      };

      batch.set(ledgerDocRef, ledgerData);

      // 4. Commit all updates atomically
      await batch.commit();

      toast.success(`Payment of $${totalPaymentAmount.toFixed(2)} recorded successfully!`);
      
      // Reset form & selections
      setSelectedInvoices({});
      setTransactionId("");
      setPaymentDescription("");
      setShowConfirmModal(false);
    } catch (error: unknown) {
      console.error("Error processing payment:", error);
      const errMsg =
        error instanceof Error ? error.message : "Failed to process payment. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F96176]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1720px] w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#F96176]/10 rounded-xl text-[#F96176]">
                <FaReceipt className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pay Invoices</h1>
                <p className="text-sm text-gray-500">
                  Manage vendor repair invoices, issue partial or full payments, and write checks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account/manage-check"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm shadow-sm"
            >
              <FiCheckCircle className="text-emerald-500" />
              Manage Checks
            </Link>
            <Link
              href="/records"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all text-sm shadow-sm"
            >
              <FiList />
              View All Records
            </Link>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Outstanding
              </p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                ${kpis.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Across all unpaid invoices</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
              <FiDollarSign className="text-xl" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Partially Paid
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{kpis.partialCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Invoices with partial payments</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
              <FiClock className="text-xl" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fully Paid Invoices
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{kpis.paidCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Settled in full</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
              <FiCheckCircle className="text-xl" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Settled Amount
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ${kpis.totalPaidSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Recorded to date</p>
            </div>
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
              <FiLayers className="text-xl" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-2xl">
          <button
            onClick={() => {
              setActiveTab("unpaid");
              setSelectedInvoices({});
            }}
            className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "unpaid"
                ? "border-[#F96176] text-[#F96176]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiFileText />
            Unpaid Invoices
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "unpaid" ? "bg-[#F96176]/10 text-[#F96176]" : "bg-gray-100 text-gray-600"
              }`}
            >
              {records.filter((r) => r.paymentStatus !== "Paid" && (r.balanceAmount || 0) > 0).length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("paid");
              setSelectedInvoices({});
            }}
            className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "paid"
                ? "border-[#F96176] text-[#F96176]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiCheckCircle />
            Paid Invoices
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "paid" ? "bg-[#F96176]/10 text-[#F96176]" : "bg-gray-100 text-gray-600"
              }`}
            >
              {records.filter((r) => r.paymentStatus === "Paid" || (r.balanceAmount || 0) <= 0).length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedInvoices({});
            }}
            className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "history"
                ? "border-[#F96176] text-[#F96176]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiClock />
            Payment History Ledger
          </button>
        </div>

        {/* Main Tab Content */}
        {activeTab === "history" ? (
          /* Payment History Ledger Tab */
          <div className="bg-white rounded-b-2xl rounded-tr-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Audit Trail</h3>
                <p className="text-sm text-gray-500">
                  Comprehensive ledger of all invoice settlements, check disbursements, and receipts.
                </p>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F96176]"></div>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="py-16 text-center text-gray-500 space-y-2">
                <FiClock className="mx-auto text-4xl text-gray-300" />
                <p className="text-base font-medium">No payment history recorded yet</p>
                <p className="text-xs text-gray-400">Payments made against invoices will appear in this ledger.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs border-y border-gray-200">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Payment ID</th>
                      <th className="py-3.5 px-4">Vendor / Payee</th>
                      <th className="py-3.5 px-4">Method & Ref</th>
                      <th className="py-3.5 px-4">Invoices Settled</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentHistory.map((item) => {
                      const dateDisplay =
                        item.createdAt &&
                        typeof item.createdAt === "object" &&
                        "toDate" in item.createdAt &&
                        typeof (item.createdAt as { toDate?: () => Date }).toDate === "function"
                          ? (item.createdAt as { toDate: () => Date })
                              .toDate()
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                          : item.createdAt instanceof Date
                          ? item.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recent";

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-900 font-medium">
                            {dateDisplay}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {item.paymentId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800">
                            {item.vendorName}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{item.paymentMethod}</span>
                              {item.checkNumber && (
                                <span className="text-xs text-blue-600 font-mono">
                                  Check #{item.checkNumber}
                                </span>
                              )}
                              {item.transactionId && (
                                <span className="text-xs text-gray-400 font-mono">
                                  Txn: {item.transactionId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {item.invoices?.map((inv, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                                >
                                  Inv #{inv.invoiceNumber} (${inv.amountPaid.toFixed(2)})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-base">
                            ${item.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setViewingReceipt(item)}
                              className="text-xs text-[#F96176] hover:underline font-semibold"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Unpaid & Paid Invoices Split-View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Filters and Invoices List (Expanded width for comfortable viewing) */}
            <div
              className={`${
                activeTab === "unpaid"
                  ? "lg:col-span-8 xl:col-span-8 2xl:col-span-9"
                  : "lg:col-span-12"
              } space-y-4`}
            >
              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search invoice #, vehicle, vendor..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FiFilter className="text-gray-400 text-sm hidden sm:block" />
                    <select
                      value={selectedVendorFilter}
                      onChange={(e) => setSelectedVendorFilter(e.target.value)}
                      className="w-full sm:w-56 py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white font-medium text-gray-700"
                    >
                      <option value="All">All Vendors ({uniqueVendors.length})</option>
                      {uniqueVendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === "unpaid" && (
                    <button
                      onClick={handleSelectAllVisible}
                      title="Select all visible for active vendor"
                      className="whitespace-nowrap px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                      Select All
                    </button>
                  )}
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoadingRecords ? (
                  <div className="py-16 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F96176]"></div>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 space-y-2">
                    <FiFileText className="mx-auto text-4xl text-gray-300" />
                    <p className="text-base font-medium">No invoices match your criteria</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or vendor filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs border-b border-gray-200">
                        <tr>
                          {activeTab === "unpaid" && <th className="py-3 px-4 w-10">Select</th>}
                          <th className="py-3 px-4">Invoice & Date</th>
                          <th className="py-3 px-4">Vendor</th>
                          <th className="py-3 px-4">Vehicle</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4 text-right">Remaining</th>
                          {activeTab === "unpaid" && (
                            <th className="py-3 px-4 text-center w-36">Pay Amount</th>
                          )}
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRecords.map((rec) => {
                          const isSelected = selectedInvoices.hasOwnProperty(rec.id);
                          const totalAmt = Number(rec.invoiceAmount) || 0;
                          const paidAmt = rec.paidAmount || 0;
                          const balance = rec.balanceAmount ?? Math.max(0, totalAmt - paidAmt);
                          const customPayAmount = selectedInvoices[rec.id] ?? balance;

                          return (
                            <tr
                              key={rec.id}
                              className={`transition-colors ${
                                isSelected ? "bg-rose-50/40" : "hover:bg-gray-50/80"
                              }`}
                            >
                              {activeTab === "unpaid" && (
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleInvoice(rec)}
                                    className="w-4 h-4 text-[#F96176] rounded border-gray-300 focus:ring-[#F96176] cursor-pointer"
                                  />
                                </td>
                              )}

                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 font-mono">
                                    #{rec.invoice || "N/A"}
                                  </span>
                                  <span className="text-xs text-gray-400">{rec.date || "No Date"}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-medium text-gray-800">
                                {rec.workshopName || "Unspecified"}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 text-gray-700">
                                  <FiTruck className="text-gray-400 text-xs" />
                                  <span className="font-semibold text-xs">
                                    {rec.vehicleDetails?.vehicleNumber || "N/A"}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                                ${totalAmt.toFixed(2)}
                              </td>

                              <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                                ${balance.toFixed(2)}
                              </td>

                              {activeTab === "unpaid" && (
                                <td className="py-3.5 px-4 text-center">
                                  {isSelected ? (
                                    <div className="relative inline-block w-28">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                        $
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={balance}
                                        value={customPayAmount}
                                        onChange={(e) =>
                                          handleUpdatePaymentAmount(rec.id, e.target.value, balance)
                                        }
                                        className="w-full pl-6 pr-2 py-1 text-xs font-bold text-right border border-[#F96176] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F96176] bg-white"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Select to pay</span>
                                  )}
                                </td>
                              )}

                              <td className="py-3.5 px-4 text-center">
                                {rec.paymentStatus === "Paid" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    <FiCheckCircle className="text-xs" /> Paid
                                  </span>
                                ) : rec.paymentStatus === "Partially Paid" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                    <FiClock className="text-xs" /> Partial (${paidAmt.toFixed(0)} / ${totalAmt.toFixed(0)})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                    <FiAlertCircle className="text-xs" /> Unpaid
                                  </span>
                                )}
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

            {/* RIGHT COLUMN: Payment Execution Drawer (Only shown in Unpaid mode) */}
            {activeTab === "unpaid" && (
              <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#F96176]/10 rounded-lg text-[#F96176]">
                      <FaMoneyBillWave />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Payment Summary</h3>
                      <p className="text-xs text-gray-400">
                        {selectedRecordsList.length} invoice(s) selected
                      </p>
                    </div>
                  </div>
                  {selectedRecordsList.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="text-xs text-gray-400 hover:text-gray-700 underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {selectedRecordsList.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-3">
                    <FiInfo className="mx-auto text-3xl text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">No invoices selected</p>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Select one or multiple invoices from the left table to record a payment or write a check.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Payee Info Banner */}
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold">Vendor / Payee</p>
                        <p className="text-sm font-bold text-gray-900">{selectedVendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-semibold">Invoices</p>
                        <p className="text-sm font-bold text-gray-900">{selectedRecordsList.length}</p>
                      </div>
                    </div>

                    {/* Selected Invoices Allocation Breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Allocation Breakdown
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {selectedRecordsList.map((rec) => {
                          const pay = selectedInvoices[rec.id] || 0;
                          const balance = rec.balanceAmount || Number(rec.invoiceAmount) || 0;
                          const isPartial = pay < balance;

                          return (
                            <div
                              key={rec.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">
                                  Inv #{rec.invoice || "N/A"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  Veh: {rec.vehicleDetails?.vehicleNumber || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isPartial && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                    Partial
                                  </span>
                                )}
                                <span className="font-bold text-gray-900">${pay.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Select Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          // { id: "Zelle", label: "Zelle", icon: SiZelle },
                          // { id: "Credit Card", label: "Credit Card", icon: FiCreditCard },
                          // { id: "Debit Card", label: "Debit Card", icon: FiCreditCard },
                          // { id: "Bank Transfer", label: "Bank Wire", icon: FaUniversity },
                          { id: "Check", label: "Check", icon: FiCheckCircle },
                          // { id: "Cash", label: "Cash", icon: FaMoneyBillWave },
                          { id: "Other", label: "Other", icon: FiLayers },
                        ].map((m) => {
                          const IconComp = m.icon;
                          const isSelected = paymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                isSelected
                                  ? "bg-[#F96176] text-white border-[#F96176] shadow-sm"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <IconComp className="text-sm" />
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional Fields based on Payment Method */}
                    {paymentMethod === "Check" ? (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <FiCheckCircle className="text-emerald-600 text-lg mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-emerald-900">Check Payment Flow</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              Write a check for <b>{selectedVendor}</b> totaling{" "}
                              <b>${totalPaymentAmount.toFixed(2)}</b> across {selectedRecordsList.length}{" "}
                              invoice(s).
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRedirectToWriteCheck}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <FiCheckCircle />
                          Proceed to Write Check
                          <FiArrowRight />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Transaction ID / Confirmation # (Optional for Card, Zelle, Bank, Other) */}
                        {paymentMethod !== "Cash" && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {paymentMethod === "Zelle"
                                ? "Zelle Confirmation / Ref #"
                                : paymentMethod === "Bank Transfer"
                                ? "Wire / Transfer Reference #"
                                : paymentMethod.includes("Card")
                                ? "Authorization / Txn ID (Optional)"
                                : "Reference / Transaction ID (Optional)"}
                            </label>
                            <input
                              type="text"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="e.g. TXN-94820194"
                              className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white"
                            />
                          </div>
                        )}

                        {/* Description (Required for 'Other', Optional for others) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {paymentMethod === "Other" ? (
                              <span className="text-gray-900 font-bold">
                                Description / Method Details <span className="text-rose-500">*</span>
                              </span>
                            ) : (
                              "Memo / Notes (Optional)"
                            )}
                          </label>
                          <textarea
                            rows={2}
                            value={paymentDescription}
                            onChange={(e) => setPaymentDescription(e.target.value)}
                            placeholder={
                              paymentMethod === "Other"
                                ? "Please explain the payment method or settlement terms..."
                                : "Add payment notes or memos..."
                            }
                            className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white resize-none"
                          />
                        </div>

                        {/* Total & Submit Button */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500">Total Payment:</span>
                            <span className="text-2xl font-black text-gray-900">
                              ${totalPaymentAmount.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isSubmitting || totalPaymentAmount <= 0}
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full py-3 px-4 bg-[#F96176] hover:bg-[#e44d62] text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FaCheck />
                            Pay ${totalPaymentAmount.toFixed(2)} Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#F96176]/10 text-[#F96176] rounded-xl">
                <FiDollarSign className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
                <p className="text-xs text-gray-500">Verify payment allocation before recording</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-200/80">
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor:</span>
                <span className="font-bold text-gray-900">{selectedVendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-bold text-gray-900">{paymentMethod}</span>
              </div>
              {transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-800">{transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Invoices Settled:</span>
                <span className="font-semibold text-gray-900">{selectedRecordsList.length}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-base">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="font-extrabold text-emerald-600">
                  ${totalPaymentAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProcessPayment}
                className="flex-1 py-2.5 bg-[#F96176] hover:bg-[#e44d62] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <FiCheckCircle />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payment Receipt</h3>
                  <p className="text-xs text-gray-400">Ref: {viewingReceipt.paymentId}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400">Paid To (Vendor)</p>
                  <p className="font-bold text-gray-900">{viewingReceipt.vendorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Method</p>
                  <p className="font-bold text-gray-900">{viewingReceipt.paymentMethod}</p>
                </div>
                {viewingReceipt.checkNumber && (
                  <div>
                    <p className="text-xs text-gray-400">Check Number</p>
                    <p className="font-mono font-bold text-blue-600">#{viewingReceipt.checkNumber}</p>
                  </div>
                )}
                {viewingReceipt.transactionId && (
                  <div>
                    <p className="text-xs text-gray-400">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-800">{viewingReceipt.transactionId}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Invoices Included
                </p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {viewingReceipt.invoices?.map((inv, i) => (
                    <div key={i} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-900">Invoice #{inv.invoiceNumber}</span>
                        <span className="text-gray-400 ml-2">Veh: {inv.vehicleNumber}</span>
                      </div>
                      <span className="font-bold text-gray-900">${inv.amountPaid.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                <span className="font-bold text-emerald-900">Total Settled</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ${viewingReceipt.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F96176]"></div>
        </div>
      }
    >
      <PayInvoiceContent />
    </Suspense>
  );
}
